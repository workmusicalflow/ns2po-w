<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Synchronisation
          </h1>
          <p class="text-gray-600">
            Gérez la synchronisation des données entre les différentes sources
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <button
            :disabled="isSyncing"
            class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="syncAll"
          >
            <Icon name="heroicons:arrow-path" :class="['w-4 h-4 mr-2', isSyncing ? 'animate-spin' : '']" />
            {{ isSyncing ? 'Synchronisation...' : 'Synchroniser tout' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- Turso Database -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Turso Database
            </h3>
            <p v-if="tursoStats?.connection?.databaseName" class="text-xs text-gray-500">
              {{ tursoStats.connection.databaseName }}
            </p>
          </div>
          <div class="flex items-center">
            <div :class="['w-3 h-3 rounded-full mr-2', tursoStats?.connection?.healthy ? 'bg-green-500' : 'bg-red-500']" />
            <span class="text-sm text-gray-600">{{ tursoStats?.connection?.status || 'Vérification...' }}</span>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          Base de données principale (SQLite Edge)
          <span v-if="tursoStats?.connection?.host" class="text-xs text-gray-400">
            • {{ tursoStats.connection.host }}
          </span>
        </p>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Tables:</span>
            <span class="text-gray-500">{{ tursoStats?.database?.totalTables || '-' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Enregistrements:</span>
            <span class="text-gray-500">{{ tursoStats?.database?.totalRecords || '-' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Produits:</span>
            <span class="text-gray-500">{{ tursoStats?.database?.keyTables?.products || 0 }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Bundles:</span>
            <span class="text-gray-500">{{ tursoStats?.database?.keyTables?.campaign_bundles || 0 }}</span>
          </div>
          <div class="flex space-x-2 mt-3">
            <button
              :disabled="isSyncing"
              class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              @click="refreshTursoStats"
            >
              Actualiser
            </button>
            <button
              :disabled="isSyncing"
              class="flex-1 px-3 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              @click="optimizeTursoDatabase"
            >
              Optimiser
            </button>
          </div>
        </div>
      </div>

      <!-- Cloudinary -->
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              Cloudinary
            </h3>
            <p v-if="cloudinaryStats?.connection?.cloudName" class="text-xs text-gray-500">
              {{ cloudinaryStats.connection.cloudName }}
            </p>
          </div>
          <div class="flex items-center">
            <div :class="['w-3 h-3 rounded-full mr-2', cloudinaryStats?.connection?.healthy ? 'bg-green-500' : 'bg-red-500']" />
            <span class="text-sm text-gray-600">{{ cloudinaryStats?.connection?.status || 'Vérification...' }}</span>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          Gestion des médias NS2PO
          <span v-if="cloudinaryStats?.performance?.responseTime" class="text-xs text-gray-400">
            • {{ cloudinaryStats.performance.responseTime }}ms
          </span>
        </p>
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span>Images NS2PO:</span>
            <span class="text-gray-500">{{ cloudinaryStats?.project?.totalImages || '-' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Taille totale:</span>
            <span class="text-gray-500">{{ cloudinaryStats?.project?.totalSizeMB || '-' }} MB</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Images récentes:</span>
            <span class="text-gray-500">{{ cloudinaryStats?.project?.recentImages || 0 }} (7j)</span>
          </div>
          <button
            :disabled="isSyncing"
            class="w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            @click="syncCloudinary"
          >
            Actualiser stats Cloudinary
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Logs -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">
          Logs de synchronisation
        </h3>
      </div>
      <div class="p-6">
        <div class="space-y-3">
          <div v-for="log in syncLogs" :key="log.id" class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
            <div class="flex items-center space-x-3">
              <div
                :class="[
                  'w-2 h-2 rounded-full',
                  log.status === 'success' ? 'bg-green-500' :
                  log.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                ]"
              />
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ log.message }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ log.timestamp }}
                </p>
              </div>
            </div>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                log.status === 'success' ? 'bg-green-100 text-green-800' :
                log.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              ]"
            >
              {{ log.status === 'success' ? 'Succès' : log.status === 'error' ? 'Erreur' : 'En cours' }}
            </span>
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
  title: 'Synchronisation | Admin'
})

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Reactive data
const isSyncing = ref(false)
const tursoStats = ref(null)
const cloudinaryStats = ref(null)

const lastSyncTimes = ref({
  turso: 'Jamais',
  cloudinary: 'Jamais'
})

const syncLogs = ref([
  {
    id: 1,
    message: 'Base Turso optimisée avec succès',
    status: 'success',
    timestamp: new Date().toLocaleString('fr-FR')
  },
  {
    id: 2,
    message: 'Synchronisation Cloudinary en cours...',
    status: 'pending',
    timestamp: new Date(Date.now() - 300000).toLocaleString('fr-FR')
  },
  {
    id: 3,
    message: 'Statistiques Turso mises à jour',
    status: 'success',
    timestamp: new Date(Date.now() - 600000).toLocaleString('fr-FR')
  }
])

// Load stats on mount
onMounted(() => {
  refreshTursoStats()
  refreshCloudinaryStats()
})

// Methods
async function syncAll() {
  isSyncing.value = true
  try {
    crudSuccess.updated('Synchronisation complète initiée', 'sync')

    // Actualiser stats Turso
    await refreshTursoStats()
    await new Promise(resolve => setTimeout(resolve, 500))

    // Optimiser la base Turso
    await optimizeTursoDatabase()
    await new Promise(resolve => setTimeout(resolve, 500))

    // Synchroniser Cloudinary
    await syncCloudinary()

    crudSuccess.updated('Synchronisation complète terminée', 'sync')
    addSyncLog('Synchronisation complète réussie', 'success')
  } catch (error) {
    crudError.updated('sync', 'Erreur lors de la synchronisation complète')
    addSyncLog(`Erreur synchronisation: ${error}`, 'error')
  } finally {
    isSyncing.value = false
  }
}

async function refreshTursoStats() {
  try {
    const response = await $fetch('/api/admin/turso-stats')
    tursoStats.value = response
    lastSyncTimes.value.turso = 'À l\'instant'
    addSyncLog('Statistiques Turso actualisées', 'success')
  } catch (error) {
    console.error('Erreur actualisation stats Turso:', error)
    crudError.updated('sync', 'Erreur lors de l\'actualisation des stats Turso')
    addSyncLog(`Erreur stats Turso: ${error}`, 'error')
  }
}

async function refreshCloudinaryStats() {
  try {
    const response = await $fetch('/api/admin/cloudinary-stats')
    cloudinaryStats.value = response
    lastSyncTimes.value.cloudinary = 'À l\'instant'
    addSyncLog('Statistiques Cloudinary actualisées', 'success')
  } catch (error) {
    console.error('Erreur actualisation stats Cloudinary:', error)
    crudError.updated('sync', 'Erreur lors de l\'actualisation des stats Cloudinary')
    addSyncLog(`Erreur stats Cloudinary: ${error}`, 'error')
  }
}

async function optimizeTursoDatabase() {
  isSyncing.value = true
  try {
    crudSuccess.updated('Optimisation Turso initiée', 'sync')

    const response = await $fetch('/api/admin/turso-optimize', {
      method: 'POST'
    })

    if (response.success) {
      crudSuccess.updated(`Base optimisée: ${response.summary.successful} opérations réussies`, 'sync')
      addSyncLog(`Optimisation Turso: ${response.summary.successful}/${response.summary.totalOperations} opérations réussies`, 'success')
    } else {
      crudError.updated('sync', 'Erreur lors de l\'optimisation Turso')
      addSyncLog('Échec optimisation Turso', 'error')
    }

    // Actualiser les stats après optimisation
    await refreshTursoStats()

  } catch (error) {
    crudError.updated('sync', 'Erreur lors de l\'optimisation Turso')
    addSyncLog(`Erreur optimisation: ${error}`, 'error')
  } finally {
    isSyncing.value = false
  }
}

async function syncCloudinary() {
  isSyncing.value = true
  try {
    crudSuccess.updated('Synchronisation Cloudinary initiée', 'sync')
    await refreshCloudinaryStats()
    crudSuccess.updated('Synchronisation Cloudinary terminée', 'sync')
    addSyncLog('Synchronisation Cloudinary terminée', 'success')
  } catch (error) {
    crudError.updated('sync', 'Erreur lors de la synchronisation Cloudinary')
    addSyncLog(`Erreur Cloudinary: ${error}`, 'error')
  } finally {
    isSyncing.value = false
  }
}

// Helper pour ajouter des logs
function addSyncLog(message: string, status: 'success' | 'error' | 'pending') {
  const newLog = {
    id: Date.now(),
    message,
    status,
    timestamp: new Date().toLocaleString('fr-FR')
  }
  syncLogs.value.unshift(newLog)
  // Garder seulement les 10 derniers logs
  if (syncLogs.value.length > 10) {
    syncLogs.value = syncLogs.value.slice(0, 10)
  }
}
</script>