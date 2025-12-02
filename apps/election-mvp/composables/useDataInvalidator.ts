/**
 * Composable: useDataInvalidator
 *
 * Gestionnaire centralisé d'invalidation de cache Nuxt.
 * Encapsule refreshNuxtData pour découpler les pages de mutation
 * des détails d'implémentation du cache.
 *
 * Principes SOLID respectés:
 * - SRP: Une seule responsabilité (invalidation)
 * - OCP: Extensible sans modification (ajouter nouvelles entités)
 * - DIP: Les pages dépendent de l'abstraction, pas de l'implémentation
 *
 * Usage:
 * const { invalidateProductsList } = useDataInvalidator()
 * await invalidateProductsList()
 *
 * @see Architecture validée par Gemini + Perplexity (sources: nuxt.com, GitHub, Reddit)
 */

import { CACHE_KEYS } from '~/utils/cacheKeys'

export function useDataInvalidator() {
  /**
   * Invalide la liste des produits admin
   * Déclenche un refetch sur toutes les pages utilisant cette clé
   */
  async function invalidateProductsList(): Promise<void> {
    console.log('🔄 [DATA INVALIDATOR] Invalidating products list...')
    await refreshNuxtData(CACHE_KEYS.products.list)
    console.log('✅ [DATA INVALIDATOR] Products list invalidated')
  }

  /**
   * Invalide le détail d'un produit spécifique
   */
  async function invalidateProductDetail(id: string): Promise<void> {
    console.log(`🔄 [DATA INVALIDATOR] Invalidating product detail: ${id}`)
    await refreshNuxtData(CACHE_KEYS.products.detail(id))
  }

  /**
   * Invalide la liste des bundles admin
   */
  async function invalidateBundlesList(): Promise<void> {
    console.log('🔄 [DATA INVALIDATOR] Invalidating bundles list...')
    await refreshNuxtData(CACHE_KEYS.bundles.list)
    console.log('✅ [DATA INVALIDATOR] Bundles list invalidated')
  }

  /**
   * Invalide le détail d'un bundle spécifique
   */
  async function invalidateBundleDetail(id: string): Promise<void> {
    console.log(`🔄 [DATA INVALIDATOR] Invalidating bundle detail: ${id}`)
    await refreshNuxtData(CACHE_KEYS.bundles.detail(id))
  }

  /**
   * Invalide la liste des catégories admin
   */
  async function invalidateCategoriesList(): Promise<void> {
    console.log('🔄 [DATA INVALIDATOR] Invalidating categories list...')
    await refreshNuxtData(CACHE_KEYS.categories.list)
    console.log('✅ [DATA INVALIDATOR] Categories list invalidated')
  }

  /**
   * Invalide les bundles campagne (public)
   */
  async function invalidateCampaignBundlesList(): Promise<void> {
    console.log('🔄 [DATA INVALIDATOR] Invalidating campaign bundles list...')
    await refreshNuxtData(CACHE_KEYS.campaignBundles.list)
    console.log('✅ [DATA INVALIDATOR] Campaign bundles list invalidated')
  }

  /**
   * Invalide plusieurs caches en parallèle
   * Utile après mutations affectant plusieurs entités
   */
  async function invalidateMultiple(keys: string[]): Promise<void> {
    console.log(`🔄 [DATA INVALIDATOR] Invalidating ${keys.length} caches...`)
    await Promise.all(keys.map((key) => refreshNuxtData(key)))
    console.log('✅ [DATA INVALIDATOR] All caches invalidated')
  }

  return {
    // Products
    invalidateProductsList,
    invalidateProductDetail,

    // Bundles
    invalidateBundlesList,
    invalidateBundleDetail,

    // Categories
    invalidateCategoriesList,

    // Campaign Bundles
    invalidateCampaignBundlesList,

    // Utility
    invalidateMultiple,

    // Export des clés pour usage direct si nécessaire
    CACHE_KEYS,
  }
}
