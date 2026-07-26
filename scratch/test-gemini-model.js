import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testModels() {
  const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
  for (const model of candidateModels) {
    console.log(`Testing model: ${model}...`);
    try {
      const res = await ai.models.generateContent({
        model: model,
        contents: 'Hello, respond with OK',
      });
      console.log(`SUCCESS for model ${model}:`, res.text?.trim());
      return model;
    } catch (err) {
      console.error(`FAILED for model ${model}:`, err.message);
    }
  }
}

testModels();
