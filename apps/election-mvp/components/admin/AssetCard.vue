<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
    <!-- Image Preview -->
    <div class="aspect-square bg-gray-50 relative group">
      <template v-if="isImage">
        <img
          :src="thumbnailUrl"
          :alt="asset.alt_text || `Asset ${asset.public_id}`"
          class="w-full h-full object-cover"
          @error="onImageError"
        />
      </template>

      <!-- Non-image assets -->
      <template v-else>
        <div class="w-full h-full flex items-center justify-center">
          <div class="text-center">
            <Icon
              :name="typeIcon"
              :class="['w-12 h-12 mx-auto mb-2', typeColor]"
            />
            <span class="text-sm font-medium text-gray-600 uppercase">
              {{ asset.format }}
            </span>
          </div>
        </div>
      </template>

      <!-- Overlay with actions -->
      <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
          <!-- View Button -->
          <button
            @click="$emit('view', asset)"
            class="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
            title="Voir les détails"
          >
            <Icon name="heroicons:eye" class="w-4 h-4 text-gray-700" />
          </button>

          <!-- Edit Button -->
          <button
            @click="$emit('edit', asset)"
            class="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
            title="Modifier"
          >
            <Icon name="heroicons:pencil" class="w-4 h-4 text-gray-700" />
          </button>

          <!-- Replace Button -->
          <button
            @click="$emit('replace', asset)"
            class="bg-amber-500 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
            title="Remplacer"
          >
            <Icon name="heroicons:arrow-path" class="w-4 h-4 text-white" />
          </button>

          <!-- Delete Button -->
          <button
            @click="$emit('delete', asset)"
            class="bg-red-500 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
            title="Supprimer"
          >
            <Icon name="heroicons:trash" class="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <!-- File size badge -->
      <div class="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        {{ formattedSize }}
      </div>

      <!-- Resource type badge -->
      <div class="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded uppercase">
        {{ asset.resource_type }}
      </div>

      <!-- Usage badge -->
      <div v-if="asset.usage_count && asset.usage_count > 0"
           class="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1"
           :title="`Utilisé dans ${asset.usage_count} élément(s)`">
        <Icon name="heroicons:link" class="w-3 h-3" />
        <span>{{ asset.usage_count }}</span>
      </div>
    </div>

    <!-- Asset Info -->
    <div class="p-4">
      <!-- Public ID -->
      <div class="mb-2">
        <h3 class="font-medium text-gray-900 text-sm truncate" :title="asset.public_id">
          {{ asset.public_id }}
        </h3>
        <p class="text-xs text-gray-500">
          {{ asset.format.toUpperCase() }}
          <template v-if="asset.width && asset.height">
            • {{ asset.width }}×{{ asset.height }}
          </template>
        </p>
      </div>

      <!-- Alt text -->
      <div v-if="asset.alt_text" class="mb-2">
        <p class="text-xs text-gray-600 line-clamp-2" :title="asset.alt_text">
          {{ asset.alt_text }}
        </p>
      </div>

      <!-- Tags -->
      <div v-if="asset.tags && asset.tags.length > 0" class="mb-3">
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in asset.tags.slice(0, 3)"
            :key="tag"
            class="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
          >
            {{ tag }}
          </span>
          <span
            v-if="asset.tags.length > 3"
            class="inline-block bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded"
          >
            +{{ asset.tags.length - 3 }}
          </span>
        </div>
      </div>

      <!-- Folder -->
      <div class="mb-3">
        <div class="flex items-center text-xs text-gray-500">
          <Icon name="heroicons:folder" class="w-3 h-3 mr-1" />
          <span class="truncate">{{ asset.folder }}</span>
        </div>
      </div>

      <!-- Date -->
      <div class="text-xs text-gray-400">
        <div class="flex justify-between items-center">
          <span>Créé</span>
          <span>{{ formattedDate }}</span>
        </div>
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
  asset: Asset
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  view: [asset: Asset]
  edit: [asset: Asset]
  replace: [asset: Asset]
  delete: [asset: Asset]
}>()

// Computed
const isImage = computed(() => {
  return props.asset.resource_type === 'image' &&
    ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(props.asset.format.toLowerCase())
})

const thumbnailUrl = computed(() => {
  if (!isImage.value) return ''

  // Utiliser l'URL sécurisée de Cloudinary avec transformation pour thumbnail
  const publicId = props.asset.public_id
  return `https://res.cloudinary.com/dsrvzogof/image/upload/c_fill,w_300,h_300,q_auto,f_auto/${publicId}`
})

const typeIcon = computed(() => getAssetTypeIcon(props.asset.format, props.asset.resource_type))
const typeColor = computed(() => getAssetTypeColor(props.asset.format, props.asset.resource_type))

const formattedSize = computed(() => formatAssetFileSize(props.asset.bytes))

const formattedDate = computed(() => {
  return new Date(props.asset.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})

// Methods
const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // Fallback vers l'URL originale si le thumbnail échoue
  img.src = props.asset.secure_url
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>