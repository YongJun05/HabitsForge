/**
 * Hook for browser notification support and habit reminders.
 *
 * Accepts the current habits list directly and manages a 60-second
 * interval internally. Uses a ref to always read the LATEST habits/permission
 * inside the interval callback, avoiding stale closure bugs.
 *
 * Clears the interval on unmount to prevent memory leaks.
 * Gracefully handles browsers where the Notification API is absent
 * (e.g. iOS Safari, Firefox private mode).
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import type { HabitWithStreak, NotificationPermissionStatus } from '../types';
import { addStoredNotification } from '../lib/notificationStore';

/** Safe check — Notification API is absent on iOS Safari and some private modes. */
export const isNotificationSupported =
  typeof window !== 'undefined' && 'Notification' in window;

interface UseNotificationsReturn {
  permission: NotificationPermissionStatus;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}

export function useNotifications(habits: HabitWithStreak[] = []): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() => {
    if (!isNotificationSupported) return 'unsupported';
    return Notification.permission as NotificationPermissionStatus;
  });

  // Debug: log permission on mount — check DevTools console to verify
  useEffect(() => {
    console.log('[HabitsForge] Notification permission:', isNotificationSupported ? Notification.permission : 'unsupported');
  }, []);

  // Keep a ref to the latest habits and permission so the interval
  // callback always sees fresh values without needing to be recreated.
  const habitsRef = useRef<HabitWithStreak[]>(habits);
  const permissionRef = useRef<NotificationPermissionStatus>(permission);

  useEffect(() => { habitsRef.current = habits; }, [habits]);
  useEffect(() => { permissionRef.current = permission; }, [permission]);

  // Track which reminders have already fired this minute to avoid duplicates
  const firedRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start the interval once on mount; it reads from refs so it never goes stale
  useEffect(() => {
    if (!isNotificationSupported) return;

    intervalRef.current = setInterval(() => {
      if (permissionRef.current !== 'granted') return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      for (const habit of habitsRef.current) {
        if (!habit.reminder_enabled || !habit.reminder_time) continue;
        if (habit.isDoneToday) continue;
        if (habit.reminder_time !== currentTime) continue;

        // Avoid firing the same notification twice in the same minute
        const key = `${habit.id}-${currentTime}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);

        try {
          new Notification('HabitsForge', {
            body: `Time for: ${habit.name}!`,
            icon: '/vite.svg',
            tag: habit.id,
          });
          // Also log to in-app notification center (bell badge in navbar)
          addStoredNotification(habit.id, habit.name);
        } catch {
          // Notification creation can fail in some contexts — fail silently
        }
      }
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // intentionally empty — interval runs once, reads via refs

  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionStatus);
    } catch {
      setPermission('denied');
    }
  }, []);

  return { permission, requestPermission, isSupported: isNotificationSupported };
}
