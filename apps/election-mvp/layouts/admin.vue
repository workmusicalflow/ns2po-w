<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Navigation Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-40 md:hidden"
      @click="closeMobileMenu"
    >
      <div class="absolute inset-0 bg-gray-600 opacity-75" />
    </div>

    <!-- Admin Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 relative z-30">
      <div class="mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Mobile Menu Button & Logo -->
          <div class="flex items-center space-x-4">
            <!-- Mobile Hamburger Menu -->
            <button
              @click="toggleMobileMenu"
              class="md:hidden inline-flex items-center justify-center w-12 h-12 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 touch-manipulation"
              aria-label="Ouvrir le menu de navigation"
            >
              <Icon
                :name="isMobileMenuOpen ? 'heroicons:x-mark' : 'heroicons:bars-3'"
                class="w-6 h-6"
              />
            </button>

            <NuxtLink to="/admin" class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">NS</span>
              </div>
              <div class="hidden sm:block">
                <h1 class="text-lg font-semibold text-gray-900">
                  NS2PO Admin
                </h1>
                <p class="text-xs text-gray-500">
                  CMS d'administration
                </p>
              </div>
              <!-- Mobile Title (shorter) -->
              <div class="block sm:hidden">
                <h1 class="text-base font-semibold text-gray-900">
                  Admin
                </h1>
              </div>
            </NuxtLink>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-2 sm:space-x-4">
            <!-- Sync Status -->
            <div class="hidden sm:flex items-center space-x-2 text-sm">
              <div class="w-2 h-2 bg-green-500 rounded-full" />
              <span class="text-gray-600 hidden md:inline">Sync actif</span>
            </div>

            <!-- User Avatar -->
            <div class="relative">
              <button class="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 min-w-12 min-h-12 px-2 py-2 rounded-md touch-manipulation">
                <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-gray-600 font-medium">A</span>
                </div>
                <span class="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="flex relative">
      <!-- Desktop Sidebar -->
      <nav class="hidden md:flex w-64 bg-white shadow-sm min-h-screen border-r border-gray-200 relative z-20">
        <div class="w-full p-4">
          <AdminNavigationMenu @navigate="closeMobileMenu" />
        </div>
      </nav>

      <!-- Mobile Sidebar -->
      <nav
        :class="[
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <div class="flex flex-col h-full">
          <!-- Mobile Sidebar Header -->
          <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">NS</span>
              </div>
              <div>
                <h1 class="text-lg font-semibold text-gray-900">
                  NS2PO Admin
                </h1>
                <p class="text-xs text-gray-500">
                  CMS d'administration
                </p>
              </div>
            </div>
            <button
              @click="closeMobileMenu"
              class="w-12 h-12 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 touch-manipulation"
              aria-label="Fermer le menu"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
          </div>

          <!-- Mobile Navigation Content -->
          <div class="flex-1 overflow-y-auto p-4">
            <AdminNavigationMenu @navigate="closeMobileMenu" />
          </div>
        </div>
      </nav>

      <!-- Main Content Area -->
      <main class="flex-1 min-h-screen md:ml-0">
        <div class="mx-auto py-4 px-4 sm:px-6 lg:px-8 md:py-6">
          <!-- Mobile Content Padding Top pour éviter l'overlap avec header fixe -->
          <div class="md:max-w-7xl">
            <slot />
          </div>
        </div>
      </main>
    </div>

    <!-- Global Notification Container -->
    <NSNotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

// Import du composant NSNotificationContainer
import NSNotificationContainer from '../components/ui/NSNotificationContainer.vue'

// État réactif pour la navigation mobile
const isMobileMenuOpen = ref(false)

// Fonctions de gestion du menu mobile
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// Fermer le menu mobile lors de la navigation
const route = useRoute()
watch(route, () => {
  closeMobileMenu()
})

// Prévenir le scroll du body quand le menu mobile est ouvert
watch(isMobileMenuOpen, (isOpen) => {
  if (process.client) {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Nettoyage au unmount
onUnmounted(() => {
  if (process.client) {
    document.body.style.overflow = ''
  }
})

// Meta pour admin
useHead({
  titleTemplate: '%s | NS2PO Admin',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>