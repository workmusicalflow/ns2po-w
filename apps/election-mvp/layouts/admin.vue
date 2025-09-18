<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Admin Header -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo & Title -->
          <div class="flex items-center space-x-4">
            <NuxtLink to="/admin" class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">NS</span>
              </div>
              <div>
                <h1 class="text-lg font-semibold text-gray-900">NS2PO Admin</h1>
                <p class="text-xs text-gray-500">CMS d'administration</p>
              </div>
            </NuxtLink>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <!-- Sync Status -->
            <div class="flex items-center space-x-2 text-sm">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-gray-600">Sync actif</span>
            </div>

            <!-- User Avatar -->
            <div class="relative">
              <button class="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900">
                <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span class="text-gray-600 font-medium">A</span>
                </div>
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar Navigation -->
      <nav class="w-64 bg-white shadow-sm min-h-screen border-r border-gray-200">
        <div class="p-4">
          <div class="space-y-1">
            <!-- Dashboard -->
            <NuxtLink
              to="/admin"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path === '/admin' ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            >
              <Icon name="heroicons:chart-bar" class="w-5 h-5" />
              <span>Dashboard</span>
            </NuxtLink>

            <!-- Products -->
            <NuxtLink
              to="/admin/products"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path.startsWith('/admin/products') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            >
              <Icon name="heroicons:cube" class="w-5 h-5" />
              <span>Produits</span>
            </NuxtLink>

            <!-- Campaign Bundles -->
            <NuxtLink
              to="/admin/bundles"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path.startsWith('/admin/bundles') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            >
              <Icon name="heroicons:archive-box" class="w-5 h-5" />
              <span>Packs Campagne</span>
            </NuxtLink>

            <!-- Categories -->
            <NuxtLink
              to="/admin/categories"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path.startsWith('/admin/categories') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            >
              <Icon name="heroicons:tag" class="w-5 h-5" />
              <span>Catégories</span>
            </NuxtLink>

            <!-- Realisations -->
            <NuxtLink
              to="/admin/realisations"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path.startsWith('/admin/realisations') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            >
              <Icon name="heroicons:photo" class="w-5 h-5" />
              <span>Réalisations</span>
            </NuxtLink>

            <!-- Sync Management -->
            <NuxtLink
              to="/admin/sync"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path.startsWith('/admin/sync') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            >
              <Icon name="heroicons:arrow-path" class="w-5 h-5" />
              <span>Synchronisation</span>
            </NuxtLink>

            <hr class="my-4 border-gray-200" />

            <!-- Settings -->
            <NuxtLink
              to="/admin/settings"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium"
              :class="$route.path.startsWith('/admin/settings') ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'"
            >
              <Icon name="heroicons:cog-6-tooth" class="w-5 h-5" />
              <span>Paramètres</span>
            </NuxtLink>

            <!-- Back to Site -->
            <NuxtLink
              to="/"
              class="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <Icon name="heroicons:arrow-left" class="w-5 h-5" />
              <span>Retour au site</span>
            </NuxtLink>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="flex-1 min-h-screen">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>

    <!-- Global Notification Container -->
    <UiNSNotificationContainer />
  </div>
</template>

<script setup lang="ts">
// Meta pour admin
useHead({
  titleTemplate: '%s | NS2PO Admin',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>