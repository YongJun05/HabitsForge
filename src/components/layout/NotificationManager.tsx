/**
 * NotificationManager — renders nothing, lives for the entire app session.
 *
 * Mounted once in App.tsx inside <BrowserRouter> so it NEVER unmounts when
 * the user navigates between pages. This is the only correct place for the
 * reminder interval — if it lived in DashboardPage it would be destroyed
 * every time the user left the dashboard.
 *
 * Every 30 seconds it:
 *  1. Reads the current HH:MM time
 *  2. Compares against each habit's reminder_time
 *  3. Fires a browser Notification + logs to the in-app bell center
 *
 * Habits and their "done today" state are refreshed from Supabase every
 * minute so the manager always has up-to-date data without relying on
 * React state from any specific page.
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

const NotificationManager: React.FC = () => {
  const habitsRef = useRef<ReminderHabit[]>([]);
  const firedRef = useRef<Set<string>>(new Set());
  const lastFiredMinuteRef = useRef<string>('');

  // ------------------------------------------------------------------
  // Fetch only reminder-enabled habits + today's logs from Supabase
  // ------------------------------------------------------------------
  const fetchHabits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { habitsRef.current = []; return; }

      const today = new Date();
      const todayStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
      ].join('-');

      // Only fetch habits that have reminders enabled
      const { data: habits } = await supabase
        .from('habits')
        .select('id, name, reminder_enabled, reminder_time')
        .eq('user_id', session.user.id)
        .eq('archived', false)
        .eq('reminder_enabled', true);

      if (!habits || habits.length === 0) { habitsRef.current = []; return; }

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

      console.log('[HabitsForge] NotificationManager: loaded', habitsRef.current.length, 'habits with reminders');
    } catch (err) {
      console.error('[HabitsForge] NotificationManager fetch error:', err);
      habitsRef.current = [];
    }
  };

  // ------------------------------------------------------------------
  // Tick — called every 30 seconds
  // ------------------------------------------------------------------
  const tick = () => {
    if (!isNotificationSupported) return;
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Reset fired set when the minute changes
    if (currentTime !== lastFiredMinuteRef.current) {
      firedRef.current = new Set();
      lastFiredMinuteRef.current = currentTime;
    }

    for (const habit of habitsRef.current) {
      if (!habit.reminder_enabled || !habit.reminder_time) continue;
      if (habit.isDoneToday) continue;
      if (habit.reminder_time !== currentTime) continue;

      const key = habit.id;
      if (firedRef.current.has(key)) continue;
      firedRef.current.add(key);

      try {
        new Notification('HabitsForge 🔥', {
          body: `Time for: ${habit.name}!`,
          icon: '/vite.svg',
          tag: habit.id,
        });
        addStoredNotification(habit.id, habit.name);
        console.log('[HabitsForge] Fired reminder for:', habit.name, 'at', currentTime);
      } catch (err) {
        console.error('[HabitsForge] Notification error:', err);
      }
    }
  };

  useEffect(() => {
    if (!isNotificationSupported) return;

    // Initial fetch
    fetchHabits();

    // Re-fetch habits every 60 seconds to stay in sync
    const fetchInterval = setInterval(fetchHabits, 60000);

    // Check for due reminders every 30 seconds (smaller miss window than 60s)
    const notifInterval = setInterval(tick, 30000);

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
