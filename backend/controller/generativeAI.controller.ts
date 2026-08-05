import { supabase } from "../supabase/supa-client";
import { Request, Response } from "express";
import OpenAI from "openai";
import { checkDailyLimit } from "../lib/checkDailyLimit";
import { REALTIME_LISTEN_TYPES } from "@supabase/supabase-js/dist/index.cjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DAILY_PROMPT_LIMIT = 5;
const MIN_RESEARCH_QUESTIONS_DA = 1;
const MAX_RESEARCH_QUESTIONS_DA = 6;

function isGibberish(text: string): boolean {
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
function checkMeaningfulText(
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

export async function RecommendedAI(req: Request, res: Response) {
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
 
    const isImageRequest =
      /(can\s+you\s+(make|create|generate|draw|design|render|show|give|send|produce)|please\s+(make|create|generate|draw|design|render|show|give|send|produce)).*?(image|picture|photo|art|artwork|illustration|logo|poster|graphic|visual|diagram|thumbnail)|^(generate|create|draw|make|design|render|illustrate|paint|sketch|show|give|send|produce)\s.*(image|picture|photo|art|artwork|illustration|logo|poster|graphic|visual|diagram|thumbnail)|\b(image|picture|photo|artwork|illustration|logo|poster|graphic|visual|thumbnail)\b/i.test(
        promptText
      );
 
    if (isImageRequest) {
      return res.status(400).json({
        error: "Unsupported request",
        message:
          "Sorry, I can only generate thesis title recommendations. I'm not able to create images, photos, or any visual content. Please enter a thesis-related instruction instead.",
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
 
    const isEntrepCourse = /entrepreneurship/i.test(course);
 
    const { data: existingTheses, error: fetchError } = await supabase
      .from("Thesis")
      .select("id, title, thesis_introduction, entrep_intro")
      .ilike("course", `%${course}%`)
      .limit(5);
 
    if (fetchError) {
      return res.status(500).json({ message: "Failed to fetch existing theses", error: fetchError });
    }

    const { allowed, count } = await checkDailyLimit(user_id, "thesisRecommendation", DAILY_PROMPT_LIMIT);

    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }
 
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
      reasoning_effort: "none", // keeps cost predictable; bump to "low" if outputs feel shallow
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an academic advisor. You ONLY generate thesis title recommendations, summaries, new features, and tags. You do NOT write literature reviews, abstracts, introductions, essays, or any thesis content. Return only valid JSON in the form { \"recommendations\": [...] }.",
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
      const jsonParsed = JSON.parse(cleaned);
      // Normalize: accept either a raw array or { recommendations: [...] }
      const normalized = Array.isArray(jsonParsed) ? jsonParsed : jsonParsed.recommendations;
      // Safety net: enforce exactly 5, even if the model over/under-generates
      parsed = Array.isArray(normalized) ? normalized.slice(0, 5) : normalized;
    } catch {
      return res.status(500).json({
        error: "AI returned invalid JSON. Please try again.",
      });
    }
 
    const { error: insertError } = await supabase
      .from("thesisRecommendation")
      .insert([{ user_id, course, chatPrompt, response: parsed }]);
 
    if (insertError) {
      return res.status(500).json({ message: "Failed to insert response", error: insertError });
    }
 
    return res.status(200).json({
      recommendations: parsed,
      based_on_existing: hasExisting,
    });
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
            "feedback should be 2-3 sentences. refinedTopics should have exactly 3 more focused alternative phrasings " +
            "of the student's topic. suggestedResearchQuestions should have 2-3 concrete research questions. " +
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
    const { topic, sources } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    const topicCheck = checkMeaningfulText(topic, { required: true });
    if (!topicCheck.valid) {
      return res.status(400).json({ error: topicCheck.error, message: topicCheck.message });
    }

    if (!Array.isArray(sources) || sources.length < 3) {
      return res.status(400).json({
        message: "Please provide at least 3 sources, each with a citation, key finding, and relevance to your gap.",
      });
    }

    if (sources.length > 8) {
      return res.status(400).json({
        message: "Please provide no more than 8 sources at a time.",
      });
    }

    for (const s of sources) {
      const citationCheck = checkMeaningfulText(s.citation, { required: true });
      if (!citationCheck.valid) {
        return res.status(400).json({ error: citationCheck.error, message: `Citation: ${citationCheck.message}` });
      }
      const findingCheck = checkMeaningfulText(s.key_finding, { required: true });
      if (!findingCheck.valid) {
        return res.status(400).json({ error: findingCheck.error, message: `Key finding: ${findingCheck.message}` });
      }
      const relevanceCheck = checkMeaningfulText(s.relevance_to_gap, { required: true });
      if (!relevanceCheck.valid) {
        return res.status(400).json({ error: relevanceCheck.error, message: `Relevance to gap: ${relevanceCheck.message}` });
      }
    }

    const { allowed } = await checkDailyLimit(user_id, "literatureReview", DAILY_PROMPT_LIMIT);
    if (!allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You've reached your daily limit of ${DAILY_PROMPT_LIMIT} prompts. Please try again.`,
        remaining: 0,
      });
    }

    const sourcesSummary = sources
      .map((s: any, i: number) => `${i + 1}. ${s.citation} — Finding: ${s.key_finding} | Relevance to gap: ${s.relevance_to_gap}`)
      .join("\n");

    const prompt = `
      Thesis topic: ${topic}

      Sources:
      ${sourcesSummary}
    `;

    const result = await openai.chat.completions.create({
      model: "gpt-5.4-mini",
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a thesis advisor helping an undergraduate student complete their Literature Review stage. " +
            "Given their topic and a list of sources, respond ONLY with a JSON object shaped as: " +
            `{ "themeGroups": { [theme: string]: string[] }, "gapStatement": string, ` +
            `"annotatedBibliography": [{ "citation": string, "annotation": string }], "synthesisParagraph": string, ` +
            `"recommendedSearches": [{ "theme": string, "searchQuery": string, "why": string }] }. ` +
            "First identify 2-4 recurring themes across the sources yourself, and set themeGroups as an object mapping " +
            "each theme name to an array of the matching source citations (a source may belong to only one theme). " +
            "gapStatement should be ONE clear sentence naming what's missing across these sources that the student's " +
            "study fills. annotatedBibliography should have one entry per source with a 1-2 sentence annotation " +
            "summarizing its contribution and relevance to the gap. synthesisParagraph should be 4-6 sentences that " +
            "synthesize the themes together (not list sources one by one), reference at least two themes by name, " +
            "and end by restating the gap. " +
            "recommendedSearches should have 2-4 entries pointing the student toward literature they haven't logged " +
            "yet: theme names a thin area of their current sources, searchQuery a ready-to-paste query for Google " +
            "Scholar or a library database (specific enough to be useful, e.g. include location/population/method " +
            "keywords where relevant), and why a one-sentence reason this direction would strengthen their review. " +
            "NEVER invent specific paper titles, authors, or citations — only suggest search directions, since you " +
            "cannot verify real sources exist.",
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

    const { error: saveError } = await supabase.from("literature_reviews").insert({
      user_id,
      topic,
      sources,
      gap_statement: parsed.gapStatement,
      theme_groups: parsed.themeGroups,
      annotated_bibliography: parsed.annotatedBibliography,
      synthesis_paragraph: parsed.synthesisParagraph,
      recommended_searches: parsed.recommendedSearches,
    });

    if (saveError) {
      console.log(saveError);
      // Not blocking the response — the AI output is still valid even if the save fails
    }

    return res.status(200).json(parsed);
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
            "Given their topic and numbered research questions, respond ONLY with a JSON object shaped as: " +
            `{ "methodology": { ` +
            `"approach": "qualitative" | "quantitative" | "mixed_methods", ` +
            `"approachRationale": string, ` +
            `"population": { "targetPopulation": string, "samplingMethod": string, "sampleSizeJustification": string, "inclusionCriteria": string[] }, ` +
            `"instruments": [{ "name": string, "type": string, "purpose": string, "validityConsiderations": string, "researchQuestionNumbers": number[] }], ` +
            `"dataCollectionPlan": string, ` +
            `"dataAnalysisPlan": string, ` +
            `"questionMapping": [{ "researchQuestionNumber": number, "researchQuestion": string, "approach": string, "instrument": string, "analysisMethod": string }], ` +
            `"limitations": string[] ` +
            `} }. ` +
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


// GET THE ALL THE RESPONE FROM THE DATABASE
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





// DELETE THE RESPONE HISTORY
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

    // Scoping the delete to user_id ensures a user can only delete their own rows,
    // even if they somehow guess or intercept another user's id.
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

    return res.status(200).json({
      message: "Topic selection deleted successfully.",
      deletedId: id,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// DELETE A METHODOLOGY RESPONSE
export async function DeleteMethodology(req: Request, res: Response) {
  try {
    const { id } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!id) {
      return res.status(400).json({ message: "Methodology id is required." });
    }

    // Scoping the delete to user_id ensures a user can only delete their own rows,
    // even if they somehow guess or intercept another user's id.
    const { error, data } = await supabase
      .from("methodology_responses")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id)
      .select();

    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not delete this methodology. Please try again.",
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Methodology not found, or you don't have permission to delete it.",
      });
    }

    return res.status(200).json({
      message: "Methodology deleted successfully.",
      deletedId: id,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}

// DELETE A DATA ANALYSIS RESPONSE
export async function DeleteDataAnalysis(req: Request, res: Response) {
  try {
    const { id } = req.body;
    const user_id = req.user?.id;
 
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }
 
    if (!id) {
      return res.status(400).json({ message: "Data analysis id is required." });
    }
 
    const { error, data } = await supabase
      .from("data_analysis_responses")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id)
      .select();
 
    if (error) {
      console.log(error);
      return res.status(500).json({
        error: error.message,
        message: "Could not delete this data analysis. Please try again.",
      });
    }
 
    if (!data || data.length === 0) {
      return res.status(404).json({
        message: "Data analysis not found, or you don't have permission to delete it.",
      });
    }
 
    return res.status(200).json({
      message: "Data analysis deleted successfully.",
      deletedId: id,
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}