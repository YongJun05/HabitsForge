/**
 * Hook for generating and caching AI weekly insights.
 *
 * Caching strategy: results are stored in localStorage for 7 days
 * to avoid unnecessary API calls. The refresh() method clears the cache
 * and regenerates the insight.
 *
 * Privacy: only aggregated stats (habit names + completion counts) are
 * sent to the Gemini API — no IDs or PII.
 */
import { useState, useEffect, useCallback } from 'react';
import { generateWeeklyInsight } from '../lib/gemini';
import { getTodayString } from '../lib/streakUtils';
import type { HabitWithStreak } from '../types';

const CACHE_KEY = 'habitforge_weekly_insight';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedInsight {
  text: string;
  timestamp: number;
}

interface UseWeeklyInsightReturn {
  insight: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Builds a clean summary string from habits — no IDs, just names and counts.
 * This is what gets sent to the Gemini API for insight generation.
 */
function buildSummary(habits: HabitWithStreak[]): string {
  const today = getTodayString();
  const lines = habits.map((h) => {
    const doneToday = h.isDoneToday ? 'done today' : 'not done today';
    const last7 = h.recentLogs.length;
    return `- ${h.name}: ${doneToday}, completed ${last7}/7 days this week, current streak: ${h.currentStreak} days, best streak: ${h.bestStreak} days`;
  });
  return `Today is ${today}. Here is my weekly habit data:\n${lines.join('\n')}`;
}

export function useWeeklyInsight(habits: HabitWithStreak[]): UseWeeklyInsightReturn {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (habits.length === 0) {
      setInsight(null);
      return;
    }

    // Check localStorage cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed: CachedInsight = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          setInsight(parsed.text);
          return;
        }
      } catch {
        // Corrupted cache — ignore and regenerate
      }
    }

    setLoading(true);
    setError(null);

    try {
      const summary = buildSummary(habits);
      const text = await generateWeeklyInsight(summary);
      setInsight(text);

      // Cache the result
      const cacheEntry: CachedInsight = { text, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate insight';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [habits]);

  useEffect(() => {
    generate();
  }, [generate]);

  const refresh = useCallback(() => {
    // Clear cache and regenerate
    localStorage.removeItem(CACHE_KEY);
    setInsight(null);
    setError(null);
    generate();
  }, [generate]);

  return { insight, loading, error, refresh };
}
