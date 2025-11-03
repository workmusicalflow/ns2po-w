/**
 * Categories Mutations Composable
 * SOLID Architecture - TanStack Query Mutations
 * Gestion complète des mutations CRUD pour les catégories
 * Pattern cohérent avec useProductMutations.ts
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions
} from '@tanstack/vue-query'
import type { Category } from '../types/domain/Category'
import { categoryQueryKeys } from './useCategoriesQuery'

// Create Category Mutation
export function useCreateCategoryMutation(
  options?: UseMutationOptions<Category, Error, Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
      const response = await $fetch('/api/categories', {
        method: 'POST',
        body: categoryData
      }) as { success: boolean; data: Category }

      if (!response.success) {
        throw new Error('Failed to create category')
      }

      return response.data
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: categoryQueryKeys.lists() })

      // Snapshot previous value
      const previousCategories = queryClient.getQueryData(categoryQueryKeys.lists())

      // Optimistically update
      const optimisticCategory: Category = {
        id: `temp-${Date.now()}`,
        ...variables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      queryClient.setQueryData(categoryQueryKeys.lists(), (old: Category[] = []) => [
        optimisticCategory,
        ...old
      ])

      return { previousCategories, optimisticCategory }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if ((context as any)?.previousCategories) {
        queryClient.setQueryData(categoryQueryKeys.lists(), (context as any).previousCategories)
      }
    },
    onSuccess: (data, _variables, context) => {
      // ⚡ Invalidation ciblée (évite sur-invalidation)
      queryClient.invalidateQueries({
        queryKey: categoryQueryKeys.lists(),
        exact: false // Invalide toutes les listes (avec filtres potentiels)
      })

      // Pre-populate the detail cache for immediate access
      queryClient.setQueryData(categoryQueryKeys.detail(data.id), data)

      // Replace optimistic update with real data
      if ((context as any)?.optimisticCategory) {
        queryClient.setQueryData(categoryQueryKeys.lists(), (old: Category[] = []) =>
          old.map(category =>
            category.id === (context as any).optimisticCategory.id ? data : category
          )
        )
      }

      // Automatic navigation to edit page (category detail page)
      navigateTo(`/admin/categories/${data.id}`)
    },
    ...options
  })
}

// Update Category Mutation
export function useUpdateCategoryMutation(
  options?: UseMutationOptions<Category, Error, { id: string; updates: Partial<Category> }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }): Promise<Category> => {
      const response = await $fetch(`/api/categories/${id}`, {
        method: 'PUT',
        body: updates
      }) as { success: boolean; data: Category }

      if (!response.success) {
        throw new Error('Failed to update category')
      }

      return response.data
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: categoryQueryKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: categoryQueryKeys.lists() })

      // Snapshot previous values
      const previousCategory = queryClient.getQueryData(categoryQueryKeys.detail(id))
      const previousCategories = queryClient.getQueryData(categoryQueryKeys.lists())

      // Optimistically update detail query
      queryClient.setQueryData(categoryQueryKeys.detail(id), (old: Category | undefined) =>
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : undefined
      )

      // Optimistically update list query
      queryClient.setQueryData(categoryQueryKeys.lists(), (old: Category[] = []) =>
        old.map(category => category.id === id ? { ...category, ...updates, updatedAt: new Date().toISOString() } : category)
      )

      return { previousCategory, previousCategories, id, updates }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if ((context as any)?.previousCategory) {
        queryClient.setQueryData(categoryQueryKeys.detail((context as any).id), (context as any).previousCategory)
      }
      if ((context as any)?.previousCategories) {
        queryClient.setQueryData(categoryQueryKeys.lists(), (context as any).previousCategories)
      }
    },
    onSuccess: (data, _variables, context) => {
      // Update detail cache directly
      queryClient.setQueryData(categoryQueryKeys.detail(data.id), data)

      // ⚡ Invalidation ciblée listes seulement
      queryClient.invalidateQueries({
        queryKey: categoryQueryKeys.lists(),
        exact: false // Invalide toutes variantes de listes
      })
    },
    ...options
  })
}

// Delete Category Mutation
export function useDeleteCategoryMutation(
  options?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      const response = await $fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      }) as { success: boolean }

      if (!response.success) {
        throw new Error('Failed to delete category')
      }

      return response.success
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: categoryQueryKeys.all })

      // Snapshot previous values
      const previousCategory = queryClient.getQueryData(categoryQueryKeys.detail(id))
      const previousCategories = queryClient.getQueryData(categoryQueryKeys.lists())

      // Optimistically remove from lists
      queryClient.setQueryData(categoryQueryKeys.lists(), (old: Category[] = []) =>
        old.filter(category => category.id !== id)
      )

      return { previousCategory, previousCategories, id }
    },
    onError: (error, id, context) => {
      // Rollback optimistic updates
      if ((context as any)?.previousCategories) {
        queryClient.setQueryData(categoryQueryKeys.lists(), (context as any).previousCategories)
      }
    },
    onSuccess: (success, id, context) => {
      if (success) {
        // Remove detail cache (exact match)
        queryClient.removeQueries({ queryKey: categoryQueryKeys.detail(id), exact: true })

        // ⚡ Invalidation ciblée listes uniquement
        queryClient.invalidateQueries({
          queryKey: categoryQueryKeys.lists(),
          exact: false
        })
      }
    },
    ...options
  })
}
