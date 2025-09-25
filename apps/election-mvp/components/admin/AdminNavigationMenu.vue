<template>
  <div class="space-y-1">
    <!-- Dashboard -->
    <NuxtLink
      to="/admin"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path === '/admin' ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:chart-bar" class="w-5 h-5 flex-shrink-0" />
      <span>Dashboard</span>
    </NuxtLink>

    <!-- Products -->
    <NuxtLink
      to="/admin/products"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/products') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:cube" class="w-5 h-5 flex-shrink-0" />
      <span>Produits</span>
    </NuxtLink>

    <!-- Campaign Bundles -->
    <NuxtLink
      to="/admin/bundles"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/bundles') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:archive-box" class="w-5 h-5 flex-shrink-0" />
      <span>Packs Campagne</span>
    </NuxtLink>

    <!-- Categories -->
    <NuxtLink
      to="/admin/categories"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/categories') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:tag" class="w-5 h-5 flex-shrink-0" />
      <span>Catégories</span>
    </NuxtLink>

    <!-- Realisations -->
    <NuxtLink
      to="/admin/realisations"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/realisations') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:photo" class="w-5 h-5 flex-shrink-0" />
      <span>Réalisations</span>
    </NuxtLink>

    <!-- Assets -->
    <NuxtLink
      to="/admin/assets"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/assets') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:folder" class="w-5 h-5 flex-shrink-0" />
      <span>Assets Cloudinary</span>
    </NuxtLink>

    <!-- Sync Management -->
    <NuxtLink
      to="/admin/sync"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/sync') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:arrow-path" class="w-5 h-5 flex-shrink-0" />
      <span>Synchronisation</span>
    </NuxtLink>

    <!-- Blacklist -->
    <NuxtLink
      to="/admin/blacklist"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/blacklist') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:x-circle" class="w-5 h-5 flex-shrink-0" />
      <span>Blacklist</span>
    </NuxtLink>

    <hr class="my-4 border-gray-200">

    <!-- Settings -->
    <NuxtLink
      to="/admin/settings"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 touch-manipulation"
      :class="route.path.startsWith('/admin/settings') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:cog-6-tooth" class="w-5 h-5 flex-shrink-0" />
      <span>Paramètres</span>
    </NuxtLink>

    <!-- Back to Site -->
    <NuxtLink
      to="/"
      class="flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200 touch-manipulation"
      @click="$emit('navigate')"
    >
      <Icon name="heroicons:arrow-left" class="w-5 h-5 flex-shrink-0" />
      <span>Retour au site</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

// Événement émis lors de la navigation (pour fermer le menu mobile)
defineEmits<{
  navigate: []
}>()
</script>