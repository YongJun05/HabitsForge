/**
 * TypeScript type definitions for HabitForge.
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
  icon: string;
  color: string;
  reminder_enabled: boolean;
  reminder_time?: string; // "HH:MM" 24h format
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // "YYYY-MM-DD"
  created_at: string;
}

/** Habit enriched with computed streak data for display */
export interface HabitWithStreak extends Habit {
  currentStreak: number;
  bestStreak: number;
  recentLogs: string[]; // last 7 days "YYYY-MM-DD" strings that have logs
  isDoneToday: boolean;
}

export interface HabitSuggestion {
  name: string;
  description: string;
  icon: string;
  reminder_time: string; // "HH:MM"
  color: string;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';
