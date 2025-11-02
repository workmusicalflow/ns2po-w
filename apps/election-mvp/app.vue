<template>
  <div>
    <!-- Global Loading Spinner SIMPLE - Même style que AdminDataTable -->
    <div
      v-show="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center gap-4">
        <!-- Spinner simple qui FONCTIONNE (même que AdminDataTable) -->
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
        <p v-if="loadingMessage" class="text-sm font-medium text-gray-700">
          {{ loadingMessage }}
        </p>
      </div>
    </div>

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Modal d'image global -->
    <ImageModal />
  </div>
</template>

<script setup lang="ts">
import { useGlobalLoading } from '~/composables/useGlobalLoading'

// Accès DIRECT aux refs useState (SSR-safe)
const globalLoading = useGlobalLoading()
const isLoading = globalLoading.isLoading
const loadingMessage = globalLoading.loadingMessage

console.log('[APP.VUE] Simple spinner initialisé:', {
  isLoading: isLoading.value,
  loadingMessage: loadingMessage.value
})

// Global app configuration
useHead({
  titleTemplate: '%s - NS2PO Election',
  meta: [
    { name: 'author', content: 'NS2PO Team' },
    { name: 'theme-color', content: '#059669' }
  ]
})
</script>