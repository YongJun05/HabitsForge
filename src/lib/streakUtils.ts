/**
 * Pure utility functions for streak calculations.
 * All date comparisons use local YYYY-MM-DD strings so that
 * a habit done at 11pm local time counts for "today", not "yesterday" in UTC.
 */

/**
 * Returns today's date as a YYYY-MM-DD string in local time.
 * Using local time (not UTC) so streaks feel natural to the user —
 * a habit done at 11pm local time counts for today, not yesterday.
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current ISO week string e.g. "2026-W20".
 * Used for streak freeze tracking — one freeze per week.
 */
export function getCurrentWeekString(): string {
  const now = new Date();
  // ISO week number calculation
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Helper to format a Date as YYYY-MM-DD string.
 */
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get the ISO week string for a specific date.
 */
function getWeekStringForDate(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Calculates the current consecutive streak from a list of log dates.
 *
 * Algorithm:
 * - If today has a log, start counting from today backwards
 * - If today has no log yet, start counting from yesterday backwards
 * - Stop counting as soon as we hit a day with no log
 * - If freezeUsedWeek matches a missing day's week, skip it (don't break streak)
 *
 * Edge cases handled:
 * - Empty logs array → returns 0
 * - Logs exist but streak was broken → only counts recent consecutive days
 * - Timezone: all dates compared as local YYYY-MM-DD strings
 */
export function calculateCurrentStreak(logs: string[], freezeUsedWeek?: string | null): number {
  if (logs.length === 0) return 0;

  const logSet = new Set(logs);
  const today = getTodayString();

  // Decide whether to start from today or yesterday
  // If today is done, count from today; otherwise from yesterday
  // (user may not have done today's habit yet)
  let startDate: Date;
  if (logSet.has(today)) {
    startDate = new Date(today + 'T00:00:00');
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    startDate = new Date(formatDate(yesterday) + 'T00:00:00');
  }

  let streak = 0;
  const current = new Date(startDate);
  let freezeApplied = false;

  // Walk backwards day by day until we find a gap
  while (true) {
    const dateStr = formatDate(current);

    if (logSet.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else if (
      !freezeApplied &&
      freezeUsedWeek &&
      getWeekStringForDate(current) === freezeUsedWeek
    ) {
      // Freeze covers this missing day — count it and continue
      streak++;
      freezeApplied = true;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates the longest ever streak from a full log history.
 *
 * Algorithm:
 * - Sort all dates ascending
 * - Walk through, counting consecutive days
 * - Track the maximum count seen
 *
 * Edge cases handled:
 * - Duplicate dates are deduplicated before processing
 * - Single-day logs → returns 1
 * - Empty logs → returns 0
 */
export function calculateBestStreak(logs: string[]): number {
  if (logs.length === 0) return 0;

  // Deduplicate and sort ascending
  const uniqueSorted = [...new Set(logs)].sort();

  let bestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = new Date(uniqueSorted[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueSorted[i] + 'T00:00:00');

    // Check if dates are exactly 1 day apart
    const diffMs = curr.getTime() - prev.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}

/**
 * Returns milestone badge info based on best streak.
 * Returns null if no milestone reached.
 */
export function getMilestoneBadge(bestStreak: number): { emoji: string; label: string } | null {
  if (bestStreak >= 100) return { emoji: '🥇', label: 'CENTURY CLUB' };
  if (bestStreak >= 30) return { emoji: '🥈', label: 'MONTHLY MASTER' };
  if (bestStreak >= 7) return { emoji: '🥉', label: 'WEEK WARRIOR' };
  return null;
}
