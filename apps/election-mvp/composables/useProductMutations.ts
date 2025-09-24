/**
 * Products Mutations Composable
 * SOLID Architecture - TanStack Query Mutations
 * Gestion complète des mutations CRUD pour les produits
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions
} from '@tanstack/vue-query'
import type { Product } from '../types/domain/Product'
import { productQueryKeys } from './useProductsQuery'
import { useProductStore } from '../stores/useProductStore'
import { useEventEmitter } from '../stores/useGlobalEventBus'

// Create Product Mutation
export function useCreateProductMutation(
  options?: UseMutationOptions<Product, Error, Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient()
  const productStore = useProductStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
      const response = await $fetch<{ success: boolean; data: Product }>('/api/products', {
        method: 'POST',
        body: productData
      })

      if (!response.success) {
        throw new Error('Failed to create product')
      }

      return response.data
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
    onSuccess: (data, _variables, context) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all })

      // Update Pinia store
      productStore.addProduct(data)

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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }): Promise<Product> => {
      const response = await $fetch<{ success: boolean; data: Product }>(`/api/products/${id}`, {
        method: 'PUT',
        body: updates
      })

      if (!response.success) {
        throw new Error('Failed to update product')
      }

      return response.data
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
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : undefined
      )

      // Optimistically update list query
      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
        old.map(product => product.id === id ? { ...product, ...updates, updatedAt: new Date().toISOString() } : product)
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
    onSuccess: (data, _variables, context) => {
      // Update all relevant queries
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productQueryKeys.bundles(data.id) })

      // Update Pinia store
      productStore.replaceProduct(data.id, data)

      // Emit global event
      eventEmitter.product.updated(data.id, data)
    },
    ...options
  })
}

// Delete Product Mutation
export function useDeleteProductMutation(
  options?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient()
  const productStore = useProductStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const response = await $fetch<{ success: boolean }>(`/api/products/${id}`, {
        method: 'DELETE'
      })

      if (!response.success) {
        throw new Error('Failed to delete product')
      }

      return response.success
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productQueryKeys.all })

      // Snapshot previous values
      const previousProduct = queryClient.getQueryData(productQueryKeys.detail(id))
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // Optimistically remove from lists
      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
        old.filter(product => product.id !== id)
      )

      return { previousProduct, previousProducts, id }
    },
    onError: (error, id, context) => {
      // Rollback optimistic updates
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },
    onSuccess: (success, id, context) => {
      if (success) {
        // Remove from all queries
        queryClient.removeQueries({ queryKey: productQueryKeys.detail(id) })
        queryClient.removeQueries({ queryKey: productQueryKeys.bundles(id) })
        queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })

        // Update Pinia store
        productStore.removeProduct(id)

        // Emit global event
        eventEmitter.product.deleted(id)
      }
    },
    ...options
  })
}

// Bulk Update Products Mutation
export function useBulkUpdateProductsMutation(
  options?: UseMutationOptions<Product[], Error, { ids: string[]; updates: Partial<Product> }>
) {
  const queryClient = useQueryClient()
  const productStore = useProductStore()
  const eventEmitter = useEventEmitter()

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<Product> }): Promise<Product[]> => {
      const response = await $fetch<{ success: boolean; data: Product[] }>('/api/products/bulk-update', {
        method: 'PUT',
        body: { ids, updates }
      })

      if (!response.success) {
        throw new Error('Failed to bulk update products')
      }

      return response.data
    },
    onMutate: async ({ ids, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() })

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // Optimistically update
      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
        old.map(product => ids.includes(product.id) ? { ...product, ...updates, updatedAt: new Date().toISOString() } : product)
      )

      return { previousProducts, ids, updates }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },
    onSuccess: (data, { ids }) => {
      // Update all relevant queries
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
      ids.forEach(id => {
        queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(id) })
      })

      // Update Pinia store
      data.forEach(product => {
        productStore.replaceProduct(product.id, product)
      })

      // Emit global event for bulk update
      eventEmitter.product.bulkUpdated(ids, data)
    },
    ...options
  })
}

