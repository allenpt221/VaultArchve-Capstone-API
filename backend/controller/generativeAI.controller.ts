import { supabase } from "../supabase/supa-client";
import { Request, Response } from "express";
import OpenAI from "openai";
import { checkDailyLimit } from "../lib/checkDailyLimit";
import { PDFParse } from "pdf-parse";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const DAILY_PROMPT_LIMIT = 5;
const MIN_RESEARCH_QUESTIONS_DA = 1;
const MAX_RESEARCH_QUESTIONS_DA = 6;

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


const COURSE_KEYWORDS: Record<string, RegExp> = {
  "Accountancy": /\baccountancy\b/i,
  "Public Administration": /\bpublic\s+administration\b/i,
  "Accounting Information System": /\baccounting\s+information\s+system(s)?\b|\bAIS\b/i,
  "Entrepreneurship": /\bentrepreneurship\b|\bentrep\b/i,
};

function checkCourseMismatch(promptText: string, selectedCourse: string) {
  const normalizedSelected = Object.keys(COURSE_KEYWORDS).find((key) =>
    selectedCourse.toLowerCase().includes(key.toLowerCase())
  );

  for (const [courseName, pattern] of Object.entries(COURSE_KEYWORDS)) {
    if (courseName === normalizedSelected) continue; // skip the user's own course
    if (pattern.test(promptText)) {
      return {
        valid: false,
        message: `You're generating recommendations for "${selectedCourse}", but your prompt mentions "${courseName}". Please select "${courseName}" as your course, or rephrase your prompt to stay within "${selectedCourse}".`,
      };
    }
  }
  return { valid: true };
}

function limitText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  const referenceMatch = text.match(/\n\s*(REFERENCES|REFERENCE)\s*\n/i);

  if (referenceMatch?.index !== undefined) {
    const referenceStart = referenceMatch.index;
    const references = text.slice(referenceStart);
    const available = maxChars - references.length;

    if (available > 10000) {
      const beginningSize = Math.floor(available * 0.7);
      const middleSize = available - beginningSize;

      const beginning = text.slice(0, beginningSize);
      const middle = text.slice(
        Math.max(beginningSize, referenceStart - middleSize),
        referenceStart
      );

      return [
        beginning,
        "\n\n[DOCUMENT CONTENT TRUNCATED]\n\n",
        middle,
        "\n\n",
        references,
      ].join("");
    }
  }

  const half = Math.floor((maxChars - 100) / 2);

  return [
    text.slice(0, half),
    "\n\n[DOCUMENT CONTENT TRUNCATED]\n\n",
    text.slice(-half),
  ].join("");
}

function containsAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

function analyzePaperStructure(text: string) {
  const upper = text.toUpperCase();
  const chapters: string[] = [];
  const chapterRegex = /CHAPTER\s+(I{1,3}|IV|V|VI|VII|VIII|IX|X|\d+)/gi;

  let match;
  while ((match = chapterRegex.exec(text)) !== null) {
    const chapter = `Chapter ${match[1].toUpperCase()}`;
    if (!chapters.includes(chapter)) chapters.push(chapter);
  }

  const sections = {
    abstract: containsAny(upper, ["ABSTRACT"]),
    background: containsAny(upper, [
      "BACKGROUND",
      "INTRODUCTION",
      "BACKGROUND OF THE STUDY",
    ]),
    problem: containsAny(upper, [
      "STATEMENT OF THE PROBLEM",
      "PROBLEM STATEMENT",
    ]),
    researchQuestions: containsAny(upper, [
      "RESEARCH QUESTIONS",
      "RESEARCH QUESTION",
    ]),
    objectives: containsAny(upper, [
      "OBJECTIVES",
      "OBJECTIVE OF THE STUDY",
      "SPECIFIC OBJECTIVES",
    ]),
    significance: containsAny(upper, [
      "SIGNIFICANCE OF THE STUDY",
      "SIGNIFICANCE",
    ]),
    scope: containsAny(upper, [
      "SCOPE AND DELIMITATION",
      "SCOPE AND LIMITATION",
      "SCOPE AND LIMITATIONS",
      "SCOPE OF THE STUDY",
    ]),
    definitions: containsAny(upper, [
      "DEFINITION OF TERMS",
      "DEFINITION OF TERM",
    ]),
    literature: containsAny(upper, [
      "REVIEW OF RELATED LITERATURE",
      "RELATED LITERATURE",
    ]),
    studies: containsAny(upper, [
      "REVIEW OF RELATED STUDIES",
      "RELATED STUDIES",
    ]),
    framework: containsAny(upper, [
      "CONCEPTUAL FRAMEWORK",
      "THEORETICAL FRAMEWORK",
      "THEORETICAL/CONCEPTUAL FRAMEWORK",
    ]),
    researchDesign: containsAny(upper, ["RESEARCH DESIGN"]),
    population: containsAny(upper, [
      "POPULATION AND SAMPLING",
      "SAMPLING TECHNIQUE",
      "RESPONDENTS OF THE STUDY",
      "POPULATION OF THE STUDY",
    ]),
    instrument: containsAny(upper, [
      "RESEARCH INSTRUMENT",
      "RESEARCH INSTRUMENTS",
      "RESEARCH TOOL",
      "RESEARCH TOOLS",
    ]),
    dataGathering: containsAny(upper, [
      "DATA GATHERING PROCEDURE",
      "DATA COLLECTION PROCEDURE",
      "DATA COLLECTION",
      "DATA GATHERING",
    ]),
    statistics: containsAny(upper, [
      "STATISTICAL TREATMENT",
      "STATISTICAL ANALYSIS",
      "STATISTICAL TOOL",
    ]),
    presentation: containsAny(upper, [
      "PRESENTATION OF DATA",
      "PRESENTATION, ANALYSIS",
      "RESULTS",
      "FINDINGS",
    ]),
    discussion: containsAny(upper, ["DISCUSSION"]),
    summary: containsAny(upper, ["SUMMARY"]),
    conclusion: containsAny(upper, ["CONCLUSION", "CONCLUSIONS"]),
    recommendation: containsAny(upper, [
      "RECOMMENDATION",
      "RECOMMENDATIONS",
    ]),
    references: containsAny(upper, ["REFERENCES", "REFERENCE"]),
  };

  return {
    chapters,
    sections,
    estimatedPages: Math.max(1, Math.ceil(text.length / 2500)),
  };
}

function analyzeCitations(text: string) {
  const referencesIndex = text.search(/\n\s*(REFERENCES|REFERENCE)\s*\n/i);
  const body = referencesIndex >= 0 ? text.slice(0, referencesIndex) : text;
  const references = referencesIndex >= 0 ? text.slice(referencesIndex) : "";

  const inTextCitationRegex =
    /\(([A-Z][A-Za-zÀ-ÿ'’-]+(?:\s+(?:&|and)\s+[A-Z][A-Za-zÀ-ÿ'’-]+|\s+et al\.)?,?\s*\d{4}[a-z]?)\)/g;

  const inTextCitations = [...body.matchAll(inTextCitationRegex)].map(
    (match) => match[1]
  );

  const referenceYears = [...references.matchAll(/\b(19|20)\d{2}\b/g)].map(
    (match) => match[0]
  );

  const issues: string[] = [];

  if (inTextCitations.length === 0) {
    issues.push("No clear author-year in-text citations were detected.");
  }

  if (referencesIndex < 0) {
    issues.push("A References section was not clearly detected.");
  }

  if (referenceYears.length === 0 && references.length > 0) {
    issues.push(
      "No publication years were detected in the References section."
    );
  }

  return {
    inTextCitationCount: inTextCitations.length,
    referenceYearCount: referenceYears.length,
    referencesSectionFound: referencesIndex >= 0,
    issues,
  };
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function getReadinessLabel(score: number): string {
  if (score >= 90) return "Ready";
  if (score >= 75) return "Nearly Ready";
  if (score >= 60) return "Needs Revision";
  if (score >= 40) return "Needs Major Revision";
  return "Not Ready";
}

// Some full_paper_reviews rows have these columns stored as an escaped
// JSON string (e.g. the column is text/varchar rather than jsonb, or an
// older code path called JSON.stringify before inserting) instead of a
// real object. Parses defensively so callers always get back the object
// shape SavedFullPaperReview expects, regardless of which form the row
// is actually in.
function parseJsonColumn<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      console.error("Failed to parse JSON column value:", value);
      return null;
    }
  }
  return value as T;
}

// --- helpers to detect "give me 10 titles" / "at least 8 recommendations" etc. ---
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};

export function isGibberish(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  const words = text.trim().split(/\s+/);

  const gibberishWordCount = words.filter((word) => {
    if (word.length <= 2) return false;
    if (/(.)\1{3,}/.test(word)) return true;

    const vowels = (word.match(/[aeiou]/g) || []).length;
    const vowelRatio = vowels / word.length;

    if (word.length >= 4 && vowelRatio < 0.1) return true;
    if (/^([qwerty]{4,}|[asdfgh]{4,}|[zxcvbn]{4,}|[yuiop]{4,})$/i.test(word)) return true;
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word)) return true;

    return false;
  }).length;

  return gibberishWordCount / words.length > 0.5;
}

/**
 * Validates that `text` is meaningful enough to send to the model.
 * - `required: false` (default) — empty text passes (field is optional, like chatPrompt)
 * - `required: true` — empty text fails (field is mandatory, like topic)
 */
export function checkMeaningfulText(
  text: string | undefined | null,
  { required = false }: { required?: boolean } = {}
): { valid: boolean; error?: string; message?: string } {
  const trimmed = (text || "").trim().toLowerCase();

  if (!trimmed) {
    return required
      ? { valid: false, error: "Input required", message: "This field is required." }
      : { valid: true };
  }

  if (trimmed.length < 5) {
    return {
      valid: false,
      error: "Input too short",
      message: "Please enter a meaningful prompt.",
    };
  }

  if (isGibberish(trimmed)) {
    return {
      valid: false,
      error: "Meaningless input",
      message: "Your input appears to be random or meaningless. Please enter a valid prompt.",
    };
  }

  return { valid: true };
}

// --- shared image-request detection, used across every endpoint that
// accepts free text (chatPrompt, topic, context, researchQuestions,
// rawFindings, gapStatement) so a user can't smuggle an image request
// through a field that previously wasn't checked. ---
const IMAGE_REQUEST_REGEX =
  /(can\s+you\s+(make|create|generate|draw|design|render|show|give|send|produce)|please\s+(make|create|generate|draw|design|render|show|give|send|produce)).*?(image|picture|photo|art|artwork|illustration|logo|poster|graphic|visual|diagram|thumbnail)|^(generate|create|draw|make|design|render|illustrate|paint|sketch|show|give|send|produce)\s.*(image|picture|photo|art|artwork|illustration|logo|poster|graphic|visual|diagram|thumbnail)|\b(image|picture|photo|artwork|illustration|logo|poster|graphic|visual|thumbnail)\b/i;

const VIDEO_REQUEST_REGEX =
/(can\s+you\s+(make|create|generate|produce|render|edit|animate|show|give|send)|please\s+(make|create|generate|produce|render|edit|animate|show|give|send)).*?(video|clip|movie|animation|footage|reel|trailer|screencast|vlog|mp4)|^(generate|create|make|render|produce|edit|animate|show|give|send)\s.*(video|clip|movie|animation|footage|reel|trailer|screencast|mp4)|\b(video|videos|clip|movie|animation|footage|mp4|trailer|screencast|vlog)\b/i;

export function isVideoRequest(text: string | undefined | null): boolean {
  if (!text) return false;
  return VIDEO_REQUEST_REGEX.test(text.trim().toLowerCase());
}

export function isImageRequest(text: string | undefined | null): boolean {
  if (!text) return false;
  return IMAGE_REQUEST_REGEX.test(text.trim().toLowerCase());
}

export function isUnsupportedMediaRequest(text: string | undefined | null): boolean {
  return isImageRequest(text) || isVideoRequest(text);
}

const IMAGE_REQUEST_ERROR = "Unsupported request";
const IMAGE_REQUEST_MESSAGE =
  "Sorry, I can only help with thesis-relate d text. I'm not able to create images, videos, photos, or any visual content. Please rephrase your input as a thesis-related instruction.";

export function extractRequestedCount(text: string): number | null {
  // "10 titles", "8 recommendations", "12 thesis suggestions"
  const digitMatch = text.match(/\b(\d{1,3})\s*(?:titles?|recommendations?|suggestions?|thesis(?:es)?|topics?)\b/i);
  if (digitMatch) return parseInt(digitMatch[1], 10);

  // "ten titles", "fifteen suggestions"
  const wordMatch = text.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b\s*(?:titles?|recommendations?|suggestions?|thesis(?:es)?|topics?)/i
  );
  if (wordMatch) return NUMBER_WORDS[wordMatch[1].toLowerCase()];

  // "more than 5", "at least 10", "over 6"
  const moreThanMatch = text.match(/(?:more than|at least|over|above)\s*(\d{1,3})/i);
  if (moreThanMatch) return parseInt(moreThanMatch[1], 10) + 1;

  return null;
}

export async function RecommendedAI(req: Request, res: Response) {
  try {
    const { course, chatPrompt, session_id } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!course) {
      return res.status(400).json({ message: "Course is required." });
    }

    const promptCheck = checkMeaningfulText(chatPrompt);
    if (!promptCheck.valid) {
      return res.status(400).json({ error: promptCheck.error, message: promptCheck.message });
    }

    const promptText = (chatPrompt || "").trim().toLowerCase();

  if(isUnsupportedMediaRequest(promptText)) {
    return res.status(400).json({
      error: IMAGE_REQUEST_ERROR,
      message: IMAGE_REQUEST_MESSAGE,
    });
  }

    const isOffTopicRequest =
      /(write|generate|create|make|give|provide|suggest|draft|compose|produce).*(review|literature|abstract|introduction|conclusion|methodology|chapter|paragraph|essay|paper|article|content|text|report|summary|outline|research\s+paper|related\s+studies|background|discussion|analysis|findings|recommendation(?!s?\s+title))/i.test(promptText) ||
      /(literature\s+review|related\s+literature|related\s+studies|research\s+paper|study\s+guide|essay\s+writing|content\s+writing|thesis\s+writing|chapter\s+[1-5])/i.test(promptText) ||
      /\b(rrl|rrls|r\.r\.l|related\s+research\s+literature|review\s+of\s+related\s+literature|review\s+of\s+related\s+studies|rrs)\b/i.test(promptText);

    if (isOffTopicRequest) {
      return res.status(400).json({
        error: "Unsupported request",
        message:
          "I can only generate thesis title recommendations and their features. Writing literature reviews, abstracts, introductions, or any thesis content is not supported here.",
      });
    }

        const courseMismatch = checkCourseMismatch(promptText, course);
    if (!courseMismatch.valid) {
      return res.status(400).json({
        error: "Course mismatch",
        message: courseMismatch.message,
      });
    }

    // reject requests asking for more than 5 titles before calling the AI
    const requestedCount = extractRequestedCount(promptText);
    if (requestedCount && requestedCount > 5) {
      return res.status(400).json({
        error: "Request exceeds limit",
        message: `I can only generate up to 5 thesis title recommendations at a time. You asked for ${requestedCount} — please rephrase your request within that limit.`,
      });
    }

    const isEntrepCourse = /entrepreneurship/i.test(course);

    const { data: thesisPool, error: fetchError } = await supabase
      .from("Thesis")
      .select("id, title, thesis_introduction, entrep_intro")
      .ilike("course", `%${course}%`);

    if (fetchError) {
      return res.status(500).json({ message: "Failed to fetch existing theses", error: fetchError });
    }

    const existingTheses = thesisPool
      ? [...thesisPool].sort(() => Math.random() - 0.5).slice(0, 5)
      : [];

    const { allowed } = await checkDailyLimit(user_id, "thesisRecommendation", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const { data: previousRecs } = await supabase
      .from("thesisRecommendation")
      .select("response")
      .eq("user_id", user_id)
      .eq("course", course)
      .order("created_at", { ascending: false })
      .limit(3);

    const previousTitles = (previousRecs || [])
      .flatMap((r: any) => (Array.isArray(r.response) ? r.response.map((rec: any) => rec.title) : []))
      .filter(Boolean);

    const hasExisting = existingTheses && existingTheses.length > 0;

    const existingBlock = hasExisting
      ? existingTheses
          .map((t, i) => {
            const intro = isEntrepCourse ? t.entrep_intro : t.thesis_introduction;
            return `[${i + 1}] Title: "${t.title}"\n     Introduction: ${
              intro ? intro.slice(0, 300) + "..." : "No introduction available."
            }`;
          })
          .join("\n\n")
      : null;

    const avoidBlock = previousTitles.length
      ? `
      DO NOT repeat, lightly reword, or produce close variants of any of these titles
      you already suggested to this user for this course:
      ${previousTitles.map((t) => `- ${t}`).join("\n")}
      Generate genuinely different titles, angles, or scopes than these.
      `
      : "";

    const prompt = `
      You are an academic advisor and research innovation expert.

      ${
        hasExisting
          ? `
      EXISTING PUBLISHED THESES (from the database for course: ${course}):
      ${existingBlock}

      YOUR TASK:
      - Use the existing thesis titles and introductions above as your BASE
      - EVOLVE each one: add new features, new research angles, updated scope, or modern methods
      - Keep the same research context/location if mentioned (e.g. "Guagua Pampanga"), but expand the scope
      - Do NOT copy the title verbatim — evolve it meaningfully with new direction
      - Make titles specific, research-ready, and publishable
      - ONLY return thesis titles, summaries, new features, and tags — do NOT write literature reviews, abstracts, or any thesis content
      `
          : `
      No existing theses found for this course. Generate 5 original thesis title suggestions.
      ONLY return thesis titles, summaries, new features, and tags — do NOT write literature reviews, abstracts, or any thesis content.
      `
      }
      ${avoidBlock}

      Course: ${course}
      ${chatPrompt ? `User Instruction (apply this to ALL suggestions): "${chatPrompt}"` : ""}

      For each evolved thesis provide:
      - "original_title": the exact source thesis title from the database (or "New" if none existed)
      - "title": the new evolved thesis title
      - "summary": 2–3 sentence summary of the evolved thesis
      - "new_features": array of 2–3 short strings — what is NEW or added vs the original
      - "tags": 3 short keyword tags

      IMPORTANT: Return EXACTLY 5 items in the "recommendations" array — no more, no fewer.
      If fewer than 5 existing theses were provided above, invent additional original entries
      (using "original_title": "New") to reach exactly 5 total.

      Return ONLY a JSON object of the form { "recommendations": [ ... ] }, no markdown, no explanation:
      {
        "recommendations": [
          {
            "original_title": "",
            "title": "",
            "summary": "",
            "new_features": ["", "", ""],
            "tags": ["", "", ""]
          }
        ]
      }
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      temperature: 1.0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an academic advisor. You ONLY generate thesis title recommendations, summaries, new features, and tags. You do NOT write literature reviews, abstracts, introductions, essays, or any thesis content. Return only valid JSON in the form { \"recommendations\": [...] }.",
        },
        {
          role: "user",
          content: `${prompt}\n\n(request_id: ${crypto.randomUUID()})`,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const jsonParsed = JSON.parse(cleaned);
      const normalized = Array.isArray(jsonParsed) ? jsonParsed : jsonParsed.recommendations;
      parsed = Array.isArray(normalized) ? normalized.slice(0, 5) : normalized;
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    // A conversation thread is identified by session_id. If the client didn't
    // send one (i.e. this is the first message of a new chat), mint one here
    // and hand it back so subsequent turns in the same chat can reuse it.
    const resolvedSessionId = session_id || crypto.randomUUID();

    // Title is derived from this turn's prompt and saved on every row (not
    // just the first), so the column is always populated even without
    // joining across session_id. GetThesisHistory still pins the session's
    // displayed title to the FIRST turn, so follow-ups won't relabel a chat.
    const trimmedPrompt = (chatPrompt || "").trim();
    const rowTitle =
      trimmedPrompt.length > 48 ? `${trimmedPrompt.slice(0, 48)}…` : trimmedPrompt || "New chat";

    const { error: insertError, data: inserted } = await supabase
      .from("thesisRecommendation")
      .insert([
        {
          user_id,
          course,
          chatPrompt,
          response: parsed,
          session_id: resolvedSessionId,
          title: rowTitle,
        },
      ])
      .select("id, created_at, session_id, title")
      .single();

    if (insertError) {
      return res.status(500).json({ message: "Failed to insert response", error: insertError });
    }

    return res.status(200).json({
      id: inserted?.id,
      session_id: inserted?.session_id,
      title: inserted?.title,
      created_at: inserted?.created_at,
      recommendations: parsed,
      based_on_existing: hasExisting,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function GetThesisHistory(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const { data: rows, error: fetchError } = await supabase
      .from("thesisRecommendation")
      .select("id, course, chatPrompt, response, created_at, session_id, title")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true }) // ascending so turns land in order within each session
      .range(offset, offset + limit - 1);

    if (fetchError) {
      return res.status(500).json({ message: "Failed to fetch chat history", error: fetchError });
    }

    const parseResponse = (response: any): any[] => {
      if (Array.isArray(response)) return response;
      if (typeof response === "string") {
        try {
          return JSON.parse(response);
        } catch {
          return [];
        }
      }
      return [];
    };

    const deriveTitle = (chatPrompt: string) => {
      const trimmed = (chatPrompt || "").trim();
      if (!trimmed) return "New chat";
      return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
    };

    // Group rows into sessions. Legacy rows without session_id each become
    // their own standalone session (keyed by the row's own id).
    const sessionMap = new Map<string, any>();

    for (const row of rows || []) {
      const key = row.session_id ?? row.id;

      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          id: key,
          // Title is fixed at the FIRST turn seen for this session (since
          // rows are ordered ascending by created_at) — it's the
          // conversation's label, not the latest message's.
          title: row.title || deriveTitle(row.chatPrompt),
          course: row.course,
          updatedAt: new Date(row.created_at).getTime(),
          messages: [],
        });
      }

      const session = sessionMap.get(key);

      // Course and updatedAt still track the latest turn.
      session.course = row.course;
      session.updatedAt = Math.max(session.updatedAt, new Date(row.created_at).getTime());

      session.messages.push(
        {
          id: `${row.id}-user`,
          role: "user",
          text: row.chatPrompt,
          course: row.course,
        },
        {
          id: `${row.id}-assistant`,
          role: "assistant",
          kind: "results",
          results: parseResponse(row.response),
        }
      );
    }

    // Most recently updated conversation first, matching the frontend's sort
    const sessions = Array.from(sessionMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);

    return res.status(200).json({ sessions });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function TopicSelection(req: Request, res: Response) {
  try {
    const { topic, context } = req.body;
    const user_id = req.user?.id;

    if (!topic) {
      return res.status(400).json({ message: "Thesis Topic is required." });
    }

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const topicCheck = checkMeaningfulText(topic, { required: true });
    if (!topicCheck.valid) {
      return res.status(400).json({ error: topicCheck.error, message: topicCheck.message });
    }

    const contextCheck = checkMeaningfulText(context);
    if (!contextCheck.valid) {
      return res.status(400).json({ error: contextCheck.error, message: contextCheck.message });
    }

  if(isImageRequest(topic) || isImageRequest(context)) {
    return res.status(400).json({
      error: IMAGE_REQUEST_ERROR,
      message: IMAGE_REQUEST_MESSAGE,
    });
  }


    const { allowed } = await checkDailyLimit(user_id, "topicSelection", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const prompt = `
      Topic / research area: ${topic}

      Additional context: ${context?.trim() ? context : "None provided."}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a thesis advisor helping an undergraduate student narrow down a thesis topic. " +
            "Given a raw topic/research area and optional context, respond ONLY with a JSON object shaped as: " +
            `{ "guidance": { "feedback": string, "feasibility": "strong" | "needs_narrowing" | "too_broad", ` +
            `"refinedTopics": string[], "suggestedResearchQuestions": string[], "nextSteps": string[] } }. ` +
            "feedback should be 2-3 sentences. refinedTopics should have exactly 10 more focused alternative phrasings " +
            "of the student's topic. suggestedResearchQuestions should have 2-5 concrete research questions." +
            "nextSteps should have 2-3 short actionable items for moving to the Literature Review stage.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { guidance } = parsed;

    const { error: saveError } = await supabase.from("topic_selection_responses").insert({
      user_id,
      topic,
      context: context?.trim() ? context : null,
      feedback: guidance.feedback,
      feasibility: guidance.feasibility,
      refined_topics: guidance.refinedTopics,
      suggested_research_questions: guidance.suggestedResearchQuestions,
      next_steps: guidance.nextSteps,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function LiteratureReview(req: Request, res: Response) {
  try {
    const { topic } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const topicCheck = checkMeaningfulText(topic, { required: true });
    if (!topicCheck.valid) {
      return res.status(400).json({ error: topicCheck.error, message: topicCheck.message });
    }

  if(isImageRequest(topic)) {
    return res.status(400).json({
      error: IMAGE_REQUEST_ERROR,
      message: IMAGE_REQUEST_MESSAGE,
    });
  }


    const { allowed } = await checkDailyLimit(user_id, "literatureReview", DAILY_PROMPT_LIMIT);
    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    // Use a browsing-capable model (Responses API + web_search tool). The
    // model must actually retrieve each source via the tool — it's told
    // never to write a url from memory.
    const instructions =
      "You are a thesis advisor helping an undergraduate student build their Review of Related " +
      "Literature (RRL). Use the web_search tool to find at least 20 REAL, currently accessible " +
      "sources (journal articles, conference papers, theses, or reputable reports) relevant to the " +
      "given topic. For every source you cite, you MUST have actually retrieved it through the " +
      "search tool — never write a url or citation from memory, and never guess a plausible-looking " +
      "url. If you cannot find 20 real sources, return as many verified ones as you found — never " +
      "pad the list with invented entries. " +
      "Respond with ONLY a JSON object (no markdown fences) shaped as: " +
      `{ "annotatedBibliography": [{ "title": string, "authors": string, "year": string, ` +
      `"container": string, "sourceType": string, "url": string, "annotation": string }] }. ` +
      "One entry per retrieved source. " +
      "title: the exact title of the source, without quotation marks. " +
      "authors: the author name(s) as 'Last Name, First Name' (join multiple with '; '). If no " +
      "individual author is listed, use the organization name (e.g. 'World Health Organization'). " +
      "year: the publication year only, as a string. " +
      "container: whichever of these actually applies — the journal name (for journal articles), " +
      "the publisher or institution (for theses, reports, or standalone works), or the website/" +
      "organization name (for web pages). " +
      "sourceType: one of 'Journal Article', 'Conference Paper', 'Thesis', 'Report', or 'Web Source' " +
      "— whichever best matches. " +
      "url: the exact url the tool returned. " +
      "annotation: a 4-5 sentence summary of the source's contribution and relevance to the topic. " +
      "Only include fields you actually found — if a field genuinely cannot be found, omit it rather " +
      "than guessing or inventing a value.";

    const response = await openai.responses.create({
      model: "gpt-5.4",
      tools: [{ type: "web_search" }],
      instructions,
      input: `Thesis topic: ${topic}`,
    });

    const rawText = response.output_text || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    if (!Array.isArray(parsed.annotatedBibliography) || parsed.annotatedBibliography.length === 0) {
      return res.status(404).json({
        message: "Couldn't find sources for this topic. Try broadening or rephrasing it.",
      });
    }

    // Cross-check every url against what the tool actually retrieved. Even
    // with browsing, a model can occasionally slip in a url it didn't really
    // visit — so we only trust urls backed by a real url_citation annotation
    // from the tool call, and drop anything else.
    const groundedUrls = new Set<string>();
    for (const item of response.output ?? []) {
      if (item.type === "message") {
        for (const part of item.content ?? []) {
          if (part.type !== "output_text") continue;
          for (const annotation of part.annotations ?? []) {
            if (annotation.type === "url_citation" && annotation.url) {
              groundedUrls.add(annotation.url);
            }
          }
        }
      }
    }

    let annotatedBibliography = parsed.annotatedBibliography;
    let unverifiedDropped = 0;

    if (groundedUrls.size > 0) {
      const verified = annotatedBibliography.filter((entry: any) => groundedUrls.has(entry.url));
      unverifiedDropped = annotatedBibliography.length - verified.length;
      annotatedBibliography = verified;
    }

    if (annotatedBibliography.length < 3) {
      return res.status(404).json({
        message:
          "Couldn't verify enough real sources for this topic. Try broadening or rephrasing it.",
      });
    }

    // Persist the AI response to Postgres (via Supabase) — single table.
    // Failure to save should not break the response to the client — we log
    // it and still return the result.
    try {
      const { error: saveError } = await supabase.from("literature_reviews").insert({
        user_id,
        topic,
        source_count: annotatedBibliography.length,
        unverified_dropped: unverifiedDropped,
        annotated_bibliography: annotatedBibliography,
      });

      if (saveError) throw saveError;
    } catch (persistError) {
      console.log("Failed to persist literature review:", persistError);
      // Intentionally not returning an error response here — the AI result
      // is still valid and useful even if the save failed.
    }

    return res.status(200).json({
      topic,
      sourceCount: annotatedBibliography.length,
      unverifiedDropped,
      annotatedBibliography,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function Methodology(req: Request, res: Response) {
  try {
    const { topic, researchQuestions, context } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const topicCheck = checkMeaningfulText(topic, { required: true });
    if (!topicCheck.valid) {
      return res.status(400).json({ error: topicCheck.error, message: topicCheck.message });
    }

    if (!Array.isArray(researchQuestions) || researchQuestions.length < 1) {
      return res.status(400).json({
        message: "Please provide at least one research question to build a methodology around.",
      });
    }

    if (researchQuestions.length > 6) {
      return res.status(400).json({
        message: "Please provide no more than 6 research questions at a time.",
      });
    }

    for (const q of researchQuestions) {
      const qCheck = checkMeaningfulText(q, { required: true });
      if (!qCheck.valid) {
        return res.status(400).json({ error: qCheck.error, message: `Research question: ${qCheck.message}` });
      }
    }

    const contextCheck = checkMeaningfulText(context);
    if (!contextCheck.valid) {
      return res.status(400).json({ error: contextCheck.error, message: contextCheck.message });
    }

    if (
      isImageRequest(topic) ||
      isImageRequest(context) ||
      researchQuestions.some((q: string) => isImageRequest(q))
    ) {
      return res.status(400).json({
        error: IMAGE_REQUEST_ERROR,
        message: IMAGE_REQUEST_MESSAGE,
      });
    }

    const { allowed } = await checkDailyLimit(user_id, "methodology", DAILY_PROMPT_LIMIT);
    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const questionsBlock = researchQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n");

    const prompt = `
      Thesis topic: ${topic}

      Research questions:
      ${questionsBlock}

      Additional context: ${context?.trim() ? context : "None provided."}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a thesis advisor helping an undergraduate student design their Methodology chapter. " +
            "Given their topic and numbered research questions, respond ONLY with a JSON object shaped EXACTLY as this skeleton " +
            "(pay close attention to which fields are nested inside \"population\" and which are siblings of it — " +
            "only targetPopulation, samplingMethod, sampleSizeJustification, and inclusionCriteria belong inside " +
            "population; instruments, dataCollectionPlan, dataAnalysisPlan, questionMapping, and limitations are " +
            "top-level siblings of population, NOT nested inside it):\n" +
            `{\n` +
            `  "methodology": {\n` +
            `    "approach": "qualitative" | "quantitative" | "mixed_methods",\n` +
            `    "approachRationale": string,\n` +
            `    "population": {\n` +
            `      "targetPopulation": string,\n` +
            `      "samplingMethod": string,\n` +
            `      "sampleSizeJustification": string,\n` +
            `      "inclusionCriteria": string[]\n` +
            `    },\n` +
            `    "instruments": [{ "name": string, "type": string, "purpose": string, "validityConsiderations": string, "researchQuestionNumbers": number[] }],\n` +
            `    "dataCollectionPlan": string,\n` +
            `    "dataAnalysisPlan": string,\n` +
            `    "questionMapping": [{ "researchQuestionNumber": number, "researchQuestion": string, "approach": string, "instrument": string, "analysisMethod": string }],\n` +
            `    "limitations": string[]\n` +
            `  }\n` +
            `}\n\n` +
            "First decide the approach using a decision tree based on the research questions themselves: choose " +
            "'quantitative' if the questions ask about measurable variables, relationships, or comparisons between " +
            "groups; choose 'qualitative' if the questions ask about lived experiences, meanings, perceptions, or " +
            "processes; choose 'mixed_methods' if the questions combine both (e.g. one measurable, one experiential). " +
            "approachRationale should be 2-3 sentences explaining why, referencing the specific research questions " +
            "that drove the decision. " +
            "population.targetPopulation should name who/what will be studied. samplingMethod should name a specific " +
            "sampling technique (e.g. purposive, stratified random, convenience) appropriate to the approach and " +
            "explain briefly why it fits. sampleSizeJustification should give a concrete sample size or range and " +
            "justify it (e.g. saturation for qualitative, power/margin-of-error reasoning for quantitative). " +
            "inclusionCriteria should list 2-4 concrete eligibility criteria for participants/respondents. " +
            "IMPORTANT: close the population object immediately after inclusionCriteria — do not place instruments, " +
            "dataCollectionPlan, dataAnalysisPlan, questionMapping, or limitations inside it. " +
            "instruments should have 1-3 entries, each a concrete data collection instrument (e.g. structured survey, " +
            "semi-structured interview guide, validated scale name) with its purpose, and validityConsiderations " +
            "describing how validity/reliability (or trustworthiness, for qualitative) will be established — e.g. " +
            "pilot testing, expert validation, triangulation, member checking. Each instrument's " +
            "researchQuestionNumbers should list which numbered research question(s) it serves. " +
            "dataCollectionPlan should be 3-5 sentences describing the step-by-step procedure for gathering data. " +
            "dataAnalysisPlan should be 3-5 sentences describing the specific analysis technique(s) that match the " +
            "approach (e.g. thematic analysis, regression, descriptive statistics). " +
            "questionMapping must have exactly one entry per research question, in the same order given, restating " +
            "the question and summarizing in a few words which approach, instrument, and analysis method address it " +
            "— this is the artifact that ties the whole methodology back to each research question. " +
            "limitations should list 2-3 realistic methodological limitations of this design.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { methodology } = parsed;

    // Guard against a missing or malformed wrapper before it silently
    // becomes null columns in the database.
    if (!methodology || typeof methodology !== "object") {
      console.log("Malformed methodology response, raw:", rawText);
      return res.status(500).json({
        error: "AI response was missing the expected methodology data. Please try again.",
      });
    }

    const requiredFields = [
      "approach",
      "approachRationale",
      "population",
      "instruments",
      "dataCollectionPlan",
      "dataAnalysisPlan",
      "questionMapping",
      "limitations",
    ];

    const missingFields = requiredFields.filter(
      (f) => methodology[f] === undefined || methodology[f] === null
    );

    if (missingFields.length > 0) {
      console.log(
        `Methodology response missing fields: ${missingFields.join(", ")}`,
        JSON.stringify(methodology)
      );
      return res.status(500).json({
        error: `AI response was incomplete (missing: ${missingFields.join(", ")}). Please try again.`,
      });
    }

    // Also validate that population itself isn't missing its own required
    // sub-fields (e.g. if the model nests something differently again).
    const requiredPopulationFields = [
      "targetPopulation",
      "samplingMethod",
      "sampleSizeJustification",
      "inclusionCriteria",
    ];

    const missingPopulationFields = requiredPopulationFields.filter(
      (f) => methodology.population[f] === undefined || methodology.population[f] === null
    );

    if (missingPopulationFields.length > 0) {
      console.log(
        `Methodology response missing population sub-fields: ${missingPopulationFields.join(", ")}`,
        JSON.stringify(methodology.population)
      );
      return res.status(500).json({
        error: `AI response was incomplete (missing population fields: ${missingPopulationFields.join(", ")}). Please try again.`,
      });
    }

    const { error: saveError } = await supabase.from("methodology_responses").insert({
      user_id,
      topic,
      research_questions: researchQuestions,
      context: context?.trim() ? context : null,
      approach: methodology.approach,
      approach_rationale: methodology.approachRationale,
      population: methodology.population,
      instruments: methodology.instruments,
      data_collection_plan: methodology.dataCollectionPlan,
      data_analysis_plan: methodology.dataAnalysisPlan,
      question_mapping: methodology.questionMapping,
      limitations: methodology.limitations,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function DataAnalysis(req: Request, res: Response) {
  try {
    const { topic, approach, researchQuestions, gapStatement, rawFindings } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const topicCheck = checkMeaningfulText(topic, { required: true });
    if (!topicCheck.valid) {
      return res.status(400).json({ error: topicCheck.error, message: topicCheck.message });
    }

    if (!["qualitative", "quantitative", "mixed_methods"].includes(approach)) {
      return res.status(400).json({
        message: "Approach must be one of 'qualitative', 'quantitative', or 'mixed_methods'.",
      });
    }

    if (!Array.isArray(researchQuestions) || researchQuestions.length < MIN_RESEARCH_QUESTIONS_DA) {
      return res.status(400).json({
        message: "Please provide at least one research question.",
      });
    }

    if (researchQuestions.length > MAX_RESEARCH_QUESTIONS_DA) {
      return res.status(400).json({
        message: `Please provide no more than ${MAX_RESEARCH_QUESTIONS_DA} research questions at a time.`,
      });
    }

    for (const q of researchQuestions) {
      const qCheck = checkMeaningfulText(q, { required: true });
      if (!qCheck.valid) {
        return res.status(400).json({ error: qCheck.error, message: `Research question: ${qCheck.message}` });
      }
    }

    const rawFindingsCheck = checkMeaningfulText(rawFindings, { required: true });
    if (!rawFindingsCheck.valid) {
      return res.status(400).json({
        error: rawFindingsCheck.error,
        message: `Raw findings / data notes: ${rawFindingsCheck.message}`,
      });
    }

    const gapCheck = checkMeaningfulText(gapStatement);
    if (!gapCheck.valid) {
      return res.status(400).json({ error: gapCheck.error, message: gapCheck.message });
    }

    if (
      isImageRequest(topic) ||
      isImageRequest(gapStatement) ||
      isImageRequest(rawFindings) ||
      researchQuestions.some((q: string) => isImageRequest(q))
    ) {
      return res.status(400).json({
        error: IMAGE_REQUEST_ERROR,
        message: IMAGE_REQUEST_MESSAGE,
      });
    }

    const { allowed } = await checkDailyLimit(user_id, "dataAnalysis", DAILY_PROMPT_LIMIT);
    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const questionsBlock = researchQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n");

    const prompt = `
      Thesis topic: ${topic}

      Methodological approach: ${approach}

      Research questions:
      ${questionsBlock}

      Research gap (from Literature Review): ${gapStatement?.trim() ? gapStatement : "None provided."}

      Raw findings / data notes from the student:
      ${rawFindings}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a thesis advisor helping an undergraduate student work through Data Collection & Analysis. " +
            "Given their topic, approach, research questions, research gap, and raw findings/data notes, respond " +
            `ONLY with a JSON object shaped as: { "dataAnalysis": { ` +
            `"dataCleaningChecklist": string[], ` +
            `"analysisMethod": string, ` +
            `"analysisSteps": string[], ` +
            `"analysisRationale": string, ` +
            `"literatureConnectionPrompts": string[], ` +
            `"resultsSummary": string, ` +
            `"visualizations": [{ "title": string, "chartType": "bar" | "line" | "pie" | "scatter" | "table", "description": string, "whatItShows": string }] ` +
            `} }. ` +
            "dataCleaningChecklist should have 4-6 concrete checklist items appropriate to the approach (e.g. for " +
            "quantitative: checking for missing values, outliers, and correctly coding responses; for qualitative: " +
            "verifying transcript accuracy, anonymizing identifiers, organizing excerpts by theme). " +
            "analysisMethod should name the specific technique matching the approach (e.g. 'Thematic analysis' or " +
            "'Independent samples t-test'). analysisSteps should have 3-5 concrete step-by-step actions for running " +
            "that analysis on data like theirs. analysisRationale should be 1-2 sentences explaining why this " +
            "technique fits their research questions and approach. " +
            "literatureConnectionPrompts should have 2-4 reflective questions that prompt the student to explicitly " +
            "connect what they're finding back to the research gap identified in their literature review. " +
            "resultsSummary should be a 3-5 sentence EXAMPLE/TEMPLATE summary the student can adapt once they have " +
            "real analysis results — base its shape on their raw findings notes but do NOT invent specific numeric " +
            "results, p-values, or statistics as if they were real findings; write it as an illustrative template " +
            "(e.g. 'Participants reported [X]...' rather than fabricated percentages). " +
            "visualizations should have 2-4 suggested chart specs: title, chartType, description of what to plot " +
            "from data structured like theirs, and whatItShows explaining the insight each visualization would " +
            "reveal. These are recommendations for what the student should chart once they have real data, not " +
            "actual generated charts.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const rawText = result.choices[0].message.content || "";

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }

    const { dataAnalysis } = parsed;

    const { error: saveError } = await supabase.from("data_analysis_responses").insert({
      user_id,
      topic,
      approach,
      research_questions: researchQuestions,
      gap_statement: gapStatement?.trim() ? gapStatement : null,
      raw_findings: rawFindings,
      data_cleaning_checklist: dataAnalysis.dataCleaningChecklist,
      analysis_method: dataAnalysis.analysisMethod,
      analysis_steps: dataAnalysis.analysisSteps,
      analysis_rationale: dataAnalysis.analysisRationale,
      literature_connection_prompts: dataAnalysis.literatureConnectionPrompts,
      results_summary: dataAnalysis.resultsSummary,
      visualizations: dataAnalysis.visualizations,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json(parsed);
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function FullPaperReview(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Optional — lets this review get linked/cascaded alongside the other
    // stages for the same thesis topic, the same way every other stage
    // table is (DeleteTopicSelections matches full_paper_reviews rows by
    // this column).
    const topic: string | undefined = req.body?.topic;

    const files = req.files as Express.Multer.File[] | undefined;
    const paper = files?.[0];

    if (!paper) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF paper.",
      });
    }

    const isPDF =
      paper.mimetype === "application/pdf" ||
      paper.originalname.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
      return res.status(400).json({ success: false, message: "Only PDF files are allowed." });
    }

    const MAX_FILE_SIZE = 15 * 1024 * 1024;

    if (paper.size > MAX_FILE_SIZE) {
      return res.status(400).json({ success: false, message: "PDF must not exceed 15 MB." });
    }

    // Cost control: reviewing a full paper is the most expensive AI call in
    // this file (up to 180k chars of context), so it gets the same daily cap
    // as every other AI stage.
    const { allowed } = await checkDailyLimit(userId, "fullPaperReview", DAILY_PROMPT_LIMIT);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    let extractedText = "";
    const parser = new PDFParse({ data: paper.buffer });

    try {
      const result = await parser.getText();
      extractedText = result.text || "";
    } catch (error) {
      console.error("PDF extraction error:", error);
      return res.status(400).json({
        success: false,
        message: "Unable to read the PDF. Please make sure the file contains selectable text.",
      });
    } finally {
      // Always release the parser, even if getText() threw.
      await parser.destroy();
    }

    extractedText = cleanText(extractedText);

    if (extractedText.length < 500) {
      return res.status(400).json({
        success: false,
        message: "The PDF does not contain enough readable text to review.",
      });
    }

    const MAX_CHARS = 180000;
    const wasTruncated = extractedText.length > MAX_CHARS;
    const paperText = limitText(extractedText, MAX_CHARS);

    const basicAnalysis = analyzePaperStructure(extractedText);
    const citationAnalysis = analyzeCitations(extractedText);

const systemPrompt = `
You are an expert academic research-paper reviewer.

You are reviewing a thesis, capstone paper, research paper,
or academic proposal.

Your job is NOT to rewrite the paper.

Your job is to CHECK the paper and identify:

1. Structural problems
2. Missing sections
3. Weak sections
4. Internal inconsistencies
5. Contradictions
6. Problems between objectives and methodology
7. Problems between research questions and methodology
8. Problems between scope and system features
9. Citation/reference problems
10. Methodology problems
11. Grammar/academic-writing issues that materially affect
    clarity
12. Overall readiness

For every problem you identify, your primary job is to tell the
student how to IMPROVE the paper — the finding matters only as
context for the fix. Do not stop at flagging a mismatch or gap;
always follow it with the specific improvement that resolves it.

IMPORTANT:

- Only make claims supported by the submitted paper.
- Do not invent information.
- Do not assume missing information exists.
- If something cannot be determined, say "Not Found".
- Distinguish between "Missing" and "Not Applicable".
- If the document is clearly a proposal containing Chapters I-III,
  do NOT penalize it for not having Results, Discussion,
  Conclusion, or Recommendations.
- If it is a final paper, those sections should be evaluated.
- Objectives are not automatically research questions.
- A methodology must reasonably address the stated research
  questions/objectives.
- If two sections contradict each other, explicitly identify
  the contradiction and recommend the specific improvement that
  resolves it.
- Use concrete explanations.

RECOMMENDATION QUALITY STANDARD:

Every "recommendation" field you write (in sectionCheck,
methodologyCheck, citationAudit, and topPriorityFixes) must meet
ALL of the following, not just "be actionable" in a vague sense:

- Say WHAT to do, not just what is wrong. Never write a
  recommendation that only restates the finding (e.g. do not
  write finding: "No research questions were found." followed by
  recommendation: "Add research questions." — that repeats the
  problem instead of solving it).
- Say HOW to do it in concrete, near-final terms. Where possible,
  give the actual structure, wording pattern, or example the
  student should follow, not just the category of fix. For
  example, instead of "add a sample size," write "state the
  target population size, the sample size derived from it (e.g.
  via Slovin's formula or a stated confidence level/margin of
  error), and the exact number of respondents per group (e.g.
  X students, Y faculty, Z administrators)."
- Reference the specific content already in the paper when
  proposing the fix, so the recommendation is tailored to this
  paper rather than generic advice that could apply to any paper.
  Pull in the actual titles, terms, features, objectives, or
  citations already used in the document wherever relevant.
- Where a fix requires a choice (e.g. which sampling method, which
  statistical test, which citation style), recommend ONE specific,
  defensible option suited to this paper's stated design, and
  briefly say why it fits, rather than listing multiple options
  and leaving the choice to the student.
- If the fix involves resolving a contradiction between two
  sections, explicitly say which of the two versions to keep (or
  how to reconcile them into one consistent version), not just
  "make these consistent."
- Order multi-step recommendations as a short numbered or
  sequential set of concrete actions when more than one step is
  required, rather than one vague sentence covering everything.
- Keep recommendations grounded in standard academic/thesis
  conventions (e.g. IMRaD structure, Likert-scale validity and
  reliability practices such as Cronbach's alpha, standard
  citation styles like APA 7th edition, Slovin's formula or
  Cochran's formula for sample size) so the advice reflects
  real methodological practice, not invented terminology.
- Never give a recommendation that conflicts with something else
  you are recommending elsewhere in the same review.
- Frame every recommendation around improving the paper the
  student actually submitted — write it as guidance the student
  can act on directly, not as a report of what doesn't match.

Give actionable recommendations.

DOCUMENT STAGE:

First determine whether this is:

"Proposal"
"Final Paper"
"Unclear"

A Chapters I-III document should normally be treated as a
Proposal unless the document explicitly indicates otherwise.

STRUCTURE FOR A PROPOSAL:

- Background / Introduction
- Statement of the Problem
- Research Questions
- Objectives
- Significance of the Study
- Scope and Delimitation
- Definition of Terms
- Review of Related Literature
- Review of Related Studies
- Theoretical/Conceptual Framework
- Research Design
- Population and Sampling
- Research Instrument
- Data Gathering Procedure
- Statistical Treatment

STRUCTURE FOR A FINAL PAPER:

All proposal sections plus:

- Presentation of Data
- Analysis
- Discussion
- Summary
- Conclusion
- Recommendations

WHAT TO EXAMINE ACROSS THE PAPER:

Read the paper as a whole and identify where the title, problem,
research questions, objectives, scope, features/system functions,
methodology, respondents, instrument, statistical treatment, and
conclusions (if applicable) don't hold together as one coherent
paper. When you find a gap or contradiction, report it as a single
improvement the student should make — describe what the paper
currently says, what it should say instead to be coherent, and
why, rather than listing it as a comparison between two sections.

PAY SPECIAL ATTENTION TO AND RECOMMEND FIXES FOR:

- Features claimed as included but later excluded
- Features claimed as excluded but later evaluated
- Research questions that are not addressed by methodology
- Objectives that cannot be measured
- Methodology that does not match objectives
- Missing population/sample size
- Missing sampling procedure
- Missing data gathering procedure
- Missing validation/reliability information
- Unsupported claims
- References that do not appear to have corresponding
  in-text citations
- In-text citations that appear to have no reference entry
- Inconsistent author/year citations
- Duplicate or suspicious references
- Inconsistent terminology
- Inconsistent system title
- Inconsistent capitalization
- Inconsistent AI terminology
- Inconsistent naming of system features

READINESS SCORE:

0-39   = Not Ready
40-59  = Needs Major Revision
60-74  = Needs Revision
75-89  = Nearly Ready
90-100 = Ready

For "topPriorityFixes" specifically: list them in priority order
(most critical/blocking first), and write each one as a concrete
improvement the student can execute this week, following the
RECOMMENDATION QUALITY STANDARD above — not a one-line restatement
of a weakness.

Return ONLY valid JSON.
`;

const userPrompt = `
Review the following academic paper. Your goal is to help the
student improve this specific paper — every finding should lead
to a concrete recommendation for how to make the paper better,
not just a description of what's wrong or which sections don't
match each other.

==============================
BASIC AUTOMATED ANALYSIS
==============================

${JSON.stringify(basicAnalysis, null, 2)}

==============================
AUTOMATED CITATION ANALYSIS
==============================

${JSON.stringify(citationAnalysis, null, 2)}

==============================
FULL PAPER
==============================

${paperText}

==============================
REQUIRED JSON
==============================

Return exactly this structure:

{
  "review": {
    "documentStage": {
      "detected": "Proposal",
      "confidence": "High",
      "reason": ""
    },

    "chapterDetection": {
      "chaptersFound": [],
      "missingOrUnclear": []
    },

    "sectionCheck": [
      {
        "section": "",
        "status": "Present",
        "severity": "None",
        "finding": "",
        "recommendation": ""
      }
    ],

    "consistencyCheck": [
      {
        "check": "",
        "result": "Pass",
        "severity": "None",
        "detail": ""
      }
    ],

    "methodologyCheck": {
      "status": "Pass",
      "issues": [],
      "recommendations": []
    },

    "citationAudit": {
      "status": "Pass",
      "issuesFound": [],
      "recommendations": []
    },

    "contentQuality": {
      "strengths": [],
      "weaknesses": [],
      "contradictions": []
    },

    "writingQuality": {
      "majorIssues": [],
      "minorIssues": []
    },

    "overallReadiness": {
      "score": 0,
      "label": "Needs Revision",
      "summary": "",
      "topPriorityFixes": []
    }
  }
}

For "consistencyCheck", write each "check" as the improvement
being addressed (e.g. "Aligning the system title used throughout
the paper") rather than as an "X vs Y" comparison label, and write
"detail" as what to change and why — not just what doesn't match.

Every "recommendation" and every entry in "recommendations" or
"topPriorityFixes" must follow the RECOMMENDATION QUALITY STANDARD
from the system instructions: concrete, specific to this paper's
actual content, and tell the student exactly what to write or do
next to improve the paper — not a restatement of the problem.

Allowed section statuses:

"Present"
"Partial"
"Missing"
"Unclear"
"Not Applicable"

Allowed severity:

"None"
"Low"
"Medium"
"High"
"Critical"

Allowed consistency results:

"Pass"
"Partial"
"Mismatch"
"Not Found"
"Not Applicable"

Allowed methodology/citation status:

"Pass"
"Needs Revision"
"Major Revision"
"Not Enough Evidence"
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ success: false, message: "AI returned an empty response." });
    }

    let review;

    try {
      review = JSON.parse(content);
    } catch (error) {
      console.error("AI JSON parsing error:", content);
      return res.status(500).json({
        success: false,
        message: "AI returned an invalid review format.",
      });
    }

    if (review?.review?.overallReadiness?.score !== undefined) {
      let score = Number(review.review.overallReadiness.score);

      if (Number.isNaN(score)) score = 0;
      score = Math.max(0, Math.min(100, Math.round(score)));

      review.review.overallReadiness.score = score;
      review.review.overallReadiness.label = getReadinessLabel(score);
    }

    // The AI schema only produces a per-section `sectionCheck` array — the
    // frontend's FullPaperReviewResult type expects an aggregate
    // `structuralCompliance` object (requiredSectionsPresent/Total + a
    // missing list), so it's derived here rather than left undefined.
    if (Array.isArray(review?.review?.sectionCheck)) {
      const applicable = review.review.sectionCheck.filter(
        (s: any) => s.status !== "Not Applicable"
      );
      const present = applicable.filter(
        (s: any) => s.status === "Present" || s.status === "Partial"
      );
      const missing = applicable
        .filter((s: any) => s.status === "Missing" || s.status === "Unclear")
        .map((s: any) => s.section);

      review.review.structuralCompliance = {
        requiredSectionsPresent: present.length,
        requiredSectionsTotal: applicable.length,
        missing,
      };
    }

    // Persist the review so GetFullPaperReviews / the topic-cascade delete
    // have something to read. Columns match SavedFullPaperReview exactly
    // (chapter_detection / consistency_check / citation_audit /
    // structural_compliance / overall_readiness as individual jsonb
    // columns) — a prior version of this insert used different ad-hoc
    // column names (readiness_score, automated_analysis, a single `review`
    // blob, etc.), which meant every saved row came back with all of those
    // fields undefined once read through SavedFullPaperReview.
    const { error: saveError } = await supabase.from("full_paper_reviews").insert({
      user_id: userId,
      topic: topic ?? null,
      file_name: paper.originalname,
      document_stage: review?.review?.documentStage ?? null,
      chapter_detection: review?.review?.chapterDetection ?? null,
      section_check: review?.review?.sectionCheck ?? null,
      consistency_check: review?.review?.consistencyCheck ?? null,
      methodology_check: review?.review?.methodologyCheck ?? null,
      citation_audit: review?.review?.citationAudit ?? null,
      content_quality: review?.review?.contentQuality ?? null,
      writing_quality: review?.review?.writingQuality ?? null,
      structural_compliance: review?.review?.structuralCompliance ?? null,
      overall_readiness: review?.review?.overallReadiness ?? null,
    });

    if (saveError) {
      console.log(saveError);
      // Not returning an error here — the AI response is still valid even if the save fails
    }

    return res.status(200).json({
      success: true,
      file: {
        name: paper.originalname,
        size: paper.size,
        type: paper.mimetype,
      },
      statistics: {
        characters: extractedText.length,
        words: countWords(extractedText),
        pages: basicAnalysis.estimatedPages,
        truncated: wasTruncated,
      },
      automatedAnalysis: {
        structure: basicAnalysis,
        citations: citationAnalysis,
      },
      review,
    });
  } catch (error) {
    console.error("FullPaperReview error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong while reviewing the paper.",
    });
  }
}

// GET ALL RESPONSES FROM THE DATABASE

export async function GetLiteratureReviews(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/literature-reviews?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("literature_reviews")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your literature reviews. Please try again.",
      });
    }

    return res.status(200).json({
      reviews: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

export async function GetTopicSelections(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/topic-selections?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("topic_selection_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your topic selection history. Please try again.",
      });
    }

    return res.status(200).json({
      topics: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL METHODOLOGY RESPONSES FOR THE USER
export async function GetMethodologies(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/methodologies?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("methodology_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your methodology history. Please try again.",
      });
    }

    return res.status(200).json({
      methodologies: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL DATA ANALYSIS RESPONSES FOR THE USER
export async function GetDataAnalyses(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    // Optional pagination via query params: /ai/data-analyses?limit=10&offset=0
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("data_analysis_responses")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your data analysis history. Please try again.",
      });
    }

    return res.status(200).json({
      dataAnalyses: data,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// GET ALL PAPER REVIEW RESPONSES FOR THE USER
export async function GetFullPaperReviews(req: Request, res: Response) {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from("full_paper_reviews")
      .select("*", { count: "exact" })
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not fetch your paper reviews. Please try again.",
      });
    }

    // Normalize each row so chapter_detection / consistency_check /
    // citation_audit / structural_compliance / overall_readiness are
    // always real objects — some existing rows have these stored as an
    // escaped JSON string rather than a parsed jsonb value (see
    // parseJsonColumn above).
    const reviews = (data ?? []).map((row: any) => ({
      ...row,
      chapter_detection: parseJsonColumn(row.chapter_detection),
      consistency_check: parseJsonColumn(row.consistency_check),
      citation_audit: parseJsonColumn(row.citation_audit),
      structural_compliance: parseJsonColumn(row.structural_compliance),
      overall_readiness: parseJsonColumn(row.overall_readiness),
    }));

    return res.status(200).json({
      reviews,
      total: count ?? data.length,
      limit,
      offset,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// DELETE A TOPIC SELECTION
export async function DeleteTopicSelections(req: Request, res: Response) {
  try {
    const { id } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!id) {
      return res.status(400).json({ message: "Topic selection id is required." });
    }

    // Fetch the topic text first — the other stage tables aren't linked by a
    // foreign key, they're matched by topic text (same as the frontend's
    // auto-match logic), so we need this before we can cascade the delete.
    const { data: topicRow, error: fetchError } = await supabase
      .from("topic_selection_responses")
      .select("topic")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !topicRow) {
      return res.status(404).json({
        message: "Topic selection not found, or you don't have permission to delete it.",
      });
    }

    const topic = topicRow.topic;

    // Delete the topic selection itself. Scoping every delete to user_id
    // ensures a user can only delete their own rows, even if they somehow
    // guess or intercept another user's id.
    const { error, data } = await supabase
      .from("topic_selection_responses")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id)
      .select();

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not delete this topic selection. Please try again.",
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Topic selection not found, or you don't have permission to delete it.",
      });
    }

    // Cascade: delete every downstream stage tied to the same topic + user.
    // Each is run independently and logged on failure rather than aborting —
    // the topic selection is already gone at this point, so a partial cascade
    // failure shouldn't be reported as if nothing was deleted.
    const tableNames = [
      "literature_reviews",
      "methodology_responses",
      "data_analysis_responses",
      "full_paper_reviews",
    ];

    const cascadeResults = await Promise.allSettled(
      tableNames.map((table) =>
        supabase.from(table).delete().eq("topic", topic).eq("user_id", user_id)
      )
    );

    cascadeResults.forEach((result, i) => {
      if (result.status === "rejected") {
        console.log(`Cascade delete failed for ${tableNames[i]}:`, result.reason);
      } else if (result.value.error) {
        console.log(`Cascade delete failed for ${tableNames[i]}:`, result.value.error);
      }
    });

    return res.status(200).json({
      message: "Topic selection and all related stages deleted successfully.",
      deletedId: id,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}