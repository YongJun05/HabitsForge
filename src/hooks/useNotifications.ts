/**
 * Hook for browser notification support and habit reminders.
 *
 * Schedules a 60-second interval that checks if any habit's reminder_time
 * matches the current time. If so, and the habit isn't done today,
 * a browser notification is fired.
 *
 * Important: the interval is cleared on component unmount to avoid memory leaks.
 * Also handles the case where the Notification API is not supported
 * (e.g. Firefox private mode, iOS Safari).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { HabitWithStreak, NotificationPermissionStatus } from '../types';

interface UseNotificationsReturn {
  permission: NotificationPermissionStatus;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
  scheduleReminders: (habits: HabitWithStreak[]) => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission as NotificationPermissionStatus;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track which reminders we've already fired this minute to avoid duplicates
  const firedRef = useRef<Set<string>>(new Set());

  const isSupported = typeof Notification !== 'undefined';

  const requestPermission = useCallback(async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionStatus);
    } catch {
      setPermission('denied');
    }
  }, [isSupported]);

  const scheduleReminders = useCallback((habits: HabitWithStreak[]) => {
    // Clear any existing interval before setting a new one
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isSupported || permission !== 'granted') return;

    // Reset fired set when rescheduling
    firedRef.current = new Set();

    // Check every 60 seconds if any habit needs a reminder
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (const habit of habits) {
        if (!habit.reminder_enabled || !habit.reminder_time) continue;
        if (habit.isDoneToday) continue;
        if (habit.reminder_time !== currentTime) continue;

        // Avoid firing the same notification twice in the same minute
        const key = `${habit.id}-${currentTime}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);

        try {
          new Notification('HabitForge', {
            body: `Time for: ${habit.name}!`,
          });
        } catch {
          // Notification creation can fail in some contexts — fail silently
        }
      }
    }, 60000);
  }, [isSupported, permission]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return { permission, requestPermission, isSupported, scheduleReminders };
}
