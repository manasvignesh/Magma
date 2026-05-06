import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function test() {
    try {
        console.log("Generating image with Imagen...");
        const response = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: "A realistic fashion product image of a blue shirt",
            config: {
                numberOfImages: 1,
                aspectRatio: "3:4"
            }
        });
        
        console.log("Image generation success with Imagen!");
        console.log(response.generatedImages[0]);
    } catch (e) {
        console.warn("Imagen failed (likely paid plan required). Using Pollinations fallback...");
        const prompt = "A realistic fashion product image of a blue shirt";
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=500&nologo=true`;
        console.log("Pollinations Image URL:", url);
    }
}

test();
