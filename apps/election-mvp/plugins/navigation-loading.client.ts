/**
 * Plugin: Navigation Loading (Client-Only)
 * Intercepte les navigations pour afficher le spinner global AVANT le chargement
 *
 * Solution recommandée par Perplexity pour garantir affichage spinner
 *
 * Fonctionnement :
 * 1. Extension `.client.ts` = exécution côté client uniquement (ignore SSR)
 * 2. Hook `page:start` = déclenché AVANT le chargement de la page
 * 3. Hook `page:finish` = déclenché APRÈS le chargement
 * 4. Délai minimum garantit visibilité même si page charge rapidement
 *
 * Ce plugin résout le problème de race condition où `onMounted()` exécute
 * le fetch avant que le spinner local ne soit monté dans le DOM.
 */

// Import explicite du composable pour TypeScript (auto-import ne fonctionne pas toujours dans plugins)
import { useGlobalLoading } from '~/composables/useGlobalLoading'

export default defineNuxtPlugin((nuxtApp) => {
  const { startLoading, stopLoading } = useGlobalLoading()

  // Hook déclenché au DÉBUT de chaque navigation de page
  nuxtApp.hook('page:start', () => {
    console.log('[NAVIGATION] page:start - Affichage spinner')
    startLoading('Chargement des données...')
  })

  // Hook déclenché à la FIN du chargement de la page
  // Note: page:finish peut être appelé trop tôt, avant que les données async soient chargées
  // C'est pourquoi nous utilisons withMinDuration() dans les composants individuels
  nuxtApp.hook('page:finish', async () => {
    console.log('[NAVIGATION] page:finish - Arrêt différé spinner (300ms)')
    // Délai minimum pour éviter flash trop rapide
    await new Promise(resolve => setTimeout(resolve, 300))
    stopLoading()
  })

  // Alternative PLUS FIABLE : Intercepter via le router
  // Détecte les vraies navigations (pas le premier chargement)
  const router = useRouter()

  router.beforeEach((to, from, next) => {
    // Seulement si c'est une vraie navigation (pas le montage initial)
    if (from.name !== undefined) {
      console.log(`[ROUTER] Navigation: ${from.path} → ${to.path}`)
      startLoading()
    }
    next()
  })

  router.afterEach(() => {
    // Le stopLoading() sera géré par page:finish ou withMinDuration() dans les composants
    console.log('[ROUTER] Navigation terminée')
  })
})
