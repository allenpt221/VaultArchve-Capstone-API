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



export async function RecommendedAI(req: Request, res: Response){
    try {
        const { course, interests, chatPrompt } = req.body;
        const user_id = req.user?.id;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const interestsText = Array.isArray(interests) 
            ? interests.join(", ") 
            : interests;

        const prompt = `
        You are an academic advisor.

        Suggest 5 thesis titles for a ${course} student.
        Interests: ${interestsText}
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

        const cleaned = rawText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        const { error } = await supabase
            .from("thesisRecommendation")
            .insert([{
                id: user_id,
                course,
                interests,
                chatPrompt,
                response: parsed  
            }]);

        if (error) {
            console.error("Failed to insert response:", error);
            return res.status(500).json({ error: "Failed to insert response" });
        }

        res.json({ recommendations: parsed }); // Send clean array to frontend

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: "Server Internal Error" });
        return;
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