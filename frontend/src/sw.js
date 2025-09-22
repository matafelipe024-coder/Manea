// Service Worker para MANEA Professional PWA
const CACHE_NAME = 'manea-professional-v1.0.0';
const API_CACHE = 'manea-api-cache-v1';

// Recursos estáticos para cachear
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// URLs de API que pueden funcionar offline
const API_ROUTES = [
  '/api/bovinos',
  '/api/fincas', 
  '/api/dashboard/stats',
  '/api/alertas'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Activar inmediatamente el nuevo service worker
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control inmediato de todas las páginas
  self.clients.claim();
});

// Interceptar solicitudes de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia para recursos estáticos
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }
  
  // Estrategia para API - Network First con fallback a cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }
  
  // Para otras solicitudes, intentar red primero
  event.respondWith(
    fetch(request).catch(() => {
      // Si no hay conexión, intentar servir desde cache
      return caches.match(request).then((response) => {
        return response || new Response('Offline - Contenido no disponible', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});

// Estrategia Cache First (para recursos estáticos)
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first strategy failed:', error);
    return new Response('Error de red', { status: 503 });
  }
}

// Estrategia Network First (para API)
async function networkFirstStrategy(request, cacheName) {
  try {
    // Intentar obtener de la red primero
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Guardar en cache si la respuesta es exitosa
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    
    // Si falla la red, intentar obtener del cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si no hay cache disponible, devolver respuesta offline
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'No hay conexión a internet y no hay datos en cache',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received:', event);
  
  let notificationData = {
    title: 'MANEA Professional',
    body: 'Nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'manea-notification'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Ver detalles',
          icon: '/icon-96x96.png'
        },
        {
          action: 'dismiss',
          title: 'Descartar',
          icon: '/icon-96x96.png'
        }
      ]
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    // Abrir la aplicación
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Solo cerrar la notificación (ya se cerró arriba)
    console.log('[SW] Notification dismissed');
  } else {
    // Clic en el cuerpo de la notificación
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Función para sincronizar datos offline
async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data...');
    
    // Obtener datos pendientes de sincronización desde IndexedDB
    // (Aquí implementarías la lógica específica de tu aplicación)
    
    // Ejemplo: sincronizar bovinos creados offline
    const offlineData = await getOfflineData();
    
    for (const item of offlineData) {
      try {
        await fetch('/api/bovinos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        // Marcar como sincronizado
        await markAsSynced(item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
    
    console.log('[SW] Offline data sync completed');
  } catch (error) {
    console.error('[SW] Offline data sync failed:', error);
  }
}

// Funciones auxiliares para manejo de datos offline
async function getOfflineData() {
  // Implementar lógica para obtener datos offline desde IndexedDB
  return [];
}

async function markAsSynced(itemId) {
  // Implementar lógica para marcar elemento como sincronizado
  console.log('[SW] Marked as synced:', itemId);
}

// Manejar actualizaciones de la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Información de debugging
console.log('[SW] Service Worker registered for MANEA Professional');
console.log('[SW] Cache version:', CACHE_NAME);
console.log('[SW] API cache version:', API_CACHE);