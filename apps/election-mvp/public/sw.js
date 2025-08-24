/**
 * Service Worker pour mise en cache des assets statiques
 * Stratégie: Cache First pour les assets, Network First pour les pages
 */

const CACHE_NAME = 'ns2po-v1'

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => {
      console.log('Service Worker: Cache opened')
      // Pas de precache agressif pour éviter les problèmes
      return Promise.resolve()
    })
  )
  self.skipWaiting()
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache')
            return caches.delete(cache)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Stratégie de cache pour les requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return

  // Cache First pour les assets statiques
  if (
    request.url.includes('/_nuxt/') ||
    request.url.includes('cloudinary.com') ||
    request.url.includes('.css') ||
    request.url.includes('.js') ||
    request.url.includes('.woff') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.webp') ||
    request.url.includes('.avif')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        
        return fetch(request).then((response) => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Cloner la réponse car elle ne peut être consommée qu'une fois
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        }).catch(() => {
          // Fallback si aucun cache et aucun réseau
          if (request.url.includes('.jpg') || request.url.includes('.png')) {
            return new Response('', { status: 200, statusText: 'OK' })
          }
        })
      })
    )
  }
  
  // Network First pour les pages HTML et API
  else if (
    request.headers.get('accept')?.includes('text/html') ||
    request.url.includes('/api/')
  ) {
    event.respondWith(
      fetch(request).then((response) => {
        // Pour les pages, on peut cacher une version de secours
        if (request.headers.get('accept')?.includes('text/html') && response.ok) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      }).catch((error) => {
        // Fallback vers le cache pour les pages
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match(request)
        }
        throw error
      })
    )
  }
})