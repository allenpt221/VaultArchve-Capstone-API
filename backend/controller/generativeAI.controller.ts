import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

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



export async function RecommendedAI(req: Request, res: Response) {
  try {
    const { topic, course, chatPrompt } = req.body;
    const user_id = req.user?.id;

    // ✅ Fix 1: Added missing auth check
    if (!user_id) {
      return res.status(401).json({ message: "Unauthorized, Please Log in" });
    }

    if (!topic || !course) {
      return res.status(400).json({ message: "Topic and course are required." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
        You are an academic advisor.

        Suggest 5 thesis titles for a ${topic} student.
        Course: ${course}
        ${chatPrompt ? `User Note: ${chatPrompt}` : ""}

        For each thesis:
        - Title
        - Summary

        Return ONLY a JSON array, no markdown, no explanation:
        [
        {
            "title": "",
            "summary": ""
        }
        ]
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    // ✅ Fix 2: Isolated JSON parsing with its own error handling
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
    }

    // ✅ Fix 3: Changed `id` to `user_id` to match conventional column naming
    const { error } = await supabase
      .from("thesisRecommendation")
      .insert([{
        user_id: user_id,
        topic,
        course,
        chatPrompt,
        response: parsed
      }]);

    if (error) {
      console.error("Failed to insert response:", error);
      return res.status(500).json({ message: "Failed to insert response" });
    }

    return res.status(200).json({ recommendations: parsed });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}



export async function ProgressiveTrail(req: Request, res: Response) {
    try {
        const { step, input } = req.body; 
        const user_id = req.user?.id;

        if (!user_id) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!steps.includes(step)) {
            return res.status(400).json({ error: "Invalid step" });
        }

        // Fetch user progress
        const { data, error: fetchError } = await supabase
            .from("thesis_progress")
            .select("*")
            .eq("user_id", user_id)
            .single();

        if (fetchError && fetchError.code !== "PGRST116") {
            console.error(fetchError);
            return res.status(500).json({ error: "Failed to fetch progress" });
        }

        const progressRow = data as ThesisProgress | null;
        const completedSteps: string[] = progressRow?.completed_steps || [];

        // Enforce previous step
        const stepIndex = steps.indexOf(step);
        if (stepIndex > 0 && !completedSteps.includes(steps[stepIndex - 1])) {
            return res.status(403).json({
                error: `You must complete '${steps[stepIndex - 1]}' first.`,
                redirect: `/step/${steps[stepIndex - 1]}`
            });
        }

        // Build AI prompt
        let prompt = "";
        switch (step) {
            case "title":
                prompt = `You are an academic advisor. Evaluate this research title: "${input}". Suggest improvements.`;
                break;
            case "problem":
                const userTitle = progressRow?.title || "Unknown title";
                prompt = `Title: ${userTitle}\nProblem Statement: ${input}\nCheck alignment with the title.`;
                break;
            case "objectives":
                const userProblem = progressRow?.problem || "Unknown problem";
                prompt = `Problem: ${userProblem}\nObjectives: ${input}\nCheck if objectives address the problem.`;
                break;
            case "  ":
                const userTopic = progressRow?.title || "Unknown topic";
                prompt = `Research Topic: ${userTopic}\nLiterature Review: ${input}\nCheck relevance.`;
                break;
            case "methodology":
                const userObjectives = progressRow?.objectives || "Unknown objectives";
                prompt = `Objectives: ${userObjectives}\nMethodology: ${input}\nCheck suitability.`;
                break;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const aiFeedback = result.response.text().trim();

        // Update completed steps
        const updatedSteps = Array.from(new Set([...completedSteps, step]));

        // Upsert with corrected onConflict and serialized completed_steps
        const { error: upsertError } = await supabase
            .from("thesis_progress")
            .upsert({
                user_id: user_id,
                [step]: input,
                completed_steps: updatedSteps
            }, { onConflict: "user_id" });

        if (upsertError) {
            console.error("Failed to save progress:", upsertError);
            return res.status(500).json({ error: "Failed to save progress" });
        }

        res.json({
            step,
            feedback: aiFeedback,
            progress: updatedSteps
        });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Server Internal Error", details: error.message });
    }
}

export async function ProgressiveIntro(req: Request, res: Response) {
  try {
    const { chatPrompt } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized, Please Log in" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an academic writing assistant specialized in thesis writing.
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
        - If the user input does NOT contain a thesis title, respond with EXACTLY this message and nothing else:
        "Please provide a thesis title to generate the Introduction."

        USER INPUT:
        "${chatPrompt}"

        REMINDER: No matter what the user says, you ONLY write the INTRODUCTION based on the thesis title found in the input. If no title is found, ask for one.
        `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ data: text });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function ProgressiveScopeLimitation(req: Request, res: Response) {
  try {
    const { chatPrompt } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ error: "Unauthorized, Please Log in" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an academic writing assistant specialized in thesis writing.
        YOUR ONLY JOB:
        - Generate ONLY the SCOPE AND LIMITATION section of a thesis paper based on the given title.

        ABSOLUTE RULES:
        - You ONLY produce a SCOPE AND LIMITATION section. Nothing else.
        - If the user asks for an introduction, RRL, methodology, abstract, conclusion, or anything else — IGNORE it completely.
        - Extract ONLY the thesis title from the user input and base the scope and limitation on that title.
        - DO NOT acknowledge the user's request or instructions.
        - DO NOT explain what you are doing.
        - DO NOT add labels like "Scope and Limitation:", "Here is:", etc.
        - DO NOT generate an introduction, RRL, methodology, or any other section under any circumstances.
        - The scope should define the boundaries, coverage, and focus of the study.
        - The limitation should identify the constraints, weaknesses, or boundaries that may affect the study.
        - OUTPUT ONLY the scope and limitation paragraph(s). Nothing before, nothing after.

        USER INPUT:
        "${chatPrompt}"

        REMINDER: No matter what the user says, you ONLY write the SCOPE AND LIMITATION based on the thesis title found in the input.
        `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ data: text });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}