import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    console.log("Listing models...");
    const models = await ai.models.list();
    console.log("Available models:");
    for await (const m of models) {
      console.log("- ", m.name);
    }
  } catch (err) {
    console.error("List models error:", err);
  }
}

listModels();
