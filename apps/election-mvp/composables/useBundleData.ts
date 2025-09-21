/**
 * Unified Bundle Data Management
 * SOLID Architecture - Single Source of Truth
 * Optimizes Vue Query + Pinia Store synchronization
 */

import { computed, ref, watch, isRef, type Ref } from 'vue'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions
} from '@tanstack/vue-query'
import { useBundleStore } from '../stores/useBundleStore'
import { bundleQueryKeys } from './useBundlesQuery'
import { bundleService } from '../services/BundleService'
import { useEventEmitter } from '../stores/useGlobalEventBus'
import { safeAdaptCampaignBundle } from '../utils/BundleAdapter'
import type {
  Bundle,
  BundleAggregate,
  BundleProduct,
  BundleFilters,
  BundleSortOptions
} from '../types/domain/Bundle'

/**
 * Unified Bundle Data Hook
 * Single entry point for all bundle data operations
 */
export function useBundleData() {
  const queryClient = useQueryClient()
  const bundleStore = useBundleStore()
  const eventEmitter = useEventEmitter()

  // 🔥 STRATEGY: Vue Query as Primary Cache, Pinia for Critical State Only

  /**
   * Smart Bundle Fetcher with Adapter Integration
   */
  const fetchBundle = async (id: string, includeAggregate = false): Promise<Bundle | BundleAggregate | null> => {
    try {
      // Use new API with BundleAdapter
      const response = await $fetch(`/api/campaign-bundles/${id}`)

      if (!response.success || !response.data) {
        console.warn(`Bundle ${id} not found`)
        return null
      }

      // API now returns BundleAggregate directly via BundleAdapter
      const bundleAggregate = response.data as BundleAggregate

      if (includeAggregate) {
        return bundleAggregate
      } else {
        // Extract basic Bundle from BundleAggregate
        const { products, totalProducts, averageProductPrice, ...bundle } = bundleAggregate
        return bundle as Bundle
      }
    } catch (error) {
      console.error(`Failed to fetch bundle ${id}:`, error)
      throw error
    }
  }

  /**
   * Optimized Bundle Query with Store Sync
   */
  const useBundleQuery = (
    id: string | Ref<string>,
    includeAggregate = false,
    options?: UseQueryOptions<Bundle | BundleAggregate | null, Error>
  ) => {
    const idRef = isRef(id) ? id : ref(id)

    const query = useQuery({
      queryKey: computed(() =>
        includeAggregate
          ? bundleQueryKeys.aggregate(idRef.value)
          : bundleQueryKeys.detail(idRef.value)
      ),
      queryFn: () => fetchBundle(idRef.value, includeAggregate),
      enabled: computed(() => !!idRef.value),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      ...options
    })

    // 🔄 Smart Sync: Only update critical store state
    watch(
      () => query.data.value,
      (newBundle) => {
        if (newBundle && !includeAggregate) {
          // Update selected bundle in store for form management
          bundleStore.setSelectedBundle(newBundle as Bundle)
        }
      },
      { immediate: true }
    )

    return query
  }

  /**
   * Optimized Bundles List Query
   */
  const useBundlesQuery = (
    filters?: Ref<BundleFilters | undefined> | BundleFilters,
    sort?: Ref<BundleSortOptions | undefined> | BundleSortOptions,
    options?: UseQueryOptions<Bundle[], Error>
  ) => {
    const filtersRef = isRef(filters) ? filters : ref(filters)
    const sortRef = isRef(sort) ? sort : ref(sort)

    return useQuery({
      queryKey: computed(() => bundleQueryKeys.list(filtersRef.value, sortRef.value)),
      queryFn: async () => {
        // Direct service call - Vue Query handles caching
        return await bundleService.getBundles(filtersRef.value, sortRef.value)
      },
      staleTime: 3 * 60 * 1000, // 3 minutes
      gcTime: 8 * 60 * 1000, // 8 minutes
      ...options
    })
  }

  /**
   * Bundle Products Query with Smart Caching
   */
  const useBundleProductsQuery = (
    bundleId: string | Ref<string>,
    options?: UseQueryOptions<BundleProduct[], Error>
  ) => {
    const bundleIdRef = isRef(bundleId) ? bundleId : ref(bundleId)

    const query = useQuery({
      queryKey: computed(() => bundleQueryKeys.products(bundleIdRef.value)),
      queryFn: async () => {
        if (!bundleIdRef.value) return []
        return await bundleService.getBundleProducts(bundleIdRef.value)
      },
      enabled: computed(() => !!bundleIdRef.value),
      staleTime: 3 * 60 * 1000,
      ...options
    })

    // 🔄 Sync with store's selectedBundleProducts
    watch(
      () => query.data.value,
      (products) => {
        if (products && bundleIdRef.value === bundleStore.selectedBundle?.id) {
          // Only sync if this is for the currently selected bundle
          bundleStore.selectedBundleProducts = products
        }
      },
      { immediate: true }
    )

    return query
  }

  /**
   * Optimized Update Mutation with Event Bus
   */
  const useUpdateBundleMutation = (
    options?: UseMutationOptions<Bundle, Error, { id: string; updates: Partial<Bundle> }>
  ) => {
    return useMutation({
      mutationFn: async ({ id, updates }) => {
        return await bundleService.updateBundle(id, updates)
      },
      onMutate: async ({ id, updates }) => {
        // Cancel outgoing queries
        await queryClient.cancelQueries({ queryKey: bundleQueryKeys.detail(id) })
        await queryClient.cancelQueries({ queryKey: bundleQueryKeys.lists() })

        // Optimistic updates to Vue Query cache
        const previousBundle = queryClient.getQueryData(bundleQueryKeys.detail(id))

        queryClient.setQueryData(bundleQueryKeys.detail(id), (old: Bundle | undefined) =>
          old ? { ...old, ...updates } : undefined
        )

        return { previousBundle, id }
      },
      onError: (error, _variables, context) => {
        // Rollback Vue Query cache
        if (context?.previousBundle) {
          queryClient.setQueryData(bundleQueryKeys.detail(context.id), context.previousBundle)
        }
      },
      onSuccess: (data, { id }) => {
        // 🚀 Single Source Update Strategy

        // 1. Update Vue Query cache
        queryClient.setQueryData(bundleQueryKeys.detail(id), data)

        // 2. Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: bundleQueryKeys.lists(),
          exact: false
        })

        // 3. Sync critical store state only
        if (bundleStore.selectedBundle?.id === id) {
          bundleStore.setSelectedBundle(data)
        }

        // 4. Global event for cross-store synchronization
        eventEmitter.bundle.updated(id, data)

        // 5. Clear redundant store caches
        bundleStore.clearCache()
      },
      ...options
    })
  }

  /**
   * Optimized Create Mutation
   */
  const useCreateBundleMutation = (
    options?: UseMutationOptions<Bundle, Error, Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    return useMutation({
      mutationFn: async (bundleData) => {
        return await bundleService.createBundle(bundleData)
      },
      onSuccess: (data) => {
        // 🚀 Efficient Cache Strategy

        // 1. Add to Vue Query cache
        queryClient.setQueryData(bundleQueryKeys.detail(data.id), data)

        // 2. Invalidate lists to trigger refetch
        queryClient.invalidateQueries({ queryKey: bundleQueryKeys.lists() })

        // 3. Set as selected in store
        bundleStore.setSelectedBundle(data)

        // 4. Global event
        eventEmitter.bundle.created(data)
      },
      ...options
    })
  }

  /**
   * Cache Optimization Utilities
   */
  const optimizeCache = () => {
    // Remove redundant Pinia caches since Vue Query handles them better
    bundleStore.clearCache()

    // Intelligent Vue Query cache cleanup
    queryClient.removeQueries({
      queryKey: bundleQueryKeys.all,
      predicate: (query) => {
        return query.state.dataUpdatedAt < Date.now() - (10 * 60 * 1000) // 10 min old
      }
    })
  }

  /**
   * Reactive Store State (Critical Only)
   */
  const selectedBundle = computed(() => bundleStore.selectedBundle)
  const selectedBundleProducts = computed(() => bundleStore.selectedBundleProducts)
  const isLoading = computed(() => bundleStore.isLoading)
  const error = computed(() => bundleStore.error)

  /**
   * Vue Query Cache Getters
   */
  const getCachedBundle = (id: string): Bundle | undefined => {
    return queryClient.getQueryData(bundleQueryKeys.detail(id))
  }

  const getCachedBundles = (filters?: BundleFilters, sort?: BundleSortOptions): Bundle[] | undefined => {
    return queryClient.getQueryData(bundleQueryKeys.list(filters, sort))
  }

  return {
    // 🔍 Queries (Vue Query powered)
    useBundleQuery,
    useBundlesQuery,
    useBundleProductsQuery,

    // ✏️ Mutations (Store + Event Bus sync)
    useUpdateBundleMutation,
    useCreateBundleMutation,

    // 📊 Reactive State (Critical store state only)
    selectedBundle,
    selectedBundleProducts,
    isLoading,
    error,

    // 🛠️ Utilities
    getCachedBundle,
    getCachedBundles,
    optimizeCache,

    // 🔄 Manual sync helpers
    invalidateBundle: (id: string) => {
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.detail(id) })
    },
    invalidateAllBundles: () => {
      queryClient.invalidateQueries({ queryKey: bundleQueryKeys.all })
    }
  }
}

/**
 * Convenience hook for bundle form management
 */
export function useBundleForm(bundleId?: string) {
  const bundleData = useBundleData()

  // Query for edit mode
  const bundleQuery = bundleId
    ? bundleData.useBundleQuery(bundleId, true) // Include aggregate for forms
    : { data: ref(null), isLoading: ref(false), error: ref(null) }

  const productsQuery = bundleId
    ? bundleData.useBundleProductsQuery(bundleId)
    : { data: ref([]), isLoading: ref(false), error: ref(null) }

  return {
    // Form data
    bundle: bundleQuery.data,
    products: productsQuery.data,

    // Loading states
    isLoadingBundle: bundleQuery.isLoading,
    isLoadingProducts: productsQuery.isLoading,

    // Error states
    bundleError: bundleQuery.error,
    productsError: productsQuery.error,

    // Mutations
    updateMutation: bundleData.useUpdateBundleMutation(),
    createMutation: bundleData.useCreateBundleMutation(),

    // Utils
    ...bundleData
  }
}