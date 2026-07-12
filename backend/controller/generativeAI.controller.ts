import { supabase } from "../supabase/supa-client";
import { Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 
    const promptText = (chatPrompt || "").trim().toLowerCase();
 
    if (promptText.length > 0 && promptText.length < 5) {
      return res.status(400).json({
        error: "Input too short",
        message: "Please enter a meaningful prompt.",
      });
    }
 
    const isGibberish = (text: string): boolean => {
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
    };
 
    if (promptText.length > 0 && isGibberish(promptText)) {
      return res.status(400).json({
        error: "Meaningless input",
        message: "Your input appears to be random or meaningless. Please enter a valid prompt.",
      });
    }
 
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