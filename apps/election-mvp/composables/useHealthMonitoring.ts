/**
 * Composable pour le monitoring de santé des services
 */

interface ServiceStatus {
  name: string
  status: 'up' | 'down' | 'degraded'
  responseTime: number
}

interface SystemMetrics {
  uptime: number
  memoryUsage: {
    used: number
    total: number
    external: number
  }
  avgResponseTime: number
}

interface TursoMetrics {
  connections: number
  avgResponseTime: number
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'down'
  services: ServiceStatus[]
  turso: TursoMetrics
  system: SystemMetrics
  timestamp: string
}

export const useHealthMonitoring = () => {
  const isLoading = ref(false)
  const healthData = ref<HealthData | null>(null)
  const error = ref<string | null>(null)
  const lastChecked = ref<string | null>(null)

  // Fetch health status
  const fetchHealthStatus = async () => {
    try {
      isLoading.value = true
      error.value = null

      const response: { data: HealthData } = await $fetch('/api/admin/health')
      healthData.value = response.data
      lastChecked.value = new Date().toISOString()

      return response.data
    } catch (err) {
      console.error('Erreur récupération santé système:', err)
      error.value = err instanceof Error ? err.message : 'Erreur inconnue'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get service by name
  const getServiceStatus = (serviceName: string) => {
    return computed(() => {
      return healthData.value?.services.find(service =>
        service.name.toLowerCase().includes(serviceName.toLowerCase())
      )
    })
  }

  // Compute overall health status
  const overallHealth = computed(() => {
    if (!healthData.value) {
      return { status: 'unknown', message: 'Statut inconnu' }
    }

    const { status } = healthData.value

    switch (status) {
      case 'healthy':
        return { status: 'healthy', message: 'Excellent', color: 'green' }
      case 'degraded':
        return { status: 'degraded', message: 'Attention', color: 'yellow' }
      case 'down':
        return { status: 'down', message: 'Problème', color: 'red' }
      default:
        return { status: 'unknown', message: 'Inconnu', color: 'gray' }
    }
  })

  // Services status counts
  const servicesCounts = computed(() => {
    if (!healthData.value) {
      return { up: 0, down: 0, degraded: 0, total: 0 }
    }

    const services = healthData.value.services
    return {
      up: services.filter(s => s.status === 'up').length,
      down: services.filter(s => s.status === 'down').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      total: services.length
    }
  })

  // Critical services (database, essential APIs)
  const criticalServices = computed(() => {
    if (!healthData.value) return []

    return healthData.value.services.filter(service =>
      ['turso', 'database', 'airtable'].some(critical =>
        service.name.toLowerCase().includes(critical)
      )
    )
  })

  // System performance status
  const systemPerformance = computed(() => {
    if (!healthData.value?.system) {
      return { status: 'unknown', message: 'Non disponible' }
    }

    const { system } = healthData.value
    const memoryUsagePercent = (system.memoryUsage.used / system.memoryUsage.total) * 100

    if (system.avgResponseTime > 2000 || memoryUsagePercent > 90) {
      return { status: 'critical', message: 'Performance dégradée', color: 'red' }
    } else if (system.avgResponseTime > 1000 || memoryUsagePercent > 70) {
      return { status: 'warning', message: 'Performance modérée', color: 'yellow' }
    } else {
      return { status: 'good', message: 'Performance optimale', color: 'green' }
    }
  })

  // Turso database health
  const tursoHealth = computed(() => {
    const tursoService = getServiceStatus('turso').value
    const tursoMetrics = healthData.value?.turso

    if (!tursoService || !tursoMetrics) {
      return { status: 'unknown', message: 'Non disponible' }
    }

    if (tursoService.status === 'down') {
      return { status: 'down', message: 'Hors ligne', color: 'red' }
    } else if (tursoService.responseTime > 1000) {
      return { status: 'slow', message: 'Lent', color: 'yellow' }
    } else {
      return { status: 'healthy', message: 'Opérationnel', color: 'green' }
    }
  })

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)

    if (days > 0) {
      return `${days}j ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Format memory usage
  const formatMemoryUsage = (mb: number) => {
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)} GB`
    } else {
      return `${mb} MB`
    }
  }

  // Get status color class
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      up: 'text-green-600',
      down: 'text-red-600',
      degraded: 'text-yellow-600',
      healthy: 'text-green-600',
      unknown: 'text-gray-600'
    }
    return colorMap[status] || 'text-gray-600'
  }

  // Get status background color
  const getStatusBgColor = (status: string) => {
    const bgColorMap: Record<string, string> = {
      up: 'bg-green-50',
      down: 'bg-red-50',
      degraded: 'bg-yellow-50',
      healthy: 'bg-green-50',
      unknown: 'bg-gray-50'
    }
    return bgColorMap[status] || 'bg-gray-50'
  }

  // Get status dot color
  const getStatusDotColor = (status: string) => {
    const dotColorMap: Record<string, string> = {
      up: 'bg-green-500',
      down: 'bg-red-500',
      degraded: 'bg-yellow-500',
      healthy: 'bg-green-500',
      unknown: 'bg-gray-500'
    }
    return dotColorMap[status] || 'bg-gray-500'
  }

  // Time since last check
  const timeSinceLastCheck = computed(() => {
    if (!lastChecked.value) return 'Jamais'

    const lastCheck = new Date(lastChecked.value)
    const now = new Date()
    const diffMs = now.getTime() - lastCheck.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)

    if (diffSeconds < 60) {
      return 'À l\'instant'
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60)
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else {
      const hours = Math.floor(diffSeconds / 3600)
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    }
  })

  // Auto-refresh health status
  const startAutoRefresh = (intervalMs = 60000) => {
    const interval = setInterval(() => {
      fetchHealthStatus()
    }, intervalMs)

    onBeforeUnmount(() => {
      clearInterval(interval)
    })

    return () => clearInterval(interval)
  }

  return {
    // État
    isLoading: readonly(isLoading),
    healthData: readonly(healthData),
    error: readonly(error),
    lastChecked: readonly(lastChecked),

    // Données calculées
    overallHealth,
    servicesCounts,
    criticalServices,
    systemPerformance,
    tursoHealth,
    timeSinceLastCheck,

    // Actions
    fetchHealthStatus,
    getServiceStatus,

    // Utilitaires
    formatUptime,
    formatMemoryUsage,
    getStatusColor,
    getStatusBgColor,
    getStatusDotColor,
    startAutoRefresh
  }
}