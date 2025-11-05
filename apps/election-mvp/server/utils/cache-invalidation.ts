/**
 * Utilitaire centralisé d'invalidation cache
 *
 * Pattern validé par Gemini Google Search (20 sources citées, 2024-2025)
 * Architecture: Redis + HTTP headers hybride
 *
 * Invoqué après toute mutation produit/bundle pour synchroniser:
 * - Redis cache (multi-instances Railway via Upstash)
 * - CDN/Browser (via headers HTTP, Railway n'a pas d'API purge directe)
 *
 * Référence: CACHE_UNIFIED_ARCHITECTURE_PLAN.md
 */

/**
 * Options pour invalidation cache personnalisée
 */
export interface CacheInvalidationOptions {
  /**
   * Clés spécifiques à invalider (override default keys)
   */
  specificKeys?: string[]

  /**
   * Mode silencieux (désactive logs verbeux)
   * Utile pour opérations batch
   */
  silent?: boolean
}

/**
 * Clés de cache par défaut pour invalidation produits + bundles
 */
const DEFAULT_PRODUCT_CACHE_KEYS = [
  'products:list:active',
  'campaign-bundles:list:active',
] as const

/**
 * Invalide toutes les clés de cache liées aux produits
 *
 * Pattern "Cache-Aside" avec invalidation programmatique.
 * Utilise Promise.allSettled pour robustesse (échec partiel non-bloquant).
 *
 * @param context - Contexte descriptif de l'invalidation (ex: "PUT /api/admin/products/textile-polo-001")
 * @param options - Options personnalisation invalidation
 *
 * @example
 * ```typescript
 * // Après UPDATE produit
 * await invalidateProductRelatedCaches(`PUT /api/admin/products/${productId}`)
 *
 * // Avec clés spécifiques
 * await invalidateProductRelatedCaches('bulk-update', {
 *   specificKeys: ['products:list:active']
 * })
 * ```
 */
export async function invalidateProductRelatedCaches(
  context: string,
  options?: CacheInvalidationOptions
): Promise<void> {
  const cacheStorage = useStorage('cache')

  const keys = options?.specificKeys || DEFAULT_PRODUCT_CACHE_KEYS

  if (!options?.silent) {
    console.log(`🔄 [CACHE INVALIDATION] Context: ${context}`)
    console.log(`🔄 [CACHE INVALIDATION] Keys: ${keys.join(', ')}`)
  }

  const startTime = Date.now()

  // Promise.allSettled: Continue même si une clé échoue (robustesse multi-clés)
  const results = await Promise.allSettled(
    keys.map((key) =>
      cacheStorage.removeItem(key).catch((error) => {
        // Re-throw pour Promise.allSettled rejection
        throw new Error(`Failed to invalidate "${key}": ${error.message}`)
      })
    )
  )

  // Log détaillé des résultats
  results.forEach((result, index) => {
    const key = keys[index]

    if (result.status === 'fulfilled') {
      console.log(`🗑️ [CACHE INVALIDATION] "${key}" invalidé avec succès`)
    } else {
      console.error(`❌ [CACHE INVALIDATION] Échec "${key}":`, result.reason)
      console.error(
        `❌ [CACHE INVALIDATION] WARNING: Désynchronisation possible pour "${key}"`
      )
    }
  })

  const duration = Date.now() - startTime
  const successCount = results.filter((r) => r.status === 'fulfilled').length
  const failureCount = results.filter((r) => r.status === 'rejected').length

  console.log(
    `✅ [CACHE INVALIDATION] Terminé en ${duration}ms (${successCount} succès, ${failureCount} échecs)`
  )

  // Si échec critique (toutes les clés), alerter fortement
  if (failureCount === keys.length) {
    console.error(
      '❌ [CACHE INVALIDATION] ÉCHEC CRITIQUE: Aucune clé invalidée!'
    )
    console.error(
      '❌ [CACHE INVALIDATION] Autres instances Railway serviront données stale!'
    )
  }
}

/**
 * Helper spécialisé pour invalidation campaign bundles uniquement
 *
 * Utile pour mutations qui n'affectent QUE les bundles (ex: ordre display, statut featured)
 * et pas les produits individuels.
 *
 * @example
 * ```typescript
 * // Après UPDATE bundle (champs non-produits)
 * await invalidateCampaignBundlesCache()
 * ```
 */
export async function invalidateCampaignBundlesCache(): Promise<void> {
  await invalidateProductRelatedCaches('campaign-bundles-mutation', {
    specificKeys: ['campaign-bundles:list:active'],
  })
}

/**
 * Helper spécialisé pour invalidation produits uniquement
 *
 * Utile pour mutations qui n'affectent QUE les produits (ex: activation/désactivation)
 * et pas les bundles.
 *
 * Note: Rarement utilisé car changements produits impactent généralement les bundles
 * (via prix, disponibilité, etc.)
 *
 * @example
 * ```typescript
 * // Après UPDATE produit (métadata uniquement, pas de prix)
 * await invalidateProductsCache()
 * ```
 */
export async function invalidateProductsCache(): Promise<void> {
  await invalidateProductRelatedCaches('products-mutation', {
    specificKeys: ['products:list:active'],
  })
}
