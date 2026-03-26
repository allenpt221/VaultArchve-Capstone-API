import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import { supabase } from "../supabase/supa-client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

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