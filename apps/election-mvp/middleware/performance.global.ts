/**
 * Middleware global pour optimiser les performances
 * Ajout d'hints de preload et prefetch pour les ressources critiques
 */

export default defineNuxtRouteMiddleware((to) => {
  // En mode client seulement
  if (process.client) {
    // Preload des fonts critiques
    useHead({
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'preconnect',
          href: 'https://res.cloudinary.com'
        }
      ]
    })

    // Prefetch des pages importantes selon la route actuelle
    if (to.path === '/') {
      // Sur la page d'accueil, prefetch la page de démo
      useHead({
        link: [
          {
            rel: 'prefetch',
            href: '/demo/personnalisation'
          }
        ]
      })
    }

    // Preload des images critiques pour la page de personnalisation
    if (to.path.startsWith('/demo/personnalisation')) {
      useHead({
        link: [
          {
            rel: 'preload',
            href: 'https://res.cloudinary.com/dsrvzogof/image/upload/f_webp,q_auto,w_300,h_128,c_fill/ns2po-w/products/textile-tshirt-001.jpg',
            as: 'image'
          }
        ]
      })
    }

    // Service Worker registration (si disponible en production)
    if (process.env.NODE_ENV === 'production') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .catch(() => {
            // Service worker not available, no problem
          })
      }
    }
  }
})