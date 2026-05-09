// ============================================
// Gemini — Outfit Generation Prompt
// ============================================

import type { BodyAnalysis } from '../types.js';

export function buildOutfitPrompt(analysis: BodyAnalysis, occasion: string, style: string, preferences: string): string {
  return `You are an elite fashion stylist.

Based on this body analysis of a user:
${JSON.stringify(analysis, null, 2)}

And their requirements:
- Occasion: ${occasion}
- Style: ${style}
- Preferences: ${preferences || 'None'}

Generate exactly 5 outfit recommendations that would look AMAZING on them.

CRITICAL RULES:
- Each outfit must be realistic and purchasable (real brands/items, not fantasy)
- Include specific clothing item names (not vague like "a nice shirt")
- Keywords MUST be highly specific, Google Shopping search-friendly strings.
- DO NOT use generic terms like "minimal outfit". USE specific clothing queries like "black cuban collar shirt men relaxed fit".
- SOMETIMES append popular store names like "Myntra", "Ajio", "Zara", or "H&M" to the keywords to prioritize good products.
- Add exactly 3-4 search keywords per outfit covering each major piece.
- Include an imagePrompt for AI image generation of the outfit.
- RETURN ONLY VALID JSON ARRAY.
- DO NOT USE MARKDOWN.
- DO NOT WRAP IN \`\`\`json.
- DO NOT WRITE EXPLANATIONS.

OUTPUT FORMAT — JSON array of exactly 5 objects:
[
  {
    "title": "Short creative outfit name (2-4 words)",
    "topwear": "Specific top garment description",
    "bottomwear": "Specific bottom garment description",
    "footwear": "Specific footwear description",
    "accessories": ["accessory1", "accessory2"],
    "layering": "Layering item or 'none'",
    "keywords": [
      "highly specific search query for topwear myntra",
      "highly specific search query for bottomwear zara",
      "highly specific search query for footwear h&m"
    ],
    "imagePrompt": "Fashion catalog photo: [full outfit description], [style], clean white background, full body mannequin, high detail fabric texture, studio lighting, no face"
  }
]`;
}
