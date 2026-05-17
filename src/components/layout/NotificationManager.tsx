/**
 * components/layout/NotificationManager.tsx
 * 
 * NotificationManager — renders nothing, lives for the entire app session.
 *
 * Mounted once in App.tsx inside <BrowserRouter> so it NEVER unmounts when
 * the user navigates between pages.
 *
 * Every 15 seconds it:
 *  1. Reads the current HH:MM time
 *  2. Compares against each habit's reminder_time
 *  3. Fires a browser Notification + logs to the in-app bell center
 *
 * Also runs a tick IMMEDIATELY after each habit fetch so reminders that
 * are due right now are never missed.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { addStoredNotification } from '../../lib/notificationStore';
import { isNotificationSupported } from '../../hooks/useNotifications';

interface ReminderHabit {
  id: string;
  name: string;
  reminder_enabled: boolean;
  reminder_time: string | null;
  isDoneToday: boolean;
}

/** 
 * Normalises time to "HH:MM" format.
 * @param t - The time string to normalise.
 * @returns The normalised "HH:MM" string, or null if invalid.
 */
function normaliseTime(t: string | null | undefined): string | null {
  if (!t) return null;
  // Take only the first 5 chars → "HH:MM"
  const trimmed = t.trim().slice(0, 5);
  // Validate format
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

/**
 * Gets the current time in "HH:MM" format.
 * @returns The current time as a string.
 */
function getCurrentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Background manager for scheduling and firing notifications.
 * @returns null - this component does not render any UI.
 */
const NotificationManager: React.FC = () => {
  const habitsRef = useRef<ReminderHabit[]>([]);
  const firedRef = useRef<Set<string>>(new Set());
  const lastFiredMinuteRef = useRef<string>('');

  /**
   * Tick — check all habits against current time.
   * WHY: We check every 15 seconds instead of calculating exact timeouts.
   * This is more robust against the device going to sleep or tab throttling.
   * A 15-second tick ensures we never miss a minute boundary by much.
   */
  const tick = useCallback(() => {
    const currentTime = getCurrentHHMM();

    // Reset fired set when the minute changes
    if (currentTime !== lastFiredMinuteRef.current) {
      firedRef.current = new Set();
      lastFiredMinuteRef.current = currentTime;
    }

    const habits = habitsRef.current;
    if (habits.length === 0) return;

    for (const habit of habits) {
      if (!habit.reminder_enabled || !habit.reminder_time) continue;
      if (habit.isDoneToday) continue;

      const habitTime = normaliseTime(habit.reminder_time);
      if (!habitTime) continue;
      if (habitTime !== currentTime) continue;

      const key = habit.id;
      if (firedRef.current.has(key)) continue;
      firedRef.current.add(key);

      // Always add to in-app store so bell updates immediately (works on mobile too)
      addStoredNotification(habit.id, habit.name);

      // Only try to show system notification if supported and granted
      if (isNotificationSupported && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('HabitsForge 🔥', {
            body: `Time for: ${habit.name}!`,
            icon: '/vite.svg',
            tag: habit.id,
          });
        } catch {
          // Fallback: If Notification API throws (e.g. some restricted environments),
          // we gracefully hide the error since the in-app bell still caught it.
        }
      }
    }
  }, []);

  /**
   * Fetch reminder-enabled habits + today's done status.
   * WHY: We fetch every 60 seconds so that if a user marks a habit done
   * on another device or tab, this tab won't fire a redundant notification.
   */
  const fetchHabits = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        habitsRef.current = [];
        return;
      }

      const today = new Date();
      const todayStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');

      const { data: habits, error: habitsErr } = await supabase
        .from('habits')
        .select('id, name, reminder_enabled, reminder_time')
        .eq('user_id', session.user.id)
        .eq('archived', false)
        .eq('reminder_enabled', true);

      if (habitsErr) {
        return;
      }

      if (!habits || habits.length === 0) {
        habitsRef.current = [];
        return;
      }

      // Check which are already done today
      const { data: logs } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('log_date', todayStr)
        .in('habit_id', habits.map((h) => h.id));

      const doneSet = new Set((logs ?? []).map((l: { habit_id: string }) => l.habit_id));

      habitsRef.current = habits.map((h) => ({
        id: h.id,
        name: h.name,
        reminder_enabled: h.reminder_enabled,
        reminder_time: h.reminder_time,
        isDoneToday: doneSet.has(h.id),
      }));

      // CRITICAL: run a tick immediately after loading habits so we
      // don't miss a reminder that's due right now
      tick();
    } catch {
      // Gracefully ignore fetch errors here. The component runs continuously in the background
      // and will retry on the next interval. Logging here just swallows errors.
    }
  }, [tick]);

  useEffect(() => {
    // Initial fetch (+ immediate tick inside fetchHabits)
    fetchHabits();

    // Re-fetch habits every 60 seconds to stay in sync
    const fetchInterval = setInterval(fetchHabits, 60000);

    // Check for due reminders every 15 seconds for reliability
    const notifInterval = setInterval(tick, 15000);

    // Re-fetch when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchHabits();
    });

    return () => {
      clearInterval(fetchInterval);
      clearInterval(notifInterval);
      subscription.unsubscribe();
    };
  }, [fetchHabits, tick]); // dependencies fixed

  return null; // renders nothing
};

export default NotificationManager;
