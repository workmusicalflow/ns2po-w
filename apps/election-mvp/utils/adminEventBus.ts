/**
 * Event Bus Admin - Images/Cloudinary uniquement
 *
 * 🚨 MIGRATION TANSTACK QUERY PURE - Phase 3.5
 * Event bus produits supprimé (remplacé par TanStack Query invalidation)
 * Conservé uniquement pour synchronisation métadonnées Cloudinary
 */

import mitt from 'mitt'

export interface ProductImagesEvents {
  'image:metadata-updated': {
    productId: string
    publicId: string
    metadata: any
  }
}

const productImagesEventBus = mitt<ProductImagesEvents>()

export const useProductImagesEventBus = () => {
  return {
    emitImageMetadataUpdated: (productId: string, publicId: string, metadata: any) => {
      productImagesEventBus.emit('image:metadata-updated', { productId, publicId, metadata })
    },
    onImageMetadataUpdated: (
      handler: (event: ProductImagesEvents['image:metadata-updated']) => void
    ) => {
      productImagesEventBus.on('image:metadata-updated', handler)
    },
    offImageMetadataUpdated: (
      handler: (event: ProductImagesEvents['image:metadata-updated']) => void
    ) => {
      productImagesEventBus.off('image:metadata-updated', handler)
    }
  }
}
