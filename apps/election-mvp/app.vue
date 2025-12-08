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

    <!-- Toast Notifications Global -->
    <ToastContainer />
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

// Global SEO configuration - Fallback pour toutes les pages
const siteUrl = useRuntimeConfig().public.siteUrl || 'https://nuxt-app-production-8b86.up.railway.app'
const ogImageUrl = 'https://res.cloudinary.com/dsrvzogof/image/upload/v1765232112/image-seo-meta-og-ns2po-w_exdkwh.png'
const defaultDescription = 'Commandez vos articles de campagne électorale personnalisés : t-shirts, casquettes, banderoles, flyers et plus. Devis gratuit en ligne.'

useHead({
  titleTemplate: '%s - NS2PO Election',
  meta: [
    { name: 'author', content: 'NS2PO Team' },
    { name: 'theme-color', content: '#C99A3B' }
  ]
})

// SEO Meta (Open Graph + Twitter Cards) - API typée Nuxt 3
useSeoMeta({
  // Meta description globale
  description: defaultDescription,

  // Open Graph Protocol
  ogType: 'website',
  ogTitle: 'NS2PO Election - Articles de Campagne Personnalisés',
  ogDescription: defaultDescription,
  ogImage: ogImageUrl,
  ogImageAlt: 'Commandez vos articles de campagne',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogUrl: siteUrl,
  ogSiteName: 'NS2PO Election',
  ogLocale: 'fr_CI',

  // Twitter Card (Large Image)
  twitterCard: 'summary_large_image',
  twitterTitle: 'NS2PO Election - Articles de Campagne Personnalisés',
  twitterDescription: defaultDescription,
  twitterImage: ogImageUrl,
  twitterImageAlt: 'Commandez vos articles de campagne',
  twitterSite: '@ns2po_ci'
})
</script>