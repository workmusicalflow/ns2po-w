/**
 * Composable pour la gestion des assets Cloudinary via TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// Types pour les assets
export interface Asset {
  id: string
  public_id: string
  secure_url: string
  url?: string
  format: string
  resource_type: string
  bytes: number
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  tags?: string[]
  folder: string
  created_at: string
  updated_at: string
  is_deleted: boolean
  usage_count?: number // Nombre d'usages de cet asset
}

export interface AssetFilters {
  format?: string
  folder?: string
  tags?: string[]
  search?: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'updated_at' | 'bytes'
  sortOrder?: 'asc' | 'desc'
}

export interface AssetsResponse {
  assets: Asset[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface UpdateAssetData {
  alt_text?: string
  caption?: string
  tags?: string[]
}

/**
 * Hook pour récupérer la liste des assets avec filtres et pagination
 */
export function useAssetsQuery(
  filters: Ref<AssetFilters> = ref({}),
  pagination: Ref<PaginationOptions> = ref({})
) {
  const queryKey = computed(() => ['assets', filters.value, pagination.value])

  return useQuery({
    queryKey,
    queryFn: async (): Promise<AssetsResponse> => {
      const params = new URLSearchParams()

      // Ajout des filtres
      if (filters.value.format) params.set('format', filters.value.format)
      if (filters.value.folder) params.set('folder', filters.value.folder)
      if (filters.value.search) params.set('search', filters.value.search)
      if (filters.value.tags?.length) params.set('tags', filters.value.tags.join(','))

      // Ajout de la pagination
      if (pagination.value.page) params.set('page', pagination.value.page.toString())
      if (pagination.value.limit) params.set('limit', pagination.value.limit.toString())
      if (pagination.value.sortBy) params.set('sortBy', pagination.value.sortBy)
      if (pagination.value.sortOrder) params.set('sortOrder', pagination.value.sortOrder)

      const response = await $fetch<{
        success: boolean
        data: AssetsResponse
        message: string
      }>(`/api/assets?${params.toString()}`)

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du chargement des assets')
      }

      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook pour récupérer un asset individuel
 */
export function useAssetQuery(assetId: MaybeRef<string>) {
  const id = toRef(assetId)

  return useQuery({
    queryKey: computed(() => ['asset', id.value]),
    queryFn: async (): Promise<Asset> => {
      if (!id.value) throw new Error('Asset ID requis')

      const response = await $fetch<{
        success: boolean
        data: Asset
        message: string
      }>(`/api/assets/${id.value}`)

      if (!response.success) {
        throw new Error(response.message || 'Asset non trouvé')
      }

      return response.data
    },
    enabled: computed(() => !!id.value),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })
}

/**
 * Hook pour la mise à jour des métadonnées d'un asset
 */
export function useUpdateAssetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: UpdateAssetData
    }): Promise<Asset> => {
      const response = await $fetch<{
        success: boolean
        data: Asset
        message: string
      }>(`/api/assets/${id}`, {
        method: 'PUT',
        body: updates
      })

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la mise à jour')
      }

      return response.data
    },
    onSuccess: (updatedAsset) => {
      // Invalider les requêtes related
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.setQueryData(['asset', updatedAsset.id], updatedAsset)
    }
  })
}

/**
 * Hook pour la suppression d'un asset
 */
export function useDeleteAssetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetId: string): Promise<{
      success: boolean
      asset: Asset | null
    }> => {
      const response = await $fetch<{
        success: boolean
        data: {
          asset: Asset | null
          deleted_from_cloudinary: boolean
          deleted_from_database: boolean
        }
        message: string
      }>(`/api/assets/${assetId}`, {
        method: 'DELETE'
      })

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la suppression')
      }

      return {
        success: response.data.deleted_from_cloudinary && response.data.deleted_from_database,
        asset: response.data.asset
      }
    },
    onSuccess: () => {
      // Invalider et refetch la liste des assets
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}

/**
 * Hook pour l'upload d'un nouvel asset
 */
export function useUploadAssetMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      metadata
    }: {
      file: File
      metadata?: {
        alt_text?: string
        caption?: string
        tags?: string[]
        folder?: string
      }
    }): Promise<Asset> => {
      const formData = new FormData()
      formData.append('file', file)

      if (metadata?.alt_text) formData.append('alt_text', metadata.alt_text)
      if (metadata?.caption) formData.append('caption', metadata.caption)
      if (metadata?.folder) formData.append('folder', metadata.folder)
      if (metadata?.tags) formData.append('tags', JSON.stringify(metadata.tags))

      const response = await $fetch<{
        success: boolean
        data: Asset
        message: string
      }>('/api/assets', {
        method: 'POST',
        body: formData
      })

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de l\'upload')
      }

      return response.data
    },
    onSuccess: () => {
      // Invalider et refetch la liste des assets
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    }
  })
}

/**
 * Utilitaires pour le formatage
 */
export function formatAssetFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getAssetTypeIcon(format: string, resource_type: string): string {
  if (resource_type === 'video') return 'heroicons:play'
  if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(format.toLowerCase())) {
    return 'heroicons:photo'
  }
  return 'heroicons:document'
}

export function getAssetTypeColor(format: string, resource_type: string): string {
  if (resource_type === 'video') return 'text-purple-600'
  if (['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(format.toLowerCase())) {
    return 'text-blue-600'
  }
  return 'text-gray-600'
}