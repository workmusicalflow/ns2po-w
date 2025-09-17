<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-600">Vue d'ensemble de votre système NS2PO</p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Products Count -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Produits</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.products || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:cube" class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="mt-4">
          <span class="text-green-600 text-sm font-medium">Actifs</span>
        </div>
      </div>

      <!-- Bundles Count -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Packs</p>
            <p class="text-3xl font-bold text-gray-900">{{ stats.bundles || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:archive-box" class="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div class="mt-4">
          <span class="text-green-600 text-sm font-medium">Configurés</span>
        </div>
      </div>

      <!-- Sync Status -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Dernière Sync</p>
            <p class="text-lg font-bold text-gray-900">
              {{ syncStatus?.lastSync?.timestamp ? formatDate(syncStatus.lastSync.timestamp) : 'Jamais' }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Icon name="heroicons:arrow-path" class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="mt-4">
          <span
            class="text-sm font-medium"
            :class="{
              'text-green-600': syncStatus?.lastSync?.status === 'success',
              'text-red-600': syncStatus?.lastSync?.status === 'error',
              'text-yellow-600': syncStatus?.lastSync?.status === 'running',
              'text-gray-600': syncStatus?.lastSync?.status === 'never'
            }"
          >
            {{ getSyncStatusText(syncStatus?.lastSync?.status) }}
          </span>
        </div>
      </div>

      <!-- Health Status -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Santé Système</p>
            <p class="text-lg font-bold text-gray-900">
              {{ healthStatus?.status === 'healthy' ? 'Excellent' : 'Attention' }}
            </p>
          </div>
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center"
            :class="{
              'bg-green-100': healthStatus?.status === 'healthy',
              'bg-yellow-100': healthStatus?.status === 'degraded',
              'bg-red-100': healthStatus?.status === 'down'
            }"
          >
            <Icon
              name="heroicons:heart"
              class="w-6 h-6"
              :class="{
                'text-green-600': healthStatus?.status === 'healthy',
                'text-yellow-600': healthStatus?.status === 'degraded',
                'text-red-600': healthStatus?.status === 'down'
              }"
            />
          </div>
        </div>
        <div class="mt-4">
          <span
            class="text-sm font-medium"
            :class="{
              'text-green-600': healthStatus?.status === 'healthy',
              'text-yellow-600': healthStatus?.status === 'degraded',
              'text-red-600': healthStatus?.status === 'down'
            }"
          >
            {{ healthStatus?.services?.filter(s => s.status === 'up').length || 0 }}/{{ healthStatus?.services?.length || 0 }} services
          </span>
        </div>
      </div>
    </div>

    <!-- Enhanced Monitoring and Control Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
      <!-- Sync Management -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Gestion Synchronisation</h3>
          <div class="flex items-center space-x-2">
            <div
              class="w-3 h-3 rounded-full"
              :class="{
                'bg-green-500': syncHealth.status === 'healthy',
                'bg-yellow-500': syncHealth.status === 'warning',
                'bg-red-500': syncHealth.status === 'error',
                'bg-gray-400': !adminSyncStatus
              }"
            ></div>
            <span class="text-sm font-medium text-gray-600">{{ syncHealth.message }}</span>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Quick Sync Actions -->
          <div class="grid grid-cols-2 gap-2">
            <button
              @click="triggerFullSync"
              :disabled="isSyncing"
              class="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {{ isSyncing ? 'En cours...' : 'Sync Complète' }}
            </button>
            <button
              @click="triggerProductsSync"
              :disabled="isSyncing"
              class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Produits
            </button>
          </div>

          <!-- Sync Status and Stats -->
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <p class="font-medium text-gray-900">Dernière synchronisation</p>
              <span class="text-sm text-gray-600">{{ timeSinceLastSync }}</span>
            </div>
            <div v-if="adminSyncStatus?.stats" class="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p class="font-bold text-green-600">{{ adminSyncStatus.stats.successfulSyncs }}</p>
                <p class="text-gray-600">Réussies</p>
              </div>
              <div>
                <p class="font-bold text-red-600">{{ adminSyncStatus.stats.failedSyncs }}</p>
                <p class="text-gray-600">Échouées</p>
              </div>
              <div>
                <p class="font-bold text-blue-600">{{ adminSyncStatus.stats.totalItemsSynced }}</p>
                <p class="text-gray-600">Éléments</p>
              </div>
            </div>
          </div>

          <!-- Current Sync Progress -->
          <div v-if="isSyncing" class="p-4 bg-blue-50 rounded-lg">
            <div class="flex items-center justify-between mb-2">
              <p class="font-medium text-blue-900">Synchronisation en cours</p>
              <Icon name="heroicons:arrow-path" class="w-4 h-4 text-blue-600 animate-spin" />
            </div>
            <div class="w-full bg-blue-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full animate-pulse"></div>
            </div>
            <p class="text-xs text-blue-600 mt-1">Traitement des données...</p>
          </div>

          <!-- Last Sync Result -->
          <div v-if="lastSyncResult && !isSyncing" class="p-4 bg-green-50 rounded-lg">
            <p class="font-medium text-green-900 mb-2">Dernière synchronisation</p>
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div class="text-center">
                <p class="font-bold text-green-600">{{ lastSyncResult.products.synced }}</p>
                <p class="text-gray-600">Produits</p>
              </div>
              <div class="text-center">
                <p class="font-bold text-purple-600">{{ lastSyncResult.bundles.synced }}</p>
                <p class="text-gray-600">Bundles</p>
              </div>
              <div class="text-center">
                <p class="font-bold text-blue-600">{{ lastSyncResult.categories.synced }}</p>
                <p class="text-gray-600">Catégories</p>
              </div>
            </div>
            <p class="text-xs text-gray-600 mt-2">
              Durée: {{ formatDuration(lastSyncResult.duration) }}
            </p>
          </div>

          <!-- Advanced Controls -->
          <div class="pt-4 border-t border-gray-200">
            <button
              @click="showSyncLogs = true"
              class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Voir l'historique complet
            </button>
          </div>
        </div>
      </div>

      <!-- Real-time System Health -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Santé Système</h3>
          <button
            @click="refreshHealthStatus"
            :disabled="refreshingHealth"
            class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <Icon name="heroicons:arrow-path" :class="{ 'animate-spin': refreshingHealth }" class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="service in healthStatus?.services || []"
            :key="service.name"
            class="flex items-center justify-between p-3 rounded-lg"
            :class="{
              'bg-green-50': service.status === 'up',
              'bg-red-50': service.status === 'down',
              'bg-yellow-50': service.status === 'degraded'
            }"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-green-500': service.status === 'up',
                  'bg-red-500': service.status === 'down',
                  'bg-yellow-500': service.status === 'degraded'
                }"
              ></div>
              <div>
                <p class="font-medium text-gray-900">{{ service.name }}</p>
                <p class="text-xs text-gray-600">{{ service.responseTime }}ms</p>
              </div>
            </div>
            <span
              class="text-sm font-medium"
              :class="{
                'text-green-600': service.status === 'up',
                'text-red-600': service.status === 'down',
                'text-yellow-600': service.status === 'degraded'
              }"
            >
              {{ service.status === 'up' ? 'OK' : service.status === 'down' ? 'DOWN' : 'DEGRADED' }}
            </span>
          </div>
        </div>

        <!-- Database Performance Metrics -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ healthStatus?.turso?.connections || 0 }}</p>
              <p class="text-xs text-gray-600">Connexions Turso</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ healthStatus?.turso?.avgResponseTime || 0 }}ms</p>
              <p class="text-xs text-gray-600">Latence moyenne</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Monitoring -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Monitoring d'Erreurs</h3>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Erreurs dernières 24h</span>
            <span class="font-bold text-red-600">{{ errorStats.last24h || 0 }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Erreurs cette semaine</span>
            <span class="font-bold text-orange-600">{{ errorStats.thisWeek || 0 }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Taux d'erreur</span>
            <span
              class="font-bold"
              :class="{
                'text-green-600': (errorStats.errorRate || 0) < 1,
                'text-yellow-600': (errorStats.errorRate || 0) >= 1 && (errorStats.errorRate || 0) < 5,
                'text-red-600': (errorStats.errorRate || 0) >= 5
              }"
            >
              {{ (errorStats.errorRate || 0).toFixed(2) }}%
            </span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            @click="showErrorLogs = true"
            class="w-full px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
          >
            Voir les logs d'erreurs
          </button>
        </div>
      </div>
    </div>

    <!-- Recent Activity and Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Activité Récente</h3>
          <button
            @click="refreshActivity"
            :disabled="refreshingActivity"
            class="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <Icon name="heroicons:arrow-path" :class="{ 'animate-spin': refreshingActivity }" class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="flex items-center space-x-3 p-3 rounded-lg"
            :class="{
              'bg-green-50': activity.type === 'success',
              'bg-blue-50': activity.type === 'info',
              'bg-yellow-50': activity.type === 'warning',
              'bg-red-50': activity.type === 'error'
            }"
          >
            <div
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-green-500': activity.type === 'success',
                'bg-blue-500': activity.type === 'info',
                'bg-yellow-500': activity.type === 'warning',
                'bg-red-500': activity.type === 'error'
              }"
            ></div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ activity.message }}</p>
              <p class="text-xs text-gray-600">{{ formatDate(activity.timestamp) }}</p>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            @click="showFullLogs = true"
            class="text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            Voir tous les logs →
          </button>
        </div>
      </div>

      <!-- Performance Metrics -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Métriques Performance</h3>

        <div class="space-y-4">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-gray-600">Temps de réponse moyen</span>
              <span class="text-sm font-medium text-gray-900">{{ performance.avgResponseTime || 0 }}ms</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full"
                :class="{
                  'bg-green-500': (performance.avgResponseTime || 0) < 500,
                  'bg-yellow-500': (performance.avgResponseTime || 0) >= 500 && (performance.avgResponseTime || 0) < 1000,
                  'bg-red-500': (performance.avgResponseTime || 0) >= 1000
                }"
                :style="{ width: `${Math.min((performance.avgResponseTime || 0) / 10, 100)}%` }"
              ></div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-gray-600">Utilisation mémoire</span>
              <span class="text-sm font-medium text-gray-900">{{ performance.memoryUsage || 0 }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="h-2 rounded-full"
                :class="{
                  'bg-green-500': (performance.memoryUsage || 0) < 70,
                  'bg-yellow-500': (performance.memoryUsage || 0) >= 70 && (performance.memoryUsage || 0) < 90,
                  'bg-red-500': (performance.memoryUsage || 0) >= 90
                }"
                :style="{ width: `${performance.memoryUsage || 0}%` }"
              ></div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-gray-600">Throughput (req/min)</span>
              <span class="text-sm font-medium text-gray-900">{{ performance.throughput || 0 }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-blue-500 h-2 rounded-full"
                :style="{ width: `${Math.min((performance.throughput || 0) / 10, 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-lg font-bold text-blue-600">{{ performance.uptime || '0d' }}</p>
              <p class="text-xs text-gray-600">Uptime</p>
            </div>
            <div>
              <p class="text-lg font-bold text-green-600">{{ performance.totalRequests || 0 }}</p>
              <p class="text-xs text-gray-600">Requêtes totales</p>
            </div>
            <div>
              <p class="text-lg font-bold text-purple-600">{{ performance.cacheHitRate || 0 }}%</p>
              <p class="text-xs text-gray-600">Cache hit rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Sync Logs Modal -->
    <AdminModal
      :show="showSyncLogs"
      @close="showSyncLogs = false"
      title="Historique des Synchronisations"
      size="xl"
    >
      <div v-if="adminSyncStatus" class="space-y-6">
        <!-- Stats résumées -->
        <div class="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ adminSyncStatus.stats.successfulSyncs }}</p>
            <p class="text-sm text-gray-600">Réussies</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-red-600">{{ adminSyncStatus.stats.failedSyncs }}</p>
            <p class="text-sm text-gray-600">Échouées</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">{{ adminSyncStatus.stats.totalItemsSynced }}</p>
            <p class="text-sm text-gray-600">Éléments</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-amber-600">{{ adminSyncStatus.stats.successRate }}%</p>
            <p class="text-sm text-gray-600">Taux de réussite</p>
          </div>
        </div>

        <!-- Historique des synchronisations -->
        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="sync in adminSyncStatus.recentSyncs"
            :key="sync.id"
            class="p-4 rounded-lg border"
            :class="{
              'bg-green-50 border-green-200': sync.status === 'success',
              'bg-yellow-50 border-yellow-200': sync.status === 'partial',
              'bg-red-50 border-red-200': sync.status === 'error'
            }"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-2">
                  <span
                    class="px-2 py-1 text-xs rounded uppercase font-medium"
                    :class="{
                      'bg-green-100 text-green-800': sync.status === 'success',
                      'bg-yellow-100 text-yellow-800': sync.status === 'partial',
                      'bg-red-100 text-red-800': sync.status === 'error'
                    }"
                  >
                    {{ sync.syncType }}
                  </span>
                  <span class="text-sm text-gray-600">{{ formatDate(sync.createdAt) }}</span>
                </div>

                <div class="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p class="font-medium text-gray-900">{{ sync.itemsSynced }}</p>
                    <p class="text-gray-600">Éléments synchronisés</p>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ sync.errorsCount }}</p>
                    <p class="text-gray-600">Erreurs</p>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ formatDuration(sync.duration) }}</p>
                    <p class="text-gray-600">Durée</p>
                  </div>
                </div>
              </div>

              <div
                class="w-3 h-3 rounded-full"
                :class="{
                  'bg-green-500': sync.status === 'success',
                  'bg-yellow-500': sync.status === 'partial',
                  'bg-red-500': sync.status === 'error'
                }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="flex justify-between pt-4 border-t border-gray-200">
          <div class="text-sm text-gray-600">
            Dernière synchronisation: {{ timeSinceLastSync }}
          </div>
          <div class="space-x-2">
            <button
              @click="triggerProductsSync(); showSyncLogs = false"
              :disabled="isSyncing"
              class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Sync Produits
            </button>
            <button
              @click="triggerFullSync(); showSyncLogs = false"
              :disabled="isSyncing"
              class="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 disabled:opacity-50"
            >
              Sync Complète
            </button>
          </div>
        </div>
      </div>
    </AdminModal>

    <!-- Error Logs Modal -->
    <AdminModal
      :show="showErrorLogs"
      @close="showErrorLogs = false"
      title="Logs d'Erreurs"
      size="xl"
    >
      <div class="space-y-4 max-h-96 overflow-y-auto">
        <div
          v-for="log in errorLogs"
          :key="log.id"
          class="p-4 bg-red-50 rounded-lg border border-red-200"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="font-medium text-red-900">{{ log.message }}</p>
              <p class="text-sm text-red-600 mt-1">{{ log.stack }}</p>
              <p class="text-xs text-red-500 mt-2">{{ formatDate(log.timestamp) }}</p>
            </div>
            <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">{{ log.level }}</span>
          </div>
        </div>
      </div>
    </AdminModal>

    <!-- Full Logs Modal -->
    <AdminModal
      :show="showFullLogs"
      @close="showFullLogs = false"
      title="Logs Système Complets"
      size="xl"
    >
      <div class="space-y-4 max-h-96 overflow-y-auto">
        <div
          v-for="log in fullLogs"
          :key="log.id"
          class="p-4 rounded-lg border"
          :class="{
            'bg-green-50 border-green-200': log.level === 'info',
            'bg-yellow-50 border-yellow-200': log.level === 'warn',
            'bg-red-50 border-red-200': log.level === 'error',
            'bg-blue-50 border-blue-200': log.level === 'debug'
          }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ log.message }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ log.context }}</p>
              <p class="text-xs text-gray-500 mt-2">{{ formatDate(log.timestamp) }}</p>
            </div>
            <span
              class="px-2 py-1 text-xs rounded uppercase"
              :class="{
                'bg-green-100 text-green-800': log.level === 'info',
                'bg-yellow-100 text-yellow-800': log.level === 'warn',
                'bg-red-100 text-red-800': log.level === 'error',
                'bg-blue-100 text-blue-800': log.level === 'debug'
              }"
            >
              {{ log.level }}
            </span>
          </div>
        </div>
      </div>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
// Layout admin
definePageMeta({
  layout: 'admin'
})

// Head
useHead({
  title: 'Dashboard'
})

// Types
interface ActivityEntry {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
  timestamp: string
}

interface ServiceStatus {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime: number
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down'
  services: ServiceStatus[]
  turso?: {
    connections: number
    avgResponseTime: number
  }
}

interface PerformanceMetrics {
  avgResponseTime: number
  memoryUsage: number
  throughput: number
  uptime: string
  totalRequests: number
  cacheHitRate: number
}

interface ErrorStats {
  last24h: number
  thisWeek: number
  errorRate: number
}

interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context?: string
  stack?: string
  timestamp: string
}

// Composables
const {
  isSyncing,
  syncStatus: adminSyncStatus,
  lastSyncResult,
  syncHealth,
  timeSinceLastSync,
  fetchSyncStatus,
  triggerFullSync,
  triggerProductsSync,
  formatDuration,
  startAutoRefresh
} = useAdminSync()

const {
  logs: systemLogs,
  errorLogs: systemErrorLogs,
  fetchLogs
} = useAdminLogs()

const {
  isLoading: healthLoading,
  healthData,
  overallHealth,
  servicesCounts,
  criticalServices,
  systemPerformance,
  tursoHealth,
  timeSinceLastCheck,
  fetchHealthStatus: fetchRealHealthStatus,
  getStatusColor,
  getStatusBgColor,
  getStatusDotColor,
  formatUptime,
  formatMemoryUsage,
  startAutoRefresh: startHealthAutoRefresh
} = useHealthMonitoring()

// Reactive data
const isLoading = ref(false)
const refreshingHealth = ref(false)
const refreshingActivity = ref(false)
const showErrorLogs = ref(false)
const showFullLogs = ref(false)
const showSyncLogs = ref(false)

const stats = ref({
  products: 0,
  bundles: 0
})

const syncStatus = ref<any>(null)
const healthStatus = ref<HealthStatus | null>(null)

// Data pour les composants UI
const errorStats = ref<ErrorStats>({ last24h: 0, thisWeek: 0, errorRate: 0 })
const recentActivity = ref<ActivityEntry[]>([])
const performance = ref<PerformanceMetrics>({
  avgResponseTime: 150,
  memoryUsage: 65,
  throughput: 45,
  uptime: '2d 14h',
  totalRequests: 2847,
  cacheHitRate: 87
})
const errorLogs = ref<LogEntry[]>([])
const fullLogs = ref<LogEntry[]>([])

// Fetch data on mount
onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchSyncStatus(),
    fetchHealthStatus(),
    fetchRecentActivity(),
    fetchErrorLogs()
  ])

  // Démarrer l'auto-refresh pour les données de sync et santé
  startAutoRefresh(30000) // Refresh sync toutes les 30 secondes
  startHealthAutoRefresh(60000) // Refresh santé toutes les 60 secondes
})

// Fetch functions
async function fetchStats() {
  try {
    isLoading.value = true
    // Fetch basic stats from our APIs
    const [productsRes, bundlesRes] = await Promise.all([
      $fetch('/api/products').catch(() => ({ data: [] })),
      $fetch('/api/campaign-bundles').catch(() => ({ data: [] }))
    ])

    stats.value = {
      products: (productsRes as any).data?.length || 0,
      bundles: (bundlesRes as any).data?.length || 0
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchHealthStatus() {
  try {
    refreshingHealth.value = true
    // Utiliser l'API réelle de monitoring de santé
    const realHealthData = await fetchRealHealthStatus()

    // Mapper vers notre format local pour compatibilité
    healthStatus.value = {
      status: realHealthData.status,
      services: realHealthData.services,
      turso: realHealthData.turso
    }
  } catch (error) {
    console.error('Error fetching health status:', error)
    // Fallback vers des données par défaut
    healthStatus.value = {
      status: 'down',
      services: [
        { name: 'System', status: 'down', responseTime: 0 }
      ],
      turso: {
        connections: 0,
        avgResponseTime: 0
      }
    }
  } finally {
    refreshingHealth.value = false
  }
}

async function fetchRecentActivity() {
  try {
    refreshingActivity.value = true
    // Pour l'instant, on simule l'activité récente
    // À remplacer par une vraie API /api/admin/activity
    recentActivity.value = [
      {
        id: '1',
        type: 'success',
        message: 'Synchronisation produits réussie',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        id: '2',
        type: 'info',
        message: 'Nouveau bundle créé',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: '3',
        type: 'warning',
        message: 'Latence élevée détectée',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ]
  } catch (error) {
    console.error('Error fetching recent activity:', error)
  } finally {
    refreshingActivity.value = false
  }
}

async function fetchErrorLogs() {
  try {
    // Récupérer les logs réels depuis l'API
    await fetchLogs({ level: 'error', limit: 20 })

    // Mapper les logs système vers notre format local
    errorLogs.value = systemErrorLogs.value.map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      stack: log.stackTrace || '',
      timestamp: log.createdAt
    }))

    // Récupérer tous les logs pour la modale complète
    await fetchLogs({ level: 'all', limit: 50 })
    fullLogs.value = systemLogs.value.map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      context: log.context || '',
      timestamp: log.createdAt
    }))

    // Calculer les statistiques d'erreurs
    const errorCount24h = systemLogs.value.filter(log => {
      const logDate = new Date(log.createdAt)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return logDate > yesterday && log.level === 'error'
    }).length

    const errorCountWeek = systemLogs.value.filter(log => {
      const logDate = new Date(log.createdAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return logDate > weekAgo && log.level === 'error'
    }).length

    const totalLogsWeek = systemLogs.value.filter(log => {
      const logDate = new Date(log.createdAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return logDate > weekAgo
    }).length

    errorStats.value = {
      last24h: errorCount24h,
      thisWeek: errorCountWeek,
      errorRate: totalLogsWeek > 0 ? (errorCountWeek / totalLogsWeek) * 100 : 0
    }

  } catch (error) {
    console.error('Error fetching error logs:', error)
    // Fallback vers des données simulées en cas d'erreur
    errorLogs.value = []
    fullLogs.value = []
  }
}

// Refresh functions
async function refreshHealthStatus() {
  await fetchHealthStatus()
}

async function refreshActivity() {
  await fetchRecentActivity()
}

// Utility functions
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getSyncStatusText(status: string): string {
  switch (status) {
    case 'success': return 'Réussie'
    case 'error': return 'Erreur'
    case 'running': return 'En cours'
    case 'never': return 'Jamais exécutée'
    default: return 'Inconnu'
  }
}
</script>