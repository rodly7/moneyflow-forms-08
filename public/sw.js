const CACHE_NAME = 'sendflow-v2.4.0';
const STATIC_CACHE = 'sendflow-static-v2.4.0';
const DYNAMIC_CACHE = 'sendflow-dynamic-v2.4.0';

const staticAssets = [
  '/',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/sendflow-logo.png'
];

const dynamicAssets = [
  '/dashboard',
  '/transfer',
  '/bill-payments',
  '/deposit',
  '/withdraw'
];

// Installation optimisée
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker v2.4.0: Installation en cours...');
  event.waitUntil(
    (async () => {
      try {
        // Cache des ressources statiques
        const staticCache = await caches.open(STATIC_CACHE);
        await staticCache.addAll(staticAssets);
        
        // Précharger les pages importantes
        const dynamicCache = await caches.open(DYNAMIC_CACHE);
        await Promise.allSettled(
          dynamicAssets.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return dynamicCache.put(url, response.clone());
              }
            }).catch(() => {})
          )
        );
        
        console.log('✅ Service Worker v2.4.0: Mise en cache terminée');
        self.skipWaiting();
      } catch (error) {
        console.error('❌ Service Worker v2.4.0: Erreur d\'installation', error);
      }
    })()
  );
});

// Activation optimisée
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activation en cours...');
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Suppression ancien cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
        
        await self.clients.claim();
        console.log('✅ Service Worker: Activation terminée');
      } catch (error) {
        console.error('❌ Service Worker: Erreur d\'activation', error);
      }
    })()
  );
});

// Stratégie de mise en cache intelligente
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET et extensions
  if (request.method !== 'GET' || 
      url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:') {
    return;
  }

  // Stratégie Cache First pour les ressources statiques
  if (staticAssets.some(asset => request.url.endsWith(asset))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stratégie Network First pour les API
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('supabase') ||
      url.hostname.includes('lovableproject.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stratégie Stale While Revalidate pour les pages
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Cache First pour les autres ressources
  event.respondWith(cacheFirst(request));
});

// Stratégie Cache First
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('⚠️ Cache First failed:', error);
    return new Response('Ressource non disponible hors ligne', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Stratégie Network First
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    return new Response('Service non disponible hors ligne', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Stratégie Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// Gestion du compteur de notifications
let notificationCount = 0;

// Récupérer le compteur depuis le stockage local
async function getNotificationCount() {
  try {
    const stored = await caches.open('notification-count');
    const response = await stored.match('count');
    if (response) {
      const data = await response.json();
      notificationCount = data.count || 0;
    }
  } catch (error) {
    console.log('Impossible de récupérer le compteur');
  }
  return notificationCount;
}

// Sauvegarder le compteur
async function saveNotificationCount(count) {
  try {
    const cache = await caches.open('notification-count');
    await cache.put('count', new Response(JSON.stringify({ count })));
  } catch (error) {
    console.log('Impossible de sauvegarder le compteur');
  }
}

// Mettre à jour le badge de l'application
async function updateAppBadge(count) {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await navigator.setAppBadge(count);
      } else {
        await navigator.clearAppBadge();
      }
    }
  } catch (error) {
    console.log('Badge non supporté sur cet appareil');
  }
}

// Gestion des notifications push optimisée avec son et badge
self.addEventListener('push', (event) => {
  console.log('📱 Service Worker: Notification reçue');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.log('Données de notification invalides');
    data = { title: 'SendFlow', body: 'Nouvelle notification' };
  }

  // Incrémenter le compteur
  notificationCount++;
  
  const options = {
    body: data.body || 'Nouvelle notification SendFlow',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'sendflow-notification',
    data: data.data || {},
    requireInteraction: data.requireInteraction || true,
    actions: [
      {
        action: 'open',
        title: '🔍 Voir',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: '❌ Fermer',
        icon: '/icons/icon-72x72.png'
      }
    ],
    vibrate: [200, 100, 200, 100, 200],
    silent: false, // S'assurer que le son est activé
    renotify: true, // Rejouer le son même si une notification similaire existe
    timestamp: Date.now()
  };

  event.waitUntil(
    Promise.all([
      // Afficher la notification
      self.registration.showNotification(
        data.title || `SendFlow (${notificationCount})`, 
        options
      ),
      // Sauvegarder le compteur
      saveNotificationCount(notificationCount),
      // Mettre à jour le badge
      updateAppBadge(notificationCount)
    ])
  );
});

// Gestion des clics sur notifications
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Clic sur notification');
  event.notification.close();

  if (event.action === 'close') {
    // Décrémenter le compteur quand on ferme
    if (notificationCount > 0) {
      notificationCount--;
      saveNotificationCount(notificationCount);
      updateAppBadge(notificationCount);
    }
    return;
  }

  // Décrémenter le compteur quand on ouvre
  if (notificationCount > 0) {
    notificationCount--;
    saveNotificationCount(notificationCount);
    updateAppBadge(notificationCount);
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Chercher une fenêtre existante
        for (const client of clientList) {
          if (client.url.includes('sendflow') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // Ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message depuis l'application pour gérer le compteur
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'RESET_BADGE') {
    notificationCount = 0;
    saveNotificationCount(0);
    updateAppBadge(0);
  }
  
  if (event.data && event.data.type === 'GET_BADGE_COUNT') {
    event.ports[0].postMessage({ count: notificationCount });
  }
});

// Initialiser le compteur au démarrage
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Nettoyer les anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Suppression du cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Récupérer le compteur de notifications
      getNotificationCount().then(count => {
        updateAppBadge(count);
      }),
      // Prendre le contrôle de tous les onglets
      self.clients.claim()
    ])
  );
});

// Gestion du sync en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Sync en arrière-plan');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Synchroniser les données critiques
    console.log('Synchronisation des données en arrière-plan');
    
    // Vous pouvez ajouter ici la logique de synchronisation
    // par exemple, envoyer les transactions en attente
  } catch (error) {
    console.error('Erreur lors de la sync:', error);
  }
}

// Gestion de la mise à jour du service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
