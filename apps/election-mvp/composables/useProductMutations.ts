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


// Create Product Mutation
export function useCreateProductMutation(
  options?: UseMutationOptions<Product, Error, Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
      const response = await $fetch('/api/admin/products', {
        method: 'POST',
        body: productData
      }) as { success: boolean; data: Product }

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
      if ((context as any)?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), (context as any).previousProducts)
      }
    },
    onSuccess: (data, _variables, context) => {
      // ⚡ Invalidation ciblée (évite sur-invalidation)
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.lists(),
        exact: false // Invalide toutes les listes (avec filtres)
      })

      // Invalidation recherche/catégories (si pertinent)
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.all,
        predicate: (query) =>
          query.queryKey.includes('search') ||
          query.queryKey.includes('category') ||
          query.queryKey.includes('popular') ||
          query.queryKey.includes('recent')
      })

      // Pre-populate the detail cache for immediate access
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)

      // Replace optimistic update with real data
      if ((context as any)?.optimisticProduct) {
        queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
          old.map(product =>
            product.id === (context as any).optimisticProduct.id ? data : product
          )
        )
      }

      // Automatic navigation to edit page (product detail page)
      navigateTo(`/admin/products/${data.id}`)
    },
    ...options
  })
}

// Update Product Mutation
export function useUpdateProductMutation(
  options?: UseMutationOptions<Product, Error, { id: string; updates: Partial<Product> }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }): Promise<Product> => {
      const response = await $fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        body: updates
      }) as { success: boolean; data: Product }

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
      if ((context as any)?.previousProduct) {
        queryClient.setQueryData(productQueryKeys.detail((context as any).id), (context as any).previousProduct)
      }
      if ((context as any)?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), (context as any).previousProducts)
      }
    },
    onSuccess: (data, _variables, context) => {
      // Update detail cache directly
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)

      // ⚡ Invalidation ciblée listes seulement
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.lists(),
        exact: false // Invalide toutes variantes de listes
      })

      // Invalidation bundles du produit
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.bundles(data.id),
        exact: true // Exact match seulement
      })
    },
    ...options
  })
}

// Delete Product Mutation
export function useDeleteProductMutation(
  options?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const response = await $fetch(`/api/admin/products/${id}`, {
        method: 'DELETE'
      }) as { success: boolean }

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
      if ((context as any)?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), (context as any).previousProducts)
      }
    },
    onSuccess: (success, id, context) => {
      if (success) {
        // Remove detail et bundles cache (exact match)
        queryClient.removeQueries({ queryKey: productQueryKeys.detail(id), exact: true })
        queryClient.removeQueries({ queryKey: productQueryKeys.bundles(id), exact: true })

        // ⚡ Invalidation ciblée listes uniquement
        queryClient.invalidateQueries({
          queryKey: productQueryKeys.lists(),
          exact: false
        })
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

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<Product> }): Promise<Product[]> => {
      // TODO: Créer endpoint /api/admin/products/bulk-update.put.ts avec schéma normalisé
      // Pour l'instant, faire des updates individuels
      const response = await $fetch('/api/admin/products/bulk-update', {
        method: 'PUT',
        body: { ids, updates }
      }) as { success: boolean; data: Product[] }

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
      if ((context as any)?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), (context as any).previousProducts)
      }
    },
    onSuccess: (data, { ids }) => {
      // ⚡ Invalidation ciblée listes
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.lists(),
        exact: false
      })

      // Invalidation details individuels (exact match)
      ids.forEach(id => {
        queryClient.invalidateQueries({
          queryKey: productQueryKeys.detail(id),
          exact: true
        })
      })
    },
    ...options
  })
}

