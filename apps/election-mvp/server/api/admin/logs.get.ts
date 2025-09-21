/**
 * API Route: GET /api/admin/logs
 * Récupère les logs système pour le debugging
 */

import { getDatabase } from "../../utils/database"

// Fonction pour s'assurer que la table system_logs existe
async function ensureSystemLogsTable(db: any) {
  try {
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

    // Index pour les performances
    await db.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)`,
      args: []
    })

    await db.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)`,
      args: []
    })

    await db.execute({
      sql: `CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source)`,
      args: []
    })
  } catch (error) {
    console.error('❌ Erreur création table system_logs:', error)
    throw error
  }
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('📋 GET /api/admin/logs - Récupération logs système')

    const query = getQuery(event)
    const {
      level = 'all',
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      source,
      search
    } = query

    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // S'assurer que la table existe avant de l'interroger
    await ensureSystemLogsTable(db)

    // Construction de la requête SQL dynamique
    let sql = `
      SELECT
        id, level, message, context, source, stack_trace,
        metadata, created_at
      FROM system_logs
      WHERE 1=1
    `

    const args: any[] = []

    // Filtrage par niveau
    if (level !== 'all') {
      sql += ' AND level = ?'
      args.push(level)
    }

    // Filtrage par source
    if (source) {
      sql += ' AND source = ?'
      args.push(source)
    }

    // Filtrage par date
    if (startDate) {
      sql += ' AND created_at >= ?'
      args.push(startDate)
    }

    if (endDate) {
      sql += ' AND created_at <= ?'
      args.push(endDate)
    }

    // Recherche textuelle
    if (search) {
      sql += ' AND (message LIKE ? OR context LIKE ? OR source LIKE ?)'
      const searchPattern = `%${search}%`
      args.push(searchPattern, searchPattern, searchPattern)
    }

    // Tri et pagination
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(Number(limit), Number(offset))

    const logsResult = await db.execute({
      sql,
      args
    })

    // Récupération du nombre total d'enregistrements pour la pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM system_logs
      WHERE 1=1
    `

    const countArgs: any[] = []

    // Réappliquer les mêmes filtres pour le count
    if (level !== 'all') {
      countSql += ' AND level = ?'
      countArgs.push(level)
    }

    if (source) {
      countSql += ' AND source = ?'
      countArgs.push(source)
    }

    if (startDate) {
      countSql += ' AND created_at >= ?'
      countArgs.push(startDate)
    }

    if (endDate) {
      countSql += ' AND created_at <= ?'
      countArgs.push(endDate)
    }

    if (search) {
      countSql += ' AND (message LIKE ? OR context LIKE ? OR source LIKE ?)'
      const searchPattern = `%${search}%`
      countArgs.push(searchPattern, searchPattern, searchPattern)
    }

    const countResult = await db.execute({
      sql: countSql,
      args: countArgs
    })

    const total = Number(countResult.rows[0]?.total) || 0

    // Formatage des logs
    const logs = logsResult.rows.map((row: any) => ({
      id: row.id,
      level: row.level,
      message: row.message,
      context: row.context,
      source: row.source,
      stackTrace: row.stack_trace,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at
    }))

    // Statistiques récentes pour le dashboard
    const statsResult = await db.execute({
      sql: `
        SELECT
          level,
          COUNT(*) as count
        FROM system_logs
        WHERE created_at >= datetime('now', '-24 hours')
        GROUP BY level
      `,
      args: []
    })

    const levelStats = statsResult.rows.reduce((acc: any, row: any) => {
      acc[row.level] = Number(row.count)
      return acc
    }, {})

    // Sources les plus actives
    const sourcesResult = await db.execute({
      sql: `
        SELECT
          source,
          COUNT(*) as count
        FROM system_logs
        WHERE created_at >= datetime('now', '-24 hours')
        GROUP BY source
        ORDER BY count DESC
        LIMIT 10
      `,
      args: []
    })

    const activeSources = sourcesResult.rows.map((row: any) => ({
      source: row.source,
      count: Number(row.count)
    }))

    const response = {
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + logs.length < total
        },
        stats: {
          levelStats,
          activeSources,
          totalLogs: total
        },
        filters: {
          level,
          source,
          startDate,
          endDate,
          search
        }
      },
      duration: Date.now() - startTime
    }

    return response

  } catch (error) {
    console.error('❌ Erreur GET /api/admin/logs:', error)

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