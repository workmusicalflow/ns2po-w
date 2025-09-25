/**
 * Product Bundles Query Composable
 * SOLID Architecture - Remplace le cache manuel productBundleUsage
 * Gestion cohérente Vue Query des relations produit-bundle
 */

import {
  useQuery,
  useQueries,
  useQueryClient,
  type UseQueryOptions
} from '@tanstack/vue-query'
import type { Ref } from 'vue'

// Types pour les informations bundle d'un produit
export interface ProductBundleInfo {
  bundles: Array<{
    id: string
    name: string
    isActive: boolean
  }>
  stats: {
    totalBundles: number
  }
  canDelete: boolean
}

export interface ProductBundleUsageBadge {
  text: string
  class: string
  canDelete: boolean
  bundleCount: number
  bundles?: Array<{ id: string; name: string }>
}

// Query Keys Factory
export const productBundleQueryKeys = {
  all: ['product-bundles'] as const,
  productBundles: (productId: string) => [...productBundleQueryKeys.all, 'product', productId] as const,
  bundleProducts: (bundleId: string) => [...productBundleQueryKeys.all, 'bundle', bundleId] as const
}

// Single Product Bundle Info Query
export function useProductBundleInfoQuery(
  productId: Ref<string> | string,
  options?: UseQueryOptions<ProductBundleInfo, Error>
) {
  const productIdRef = isRef(productId) ? productId : ref(productId)

  return useQuery({
    queryKey: computed(() => productBundleQueryKeys.productBundles(productIdRef.value)),
    queryFn: async (): Promise<ProductBundleInfo> => {
      if (!productIdRef.value) {
        return {
          bundles: [],
          stats: { totalBundles: 0 },
          canDelete: true
        }
      }

      try {
        const response = await $fetch<{ success: boolean; data: ProductBundleInfo }>(`/api/products/${productIdRef.value}/bundles`)

        if (!response.success) {
          throw new Error('Failed to fetch product bundle info')
        }

        return response.data
      } catch (error) {
        // Fallback sécurisé : produit non utilisé
        return {
          bundles: [],
          stats: { totalBundles: 0 },
          canDelete: true
        }
      }
    },
    enabled: computed(() => !!productIdRef.value),
    staleTime: 2 * 60 * 1000, // 2 minutes - info bundles change souvent
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options
  })
}

// Multiple Products Bundle Info Queries - Remplace le cache manuel
export function useMultipleProductBundleInfoQuery(
  productIds: Ref<string[]> | string[],
  options?: Omit<UseQueryOptions<ProductBundleInfo, Error>, 'queryKey' | 'queryFn'>
) {
  const productIdsRef = isRef(productIds) ? productIds : ref(productIds)

  return useQueries({
    queries: computed(() =>
      productIdsRef.value.map(productId => ({
        queryKey: productBundleQueryKeys.productBundles(productId),
        queryFn: async (): Promise<ProductBundleInfo> => {
          try {
            const response = await $fetch<{ success: boolean; data: ProductBundleInfo }>(`/api/products/${productId}/bundles`)

            if (!response.success) {
              throw new Error('Failed to fetch product bundle info')
            }

            return response.data
          } catch (error) {
            // Fallback sécurisé
            return {
              bundles: [],
              stats: { totalBundles: 0 },
              canDelete: true
            }
          }
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        ...options
      }))
    )
  })
}

// Composable pour Badge d'Utilisation Bundle - Logique pure déplacée
export function useProductBundleUsageBadge() {
  const getBundleUsageBadge = (bundleInfo?: ProductBundleInfo): ProductBundleUsageBadge => {
    if (!bundleInfo || bundleInfo.stats.totalBundles === 0) {
      return {
        text: 'Non utilisé',
        class: 'bg-gray-100 text-gray-700',
        canDelete: true,
        bundleCount: 0
      }
    }

    const count = bundleInfo.stats.totalBundles
    return {
      text: `${count} bundle${count > 1 ? 's' : ''}`,
      class: count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700',
      canDelete: false,
      bundleCount: count,
      bundles: bundleInfo.bundles
    }
  }

  return {
    getBundleUsageBadge
  }
}

// Composable pour Actions Bundle - Séparation des responsabilités
export function useProductBundleActions() {
  const queryClient = useQueryClient()

  const invalidateProductBundles = (productId: string) => {
    queryClient.invalidateQueries({
      queryKey: productBundleQueryKeys.productBundles(productId)
    })
  }

  const invalidateAllProductBundles = () => {
    queryClient.invalidateQueries({
      queryKey: productBundleQueryKeys.all
    })
  }

  const prefetchProductBundles = (productId: string) => {
    return queryClient.prefetchQuery({
      queryKey: productBundleQueryKeys.productBundles(productId),
      queryFn: async () => {
        const response = await $fetch<{ success: boolean; data: ProductBundleInfo }>(`/api/products/${productId}/bundles`)
        return response.data
      }
    })
  }

  // Action pour navigation vers bundles filtrés
  const viewProductBundles = (product: { id: string; name: string }) => {
    navigateTo({
      path: '/admin/bundles',
      query: {
        product: product.id,
        product_name: product.name
      }
    })
  }

  return {
    invalidateProductBundles,
    invalidateAllProductBundles,
    prefetchProductBundles,
    viewProductBundles
  }
}

// Hook unifié pour usage dans composants - Combine toutes les fonctionnalités
export function useProductBundleManagement(productId: Ref<string> | string) {
  const bundleQuery = useProductBundleInfoQuery(productId)
  const { getBundleUsageBadge } = useProductBundleUsageBadge()
  const bundleActions = useProductBundleActions()

  const bundleUsageBadge = computed(() =>
    getBundleUsageBadge(bundleQuery.data.value)
  )

  return {
    // Query state
    bundleInfo: bundleQuery.data,
    isLoadingBundles: bundleQuery.isLoading,
    bundleError: bundleQuery.error,

    // Computed badge
    bundleUsageBadge,

    // Actions
    ...bundleActions,

    // Refresh
    refetchBundles: bundleQuery.refetch
  }
}