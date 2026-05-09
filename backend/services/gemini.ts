// ============================================
// AI Vision Service (via Groq)
// Body analysis + Outfit generation with retry & timeout
// ============================================

import Groq from 'groq-sdk';
import { withTimeout } from '../utils/timeout.js';
import { logger } from '../utils/logger.js';
import { buildBodyAnalysisPrompt } from '../prompts/bodyAnalysis.js';
import { buildOutfitPrompt } from '../prompts/outfitGeneration.js';
import type { BodyAnalysis, Outfit } from '../types.js';

const AI_TIMEOUT = 25_000; // 25 seconds per call
const MAX_RETRIES = 2;

export const FALLBACK_BODY_ANALYSIS: BodyAnalysis = {
  bodyType: "Average build",
  physiqueAnalysis: "Balanced proportions with average shoulder width",
  skinTone: "Neutral",
  faceStructure: "Oval face shape",
  vibe: "Casual Minimalist",
  bestColors: ["Navy", "White", "Beige", "Olive", "Black"],
  recommendedFits: ["Relaxed fits", "Classic proportions"],
  avoid: ["Overly tight garments", "Clashing bold patterns"],
  fashionInspiration: ["Smart Casual", "Everyday Minimal"]
};

export const FALLBACK_OUTFITS: Outfit[] = [
  {
    title: "Minimal Casual",
    topwear: "Oversized black t-shirt",
    bottomwear: "Relaxed beige trousers",
    footwear: "White sneakers",
    layering: "none",
    accessories: "Silver watch",
    keywords: ["oversized black t-shirt men", "beige relaxed trousers men", "white minimalist sneakers"],
    imagePrompt: "Fashion catalog photo: oversized black t-shirt with beige relaxed trousers, white sneakers, clean studio background, full body, high detail"
  },
  {
    title: "Smart Everyday",
    topwear: "Crisp white Oxford shirt",
    bottomwear: "Dark wash straight jeans",
    footwear: "Brown leather loafers",
    layering: "none",
    accessories: "Leather belt",
    keywords: ["white oxford shirt men", "dark wash straight jeans men", "brown leather loafers men"],
    imagePrompt: "Fashion catalog photo: crisp white Oxford shirt with dark wash straight jeans, brown leather loafers, clean studio background, full body, high detail"
  }
];

function getAI(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set in environment');
  return new Groq({ apiKey: key });
}

function cleanGeminiJson(text: string): any {
  console.log("RAW AI RESPONSE:\n", text); // Explicit logging as requested

  // Clean markdown and code block markers
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  
  // Find first { or [ to ignore conversational garbage
  const firstCurly = cleaned.indexOf('{');
  const firstSquare = cleaned.indexOf('[');
  
  let startIndex = -1;
  if (firstCurly !== -1 && firstSquare !== -1) {
    startIndex = Math.min(firstCurly, firstSquare);
  } else if (firstCurly !== -1) {
    startIndex = firstCurly;
  } else if (firstSquare !== -1) {
    startIndex = firstSquare;
  }

  if (startIndex !== -1) {
    cleaned = cleaned.substring(startIndex);
  }

  // Try parsing directly
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt to fix trailing commas
    try {
      cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
      return JSON.parse(cleaned);
    } catch (err: any) {
      logger.error('Groq AI', 'JSON Parse Error', err.message);
      throw new Error('Failed to parse AI response as valid JSON');
    }
  }
}

async function callAI(
  prompt: string,
  imageBase64: string,
  mimeType: string,
  retryCount = 0
): Promise<any> {
  const ai = getAI();

  try {
    const response = await withTimeout(
      ai.chat.completions.create({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.7,
      }),
      AI_TIMEOUT,
      'Groq API call'
    );

    const text = response.choices[0]?.message?.content || '';
    if (!text.trim()) {
      throw new Error('Empty response from AI');
    }

    return cleanGeminiJson(text);
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      logger.warn('Groq AI', `Attempt ${retryCount + 1} failed, retrying...`, error.message);
      await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1))); // Exponential backoff
      return callAI(prompt, imageBase64, mimeType, retryCount + 1);
    }
    throw error;
  }
}

// ============================================
// Step 2: Body & Vibe Analysis
// ============================================
export async function analyzeBody(
  imageBase64: string,
  mimeType: string,
  occasion: string,
  style: string,
  preferences: string
): Promise<BodyAnalysis> {
  logger.stage('ANALYZE', 'Starting body & vibe analysis...');

  const prompt = buildBodyAnalysisPrompt(occasion, style, preferences);

  try {
    const result = await callAI(prompt, imageBase64, mimeType);

    // Normalize output keys in case AI used older names
    const normalizedBodyType = result.bodyType || result.bodyShape || 'Athletic';
    const normalizedVibe = result.vibe || result.aesthetic || result.vibeType || 'Minimal';
    const recommendedFits = Array.isArray(result.recommendedFits) ? result.recommendedFits : (result.fitAdvice ? [result.fitAdvice] : ["Relaxed fits"]);

    const normalizedResult: BodyAnalysis = {
      bodyType: normalizedBodyType,
      physiqueAnalysis: result.physiqueAnalysis || "Balanced proportions",
      skinTone: result.skinTone || 'Neutral',
      faceStructure: result.faceStructure || "Average",
      vibe: normalizedVibe,
      bestColors: Array.isArray(result.bestColors) ? result.bestColors : (result.recommendedColors || []),
      recommendedFits: recommendedFits,
      avoid: Array.isArray(result.avoid) ? result.avoid : [],
      fashionInspiration: Array.isArray(result.fashionInspiration) ? result.fashionInspiration : []
    };

    logger.success('ANALYZE', `Body: ${normalizedResult.bodyType}, Vibe: ${normalizedResult.vibe}`);
    return normalizedResult;
  } catch (err: any) {
    logger.error('ANALYZE', 'Analysis completely failed after retries, using fallback', err.message);
    return FALLBACK_BODY_ANALYSIS;
  }
}

// ============================================
// Step 3: Outfit Generation
// ============================================
export async function generateOutfits(
  analysis: BodyAnalysis,
  imageBase64: string,
  mimeType: string,
  occasion: string,
  style: string,
  preferences: string
): Promise<Outfit[]> {
  logger.stage('OUTFITS', 'Generating outfit recommendations...');

  const prompt = buildOutfitPrompt(analysis, occasion, style, preferences);

  try {
    const result = await callAI(prompt, imageBase64, mimeType);

    // Handle both array and object-with-array responses
    const outfits: Outfit[] = Array.isArray(result) ? result : result.outfits || result.outfitSuggestions || [];

    if (!outfits || outfits.length === 0) {
      throw new Error('AI returned no outfit suggestions');
    }

    // Ensure each outfit has keywords
    for (const outfit of outfits) {
      if (!outfit.keywords || outfit.keywords.length === 0) {
        outfit.keywords = [
          `${outfit.topwear || ''} men`,
          `${outfit.bottomwear || ''} men`,
          `${outfit.footwear || ''} men`,
        ].filter(k => k.trim() !== 'men');
      }
    }

    logger.success('OUTFITS', `Generated ${outfits.length} outfits`);
    return outfits;
  } catch (err: any) {
    logger.error('OUTFITS', 'Outfit generation completely failed after retries, using fallback', err.message);
    return FALLBACK_OUTFITS;
  }
}
