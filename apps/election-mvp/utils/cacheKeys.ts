/**
 * Cache Keys Centralisés
 *
 * Pattern inspiré de TanStack Query pour faciliter une future migration.
 * Élimine les "magic strings" et garantit la cohérence entre pages.
 *
 * Usage:
 * - useAsyncData(CACHE_KEYS.products.list, ...)
 * - refreshNuxtData(CACHE_KEYS.products.list)
 *
 * @see https://tanstack.com/query/latest/docs/framework/vue/guides/query-keys
 */

export const CACHE_KEYS = {
  // === Products ===
  products: {
    /** Liste des produits admin */
    list: 'admin-products-list',
    /** Détail d'un produit par ID */
    detail: (id: string) => `admin-product-${id}`,
  },

  // === Bundles ===
  bundles: {
    /** Liste des bundles admin */
    list: 'admin-bundles-list',
    /** Détail d'un bundle par ID */
    detail: (id: string) => `admin-bundle-${id}`,
  },

  // === Categories ===
  categories: {
    /** Liste des catégories admin */
    list: 'admin-categories-list',
    /** Détail d'une catégorie par ID */
    detail: (id: string) => `admin-category-${id}`,
  },

  // === Campaign Bundles (public) ===
  campaignBundles: {
    /** Liste des bundles campagne (public) */
    list: 'campaign-bundles-list',
  },

  // === Réalisations ===
  realisations: {
    /** Liste des réalisations */
    list: 'realisations-list',
    /** Détail d'une réalisation par slug */
    detail: (slug: string) => `realisation-${slug}`,
  },
} as const

/**
 * Type helper pour autocomplétion des clés
 */
export type CacheKey = typeof CACHE_KEYS
