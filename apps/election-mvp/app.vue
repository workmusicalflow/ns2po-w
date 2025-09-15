<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    
    <!-- Modal d'image global -->
    <ImageModal />
  </div>
</template>

<script setup lang="ts">
// Global app configuration
useHead({
  titleTemplate: '%s - NS2PO Election',
  meta: [
    { name: 'author', content: 'NS2PO Team' },
    { name: 'theme-color', content: '#059669' }
  ]
})
</script>