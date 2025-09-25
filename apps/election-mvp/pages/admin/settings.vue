<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Paramètres
          </h1>
          <p class="text-gray-600">
            Configuration générale de l'application
          </p>
        </div>
        <button
          :disabled="isSaving"
          class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="saveSettings"
        >
          <Icon name="heroicons:check" class="w-4 h-4 mr-2" />
          {{ isSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
        </button>
      </div>
    </div>

    <!-- Settings Sections -->
    <div class="space-y-6">
      <!-- General Settings -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            Paramètres généraux
          </h3>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom de l'application</label>
              <input
                v-model="settings.appName"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Version</label>
              <input
                v-model="settings.version"
                type="text"
                readonly
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              v-model="settings.description"
              rows="3"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div class="flex items-center">
            <input
              v-model="settings.maintenanceMode"
              type="checkbox"
              class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            >
            <label class="ml-2 block text-sm text-gray-900">
              Mode maintenance (désactive l'accès public)
            </label>
          </div>
        </div>
      </div>

      <!-- API Configuration -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            Configuration API
          </h3>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Base URL Airtable</label>
              <input
                v-model="settings.airtable.baseId"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cloudinary Cloud Name</label>
              <input
                v-model="settings.cloudinary.cloudName"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Database URL Turso</label>
            <input
              v-model="settings.turso.databaseUrl"
              type="text"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
          </div>
        </div>
      </div>

      <!-- Email Configuration -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            Configuration Email
          </h3>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Serveur SMTP</label>
              <input
                v-model="settings.smtp.host"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Port SMTP</label>
              <input
                v-model="settings.smtp.port"
                type="number"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur SMTP</label>
              <input
                v-model="settings.smtp.username"
                type="text"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email expéditeur</label>
              <input
                v-model="settings.smtp.from"
                type="email"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
          </div>

          <div class="flex items-center">
            <input
              v-model="settings.smtp.secure"
              type="checkbox"
              class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            >
            <label class="ml-2 block text-sm text-gray-900">
              Utiliser SSL/TLS
            </label>
          </div>
        </div>
      </div>

      <!-- Cache & Performance -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">
            Cache et Performance
          </h3>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">TTL Cache API (secondes)</label>
              <input
                v-model.number="settings.cache.apiTtl"
                type="number"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">TTL Cache Images (secondes)</label>
              <input
                v-model.number="settings.cache.imageTtl"
                type="number"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Limite par page</label>
              <input
                v-model.number="settings.pagination.limit"
                type="number"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>
          </div>

          <div class="flex items-center space-x-6">
            <div class="flex items-center">
              <input
                v-model="settings.cache.enabled"
                type="checkbox"
                class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              >
              <label class="ml-2 block text-sm text-gray-900">
                Activer le cache
              </label>
            </div>
            <div class="flex items-center">
              <input
                v-model="settings.compression.enabled"
                type="checkbox"
                class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              >
              <label class="ml-2 block text-sm text-gray-900">
                Activer la compression
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Auto-imported via Nuxt 3: globalNotifications

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Paramètres | Admin'
})

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Reactive data
const isSaving = ref(false)

const settings = ref({
  appName: 'NS2PO Election MVP',
  version: '0.1.0',
  description: 'Plateforme électorale numérique pour la création de gadgets personnalisés',
  maintenanceMode: false,

  airtable: {
    baseId: 'apprQLdnVwlbfnioT'
  },

  cloudinary: {
    cloudName: 'dsrvzogof'
  },

  turso: {
    databaseUrl: 'libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io'
  },

  smtp: {
    host: 'mail.topdigitalevel.site',
    port: 587,
    username: 'info@topdigitalevel.site',
    from: 'info@topdigitalevel.site',
    secure: false
  },

  cache: {
    enabled: true,
    apiTtl: 300,
    imageTtl: 3600
  },

  compression: {
    enabled: true
  },

  pagination: {
    limit: 20
  }
})

// Methods
async function saveSettings() {
  isSaving.value = true
  try {
    // Simulation de sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000))
    crudSuccess.updated('Paramètres sauvegardés avec succès', 'settings')
  } catch (error) {
    crudError.updated('settings', 'Erreur lors de la sauvegarde des paramètres')
  } finally {
    isSaving.value = false
  }
}
</script>