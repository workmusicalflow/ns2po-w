/**
 * Composable pour la gestion Cloudinary
 * Upload, transformation et gestion d'images
 */

import { ref, readonly } from 'vue'
import type { CloudinaryUploadResult, CloudinaryTransformOptions } from '../utils/cloudinary'
import { buildCloudinaryUrl, cloudinaryPresets } from '../utils/cloudinary'

export const useCloudinary = () => {
  // État réactif
  const isUploading = ref(false)
  const uploadProgress = ref(0)
  const uploadError = ref<string | null>(null)
  const uploadResults = ref<CloudinaryUploadResult[]>([])

  /**
   * Upload un fichier vers Cloudinary
   */
  const uploadFile = async (
    file: File,
    options: {
      preset?: string
      folder?: string
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<CloudinaryUploadResult> => {
    const { preset = 'default', folder = 'ns2po-election', onProgress } = options

    if (!file) {
      throw new Error('Aucun fichier fourni')
    }

    try {
      isUploading.value = true
      uploadError.value = null
      uploadProgress.value = 0

      // Simulation de progression
      const progressInterval = setInterval(() => {
        if (uploadProgress.value < 90) {
          uploadProgress.value += Math.random() * 15
          onProgress?.(uploadProgress.value)
        }
      }, 200)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('preset', preset)
      formData.append('folder', folder)

      const response = await $fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      }) as {
        success: boolean
        data: CloudinaryUploadResult
      }

      clearInterval(progressInterval)
      uploadProgress.value = 100
      onProgress?.(100)

      if (!response.success) {
        throw new Error('Upload échoué')
      }

      // Ajouter le résultat à la liste
      uploadResults.value.push(response.data)
      
      return response.data

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload'
      uploadError.value = errorMessage
      throw error
    } finally {
      setTimeout(() => {
        isUploading.value = false
        uploadProgress.value = 0
      }, 500)
    }
  }

  /**
   * Upload multiple files
   */
  const uploadMultipleFiles = async (
    files: File[],
    options: {
      preset?: string
      folder?: string
      onProgress?: (progress: number) => void
      onFileComplete?: (result: CloudinaryUploadResult, index: number) => void
    } = {}
  ): Promise<CloudinaryUploadResult[]> => {
    const { onProgress, onFileComplete } = options
    const results: CloudinaryUploadResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file) continue
      
      try {
        const result = await uploadFile(file, {
          ...options,
          onProgress: (fileProgress) => {
            const totalProgress = ((i + fileProgress / 100) / files.length) * 100
            onProgress?.(totalProgress)
          }
        })
        
        results.push(result)
        onFileComplete?.(result, i)
        
      } catch (error) {
        console.error(`Erreur upload fichier ${i + 1}:`, error)
        // Continue avec les autres fichiers
      }
    }
    
    return results
  }

  /**
   * Génère les URLs transformées pour un public_id
   */
  const getTransformedUrls = (publicId: string) => {

    return {
      original: buildCloudinaryUrl(publicId),
      thumbnail: buildCloudinaryUrl(publicId, cloudinaryPresets.thumbnail),
      productMain: buildCloudinaryUrl(publicId, cloudinaryPresets.productMain),
      gallery: buildCloudinaryUrl(publicId, cloudinaryPresets.gallery),
      avatar: buildCloudinaryUrl(publicId, cloudinaryPresets.avatar),
      logoUpload: buildCloudinaryUrl(publicId, cloudinaryPresets.logoUpload),
      
      // URL personnalisée
      custom: (options: CloudinaryTransformOptions) => 
        buildCloudinaryUrl(publicId, options)
    }
  }

  /**
   * Valide un fichier avant upload
   */
  const validateFile = (
    file: File,
    options: {
      maxSize?: number // en MB
      allowedTypes?: string[]
    } = {}
  ) => {
    const { 
      maxSize = 10, 
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] 
    } = options

    // Type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type non supporté. Formats autorisés: ${allowedTypes.join(', ')}`
      }
    }

    // Taille
    const maxBytes = maxSize * 1024 * 1024
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `Fichier trop volumineux. Taille max: ${maxSize}MB`
      }
    }

    return { valid: true, error: null }
  }

  /**
   * Reset l'état
   */
  const reset = () => {
    isUploading.value = false
    uploadProgress.value = 0
    uploadError.value = null
    uploadResults.value = []
  }

  /**
   * Supprime un upload de la liste des résultats
   */
  const removeUploadResult = (publicId: string) => {
    uploadResults.value = uploadResults.value.filter(
      (result: CloudinaryUploadResult) => result.public_id !== publicId
    )
  }

  /**
   * Génère un nom de fichier unique
   */
  const generateUniqueFilename = (originalName: string, prefix = '') => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')

    return prefix ? `${prefix}_${timestamp}_${random}_${cleanName}` : `${timestamp}_${random}_${cleanName}`
  }

  /**
   * Extrait le public_id depuis une URL Cloudinary complète
   */
  const extractPublicId = (cloudinaryUrl: string): string | null => {
    const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/)
    return match ? match[1] : null
  }

  /**
   * Optimise URL image produit pour affichage (PDF, UI)
   * Gère plusieurs cas :
   * - URL Cloudinary complète → Extrait public_id et optimise
   * - Public ID direct → Optimise directement
   * - Undefined/null → Retourne placeholder
   * - URL non-Cloudinary → Retourne tel quel (no-op)
   */
  const getProductImageUrl = (
    imageUrl?: string,
    options: CloudinaryTransformOptions = {}
  ): string => {
    const PLACEHOLDER = 'placeholder-produit_gz1yex'

    // Fallback placeholder si image manquante
    if (!imageUrl) {
      return buildCloudinaryUrl(PLACEHOLDER, {
        width: 400,
        height: 400,
        quality: 85,
        crop: 'fit',
        format: 'auto',
        ...options
      })
    }

    // Si URL Cloudinary complète, extraire public_id
    if (imageUrl.includes('cloudinary.com')) {
      const publicId = extractPublicId(imageUrl)
      if (!publicId) {
        console.warn(`[useCloudinary] Impossible d'extraire public_id depuis: ${imageUrl}`)
        return buildCloudinaryUrl(PLACEHOLDER, options)
      }
      return buildCloudinaryUrl(publicId, {
        width: 400,
        height: 400,
        quality: 85,
        crop: 'fit',
        format: 'auto',
        ...options
      })
    }

    // Si URL externe non-Cloudinary, retourner tel quel
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.warn(`[useCloudinary] URL externe non-Cloudinary: ${imageUrl}`)
      return imageUrl // No-op
    }

    // Sinon, traiter comme public_id direct
    return buildCloudinaryUrl(imageUrl, {
      width: 400,
      height: 400,
      quality: 85,
      crop: 'fit',
      format: 'auto',
      ...options
    })
  }

  /**
   * Preset thumbnail produit pour listes/cartes (64x64, optimisé)
   */
  const getThumbnailUrl = (imageUrl?: string): string => {
    return getProductImageUrl(imageUrl, {
      width: 64,
      height: 64,
      quality: 80,
      crop: 'fill',
    })
  }

  /**
   * Preset image produit pour détail/modal (800x800, haute qualité)
   */
  const getDetailUrl = (imageUrl?: string): string => {
    return getProductImageUrl(imageUrl, {
      width: 800,
      height: 800,
      quality: 90,
      crop: 'fit',
    })
  }

  return {
    // État
    isUploading: readonly(isUploading),
    uploadProgress: readonly(uploadProgress),
    uploadError: readonly(uploadError),
    uploadResults: readonly(uploadResults),

    // Actions
    uploadFile,
    uploadMultipleFiles,
    getTransformedUrls,
    validateFile,
    reset,
    removeUploadResult,
    generateUniqueFilename,

    // Nouvelles fonctions pour images produits
    extractPublicId,
    getProductImageUrl,
    getThumbnailUrl,
    getDetailUrl,
  }
}