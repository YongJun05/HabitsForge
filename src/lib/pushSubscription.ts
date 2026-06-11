/**
 * lib/pushSubscription.ts
 *
 * Manages Service Worker registration and Web Push subscription lifecycle.
 * Handles subscribing/unsubscribing and syncing with the Supabase
 * push_subscriptions table.
 */
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/** Check if the browser supports service workers and push */
export const isPushSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

/**
 * Convert a URL-safe base64 VAPID key to the Uint8Array format
 * required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register the service worker and return the registration.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error('[Push] Failed to register service worker:', err);
    return null;
  }
}

/**
 * Subscribe to Web Push notifications.
 * - Registers the service worker if not already registered
 * - Requests notification permission if not granted
 * - Creates a push subscription with the VAPID key
 * - Saves it to the push_subscriptions table in Supabase
 *
 * @returns true if subscription was successful
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported || !VAPID_PUBLIC_KEY) {
    console.warn('[Push] Push not supported or VAPID key missing');
    return false;
  }

  try {
    // 1. Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      console.warn('[Push] No authenticated user');
      return false;
    }

    // 2. Register service worker
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // 3. Request notification permission if needed
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result !== 'granted') return false;
    } else if (Notification.permission === 'denied') {
      return false;
    }

    // 4. Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // 5. If no existing subscription, create one
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // 6. Extract keys from subscription
    const subscriptionJson = subscription.toJSON();
    const endpoint = subscriptionJson.endpoint!;
    const p256dh = subscriptionJson.keys!.p256dh!;
    const auth = subscriptionJson.keys!.auth!;

    // 7. Save to Supabase (upsert by user_id + endpoint)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: session.user.id,
          endpoint,
          p256dh,
          auth,
        },
        { onConflict: 'user_id,endpoint' }
      );

    if (error) {
      console.error('[Push] Failed to save subscription:', error);
      return false;
    }

    console.log('[Push] Successfully subscribed to push notifications');
    return true;
  } catch (err) {
    console.error('[Push] Failed to subscribe:', err);
    return false;
  }
}

/**
 * Unsubscribe from Web Push notifications.
 * - Removes the browser push subscription
 * - Deletes the record from Supabase
 *
 * @returns true if unsubscription was successful
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported) return false;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;

      // Unsubscribe from browser
      await subscription.unsubscribe();

      // Delete from Supabase
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', session.user.id)
        .eq('endpoint', endpoint);
    }

    console.log('[Push] Successfully unsubscribed from push notifications');
    return true;
  } catch (err) {
    console.error('[Push] Failed to unsubscribe:', err);
    return false;
  }
}

/**
 * Check if the user currently has an active push subscription.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
