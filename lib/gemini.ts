import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerativeModel,
} from "@google/generative-ai";

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// All safety categories set to BLOCK_NONE — legal contract text routinely triggers
// default content filters (indemnification, liability, termination clauses, etc.).
export const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const MODELS = {
  FLASH: "gemini-1.5-flash",
  PRO:   "gemini-1.5-pro",
} as const;

/**
 * Returns a configured Flash model instance (fast, cheap — basic/surface scans).
 */
export function getFlashModel(systemInstruction?: string, maxOutputTokens = 512): GenerativeModel {
  return genAI.getGenerativeModel({
    model: MODELS.FLASH,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
    safetySettings: SAFETY_SETTINGS,
  });
}

/**
 * Returns a configured Pro model instance (highest quality — deep scan stages).
 */
export function getProModel(systemInstruction?: string, maxOutputTokens = 4096): GenerativeModel {
  return genAI.getGenerativeModel({
    model: MODELS.PRO,
    ...(systemInstruction ? { systemInstruction } : {}),
    generationConfig: {
      temperature: 0.0,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
    safetySettings: SAFETY_SETTINGS,
  });
}

/**
 * Extracts and parses a JSON object from a Gemini response string.
 * Strips markdown code fences if present before parsing.
 */
export function parseGeminiJSON<T>(text: string): T | null {
  try {
    // Strip ```json ... ``` fences
    const stripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    // Extract the first {...} or [...] block
    const match = stripped.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}
