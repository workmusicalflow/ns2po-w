<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">
            Détails de l'asset
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon name="heroicons:x-mark" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div v-if="asset" class="px-6 py-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Image Preview -->
          <div class="space-y-4">
            <div class="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              <template v-if="isImage">
                <img
                  :src="fullSizeUrl"
                  :alt="asset.alt_text || `Asset ${asset.public_id}`"
                  class="max-w-full max-h-full object-contain"
                  @error="onImageError"
                />
              </template>

              <!-- Non-image assets -->
              <template v-else>
                <div class="text-center">
                  <Icon
                    :name="typeIcon"
                    :class="['w-24 h-24 mx-auto mb-4', typeColor]"
                  />
                  <span class="text-xl font-medium text-gray-600 uppercase">
                    {{ asset.format }}
                  </span>
                </div>
              </template>
            </div>

            <!-- Download Link -->
            <div class="flex justify-center">
              <a
                :href="asset.secure_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
              >
                <Icon name="heroicons:arrow-down-tray" class="w-4 h-4" />
                <span>Télécharger l'original</span>
              </a>
            </div>
          </div>

          <!-- Asset Information -->
          <div class="space-y-6">
            <!-- Basic Info -->
            <div class="space-y-4">
              <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Informations générales
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Public ID</dt>
                  <dd class="mt-1 text-sm text-gray-900 break-all">{{ asset.public_id }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500">Format</dt>
                  <dd class="mt-1 text-sm text-gray-900 uppercase">{{ asset.format }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500">Type de ressource</dt>
                  <dd class="mt-1 text-sm text-gray-900 capitalize">{{ asset.resource_type }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500">Taille</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formattedSize }}</dd>
                </div>

                <div v-if="asset.width && asset.height">
                  <dt class="text-sm font-medium text-gray-500">Dimensions</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ asset.width }} × {{ asset.height }}px</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500">Dossier</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ asset.folder }}</dd>
                </div>
              </div>
            </div>

            <!-- Metadata -->
            <div class="space-y-4">
              <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Métadonnées
              </h4>

              <div class="space-y-3">
                <div v-if="asset.alt_text">
                  <dt class="text-sm font-medium text-gray-500">Texte alternatif</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ asset.alt_text }}</dd>
                </div>

                <div v-if="asset.caption">
                  <dt class="text-sm font-medium text-gray-500">Légende</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ asset.caption }}</dd>
                </div>

                <div v-if="asset.tags && asset.tags.length > 0">
                  <dt class="text-sm font-medium text-gray-500">Tags</dt>
                  <dd class="mt-1">
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="tag in asset.tags"
                        :key="tag"
                        class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {{ tag }}
                      </span>
                    </div>
                  </dd>
                </div>
              </div>
            </div>

            <!-- Usage Information -->
            <div v-if="asset.usage_count !== undefined" class="space-y-4">
              <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Utilisation
              </h4>

              <div class="flex items-center space-x-2">
                <Icon
                  name="heroicons:link"
                  :class="asset.usage_count > 0 ? 'text-green-600' : 'text-gray-400'"
                  class="w-4 h-4"
                />
                <span class="text-sm text-gray-900">
                  <template v-if="asset.usage_count > 0">
                    Utilisé dans <strong>{{ asset.usage_count }}</strong> élément(s)
                  </template>
                  <template v-else>
                    Non utilisé actuellement
                  </template>
                </span>
              </div>
            </div>

            <!-- Dates -->
            <div class="space-y-4">
              <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Dates
              </h4>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Créé le</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formattedCreatedDate }}</dd>
                </div>

                <div>
                  <dt class="text-sm font-medium text-gray-500">Modifié le</dt>
                  <dd class="mt-1 text-sm text-gray-900">{{ formattedUpdatedDate }}</dd>
                </div>
              </div>
            </div>

            <!-- URLs -->
            <div class="space-y-4">
              <h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                URLs
              </h4>

              <div class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-gray-500">URL sécurisée</dt>
                  <dd class="mt-1">
                    <div class="flex items-center space-x-2">
                      <input
                        :value="asset.secure_url"
                        readonly
                        class="flex-1 text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 select-all"
                      />
                      <button
                        @click="copyToClipboard(asset.secure_url)"
                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copier l'URL"
                      >
                        <Icon name="heroicons:clipboard" class="w-4 h-4" />
                      </button>
                    </div>
                  </dd>
                </div>

                <div v-if="asset.url">
                  <dt class="text-sm font-medium text-gray-500">URL publique</dt>
                  <dd class="mt-1">
                    <div class="flex items-center space-x-2">
                      <input
                        :value="asset.url"
                        readonly
                        class="flex-1 text-xs bg-gray-50 border border-gray-300 rounded px-2 py-1 text-gray-700 select-all"
                      />
                      <button
                        @click="copyToClipboard(asset.url!)"
                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copier l'URL"
                      >
                        <Icon name="heroicons:clipboard" class="w-4 h-4" />
                      </button>
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Asset } from '~/composables/useAssetsQuery'
import { formatAssetFileSize, getAssetTypeIcon, getAssetTypeColor } from '~/composables/useAssetsQuery'

// Props
interface Props {
  show: boolean
  asset: Asset | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Computed
const isImage = computed(() => {
  if (!props.asset) return false
  return props.asset.resource_type === 'image' &&
    ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(props.asset.format.toLowerCase())
})

const fullSizeUrl = computed(() => {
  if (!props.asset || !isImage.value) return ''
  const publicId = props.asset.public_id
  return `https://res.cloudinary.com/dsrvzogof/image/upload/q_auto,f_auto/${publicId}`
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

const formattedCreatedDate = computed(() => {
  if (!props.asset) return ''
  return new Date(props.asset.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formattedUpdatedDate = computed(() => {
  if (!props.asset) return ''
  return new Date(props.asset.updated_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Methods
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = props.asset!.secure_url
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch (err) {
    console.error('Erreur copie clipboard:', err)
  }
}
</script>