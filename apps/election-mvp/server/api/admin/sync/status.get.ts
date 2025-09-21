/**
 * API Route: GET /api/admin/sync/status
 * Retourne le statut de synchronisation des données
 */

import { getDatabase } from "../../../utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('🔄 GET /api/admin/sync/status - Vérification statut sync')

    const query = getQuery(event)
    const {
      limit = 10,
      offset = 0,
      includeDetails = false
    } = query

    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Statistiques de base
    const stats = {
      products: {
        turso: 0,
        airtable: 0,
        lastSync: null,
        syncStatus: 'unknown'
      },
      bundles: {
        turso: 0,
        airtable: 0,
        lastSync: null,
        syncStatus: 'unknown'
      },
      categories: {
        turso: 0,
        airtable: 0,
        lastSync: null,
        syncStatus: 'unknown'
      }
    }

    // Compter les produits Turso
    try {
      const productsResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM products',
        args: []
      })
      stats.products.turso = Number(productsResult.rows[0]?.count) || 0
      stats.products.syncStatus = 'operational'
    } catch (error) {
      console.warn('⚠️ Impossible de compter les produits Turso:', error)
      stats.products.syncStatus = 'error'
    }

    // Compter les bundles Turso
    try {
      const bundlesResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM campaign_bundles',
        args: []
      })
      stats.bundles.turso = Number(bundlesResult.rows[0]?.count) || 0
      stats.bundles.syncStatus = 'operational'
    } catch (error) {
      console.warn('⚠️ Impossible de compter les bundles Turso:', error)
      stats.bundles.syncStatus = 'error'
    }

    // Compter les catégories Turso
    try {
      const categoriesResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM categories',
        args: []
      })
      stats.categories.turso = Number(categoriesResult.rows[0]?.count) || 0
      stats.categories.syncStatus = 'operational'
    } catch (error) {
      console.warn('⚠️ Impossible de compter les catégories Turso:', error)
      stats.categories.syncStatus = 'error'
    }

    // Obtenir les dernières synchronisations depuis les logs
    try {
      // S'assurer que la table system_logs existe
      await db.execute({
        sql: `CREATE TABLE IF NOT EXISTS system_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          context TEXT,
          source TEXT,
          stack_trace TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        args: []
      })

      const syncLogsResult = await db.execute({
        sql: `
          SELECT context, created_at, message
          FROM system_logs
          WHERE source = 'sync' AND level = 'info'
          ORDER BY created_at DESC
          LIMIT 10
        `,
        args: []
      })

      // Analyser les logs pour déterminer les dernières sync
      syncLogsResult.rows.forEach((row: any) => {
        const context = row.context
        const createdAt = row.created_at

        if (context?.includes('products')) {
          if (!stats.products.lastSync || createdAt > stats.products.lastSync) {
            stats.products.lastSync = createdAt
          }
        }
        if (context?.includes('bundles')) {
          if (!stats.bundles.lastSync || createdAt > stats.bundles.lastSync) {
            stats.bundles.lastSync = createdAt
          }
        }
        if (context?.includes('categories')) {
          if (!stats.categories.lastSync || createdAt > stats.categories.lastSync) {
            stats.categories.lastSync = createdAt
          }
        }
      })
    } catch (error) {
      console.warn('⚠️ Impossible de récupérer les logs de sync:', error)
    }

    // Statut global
    const globalStatus = {
      overall: 'operational',
      services: {
        turso: 'operational',
        airtable: 'deprecated' // Note: migration en cours
      },
      migration: {
        status: 'in_progress',
        phase: 'data_validation',
        completion: 75,
        nextStep: 'complete_api_migration'
      }
    }

    // Déterminer le statut global
    const hasErrors = [stats.products, stats.bundles, stats.categories]
      .some(item => item.syncStatus === 'error')

    if (hasErrors) {
      globalStatus.overall = 'degraded'
    }

    const response = {
      success: true,
      data: {
        status: globalStatus,
        stats,
        lastUpdate: new Date().toISOString(),
        migration: {
          fromAirtable: true,
          toTurso: true,
          phase: 'API_MIGRATION',
          estimatedCompletion: '2025-01-25'
        }
      },
      duration: Date.now() - startTime
    }

    // Inclure les détails si demandé
    if (includeDetails === 'true' || includeDetails === true) {
      response.data.details = {
        databaseHealth: {
          turso: 'connected',
          tablesAccessible: true,
          lastHealthCheck: new Date().toISOString()
        },
        recentActivity: {
          products: stats.products.turso > 0 ? 'active' : 'inactive',
          bundles: stats.bundles.turso > 0 ? 'active' : 'inactive',
          categories: stats.categories.turso > 0 ? 'active' : 'inactive'
        }
      }
    }

    console.log(`✅ Sync status récupéré (${Object.keys(stats).length} types de données)`)
    return response

  } catch (error) {
    console.error('❌ Erreur GET /api/admin/sync/status:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération du statut de synchronisation',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})