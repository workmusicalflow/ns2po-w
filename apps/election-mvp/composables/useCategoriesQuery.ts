/**
 * Categories Query Composable
 * SOLID Architecture - Cohérent avec useBundlesQuery pattern
 * Remplace useLazyAsyncData pour uniformité Vue Query
 *
 * ⚡ Mutations CRUD → useCategoryMutations.ts (optimistic updates)
 */

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions
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
      const response = await $fetch('/api/categories') as { success: boolean; data: Category[] }

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

      const response = await $fetch(`/api/categories/${idRef.value}`) as { success: boolean; data: Category }

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

// ⚡ Mutations CRUD → useCategoryMutations.ts (optimistic updates)

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
        const response = await $fetch(`/api/categories/${id}`) as { success: boolean; data: Category }
        return response.data
      }
    })
  }
}