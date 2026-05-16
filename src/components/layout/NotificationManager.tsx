/**
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
import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { isNotificationSupported, addStoredNotification } from '../../lib/notificationStore';

interface ReminderHabit {
  id: string;
  name: string;
  reminder_enabled: boolean;
  reminder_time: string | null;
  isDoneToday: boolean;
}

/** Normalise time to "HH:MM" — handles "HH:MM:SS", "HH:MM", and edge cases */
function normaliseTime(t: string | null | undefined): string | null {
  if (!t) return null;
  // Take only the first 5 chars → "HH:MM"
  const trimmed = t.trim().slice(0, 5);
  // Validate format
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return null;
}

function getCurrentHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const NotificationManager: React.FC = () => {
  const habitsRef = useRef<ReminderHabit[]>([]);
  const firedRef = useRef<Set<string>>(new Set());
  const lastFiredMinuteRef = useRef<string>('');

  // ------------------------------------------------------------------
  // Tick — check all habits against current time
  // ------------------------------------------------------------------
  const tick = () => {
    if (!isNotificationSupported) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const currentTime = getCurrentHHMM();

    // Reset fired set when the minute changes
    if (currentTime !== lastFiredMinuteRef.current) {
      firedRef.current = new Set();
      lastFiredMinuteRef.current = currentTime;
    }

    const habits = habitsRef.current;
    if (habits.length === 0) return;

    console.log(`[HabitsForge] tick @ ${currentTime} — checking ${habits.length} habits`);

    for (const habit of habits) {
      if (!habit.reminder_enabled || !habit.reminder_time) continue;
      if (habit.isDoneToday) continue;

      const habitTime = normaliseTime(habit.reminder_time);
      if (!habitTime) continue;
      if (habitTime !== currentTime) continue;

      const key = habit.id;
      if (firedRef.current.has(key)) continue;
      firedRef.current.add(key);

      console.log(`[HabitsForge] 🔔 Firing reminder for "${habit.name}" (${habitTime} === ${currentTime})`);

      try {
        new Notification('HabitsForge 🔥', {
          body: `Time for: ${habit.name}!`,
          icon: '/vite.svg',
          tag: habit.id,
        });
        addStoredNotification(habit.id, habit.name);
      } catch (err) {
        console.error('[HabitsForge] Notification constructor error:', err);
      }
    }
  };

  // ------------------------------------------------------------------
  // Fetch reminder-enabled habits + today's done status
  // ------------------------------------------------------------------
  const fetchHabits = async () => {
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
        console.error('[HabitsForge] NotificationManager: fetch habits error', habitsErr);
        return;
      }

      if (!habits || habits.length === 0) {
        habitsRef.current = [];
        console.log('[HabitsForge] NotificationManager: no habits with reminders');
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

      console.log(
        '[HabitsForge] NotificationManager: loaded',
        habitsRef.current.length,
        'habits:',
        habitsRef.current.map((h) => `${h.name} @ ${h.reminder_time} (done=${h.isDoneToday})`),
      );

      // CRITICAL: run a tick immediately after loading habits so we
      // don't miss a reminder that's due right now
      tick();
    } catch (err) {
      console.error('[HabitsForge] NotificationManager fetch error:', err);
    }
  };

  useEffect(() => {
    if (!isNotificationSupported) {
      console.log('[HabitsForge] NotificationManager: Notification API not supported');
      return;
    }

    console.log('[HabitsForge] NotificationManager: mounted, permission =', Notification.permission);

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
  }, []); // runs once — never depends on React state

  return null; // renders nothing
};

export default NotificationManager;
