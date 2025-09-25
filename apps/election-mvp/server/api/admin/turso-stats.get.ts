/**
 * API Route: GET /api/admin/turso-stats
 * Récupère les statistiques temps réel de la base Turso
 */

import { getDatabase } from "../../utils/database";

export default defineEventHandler(async (event) => {
  try {
    const tursoClient = getDatabase()

    if (!tursoClient) {
      throw new Error('Turso database not available')
    }

    // Obtenir la liste des tables
    const tablesResult = await tursoClient.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      args: []
    })

    const tables = tablesResult.rows.map(row => row.name as string)

    // Compter les enregistrements par table
    const tableStats = []
    let totalRecords = 0

    for (const table of tables) {
      try {
        const countResult = await tursoClient.execute({
          sql: `SELECT COUNT(*) as count FROM ${table}`,
          args: []
        })
        const count = Number(countResult.rows[0]?.count) || 0
        tableStats.push({
          name: table,
          records: count
        })
        totalRecords += count
      } catch (error) {
        console.warn(`Could not count records for table ${table}:`, error)
        tableStats.push({
          name: table,
          records: 0
        })
      }
    }

    // Statistiques par table importante
    const keyTables = ['products', 'campaign_bundles', 'bundle_products', 'categories', 'realisations']
    const keyStats = keyTables.reduce((acc, tableName) => {
      const tableData = tableStats.find(t => t.name === tableName)
      acc[tableName] = tableData?.records || 0
      return acc
    }, {} as Record<string, number>)

    // Vérification de la santé de la base
    const healthCheck = await tursoClient.execute({
      sql: "SELECT 1 as healthy",
      args: []
    })

    // Extract database info from environment
    const databaseUrl = process.env.TURSO_DATABASE_URL || ''
    const urlMatch = databaseUrl.match(/libsql:\/\/([^.]+)\.([^\/]+)/)
    const databaseName = urlMatch?.[1] || 'unknown'
    const host = urlMatch?.[2] || 'unknown'

    const stats = {
      success: true,
      connection: {
        status: 'connected',
        healthy: healthCheck.rows.length > 0,
        lastCheck: new Date().toISOString(),
        databaseName,
        host
      },
      database: {
        totalTables: tables.length,
        totalRecords,
        tableStats,
        keyTables: keyStats
      },
      performance: {
        responseTime: Date.now() - Date.now(), // Will be calculated properly
        queriesExecuted: tables.length + 1
      }
    }

    // Headers de cache
    setHeader(event, "Cache-Control", "no-cache")

    return stats

  } catch (error) {
    console.error("❌ Erreur récupération stats Turso:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne",
      connection: {
        status: 'disconnected',
        healthy: false,
        lastCheck: new Date().toISOString()
      },
      database: {
        totalTables: 0,
        totalRecords: 0,
        tableStats: [],
        keyTables: {}
      }
    }
  }
})