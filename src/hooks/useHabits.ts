/**
 * Central data hook for habits. Fetches habits + logs from Supabase,
 * enriches each habit with streak data, and exposes CRUD operations.
 *
 * Key design decisions:
 * - Fetches ALL habit_logs in ONE query (not per-habit) to avoid N+1 queries
 * - Groups logs by habit_id client-side for streak calculation
 * - toggleDone: if log exists for today → delete it (undo); if not → insert it
 * - After any mutation → call refetch to keep UI in sync
 * - Uses getSession instead of getUser for faster auth checks
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCurrentStreak, calculateBestStreak, getTodayString, getCurrentWeekString } from '../lib/streakUtils';
import type { Habit, HabitLog, HabitWithStreak } from '../types';

interface UseHabitsReturn {
  habits: HabitWithStreak[];
  allLogs: HabitLog[];
  loading: boolean;
  error: string | null;
  createHabit: (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateHabit: (id: string, data: Partial<Omit<Habit, 'id' | 'user_id'>>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleDone: (habitId: string, note?: string | null) => Promise<void>;
  freezeHabit: (habitId: string) => Promise<void>;
  restoreHabit: (id: string) => Promise<void>;
  permanentDeleteHabit: (id: string) => Promise<void>;
  reorderHabit: (habitId: string, newOrder: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [allLogs, setAllLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Use getSession (cached) instead of getUser (network call) for speed
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const userId = session.user.id;

      // Fetch habits (non-archived) and ALL logs in parallel — avoids N+1 queries
      const [habitsResult, logsResult] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userId).eq('archived', false).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('*').eq('user_id', userId),
      ]);

      if (habitsResult.error) throw new Error(habitsResult.error.message);
      if (logsResult.error) throw new Error(logsResult.error.message);

      const rawHabits: Habit[] = habitsResult.data ?? [];
      const rawLogs: HabitLog[] = logsResult.data ?? [];

      setAllLogs(rawLogs);

      // Group logs by habit_id for efficient streak calculation
      const logsByHabitId = new Map<string, string[]>();
      for (const log of rawLogs) {
        const existing = logsByHabitId.get(log.habit_id) ?? [];
        existing.push(log.log_date);
        logsByHabitId.set(log.habit_id, existing);
      }

      const today = getTodayString();

      // Enrich each habit with computed streak data
      const enriched: HabitWithStreak[] = rawHabits.map((habit) => {
        const habitLogs = logsByHabitId.get(habit.id) ?? [];
        const logDates = habitLogs.map((l) => l); // already YYYY-MM-DD strings

        // Last 7 days: check which of the past 7 days have logs
        const recentLogs: string[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          if (logDates.includes(dateStr)) {
            recentLogs.push(dateStr);
          }
        }

        return {
          ...habit,
          currentStreak: calculateCurrentStreak(logDates, habit.freeze_used_week),
          bestStreak: calculateBestStreak(logDates),
          recentLogs,
          isDoneToday: logDates.includes(today),
          allLogDates: logDates,
        };
      });

      setHabits(enriched);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch habits';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const createHabit = useCallback(async (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('habits')
        .insert({ ...data, user_id: session.user.id });

      if (insertError) throw new Error(insertError.message);
      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  const updateHabit = useCallback(async (id: string, data: Partial<Omit<Habit, 'id' | 'user_id'>>) => {
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('habits')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw new Error(updateError.message);
      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  /** Archive a habit (soft delete) instead of permanent deletion */
  const deleteHabit = useCallback(async (id: string) => {
    setError(null);
    try {
      const { error: archiveError } = await supabase
        .from('habits')
        .update({ archived: true, archived_at: new Date().toISOString() })
        .eq('id', id);

      if (archiveError) throw new Error(archiveError.message);
      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to archive habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  /** Restore an archived habit */
  const restoreHabit = useCallback(async (id: string) => {
    setError(null);
    try {
      const { error: restoreError } = await supabase
        .from('habits')
        .update({ archived: false, archived_at: null })
        .eq('id', id);

      if (restoreError) throw new Error(restoreError.message);
      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to restore habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  /** Permanently delete a habit and its logs */
  const permanentDeleteHabit = useCallback(async (id: string) => {
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (deleteError) throw new Error(deleteError.message);
      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  /** Toggle habit done for today, optionally with a note */
  const toggleDone = useCallback(async (habitId: string, note?: string | null) => {
    setError(null);
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session?.user) throw new Error('Not authenticated');

      const today = getTodayString();

      // Check if a log already exists for today
      const { data: existing, error: queryError } = await supabase
        .from('habit_logs')
        .select('id')
        .eq('habit_id', habitId)
        .eq('log_date', today)
        .maybeSingle();

      if (queryError) throw new Error(queryError.message);

      if (existing) {
        // Undo: delete today's log
        const { error: deleteError } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existing.id);
        if (deleteError) throw new Error(deleteError.message);
      } else {
        // Log today's completion with optional note
        const insertData: { habit_id: string; user_id: string; log_date: string; note?: string | null } = {
          habit_id: habitId,
          user_id: session.user.id,
          log_date: today,
        };
        if (note !== undefined) insertData.note = note;

        const { error: insertError } = await supabase
          .from('habit_logs')
          .insert(insertData);
        if (insertError) throw new Error(insertError.message);
      }

      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  /** Use weekly streak freeze on a habit */
  const freezeHabit = useCallback(async (habitId: string) => {
    setError(null);
    try {
      const weekStr = getCurrentWeekString();

      const { error: freezeError } = await supabase
        .from('habits')
        .update({ freeze_used_week: weekStr, streak_frozen: true })
        .eq('id', habitId);

      if (freezeError) throw new Error(freezeError.message);
      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to freeze habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  /** Reorder a habit by setting its sort_order */
  const reorderHabit = useCallback(async (habitId: string, newOrder: number) => {
    setError(null);
    try {
      const { error: reorderError } = await supabase
        .from('habits')
        .update({ sort_order: newOrder })
        .eq('id', habitId);

      if (reorderError) throw new Error(reorderError.message);
      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reorder habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  return {
    habits,
    allLogs,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleDone,
    freezeHabit,
    restoreHabit,
    permanentDeleteHabit,
    reorderHabit,
    refetch: fetchHabits,
  };
}
