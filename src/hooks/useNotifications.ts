/**
 * hooks/useNotifications.ts
 * 
 * Hook for browser notification permission and push subscription management.
 *
 * The actual reminder interval is handled by NotificationManager (App.tsx)
 * which persists across all route changes. This hook exposes:
 * - Browser notification permission state
 * - Push subscription state (subscribed/not)
 * - Functions to request permission, subscribe, and unsubscribe
 */
import { useState, useCallback, useEffect } from 'react';
import type { NotificationPermissionStatus } from '../types';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
  registerServiceWorker,
} from '../lib/pushSubscription';

/** Safe check — Notification API is absent on iOS Safari and some private modes. */
export const isNotificationSupported =
  typeof window !== 'undefined' && 'Notification' in window;

interface UseNotificationsReturn {
  permission: NotificationPermissionStatus;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
  /** Whether the user has an active push subscription */
  pushSubscribed: boolean;
  /** Whether a push subscribe/unsubscribe operation is in progress */
  pushLoading: boolean;
  /** Whether the browser supports push notifications */
  isPushAvailable: boolean;
  /** Subscribe to push notifications (registers SW + saves to DB) */
  handleSubscribePush: () => Promise<void>;
  /** Unsubscribe from push notifications */
  handleUnsubscribePush: () => Promise<void>;
}

/**
 * Hook to manage notification permissions and push subscriptions.
 * 
 * @returns {UseNotificationsReturn} Permission state, push state, and action functions.
 */
export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermissionStatus>(() => {
    if (!isNotificationSupported) return 'unsupported';
    return Notification.permission as NotificationPermissionStatus;
  });

  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  // Check push subscription status on mount
  useEffect(() => {
    if (isPushSupported) {
      // Register service worker early so it's ready
      registerServiceWorker();
      // Check if already subscribed
      isPushSubscribed().then(setPushSubscribed);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isNotificationSupported) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionStatus);
      // If permission granted, automatically try to subscribe to push
      if (result === 'granted' && isPushSupported) {
        setPushLoading(true);
        const success = await subscribeToPush();
        setPushSubscribed(success);
        setPushLoading(false);
      }
    } catch {
      setPermission('denied');
    }
  }, []);

  const handleSubscribePush = useCallback(async () => {
    setPushLoading(true);
    try {
      const success = await subscribeToPush();
      setPushSubscribed(success);
      if (success) {
        setPermission('granted');
      }
    } finally {
      setPushLoading(false);
    }
  }, []);

  const handleUnsubscribePush = useCallback(async () => {
    setPushLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setPushSubscribed(false);
      }
    } finally {
      setPushLoading(false);
    }
  }, []);

  return {
    permission,
    requestPermission,
    isSupported: isNotificationSupported,
    pushSubscribed,
    pushLoading,
    isPushAvailable: isPushSupported,
    handleSubscribePush,
    handleUnsubscribePush,
  };
}
