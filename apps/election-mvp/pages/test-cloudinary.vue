<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">
        Test Cloudinary Upload
      </h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Upload Zone -->
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">
            Upload d'image
          </h2>
          
          <div class="space-y-4">
            <!-- Sélecteur de preset -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Type d'image
              </label>
              <select 
                v-model="selectedPreset" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="default">
                  Standard
                </option>
                <option value="logo">
                  Logo
                </option>
                <option value="product">
                  Produit
                </option>
                <option value="gallery">
                  Galerie
                </option>
                <option value="avatar">
                  Avatar
                </option>
              </select>
            </div>

            <!-- Composant Upload -->
            <CloudinaryUpload
              :preset="selectedPreset"
              :show-preview="true"
              @upload:success="handleUploadSuccess"
              @upload:error="handleUploadError"
              @upload:start="handleUploadStart"
            />
          </div>
        </div>

        <!-- Historique des uploads -->
        <div class="bg-white p-6 rounded-lg shadow-md">
          <h2 class="text-xl font-semibold mb-4">
            Uploads récents
          </h2>
          
          <div v-if="uploadHistory.length === 0" class="text-center py-8 text-gray-500">
            Aucun upload pour le moment
          </div>

          <div v-else class="space-y-4">
            <div 
              v-for="upload in uploadHistory" 
              :key="upload.public_id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-start space-x-4">
                <!-- Thumbnail -->
                <img 
                  :src="upload.thumbnail" 
                  :alt="upload.public_id"
                  class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                >
                
                <!-- Infos -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ upload.public_id }}
                  </h3>
                  <p class="text-xs text-gray-500">
                    {{ formatFileSize(upload.bytes) }} • 
                    {{ upload.width }}×{{ upload.height }} • 
                    {{ upload.format.toUpperCase() }}
                  </p>
                  
                  <!-- URLs transformées -->
                  <div class="mt-2 space-y-1">
                    <div class="flex items-center space-x-2">
                      <span class="text-xs font-medium text-gray-600">Original:</span>
                      <button 
                        class="text-xs text-blue-600 hover:text-blue-800 truncate max-w-xs"
                        @click="copyToClipboard(upload.secure_url)"
                      >
                        {{ upload.secure_url }}
                      </button>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                      <span class="text-xs font-medium text-gray-600">Thumbnail:</span>
                      <button 
                        class="text-xs text-blue-600 hover:text-blue-800 truncate max-w-xs"
                        @click="copyToClipboard(upload.thumbnail || '')"
                      >
                        URL thumbnail
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex-shrink-0">
                  <button 
                    class="text-red-600 hover:text-red-800 text-sm"
                    @click="removeFromHistory(upload.public_id)"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Démonstration transformations -->
      <div v-if="lastUpload" class="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-xl font-semibold mb-4">
          Transformations disponibles
        </h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            v-for="(transform, name) in transformationExamples" 
            :key="name"
            class="text-center"
          >
            <div class="mb-2">
              <img 
                :src="transform?.url || ''" 
                :alt="`Transform ${name}`"
                class="w-full h-32 object-cover rounded-lg border"
              >
            </div>
            <h3 class="text-sm font-medium text-gray-700">
              {{ transform?.label || '' }}
            </h3>
            <p class="text-xs text-gray-500">
              {{ transform?.description || '' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Toast notifications -->
      <div 
        v-if="notification.show" 
        :class="[
          'fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300',
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        ]"
      >
        {{ notification.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { CloudinaryUploadResult } from '@ns2po/types'
import { useCloudinary } from '../composables/useCloudinary'

// Utilisation du head pour le titre de la page
useHead({
  title: 'Test Cloudinary Upload - NS2PO Election MVP'
})

// État local
const selectedPreset = ref<'logo' | 'product' | 'gallery' | 'avatar' | 'default'>('default')
const uploadHistory = ref<Array<CloudinaryUploadResult & { thumbnail?: string; preview?: string }>>([])
const lastUpload = ref<CloudinaryUploadResult | null>(null)
const notification = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error'
})

// Composable Cloudinary
const { getTransformedUrls } = useCloudinary()

// Transformations d'exemple
const transformationExamples = computed(() => {
  if (!lastUpload.value) return {}

  const urls = getTransformedUrls(lastUpload.value.public_id)
  
  return {
    thumbnail: {
      url: urls.thumbnail,
      label: 'Thumbnail',
      description: '300×300 fill'
    },
    product: {
      url: urls.productMain,
      label: 'Produit',
      description: '800×600 fit'
    },
    gallery: {
      url: urls.gallery,
      label: 'Galerie',
      description: '600×400 fill'
    },
    avatar: {
      url: urls.avatar,
      label: 'Avatar',
      description: '150×150 face'
    }
  }
})

// Gestionnaires d'événements
const handleUploadSuccess = (result: CloudinaryUploadResult & { thumbnail?: string; preview?: string }) => {
  uploadHistory.value.unshift(result)
  lastUpload.value = result
  
  showNotification('Upload réussi !', 'success')
}

const handleUploadError = (error: string) => {
  showNotification(`Erreur: ${error}`, 'error')
}

const handleUploadStart = () => {
  console.log('Upload started...')
}

const removeFromHistory = (publicId: string) => {
  uploadHistory.value = uploadHistory.value.filter((upload: CloudinaryUploadResult & { thumbnail?: string; preview?: string }) => upload.public_id !== publicId)
  
  if (lastUpload.value?.public_id === publicId) {
    lastUpload.value = uploadHistory.value[0] || null
  }
}

const copyToClipboard = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    showNotification('URL copiée !', 'success')
  } catch (error) {
    console.error('Erreur copie:', error)
    showNotification('Erreur lors de la copie', 'error')
  }
}

const showNotification = (message: string, type: 'success' | 'error') => {
  notification.value = { show: true, message, type }
  
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

// Utilitaires
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// Persist upload history in localStorage
onMounted(() => {
  const saved = localStorage.getItem('cloudinary-upload-history')
  if (saved) {
    try {
      uploadHistory.value = JSON.parse(saved)
      lastUpload.value = uploadHistory.value[0] || null
    } catch (error) {
      console.error('Erreur parse localStorage:', error)
    }
  }
})

watch(uploadHistory, (newHistory) => {
  localStorage.setItem('cloudinary-upload-history', JSON.stringify(newHistory))
}, { deep: true })
</script>