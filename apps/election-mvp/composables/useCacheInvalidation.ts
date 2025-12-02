/**
 * Composable: useCacheInvalidation
 *
 * Tracker intelligent des invalidations de cache pour coordonner
 * refreshNuxtData() avec useAsyncData getCachedData().
 *
 * Problème résolu: useAsyncData utilise le payload client même après refreshNuxtData().
 * Solution: Marquer explicitement les invalidations et vérifier dans getCachedData.
 *
 * FIX CRITIQUE: Utiliser localStorage au lieu de ref()/useState()
 * - ref() est réinitialisé à chaque navigation → flag perdu
 * - useState() nécessite contexte Nuxt → Error "[nuxt] instance unavailable" au top-level
 * - localStorage persiste entre navigations + pas de dépendance Nuxt context
 */

const STORAGE_KEY = 'nuxt-cache-invalidation-map'

/**
 * Helpers pour accéder localStorage de manière safe (client-only)
 */
function getInvalidationMap(): Record<string, number> {
  if (!process.client) return {}

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function setInvalidationMap(map: Record<string, number>) {
  if (!process.client) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch (error) {
    console.error('[CACHE INVALIDATION] Erreur localStorage:', error)
  }
}

export function useCacheInvalidation() {
  /**
   * Marque une clé de cache comme invalidée avec timestamp actuel
   */
  function markInvalidated(key: string) {
    const map = getInvalidationMap()
    map[key] = Date.now()
    setInvalidationMap(map)
    console.log(`🔄 [CACHE INVALIDATION] Clé "${key}" marquée comme invalidée (localStorage)`)
  }

  /**
   * Vérifie si une clé a été invalidée récemment
   * FIX: TTL augmenté de 10s à 5 minutes (300000ms) pour correspondre au TTL Redis serveur
   * Permet navigation lente entre pages sans perdre le flag d'invalidation
   */
  function wasRecentlyInvalidated(key: string, withinMs = 300000) {
    const map = getInvalidationMap()
    const timestamp = map[key]
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
   * FIX localStorage: Persiste entre navigations sans dépendance Nuxt context
   */
  function getCachedDataOrRefetch(key: string) {
    const cached = useNuxtData(key)

    // Si pas de données en cache Nuxt (premier chargement ou purgé par Nuxt)
    if (!cached.data.value) {
      console.log(`ℹ️ [CACHE INVALIDATION] Clé "${key}" sans données Nuxt, refetch`)

      // Si notre map indique une invalidation, la consommer ici
      const map = getInvalidationMap()
      if (map[key]) {
        delete map[key]
        setInvalidationMap(map)
        console.log(`🗑️ [CACHE INVALIDATION] Flag d'invalidation pour "${key}" supprimé (cache Nuxt vide)`)
      }

      return undefined // Force le refetch
    }

    // Si invalidée récemment (10 secondes), refetch
    if (wasRecentlyInvalidated(key)) {
      console.log(`🔄 [CACHE INVALIDATION] Clé "${key}" invalidée récemment, force refetch`)

      // Consomme le flag d'invalidation après avoir décidé de refetch
      const map = getInvalidationMap()
      delete map[key]
      setInvalidationMap(map)
      console.log(`🗑️ [CACHE INVALIDATION] Flag d'invalidation pour "${key}" supprimé après décision refetch`)

      return undefined // Force le refetch
    }

    // Utiliser cache existant
    console.log(`✅ [CACHE INVALIDATION] Clé "${key}" utilise cache existant`)
    return cached.data.value
  }

  /**
   * Nettoie les timestamps d'invalidation anciens (>1 minute)
   * Appelé périodiquement pour éviter localStorage pollution
   */
  function cleanupOldInvalidations() {
    if (!process.client) return

    const now = Date.now()
    const oneMinute = 60000
    const map = getInvalidationMap()

    let hasChanges = false
    Object.keys(map).forEach(key => {
      const timestamp = map[key]
      if (now - timestamp > oneMinute) {
        delete map[key]
        hasChanges = true
      }
    })

    if (hasChanges) {
      setInvalidationMap(map)
      console.log('🧹 [CACHE INVALIDATION] Cleanup anciens flags localStorage')
    }
  }

  // Cleanup automatique toutes les minutes (client-only)
  if (process.client) {
    setInterval(cleanupOldInvalidations, 60000)
  }

  return {
    markInvalidated,
    wasRecentlyInvalidated,
    getCachedDataOrRefetch
  }
}
