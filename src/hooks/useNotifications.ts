/**
 * hooks/useNotifications.ts
 * 
 * Hook for browser notification permission management.
 *
 * The actual reminder interval is handled by NotificationManager (App.tsx)
 * which persists across all route changes. This hook simply exposes the
 * current permission state and a requestPermission callback for the UI.
 */
import { useState, useCallback } from 'react';
import type { NotificationPermissionStatus } from '../types';

/** Safe check — Notification API is absent on iOS Safari and some private modes. */
export const isNotificationSupported =
  typeof window !== 'undefined' && 'Notification' in window;

interface UseNotificationsReturn {
  permission: NotificationPermissionStatus;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}

/**
 * Hook to manage notification permissions.
 * 
 * @returns {UseNotificationsReturn} The permission state and a function to request it.
 */
export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() => {
    if (!isNotificationSupported) return 'unsupported';
    return Notification.permission as NotificationPermissionStatus;
  });

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
