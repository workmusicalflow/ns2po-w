<template>
  <div>
    <!-- Global Loading Spinner - Niveau RACINE pour visibilité garantie pendant navigation -->
    <NSLoadingSpinner
      :show="globalLoading.isLoading.value"
      :message="globalLoading.loadingMessage.value || 'Chargement des données...'"
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
// Import explicite du composable useGlobalLoading
import { useGlobalLoading } from '~/composables/useGlobalLoading'

// État global du spinner (SSR-safe avec useState)
const globalLoading = useGlobalLoading()

// Global app configuration
useHead({
  titleTemplate: '%s - NS2PO Election',
  meta: [
    { name: 'author', content: 'NS2PO Team' },
    { name: 'theme-color', content: '#059669' }
  ]
})
</script>