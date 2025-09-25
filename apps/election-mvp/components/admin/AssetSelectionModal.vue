<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-screen overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Sélectionner des images
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            :disabled="isUploading"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="activeTab = 'upload'"
              :class="[
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'upload'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4 inline mr-2" />
              Nouveau fichier
            </button>
            <button
              @click="activeTab = 'select'"
              :class="[
                'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'select'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <Icon name="heroicons:photo" class="w-4 h-4 inline mr-2" />
              Assets existants
            </button>
          </nav>
        </div>

        <!-- Upload Tab -->
        <div v-if="activeTab === 'upload'" class="space-y-6">
          <!-- Error Messages -->
          <div v-if="errorMessages.length > 0" class="bg-red-50 border border-red-200 rounded-md p-3">
            <div class="flex">
              <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
              <div class="flex-1">
                <h3 class="text-sm font-medium text-red-800">Erreurs détectées :</h3>
                <ul class="mt-2 text-sm text-red-700 list-disc list-inside">
                  <li v-for="error in errorMessages" :key="error">{{ error }}</li>
                </ul>
                <button
                  @click="errorMessages = []"
                  class="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Masquer les erreurs
                </button>
              </div>
            </div>
          </div>

          <!-- Upload Area -->
          <div
            class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            :class="{
              'border-amber-500 bg-amber-50': isDragOver,
              'border-gray-300': !isDragOver,
              'border-red-300 bg-red-50': errorMessages.length > 0
            }"
            @dragover.prevent="handleDragOver"
            @dragenter.prevent="handleDragEnter"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
          >
            <input
              id="file-upload-input"
              ref="fileInput"
              type="file"
              @change="handleFileSelect"
              accept="image/*"
              multiple
              class="hidden"
            />

            <div v-if="uploadedFiles.length === 0">
              <Icon
                :name="isUploading ? 'heroicons:cloud-arrow-up' : 'heroicons:cloud-arrow-up'"
                :class="[
                  'w-12 h-12 mx-auto mb-4 transition-colors',
                  isUploading ? 'text-amber-500 animate-bounce' : isDragOver ? 'text-amber-500' : 'text-gray-400'
                ]"
              />
              <p class="text-lg text-gray-600 mb-2">
                {{
                  isUploading
                    ? 'Upload en cours...'
                    : isDragOver
                      ? 'Relâchez pour uploader'
                      : 'Glissez-déposez vos images ici ou cliquez pour parcourir'
                }}
              </p>
              <!-- Solution robuste: Label pour déclencher l'input file -->
              <template v-if="!isUploading">
                <label
                  for="file-upload-input"
                  :class="[
                    'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors cursor-pointer',
                    'text-white bg-amber-600 hover:bg-amber-700'
                  ]"
                >
                  <Icon name="heroicons:folder-plus" class="w-4 h-4 mr-2" />
                  Parcourir les fichiers
                </label>
              </template>
              <template v-else>
                <button
                  disabled
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-200 cursor-not-allowed"
                >
                  <div class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Upload...
                </button>
              </template>
              <p class="text-sm text-gray-500 mt-2">
                PNG, JPG, WebP jusqu'à 10MB par fichier
              </p>
            </div>

            <!-- Upload Preview -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  v-for="(file, index) in uploadedFiles"
                  :key="index"
                  class="relative group"
                >
                  <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      v-if="file.preview"
                      :src="file.preview"
                      :alt="file.name"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <Icon name="heroicons:document" class="w-8 h-8 text-gray-400" />
                    </div>
                  </div>

                  <!-- Loading Overlay -->
                  <div
                    v-if="file.uploading"
                    class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
                  >
                    <div class="text-white text-center">
                      <div class="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span class="text-sm">Upload...</span>
                    </div>
                  </div>

                  <!-- Remove Button -->
                  <button
                    v-if="!file.uploading"
                    @click="removeUploadedFile(index)"
                    class="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="heroicons:x-mark" class="w-4 h-4" />
                  </button>

                  <!-- Success Indicator -->
                  <div
                    v-if="file.uploaded && file.asset"
                    class="absolute top-2 left-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center"
                  >
                    <Icon name="heroicons:check" class="w-4 h-4" />
                  </div>

                  <!-- Error Indicator -->
                  <div
                    v-if="file.error"
                    class="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    :title="file.error"
                  >
                    <Icon name="heroicons:exclamation-triangle" class="w-4 h-4" />
                  </div>

                  <!-- File Name -->
                  <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p class="text-xs truncate">{{ file.name }}</p>
                    <p v-if="file.error" class="text-xs text-red-300 truncate">{{ file.error }}</p>
                  </div>
                </div>
              </div>

              <label
                for="file-upload-input"
                :class="[
                  'inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors cursor-pointer',
                  isUploading
                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                    : 'text-gray-700 bg-white hover:bg-gray-50'
                ]"
              >
                <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
                Ajouter plus d'images
              </label>
            </div>
          </div>
        </div>

        <!-- Select Tab -->
        <div v-if="activeTab === 'select'" class="space-y-6">
          <!-- Search and Filters -->
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Rechercher des assets..."
                  class="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <!-- Format Filter -->
            <div class="w-48">
              <select
                v-model="formatFilter"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Tous les formats</option>
                <option value="jpg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="gif">GIF</option>
              </select>
            </div>
          </div>

          <!-- Assets Grid -->
          <div v-if="assetsQuery.isLoading.value" class="text-center py-12">
            <div class="inline-flex items-center space-x-2">
              <div class="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-gray-600">Chargement des assets...</span>
            </div>
          </div>

          <div v-else-if="assetsQuery.isError.value" class="text-center py-12">
            <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p class="text-red-600">Erreur lors du chargement des assets</p>
          </div>

          <div v-else-if="filteredAssets.length === 0" class="text-center py-12">
            <Icon name="heroicons:photo" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-600">Aucun asset trouvé</p>
            <p class="text-sm text-gray-500 mt-1">
              {{ searchQuery ? 'Essayez d\'ajuster votre recherche' : 'Commencez par uploader des images' }}
            </p>
          </div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div
              v-for="asset in filteredAssets"
              :key="asset.id"
              @click="toggleAssetSelection(asset)"
              :class="[
                'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all',
                selectedAssets.find(a => a.id === asset.id)
                  ? 'border-amber-500 shadow-lg transform scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              ]"
            >
              <div class="aspect-square bg-gray-100">
                <img
                  v-if="isImageAsset(asset)"
                  :src="getAssetThumbnail(asset)"
                  :alt="asset.alt_text || asset.public_id"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <Icon :name="getAssetTypeIcon(asset.format, asset.resource_type)" :class="['w-8 h-8', getAssetTypeColor(asset.format, asset.resource_type)]" />
                </div>
              </div>

              <!-- Selection Indicator -->
              <div
                v-if="selectedAssets.find(a => a.id === asset.id)"
                class="absolute top-2 right-2 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center"
              >
                <Icon name="heroicons:check" class="w-4 h-4" />
              </div>

              <!-- Asset Info -->
              <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-xs truncate">{{ asset.public_id }}</p>
                <p class="text-xs text-gray-300">{{ asset.format.toUpperCase() }}</p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="assetsQuery.data.value && assetsQuery.data.value.totalPages > 1" class="flex justify-center space-x-2">
            <button
              @click="goToPage(pagination.page - 1)"
              :disabled="!assetsQuery.data.value.hasPrev"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <span class="px-3 py-2 text-sm text-gray-700">
              Page {{ pagination.page }} sur {{ assetsQuery.data.value.totalPages }}
            </span>
            <button
              @click="goToPage(pagination.page + 1)"
              :disabled="!assetsQuery.data.value.hasNext"
              class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <!-- Selection Summary -->
        <div class="text-sm text-gray-600">
          <template v-if="activeTab === 'upload'">
            {{ uploadedAssets.length }} image(s) uploadée(s)
          </template>
          <template v-else>
            {{ selectedAssets.length }} asset(s) sélectionné(s)
          </template>
        </div>

        <!-- Actions -->
        <div class="flex space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            :disabled="isUploading"
          >
            Annuler
          </button>

          <button
            @click="confirmSelection"
            :disabled="!hasSelection || isUploading"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors',
              hasSelection && !isUploading
                ? 'text-white bg-amber-600 hover:bg-amber-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            ]"
          >
            <template v-if="isUploading">
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Upload...</span>
              </div>
            </template>
            <span v-else>Confirmer la sélection</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick } from 'vue'
import type { Asset } from '~/composables/useAssetsQuery'
import { useAssetsQuery, useUploadAssetMutation, getAssetTypeIcon, getAssetTypeColor } from '~/composables/useAssetsQuery'

// Props
interface Props {
  show: boolean
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true
})

// Emits
const emit = defineEmits<{
  close: []
  selected: [assets: Asset[]]
}>()

// State
const activeTab = ref<'upload' | 'select'>('select')
const searchQuery = ref('')
const formatFilter = ref('')
const selectedAssets = ref<Asset[]>([])
const isDragOver = ref(false)
const errorMessages = ref<string[]>([])
const uploadedFiles = ref<Array<{
  file: File
  name: string
  preview: string | null
  uploading: boolean
  uploaded: boolean
  asset: Asset | null
  error?: string
}>>([])

// Refs
const fileInput = ref<HTMLInputElement | null>(null)

// Méthode alternative pour déclencher l'input file si le label ne fonctionne pas
const triggerFileInput = () => {
  console.log('🔧 triggerFileInput appelé')
  const input = fileInput.value || document.getElementById('file-upload-input') as HTMLInputElement
  if (input) {
    console.log('✅ Input trouvé, déclenchement du click')
    input.click()
  } else {
    console.error('❌ Input file non trouvé')
  }
}

// Pagination
const pagination = ref({
  page: 1,
  limit: 24
})

// Computed filters
const filters = computed(() => ({
  search: searchQuery.value,
  format: formatFilter.value
}))

// Assets Query
const assetsQuery = useAssetsQuery(filters, pagination)
const uploadMutation = useUploadAssetMutation()

// Computed
const filteredAssets = computed(() => {
  if (!assetsQuery.data.value) return []
  return assetsQuery.data.value.assets.filter(asset =>
    asset.resource_type === 'image' // Only show images for product selection
  )
})

const uploadedAssets = computed(() =>
  uploadedFiles.value
    .filter(file => file.uploaded && file.asset)
    .map(file => file.asset!)
)

const hasSelection = computed(() =>
  activeTab.value === 'upload' ? uploadedAssets.value.length > 0 : selectedAssets.value.length > 0
)

const isUploading = computed(() =>
  uploadedFiles.value.some(file => file.uploading)
)

// Methods
const isImageAsset = (asset: Asset): boolean => {
  return asset.resource_type === 'image' &&
    ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(asset.format.toLowerCase())
}

const getAssetThumbnail = (asset: Asset): string => {
  const publicId = asset.public_id
  return `https://res.cloudinary.com/dsrvzogof/image/upload/c_fill,w_200,h_200,q_auto,f_auto/${publicId}`
}

const toggleAssetSelection = (asset: Asset) => {
  const index = selectedAssets.value.findIndex(a => a.id === asset.id)

  if (index > -1) {
    selectedAssets.value.splice(index, 1)
  } else {
    if (props.multiple) {
      selectedAssets.value.push(asset)
    } else {
      selectedAssets.value = [asset]
    }
  }
}

// Drag & Drop Handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  // Only set to false if we're actually leaving the drop zone
  if (!event.currentTarget?.contains(event.relatedTarget as Node)) {
    isDragOver.value = false
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false

  const files = event.dataTransfer?.files
  if (!files) return

  // Process the dropped files using the same logic as file selection
  await processFiles(Array.from(files))
}

// Shared file processing logic
const processFiles = async (files: File[]) => {
  console.log('🔍 processFiles appelé avec', files.length, 'fichiers')

  for (const file of files) {
    console.log('📁 Traitement du fichier:', file.name, 'Type:', file.type, 'Taille:', file.size)

    // Validate file
    if (!file.type.startsWith('image/')) {
      console.warn('Fichier ignoré (pas une image):', file.name)
      continue
    }

    if (file.size > 10 * 1024 * 1024) {
      console.warn('Fichier trop volumineux (>10MB):', file.name)
      continue
    }

    console.log('✅ Fichier validé:', file.name)

    // Create preview
    let preview: string | null = null
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
      console.log('🖼️ Preview créé pour:', file.name)
    }

    // Add to uploaded files - Use reactive reference for Vue 3 reactivity
    const uploadFile = reactive({
      file,
      name: file.name,
      preview,
      uploading: false,
      uploaded: false,
      asset: null as Asset | null,
      error: undefined as string | undefined
    })

    uploadedFiles.value.push(uploadFile)
    console.log('📋 Fichier ajouté à la liste, total:', uploadedFiles.value.length)

    // Start upload - Force reactivity update
    uploadFile.uploading = true
    await nextTick()
    console.log('🚀 Début de l\'upload pour:', file.name)

    try {
      console.log('📤 Appel de uploadMutation.mutateAsync...')
      const uploadedAsset = await uploadMutation.mutateAsync({
        file,
        metadata: {
          folder: 'products'
        }
      })

      // Force Vue reactivity update
      uploadFile.uploaded = true
      uploadFile.asset = uploadedAsset
      uploadFile.uploading = false

      await nextTick() // Ensure DOM updates
      console.log('✅ Asset uploadé avec succès:', uploadedAsset.public_id)
      console.log('📊 État final uploadFile:', { uploaded: uploadFile.uploaded, hasAsset: !!uploadFile.asset })
      console.log('📊 Total uploadedAssets:', uploadedAssets.value.length)
    } catch (error) {
      console.error('❌ Erreur complète lors de l\'upload:', error)
      console.error('❌ Type d\'erreur:', typeof error)
      console.error('❌ Message:', error?.message)
      console.error('❌ Stack:', error?.stack)

      uploadFile.error = error?.message || 'Erreur inconnue'
      uploadFile.uploading = false

      // Remove failed upload
      const index = uploadedFiles.value.indexOf(uploadFile)
      if (index > -1) {
        uploadedFiles.value.splice(index, 1)
        console.log('🗑️ Fichier retiré de la liste après échec')
      }
    }
  }

  await nextTick() // Final reactivity update
  console.log('🎯 processFiles terminé')
  console.log('📊 Total final uploadedAssets:', uploadedAssets.value.length)
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files) return

  await processFiles(Array.from(files))

  // Clear input
  if (target) {
    target.value = ''
  }
}

const removeUploadedFile = (index: number) => {
  const file = uploadedFiles.value[index]

  // Clean up preview URL
  if (file.preview) {
    URL.revokeObjectURL(file.preview)
  }

  uploadedFiles.value.splice(index, 1)
}

const goToPage = (page: number) => {
  pagination.value.page = page
}

const confirmSelection = () => {
  let assetsToEmit: Asset[] = []

  if (activeTab.value === 'upload') {
    assetsToEmit = uploadedAssets.value
  } else {
    assetsToEmit = [...selectedAssets.value]
  }

  emit('selected', assetsToEmit)
  emit('close')

  // Reset state
  resetModal()
}

const resetModal = () => {
  activeTab.value = 'select'
  searchQuery.value = ''
  formatFilter.value = ''
  selectedAssets.value = []

  // Clean up uploaded files
  uploadedFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
  uploadedFiles.value = []

  pagination.value.page = 1
}

// Watchers
watch(() => props.show, (show) => {
  if (show) {
    resetModal()
  }
})

// Debounced search
watch([searchQuery, formatFilter], () => {
  pagination.value.page = 1
})
</script>

<style scoped>
/* Custom animations */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>