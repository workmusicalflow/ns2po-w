<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Synchronisation</h1>
          <p class="text-gray-600">Gérez la synchronisation des données entre les différentes sources</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            @click="syncAll"
            :disabled="isSyncing"
            class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="heroicons:arrow-path" :class="['w-4 h-4 mr-2', isSyncing ? 'animate-spin' : '']" />
            {{ isSyncing ? 'Synchronisation...' : 'Synchroniser tout' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Airtable Sync -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Airtable</h3>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="text-sm text-gray-600">Connecté</span>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">Synchronisation des produits et catégories</p>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Dernière sync:</span>
            <span class="text-gray-500">{{ lastSyncTimes.airtable }}</span>
          </div>
          <button
            @click="syncAirtable"
            :disabled="isSyncing"
            class="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          >
            Synchroniser Airtable
          </button>
        </div>
      </div>

      <!-- Turso Database -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Turso Database</h3>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="text-sm text-gray-600">Connecté</span>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">Base de données principale</p>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Tables:</span>
            <span class="text-gray-500">{{ dbStats.tables }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Enregistrements:</span>
            <span class="text-gray-500">{{ dbStats.records }}</span>
          </div>
        </div>
      </div>

      <!-- Cloudinary -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Cloudinary</h3>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span class="text-sm text-gray-600">Connecté</span>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">Gestion des médias</p>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Images:</span>
            <span class="text-gray-500">{{ cloudinaryStats.images }}</span>
          </div>
          <button
            @click="syncCloudinary"
            :disabled="isSyncing"
            class="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
          >
            Synchroniser Cloudinary
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Logs -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Logs de synchronisation</h3>
      </div>
      <div class="p-6">
        <div class="space-y-3">
          <div v-for="log in syncLogs" :key="log.id" class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div class="flex items-center space-x-3">
              <div :class="[
                'w-2 h-2 rounded-full',
                log.status === 'success' ? 'bg-green-500' :
                log.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              ]"></div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ log.message }}</p>
                <p class="text-xs text-gray-500">{{ log.timestamp }}</p>
              </div>
            </div>
            <span :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              log.status === 'success' ? 'bg-green-100 text-green-800' :
              log.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
            ]">
              {{ log.status === 'success' ? 'Succès' : log.status === 'error' ? 'Erreur' : 'En cours' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { globalNotifications } from '~/composables/useNotifications'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Synchronisation | Admin'
})

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Reactive data
const isSyncing = ref(false)

const lastSyncTimes = ref({
  airtable: '2 minutes ago',
  turso: '5 minutes ago',
  cloudinary: '1 hour ago'
})

const dbStats = ref({
  tables: 10,
  records: 1547
})

const cloudinaryStats = ref({
  images: 234
})

const syncLogs = ref([
  {
    id: 1,
    message: 'Synchronisation Airtable terminée avec succès',
    status: 'success',
    timestamp: '2025-01-18 14:30:25'
  },
  {
    id: 2,
    message: 'Synchronisation Cloudinary en cours...',
    status: 'pending',
    timestamp: '2025-01-18 14:25:10'
  },
  {
    id: 3,
    message: 'Erreur lors de la synchronisation des catégories',
    status: 'error',
    timestamp: '2025-01-18 14:20:45'
  }
])

// Methods
async function syncAll() {
  isSyncing.value = true
  try {
    crudSuccess.updated('Synchronisation complète initiée', 'sync')
    // Simulation d'une synchronisation
    await new Promise(resolve => setTimeout(resolve, 2000))
    crudSuccess.updated('Synchronisation complète terminée', 'sync')
  } catch (error) {
    crudError.updated('sync', 'Erreur lors de la synchronisation complète')
  } finally {
    isSyncing.value = false
  }
}

async function syncAirtable() {
  isSyncing.value = true
  try {
    crudSuccess.updated('Synchronisation Airtable initiée', 'sync')
    // Simulation d'une synchronisation Airtable
    await new Promise(resolve => setTimeout(resolve, 1500))
    lastSyncTimes.value.airtable = 'À l\'instant'
    crudSuccess.updated('Synchronisation Airtable terminée', 'sync')
  } catch (error) {
    crudError.updated('sync', 'Erreur lors de la synchronisation Airtable')
  } finally {
    isSyncing.value = false
  }
}

async function syncCloudinary() {
  isSyncing.value = true
  try {
    crudSuccess.updated('Synchronisation Cloudinary initiée', 'sync')
    // Simulation d'une synchronisation Cloudinary
    await new Promise(resolve => setTimeout(resolve, 1000))
    lastSyncTimes.value.cloudinary = 'À l\'instant'
    crudSuccess.updated('Synchronisation Cloudinary terminée', 'sync')
  } catch (error) {
    crudError.updated('sync', 'Erreur lors de la synchronisation Cloudinary')
  } finally {
    isSyncing.value = false
  }
}
</script>