/**
 * Composable: useCacheInvalidation
 *
 * Tracker intelligent des invalidations de cache pour coordonner
 * refreshNuxtData() avec useAsyncData getCachedData().
 *
 * Problème résolu: useAsyncData utilise le payload client même après refreshNuxtData().
 * Solution: Marquer explicitement les invalidations et vérifier dans getCachedData.
 *
 * FIX CRITIQUE: Utiliser useState() au lieu de ref() pour persistance entre navigations
 * ref() est réinitialisé à chaque changement de page → invalidationMap perdu
 * useState() persiste entre navigations client-side → flag survit au retour liste
 */

// Map globale des timestamps d'invalidation par clé de cache
// useState() garantit persistance cross-page (ref() serait réinitialisé)
const invalidationMap = useState<Record<string, number>>('cache-invalidation-map', () => ({}))

export function useCacheInvalidation() {
  /**
   * Marque une clé de cache comme invalidée avec timestamp actuel
   */
  function markInvalidated(key: string) {
    invalidationMap.value[key] = Date.now()
    console.log(`🔄 [CACHE INVALIDATION] Clé "${key}" marquée comme invalidée`)
  }

  /**
   * Vérifie si une clé a été invalidée récemment
   */
  function wasRecentlyInvalidated(key: string, withinMs = 10000) {
    const timestamp = invalidationMap.value[key]
    if (!timestamp) return false

    const elapsed = Date.now() - timestamp
    const wasInvalidated = elapsed < withinMs

    if (wasInvalidated) {
      console.log(`⚠️ [CACHE INVALIDATION] Clé "${key}" invalidée il y a ${elapsed}ms (< ${withinMs}ms)`)
    }

    return wasInvalidated
  }

  /**
   * Fonction getCachedData pour useAsyncData qui respecte les invalidations
   * Retourne cached data SI disponible ET pas récemment invalidée
   * Sinon retourne undefined pour forcer refetch
   *
   * FIX Gemini: Consomme le flag d'invalidation après décision de refetch
   * pour éviter des refetchs répétés inutiles
   */
  function getCachedDataOrRefetch(key: string) {
    const cached = useNuxtData(key)

    // Si pas de données en cache Nuxt (premier chargement ou purgé par Nuxt)
    if (!cached.data.value) {
      console.log(`ℹ️ [CACHE INVALIDATION] Clé "${key}" sans données Nuxt, refetch`)

      // Si notre map indique une invalidation, la consommer ici
      if (invalidationMap.value[key]) {
        delete invalidationMap.value[key]
        console.log(`🗑️ [CACHE INVALIDATION] Flag d'invalidation pour "${key}" supprimé (cache Nuxt vide)`)
      }

      return undefined // Force le refetch
    }

    // Si invalidée récemment (10 secondes), refetch
    if (wasRecentlyInvalidated(key)) {
      console.log(`🔄 [CACHE INVALIDATION] Clé "${key}" invalidée récemment, force refetch`)

      // Consomme le flag d'invalidation après avoir décidé de refetch
      delete invalidationMap.value[key]
      console.log(`🗑️ [CACHE INVALIDATION] Flag d'invalidation pour "${key}" supprimé après décision refetch`)

      return undefined // Force le refetch
    }

    // Utiliser cache existant
    console.log(`✅ [CACHE INVALIDATION] Clé "${key}" utilise cache existant`)
    return cached.data.value
  }

  /**
   * Nettoie les timestamps d'invalidation ancien (>1 minute)
   * Appelé périodiquement pour éviter memory leak
   */
  function cleanupOldInvalidations() {
    const now = Date.now()
    const oneMinute = 60000

    Object.keys(invalidationMap.value).forEach(key => {
      const timestamp = invalidationMap.value[key]
      if (now - timestamp > oneMinute) {
        delete invalidationMap.value[key]
      }
    })
  }

  // Cleanup automatique toutes les minutes
  if (process.client) {
    setInterval(cleanupOldInvalidations, 60000)
  }

  return {
    markInvalidated,
    wasRecentlyInvalidated,
    getCachedDataOrRefetch
  }
}
