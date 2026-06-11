/**
 * Service Worker for HabitsForge Push Notifications.
 *
 * This runs in the background independently of any browser tab.
 * When a push message arrives from the server, it shows a real OS notification.
 */

// Listen for push events from the server
self.addEventListener('push', (event) => {
  let data = { title: 'HabitsForge 🔥', body: 'Time to check your habits!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || 'habitsforge-reminder',
    // Vibrate pattern: vibrate 200ms, pause 100ms, vibrate 200ms
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
      habitId: data.habitId || null,
    },
    // Keep notification visible until user interacts
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard';
  const habitId = event.notification.data?.habitId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If a window is already open, focus it and navigate
      for (const client of clients) {
        if (client.url.includes('/dashboard') || client.url.includes('/settings')) {
          client.focus();
          if (habitId) {
            client.postMessage({ type: 'HABIT_REMINDER_CLICK', habitId });
          }
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Activate immediately without waiting
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
