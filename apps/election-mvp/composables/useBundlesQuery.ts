/**
 * Bundles Query Composable
 * SOLID Architecture - TanStack Query Integration
 * Intelligent caching and state management for Bundles
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions
} from '@tanstack/vue-query'
import { isRef, ref, computed } from 'vue'
import type { Ref } from 'vue'
import type {
  Bundle,
  BundleAggregate,
  BundleProduct,
  BundleFilters,
  BundleSortOptions,
  PaginatedBundles
} from '../types/domain/Bundle'
import { bundleService } from '../services/BundleService'
import { useBundleStore } from '../stores/useBundleStore'
import { useEventEmitter } from '../stores/useGlobalEventBus'

// Mutation Context Types
interface CreateBundleMutationContext {
  previousBundles: Bundle[] | undefined
  optimisticBundle: Bundle
}

interface UpdateBundleMutationContext {
  previousBundle: Bundle | undefined
  previousBundles: Bundle[] | undefined
  id: string
  updates: Partial<Bundle>
}

interface DeleteBundleMutationContext {
  previousBundle: Bundle | undefined
  previousBundles: Bundle[] | undefined
  id: string
}

interface AddProductMutationContext {
  previousProducts: BundleProduct[] | undefined
  bundleId: string
  productId: string
  quantity: number
}

// Query Keys Factory
export const bundleQueryKeys = {
  all: ['bundles'] as const,
  lists: () => [...bundleQueryKeys.all, 'list'] as const,
  list: (filters?: BundleFilters, sort?: BundleSortOptions) =>
    [...bundleQueryKeys.lists(), { filters, sort }] as const,
  details: () => [...bundleQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...bundleQueryKeys.details(), id] as const,
  aggregate: (id: string) => [...bundleQueryKeys.detail(id), 'aggregate'] as const,
  products: (bundleId: string) => [...bundleQueryKeys.detail(bundleId), 'products'] as const,
  search: (query: string, filters?: BundleFilters) =>
    [...bundleQueryKeys.all, 'search', { query, filters }] as const,
  targetAudience: (audience: string) =>
    [...bundleQueryKeys.all, 'audience', audience] as const,
  budgetRange: (range: string) =>
    [...bundleQueryKeys.all, 'budget', range] as const,
  featured: (limit?: number) =>
    [...bundleQueryKeys.all, 'featured', limit] as const,
  popular: (limit: number) =>
    [...bundleQueryKeys.all, 'popular', limit] as const,
  recent: (limit: number) =>
    [...bundleQueryKeys.all, 'recent', limit] as const,
  similar: (bundleId: string, limit: number) =>
    [...bundleQueryKeys.all, 'similar', bundleId, limit] as const
}

// Bundles List Query
export function useBundlesQuery(
  filters?: Ref<BundleFilters | undefined> | BundleFilters,
  sort?: Ref<BundleSortOptions | undefined> | BundleSortOptions,
  options?: UseQueryOptions<Bundle[], Error>
) {
  const filtersRef = isRef(filters) ? filters : ref(filters)
  const sortRef = isRef(sort) ? sort : ref(sort)

  return useQuery({
    queryKey: computed(() => bundleQueryKeys.list(filtersRef.value, sortRef.value)),
    queryFn: async () => {
      return await bundleService.getBundles(filtersRef.value, sortRef.value)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options
  })
}

// Single Bundle Query
export function useBundleQuery(
  id: Ref<string> | string,
  includeAggregate = false,
  options?: UseQueryOptions<Bundle | BundleAggregate | null, Error>
) {
  const idRef = isRef(id) ? id : ref(id)

  return useQuery({
    queryKey: computed(() =>
      includeAggregate
        ? bundleQueryKeys.aggregate(idRef.value)
        : bundleQueryKeys.detail(idRef.value)
    ),
    queryFn: async () => {
      if (!idRef.value) return null

      if (includeAggregate) {
        return await bundleService.getBundleAggregate(idRef.value)
      } else {
        return await bundleService.getBundle(idRef.value)
      }
    },
    enabled: computed(() => !!idRef.value),
    staleTime: 5 * 60 * 1000,
    ...options
  })
}

// Bundle Products Query
export function useBundleProductsQuery(
  bundleId: Ref<string> | string,
  options?: UseQueryOptions<BundleProduct[], Error>
) {
  const bundleIdRef = isRef(bundleId) ? bundleId : ref(bundleId)

  return useQuery({
    queryKey: computed(() => bundleQueryKeys.products(bundleIdRef.value)),
    queryFn: async () => {
      if (!bundleIdRef.value) return []
      return await bundleService.getBundleProducts(bundleIdRef.value)
    },
    enabled: computed(() => !!bundleIdRef.value),
    staleTime: 3 * 60 * 1000, // 3 minutes for bundle products
    ...options
  })
}

// Bundle Search Query
export function useBundleSearchQuery(
  query: Ref<string> | string,
  filters?: Ref<BundleFilters | undefined> | BundleFilters,
  options?: UseQueryOptions<Bundle[], Error>
) {
  const queryRef = isRef(query) ? query : ref(query)
  const filtersRef = isRef(filters) ? filters : ref(filters)

  return useQuery({
    queryKey: computed(() => bundleQueryKeys.search(queryRef.value, filtersRef.value)),
    queryFn: async () => {
      if (!queryRef.value || queryRef.value.trim().length < 2) {
        return []
      }
      return await bundleService.searchBundles(queryRef.value, filtersRef.value)
    },
    enabled: computed(() => queryRef.value.trim().length >= 2),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    ...options
  })
}

// Featured Bundles Query
export function useFeaturedBundlesQuery(
  limit?: Ref<number> | number,
  options?: UseQueryOptions<Bundle[], Error>
) {
  const limitRef = isRef(limit) ? limit : ref(limit)

  return useQuery({
    queryKey: computed(() => bundleQueryKeys.featured(limitRef.value)),
    queryFn: async () => {
      return await bundleService.getFeaturedBundles(limitRef.value)
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for featured bundles
    ...options
  })
}

// Popular Bundles Query
export function usePopularBundlesQuery(
  limit: Ref<number> | number = 10,
  options?: UseQueryOptions<Bundle[], Error>
) {
  const limitRef = isRef(limit) ? limit : ref(limit)

  return useQuery({
    queryKey: computed(() => bundleQueryKeys.popular(limitRef.value)),
    queryFn: async () => {
      return await bundleService.getPopularBundles(limitRef.value)
    },
    staleTime: 10 * 60 * 1000,
    ...options
  })
}

// Similar Bundles Query
export function useSimilarBundlesQuery(
  bundleId: Ref<string> | string,
  limit: Ref<number> | number = 5,
  options?: UseQueryOptions<Bundle[], Error>
) {
  const bundleIdRef = isRef(bundleId) ? bundleId : ref(bundleId)
  const limitRef = isRef(limit) ? limit : ref(limit)

  return useQuery({
    queryKey: computed(() => bundleQueryKeys.similar(bundleIdRef.value, limitRef.value)),
    queryFn: async () => {
      if (!bundleIdRef.value) return []
      return await bundleService.getSimilarBundles(bundleIdRef.value, limitRef.value)
    },
    enabled: computed(() => !!bundleIdRef.value),
    staleTime: 5 * 60 * 1000,
    ...options
  })
}

// Create Bundle Mutation
export function useCreateBundleMutation(
  options?: UseMutationOptions<Bundle, Error, Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>, CreateBundleMutationContext>
) {
  const queryClient = useQueryClient()
  const bundleStore = useBundleStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async (bundleData: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await bundleService.createBundle(bundleData)
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: bundleQueryKeys.lists() })

      // Snapshot previous value
      const previousBundles = queryClient.getQueryData(bundleQueryKeys.list())

      // Optimistically update
      const optimisticBundle: Bundle = {
        id: `temp-${Date.now()}`,
        ...variables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      queryClient.setQueryData(bundleQueryKeys.list(), (old: Bundle[] = []) => [
        optimisticBundle,
        ...old
      ])

      return { previousBundles, optimisticBundle } as CreateBundleMutationContext
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousBundles) {
        queryClient.setQueryData(bundleQueryKeys.list(), context.previousBundles)
      }
    },
    onSuccess: (data, _variables, context) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.all })

      // Update Pinia store
      bundleStore.setSelectedBundle(data)

      // Emit global event
      eventEmitter.bundle.created(data)

      // Replace optimistic update with real data
      if (context?.optimisticBundle) {
        queryClient.setQueryData(bundleQueryKeys.list(), (old: Bundle[] = []) =>
          old.map(bundle =>
            bundle.id === context.optimisticBundle.id ? data : bundle
          )
        )
      }
    },
    ...options
  })
}

// Update Bundle Mutation
export function useUpdateBundleMutation(
  options?: UseMutationOptions<Bundle, Error, { id: string; updates: Partial<Bundle> }, UpdateBundleMutationContext>
) {
  const queryClient = useQueryClient()
  const bundleStore = useBundleStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Bundle> }) => {
      return await bundleService.updateBundle(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: bundleQueryKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: bundleQueryKeys.lists() })

      // Snapshot previous values
      const previousBundle = queryClient.getQueryData(bundleQueryKeys.detail(id))
      const previousBundles = queryClient.getQueryData(bundleQueryKeys.list())

      // Optimistically update detail query
      queryClient.setQueryData(bundleQueryKeys.detail(id), (old: Bundle | undefined) =>
        old ? { ...old, ...updates } : undefined
      )

      // Optimistically update list query
      queryClient.setQueryData(bundleQueryKeys.list(), (old: Bundle[] = []) =>
        old.map(bundle => bundle.id === id ? { ...bundle, ...updates } : bundle)
      )

      return { previousBundle, previousBundles, id, updates } as UpdateBundleMutationContext
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousBundle) {
        queryClient.setQueryData(bundleQueryKeys.detail(context.id), context.previousBundle)
      }
      if (context?.previousBundles) {
        queryClient.setQueryData(bundleQueryKeys.list(), context.previousBundles)
      }
    },
    onSuccess: (data, _variables, context) => {
      // 1. Update detail cache immediately (no network request)
      queryClient.setQueryData(bundleQueryKeys.detail(data.id), data)

      // 2. Update list cache immediately with the modified bundle (recommended by experts)
      queryClient.setQueryData(bundleQueryKeys.list(), (oldBundles: Bundle[] | undefined) => {
        if (!oldBundles) return undefined
        return oldBundles.map(bundle =>
          bundle.id === data.id ? data : bundle
        )
      })

      // 3. Invalidate as safety net (will refetch only if needed)
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.aggregate(data.id) })

      // Update Pinia store
      if (bundleStore.selectedBundle?.id === data.id) {
        bundleStore.setSelectedBundle(data)
      }

      // Emit global event
      eventEmitter.bundle.updated(data.id, data)
    },
    ...options
  })
}

// Delete Bundle Mutation
export function useDeleteBundleMutation(
  options?: UseMutationOptions<boolean, Error, string, DeleteBundleMutationContext>
) {
  const queryClient = useQueryClient()
  const bundleStore = useBundleStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async (id: string) => {
      return await bundleService.deleteBundle(id)
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: bundleQueryKeys.all })

      // Snapshot previous values
      const previousBundle = queryClient.getQueryData(bundleQueryKeys.detail(id))
      const previousBundles = queryClient.getQueryData(bundleQueryKeys.list())

      // Optimistically remove from lists
      queryClient.setQueryData(bundleQueryKeys.list(), (old: Bundle[] = []) =>
        old.filter(bundle => bundle.id !== id)
      )

      return { previousBundle, previousBundles, id } as DeleteBundleMutationContext
    },
    onError: (error, id, context) => {
      // Rollback optimistic updates
      if (context?.previousBundles) {
        queryClient.setQueryData(bundleQueryKeys.list(), context.previousBundles)
      }
    },
    onSuccess: (success, id, context) => {
      if (success) {
        // Remove from all queries
        queryClient.removeQueries({ queryKey: bundleQueryKeys.detail(id) })
        queryClient.removeQueries({ queryKey: bundleQueryKeys.aggregate(id) })
        queryClient.removeQueries({ queryKey: bundleQueryKeys.products(id) })
        queryClient.invalidateQueries({ queryKey: bundleQueryKeys.lists() })

        // Update Pinia store
        if (bundleStore.selectedBundle?.id === id) {
          bundleStore.setSelectedBundle(null)
        }

        // Emit global event
        eventEmitter.bundle.deleted(id)
      }
    },
    ...options
  })
}

// Add Product to Bundle Mutation
export function useAddProductToBundleMutation(
  options?: UseMutationOptions<BundleProduct, Error, { bundleId: string; productId: string; quantity: number }, AddProductMutationContext>
) {
  const queryClient = useQueryClient()
  const bundleStore = useBundleStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async ({ bundleId, productId, quantity }) => {
      return await bundleService.addProductToBundle(bundleId, productId, quantity)
    },
    onMutate: async ({ bundleId, productId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: bundleQueryKeys.products(bundleId) })

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(bundleQueryKeys.products(bundleId))

      return { previousProducts, bundleId, productId, quantity } as AddProductMutationContext
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousProducts) {
        queryClient.setQueryData(bundleQueryKeys.products(context.bundleId), context.previousProducts)
      }
    },
    onSuccess: (data, { bundleId, productId, quantity }) => {
      // Update bundle products query
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.products(bundleId) })
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.detail(bundleId) })
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.aggregate(bundleId) })

      // Update Pinia store - TODO: implement recalculateBundleTotal method
      // bundleStore.recalculateBundleTotal(bundleId)

      // Emit global event
      eventEmitter.bundle.productAdded(bundleId, productId, quantity)
    },
    ...options
  })
}

// Remove Product from Bundle Mutation
export function useRemoveProductFromBundleMutation(
  options?: UseMutationOptions<boolean, Error, { bundleId: string; productId: string }>
) {
  const queryClient = useQueryClient()
  const bundleStore = useBundleStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async ({ bundleId, productId }) => {
      return await bundleService.removeProductFromBundle(bundleId, productId)
    },
    onSuccess: (success, { bundleId, productId }) => {
      if (success) {
        // Update bundle products query
        queryClient.invalidateQueries({ queryKey: bundleQueryKeys.products(bundleId) })
        queryClient.invalidateQueries({ queryKey: bundleQueryKeys.detail(bundleId) })
        queryClient.invalidateQueries({ queryKey: bundleQueryKeys.aggregate(bundleId) })

        // Update Pinia store - TODO: implement recalculateBundleTotal method
        // bundleStore.recalculateBundleTotal(bundleId)

        // Emit global event
        eventEmitter.bundle.productRemoved(bundleId, productId)
      }
    },
    ...options
  })
}

// Query Invalidation Helpers
export function useBundleQueryInvalidation() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: bundleQueryKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: bundleQueryKeys.lists() }),
    invalidateBundle: (id: string) => {
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.aggregate(id) })
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.products(id) })
    },
    invalidateSearch: () => queryClient.invalidateQueries({
      queryKey: bundleQueryKeys.all,
      predicate: (query) => query.queryKey.includes('search')
    }),
    prefetchBundle: (id: string) => queryClient.prefetchQuery({
      queryKey: bundleQueryKeys.detail(id),
      queryFn: () => bundleService.getBundle(id)
    }),
    prefetchBundleProducts: (bundleId: string) => queryClient.prefetchQuery({
      queryKey: bundleQueryKeys.products(bundleId),
      queryFn: () => bundleService.getBundleProducts(bundleId)
    })
  }
}