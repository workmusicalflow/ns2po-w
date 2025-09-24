<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-screen overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Confirmer la suppression
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            :disabled="isDeleting"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="px-6 py-4">
        <!-- Asset Preview -->
        <div v-if="asset" class="mb-4">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <img
                v-if="isImage"
                :src="thumbnailUrl"
                :alt="asset.alt_text || `Asset ${asset.public_id}`"
                class="w-16 h-16 object-cover rounded border"
              />
              <div
                v-else
                class="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center"
              >
                <Icon :name="typeIcon" :class="['w-8 h-8', typeColor]" />
              </div>
            </div>
            <div class="flex-grow min-w-0">
              <h4 class="text-sm font-medium text-gray-900 truncate">
                {{ asset.public_id }}
              </h4>
              <p class="text-xs text-gray-500">
                {{ asset.format.toUpperCase() }} • {{ formattedSize }}
              </p>
              <div v-if="asset.folder" class="text-xs text-gray-400 mt-1">
                {{ asset.folder }}
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Usage Info -->
        <div v-if="isLoadingUsage" class="mb-4 p-4 bg-gray-50 rounded border text-center">
          <div class="inline-flex items-center space-x-2">
            <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm text-gray-600">Vérification des usages...</span>
          </div>
        </div>

        <!-- Usage Error -->
        <div v-else-if="usageError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <div class="flex items-center space-x-2">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-600" />
            <span class="text-sm text-red-700">
              Erreur lors de la vérification des usages
            </span>
          </div>
        </div>

        <!-- Usage Info -->
        <div v-else-if="usageDetails" class="mb-4">
          <!-- Asset not used -->
          <div v-if="usageDetails.canDelete" class="p-4 bg-green-50 border border-green-200 rounded">
            <div class="flex items-center space-x-2">
              <Icon name="heroicons:check-circle" class="w-5 h-5 text-green-600" />
              <span class="text-sm text-green-700 font-medium">
                Cet asset peut être supprimé en toute sécurité
              </span>
            </div>
            <p class="text-xs text-green-600 mt-1">
              Aucune référence trouvée dans le système
            </p>
          </div>

          <!-- Asset is used -->
          <div v-else class="p-4 bg-red-50 border border-red-200 rounded">
            <div class="flex items-start space-x-2">
              <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-red-600 mt-0.5" />
              <div class="flex-grow">
                <p class="text-sm text-red-700 font-medium mb-2">
                  Attention ! Cet asset est actuellement utilisé
                </p>

                <!-- Usage Details -->
                <div class="space-y-2">
                  <div v-for="warning in usageDetails.deleteWarnings" :key="warning"
                       class="text-xs text-red-600">
                    • {{ warning }}
                  </div>
                </div>

                <!-- Detailed Usage List -->
                <div v-if="usageDetails.usages.length > 0" class="mt-3">
                  <p class="text-xs text-red-600 font-medium mb-1">Utilisé dans :</p>
                  <div class="space-y-1">
                    <div v-for="usage in usageDetails.usages.slice(0, 3)" :key="usage.id"
                         class="text-xs text-red-600 pl-2">
                      → {{ usage.entity_name }} ({{ usage.field_name }})
                    </div>
                    <div v-if="usageDetails.usages.length > 3"
                         class="text-xs text-red-500 pl-2">
                      ... et {{ usageDetails.usages.length - 3 }} autre(s)
                    </div>
                  </div>
                </div>

                <!-- Force Delete Option -->
                <div class="mt-3 pt-2 border-t border-red-200">
                  <label class="flex items-start space-x-2 cursor-pointer">
                    <input
                      v-model="forceDelete"
                      type="checkbox"
                      class="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
                      :disabled="isDeleting"
                    />
                    <span class="text-xs text-red-700">
                      Je comprends les risques et souhaite supprimer cet asset de toute façon.
                      <strong>Cette action supprimera également toutes les références</strong> et peut
                      causer des images manquantes sur le site.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confirmation Message -->
        <div class="mb-4">
          <p class="text-sm text-gray-700">
            <template v-if="usageDetails?.canDelete">
              Êtes-vous sûr de vouloir supprimer cet asset ? Cette action est irréversible.
            </template>
            <template v-else-if="forceDelete">
              <strong class="text-red-700">Suppression forcée :</strong>
              L'asset sera supprimé de Cloudinary et de la base de données.
              Toutes les références seront également supprimées.
            </template>
            <template v-else>
              La suppression est bloquée car l'asset est utilisé.
              Cochez la case ci-dessus pour forcer la suppression.
            </template>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          :disabled="isDeleting"
        >
          Annuler
        </button>

        <button
          @click="confirmDelete"
          :disabled="isDeleting || isLoadingUsage || (!usageDetails?.canDelete && !forceDelete)"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors',
            usageDetails?.canDelete || forceDelete
              ? 'text-white bg-red-600 hover:bg-red-700'
              : 'text-gray-400 bg-gray-200 cursor-not-allowed'
          ]"
        >
          <div v-if="isDeleting" class="flex items-center space-x-2">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Suppression...</span>
          </div>
          <span v-else-if="forceDelete">Supprimer quand même</span>
          <span v-else>Supprimer</span>
        </button>
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
  deleted: [asset: Asset]
}>()

// State
const isLoadingUsage = ref(false)
const usageError = ref(false)
const usageDetails = ref<any>(null)
const forceDelete = ref(false)
const isDeleting = ref(false)

// Computed
const isImage = computed(() => {
  if (!props.asset) return false
  return props.asset.resource_type === 'image' &&
    ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(props.asset.format.toLowerCase())
})

const thumbnailUrl = computed(() => {
  if (!props.asset || !isImage.value) return ''
  const publicId = props.asset.public_id
  return `https://res.cloudinary.com/dsrvzogof/image/upload/c_fill,w_100,h_100,q_auto,f_auto/${publicId}`
})

const typeIcon = computed(() => {
  if (!props.asset) return 'heroicons:document'
  return getAssetTypeIcon(props.asset.format, props.asset.resource_type)
})

const typeColor = computed(() => {
  if (!props.asset) return 'text-gray-400'
  return getAssetTypeColor(props.asset.format, props.asset.resource_type)
})

const formattedSize = computed(() => {
  if (!props.asset) return ''
  return formatAssetFileSize(props.asset.bytes)
})

// Methods
const loadUsageDetails = async () => {
  if (!props.asset) return

  isLoadingUsage.value = true
  usageError.value = false
  usageDetails.value = null

  try {
    const response = await $fetch<{
      success: boolean
      data: any
    }>(`/api/assets/${props.asset.id}/usage`)

    if (response.success) {
      usageDetails.value = response.data
    } else {
      throw new Error('Erreur lors de la récupération des usages')
    }
  } catch (error) {
    console.error('Erreur chargement usages:', error)
    usageError.value = true
  } finally {
    isLoadingUsage.value = false
  }
}

const confirmDelete = async () => {
  if (!props.asset || isDeleting.value) return

  isDeleting.value = true

  try {
    const params = new URLSearchParams()
    if (forceDelete.value) {
      params.set('force', 'true')
    }

    const response = await $fetch<{
      success: boolean
      data: any
    }>(`/api/assets/${props.asset.id}?${params.toString()}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // Émettre l'événement de suppression réussie
      emit('deleted', props.asset)
      emit('close')

      // Reset state
      forceDelete.value = false
      usageDetails.value = null

      console.log('✅ Asset supprimé:', props.asset.public_id)
    } else {
      throw new Error('Erreur lors de la suppression')
    }
  } catch (error: any) {
    console.error('Erreur suppression asset:', error)

    // Gestion spéciale des erreurs d'usage
    if (error.statusCode === 409 && error.data?.reason === 'asset_in_use') {
      // Recharger les détails d'usage pour avoir les infos à jour
      await loadUsageDetails()
    } else {
      // Autres erreurs
      usageError.value = true
    }
  } finally {
    isDeleting.value = false
  }
}

// Watchers
watch(
  () => props.show && props.asset,
  (shouldLoad) => {
    if (shouldLoad) {
      forceDelete.value = false
      loadUsageDetails()
    }
  },
  { immediate: true }
)

// Reset force delete when usage details change
watch(usageDetails, () => {
  forceDelete.value = false
})
</script>

<style scoped>
/* Styles pour les animations et les transitions */
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