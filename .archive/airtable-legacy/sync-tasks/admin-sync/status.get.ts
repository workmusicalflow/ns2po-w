/**
 * API Route: GET /api/admin/sync/status
 * Récupère le statut des synchronisations et l'historique
 */

import { getDatabase } from "~/server/utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('📊 GET /api/admin/sync/status - Récupération statut synchronisation')

    const query = getQuery(event)
    const { limit = 10, offset = 0, includeDetails = false } = query

    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Récupérer l'historique des synchronisations
    const syncLogsResult = await db.execute({
      sql: `SELECT
        id, sync_type, status, items_synced, errors_count, duration,
        details, created_at
      FROM sync_logs
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      args: [Number(limit), Number(offset)]
    })

    const syncLogs = syncLogsResult.rows.map((row: any) => ({
      id: row.id,
      syncType: row.sync_type,
      status: row.status,
      itemsSynced: Number(row.items_synced) || 0,
      errorsCount: Number(row.errors_count) || 0,
      duration: Number(row.duration) || 0,
      details: includeDetails && row.details ? JSON.parse(row.details) : null,
      createdAt: row.created_at
    }))

    // Calculer les statistiques récentes
    const statsResult = await db.execute({
      sql: `SELECT
        COUNT(*) as total_syncs,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_syncs,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_syncs,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_syncs,
        SUM(items_synced) as total_items_synced,
        SUM(errors_count) as total_errors,
        AVG(duration) as avg_duration,
        MAX(created_at) as last_sync_at
      FROM sync_logs
      WHERE created_at >= datetime('now', '-24 hours')`,
      args: []
    })

    const stats = statsResult.rows[0] ? {
      totalSyncs: Number(statsResult.rows[0].total_syncs) || 0,
      successfulSyncs: Number(statsResult.rows[0].successful_syncs) || 0,
      failedSyncs: Number(statsResult.rows[0].failed_syncs) || 0,
      partialSyncs: Number(statsResult.rows[0].partial_syncs) || 0,
      totalItemsSynced: Number(statsResult.rows[0].total_items_synced) || 0,
      totalErrors: Number(statsResult.rows[0].total_errors) || 0,
      avgDuration: Number(statsResult.rows[0].avg_duration) || 0,
      lastSyncAt: statsResult.rows[0].last_sync_at
    } : {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      partialSyncs: 0,
      totalItemsSynced: 0,
      totalErrors: 0,
      avgDuration: 0,
      lastSyncAt: null
    }

    // Vérifier s'il y a une synchronisation en cours
    // Note: Dans une vraie application, on utiliserait Redis ou une autre solution
    // Pour l'instant, on considère qu'il n'y en a pas
    const isRunning = false
    const currentSync = null

    // Récupérer les dernières erreurs
    const recentErrorsResult = await db.execute({
      sql: `SELECT
        sync_type, details, created_at
      FROM sync_logs
      WHERE status IN ('error', 'partial') AND errors_count > 0
      ORDER BY created_at DESC
      LIMIT 5`,
      args: []
    })

    const recentErrors = recentErrorsResult.rows.map((row: any) => {
      let errorDetails = []
      try {
        const details = JSON.parse(row.details || '{}')
        errorDetails = details.errors || []
      } catch (e) {
        errorDetails = []
      }

      return {
        syncType: row.sync_type,
        errors: errorDetails,
        createdAt: row.created_at
      }
    })

    const response = {
      success: true,
      data: {
        isRunning,
        currentSync,
        stats: {
          ...stats,
          successRate: stats.totalSyncs > 0 ?
            (stats.successfulSyncs / stats.totalSyncs * 100).toFixed(1) : '0'
        },
        recentSyncs: syncLogs,
        recentErrors,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          hasMore: syncLogs.length === Number(limit)
        }
      },
      duration: Date.now() - startTime
    }

    return response

  } catch (error) {
    console.error('❌ Erreur GET /api/admin/sync/status:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})