/**
 * Central data hook for habits. Fetches habits + logs from Supabase,
 * enriches each habit with streak data, and exposes CRUD operations.
 *
 * Key design decisions:
 * - Fetches ALL habit_logs in ONE query (not per-habit) to avoid N+1 queries
 * - Groups logs by habit_id client-side for streak calculation
 * - toggleDone: if log exists for today → delete it (undo); if not → insert it
 * - After any mutation → call refetch to keep UI in sync
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateCurrentStreak, calculateBestStreak, getTodayString } from '../lib/streakUtils';
import type { Habit, HabitWithStreak } from '../types';

interface UseHabitsReturn {
  habits: HabitWithStreak[];
  loading: boolean;
  error: string | null;
  createHabit: (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateHabit: (id: string, data: Partial<Omit<Habit, 'id' | 'user_id'>>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleDone: (habitId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useHabits(): UseHabitsReturn {
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user — needed to query user-specific data
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Fetch habits and ALL logs in parallel — avoids N+1 queries
      const [habitsResult, logsResult] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('habit_logs').select('id, habit_id, log_date').eq('user_id', user.id),
      ]);

      if (habitsResult.error) throw new Error(habitsResult.error.message);
      if (logsResult.error) throw new Error(logsResult.error.message);

      const rawHabits: Habit[] = habitsResult.data ?? [];
      const rawLogs: { id: string; habit_id: string; log_date: string }[] = logsResult.data ?? [];

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
          currentStreak: calculateCurrentStreak(logDates),
          bestStreak: calculateBestStreak(logDates),
          recentLogs,
          isDoneToday: logDates.includes(today),
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('habits')
        .insert({ ...data, user_id: user.id });

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

  const deleteHabit = useCallback(async (id: string) => {
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

  const toggleDone = useCallback(async (habitId: string) => {
    setError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');

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
        // Log today's completion
        const { error: insertError } = await supabase
          .from('habit_logs')
          .insert({ habit_id: habitId, user_id: user.id, log_date: today });
        if (insertError) throw new Error(insertError.message);
      }

      await fetchHabits();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle habit';
      setError(message);
      throw err;
    }
  }, [fetchHabits]);

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleDone,
    refetch: fetchHabits,
  };
}
