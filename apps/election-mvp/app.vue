<template>
  <div>
    <!-- Global Loading Spinner - SANS readonly() pour réactivité -->
    <NSLoadingSpinner
      :show="isLoading"
      :message="loadingMessage"
      full-screen
      size="lg"
      variant="primary"
    />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Modal d'image global -->
    <ImageModal />
  </div>
</template>

<script setup lang="ts">
import { useGlobalLoading } from '~/composables/useGlobalLoading'

// 🎯 TEST: Accès DIRECT aux refs sans readonly()
const globalLoading = useGlobalLoading()
const isLoading = globalLoading.isLoading
const loadingMessage = globalLoading.loadingMessage

console.log('[APP.VUE] globalLoading initialisé:', {
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