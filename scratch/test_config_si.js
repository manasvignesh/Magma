import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        console.log("Testing gemini-flash-latest with systemInstruction in config...");
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: [{ role: 'user', parts: [{ text: "Hi" }] }],
            config: {
                systemInstruction: "You are a helpful assistant.",
                temperature: 0.7
            }
        });
        
        console.log("Response text:", response.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
