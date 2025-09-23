/**
 * Composable pour la gestion avancée des métadonnées Cloudinary
 * Synchronisation en temps réel et gestion centralisée des métadonnées d'images
 */

import { ref, reactive, readonly } from 'vue'
import { useProductImagesEventBus } from '../utils/adminEventBus'

export interface CloudinaryMetadata {
  publicId: string
  alt?: string
  caption?: string
  tags?: string[]
  context?: Record<string, any>
  customCoordinates?: {
    x: number
    y: number
    width: number
    height: number
  }
  transformations?: {
    quality?: string
    format?: string
    crop?: string
    gravity?: string
    effects?: string[]
  }
  productAssociations?: {
    productId: string
    isMainImage: boolean
    sortOrder: number
  }[]
}

export interface CloudinaryImageInfo {
  publicId: string
  url: string
  secureUrl: string
  width: number
  height: number
  format: string
  resourceType: string
  createdAt: string
  bytes: number
  metadata: CloudinaryMetadata
}

export const useCloudinaryMetadata = () => {
  // État réactif global des métadonnées
  const metadataCache = reactive(new Map<string, CloudinaryMetadata>())
  const isLoading = ref(false)
  const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')

  // Event bus pour synchronisation
  const { emitImageMetadataUpdated } = useProductImagesEventBus()

  /**
   * Récupère les métadonnées d'une image depuis Cloudinary Admin API
   */
  const fetchImageMetadata = async (publicId: string): Promise<CloudinaryImageInfo | null> => {
    try {
      isLoading.value = true

      const response = await $fetch<{
        success: boolean
        data: CloudinaryImageInfo
      }>('/api/cloudinary/metadata', {
        method: 'GET',
        query: { public_id: publicId }
      })

      if (response.success && response.data) {
        // Mettre à jour le cache local
        metadataCache.set(publicId, response.data.metadata)
        return response.data
      }

      return null

    } catch (error) {
      console.error('Erreur récupération métadonnées Cloudinary:', error)
      syncStatus.value = 'error'
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Met à jour les métadonnées d'une image via Cloudinary Admin API
   */
  const updateImageMetadata = async (
    publicId: string,
    metadata: Partial<CloudinaryMetadata>,
    productId?: string
  ): Promise<boolean> => {
    try {
      isLoading.value = true
      syncStatus.value = 'syncing'

      const response = await $fetch<{
        success: boolean
        data: CloudinaryImageInfo
      }>('/api/cloudinary/metadata', {
        method: 'PUT',
        body: {
          public_id: publicId,
          metadata: {
            ...metadata,
            // Ajouter timestamps pour tracking
            lastUpdated: new Date().toISOString(),
            updatedBy: 'admin'
          }
        }
      })

      if (response.success) {
        // Mettre à jour le cache local
        const currentMetadata = metadataCache.get(publicId) || { publicId }
        const updatedMetadata = { ...currentMetadata, ...metadata }
        metadataCache.set(publicId, updatedMetadata)

        // Émettre l'événement de synchronisation
        if (productId) {
          emitImageMetadataUpdated(productId, publicId, updatedMetadata)
        }

        syncStatus.value = 'idle'
        return true
      }

      syncStatus.value = 'error'
      return false

    } catch (error) {
      console.error('Erreur mise à jour métadonnées:', error)
      syncStatus.value = 'error'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Synchronise les métadonnées avec la base de données produit
   */
  const syncProductImageMetadata = async (
    productId: string,
    imagePublicId: string,
    isMainImage: boolean = false
  ): Promise<boolean> => {
    try {
      // Récupérer les métadonnées depuis Cloudinary
      const imageInfo = await fetchImageMetadata(imagePublicId)
      if (!imageInfo) return false

      // Synchroniser avec la base de données produit
      const response = await $fetch<{ success: boolean }>(`/api/products/${productId}/images`, {
        method: 'PUT',
        body: {
          publicId: imagePublicId,
          metadata: imageInfo.metadata,
          isMainImage,
          cloudinaryInfo: {
            url: imageInfo.secureUrl,
            width: imageInfo.width,
            height: imageInfo.height,
            format: imageInfo.format,
            bytes: imageInfo.bytes
          }
        }
      })

      return response.success

    } catch (error) {
      console.error('Erreur synchronisation métadonnées produit:', error)
      return false
    }
  }

  /**
   * Applique des transformations intelligentes basées sur le contexte
   */
  const getContextualTransformations = (
    publicId: string,
    context: 'product_card' | 'product_hero' | 'thumbnail' | 'gallery'
  ): string => {
    const metadata = metadataCache.get(publicId)
    const baseUrl = `https://res.cloudinary.com/dsrvzogof/image/upload`

    // Transformations par contexte
    const contextTransformations = {
      product_card: 'w_400,h_300,c_fill,q_auto:good,f_auto',
      product_hero: 'w_800,h_600,c_fill,q_auto:best,f_auto',
      thumbnail: 'w_150,h_150,c_thumb,g_face:center,q_auto:eco,f_auto',
      gallery: 'w_600,h_450,c_fit,q_auto:good,f_auto'
    }

    let transformations = contextTransformations[context]

    // Appliquer les transformations personnalisées si disponibles
    if (metadata?.transformations) {
      const custom = metadata.transformations
      if (custom.quality) transformations = transformations.replace(/q_auto:\w+/, `q_${custom.quality}`)
      if (custom.format) transformations = transformations.replace(/f_auto/, `f_${custom.format}`)
      if (custom.gravity) transformations += `,g_${custom.gravity}`
      if (custom.effects?.length) transformations += `,e_${custom.effects.join(':')}`
    }

    // Appliquer les coordonnées personnalisées pour recadrage
    if (metadata?.customCoordinates) {
      const { x, y, width, height } = metadata.customCoordinates
      transformations += `,x_${x},y_${y},w_${width},h_${height},c_crop`
    }

    return `${baseUrl}/${transformations}/${publicId}`
  }

  /**
   * Génère des variantes d'images pour différents contextes
   */
  const generateImageVariants = (publicId: string) => {
    return {
      card: getContextualTransformations(publicId, 'product_card'),
      hero: getContextualTransformations(publicId, 'product_hero'),
      thumbnail: getContextualTransformations(publicId, 'thumbnail'),
      gallery: getContextualTransformations(publicId, 'gallery'),
      original: `https://res.cloudinary.com/dsrvzogof/image/upload/${publicId}`
    }
  }

  /**
   * Valide et nettoie les métadonnées avant sauvegarde
   */
  const validateMetadata = (metadata: Partial<CloudinaryMetadata>): {
    isValid: boolean
    errors: string[]
    cleanMetadata: Partial<CloudinaryMetadata>
  } => {
    const errors: string[] = []
    const cleanMetadata: Partial<CloudinaryMetadata> = {}

    // Validation ALT text
    if (metadata.alt) {
      if (metadata.alt.length > 125) {
        errors.push('Le texte alternatif ne peut pas dépasser 125 caractères')
      } else {
        cleanMetadata.alt = metadata.alt.trim()
      }
    }

    // Validation caption
    if (metadata.caption) {
      if (metadata.caption.length > 200) {
        errors.push('La légende ne peut pas dépasser 200 caractères')
      } else {
        cleanMetadata.caption = metadata.caption.trim()
      }
    }

    // Validation tags
    if (metadata.tags) {
      const validTags = metadata.tags
        .filter(tag => tag && tag.trim().length > 0)
        .map(tag => tag.trim().toLowerCase())
        .slice(0, 10) // Limite à 10 tags

      if (validTags.length > 0) {
        cleanMetadata.tags = validTags
      }
    }

    // Validation coordonnées personnalisées
    if (metadata.customCoordinates) {
      const { x, y, width, height } = metadata.customCoordinates
      if (x >= 0 && y >= 0 && width > 0 && height > 0) {
        cleanMetadata.customCoordinates = metadata.customCoordinates
      } else {
        errors.push('Coordonnées de recadrage invalides')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      cleanMetadata
    }
  }

  /**
   * Précharge et met en cache les métadonnées pour une liste d'images
   */
  const preloadImageMetadata = async (publicIds: string[]): Promise<void> => {
    try {
      isLoading.value = true

      const promises = publicIds
        .filter(id => !metadataCache.has(id))
        .map(id => fetchImageMetadata(id))

      await Promise.all(promises)

    } finally {
      isLoading.value = false
    }
  }

  /**
   * Récupère les métadonnées depuis le cache local
   */
  const getCachedMetadata = (publicId: string): CloudinaryMetadata | null => {
    return metadataCache.get(publicId) || null
  }

  /**
   * Nettoie le cache des métadonnées
   */
  const clearMetadataCache = (publicIds?: string[]): void => {
    if (publicIds) {
      publicIds.forEach(id => metadataCache.delete(id))
    } else {
      metadataCache.clear()
    }
  }

  return {
    // État
    isLoading: readonly(isLoading),
    syncStatus: readonly(syncStatus),
    metadataCache: readonly(metadataCache),

    // Actions principales
    fetchImageMetadata,
    updateImageMetadata,
    syncProductImageMetadata,

    // Transformations et variantes
    getContextualTransformations,
    generateImageVariants,

    // Utilitaires
    validateMetadata,
    preloadImageMetadata,
    getCachedMetadata,
    clearMetadataCache
  }
}