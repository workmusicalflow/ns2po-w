<script setup lang="ts">
/**
 * ProductMediaManager - Gestionnaire visuel de médias produit
 *
 * Features:
 * - Drag & drop upload
 * - Preview instantané avant upload
 * - Barre de progression
 * - Définir image principale (étoile)
 * - Supprimer avec confirmation
 * - Réordonner (futur: drag to reorder)
 *
 * Usage:
 * <ProductMediaManager
 *   v-model="mediaItems"
 *   :max-items="10"
 *   @update:model-value="handleChange"
 * />
 */

import { ref, computed, watch } from 'vue'
import type { ProductMedia } from '~/types/media'
import { useProductMedia } from '~/composables/useProductMedia'

// === Props & Emits ===

interface Props {
  /** Items médias (v-model) */
  modelValue?: ProductMedia[]
  /** Nombre max d'images */
  maxItems?: number
  /** Dossier Cloudinary */
  folder?: string
  /** Désactiver le composant */
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxItems: 10,
  folder: 'ns2po-election/products',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [items: ProductMedia[]]
}>()

// === Composable ===

const {
  items,
  isUploading,
  error,
  canAddMore,
  mainImage,
  setItems,
  addFiles,
  removeItem,
  setMainImage,
  retryUpload,
  clearError
} = useProductMedia({
  folder: props.folder,
  maxItems: props.maxItems
})

// Sync v-model → internal state
watch(() => props.modelValue, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(items.value)) {
    setItems(newValue)
  }
}, { immediate: true, deep: true })

// Sync internal state → v-model
watch(items, (newItems) => {
  emit('update:modelValue', [...newItems])
}, { deep: true })

// === Local State ===

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const itemToDelete = ref<string | null>(null)

// === Computed ===

const hasItems = computed(() => items.value.length > 0)

// === Handlers ===

function openFilePicker() {
  if (props.disabled || !canAddMore.value) return
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const files = Array.from(input.files)
  const isFirstUpload = items.value.length === 0

  await addFiles(files, isFirstUpload)

  // Reset input pour permettre re-sélection du même fichier
  input.value = ''
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (!props.disabled && canAddMore.value) {
    isDragging.value = true
  }
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false

  if (props.disabled || !canAddMore.value) return

  const files = Array.from(event.dataTransfer?.files || [])
  const imageFiles = files.filter(f => f.type.startsWith('image/'))

  if (imageFiles.length) {
    const isFirstUpload = items.value.length === 0
    await addFiles(imageFiles, isFirstUpload)
  }
}

function handleSetMain(id: string) {
  if (props.disabled) return
  setMainImage(id)
}

function confirmDelete(id: string) {
  itemToDelete.value = id
}

function cancelDelete() {
  itemToDelete.value = null
}

function executeDelete() {
  if (itemToDelete.value) {
    removeItem(itemToDelete.value)
    itemToDelete.value = null
  }
}

function handleRetry(id: string) {
  retryUpload(id)
}

// === Utils ===

function getStatusColor(status: ProductMedia['status']): string {
  switch (status) {
    case 'uploading': return 'border-blue-400 bg-blue-50'
    case 'error': return 'border-red-400 bg-red-50'
    case 'uploaded': return 'border-gray-200 bg-white'
    default: return 'border-gray-300 bg-gray-50'
  }
}
</script>

<template>
  <div class="product-media-manager">
    <!-- Header avec compteur -->
    <div class="flex items-center justify-between mb-3">
      <label class="block text-sm font-medium text-gray-700">
        Images produit
      </label>
      <span class="text-xs text-gray-500">
        {{ items.length }} / {{ maxItems }}
      </span>
    </div>

    <!-- Zone de drop / Upload -->
    <div
      class="relative border-2 border-dashed rounded-lg p-4 transition-colors"
      :class="[
        isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
      ]"
      @click="openFilePicker"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- Input file caché -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        class="hidden"
        :disabled="disabled || !canAddMore"
        @change="handleFileSelect"
      >

      <!-- Contenu zone vide -->
      <div v-if="!hasItems" class="text-center py-8">
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="mt-2 text-sm text-gray-600">
          <span class="font-medium text-primary-600">Cliquer pour ajouter</span>
          ou glisser-déposer
        </p>
        <p class="mt-1 text-xs text-gray-500">
          PNG, JPG, WebP jusqu'à 10MB
        </p>
      </div>

      <!-- Grille d'images -->
      <div v-else class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        <!-- Item média -->
        <div
          v-for="item in items"
          :key="item.id"
          class="relative aspect-square rounded-lg border-2 overflow-hidden group"
          :class="[
            getStatusColor(item.status),
            item.isMain ? 'ring-2 ring-primary-500 ring-offset-1' : ''
          ]"
        >
          <!-- Image -->
          <img
            :src="item.url"
            :alt="item.isMain ? 'Image principale' : 'Image galerie'"
            class="w-full h-full object-cover"
            :class="{ 'opacity-50': item.status === 'uploading' || item.status === 'error' }"
          >

          <!-- Badge principale -->
          <div
            v-if="item.isMain && item.status === 'uploaded'"
            class="absolute top-1 left-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded font-medium"
          >
            Principale
          </div>

          <!-- Barre de progression -->
          <div
            v-if="item.status === 'uploading'"
            class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200"
          >
            <div
              class="h-full bg-blue-500 transition-all duration-200"
              :style="{ width: `${item.uploadProgress || 0}%` }"
            />
          </div>

          <!-- Overlay erreur -->
          <div
            v-if="item.status === 'error'"
            class="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center text-white p-2"
          >
            <svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <button
              class="text-xs underline hover:no-underline"
              @click.stop="handleRetry(item.id)"
            >
              Réessayer
            </button>
          </div>

          <!-- Actions hover -->
          <div
            v-if="item.status === 'uploaded' && !disabled"
            class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          >
            <!-- Définir comme principale -->
            <button
              v-if="!item.isMain"
              class="p-1.5 bg-white rounded-full text-yellow-500 hover:text-yellow-600 transition-colors"
              title="Définir comme image principale"
              @click.stop="handleSetMain(item.id)"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>

            <!-- Supprimer -->
            <button
              class="p-1.5 bg-white rounded-full text-red-500 hover:text-red-600 transition-colors"
              title="Supprimer"
              @click.stop="confirmDelete(item.id)"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Bouton ajouter plus -->
        <div
          v-if="canAddMore && !disabled"
          class="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
          @click.stop="openFilePicker"
        >
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>

      <!-- Indicateur upload global -->
      <div
        v-if="isUploading"
        class="absolute top-2 right-2 flex items-center gap-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
      >
        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Upload...</span>
      </div>
    </div>

    <!-- Message d'erreur global -->
    <p v-if="error" class="mt-2 text-sm text-red-600 flex items-center gap-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {{ error }}
      <button class="ml-2 underline hover:no-underline" @click="clearError">
        Fermer
      </button>
    </p>

    <!-- Aide contextuelle -->
    <p v-if="hasItems && !mainImage" class="mt-2 text-sm text-amber-600 flex items-center gap-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      Cliquez sur l'étoile pour définir l'image principale
    </p>

    <!-- Modal confirmation suppression -->
    <Teleport to="body">
      <div
        v-if="itemToDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="cancelDelete"
      >
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            Supprimer l'image ?
          </h3>
          <p class="text-sm text-gray-500 mb-4">
            Cette action est irréversible.
          </p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              @click="cancelDelete"
            >
              Annuler
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              @click="executeDelete"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.product-media-manager {
  @apply w-full;
}
</style>
