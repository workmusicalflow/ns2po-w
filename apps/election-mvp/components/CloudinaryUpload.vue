<template>
  <div class="cloudinary-upload">
    <!-- Zone de drop -->
    <div 
      :class="[
        'upload-zone',
        {
          'upload-zone--dragover': isDragOver,
          'upload-zone--error': error,
          'upload-zone--uploading': isUploading,
          'upload-zone--success': uploadResult
        }
      ]"
      @drop="handleDrop"
      @dragover.prevent
      @dragenter.prevent
      @dragleave="isDragOver = false"
      @dragover="isDragOver = true"
    >
      <!-- État initial / drop zone -->
      <div v-if="!isUploading && !uploadResult" class="upload-content">
        <div class="upload-icon">
          <svg viewBox="0 0 24 24" fill="none" class="w-12 h-12">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" />
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" />
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" />
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" />
          </svg>
        </div>
        
        <div class="upload-text">
          <h3 class="upload-title">
            {{ isDragOver ? 'Déposez votre image ici' : 'Télécharger une image' }}
          </h3>
          <p class="upload-subtitle">
            Glissez-déposez ou cliquez pour sélectionner
          </p>
          <p class="upload-formats">
            Formats: JPEG, PNG, WebP, SVG • Max: 10MB
          </p>
        </div>

        <Button 
          variant="primary"
          :disabled="isUploading"
          @click="triggerFileInput"
        >
          Choisir un fichier
        </Button>
      </div>

      <!-- État de chargement -->
      <div v-if="isUploading" class="upload-loading">
        <div class="loading-spinner" />
        <h3 class="loading-title">
          Upload en cours...
        </h3>
        <p class="loading-subtitle">
          {{ uploadProgress }}%
        </p>
      </div>

      <!-- Résultat success -->
      <div v-if="uploadResult && !error" class="upload-success">
        <div class="success-preview">
          <img 
            :src="uploadResult.thumbnail" 
            :alt="uploadResult.public_id"
            class="preview-image"
          >
        </div>
        
        <div class="success-info">
          <h3 class="success-title">
            Upload réussi !
          </h3>
          <p class="success-details">
            {{ formatFileSize(uploadResult.bytes) }} • 
            {{ uploadResult.width }}×{{ uploadResult.height }}
          </p>
          
          <div class="success-actions">
            <Button 
              variant="outline" 
              size="small" 
              @click="resetUpload"
            >
              Changer d'image
            </Button>
            
            <Button 
              variant="secondary" 
              size="small" 
              @click="copyUrl"
            >
              {{ copiedUrl ? 'Copié !' : 'Copier URL' }}
            </Button>
          </div>
        </div>
      </div>

      <!-- État d'erreur -->
      <div v-if="error" class="upload-error">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" class="w-8 h-8">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" />
            <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" />
          </svg>
        </div>
        
        <h3 class="error-title">
          Erreur d'upload
        </h3>
        <p class="error-message">
          {{ error }}
        </p>
        
        <Button 
          variant="danger" 
          size="small" 
          @click="resetUpload"
        >
          Réessayer
        </Button>
      </div>
    </div>

    <!-- Input file caché -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/svg+xml"
      class="hidden"
      @change="handleFileSelect"
    >

    <!-- Prévisualisation avancée (optionnelle) -->
    <div v-if="uploadResult && showPreview" class="upload-preview">
      <h4 class="preview-title">
        Prévisualisations
      </h4>
      
      <div class="preview-grid">
        <div class="preview-item">
          <label>Thumbnail (300×300)</label>
          <img :src="uploadResult.thumbnail" alt="Thumbnail">
        </div>
        
        <div class="preview-item">
          <label>Aperçu (800×600)</label>
          <img :src="uploadResult.preview" alt="Preview">
        </div>
      </div>
      
      <details class="preview-details">
        <summary>Informations techniques</summary>
        <pre>{{ JSON.stringify(uploadResult, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@ns2po/ui'
import type { CloudinaryUploadResult } from '../utils/cloudinary'

interface Props {
  preset?: 'logo' | 'product' | 'gallery' | 'avatar' | 'default'
  folder?: string
  showPreview?: boolean
  maxSize?: number // en MB
  acceptedTypes?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  preset: 'default',
  folder: 'ns2po-election',
  showPreview: false,
  maxSize: 10,
  acceptedTypes: () => ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
})

const emit = defineEmits<{
  'upload:success': [result: CloudinaryUploadResult]
  'upload:error': [error: string]
  'upload:start': []
}>()

// État local
const isDragOver = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadResult = ref<CloudinaryUploadResult | null>(null)
const error = ref<string | null>(null)
const copiedUrl = ref(false)
const fileInput = ref<HTMLInputElement>()

// Méthodes
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    handleFile(event.dataTransfer.files[0])
  }
}

const handleFile = async (file: File) => {
  // Reset état précédent
  error.value = null
  uploadResult.value = null

  // Validation
  if (!validateFile(file)) return

  try {
    isUploading.value = true
    uploadProgress.value = 0
    emit('upload:start')

    // Simulation progression (Cloudinary ne donne pas de vraie progression)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 20
      }
    }, 200)

    // Préparation FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('preset', props.preset)
    formData.append('folder', props.folder)

    // Upload
    const response = await $fetch<{
      success: boolean
      data: CloudinaryUploadResult
    }>('/api/cloudinary/upload', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success) {
      uploadResult.value = response.data
      emit('upload:success', response.data)
      
      // Auto-hide progress après succès
      setTimeout(() => {
        isUploading.value = false
      }, 500)
    } else {
      throw new Error('Upload échoué')
    }

  } catch (err: unknown) {
    isUploading.value = false
    const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload'
    error.value = errorMessage
    emit('upload:error', errorMessage)
    console.error('Upload error:', err)
  }
}

const validateFile = (file: File): boolean => {
  // Type de fichier
  if (!props.acceptedTypes.includes(file.type)) {
    error.value = `Type de fichier non supporté. Formats autorisés: ${props.acceptedTypes.join(', ')}`
    return false
  }

  // Taille
  const maxBytes = props.maxSize * 1024 * 1024
  if (file.size > maxBytes) {
    error.value = `Fichier trop volumineux. Taille maximale: ${props.maxSize}MB`
    return false
  }

  return true
}

const resetUpload = () => {
  uploadResult.value = null
  error.value = null
  isUploading.value = false
  uploadProgress.value = 0
  copiedUrl.value = false
  
  // Reset input
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const copyUrl = async () => {
  if (uploadResult.value?.secure_url) {
    try {
      await navigator.clipboard.writeText(uploadResult.value.secure_url)
      copiedUrl.value = true
      setTimeout(() => { copiedUrl.value = false }, 2000)
    } catch (err) {
      console.error('Erreur copie URL:', err)
    }
  }
}

// Utilitaires
const { formatFileSize } = useCloudinaryUtils()

function useCloudinaryUtils() {
  return {
    formatFileSize: (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
    }
  }
}
</script>

<style scoped>
.cloudinary-upload {
  @apply w-full;
}

.upload-zone {
  @apply relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-all duration-200 hover:border-gray-400 cursor-pointer;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone--dragover {
  @apply border-blue-500 bg-blue-50;
}

.upload-zone--uploading {
  @apply border-blue-500 bg-blue-50 cursor-wait;
}

.upload-zone--success {
  @apply border-green-500 bg-green-50;
}

.upload-zone--error {
  @apply border-red-500 bg-red-50;
}

.upload-content,
.upload-loading,
.upload-success,
.upload-error {
  @apply flex flex-col items-center space-y-4;
}

.upload-icon {
  @apply text-gray-400;
}

.upload-title {
  @apply text-lg font-medium text-gray-900;
}

.upload-subtitle {
  @apply text-sm text-gray-500;
}

.upload-formats {
  @apply text-xs text-gray-400;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.loading-title {
  @apply text-lg font-medium text-blue-900;
}

.loading-subtitle {
  @apply text-sm text-blue-600;
}

.success-preview {
  @apply mb-4;
}

.preview-image {
  @apply w-24 h-24 object-cover rounded-lg shadow-md;
}

.success-title {
  @apply text-lg font-medium text-green-900;
}

.success-details {
  @apply text-sm text-green-700;
}

.success-actions {
  @apply flex space-x-2;
}

.error-icon {
  @apply text-red-500;
}

.error-title {
  @apply text-lg font-medium text-red-900;
}

.error-message {
  @apply text-sm text-red-700;
}

.upload-preview {
  @apply mt-6 p-4 bg-gray-50 rounded-lg;
}

.preview-title {
  @apply text-sm font-medium text-gray-700 mb-3;
}

.preview-grid {
  @apply grid grid-cols-2 gap-4 mb-4;
}

.preview-item {
  @apply text-center;
}

.preview-item label {
  @apply block text-xs text-gray-500 mb-1;
}

.preview-item img {
  @apply w-full h-32 object-cover rounded border;
}

.preview-details {
  @apply text-xs;
}

.preview-details summary {
  @apply cursor-pointer text-gray-600 hover:text-gray-800;
}

.preview-details pre {
  @apply mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40;
}

.hidden {
  @apply sr-only;
}
</style>