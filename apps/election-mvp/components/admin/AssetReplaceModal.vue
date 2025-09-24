<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Remplacer un asset
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            :disabled="isReplacing"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4 space-y-6">
        <!-- Current Asset -->
        <div v-if="asset">
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Asset à remplacer</h4>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <img
                  v-if="isCurrentImage"
                  :src="currentThumbnailUrl"
                  :alt="asset.alt_text || `Asset ${asset.public_id}`"
                  class="w-20 h-20 object-cover rounded border"
                />
                <div
                  v-else
                  class="w-20 h-20 bg-gray-200 rounded border flex items-center justify-center"
                >
                  <Icon :name="currentTypeIcon" :class="['w-10 h-10', currentTypeColor]" />
                </div>
              </div>
              <div class="flex-grow">
                <h5 class="font-medium text-gray-900">{{ asset.public_id }}</h5>
                <p class="text-sm text-gray-500">
                  {{ asset.format.toUpperCase() }} • {{ formattedCurrentSize }}
                </p>
                <div v-if="asset.folder" class="text-xs text-gray-400 mt-1">
                  {{ asset.folder }}
                </div>
                <div v-if="asset.usage_count && asset.usage_count > 0" class="mt-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <Icon name="heroicons:link" class="w-3 h-3 mr-1" />
                    Utilisé {{ asset.usage_count }} fois
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Replacement Options -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Options de remplacement</h4>

          <!-- Option Tabs -->
          <div class="border-b border-gray-200 mb-4">
            <nav class="-mb-px flex space-x-8">
              <button
                @click="replacementType = 'upload'"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  replacementType === 'upload'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4 inline mr-2" />
                Nouveau fichier
              </button>
              <button
                @click="replacementType = 'existing'"
                :class="[
                  'py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  replacementType === 'existing'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                <Icon name="heroicons:photo" class="w-4 h-4 inline mr-2" />
                Asset existant
              </button>
            </nav>
          </div>

          <!-- Upload New File -->
          <div v-if="replacementType === 'upload'" class="space-y-4">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref="fileInput"
                type="file"
                @change="handleFileSelect"
                accept="image/*,video/*,application/pdf"
                class="hidden"
              />

              <div v-if="!selectedFile">
                <Icon name="heroicons:cloud-arrow-up" class="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p class="text-sm text-gray-600 mb-2">
                  Cliquez pour sélectionner un fichier ou glissez-déposez
                </p>
                <button
                  @click="fileInput?.click()"
                  class="text-amber-600 hover:text-amber-700 font-medium text-sm"
                >
                  Parcourir les fichiers
                </button>
                <p class="text-xs text-gray-500 mt-2">
                  PNG, JPG, WebP, PDF, MP4 jusqu'à 10MB
                </p>
              </div>

              <div v-else class="space-y-3">
                <div class="flex items-center justify-center space-x-4">
                  <div class="flex-shrink-0">
                    <img
                      v-if="filePreview && selectedFile.type.startsWith('image/')"
                      :src="filePreview"
                      :alt="selectedFile.name"
                      class="w-16 h-16 object-cover rounded border"
                    />
                    <div
                      v-else
                      class="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center"
                    >
                      <Icon name="heroicons:document" class="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-gray-900 text-sm">{{ selectedFile.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                  </div>
                </div>
                <button
                  @click="clearFileSelection"
                  class="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  <Icon name="heroicons:trash" class="w-4 h-4 inline mr-1" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <!-- Select Existing Asset -->
          <div v-else-if="replacementType === 'existing'" class="space-y-4">
            <div class="border border-gray-300 rounded-lg p-4">
              <p class="text-sm text-gray-600 mb-3">
                Sélectionnez un asset existant pour remplacer l'actuel
              </p>

              <!-- Asset Selection (simplified for MVP) -->
              <div class="space-y-2">
                <input
                  v-model="selectedAssetId"
                  type="text"
                  placeholder="ID de l'asset de remplacement"
                  class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p class="text-xs text-gray-500">
                  Pour l'instant, entrez l'ID d'un asset existant.
                  Un sélecteur visuel sera ajouté dans une prochaine version.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Replacement Options -->
        <div>
          <h4 class="text-sm font-semibold text-gray-900 mb-3">Options avancées</h4>
          <div class="space-y-3">
            <label class="flex items-start space-x-3">
              <input
                v-model="deleteOldAsset"
                type="checkbox"
                class="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span class="text-sm font-medium text-gray-900">
                  Supprimer l'ancien asset après remplacement
                </span>
                <p class="text-xs text-gray-500">
                  L'ancien asset sera supprimé de Cloudinary après le remplacement réussi.
                  Attention : cette action est irréversible.
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Impact Preview -->
        <div v-if="asset && asset.usage_count && asset.usage_count > 0"
             class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 class="text-sm font-medium text-blue-900">Impact du remplacement</h4>
              <p class="text-sm text-blue-700 mt-1">
                Ce remplacement mettra à jour <strong>{{ asset.usage_count }} référence(s)</strong> dans le système.
                Tous les endroits où cet asset est utilisé afficheront automatiquement le nouvel asset.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <div class="text-sm text-gray-500">
          <template v-if="isReplacing">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Remplacement en cours...</span>
            </div>
          </template>
          <template v-else-if="asset && asset.usage_count && asset.usage_count > 0">
            {{ asset.usage_count }} référence(s) seront mises à jour
          </template>
        </div>

        <div class="flex space-x-3">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            :disabled="isReplacing"
          >
            Annuler
          </button>

          <button
            @click="confirmReplace"
            :disabled="!canReplace || isReplacing"
            :class="[
              'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors',
              canReplace && !isReplacing
                ? 'text-white bg-amber-600 hover:bg-amber-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            ]"
          >
            <template v-if="isReplacing">
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Remplacement...</span>
              </div>
            </template>
            <span v-else>Remplacer l'asset</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Asset } from '~/composables/useAssetsQuery'
import { getAssetTypeIcon, getAssetTypeColor, formatAssetFileSize } from '~/composables/useAssetsQuery'

// Props
interface Props {
  show: boolean
  asset: Asset | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  replaced: [oldAsset: Asset, newAsset: Asset]
}>()

// State
const replacementType = ref<'upload' | 'existing'>('upload')
const selectedFile = ref<File | null>(null)
const selectedAssetId = ref('')
const deleteOldAsset = ref(false)
const isReplacing = ref(false)
const filePreview = ref<string | null>(null)

// Refs
const fileInput = ref<HTMLInputElement | null>(null)

// Computed - Current Asset
const isCurrentImage = computed(() => {
  if (!props.asset) return false
  return props.asset.resource_type === 'image' &&
    ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(props.asset.format.toLowerCase())
})

const currentThumbnailUrl = computed(() => {
  if (!props.asset || !isCurrentImage.value) return ''
  const publicId = props.asset.public_id
  return `https://res.cloudinary.com/dsrvzogof/image/upload/c_fill,w_100,h_100,q_auto,f_auto/${publicId}`
})

const currentTypeIcon = computed(() => {
  if (!props.asset) return 'heroicons:document'
  return getAssetTypeIcon(props.asset.format, props.asset.resource_type)
})

const currentTypeColor = computed(() => {
  if (!props.asset) return 'text-gray-400'
  return getAssetTypeColor(props.asset.format, props.asset.resource_type)
})

const formattedCurrentSize = computed(() => {
  if (!props.asset) return ''
  return formatAssetFileSize(props.asset.bytes)
})

// Computed - Validation
const canReplace = computed(() => {
  if (replacementType.value === 'upload') {
    return !!selectedFile.value
  } else {
    return !!selectedAssetId.value
  }
})

// Methods
const formatFileSize = (bytes: number) => {
  return formatAssetFileSize(bytes)
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    selectedFile.value = file

    // Créer une prévisualisation pour les images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        filePreview.value = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } else {
      filePreview.value = null
    }
  }
}

const clearFileSelection = () => {
  selectedFile.value = null
  filePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const resetForm = () => {
  replacementType.value = 'upload'
  selectedFile.value = null
  selectedAssetId.value = ''
  deleteOldAsset.value = false
  filePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const confirmReplace = async () => {
  if (!props.asset || !canReplace.value || isReplacing.value) return

  isReplacing.value = true

  try {
    let response

    if (replacementType.value === 'upload' && selectedFile.value) {
      // Remplacement par upload de fichier
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('deleteOldAsset', deleteOldAsset.value.toString())

      response = await $fetch<{
        success: boolean
        data: {
          oldAsset: Asset
          newAsset: Asset
        }
      }>(`/api/assets/${props.asset.id}/replace`, {
        method: 'POST',
        body: formData
      })
    } else {
      // Remplacement par asset existant
      response = await $fetch<{
        success: boolean
        data: {
          oldAsset: Asset
          newAsset: Asset
        }
      }>(`/api/assets/${props.asset.id}/replace`, {
        method: 'POST',
        body: {
          newAssetId: selectedAssetId.value,
          deleteOldAsset: deleteOldAsset.value
        }
      })
    }

    if (response.success) {
      emit('replaced', response.data.oldAsset, response.data.newAsset)
      emit('close')
      resetForm()

      console.log('✅ Asset remplacé:', props.asset.public_id, '→', response.data.newAsset.public_id)
    } else {
      throw new Error('Erreur lors du remplacement')
    }
  } catch (error: any) {
    console.error('Erreur remplacement asset:', error)
    // TODO: Afficher un message d'erreur à l'utilisateur
  } finally {
    isReplacing.value = false
  }
}

// Watchers
watch(() => props.show, (show) => {
  if (show) {
    resetForm()
  }
})
</script>

<style scoped>
/* Styles pour les animations */
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