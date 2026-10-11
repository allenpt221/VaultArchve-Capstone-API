import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";
import redis from "../lib/ioredis";
import { invalidateCacheByPrefix } from "../lib/cache";
import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import multer from "multer";
import { openai } from "./generativeAI.controller";

const MAX_VISION_PAGES = 8;
const MAX_TEXT_CHARS_FOR_MODEL = 12000;
const MAX_KEYWORDS = 15;

// Must match the exact course values your form/dropdown saves
const COURSES = [
  "Accountancy",
  "Public Administration",
  "Accounting Information System",
  "Entrepreneurship",
] as const;

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype === "application/pdf"
      ? cb(null, true)
      : cb(new Error("Only PDF files are allowed")),
}).single("file");

// ---------------------------------------------------------------------------
// Duplicate title helpers
// ---------------------------------------------------------------------------

// Collapses repeated whitespace so "My  Title " and "My Title" count as the same
const normalizeTitle = (t: string) => t.replace(/\s+/g, " ").trim();

// ilike treats % and _ as wildcards, so escape them for an exact (case-insensitive) match
const escapeLike = (s: string) => s.replace(/[\\%_]/g, "\\$&");

// Returns the existing thesis with the same title (case-insensitive), or null.
// Pass excludeId when updating so a thesis doesn't collide with itself.
const findDuplicateThesis = async (title: string, excludeId?: string) => {
  let query = supabase
    .from("Thesis")
    .select("id, title")
    .ilike("title", escapeLike(normalizeTitle(title)))
    .limit(1);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0] ?? null;
};

// Headings that usually come right after the abstract
const END_MARKERS =
  /\n\s*(keywords?|key\s+words|acknowledg(?:e)?ments?|dedication|table\s+of\s+contents|list\s+of\s+(?:tables|figures)|chapter\s+(?:1|i|one)\b|introduction)\b/i;

const findAbstract = (rawText: string): string | null => {
  const text = rawText.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const headingRegex = /\n\s*abstract\s*:?\s*\n/gi;

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(text)) !== null) {
    const start = match.index + match[0].length;
    const rest = text.slice(start);

    const end = rest.search(END_MARKERS);
    const chunk = (end === -1 ? rest.slice(0, 3500) : rest.slice(0, end)).trim();

    // Skip the table-of-contents entry: it has no real paragraph after it
    if (chunk.length >= 400) {
      return chunk
        .replace(/\n{2,}/g, "\n\n")
        .replace(/(?<![.!?:])\n(?!\n)/g, " ")
        .trim();
    }
  }
  return null;
};

// Normalizes keywords (a string like "a, b; c" or an array) into "a, b, c"
const cleanKeywords = (v: unknown): string | null => {
  const raw: string[] = Array.isArray(v)
    ? v.map((item) => String(item))
    : typeof v === "string"
      ? v.split(/[,;\n•·|]+/)
      : [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of raw) {
    const k = item
      .replace(/^[\s\-–—•·*]+/, "")
      .replace(/[\s.]+$/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (k.length < 2 || k.length > 60) continue;

    const key = k.toLowerCase();
    // The model sometimes writes the word "null" instead of a real null
    if (["null", "none", "n/a", "na", "undefined"].includes(key)) continue;
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(k);
    if (out.length >= MAX_KEYWORDS) break;
  }

  return out.length > 0 ? out.join(", ") : null;
};

// Reads the "Keywords: a, b, c" line that usually sits right under the abstract
const findKeywords = (rawText: string): string | null => {
  const text = rawText.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const headingRegex = /\n\s*key\s*-?\s*words?\s*[:\-–—]?[ \t]*/gi;

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(text)) !== null) {
    const rest = text.slice(match.index + match[0].length);

    // Keywords end at the first blank line (or the next known heading)
    const block = rest.split(/\n\s*\n/)[0];
    const endMarker = block.search(END_MARKERS);
    const chunk = (endMarker === -1 ? block : block.slice(0, endMarker))
      .slice(0, 300)
      .replace(/\n/g, " ")
      .trim();

    // A real keyword list is short and comma/semicolon separated
    if (chunk.length < 3) continue;
    if (!/[,;]/.test(chunk) && chunk.length > 80) continue;

    const cleaned = cleanKeywords(chunk);
    if (cleaned) return cleaned;
  }
  return null;
};

type Want = {
  title: boolean;
  author: boolean;
  course: boolean;
  issueDate: boolean;
  abstract: boolean;
  keywords: boolean;
};

type ThesisInfo = {
  title: string | null;
  author: string | null;
  course: string | null;
  issue_date: string | null;
  abstract: string | null;
  keywords: string | null;
  // "printed" = copied from the paper's own keywords list, "generated" = derived from its content
  keywords_source: "printed" | "generated" | null;
  source: "abstract" | "introduction" | null;
};

type ThesisInfoResult = ThesisInfo & {
  error?: { status: number; message: string };
};

const emptyInfo = (): ThesisInfo => ({
  title: null,
  author: null,
  course: null,
  issue_date: null,
  abstract: null,
  keywords: null,
  keywords_source: null,
  source: null,
});

const cleanString = (v: unknown, min: number, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length >= min ? s.slice(0, max) : null;
};

const cleanCourse = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  return COURSES.find((c) => c.toLowerCase() === v.trim().toLowerCase()) ?? null;
};

// Keeps the date as a plain YYYY-MM-DD string (no Date objects, so no timezone shifts)
const cleanIssueDate = (v: unknown): string | null => {
  if (typeof v !== "string") return null;
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const maxYear = new Date().getFullYear() + 1;

  if (year < 1990 || year > maxYear) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return v.trim();
};

// True when the model actually returned at least one field we asked for
const foundAnyWanted = (info: ThesisInfo, want: Want): boolean =>
  (want.title && !!info.title) ||
  (want.author && !!info.author) ||
  (want.course && !!info.course) ||
  (want.issueDate && !!info.issue_date) ||
  (want.abstract && !!info.abstract) ||
  (want.keywords && !!info.keywords);

// One model call that reads whichever fields are still missing.
// Uses the PDF text when pdfText is given, otherwise the page images.
const askModelForThesisInfo = async (
  buffer: Buffer,
  filename: string,
  pdfText: string | null,
  want: Want
): Promise<ThesisInfo> => {
  const lines: string[] = [
    "Read the first pages of a thesis and return JSON shaped exactly as: " +
      '{"title": string | null, "author": string | null, "course": string | null, ' +
      '"issue_date": string | null, "source": "abstract" | "introduction" | null, ' +
      '"abstract": string | null, "keywords": string | null, ' +
      '"keywords_source": "printed" | "generated" | null}. ' +
      "Use null for anything you cannot clearly find. Never guess.",
  ];

  lines.push(
    want.title
      ? "title: the exact title of the study as printed on the title page, without the school name, department, " +
          "degree, or author names."
      : "title: set to null."
  );

  lines.push(
    want.author
      ? "author: every researcher listed on the title page, exactly as printed (keep the 'Last, First M.' " +
          "format), joined with '; '. Do not include advisers, panel members, or the dean."
      : "author: set to null."
  );

  lines.push(
    want.course
      ? `course: the degree program on the title page, as exactly one of: ${COURSES.map((c) => `"${c}"`).join(", ")}. ` +
          'For example "Bachelor of Science in Entrepreneurship" becomes "Entrepreneurship". Use null if none match.'
      : "course: set to null."
  );

  lines.push(
    want.issueDate
      ? "issue_date: the date the thesis was submitted or published, taken from the title page, approval sheet, " +
          "or abstract, formatted as YYYY-MM-DD. If only a month and year are printed, use day 01. If only a year " +
          "is printed, use 01-01. If no date is printed, use null. Never use today's date."
      : "issue_date: set to null."
  );

  lines.push(
    want.abstract
      ? "abstract: find the ABSTRACT section and copy it word for word. If there is no abstract, copy the " +
          "Introduction section under Chapter I instead (only that section, word for word, not the whole " +
          'chapter) and set "source" to "introduction". Do not summarize, rewrite, or add anything. Join ' +
          "hard-wrapped lines into normal paragraphs. If neither section is clearly present, use null for both " +
          "abstract and source."
      : "abstract and source: set both to null."
  );

  lines.push(
    want.keywords
      ? "keywords: if the thesis prints a keywords list (usually after a 'Keywords:' label under the abstract), " +
          "copy it exactly as printed, joined with ', ', without the label, and set \"keywords_source\" to " +
          '"printed". If no keywords list is printed, pick 5 to 8 short keywords (1 to 3 words each) that ' +
          "come from the thesis itself: the main topic, subject, method, and setting named in its title and " +
          'abstract. Use only terms that actually appear in the paper, joined with \', \', and set "keywords_source" ' +
          'to "generated". This also applies when the paper has no abstract and you copied the Introduction ' +
          "instead: base the keywords on that text and the title. You must return keywords for any thesis with " +
          'readable content. Use a real JSON null (never the text "null") only if the pages are unreadable.'
      : "keywords and keywords_source: set both to null."
  );

  const instructions = lines.join("\n");
  let content: any[];

  if (pdfText) {
    content = [
      {
        type: "input_text",
        text: `${instructions}\n\nTHESIS TEXT:\n${pdfText.slice(0, MAX_TEXT_CHARS_FOR_MODEL)}`,
      },
    ];
  } else {
    const original = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = Math.min(original.getPageCount(), MAX_VISION_PAGES);

    const trimmed = await PDFDocument.create();
    const pages = await trimmed.copyPages(
      original,
      Array.from({ length: pageCount }, (_, i) => i)
    );
    pages.forEach((p) => trimmed.addPage(p));
    const base64 = Buffer.from(await trimmed.save()).toString("base64");

    content = [
      {
        type: "input_file",
        filename: filename || "thesis.pdf",
        file_data: `data:application/pdf;base64,${base64}`,
      },
      { type: "input_text", text: `These pages are from a scanned thesis.\n${instructions}` },
    ];
  }

  const response = await openai.responses.create({
    model: "gpt-5.4-mini",
    reasoning: { effort: "none" },
    text: { format: { type: "json_object" } },
    input: [{ role: "user", content }],
  });

  console.log(
    `[extract] model mode: ${pdfText ? "text" : "images"} | raw output:`,
    response.output_text
  );

  const parsed = JSON.parse(response.output_text || "{}");

  const abstractText = typeof parsed.abstract === "string" ? parsed.abstract.trim() : "";
  const abstract = abstractText.length >= 100 ? abstractText : null;

  const keywords = want.keywords ? cleanKeywords(parsed.keywords) : null;

  return {
    title: want.title ? cleanString(parsed.title, 3, 300) : null,
    author: want.author ? cleanString(parsed.author, 3, 500) : null,
    course: want.course ? cleanCourse(parsed.course) : null,
    issue_date: want.issueDate ? cleanIssueDate(parsed.issue_date) : null,
    abstract,
    keywords,
    keywords_source: keywords
      ? parsed.keywords_source === "printed"
        ? "printed"
        : "generated"
      : null,
    source: abstract ? (parsed.source === "introduction" ? "introduction" : "abstract") : null,
  };
};

// Shared by the prefill endpoint and thesis submission.
// The abstract and keywords are read for free from the text layer when possible;
// the model is only called for what is still missing.
const readThesisInfoFromPdf = async (
  file: Express.Multer.File,
  need: Want
): Promise<ThesisInfoResult> => {
  const info = emptyInfo();

  let text = "";
  const parser = new PDFParse({ data: file.buffer });
  try {
    const result = await parser.getText({ first: 15 });
    // pdf-parse 2.x adds "-- 1 of 14 --" page markers, which would make a
    // scanned PDF look like it has text, so strip them before measuring
    text = (result.text || "").replace(/--\s*\d+\s*of\s*\d+\s*--/g, "");
  } catch (error) {
    console.error("PDF text extraction error:", error);
    text = ""; // unreadable text layer: fall through to the page images
  } finally {
    await parser.destroy();
  }

  const hasText = text.trim().length >= 200;
  console.log(`[extract] text layer length: ${text.trim().length} | hasText: ${hasText}`);

  // Free path: abstract and keywords straight from the text layer
  if (hasText && need.abstract) {
    const found = findAbstract(text);
    if (found) {
      info.abstract = found;
      info.source = "abstract";
    }
  }

  if (hasText && need.keywords) {
    const foundKeywords = findKeywords(text);
    if (foundKeywords) {
      info.keywords = foundKeywords;
      info.keywords_source = "printed";
    }
  }

  const still: Want = {
    title: need.title,
    author: need.author,
    course: need.course,
    issueDate: need.issueDate,
    abstract: need.abstract && !info.abstract,
    keywords: need.keywords && !info.keywords,
  };

  if (!Object.values(still).some(Boolean)) return info;

  try {
    let extracted = await askModelForThesisInfo(
      file.buffer,
      file.originalname,
      hasText ? text : null,
      still
    );

    // Scanner apps (CamScanner etc.) often embed a garbled hidden text layer.
    // If the text-based read found nothing, read the page images instead.
    if (hasText && !foundAnyWanted(extracted, still)) {
      console.log("[extract] text layer gave nothing, retrying with page images");
      extracted = await askModelForThesisInfo(file.buffer, file.originalname, null, still);
    }

    if (still.title) info.title = extracted.title;
    if (still.author) info.author = extracted.author;
    if (still.course) info.course = extracted.course;
    if (still.issueDate) info.issue_date = extracted.issue_date;
    if (still.keywords && extracted.keywords) {
      info.keywords = extracted.keywords;
      info.keywords_source = extracted.keywords_source;
    }
    if (still.abstract && extracted.abstract) {
      info.abstract = extracted.abstract;
      info.source = extracted.source;
    }

    return info;
  } catch (error) {
    console.error("Model extraction error:", error);
    return { ...info, error: { status: 500, message: "Failed to read the PDF" } };
  }
};

export const ExtractThesisAbstract = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    const info = await readThesisInfoFromPdf(req.file, {
      title: true,
      author: true,
      course: true,
      issueDate: true,
      abstract: true,
      keywords: true,
    });

    const foundAnything =
      info.title ||
      info.author ||
      info.course ||
      info.issue_date ||
      info.abstract ||
      info.keywords;

    if (!foundAnything) {
      return res.status(info.error?.status ?? 404).json({
        message:
          info.error?.message ??
          "Couldn't read any details from this PDF. Please type them manually.",
      });
    }

    return res.status(200).json({
      title: info.title,
      author: info.author,
      course: info.course,
      issue_date: info.issue_date,
      abstract: info.abstract,
      keywords: info.keywords,
      keywords_source: info.keywords_source,
      source: info.source,
    });
  } catch (error: any) {
    console.error("ExtractThesisAbstract error:", error);
    return res.status(500).json({ message: "Failed to read the PDF" });
  }
};


export async function SumbitThesis(req: Request, res: Response) {
    try {
        const user_id = req.user?.id;

        const { title, author, course, issueDate, thesis_abstract, keywords } = req.body;

        const files = req.files as Express.Multer.File[];
        const thesis_file = files?.[0];

        // FILE VALIDATION
        if (!thesis_file) {
            return res.status(400).json({ status: false, message: "PDF or DOCX file is required" });
        }

        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(thesis_file.mimetype)) {
            return res.status(400).json({ status: false, message: "Only PDF and DOCX files are allowed" });
        }

        // Anything the form sends wins; whatever is missing is read from the PDF
        const fromForm = (v: unknown): string | undefined =>
            typeof v === "string" && v.trim() ? v.trim() : undefined;

        let finalTitle = fromForm(title);
        let finalAuthor = fromForm(author);
        let finalCourse = fromForm(course);
        let finalIssueDate = fromForm(issueDate);
        let finalAbstract = fromForm(thesis_abstract);
        let finalKeywords: string | null = cleanKeywords(keywords);

        const need: Want = {
            title: !finalTitle,
            author: !finalAuthor,
            course: !finalCourse,
            issueDate: !finalIssueDate,
            abstract: !finalAbstract,
            keywords: !finalKeywords,
        };

        if (
            Object.values(need).some(Boolean) &&
            thesis_file.mimetype === "application/pdf" &&
            user_id
        ) {
            const info = await readThesisInfoFromPdf(thesis_file, need);

            if (need.title && info.title) finalTitle = info.title;
            if (need.author && info.author) finalAuthor = info.author;
            if (need.course && info.course) finalCourse = info.course;
            if (need.issueDate && info.issue_date) finalIssueDate = info.issue_date;
            if (need.abstract && info.abstract) finalAbstract = info.abstract;
            if (need.keywords && info.keywords) finalKeywords = info.keywords;

            if (info.error) console.log("PDF auto-extraction issue:", info.error.message);
        }

        // Everything must be known by now, either from the form or from the PDF.
        // Keywords are optional: not every thesis prints them, so they never block a submission.
        const missing: string[] = [];
        if (!finalTitle) missing.push("title");
        if (!finalAuthor) missing.push("author");
        if (!finalCourse) missing.push("course");
        if (!finalIssueDate) missing.push("issue date");
        if (!finalAbstract) missing.push("abstract");

        if (missing.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Couldn't detect the ${missing.join(", ")} from the file. Please fill in the missing details manually.`,
                missing,
            });
        }

        // DUPLICATE TITLE CHECK
        // Runs after PDF auto-extraction (so it also catches titles read from the file)
        // and before the storage upload (so a rejected duplicate leaves no orphaned file).
        finalTitle = normalizeTitle(finalTitle!);

        const duplicate = await findDuplicateThesis(finalTitle);
        if (duplicate) {
            return res.status(409).json({
                status: false,
                message: `A thesis titled "${duplicate.title}" already exists.`,
                duplicate: true,
            });
        }

        // UPLOAD FILE TO SUPABASE STORAGE
        const userIdSafe = user_id ?? "unknown";
        const fileName = `${userIdSafe}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("thesis-files")
            .upload(fileName, thesis_file.buffer, {
                contentType: thesis_file.mimetype,
                upsert: false,
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return res.status(500).json({ status: false, error: "Failed to upload file" });
        }

        const thesis_file_url = uploadData.path;

        // INSERT DATA
        const { data: thesis, error: thesisError } = await supabase
            .from("Thesis")
            .insert([
                {
                    admin_id: user_id,
                    title: finalTitle,
                    author: finalAuthor,
                    course: finalCourse,
                    thesis_abstract: finalAbstract,
                    keywords: finalKeywords,
                    issue_date: finalIssueDate,
                    thesis_file_url,
                    thesis_file_name: thesis_file.originalname,
                },
            ])
            .select();

        if (thesisError || !thesis?.[0]) {
            console.error("Failed to insert thesis:", thesisError);
            await supabase.storage.from("thesis-files").remove([fileName]);

            // 23505 = unique violation (two submissions with the same title raced past the check above).
            // Only fires if you created the unique index on lower(trim(title)).
            if (thesisError?.code === "23505") {
                return res.status(409).json({
                    status: false,
                    message: "A thesis with this title already exists.",
                    duplicate: true,
                });
            }

            return res.status(500).json({ error: "Failed to create thesis" });
        }

        // ANALYTICS
        await supabase.from("ThesisDataAnalytics").insert([
            {
                thesis_id: thesis[0].id,
                views: 0,
                downloads: 0,
            },
        ]);

        // CACHE CLEAR
        await invalidateCacheByPrefix("thesis:page");

        return res.status(200).json({
            status: true,
            message: "Thesis created successfully",
            data: thesis[0],
        });

    } catch (error: any) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export async function UpdateThesis(req: Request, res: Response) {
    try {
        const { id } = req.params as { id: string };

        const { title, author, course, issueDate, thesis_abstract, keywords } = req.body;

        // DUPLICATE TITLE CHECK (ignores the thesis being edited)
        if (typeof title === "string" && title.trim()) {
            const duplicate = await findDuplicateThesis(title, id);
            if (duplicate) {
                return res.status(409).json({
                    message: `A thesis titled "${duplicate.title}" already exists.`,
                    duplicate: true,
                });
            }
        }

        const files = req.files as Express.Multer.File[];
        const thesis_file = files?.[0];

        let thesis_file_url: string | undefined;
        let thesis_file_name: string | undefined;
        let oldFilePath: string | undefined;

        if (thesis_file) {
            const allowedTypes = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];

            if (!allowedTypes.includes(thesis_file.mimetype)) {
                return res.status(400).json({ status: false, message: "Only PDF and DOCX files are allowed" });
            }

            const { data: existingThesis, error: existingFetchError } = await supabase
                .from("Thesis")
                .select("thesis_file_url")
                .eq("id", id)
                .single();

            if (existingFetchError) {
                console.error("Failed to fetch existing thesis for file swap:", existingFetchError);
            } else {
                oldFilePath = existingThesis?.thesis_file_url;
            }

            const fileName = `${id}_${Date.now()}_${thesis_file.originalname.replace(/\s+/g, "_")}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("thesis-files")
                .upload(fileName, thesis_file.buffer, {
                    contentType: thesis_file.mimetype,
                    upsert: true,
                });

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                return res.status(500).json({ status: false, error: "Failed to upload file" });
            }

            thesis_file_url = uploadData.path;
            thesis_file_name = thesis_file.originalname;
        }

        const { data: updatedRow, error } = await supabase
            .from("Thesis")
            .update({
                title: typeof title === "string" && title.trim() ? normalizeTitle(title) : title,
                author,
                course,
                issue_date: issueDate,
                thesis_abstract,

                // Only touch keywords when the form sent the field; an empty value clears them
                ...(keywords !== undefined && { keywords: cleanKeywords(keywords) }),

                ...(thesis_file_url && { thesis_file_url }),
                ...(thesis_file_name && { thesis_file_name }),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            // A new file was already uploaded; don't leave it orphaned if the row update failed
            if (thesis_file_url && thesis_file_url !== oldFilePath) {
                await supabase.storage.from("thesis-files").remove([thesis_file_url]);
            }

            if (error.code === "23505") {
                return res.status(409).json({
                    message: "A thesis with this title already exists.",
                    duplicate: true,
                });
            }

            return res.status(400).json({ error: error.message });
        }

        // Only remove the old file once the row update succeeded, and only if a new file actually replaced it
        if (oldFilePath && thesis_file_url && oldFilePath !== thesis_file_url) {
            const { error: oldFileRemoveError, data: oldFileRemoveData } = await supabase.storage
                .from("thesis-files")
                .remove([oldFilePath]);

            if (oldFileRemoveError) {
                console.error("Failed to delete old thesis file from storage:", JSON.stringify(oldFileRemoveError, null, 2));
            } else {
                console.log("Old file removed:", oldFileRemoveData);
            }
        }

        await invalidateCacheByPrefix("thesis:page");

        return res.status(200).json({ message: "Thesis updated successfully", data: updatedRow });
    } catch (error: any) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export async function getThesis(req: Request, res: Response) {
  try {
    const { page, limit } = req.query as { page: string; limit: string };
    
    if (!page || !limit) {
        return res.status(400).json({
            success: false,
            message: 'page and limit are required'
        });
    }

    const cacheKey = `thesis:page:${page}:limit:${limit}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, thesis: cached });
    }

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    const { data: thesis, error, count } = await supabase  
      .from('Thesis')
      .select('*, ThesisDataAnalytics(views, downloads)', { count: 'exact' })
      .range(from, to);

    if (error) throw error;  

    const responseData = {
      thesis,
      totalCount: count,
      currentPage: Number(page),
      totalPages: Math.ceil(count! / Number(limit)),
    };

    await redis.set(cacheKey, responseData, { ex: 3600 });

    return res.status(200).json({
      success: true,
      thesis: responseData,
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRandomThesis(req: Request, res: Response){
    try {  
        const { data, error } = await supabase
        .from("Thesis")
        .select("*, ThesisDataAnalytics(views, downloads, saves)")
        .order("created_at", { ascending: Math.random() < 0.5 })
        .limit(4);

        if (error) {
           console.error("Failed to fetch thesis:", error);
            return res.status(500).json({ error: "Failed to fetch thesis" });
        }
        res.status(200).json({success: true, data, length: data.length})
    } catch (error:any) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
}

export async function getRepoById(req: Request, res: Response){
    try {
        const { id } = req.params as { id: string };

        if (!id) {
            return res.status(400).json({ error: 'ID is required' });
        }
        
        const { data, error } = await supabase
            .from('Thesis')
            .select('*, ThesisDataAnalytics(views, downloads)')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (!data) {
            return res.status(404).json({ error: 'Not found' });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getRepoViewAndDownloads(req: Request, res: Response) {
    try {
        const { data, error } = await supabase
            .from("ThesisDataAnalytics")
            .select("*");

        if (error) {
            console.error("Failed to fetch analytics:", error);
            return res.status(500).json({ status: false, error: "Failed to fetch analytics" });
        }

        return res.status(200).json({ status: true, data });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteId(req: Request, res: Response) {
    try {
        const { id } = req.params as { id: string };

        if (!id) {
            return res.status(400).json({ error: "ID is required" });
        }

        const { data: thesis, error: fetchError } = await supabase
            .from("Thesis")
            .select("thesis_file_url")
            .eq("id", id)
            .single();

        if (fetchError || !thesis) {
            return res.status(404).json({ error: "Thesis not found" });
        }

        if (thesis.thesis_file_url) {
            const { error: storageError, data: removeData } = await supabase.storage
                .from("thesis-files")
                .remove([thesis.thesis_file_url]);

            if (storageError) {
                console.error("Failed to delete file from storage:", JSON.stringify(storageError, null, 2));
            } else if (!removeData || removeData.length === 0) {
                console.warn("Storage remove returned no deleted objects for path:", thesis.thesis_file_url);
            } else {
                console.log("Storage file removed:", removeData);
            }
        }

        // Delete analytics first (foreign key dependency)
        await supabase.from('ThesisDataAnalytics').delete().eq('thesis_id', id);

        const { error: deleteError } = await supabase
            .from("Thesis")
            .delete()
            .eq("id", id);

        if (deleteError) {
            return res.status(500).json({ error: "Failed to delete thesis" });
        }

        await invalidateCacheByPrefix("thesis:page");

        return res.status(200).json({ success: true, message: "Thesis deleted successfully" });

    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}