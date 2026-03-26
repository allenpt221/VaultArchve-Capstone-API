import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

async function listModels() {
  const models = await genAI.listModels();
  for await (const model of models) {
    console.log(model.name, model.supportedGenerationMethods);
  }
}

listModels();