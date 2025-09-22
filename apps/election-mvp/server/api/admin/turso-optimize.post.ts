/**
 * API Route: POST /api/admin/turso-optimize
 * Optimise et nettoie la base de données Turso
 */

import { getDatabase } from "../../utils/database";

export default defineEventHandler(async (event) => {
  try {
    const tursoClient = getDatabase()

    if (!tursoClient) {
      throw new Error('Turso database not available')
    }

    const startTime = Date.now()
    const operations = []

    // 1. VACUUM - Compacter la base de données
    try {
      await tursoClient.execute({ sql: "VACUUM", args: [] })
      operations.push({
        operation: 'vacuum',
        status: 'success',
        message: 'Base de données compactée'
      })
    } catch (error) {
      operations.push({
        operation: 'vacuum',
        status: 'error',
        message: `Erreur VACUUM: ${error}`
      })
    }

    // 2. ANALYZE - Mettre à jour les statistiques des tables
    try {
      await tursoClient.execute({ sql: "ANALYZE", args: [] })
      operations.push({
        operation: 'analyze',
        status: 'success',
        message: 'Statistiques des tables mises à jour'
      })
    } catch (error) {
      operations.push({
        operation: 'analyze',
        status: 'error',
        message: `Erreur ANALYZE: ${error}`
      })
    }

    // 3. Nettoyage des logs système anciens (> 30 jours)
    try {
      const cleanupResult = await tursoClient.execute({
        sql: "DELETE FROM system_logs WHERE created_at < datetime('now', '-30 days')",
        args: []
      })
      operations.push({
        operation: 'cleanup_logs',
        status: 'success',
        message: `${cleanupResult.rowsAffected} logs anciens supprimés`
      })
    } catch (error) {
      operations.push({
        operation: 'cleanup_logs',
        status: 'warning',
        message: `Nettoyage logs ignoré: ${error}`
      })
    }

    // 4. Vérification de l'intégrité
    try {
      const integrityResult = await tursoClient.execute({
        sql: "PRAGMA integrity_check",
        args: []
      })
      const isHealthy = integrityResult.rows[0]?.integrity_check === 'ok'
      operations.push({
        operation: 'integrity_check',
        status: isHealthy ? 'success' : 'error',
        message: isHealthy ? 'Intégrité de la base vérifiée' : 'Problèmes d\'intégrité détectés'
      })
    } catch (error) {
      operations.push({
        operation: 'integrity_check',
        status: 'error',
        message: `Erreur vérification intégrité: ${error}`
      })
    }

    const executionTime = Date.now() - startTime
    const successCount = operations.filter(op => op.status === 'success').length
    const errorCount = operations.filter(op => op.status === 'error').length

    return {
      success: errorCount === 0,
      summary: {
        totalOperations: operations.length,
        successful: successCount,
        errors: errorCount,
        executionTimeMs: executionTime
      },
      operations,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error("❌ Erreur optimisation Turso:", error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne",
      summary: {
        totalOperations: 0,
        successful: 0,
        errors: 1,
        executionTimeMs: 0
      },
      operations: [],
      timestamp: new Date().toISOString()
    }
  }
})