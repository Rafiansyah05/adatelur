/// <reference lib="webworker" />

self.addEventListener('push', (event: any) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Pesanan Baru';
    const body = data.body || 'Silakan cek aplikasi untuk detail pesanan.';
    const url = data.url || '/dashboard/orders';

    const options = {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200],
      data: { url },
      requireInteraction: true,
      // For mobile devices, they often play default sound if we omit silent.
      // But we will try to use the provided sound file.
      // Modern browsers might ignore it or require a proper path.
      sound: '/sound/suara_notif.mp3' 
    };

    event.waitUntil(
      self.registration.showNotification(title, options).then(() => {
        // Also try to send message to any open client tab to play audio
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((client: any) => {
            client.postMessage({ type: 'PLAY_AUDIO' });
          });
        });
      })
    );
  }
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const urlToOpen = event.notification.data.url;
      // If window is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
