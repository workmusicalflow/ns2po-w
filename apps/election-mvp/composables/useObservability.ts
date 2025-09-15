/**
 * Composable d'observabilité pour NS2PO Election MVP
 * Permet de tracer les actions utilisateur et les calculs métier
 * dans les DevTools pour faciliter le debug et les tests
 */

export interface DebugLogEntry {
  timestamp: string
  module: string
  method: string
  data: any
  type: 'info' | 'warn' | 'error'
}

export const useObservability = () => {
  const isDevMode = process.env.NODE_ENV === 'development'
  
  /**
   * Log centralisé pour l'observabilité
   */
  const debugLog = (
    module: string,
    method: string, 
    data: any, 
    type: 'info' | 'warn' | 'error' = 'info'
  ) => {
    if (!isDevMode) return
    
    const timestamp = new Date().toISOString()
    const logData: DebugLogEntry = {
      timestamp,
      module,
      method,
      data,
      type
    }
    
    // Console formatée
    console.group(`🔍 [NS2PO Debug] ${module}.${method}`)
    console[type]('Timestamp:', timestamp)
    console[type]('Data:', data)
    console.groupEnd()
    
    // Stockage global pour inspection
    if (typeof window !== 'undefined') {
      window.__NS2PO_DEBUG__ = window.__NS2PO_DEBUG__ || []
      window.__NS2PO_DEBUG__.push(logData)
      
      // Garder seulement les 100 derniers logs
      if (window.__NS2PO_DEBUG__.length > 100) {
        window.__NS2PO_DEBUG__.shift()
      }
    }
  }

  /**
   * Log spécialisé pour les calculs de prix
   */
  const logPriceCalculation = (
    productName: string,
    basePrice: number,
    quantity: number,
    customizations: any[],
    result: any
  ) => {
    debugLog('PriceCalculator', 'calculate', {
      product: productName,
      basePrice,
      quantity,
      customizations,
      result: {
        unitPrice: result.unitPrice,
        totalPrice: result.totalPrice,
        customizationsCost: result.customizationsCost
      }
    })
  }

  /**
   * Log spécialisé pour les interactions utilisateur
   */
  const logUserInteraction = (
    component: string,
    action: string,
    details: any
  ) => {
    debugLog('UserInteraction', `${component}.${action}`, details)
  }

  /**
   * Log spécialisé pour les uploads Cloudinary
   */
  const logCloudinaryUpload = (
    preset: string,
    result: any,
    error?: string
  ) => {
    if (error) {
      debugLog('Cloudinary', 'uploadError', { preset, error }, 'error')
    } else {
      debugLog('Cloudinary', 'uploadSuccess', { preset, url: result.secure_url })
    }
  }

  /**
   * Log spécialisé pour les performances Canvas
   */
  const logCanvasPerformance = (
    operation: string,
    duration: number,
    details: any
  ) => {
    if (duration > 16) { // > 16ms peut causer des problèmes de fluidité
      debugLog('CanvasPerformance', operation, { duration, details }, 'warn')
    } else {
      debugLog('CanvasPerformance', operation, { duration, details })
    }
  }

  /**
   * Fonction utilitaire pour exporter les logs
   */
  const exportDebugLogs = () => {
    if (typeof window !== 'undefined' && window.__NS2PO_DEBUG__) {
      const logs = window.__NS2PO_DEBUG__
      const dataStr = JSON.stringify(logs, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `ns2po-debug-logs-${new Date().toISOString()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      console.info('📊 Debug logs exported successfully')
    }
  }

  /**
   * Fonction utilitaire pour vider les logs
   */
  const clearDebugLogs = () => {
    if (typeof window !== 'undefined') {
      window.__NS2PO_DEBUG__ = []
      console.info('🧹 Debug logs cleared')
    }
  }

  /**
   * Fonction utilitaire pour obtenir les statistiques des logs
   */
  const getDebugStats = () => {
    if (typeof window !== 'undefined' && window.__NS2PO_DEBUG__) {
      const logs = window.__NS2PO_DEBUG__
      const stats = {
        total: logs.length,
        byModule: {} as Record<string, number>,
        byType: { info: 0, warn: 0, error: 0 },
        timeRange: {
          start: logs[0]?.timestamp,
          end: logs[logs.length - 1]?.timestamp
        }
      }
      
      logs.forEach(log => {
        stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1
        stats.byType[log.type]++
      })
      
      return stats
    }
    return null
  }

  /**
   * Track des interactions avec les réalisations pour l'analytique
   */
  const trackRealisationInteraction = (action: string, data: {
    realisationId: string
    realisationTitle: string
    variant?: string
    [key: string]: any
  }) => {
    debugLog('RealisationTracking', action, data)
    
    // Intégration GA4
    if (typeof window !== 'undefined') {
      const { trackRealisationInteraction: gaTrackRealisation } = useGoogleAnalytics()
      gaTrackRealisation(action as any, data)
    }
  }

  /**
   * Track des conversions inspiration -> devis
   */
  const trackInspirationConversion = (data: {
    realisationId: string
    productIds: string[]
    quoteValue?: number
    [key: string]: any
  }) => {
    debugLog('ConversionTracking', 'inspiration_conversion', data)
    
    // Intégration GA4
    if (typeof window !== 'undefined') {
      const { trackInspirationConversion: gaTrackConversion } = useGoogleAnalytics()
      gaTrackConversion(data)
    }
  }

  /**
   * Track du parcours utilisateur
   */
  const trackUserJourney = (step: string, context: Record<string, any> = {}) => {
    debugLog('UserJourney', step, context)
    
    // Intégration GA4
    if (typeof window !== 'undefined') {
      const { trackUserJourney: gaTrackJourney } = useGoogleAnalytics()
      gaTrackJourney({ step, context })
    }
  }

  // Exposer les fonctions utilitaires dans window pour la console
  if (typeof window !== 'undefined' && isDevMode) {
    window.__NS2PO_UTILS__ = {
      exportLogs: exportDebugLogs,
      clearLogs: clearDebugLogs,
      getStats: getDebugStats,
      logs: () => window.__NS2PO_DEBUG__ || []
    }
    
    // Afficher un message d'info au chargement
    console.info(`
🔍 NS2PO Debug Mode Activé
━━━━━━━━━━━━━━━━━━━━━━━━━
Commandes disponibles dans la console :
• window.__NS2PO_UTILS__.logs() - Voir tous les logs
• window.__NS2PO_UTILS__.getStats() - Statistiques des logs  
• window.__NS2PO_UTILS__.exportLogs() - Exporter en JSON
• window.__NS2PO_UTILS__.clearLogs() - Vider les logs
━━━━━━━━━━━━━━━━━━━━━━━━━
`)
  }

  return {
    debugLog,
    logPriceCalculation,
    logUserInteraction,
    logCloudinaryUpload,
    logCanvasPerformance,
    exportDebugLogs,
    clearDebugLogs,
    getDebugStats,
    trackRealisationInteraction,
    trackInspirationConversion,
    trackUserJourney
  }
}

// Extension des types Window pour TypeScript
declare global {
  interface Window {
    __NS2PO_DEBUG__: DebugLogEntry[]
    __NS2PO_UTILS__: {
      exportLogs: () => void
      clearLogs: () => void
      getStats: () => any
      logs: () => DebugLogEntry[]
    }
  }
}