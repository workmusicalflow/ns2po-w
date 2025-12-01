/**
 * Composable pour la gestion unifiée des médias produit
 * Orchestre useCloudinary pour l'upload et gère l'état ProductMedia[]
 *
 * Usage:
 * const { items, addFiles, removeItem, setMainImage } = useProductMedia()
 * <ProductMediaManager v-model="items" />
 */

import { ref, computed, readonly } from 'vue'
import type { ProductMedia, ProductMediaState } from '../types/media'
import { legacyToProductMedia, productMediaToLegacy, generateTempId } from '../types/media'
import { useCloudinary } from './useCloudinary'

export interface UseProductMediaOptions {
  /** Dossier Cloudinary pour les uploads */
  folder?: string
  /** Taille max fichier en MB */
  maxFileSize?: number
  /** Types MIME autorisés */
  allowedTypes?: string[]
  /** Nombre max d'images */
  maxItems?: number
}

const DEFAULT_OPTIONS: Required<UseProductMediaOptions> = {
  folder: 'ns2po-election/products',
  maxFileSize: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxItems: 10
}

export function useProductMedia(options: UseProductMediaOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options }

  // Cloudinary composable pour l'upload
  const cloudinary = useCloudinary()

  // État réactif unifié
  const state = ref<ProductMediaState>({
    items: [],
    isUploading: false,
    error: null
  })

  // === Computed ===

  /** Liste des médias */
  const items = computed(() => state.value.items)

  /** Image principale (première avec isMain = true) */
  const mainImage = computed(() =>
    state.value.items.find(item => item.isMain && item.status === 'uploaded')
  )

  /** Images galerie (toutes sauf principale) */
  const galleryImages = computed(() =>
    state.value.items.filter(item => !item.isMain && item.status === 'uploaded')
  )

  /** Indique si un upload est en cours */
  const isUploading = computed(() => state.value.isUploading)

  /** Erreur globale */
  const error = computed(() => state.value.error)

  /** Peut ajouter plus d'images ? */
  const canAddMore = computed(() => state.value.items.length < config.maxItems)

  // === Actions ===

  /**
   * Initialise depuis les données legacy (API/DB)
   */
  function initFromLegacy(imageUrl?: string, galleryUrls?: string[]) {
    state.value.items = legacyToProductMedia(imageUrl, galleryUrls)
    state.value.error = null
  }

  /**
   * Exporte vers format legacy pour l'API
   */
  function toLegacy() {
    return productMediaToLegacy(state.value.items)
  }

  /**
   * Définit directement les items (pour v-model)
   */
  function setItems(newItems: ProductMedia[]) {
    state.value.items = newItems
  }

  /**
   * Ajoute des fichiers et lance l'upload
   */
  async function addFiles(files: File[], setAsMain = false): Promise<void> {
    if (!files.length) return

    // Vérifier limite
    const availableSlots = config.maxItems - state.value.items.length
    if (availableSlots <= 0) {
      state.value.error = `Maximum ${config.maxItems} images autorisées`
      return
    }

    const filesToProcess = files.slice(0, availableSlots)

    // Valider chaque fichier
    for (const file of filesToProcess) {
      const validation = cloudinary.validateFile(file, {
        maxSize: config.maxFileSize,
        allowedTypes: config.allowedTypes
      })

      if (!validation.valid) {
        state.value.error = validation.error
        return
      }
    }

    state.value.error = null
    state.value.isUploading = true

    // Créer previews locaux immédiatement (UX optimiste)
    const newItems: ProductMedia[] = filesToProcess.map((file, index) => ({
      id: generateTempId(),
      url: URL.createObjectURL(file),
      isMain: setAsMain && index === 0 && !mainImage.value,
      status: 'pending' as const,
      file,
      uploadProgress: 0
    }))

    // Ajouter à la liste
    state.value.items = [...state.value.items, ...newItems]

    // Upload chaque fichier
    for (const item of newItems) {
      if (!item.file) continue

      try {
        // Marquer comme uploading
        updateItem(item.id, { status: 'uploading' })

        // Upload vers Cloudinary
        const result = await cloudinary.uploadFile(item.file, {
          folder: config.folder,
          onProgress: (progress) => {
            updateItem(item.id, { uploadProgress: progress })
          }
        })

        // Révoquer l'URL blob
        URL.revokeObjectURL(item.url)

        // Mettre à jour avec l'URL Cloudinary
        updateItem(item.id, {
          id: result.public_id,
          url: result.secure_url,
          status: 'uploaded',
          uploadProgress: 100,
          file: undefined
        })

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur upload'
        updateItem(item.id, {
          status: 'error',
          errorMessage
        })
      }
    }

    state.value.isUploading = false
  }

  /**
   * Met à jour un item par son ID
   */
  function updateItem(id: string, updates: Partial<ProductMedia>) {
    state.value.items = state.value.items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
  }

  /**
   * Supprime un item par son ID
   */
  function removeItem(id: string) {
    const item = state.value.items.find(i => i.id === id)

    // Révoquer l'URL blob si c'est un preview local
    if (item?.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url)
    }

    state.value.items = state.value.items.filter(i => i.id !== id)

    // Si on supprime l'image principale, promouvoir la première galerie
    if (item?.isMain && state.value.items.length > 0) {
      const firstItem = state.value.items[0]
      if (firstItem) {
        updateItem(firstItem.id, { isMain: true })
      }
    }
  }

  /**
   * Définit une image comme principale
   */
  function setMainImage(id: string) {
    state.value.items = state.value.items.map(item => ({
      ...item,
      isMain: item.id === id
    }))
  }

  /**
   * Réordonne les images (drag & drop)
   */
  function reorderItems(fromIndex: number, toIndex: number) {
    const items = [...state.value.items]
    const [removed] = items.splice(fromIndex, 1)
    if (removed) {
      items.splice(toIndex, 0, removed)
      state.value.items = items
    }
  }

  /**
   * Ajoute une URL externe (pour rétrocompatibilité)
   */
  function addUrl(url: string, isMain = false) {
    if (!url) return

    // Extraire public_id si URL Cloudinary
    const publicId = cloudinary.extractPublicId(url)

    const newItem: ProductMedia = {
      id: publicId || `url-${Date.now()}`,
      url,
      isMain: isMain && !mainImage.value,
      status: 'uploaded'
    }

    state.value.items = [...state.value.items, newItem]
  }

  /**
   * Retry upload d'un item en erreur
   */
  async function retryUpload(id: string) {
    const item = state.value.items.find(i => i.id === id)
    if (!item?.file || item.status !== 'error') return

    state.value.isUploading = true

    try {
      updateItem(id, { status: 'uploading', errorMessage: undefined })

      const result = await cloudinary.uploadFile(item.file, {
        folder: config.folder,
        onProgress: (progress) => {
          updateItem(id, { uploadProgress: progress })
        }
      })

      URL.revokeObjectURL(item.url)

      updateItem(id, {
        id: result.public_id,
        url: result.secure_url,
        status: 'uploaded',
        uploadProgress: 100,
        file: undefined
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur upload'
      updateItem(id, {
        status: 'error',
        errorMessage
      })
    }

    state.value.isUploading = false
  }

  /**
   * Reset complet
   */
  function reset() {
    // Révoquer toutes les URLs blob
    state.value.items.forEach(item => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url)
      }
    })

    state.value = {
      items: [],
      isUploading: false,
      error: null
    }
  }

  /**
   * Efface l'erreur
   */
  function clearError() {
    state.value.error = null
  }

  return {
    // État (readonly pour immutabilité)
    items: readonly(items),
    mainImage: readonly(mainImage),
    galleryImages: readonly(galleryImages),
    isUploading: readonly(isUploading),
    error: readonly(error),
    canAddMore: readonly(canAddMore),

    // Actions
    initFromLegacy,
    toLegacy,
    setItems,
    addFiles,
    removeItem,
    setMainImage,
    reorderItems,
    addUrl,
    retryUpload,
    reset,
    clearError,

    // Helpers Cloudinary exposés
    getProductImageUrl: cloudinary.getProductImageUrl,
    getThumbnailUrl: cloudinary.getThumbnailUrl,
    getDetailUrl: cloudinary.getDetailUrl
  }
}
