import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function testCall() {
  const models = ['gemini-2.0-flash', 'gemini-flash-latest', 'gemini-2.0-flash-lite'];
  for (const model of models) {
    console.log(`\nTesting call with model: ${model}...`);
    try {
      const res = await ai.models.generateContent({
        model: model,
        contents: 'Hello, respond with OK',
      });
      console.log(`SUCCESS with ${model}! Response:`, res.text?.trim());
      return model;
    } catch (err) {
      console.error(`Call error with ${model}:`, err.message);
    }
  }
}

testCall();
