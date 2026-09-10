"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAILY_PROMPT_LIMIT = exports.openai = void 0;
exports.isGibberish = isGibberish;
exports.checkMeaningfulText = checkMeaningfulText;
exports.extractRequestedCount = extractRequestedCount;
exports.RecommendedAI = RecommendedAI;
exports.TopicSelection = TopicSelection;
exports.LiteratureReview = LiteratureReview;
exports.Methodology = Methodology;
exports.DataAnalysis = DataAnalysis;
exports.FullPaperReview = FullPaperReview;
exports.GetLiteratureReviews = GetLiteratureReviews;
exports.GetTopicSelections = GetTopicSelections;
exports.GetMethodologies = GetMethodologies;
exports.GetDataAnalyses = GetDataAnalyses;
exports.GetFullPaperReviews = GetFullPaperReviews;
exports.DeleteTopicSelections = DeleteTopicSelections;
const supa_client_1 = require("../supabase/supa-client");
const openai_1 = __importDefault(require("openai"));
const checkDailyLimit_1 = require("../lib/checkDailyLimit");
const pdf_parse_1 = require("pdf-parse");
exports.openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
exports.DAILY_PROMPT_LIMIT = 5;
const MIN_RESEARCH_QUESTIONS_DA = 1;
const MAX_RESEARCH_QUESTIONS_DA = 6;
// --- helpers to detect "give me 10 titles" / "at least 8 recommendations" etc. ---
const NUMBER_WORDS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
    fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
};
const DAILY_PROMPT_LIMIT_PAPER_REVIEW = 3; // heavier op — lower daily cap than the other stages
// ---------------------------------------------------------
// Chapter detection — splits raw extracted PDF text into
// chapter chunks using common heading patterns. Falls back
// to a single "Full Document" chunk if no headings are found.
// ---------------------------------------------------------
function splitIntoChapters(rawText) {
    const headingRegex = /^\s*(CHAPTER\s+[1-5IVX]+[:\-\s]*.*|Chapter\s+[1-5IVX]+[:\-\s]*.*)\s*$/gim;
    const matches = [...rawText.matchAll(headingRegex)];
    if (matches.length === 0) {
        return [{ chapter: "Full Document", content: rawText }];
    }
    const chunks = [];
    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index ?? 0;
        const end = i + 1 < matches.length ? matches[i + 1].index ?? rawText.length : rawText.length;
        const heading = matches[i][0].trim();
        const content = rawText.slice(start, end).trim();
        chunks.push({ chapter: heading, content });
    }
    return chunks;
}
// ---------------------------------------------------------
// Lightweight in-text citation vs reference-list cross-check.
// Not a substitute for the AI pass — just a fast deterministic
// signal the AI prompt can be grounded against.
// ---------------------------------------------------------
function auditCitations(rawText) {
    // crude APA in-text pattern: (Author, Year) or (Author et al., Year)
    const inTextMatches = rawText.match(/\([A-Z][a-zA-Z.\-]+(?:\s+et al\.)?,\s*\d{4}\)/g) || [];
    // crude reference-list entry pattern: "Author, A. A. (Year)."
    const referenceMatches = rawText.match(/^[A-Z][a-zA-Z.\-]+,\s*[A-Z]\.[^\n]*\(\d{4}\)\./gm) || [];
    return {
        inTextCount: inTextMatches.length,
        referenceListCount: referenceMatches.length,
        possiblyUncitedInReferences: Math.max(0, referenceMatches.length - inTextMatches.length),
    };
}
function isGibberish(text) {
    if (!text || text.trim().length === 0)
        return false;
    const words = text.trim().split(/\s+/);
    const gibberishWordCount = words.filter((word) => {
        if (word.length <= 2)
            return false;
        if (/(.)\1{3,}/.test(word))
            return true;
        const vowels = (word.match(/[aeiou]/g) || []).length;
        const vowelRatio = vowels / word.length;
        if (word.length >= 4 && vowelRatio < 0.1)
            return true;
        if (/^([qwerty]{4,}|[asdfgh]{4,}|[zxcvbn]{4,}|[yuiop]{4,})$/i.test(word))
            return true;
        if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(word))
            return true;
        return false;
    }).length;
    return gibberishWordCount / words.length > 0.5;
}
/**
 * Validates that `text` is meaningful enough to send to the model.
 * - `required: false` (default) — empty text passes (field is optional, like chatPrompt)
 * - `required: true` — empty text fails (field is mandatory, like topic)
 */
function checkMeaningfulText(text, { required = false } = {}) {
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
function extractRequestedCount(text) {
    // "10 titles", "8 recommendations", "12 thesis suggestions"
    const digitMatch = text.match(/\b(\d{1,3})\s*(?:titles?|recommendations?|suggestions?|thesis(?:es)?|topics?)\b/i);
    if (digitMatch)
        return parseInt(digitMatch[1], 10);
    // "ten titles", "fifteen suggestions"
    const wordMatch = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b\s*(?:titles?|recommendations?|suggestions?|thesis(?:es)?|topics?)/i);
    if (wordMatch)
        return NUMBER_WORDS[wordMatch[1].toLowerCase()];
    // "more than 5", "at least 10", "over 6"
    const moreThanMatch = text.match(/(?:more than|at least|over|above)\s*(\d{1,3})/i);
    if (moreThanMatch)
        return parseInt(moreThanMatch[1], 10) + 1;
    return null;
}
async function RecommendedAI(req, res) {
    try {
        const { course, chatPrompt } = req.body;
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
        const isImageRequest = /(can\s+you\s+(make|create|generate|draw|design|render|show|give|send|produce)|please\s+(make|create|generate|draw|design|render|show|give|send|produce)).*?(image|picture|photo|art|artwork|illustration|logo|poster|graphic|visual|diagram|thumbnail)|^(generate|create|draw|make|design|render|illustrate|paint|sketch|show|give|send|produce)\s.*(image|picture|photo|art|artwork|illustration|logo|poster|graphic|visual|diagram|thumbnail)|\b(image|picture|photo|artwork|illustration|logo|poster|graphic|visual|thumbnail)\b/i.test(promptText);
        if (isImageRequest) {
            return res.status(400).json({
                error: "Unsupported request",
                message: "Sorry, I can only generate thesis title recommendations. I'm not able to create images, photos, or any visual content. Please enter a thesis-related instruction instead.",
            });
        }
        const isOffTopicRequest = /(write|generate|create|make|give|provide|suggest|draft|compose|produce).*(review|literature|abstract|introduction|conclusion|methodology|chapter|paragraph|essay|paper|article|content|text|report|summary|outline|research\s+paper|related\s+studies|background|discussion|analysis|findings|recommendation(?!s?\s+title))/i.test(promptText) ||
            /(literature\s+review|related\s+literature|related\s+studies|research\s+paper|study\s+guide|essay\s+writing|content\s+writing|thesis\s+writing|chapter\s+[1-5])/i.test(promptText) ||
            /\b(rrl|rrls|r\.r\.l|related\s+research\s+literature|review\s+of\s+related\s+literature|review\s+of\s+related\s+studies|rrs)\b/i.test(promptText);
        if (isOffTopicRequest) {
            return res.status(400).json({
                error: "Unsupported request",
                message: "I can only generate thesis title recommendations and their features. Writing literature reviews, abstracts, introductions, or any thesis content is not supported here.",
            });
        }
        // --- NEW: reject requests asking for more than 5 titles before calling the AI ---
        const requestedCount = extractRequestedCount(promptText);
        if (requestedCount && requestedCount > 5) {
            return res.status(400).json({
                error: "Request exceeds limit",
                message: `I can only generate up to 5 thesis title recommendations at a time. You asked for ${requestedCount} — please rephrase your request within that limit.`,
            });
        }
        const isEntrepCourse = /entrepreneurship/i.test(course);
        const { data: thesisPool, error: fetchError } = await supa_client_1.supabase
            .from("Thesis")
            .select("id, title, thesis_introduction, entrep_intro")
            .ilike("course", `%${course}%`);
        if (fetchError) {
            return res.status(500).json({ message: "Failed to fetch existing theses", error: fetchError });
        }
        const existingTheses = thesisPool
            ? [...thesisPool].sort(() => Math.random() - 0.5).slice(0, 5)
            : [];
        const { allowed, count } = await (0, checkDailyLimit_1.checkDailyLimit)(user_id, "thesisRecommendation", exports.DAILY_PROMPT_LIMIT);
        if (!allowed) {
            return res.status(429).json({
                error: "Daily limit reached",
                message: `You've reached your daily limit of ${exports.DAILY_PROMPT_LIMIT} prompts. Please try again.`,
                remaining: 0,
            });
        }
        const { data: previousRecs } = await supa_client_1.supabase
            .from("thesisRecommendation")
            .select("response")
            .eq("user_id", user_id)
            .eq("course", course)
            .order("created_at", { ascending: false })
            .limit(3);
        const previousTitles = (previousRecs || [])
            .flatMap((r) => (Array.isArray(r.response) ? r.response.map((rec) => rec.title) : []))
            .filter(Boolean);
        const hasExisting = existingTheses && existingTheses.length > 0;
        const existingBlock = hasExisting
            ? existingTheses
                .map((t, i) => {
                const intro = isEntrepCourse ? t.entrep_intro : t.thesis_introduction;
                return `[${i + 1}] Title: "${t.title}"\n     Introduction: ${intro ? intro.slice(0, 300) + "..." : "No introduction available."}`;
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

      ${hasExisting
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
      `}
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
        const result = await exports.openai.chat.completions.create({
            model: "gpt-5.4-mini",
            reasoning_effort: "none",
            temperature: 1.0,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are an academic advisor. You ONLY generate thesis title recommendations, summaries, new features, and tags. You do NOT write literature reviews, abstracts, introductions, essays, or any thesis content. Return only valid JSON in the form { \"recommendations\": [...] }.",
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
        }
        catch {
            return res.status(500).json({
                error: "AI returned invalid JSON. Please try again.",
            });
        }
        const { error: insertError } = await supa_client_1.supabase
            .from("thesisRecommendation")
            .insert([{ user_id, course, chatPrompt, response: parsed }]);
        if (insertError) {
            return res.status(500).json({ message: "Failed to insert response", error: insertError });
        }
        return res.status(200).json({
            recommendations: parsed,
            based_on_existing: hasExisting,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
async function TopicSelection(req, res) {
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
        const { allowed } = await (0, checkDailyLimit_1.checkDailyLimit)(user_id, "topicSelection", exports.DAILY_PROMPT_LIMIT);
        if (!allowed) {
            return res.status(429).json({
                error: "Daily limit reached",
                message: `You've reached your daily limit of ${exports.DAILY_PROMPT_LIMIT} prompts. Please try again.`,
                remaining: 0,
            });
        }
        const prompt = `
      Topic / research area: ${topic}

      Additional context: ${context?.trim() ? context : "None provided."}
    `;
        const result = await exports.openai.chat.completions.create({
            model: "gpt-5.4-mini",
            reasoning_effort: "none",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are a thesis advisor helping an undergraduate student narrow down a thesis topic. " +
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
        }
        catch {
            return res.status(500).json({
                error: "AI returned invalid JSON. Please try again.",
            });
        }
        const { guidance } = parsed;
        const { error: saveError } = await supa_client_1.supabase.from("topic_selection_responses").insert({
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
async function LiteratureReview(req, res) {
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
        const { allowed } = await (0, checkDailyLimit_1.checkDailyLimit)(user_id, "literatureReview", exports.DAILY_PROMPT_LIMIT);
        if (!allowed) {
            return res.status(429).json({
                error: "Daily limit reached",
                message: `You've reached your daily limit of ${exports.DAILY_PROMPT_LIMIT} prompts. Please try again.`,
                remaining: 0,
            });
        }
        // --- Use a browsing-capable model (Responses API + web_search tool). ---
        // The model must actually retrieve each source via the tool — it's told
        // never to write a url from memory.
        const instructions = "You are a thesis advisor helping an undergraduate student build their Review of Related " +
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
        const response = await exports.openai.responses.create({
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
        }
        catch {
            return res.status(500).json({
                error: "AI returned invalid JSON. Please try again.",
            });
        }
        if (!Array.isArray(parsed.annotatedBibliography) || parsed.annotatedBibliography.length === 0) {
            return res.status(404).json({
                message: "Couldn't find sources for this topic. Try broadening or rephrasing it.",
            });
        }
        // --- Cross-check every url against what the tool actually retrieved. ---
        // Even with browsing, a model can occasionally slip in a url it didn't
        // really visit — so we only trust urls backed by a real url_citation
        // annotation from the tool call, and drop anything else.
        const groundedUrls = new Set();
        for (const item of response.output ?? []) {
            if (item.type === "message") {
                for (const part of item.content ?? []) {
                    if (part.type !== "output_text")
                        continue;
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
            const verified = annotatedBibliography.filter((entry) => groundedUrls.has(entry.url));
            unverifiedDropped = annotatedBibliography.length - verified.length;
            annotatedBibliography = verified;
        }
        if (annotatedBibliography.length < 3) {
            return res.status(404).json({
                message: "Couldn't verify enough real sources for this topic. Try broadening or rephrasing it.",
            });
        }
        // -----------------------------------------------------------
        // Persist the AI response to Postgres (via Supabase) — single table.
        // Failure to save should not break the response to the client —
        // we log it and still return the result.
        // -----------------------------------------------------------
        try {
            const { error: saveError } = await supa_client_1.supabase.from("literature_reviews").insert({
                user_id,
                topic,
                source_count: annotatedBibliography.length,
                unverified_dropped: unverifiedDropped,
                annotated_bibliography: annotatedBibliography,
            });
            if (saveError)
                throw saveError;
        }
        catch (persistError) {
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
async function Methodology(req, res) {
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
        const { allowed } = await (0, checkDailyLimit_1.checkDailyLimit)(user_id, "methodology", exports.DAILY_PROMPT_LIMIT);
        if (!allowed) {
            return res.status(429).json({
                error: "Daily limit reached",
                message: `You've reached your daily limit of ${exports.DAILY_PROMPT_LIMIT} prompts. Please try again.`,
                remaining: 0,
            });
        }
        const questionsBlock = researchQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
        const prompt = `
      Thesis topic: ${topic}

      Research questions:
      ${questionsBlock}

      Additional context: ${context?.trim() ? context : "None provided."}
    `;
        const result = await exports.openai.chat.completions.create({
            model: "gpt-5.4-mini",
            reasoning_effort: "none",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are a thesis advisor helping an undergraduate student design their Methodology chapter. " +
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
        }
        catch {
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
        const missingFields = requiredFields.filter((f) => methodology[f] === undefined || methodology[f] === null);
        if (missingFields.length > 0) {
            console.log(`Methodology response missing fields: ${missingFields.join(", ")}`, JSON.stringify(methodology));
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
        const missingPopulationFields = requiredPopulationFields.filter((f) => methodology.population[f] === undefined || methodology.population[f] === null);
        if (missingPopulationFields.length > 0) {
            console.log(`Methodology response missing population sub-fields: ${missingPopulationFields.join(", ")}`, JSON.stringify(methodology.population));
            return res.status(500).json({
                error: `AI response was incomplete (missing population fields: ${missingPopulationFields.join(", ")}). Please try again.`,
            });
        }
        const { error: saveError } = await supa_client_1.supabase.from("methodology_responses").insert({
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
async function DataAnalysis(req, res) {
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
        const { allowed } = await (0, checkDailyLimit_1.checkDailyLimit)(user_id, "dataAnalysis", exports.DAILY_PROMPT_LIMIT);
        if (!allowed) {
            return res.status(429).json({
                error: "Daily limit reached",
                message: `You've reached your daily limit of ${exports.DAILY_PROMPT_LIMIT} prompts. Please try again.`,
                remaining: 0,
            });
        }
        const questionsBlock = researchQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");
        const prompt = `
      Thesis topic: ${topic}
 
      Methodological approach: ${approach}
 
      Research questions:
      ${questionsBlock}
 
      Research gap (from Literature Review): ${gapStatement?.trim() ? gapStatement : "None provided."}
 
      Raw findings / data notes from the student:
      ${rawFindings}
    `;
        const result = await exports.openai.chat.completions.create({
            model: "gpt-5.4-mini",
            reasoning_effort: "none",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are a thesis advisor helping an undergraduate student work through Data Collection & Analysis. " +
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
        }
        catch {
            return res.status(500).json({
                error: "AI returned invalid JSON. Please try again.",
            });
        }
        const { dataAnalysis } = parsed;
        const { error: saveError } = await supa_client_1.supabase.from("data_analysis_responses").insert({
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
async function FullPaperReview(req, res) {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        // File upload is now OPTIONAL — a student can either upload a PDF or
        const files = req.files;
        const thesis_file = files?.[0];
        // --- Manual section input (used when no file is uploaded, or to
        // supplement one) ---
        const { thesis_abstract, thesis_introduction, thesis_methodology, thesis_discussion, thesis_conclusion, thesis_references, } = req.body;
        const manualSections = [
            { chapter: "Abstract", content: thesis_abstract },
            { chapter: "Introduction", content: thesis_introduction },
            { chapter: "Methodology", content: thesis_methodology },
            { chapter: "Discussion", content: thesis_discussion },
            { chapter: "Conclusion", content: thesis_conclusion },
            { chapter: "References", content: thesis_references },
        ].filter((s) => !!s.content?.trim());
        const hasFile = !!thesis_file;
        const hasManualText = manualSections.length > 0;
        if (!hasFile && !hasManualText) {
            return res.status(400).json({
                status: false,
                message: "Upload a PDF, or type in your thesis sections (abstract, introduction, etc.) to proceed.",
            });
        }
        // --- File validation (only applies if a file was actually uploaded) ---
        if (hasFile) {
            if (thesis_file.mimetype !== "application/pdf") {
                return res.status(400).json({ status: false, message: "Only PDF files are allowed" });
            }
            const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
            if (thesis_file.size > MAX_FILE_BYTES) {
                return res.status(400).json({ message: "File is too large. Max size is 15MB." });
            }
        }
        const { allowed } = await (0, checkDailyLimit_1.checkDailyLimit)(user_id, "fullPaperReview", DAILY_PROMPT_LIMIT_PAPER_REVIEW);
        if (!allowed) {
            return res.status(429).json({
                error: "Daily limit reached",
                message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT_PAPER_REVIEW} paper reviews. Please try again tomorrow.`,
                remaining: 0,
            });
        }
        // --- Build extractedText + chapters from either the PDF or manual input ---
        let extractedText;
        let chapters;
        if (hasFile) {
            try {
                const parser = new pdf_parse_1.PDFParse({ data: thesis_file.buffer });
                const result = await parser.getText();
                extractedText = result.text;
                await parser.destroy(); // release underlying resources
            }
            catch (extractError) {
                console.log("PDF extraction failed:", extractError);
                return res.status(400).json({
                    message: "Couldn't read this PDF. It may be scanned/image-based or corrupted.",
                });
            }
            // If manual sections were ALSO provided alongside the file, append them
            // so both sources feed the review.
            if (hasManualText) {
                const manualBlock = manualSections.map((s) => `--- ${s.chapter} (typed in manually) ---\n${s.content}`).join("\n\n");
                extractedText = `${extractedText}\n\n${manualBlock}`;
            }
            chapters = splitIntoChapters(extractedText);
        }
        else {
            // No file — build chapters directly from the manually typed sections.
            // These are already labeled, so we skip the heuristic chapter splitter.
            chapters = manualSections;
            extractedText = manualSections.map((s) => `${s.chapter}\n${s.content}`).join("\n\n");
        }
        const textCheck = checkMeaningfulText(extractedText, { required: true });
        if (!textCheck.valid) {
            return res.status(400).json({
                error: textCheck.error,
                message: "Couldn't find enough meaningful text to review. Please upload a clearer PDF or add more detail to the typed sections.",
            });
        }
        if (extractedText.length > 200000) {
            // guard against runaway token usage on very long documents
            extractedText = extractedText.slice(0, 200000);
        }
        const citationAudit = auditCitations(extractedText);
        // --- Pull the student's own saved artifacts to check consistency against ---
        const [{ data: topicRows }, { data: methodRows }, { data: litRows }, { data: dataRows }] = await Promise.all([
            supa_client_1.supabase
                .from("topic_selection_responses")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", { ascending: false })
                .limit(1),
            supa_client_1.supabase
                .from("methodology_responses")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", { ascending: false })
                .limit(1),
            supa_client_1.supabase
                .from("literature_reviews")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", { ascending: false })
                .limit(1),
            supa_client_1.supabase
                .from("data_analysis_responses")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", { ascending: false })
                .limit(1),
        ]);
        const savedArtifacts = {
            topic: topicRows?.[0]?.topic ?? null,
            refinedTopics: topicRows?.[0]?.refined_topics ?? null,
            researchQuestions: topicRows?.[0]?.suggested_research_questions ?? null,
            methodologyApproach: methodRows?.[0]?.approach ?? null,
            methodologyQuestionMapping: methodRows?.[0]?.question_mapping ?? null,
            literatureSourceCount: litRows?.[0]?.source_count ?? null,
            dataAnalysisMethod: dataRows?.[0]?.analysis_method ?? null,
        };
        const chaptersBlock = chapters
            .map((c, i) => `--- ${c.chapter || `Section ${i + 1}`} ---\n${c.content.slice(0, 8000)}`)
            .join("\n\n");
        const prompt = `
      STUDENT'S SAVED WORK FROM EARLIER STAGES (for consistency checking):
      ${JSON.stringify(savedArtifacts, null, 2)}

      DETERMINISTIC CITATION SCAN (pre-computed, for reference — verify/refine, don't just repeat):
      In-text citations found: ${citationAudit.inTextCount}
      Reference list entries found: ${citationAudit.referenceListCount}
      Reference entries possibly missing an in-text citation: ${citationAudit.possiblyUncitedInReferences}

      EXTRACTED PAPER TEXT (chunked by detected chapter/section):
      ${chaptersBlock}
    `;
        const result = await exports.openai.chat.completions.create({
            model: "gpt-5.4",
            reasoning_effort: "none",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are a thesis advisor reviewing a student's full uploaded thesis draft. Compare the extracted " +
                        "paper text against the student's own saved earlier-stage work (topic, research questions, " +
                        "methodology, literature review) to check for inconsistencies, and audit structure/citations. " +
                        "Respond ONLY with a JSON object shaped as: " +
                        `{ "review": { ` +
                        `"chapterDetection": { "chaptersFound": string[], "missingOrUnclear": string[] }, ` +
                        `"consistencyCheck": [{ "check": string, "result": "Pass" | "Partial" | "Mismatch" | "Not Found", "detail": string }], ` +
                        `"citationAudit": { "issuesFound": string[], "status": string }, ` +
                        `"structuralCompliance": { "requiredSectionsPresent": number, "requiredSectionsTotal": number, "missing": string[] }, ` +
                        `"overallReadiness": { "score": string, "topPriorityFixes": string[] } ` +
                        `} }. ` +
                        "chapterDetection: list which chapters were clearly identifiable in the text and which required " +
                        "sections seem missing or unclear. " +
                        "consistencyCheck: compare the paper's stated problem statement, research questions, and " +
                        "methodology against the student's saved earlier-stage work — flag any mismatches, drops, or " +
                        "additions. Include at least 4 checks. " +
                        "citationAudit: based on the deterministic scan plus your own reading, list concrete issues " +
                        "(uncited references, missing in-text citations, formatting problems) and a one-line status. " +
                        "structuralCompliance: count required thesis sections (Background, Statement of the Problem, " +
                        "Research Questions, Significance of the study, Scope and Delimitation, Definition of Terms, review of related of litelature, " +
                        "Theoretical/Conceptual Framework, Research Design, Population and Sampling, Research Instrument, " +
                        "Data Gathering Procedure, Statistical Treatment, Presentation of Data, Analysis, Discussion, " +
                        "Summary, Conclusion, Recommendation) actually present vs the standard 28-ish expected, listing " +
                        "which are missing. " +
                        "overallReadiness: a rough 0-100 readiness score as a string like '78/100', plus the 3 most " +
                        "important fixes before submission, ordered by priority. Be concrete and reference the student's " +
                        "actual content, not generic advice.",
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
        }
        catch {
            return res.status(500).json({
                error: "AI returned invalid JSON. Please try again.",
            });
        }
        const { review } = parsed;
        const fileNameForRecord = thesis_file?.originalname ?? "Typed submission (no file uploaded)";
        const { data: inserted, error: saveError } = await supa_client_1.supabase
            .from("full_paper_reviews")
            .insert({
            user_id,
            file_name: fileNameForRecord,
            topic: savedArtifacts.topic,
            chapter_detection: review.chapterDetection,
            consistency_check: review.consistencyCheck,
            citation_audit: review.citationAudit,
            structural_compliance: review.structuralCompliance,
            overall_readiness: review.overallReadiness,
        })
            .select()
            .single();
        if (saveError) {
            console.log(saveError);
            // Not returning an error here — the AI response is still valid even if the save fails
        }
        return res.status(200).json({
            reviewId: inserted?.id ?? null,
            fileName: fileNameForRecord,
            source: hasFile ? (hasManualText ? "file+manual" : "file") : "manual",
            ...review,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
// GET THE ALL THE RESPONE FROM THE DATABASE
async function GetLiteratureReviews(req, res) {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        // Optional pagination via query params: /ai/literature-reviews?limit=10&offset=0
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const offset = Number(req.query.offset) || 0;
        const { data, error, count } = await supa_client_1.supabase
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
async function GetTopicSelections(req, res) {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        // Optional pagination via query params: /ai/topic-selections?limit=10&offset=0
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const offset = Number(req.query.offset) || 0;
        const { data, error, count } = await supa_client_1.supabase
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
// GET ALL METHODOLOGY RESPONSES FOR THE USER
async function GetMethodologies(req, res) {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        // Optional pagination via query params: /ai/methodologies?limit=10&offset=0
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const offset = Number(req.query.offset) || 0;
        const { data, error, count } = await supa_client_1.supabase
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
// GET ALL DATA ANALYSIS RESPONSES FOR THE USER
async function GetDataAnalyses(req, res) {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        // Optional pagination via query params: /ai/data-analyses?limit=10&offset=0
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const offset = Number(req.query.offset) || 0;
        const { data, error, count } = await supa_client_1.supabase
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
// GET ALL PAPER REVIEWS RESPONSES FOR THE USER
async function GetFullPaperReviews(req, res) {
    try {
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(401).json({ message: "Unauthorized, Please Log in" });
        }
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const offset = Number(req.query.offset) || 0;
        const { data, error, count } = await supa_client_1.supabase
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
        return res.status(200).json({
            reviews: data,
            total: count ?? data.length,
            limit,
            offset,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
// DELETE A TOPIC SELECTIONS
async function DeleteTopicSelections(req, res) {
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
        const { data: topicRow, error: fetchError } = await supa_client_1.supabase
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
        // Delete the topic selection itself.
        // Scoping every delete to user_id ensures a user can only delete their own
        // rows, even if they somehow guess or intercept another user's id.
        const { error, data } = await supa_client_1.supabase
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
        const cascadeResults = await Promise.allSettled([
            supa_client_1.supabase.from("literature_reviews").delete().eq("topic", topic).eq("user_id", user_id),
            supa_client_1.supabase.from("methodology_responses").delete().eq("topic", topic).eq("user_id", user_id),
            supa_client_1.supabase.from("data_analysis_responses").delete().eq("topic", topic).eq("user_id", user_id),
            supa_client_1.supabase.from("full_paper_reviews").delete().eq("topic", topic).eq("user_id", user_id),
        ]);
        cascadeResults.forEach((result, i) => {
            const tableNames = ["literature_reviews", "methodology_responses", "data_analysis_responses"];
            if (result.status === "rejected") {
                console.log(`Cascade delete failed for ${tableNames[i]}:`, result.reason);
            }
            else if (result.value.error) {
                console.log(`Cascade delete failed for ${tableNames[i]}:`, result.value.error);
            }
        });
        return res.status(200).json({
            message: "Topic selection and all related stages deleted successfully.",
            deletedId: id,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}
