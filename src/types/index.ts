/**
 * TypeScript type definitions for HabitsForge.
 * These types mirror the database schema and add computed fields
 * used by the UI layer (streaks, recent logs, etc.).
 */

export interface Profile {
  id: string;
  display_name: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category?: string;
  icon: string;
  color: string;
  reminder_enabled: boolean;
  reminder_time?: string; // "HH:MM" 24h format
  created_at: string;
  updated_at: string;
  // Streak freeze
  freeze_used_week?: string | null; // ISO week e.g. "2026-W20"
  streak_frozen?: boolean;
  // Archive
  archived?: boolean;
  archived_at?: string | null;
  // Reordering
  sort_order?: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // "YYYY-MM-DD"
  created_at: string;
  note?: string | null; // optional check-in note
}

/** Habit enriched with computed streak data for display */
export interface HabitWithStreak extends Habit {
  currentStreak: number;
  bestStreak: number;
  recentLogs: string[]; // last 7 days "YYYY-MM-DD" strings that have logs
  isDoneToday: boolean;
  allLogDates: string[]; // all log dates for this habit (for charts)
}

export interface HabitSuggestion {
  name: string;
  description: string;
  icon: string;
  reminder_time: string; // "HH:MM"
  color: string;
}

/** Mirrors the push_subscriptions database table */
export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';
