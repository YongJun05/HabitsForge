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

const STORAGE_KEY = 'habitsforge_notif_center';
const MAX_NOTIFICATIONS = 30;
export const NOTIF_EVENT = 'habitsforge:notification';

export function getStoredNotifications(): AppNotification[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function addStoredNotification(habitId: string, habitName: string): void {
  const existing = getStoredNotifications();
  const newNotif: AppNotification = {
    id: `${habitId}-${Date.now()}`,
    habitId,
    habitName,
    firedAt: Date.now(),
    read: false,
  };
  // Prepend newest first, cap at MAX
  const updated = [newNotif, ...existing].slice(0, MAX_NOTIFICATIONS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
}

export function markAllRead(): void {
  const updated = getStoredNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
}

export function clearAllNotifications(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(NOTIF_EVENT));
}

export function getUnreadCount(): number {
  return getStoredNotifications().filter((n) => !n.read).length;
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
