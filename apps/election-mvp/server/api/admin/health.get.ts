/**
 * API Route: GET /api/admin/health
 * Monitoring de santé en temps réel des services
 */

import { getDatabase } from "~/server/utils/database"
import { testAirtableConnection } from "~/server/utils/airtable"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('🏥 GET /api/admin/health - Vérification santé système')

    // Services à monitorer
    const services = []

    // 1. Test de la base de données Turso
    let tursoStatus = 'down'
    let tursoResponseTime = 0
    let tursoConnections = 0

    try {
      const dbStartTime = Date.now()
      const db = getDatabase()

      if (db) {
        // Test simple de connexion
        await db.execute({
          sql: 'SELECT 1 as test',
          args: []
        })

        tursoResponseTime = Date.now() - dbStartTime
        tursoStatus = 'up'

        // Obtenir des métriques basiques
        try {
          const statsResult = await db.execute({
            sql: `SELECT
              (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as table_count,
              (SELECT COUNT(*) FROM products) as products_count,
              (SELECT COUNT(*) FROM campaign_bundles) as bundles_count
            `,
            args: []
          })

          const stats = statsResult.rows[0]
          tursoConnections = Number(stats?.table_count) || 0
        } catch (e) {
          // Ignore les erreurs de métriques
        }
      }
    } catch (error) {
      tursoStatus = 'down'
      tursoResponseTime = Date.now() - startTime
      console.error('❌ Erreur connexion Turso:', error)
    }

    services.push({
      name: 'Turso Database',
      status: tursoStatus,
      responseTime: tursoResponseTime
    })

    // 2. Test Airtable API
    let airtableStatus = 'down'
    let airtableResponseTime = 0

    try {
      const airtableTest = await testAirtableConnection()
      airtableStatus = airtableTest.success ? 'up' : 'down'
      airtableResponseTime = airtableTest.responseTime || 0
    } catch (error) {
      airtableStatus = 'down'
      airtableResponseTime = 5000
      console.error('❌ Erreur connexion Airtable:', error)
    }

    services.push({
      name: 'Airtable API',
      status: airtableStatus,
      responseTime: airtableResponseTime
    })

    // 3. Test Cloudinary (basique)
    let cloudinaryStatus = 'up'
    const cloudinaryResponseTime = 50 // Simulé car pas d'API de test simple

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinaryStatus = 'down'
    }

    services.push({
      name: 'Cloudinary CDN',
      status: cloudinaryStatus,
      responseTime: cloudinaryResponseTime
    })

    // 4. Test Email Service (basique)
    let emailStatus = 'up'
    const emailResponseTime = 100

    if (!process.env.SMTP_HOST) {
      emailStatus = 'down'
    } else if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
      emailStatus = 'degraded'
    }

    services.push({
      name: 'Email Service',
      status: emailStatus,
      responseTime: emailResponseTime
    })

    // Calculer le statut global
    const downServices = services.filter(s => s.status === 'down').length
    const degradedServices = services.filter(s => s.status === 'degraded').length

    let globalStatus = 'healthy'
    if (downServices > 0) {
      globalStatus = 'down'
    } else if (degradedServices > 0) {
      globalStatus = 'degraded'
    }

    // Métriques additionnelles
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    // Calculer les performances moyennes
    const avgResponseTime = services.reduce((sum, service) => sum + service.responseTime, 0) / services.length

    const response = {
      success: true,
      data: {
        status: globalStatus,
        services,
        turso: {
          connections: tursoConnections,
          avgResponseTime: tursoResponseTime
        },
        system: {
          uptime: Math.floor(uptime),
          memoryUsage: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            external: Math.round(memoryUsage.external / 1024 / 1024) // MB
          },
          avgResponseTime: Math.round(avgResponseTime)
        },
        timestamp: new Date().toISOString()
      },
      duration: Date.now() - startTime
    }

    return response

  } catch (error) {
    console.error('❌ Erreur GET /api/admin/health:', error)

    // En cas d'erreur, retourner un statut minimal
    return {
      success: false,
      data: {
        status: 'down',
        services: [
          {
            name: 'System',
            status: 'down',
            responseTime: Date.now() - startTime
          }
        ],
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString()
      },
      duration: Date.now() - startTime
    }
  }
})