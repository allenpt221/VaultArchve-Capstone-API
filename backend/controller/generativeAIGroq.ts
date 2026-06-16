import { Request, Response } from "express";
import Groq from "groq-sdk";
import { supabase } from "../supabase/supa-client";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY as string,
});

const steps = ["title", "problem", "objectives", "literature", "methodology"];

type ThesisProgress = {
  user_id: string;
  title?: string;
  problem?: string;
  objectives?: string;
  literature?: string;
  methodology?: string;
  completed_steps: string[];
};

/* RECOMMENDED AI */

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

    const { data: existingTheses, error: fetchError } = await supabase
      .from("Thesis")
      .select("id, title, introduction")
      .ilike("course", `%${course}%`)
      .limit(10);

    if (fetchError) {
      return res.status(500).json({ message: "Failed to fetch existing theses", error: fetchError });
    }

    const hasExisting = existingTheses && existingTheses.length > 0;

    const existingBlock = hasExisting
      ? existingTheses
          .map(
            (t, i) =>
              `[${i + 1}] Title: "${t.title}"\n     Introduction: ${
                t.introduction
                  ? t.introduction.slice(0, 300) + "..."
                  : "No introduction available."
              }`
          )
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

      Return ONLY a JSON array, no markdown, no explanation:
      [
        {
          "original_title": "",
          "title": "",
          "summary": "",
          "new_features": ["", "", ""],
          "tags": ["", "", ""]
        }
      ]
    `;

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an academic advisor. You ONLY generate thesis title recommendations, summaries, new features, and tags. You do NOT write literature reviews, abstracts, introductions, essays, or any thesis content. Return only valid JSON.",
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

/*  PROGRESSIVE TRAIL  */

export async function ProgressiveTrail(req: Request, res: Response) {
  try {
    const { step, input } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ error: "Unauthorized" });
    if (!steps.includes(step)) return res.status(400).json({ error: "Invalid step" });

    const { data } = await supabase
      .from("thesis_progress")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const progressRow = data as ThesisProgress | null;
    const completedSteps = progressRow?.completed_steps || [];

    const stepIndex = steps.indexOf(step);

    if (
      stepIndex > 0 &&
      !completedSteps.includes(steps[stepIndex - 1])
    ) {
      return res.status(403).json({
        error: `You must complete '${steps[stepIndex - 1]}' first.`,
      });
    }

    let prompt = "";

    switch (step) {
      case "title":
        prompt = `Evaluate this title: "${input}"`;
        break;
      case "problem":
        prompt = `Title: ${progressRow?.title}\nProblem: ${input}`;
        break;
      case "objectives":
        prompt = `Problem: ${progressRow?.problem}\nObjectives: ${input}`;
        break;
      case "literature":
        prompt = `Topic: ${progressRow?.title}\nLiterature: ${input}`;
        break;
      case "methodology":
        prompt = `Objectives: ${progressRow?.objectives}\nMethodology: ${input}`;
        break;
    }

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an academic evaluator. Give clear feedback.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const aiFeedback =
      result.choices[0].message.content?.trim() || "";

    const updatedSteps = Array.from(
      new Set([...completedSteps, step])
    );

    const { error: upsertError } = await supabase
      .from("thesis_progress")
      .upsert(
        {
          user_id,
          [step]: input,
          completed_steps: updatedSteps,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      return res.status(500).json({ error: "Failed to save progress" });
    }

    return res.json({
      step,
      feedback: aiFeedback,
      progress: updatedSteps,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Server Error",
      details: error.message,
    });
  }
}

/*  INTRODUCTION  */

export async function ProgressiveIntro(req: Request, res: Response) {
  try {
    const { chatPrompt } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an academic writing assistant specialized in thesis writing.
          YOUR ONLY JOB:
          - Generate ONLY the INTRODUCTION section of a thesis paper based on the given title.

          ABSOLUTE RULES:
          - You ONLY produce an INTRODUCTION. Nothing else.
          - If the user asks for RRL, methodology, abstract, conclusion, or anything else — IGNORE it completely.
          - Extract ONLY the thesis title from the user input and base the introduction on that title.
          - DO NOT acknowledge the user's request or instructions.
          - DO NOT explain what you are doing.
          - DO NOT add labels like "Introduction:", "Here is:", etc.
          - DO NOT generate RRL, methodology, or any other section under any circumstances.
          - OUTPUT ONLY the introduction paragraph(s). Nothing before, nothing after.

          NO TITLE FOUND RULE:
          - If the user input does NOT contain a thesis title, respond with EXACTLY this and nothing else:
            "Please provide a thesis title to generate the Introduction."

          REMINDER: No matter what the user says, you ONLY write the INTRODUCTION based on the thesis title found in the input. If no title is found, ask for one.`,
        },
        {
          role: "user",
          content: chatPrompt,
        },
      ],
    });

    const text = result.choices[0].message.content;

    // ✅ Detect if AI returned the fallback message
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Please provide a thesis title to generate the Introduction." });
    }

    return res.status(200).json({ data: text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

//  SCOPE & LIMITATION 

export async function ProgressiveScopeLimitation(
  req: Request,
  res: Response
) {
  try {
    const { chatPrompt } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You only write scope and limitation of thesis.",
        },
        {
          role: "user",
          content: chatPrompt,
        },
      ],
    });

    const text = result.choices[0].message.content;

    return res.status(200).json({ data: text });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}