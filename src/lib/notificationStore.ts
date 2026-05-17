/**
 * Lightweight in-app notification center backed by localStorage.
 *
 * When a habit reminder fires (useNotifications), it calls addStoredNotification()
 * which saves to localStorage and dispatches a CustomEvent so any listening
 * component (Navbar bell) can reactively update its unread count.
 */

export interface AppNotification {
  id: string;
  habitId: string;
  habitName: string;
  firedAt: number; // Unix timestamp ms
  read: boolean;
}

const getStorageKey = (userId: string) => `habitsforge_notif_center_${userId}`;
const MAX_NOTIFICATIONS = 30;
export const NOTIF_EVENT = 'habitsforge:notification';

export function getStoredNotifications(userId: string): AppNotification[] {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(userId)) ?? '[]');
  } catch {
    return [];
  }
}

export function addStoredNotification(userId: string, habitId: string, habitName: string): void {
  if (!userId) return;
  const existing = getStoredNotifications(userId);
  const newNotif: AppNotification = {
    id: `${habitId}-${Date.now()}`,
    habitId,
    habitName,
    firedAt: Date.now(),
    read: false,
  };
  // Prepend newest first, cap at MAX
  const updated = [newNotif, ...existing].slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
}

export function markAllRead(userId: string): void {
  if (!userId) return;
  const updated = getStoredNotifications(userId).map((n) => ({ ...n, read: true }));
  localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
}

export function clearAllNotifications(userId: string): void {
  if (!userId) return;
  localStorage.removeItem(getStorageKey(userId));
  window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
}

export function getUnreadCount(userId: string): number {
  if (!userId) return 0;
  return getStoredNotifications(userId).filter((n) => !n.read).length;
}

/** Human-readable relative timestamp, e.g. "2 min ago", "Today 08:00" */
export function formatNotifTime(firedAt: number): string {
  const diff = Date.now() - firedAt;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const d = new Date(firedAt);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
