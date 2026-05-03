// ═══════════════════════════════════════════════════════════════
// SERVICE WORKER — VetroLine
// Permite notificações fora do app (em segundo plano)
// ═══════════════════════════════════════════════════════════════

const VERSION = 'vetroline-sw-v1';

// Instala o Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalado:', VERSION);
  self.skipWaiting();
});

// Ativa imediatamente
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativado:', VERSION);
  event.waitUntil(clients.claim());
});

// Recebe mensagens do app principal pra mostrar notificações
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, data } = event.data;
    
    self.registration.showNotification(title || 'VetroLine', {
      body: body || '',
      icon: icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'vetroline-notif',
      vibrate: [300, 150, 300, 150, 500],
      requireInteraction: false,
      data: data || {}
    });
  }
});

// Quando clica na notificação, abre o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tiver aba aberta, foca nela
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICKED', data: event.notification.data });
          return client.focus();
        }
      }
      // Senão, abre nova
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Push REAL (precisa de backend pra mandar — futuro)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const payload = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(payload.title || 'VetroLine', {
        body: payload.body || '',
        icon: payload.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.tag || 'vetroline-push',
        vibrate: [300, 150, 300, 150, 500],
        data: payload.data || {}
      })
    );
  } catch (e) {
    console.warn('[SW] Erro no push:', e);
  }
});
