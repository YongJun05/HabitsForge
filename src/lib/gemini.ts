/**
 * Gemini API integration for AI-powered habit suggestions and weekly insights.
 * Uses the REST endpoint directly — no SDK needed, keeping the bundle small.
 */
import type { HabitSuggestion } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Calls Gemini API to suggest 3 habit ideas based on a user's goal.
 *
 * Design decision: We use a strict system prompt that enforces JSON-only output.
 * This lets us safely parse the response without needing to handle markdown
 * code fences or conversational text. We still strip ```json fences as a
 * fallback in case the model adds them despite instructions.
 *
 * Edge cases:
 * - Network failure → throws descriptive error
 * - Malformed JSON response → throws parse error with raw text for debugging
 * - API key missing → throws early with clear message
 */
export async function suggestHabits(goal: string): Promise<HabitSuggestion[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Check your .env file.');
  }

  const systemInstruction =
    "You are a habit-building coach. The user will describe a personal goal. Respond ONLY with a valid JSON array of exactly 3 habit suggestions. No explanation, no markdown, no extra text — just the raw JSON array. Each object must have: name (max 8 words), description (one sentence, max 20 words), icon (must be one of: flame, book, brain, droplets, dumbbell, apple, moon, sun, heart, footprints, pencil, coffee, music, smile, sparkles, bike, leaf, pill, target, trophy), reminder_time (HH:MM 24h format), color (must be one of: #ffe600, #2563EB, #FF2D9B, #22C55E, #000000, #FFFFFF)";

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: `My goal: ${goal}` }] }],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 500,
    },
  };

  const response = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!rawText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  // Strip markdown code fences as a fallback — the prompt says no markdown,
  // but LLMs sometimes add them anyway
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const suggestions: HabitSuggestion[] = JSON.parse(cleaned);
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Expected a non-empty array');
    }
    return suggestions;
  } catch {
    // Fallback: try to extract the first JSON array from any surrounding text.
    const startIndex = cleaned.indexOf('[');
    const endIndex = cleaned.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const extracted = cleaned.slice(startIndex, endIndex + 1).trim();
      try {
        const suggestions: HabitSuggestion[] = JSON.parse(extracted);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions;
        }
      } catch {
        // fall through to error below
      }
    }

    throw new Error(`Failed to parse Gemini response as JSON. Raw text: ${cleaned}`);
  }
}

/**
 * Calls Gemini API to generate a personalised weekly insight.
 *
 * The summary passed in is pre-processed frontend-side (no raw IDs or PII
 * sent to the API — only aggregated stats like "completed 5/7 days").
 *
 * Caching strategy: the caller (useWeeklyInsight hook) caches results
 * in localStorage for 7 days to avoid unnecessary API calls.
 */
export async function generateWeeklyInsight(summary: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Check your .env file.');
  }

  const systemInstruction =
    "You are a friendly, motivating habit coach reviewing someone's weekly habit data. Write a short insight (3–4 sentences) that: 1) celebrates their strongest habit by name, 2) identifies their biggest gap or pattern (e.g. skipping on specific days), 3) gives one practical actionable tip. Tone: warm, direct, encouraging — like a coach, not a robot. Write as a single paragraph. No bullet points, no headers.";

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: [{ text: summary }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
    },
  };

  const response = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) {
    throw new Error('Gemini returned an empty insight. Please try again.');
  }

  return text.trim();
}
