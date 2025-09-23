/**
 * Products Query Composable
 * SOLID Architecture - TanStack Query Integration
 * Intelligent caching and state management for Products
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions
} from '@tanstack/vue-query'
import { isRef } from 'vue'
import type { Ref } from 'vue'
import type {
  Product,
  ProductAggregate,
  ProductFilters,
  ProductSortOptions,
  PaginatedProducts
} from '../types/domain/Product'
import { productService } from '../services/ProductService'
import { useProductStore } from '../stores/useProductStore'
import { useEventEmitter } from '../stores/useGlobalEventBus'

// Query Keys Factory
export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters?: ProductFilters, sort?: ProductSortOptions) =>
    [...productQueryKeys.lists(), { filters, sort }] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  aggregate: (id: string) => [...productQueryKeys.detail(id), 'aggregate'] as const,
  search: (query: string, filters?: ProductFilters) =>
    [...productQueryKeys.all, 'search', { query, filters }] as const,
  category: (categoryId: string) =>
    [...productQueryKeys.all, 'category', categoryId] as const,
  popular: (limit: number) =>
    [...productQueryKeys.all, 'popular', limit] as const,
  bundles: (id: string) => [...productQueryKeys.detail(id), 'bundles'] as const,
  recent: (limit: number) =>
    [...productQueryKeys.all, 'recent', limit] as const,
  paginated: (page: number, limit: number, filters?: ProductFilters, sort?: ProductSortOptions) =>
    [...productQueryKeys.lists(), 'paginated', { page, limit, filters, sort }] as const
}

// Products List Query
export function useProductsQuery(
  filters?: Ref<ProductFilters | undefined> | ProductFilters,
  sort?: Ref<ProductSortOptions | undefined> | ProductSortOptions,
  options?: UseQueryOptions<Product[], Error>
) {
  const filtersRef = isRef(filters) ? filters : ref(filters)
  const sortRef = isRef(sort) ? sort : ref(sort)

  return useQuery({
    queryKey: computed(() => productQueryKeys.list(filtersRef.value, sortRef.value)),
    queryFn: async () => {
      console.log('🔍 [useProductsQuery] Fetching products...')
      const result = await productService.getProducts(filtersRef.value, sortRef.value)
      console.log(`✅ [useProductsQuery] Received ${result.length} products:`, result.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        basePrice: p.basePrice,
        isActive: p.isActive
      })))
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options
  })
}

// Single Product Query
export function useProductQuery(
  id: Ref<string> | string,
  includeAggregate = false,
  options?: UseQueryOptions<Product | ProductAggregate | null, Error>
) {
  const idRef = isRef(id) ? id : ref(id)

  return useQuery({
    queryKey: computed(() =>
      includeAggregate
        ? productQueryKeys.aggregate(idRef.value)
        : productQueryKeys.detail(idRef.value)
    ),
    queryFn: async () => {
      if (!idRef.value) return null

      if (includeAggregate) {
        return await productService.getProductAggregate(idRef.value)
      } else {
        return await productService.getProduct(idRef.value)
      }
    },
    enabled: computed(() => !!idRef.value),
    staleTime: 5 * 60 * 1000,
    ...options
  })
}

// Paginated Products Query
export function useProductsPaginatedQuery(
  page: Ref<number> | number = 1,
  limit: Ref<number> | number = 20,
  filters?: Ref<ProductFilters | undefined> | ProductFilters,
  sort?: Ref<ProductSortOptions | undefined> | ProductSortOptions,
  options?: UseQueryOptions<PaginatedProducts, Error>
) {
  const pageRef = isRef(page) ? page : ref(page)
  const limitRef = isRef(limit) ? limit : ref(limit)
  const filtersRef = isRef(filters) ? filters : ref(filters)
  const sortRef = isRef(sort) ? sort : ref(sort)

  return useQuery({
    queryKey: computed(() =>
      productQueryKeys.paginated(pageRef.value, limitRef.value, filtersRef.value, sortRef.value)
    ),
    queryFn: async () => {
      return await productService.getProductsPaginated(
        pageRef.value,
        limitRef.value,
        filtersRef.value,
        sortRef.value
      )
    },
    placeholderData: (previousData) => previousData,
    staleTime: 3 * 60 * 1000, // 3 minutes for paginated data
    ...options
  })
}

// Product Search Query
export function useProductSearchQuery(
  query: Ref<string> | string,
  filters?: Ref<ProductFilters | undefined> | ProductFilters,
  options?: UseQueryOptions<Product[], Error>
) {
  const queryRef = isRef(query) ? query : ref(query)
  const filtersRef = isRef(filters) ? filters : ref(filters)

  return useQuery({
    queryKey: computed(() => productQueryKeys.search(queryRef.value, filtersRef.value)),
    queryFn: async () => {
      if (!queryRef.value || queryRef.value.trim().length < 2) {
        return []
      }
      return await productService.searchProducts(queryRef.value, filtersRef.value)
    },
    enabled: computed(() => queryRef.value.trim().length >= 2),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    ...options
  })
}

// Products by Category Query
export function useProductsByCategoryQuery(
  categoryId: Ref<string> | string,
  options?: UseQueryOptions<Product[], Error>
) {
  const categoryIdRef = isRef(categoryId) ? categoryId : ref(categoryId)

  return useQuery({
    queryKey: computed(() => productQueryKeys.category(categoryIdRef.value)),
    queryFn: async () => {
      if (!categoryIdRef.value) return []
      return await productService.getProductsByCategory(categoryIdRef.value)
    },
    enabled: computed(() => !!categoryIdRef.value),
    staleTime: 5 * 60 * 1000,
    ...options
  })
}

// Popular Products Query
export function usePopularProductsQuery(
  limit: Ref<number> | number = 10,
  options?: UseQueryOptions<Product[], Error>
) {
  const limitRef = isRef(limit) ? limit : ref(limit)

  return useQuery({
    queryKey: computed(() => productQueryKeys.popular(limitRef.value)),
    queryFn: async () => {
      return await productService.getPopularProducts(limitRef.value)
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for popular products
    ...options
  })
}

// Recent Products Query
export function useRecentProductsQuery(
  limit: Ref<number> | number = 10,
  options?: UseQueryOptions<Product[], Error>
) {
  const limitRef = isRef(limit) ? limit : ref(limit)

  return useQuery({
    queryKey: computed(() => productQueryKeys.recent(limitRef.value)),
    queryFn: async () => {
      return await productService.getRecentProducts(limitRef.value)
    },
    staleTime: 5 * 60 * 1000,
    ...options
  })
}

// Create Product Mutation
export function useCreateProductMutation(
  options?: UseMutationOptions<Product, Error, Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient()
  const productStore = useProductStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      return await productService.createProduct(productData)
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() })

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // Optimistically update
      const optimisticProduct: Product = {
        id: `temp-${Date.now()}`,
        ...variables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) => [
        optimisticProduct,
        ...old
      ])

      return { previousProducts, optimisticProduct }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },
    onSuccess: (data, variables, context) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all })

      // Update Pinia store
      productStore.syncProductChanges(data.id, data)

      // Emit global event
      eventEmitter.product.created(data)

      // Replace optimistic update with real data
      if (context?.optimisticProduct) {
        queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
          old.map(product =>
            product.id === context.optimisticProduct.id ? data : product
          )
        )
      }
    },
    ...options
  })
}

// Update Product Mutation
export function useUpdateProductMutation(
  options?: UseMutationOptions<Product, Error, { id: string; updates: Partial<Product> }>
) {
  const queryClient = useQueryClient()
  const productStore = useProductStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      return await productService.updateProduct(id, updates)
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productQueryKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() })

      // Snapshot previous values
      const previousProduct = queryClient.getQueryData(productQueryKeys.detail(id))
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // Optimistically update detail query
      queryClient.setQueryData(productQueryKeys.detail(id), (old: Product | undefined) =>
        old ? { ...old, ...updates } : undefined
      )

      // Optimistically update list query
      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
        old.map(product => product.id === id ? { ...product, ...updates } : product)
      )

      return { previousProduct, previousProducts, id, updates }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousProduct) {
        queryClient.setQueryData(productQueryKeys.detail(context.id), context.previousProduct)
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },
    onSuccess: (data, variables, context) => {
      // Update all relevant queries
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productQueryKeys.aggregate(data.id) })

      // Update Pinia store
      productStore.syncProductChanges(data.id, data)

      // Emit global event
      eventEmitter.product.updated(data.id, data, context?.updates || {})
    },
    ...options
  })
}

// Enhanced Delete Product Mutation with detailed error handling
export function useDeleteProductMutation(
  options?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient()
  const productStore = useProductStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async (id: string) => {
      return await productService.deleteProduct(id)
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productQueryKeys.all })

      // Snapshot previous values
      const previousProduct = queryClient.getQueryData(productQueryKeys.detail(id))
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // Don't optimistically remove if we expect potential referential integrity issues
      // Let the actual delete confirm success first

      return { previousProduct, previousProducts, id }
    },
    onError: (error: any, id, context) => {
      // Enhanced error handling for different types of deletion failures

      // Always rollback optimistic updates
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }

      // Log specific error types for debugging
      if (error.name === 'ReferentialIntegrityError') {
        console.log(`🔒 Referential integrity error for product ${id}:`, {
          productName: error.productName,
          bundleCount: error.data?.bundleCount,
          message: error.message
        })
      } else {
        console.error(`❌ Product deletion failed for ${id}:`, error)
      }
    },
    onSuccess: (success, id, context) => {
      if (success) {
        // Remove from all queries only after confirmed successful deletion
        queryClient.removeQueries({ queryKey: productQueryKeys.detail(id) })
        queryClient.removeQueries({ queryKey: productQueryKeys.aggregate(id) })
        queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })

        // Update Pinia store
        productStore.invalidateProduct(id)

        // Emit global event
        eventEmitter.product.deleted(id)
      }
    },
    ...options
  })
}

// Bulk Update Products Mutation
export function useBulkUpdateProductsMutation(
  options?: UseMutationOptions<Product[], Error, Array<{ id: string; data: Partial<Product> }>>
) {
  const queryClient = useQueryClient()
  const productStore = useProductStore()

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; data: Partial<Product> }>) => {
      return await productService.bulkUpdateProducts(updates)
    },
    onSuccess: (data) => {
      // Invalidate all product queries
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all })

      // Update Pinia store
      data.forEach(product => {
        productStore.syncProductChanges(product.id, product)
      })
    },
    ...options
  })
}

// Product Bundles Usage Query
export function useProductBundlesQuery(
  productId: Ref<string> | string,
  options?: UseQueryOptions<any>
) {
  const id = isRef(productId) ? productId : ref(productId)

  return useQuery({
    queryKey: computed(() => productQueryKeys.bundles(id.value)),
    queryFn: async () => {
      const response = await $fetch(`/api/products/${id.value}/bundles`)
      return response.data
    },
    enabled: computed(() => !!id.value),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      queryClient.invalidateQueries({ queryKey: productQueryKeys.aggregate(id) })
      queryClient.invalidateQueries({ queryKey: productQueryKeys.bundles(id) })
    },
    invalidateSearch: () => queryClient.invalidateQueries({
      queryKey: productQueryKeys.all,
      predicate: (query) => query.queryKey.includes('search')
    }),
    prefetchProduct: (id: string) => queryClient.prefetchQuery({
      queryKey: productQueryKeys.detail(id),
      queryFn: () => productService.getProduct(id)
    }),
    prefetchProductBundles: (id: string) => queryClient.prefetchQuery({
      queryKey: productQueryKeys.bundles(id),
      queryFn: async () => {
        const response = await $fetch(`/api/products/${id}/bundles`)
        return response.data
      }
    })
  }
}