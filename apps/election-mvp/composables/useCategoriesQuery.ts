/**
 * Categories Query Composable
 * SOLID Architecture - Cohérent avec useBundlesQuery pattern
 * Remplace useLazyAsyncData pour uniformité Vue Query
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions
} from '@tanstack/vue-query'
import type { Category } from '../types/domain/Category'

// Query Keys Factory - Convention Vue Query
export const categoryQueryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryQueryKeys.all, 'list'] as const,
  details: () => [...categoryQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryQueryKeys.details(), id] as const
}

// Categories List Query - Cohérent avec useBundlesQuery
export function useCategoriesQuery(
  options?: UseQueryOptions<Category[], Error>
) {
  return useQuery({
    queryKey: categoryQueryKeys.lists(),
    queryFn: async (): Promise<Category[]> => {
      const response = await $fetch<{ success: boolean; data: Category[] }>('/api/categories')

      if (!response.success) {
        throw new Error('Failed to fetch categories')
      }

      return response.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories changent rarement
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options
  })
}

// Single Category Query
export function useCategoryQuery(
  id: Ref<string> | string,
  options?: UseQueryOptions<Category | null, Error>
) {
  const idRef = isRef(id) ? id : ref(id)

  return useQuery({
    queryKey: computed(() => categoryQueryKeys.detail(idRef.value)),
    queryFn: async (): Promise<Category | null> => {
      if (!idRef.value) return null

      const response = await $fetch<{ success: boolean; data: Category }>(`/api/categories/${idRef.value}`)

      if (!response.success) {
        throw new Error(`Failed to fetch category ${idRef.value}`)
      }

      return response.data
    },
    enabled: computed(() => !!idRef.value),
    staleTime: 10 * 60 * 1000,
    ...options
  })
}

// Create Category Mutation
export function useCreateCategoryMutation(
  options?: UseMutationOptions<Category, Error, Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await $fetch<{ success: boolean; data: Category }>('/api/categories', {
        method: 'POST',
        body: categoryData
      })

      if (!response.success) {
        throw new Error('Failed to create category')
      }

      return response.data
    },
    onSuccess: (data) => {
      // Invalider le cache des catégories
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Category> }) => {
      const response = await $fetch<{ success: boolean; data: Category }>(`/api/categories/${id}`, {
        method: 'PUT',
        body: updates
      })

      if (!response.success) {
        throw new Error('Failed to update category')
      }

      return response.data
    },
    onSuccess: (data) => {
      // Mettre à jour le cache spécifique et invalider la liste
      queryClient.setQueryData(categoryQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() })
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
    mutationFn: async (id: string) => {
      const response = await $fetch<{ success: boolean }>(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (!response.success) {
        throw new Error('Failed to delete category')
      }

      return true
    },
    onSuccess: (_, id) => {
      // Supprimer du cache et invalider la liste
      queryClient.removeQueries({ queryKey: categoryQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() })
    },
    ...options
  })
}

// Query Invalidation Helpers - Pattern cohérent avec useProductsQuery
export function useCategoryQueryInvalidation() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.lists() }),
    invalidateCategory: (id: string) => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.detail(id) })
    },
    prefetchCategory: (id: string) => queryClient.prefetchQuery({
      queryKey: categoryQueryKeys.detail(id),
      queryFn: async () => {
        const response = await $fetch<{ success: boolean; data: Category }>(`/api/categories/${id}`)
        return response.data
      }
    })
  }
}