/**
 * API Route: GET /api/health
 * Health check pour monitoring de l'infrastructure Turso-first
 */

import { getDatabase } from '../utils/database'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('🏥 Health check démarré...')

    // Test de santé Turso uniquement (abandon Airtable complet)
    const healthChecks = await Promise.allSettled([
      // Test Turso
      (async () => {
        const tursoClient = getDatabase()
        if (!tursoClient) {
          return { name: 'turso', status: 'down', error: 'Client non configuré' }
        }

        try {
          const startTurso = Date.now()
          await tursoClient.execute('SELECT 1')
          return {
            name: 'turso',
            status: 'up',
            responseTime: Date.now() - startTurso,
            url: process.env.TURSO_DATABASE_URL?.split('@')[1] || 'masked'
          }
        } catch (error) {
          return {
            name: 'turso',
            status: 'down',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          }
        }
      })()
    ])

    // Analyse des résultats
    const services = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        const serviceNames = ['turso']
        return {
          name: serviceNames[index] || `service-${index}`,
          status: 'error',
          error: result.reason
        }
      }
    })

    // Statut global
    const allUp = services.every(service => service.status === 'up')
    const someUp = services.some(service => service.status === 'up')

    let overallStatus = 'down'
    if (allUp) {
      overallStatus = 'healthy'
    } else if (someUp) {
      overallStatus = 'degraded'
    }

    const duration = Date.now() - startTime

    // Headers pour monitoring
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
    setHeader(event, 'Content-Type', 'application/json')

    // Status HTTP selon l'état
    if (overallStatus === 'healthy') {
      setResponseStatus(event, 200)
    } else if (overallStatus === 'degraded') {
      setResponseStatus(event, 206) // Partial Content
    } else {
      setResponseStatus(event, 503) // Service Unavailable
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      duration,
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      summary: {
        total: services.length,
        up: services.filter(s => s.status === 'up').length,
        down: services.filter(s => s.status === 'down').length,
        partial: services.filter(s => s.status === 'partial').length
      },
      recommendations: generateRecommendations(services)
    }

    console.log(`🏥 Health check terminé: ${overallStatus} (${duration}ms)`)
    return response

  } catch (error) {
    console.error('❌ Erreur health check:', error)

    setResponseStatus(event, 500)
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Erreur interne',
      services: [],
      summary: { total: 0, up: 0, down: 0, partial: 0 },
      recommendations: ['Vérifier les logs serveur', 'Redémarrer l\'application']
    }
  }
})

function generateRecommendations(services: any[]): string[] {
  const recommendations = []

  const tursoService = services.find(s => s.name === 'turso')

  if (tursoService?.status === 'down') {
    recommendations.push('Vérifier la connexion Turso et les variables d\'environnement')
    recommendations.push('Le mode fallback statique est activé')
  }

  if (services.every(s => s.status === 'down')) {
    recommendations.push('Vérifier la connectivité réseau')
    recommendations.push('Tous les APIs utilisent le mode fallback statique')
  }

  if (services.some(s => s.responseTime && s.responseTime > 2000)) {
    recommendations.push('Performances dégradées détectées')
  }

  if (recommendations.length === 0) {
    recommendations.push('Infrastructure Turso fonctionne parfaitement')
    recommendations.push('Migration Airtable → Turso terminée avec succès')
  }

  return recommendations
}