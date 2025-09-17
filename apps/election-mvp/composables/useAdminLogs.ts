/**
 * Composable pour la gestion des logs système
 */

interface LogEntry {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context?: string
  source?: string
  stackTrace?: string
  metadata?: Record<string, any>
  createdAt: string
}

interface LogStats {
  levelStats: Record<string, number>
  activeSources: Array<{
    source: string
    count: number
  }>
  totalLogs: number
}

interface LogFilters {
  level: string
  source?: string
  startDate?: string
  endDate?: string
  search?: string
}

interface LogsResponse {
  logs: LogEntry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  stats: LogStats
  filters: LogFilters
}

export const useAdminLogs = () => {
  const isLoading = ref(false)
  const logs = ref<LogEntry[]>([])
  const stats = ref<LogStats | null>(null)
  const filters = ref<LogFilters>({
    level: 'all'
  })
  const error = ref<string | null>(null)

  // Fetch logs with filters
  const fetchLogs = async (options: {
    level?: string
    limit?: number
    offset?: number
    startDate?: string
    endDate?: string
    source?: string
    search?: string
  } = {}) => {
    try {
      isLoading.value = true
      error.value = null

      const queryParams = {
        level: options.level || 'all',
        limit: options.limit || 50,
        offset: options.offset || 0,
        startDate: options.startDate,
        endDate: options.endDate,
        source: options.source,
        search: options.search
      }

      // Remove undefined values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key as keyof typeof queryParams] === undefined) {
          delete queryParams[key as keyof typeof queryParams]
        }
      })

      const response: { data: LogsResponse } = await $fetch('/api/admin/logs', {
        query: queryParams
      })

      logs.value = response.data.logs
      stats.value = response.data.stats
      filters.value = response.data.filters

      return response.data
    } catch (err) {
      console.error('Erreur récupération logs:', err)
      error.value = err instanceof Error ? err.message : 'Erreur inconnue'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Filter logs by level
  const filterByLevel = (level: string) => {
    return fetchLogs({ ...filters.value, level })
  }

  // Filter logs by source
  const filterBySource = (source: string) => {
    return fetchLogs({ ...filters.value, source })
  }

  // Search logs
  const searchLogs = (searchTerm: string) => {
    return fetchLogs({ ...filters.value, search: searchTerm })
  }

  // Filter logs by date range
  const filterByDateRange = (startDate: string, endDate: string) => {
    return fetchLogs({
      ...filters.value,
      startDate,
      endDate
    })
  }

  // Get logs by level
  const logsByLevel = computed(() => {
    return logs.value.reduce((acc, log) => {
      if (!acc[log.level]) {
        acc[log.level] = []
      }
      acc[log.level].push(log)
      return acc
    }, {} as Record<string, LogEntry[]>)
  })

  // Error logs only
  const errorLogs = computed(() => {
    return logs.value.filter(log => log.level === 'error')
  })

  // Recent critical logs (last 24h)
  const recentCriticalLogs = computed(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return logs.value.filter(log => {
      const logDate = new Date(log.createdAt)
      return logDate > yesterday && ['error', 'warn'].includes(log.level)
    })
  })

  // Format log level for display
  const formatLogLevel = (level: string) => {
    const levelMap: Record<string, string> = {
      info: 'Info',
      warn: 'Attention',
      error: 'Erreur',
      debug: 'Debug'
    }
    return levelMap[level] || level
  }

  // Get log level color
  const getLogLevelColor = (level: string) => {
    const colorMap: Record<string, string> = {
      info: 'text-blue-600',
      warn: 'text-yellow-600',
      error: 'text-red-600',
      debug: 'text-gray-600'
    }
    return colorMap[level] || 'text-gray-600'
  }

  // Get log level background color
  const getLogLevelBgColor = (level: string) => {
    const bgColorMap: Record<string, string> = {
      info: 'bg-blue-50 border-blue-200',
      warn: 'bg-yellow-50 border-yellow-200',
      error: 'bg-red-50 border-red-200',
      debug: 'bg-gray-50 border-gray-200'
    }
    return bgColorMap[level] || 'bg-gray-50 border-gray-200'
  }

  // Get log level badge color
  const getLogLevelBadgeColor = (level: string) => {
    const badgeColorMap: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warn: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800'
    }
    return badgeColorMap[level] || 'bg-gray-100 text-gray-800'
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Calculate time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

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
  }

  // Auto-refresh logs
  const startAutoRefresh = (intervalMs = 30000) => {
    const interval = setInterval(() => {
      fetchLogs(filters.value)
    }, intervalMs)

    onBeforeUnmount(() => {
      clearInterval(interval)
    })

    return () => clearInterval(interval)
  }

  return {
    // État
    isLoading: readonly(isLoading),
    logs: readonly(logs),
    stats: readonly(stats),
    filters: readonly(filters),
    error: readonly(error),

    // Données calculées
    logsByLevel,
    errorLogs,
    recentCriticalLogs,

    // Actions
    fetchLogs,
    filterByLevel,
    filterBySource,
    searchLogs,
    filterByDateRange,

    // Utilitaires
    formatLogLevel,
    getLogLevelColor,
    getLogLevelBgColor,
    getLogLevelBadgeColor,
    formatDate,
    timeAgo,
    startAutoRefresh
  }
}