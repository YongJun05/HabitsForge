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
    "Return ONLY a JSON array of exactly 3 habit suggestions. No prose, no markdown, no extra keys. Keep fields concise.";

  const responseSchema = {
    type: 'array',
    minItems: 3,
    maxItems: 3,
    items: {
      type: 'object',
      required: ['name', 'description', 'icon', 'reminder_time', 'color'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        icon: {
          type: 'string',
          enum: ['flame', 'book', 'brain', 'droplets', 'dumbbell', 'apple', 'moon', 'sun', 'heart', 'footprints', 'pencil', 'coffee', 'music', 'smile', 'sparkles', 'bike', 'leaf', 'pill', 'target', 'trophy'],
        },
        reminder_time: { type: 'string' },
        color: { type: 'string', enum: ['#ffe600', '#2563EB', '#FF2D9B', '#22C55E', '#000000', '#FFFFFF'] },
      },
    },
  };

  const requestOnce = async (temperature: number, maxOutputTokens: number) => {
    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: `My goal: ${goal}` }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
        responseMimeType: 'application/json',
        responseSchema,
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
    const candidate = data?.candidates?.[0];
    const parts: { text?: string }[] = candidate?.content?.parts ?? [];
    const rawText: string = parts.map((part) => part.text ?? '').join('').trim();
    const finishReason: string = candidate?.finishReason ?? 'UNKNOWN';

    return { rawText, finishReason };
  };

  let { rawText, finishReason } = await requestOnce(0.2, 800);
  const isEmptyOrStub = (text: string) => !text.trim() || text.trim() === '[';

  if (finishReason === 'MAX_TOKENS') {
    ({ rawText, finishReason } = await requestOnce(0.2, 1200));
  }

  if (isEmptyOrStub(rawText)) {
    ({ rawText, finishReason } = await requestOnce(0.2, 1200));
  }

  if (isEmptyOrStub(rawText)) {
    throw new Error(`Gemini returned an empty or incomplete response (finishReason=${finishReason}). Please try again in a moment.`);
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
    // Fallback: try to extract the first JSON array/object from any surrounding text.
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    const objectStart = cleaned.indexOf('{');
    const objectEnd = cleaned.lastIndexOf('}');

    if (arrayStart !== -1) {
      const sliced = arrayEnd !== -1 && arrayEnd > arrayStart
        ? cleaned.slice(arrayStart, arrayEnd + 1).trim()
        : cleaned.slice(arrayStart).trim();

      // Best-effort repair for truncated arrays: trim to the last complete object.
      const lastObjectIndex = sliced.lastIndexOf('}');
      const repaired = lastObjectIndex !== -1
        ? `${sliced.slice(0, lastObjectIndex + 1)}]`
        : sliced;

      try {
        const suggestions: HabitSuggestion[] = JSON.parse(repaired);
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions;
        }
      } catch {
        // fall through to retry below
      }
    } else if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
      const objectSlice = cleaned.slice(objectStart, objectEnd + 1).trim();
      try {
        const single = JSON.parse(objectSlice) as HabitSuggestion;
        return [single];
      } catch {
        // fall through to retry below
      }
    }

    // Retry once with a shorter response if the model returned partial JSON.
    ({ rawText, finishReason } = await requestOnce(0.2, 1200));
    cleaned = rawText.trim();
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
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        return suggestions;
      }
    } catch {
      // fall through to error below
    }

    throw new Error(`Failed to parse Gemini response as JSON (finishReason=${finishReason}). Raw text: ${cleaned}`);
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
