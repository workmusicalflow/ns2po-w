/**
 * Products Query Composable
 * SOLID Architecture - TanStack Query Integration Vue Query EXCLUSIF
 * Lecture seule - Mutations supprimées pour éviter conflits
 */

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions
} from '@tanstack/vue-query'
import { isRef, ref, computed } from 'vue'
import type { Ref } from 'vue'
import type {
  Product,
  ProductFilters,
  ProductSortOptions
} from '../types/domain/Product'

// Query Keys Factory
export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters?: ProductFilters, sort?: ProductSortOptions) =>
    [...productQueryKeys.lists(), { filters, sort }] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  search: (query: string, filters?: ProductFilters) =>
    [...productQueryKeys.all, 'search', { query, filters }] as const,
  category: (categoryId: string) =>
    [...productQueryKeys.all, 'category', categoryId] as const,
  popular: (limit: number) =>
    [...productQueryKeys.all, 'popular', limit] as const,
  bundles: (id: string) => [...productQueryKeys.detail(id), 'bundles'] as const,
  recent: (limit: number) =>
    [...productQueryKeys.all, 'recent', limit] as const
}

// Products List Query - Vue Query exclusif
export function useProductsQuery(
  filters?: Ref<ProductFilters | undefined> | ProductFilters,
  sort?: Ref<ProductSortOptions | undefined> | ProductSortOptions,
  options?: UseQueryOptions<Product[], Error>
) {
  const filtersRef = isRef(filters) ? filters : ref(filters)
  const sortRef = isRef(sort) ? sort : ref(sort)

  return useQuery({
    queryKey: computed(() => productQueryKeys.list(filtersRef.value, sortRef.value)),
    queryFn: async (): Promise<Product[]> => {
      const response = await $fetch<{ success: boolean; data: Product[] }>('/api/products', {
        query: {
          ...(filtersRef.value || {}),
          ...(sortRef.value || {})
        }
      })

      if (!response.success) {
        throw new Error('Failed to fetch products')
      }

      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options
  })
}

// Single Product Query - Vue Query exclusif
export function useProductQuery(
  id: Ref<string> | string,
  options?: UseQueryOptions<Product | null, Error>
) {
  const idRef = isRef(id) ? id : ref(id)

  return useQuery({
    queryKey: computed(() => productQueryKeys.detail(idRef.value)),
    queryFn: async (): Promise<Product | null> => {
      if (!idRef.value) return null

      const response = await $fetch<{ success: boolean; data: Product }>(`/api/products/${idRef.value}`)

      if (!response.success) {
        throw new Error('Failed to fetch product')
      }

      return response.data
    },
    enabled: computed(() => !!idRef.value),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (garde en cache même si non utilisé)
    refetchOnWindowFocus: false, // Pas de refetch automatique au focus (SSE gère temps réel)
    retry: 2, // Limite retries (performance réseau 3G)
    ...options
  })
}

// Product Search Query - Vue Query exclusif
export function useProductSearchQuery(
  query: Ref<string> | string,
  filters?: Ref<ProductFilters | undefined> | ProductFilters,
  options?: UseQueryOptions<Product[], Error>
) {
  const queryRef = isRef(query) ? query : ref(query)
  const filtersRef = isRef(filters) ? filters : ref(filters)

  return useQuery({
    queryKey: computed(() => productQueryKeys.search(queryRef.value, filtersRef.value)),
    queryFn: async (): Promise<Product[]> => {
      if (!queryRef.value || queryRef.value.trim().length < 2) {
        return []
      }

      const response = await $fetch<{ success: boolean; data: Product[] }>('/api/products/search', {
        query: {
          q: queryRef.value,
          ...(filtersRef.value || {})
        }
      })

      if (!response.success) {
        throw new Error('Failed to search products')
      }

      return response.data || []
    },
    enabled: computed(() => queryRef.value.trim().length >= 2),
    staleTime: 2 * 60 * 1000, // 2 minutes (résultats recherche éphémères)
    gcTime: 5 * 60 * 1000, // 5 minutes (nettoyage rapide recherches anciennes)
    refetchOnWindowFocus: false, // Pas de refetch recherche au focus
    retry: 1, // 1 seul retry pour recherche (performance 3G)
    ...options
  })
}

// Products by Category Query - Vue Query exclusif
export function useProductsByCategoryQuery(
  categoryId: Ref<string> | string,
  options?: UseQueryOptions<Product[], Error>
) {
  const categoryIdRef = isRef(categoryId) ? categoryId : ref(categoryId)

  return useQuery({
    queryKey: computed(() => productQueryKeys.category(categoryIdRef.value)),
    queryFn: async (): Promise<Product[]> => {
      if (!categoryIdRef.value) return []

      const response = await $fetch<{ success: boolean; data: Product[] }>('/api/products', {
        query: {
          category: categoryIdRef.value
        }
      })

      if (!response.success) {
        throw new Error('Failed to fetch products by category')
      }

      return response.data || []
    },
    enabled: computed(() => !!categoryIdRef.value),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // SSE gère synchronisation
    retry: 2,
    ...options
  })
}

// Popular Products Query - Vue Query exclusif
export function usePopularProductsQuery(
  limit: Ref<number> | number = 10,
  options?: UseQueryOptions<Product[], Error>
) {
  const limitRef = isRef(limit) ? limit : ref(limit)

  return useQuery({
    queryKey: computed(() => productQueryKeys.popular(limitRef.value)),
    queryFn: async (): Promise<Product[]> => {
      const response = await $fetch<{ success: boolean; data: Product[] }>('/api/products', {
        query: {
          popular: true,
          limit: limitRef.value
        }
      })

      if (!response.success) {
        throw new Error('Failed to fetch popular products')
      }

      return response.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (données stables)
    gcTime: 30 * 60 * 1000, // 30 minutes (garde longtemps en cache)
    refetchOnMount: false, // Pas de refetch au mount (données stables)
    refetchOnWindowFocus: false, // Pas de refetch au focus
    retry: 2,
    ...options
  })
}

// Recent Products Query - Vue Query exclusif
export function useRecentProductsQuery(
  limit: Ref<number> | number = 10,
  options?: UseQueryOptions<Product[], Error>
) {
  const limitRef = isRef(limit) ? limit : ref(limit)

  return useQuery({
    queryKey: computed(() => productQueryKeys.recent(limitRef.value)),
    queryFn: async (): Promise<Product[]> => {
      const response = await $fetch<{ success: boolean; data: Product[] }>('/api/products', {
        query: {
          recent: true,
          limit: limitRef.value
        }
      })

      if (!response.success) {
        throw new Error('Failed to fetch recent products')
      }

      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false, // SSE gère nouveaux produits
    retry: 2,
    ...options
  })
}

// Product Bundles Usage Query - Vue Query exclusif
export function useProductBundlesQuery(
  productId: Ref<string> | string,
  options?: UseQueryOptions<any, Error>
) {
  const id = isRef(productId) ? productId : ref(productId)

  return useQuery({
    queryKey: computed(() => productQueryKeys.bundles(id.value)),
    queryFn: async () => {
      const response = await $fetch(`/api/products/${id.value}/bundles`) as { data: any }
      return response.data
    },
    enabled: computed(() => !!id.value),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Pas de refetch bundles au focus
    retry: 2,
    ...options
  })
}

// Query Invalidation Helpers
export function useProductQueryInvalidation() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: productQueryKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() }),
    invalidateProduct: (id: string) => {
      queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: productQueryKeys.bundles(id) })
    },
    invalidateSearch: () => queryClient.invalidateQueries({
      queryKey: productQueryKeys.all,
      predicate: (query) => query.queryKey.includes('search')
    })
  }
}