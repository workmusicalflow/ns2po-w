/**
 * Composable pour la gestion Cloudinary
 * Upload, transformation et gestion d'images
 */

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

      const response = await $fetch<{
        success: boolean
        data: CloudinaryUploadResult
      }>('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      uploadProgress.value = 100
      onProgress?.(100)

      if (!response.success) {
        throw new Error('Upload échoué')
      }

      // Ajouter le résultat à la liste
      uploadResults.value.push(response.data)
      
      return response.data

    } catch (error: any) {
      uploadError.value = error.message || 'Erreur lors de l\'upload'
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
    generateUniqueFilename
  }
}