/**
 * Composable pour la gestion des synchronisations administrateur
 */

interface SyncStatus {
  isRunning: boolean
  currentSync: any
  stats: {
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    partialSyncs: number
    totalItemsSynced: number
    totalErrors: number
    avgDuration: number
    lastSyncAt: string | null
    successRate: string
  }
  recentSyncs: Array<{
    id: string
    syncType: string
    status: string
    itemsSynced: number
    errorsCount: number
    duration: number
    details?: any
    createdAt: string
  }>
  recentErrors: Array<{
    syncType: string
    errors: string[]
    createdAt: string
  }>
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

interface SyncResult {
  syncType: string
  startTime: string
  endTime: string | null
  duration: number
  products: { synced: number; errors: number }
  bundles: { synced: number; errors: number }
  categories: { synced: number; errors: number }
  errors: string[]
}

export const useAdminSync = () => {
  const isLoading = ref(false)
  const isSyncing = ref(false)
  const syncStatus = ref<SyncStatus | null>(null)
  const lastSyncResult = ref<SyncResult | null>(null)
  const error = ref<string | null>(null)

  // Récupérer le statut des synchronisations
  const fetchSyncStatus = async (options: {
    limit?: number
    offset?: number
    includeDetails?: boolean
  } = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const { data } = await $fetch('/api/admin/sync/status', {
        query: {
          limit: options.limit || 10,
          offset: options.offset || 0,
          includeDetails: options.includeDetails || false
        }
      })

      syncStatus.value = data
      return data
    } catch (err) {
      console.error('Erreur récupération statut sync:', err)
      error.value = err instanceof Error ? err.message : 'Erreur inconnue'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Déclencher une synchronisation manuelle
  const triggerSync = async (syncType: 'all' | 'products' | 'bundles' | 'categories' = 'all', force = false) => {
    try {
      isSyncing.value = true
      error.value = null

      console.log(`🔄 Déclenchement synchronisation ${syncType}...`)

      const { data } = await $fetch('/api/admin/sync/trigger', {
        method: 'POST',
        body: {
          syncType,
          force
        }
      })

      lastSyncResult.value = data

      // Rafraîchir le statut après la synchronisation
      await fetchSyncStatus()

      console.log(`✅ Synchronisation ${syncType} terminée:`, data)
      return data
    } catch (err) {
      console.error('Erreur synchronisation:', err)
      error.value = err instanceof Error ? err.message : 'Erreur lors de la synchronisation'
      throw err
    } finally {
      isSyncing.value = false
    }
  }

  // Déclencher une synchronisation complète
  const triggerFullSync = () => triggerSync('all')

  // Déclencher une synchronisation des produits uniquement
  const triggerProductsSync = () => triggerSync('products')

  // Déclencher une synchronisation des bundles uniquement
  const triggerBundlesSync = () => triggerSync('bundles')

  // Déclencher une synchronisation des catégories uniquement
  const triggerCategoriesSync = () => triggerSync('categories')

  // Calculer le temps depuis la dernière synchronisation
  const timeSinceLastSync = computed(() => {
    if (!syncStatus.value?.stats.lastSyncAt) {
      return 'Jamais'
    }

    const lastSync = new Date(syncStatus.value.stats.lastSyncAt)
    const now = new Date()
    const diffMs = now.getTime() - lastSync.getTime()

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) {
      return 'À l\'instant'
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
    } else {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    }
  })

  // Formatage de la durée
  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`
    } else {
      return `${(ms / 60000).toFixed(1)}min`
    }
  }

  // État de santé des synchronisations
  const syncHealth = computed(() => {
    if (!syncStatus.value) {
      return { status: 'unknown', message: 'Statut inconnu' }
    }

    const { stats } = syncStatus.value
    const successRate = parseFloat(stats.successRate)

    if (successRate >= 95) {
      return { status: 'healthy', message: 'Excellent' }
    } else if (successRate >= 80) {
      return { status: 'warning', message: 'Attention' }
    } else {
      return { status: 'error', message: 'Problème' }
    }
  })

  // Auto-refresh du statut
  const startAutoRefresh = (intervalMs = 30000) => {
    const interval = setInterval(() => {
      if (!isSyncing.value) {
        fetchSyncStatus()
      }
    }, intervalMs)

    // Nettoyer l'interval quand le composable est détruit
    onBeforeUnmount(() => {
      clearInterval(interval)
    })

    return () => clearInterval(interval)
  }

  return {
    // État
    isLoading: readonly(isLoading),
    isSyncing: readonly(isSyncing),
    syncStatus: readonly(syncStatus),
    lastSyncResult: readonly(lastSyncResult),
    error: readonly(error),

    // Données calculées
    timeSinceLastSync,
    syncHealth,

    // Actions
    fetchSyncStatus,
    triggerSync,
    triggerFullSync,
    triggerProductsSync,
    triggerBundlesSync,
    triggerCategoriesSync,

    // Utilitaires
    formatDuration,
    startAutoRefresh
  }
}