/**
 * API Route: POST /api/sync-manual
 * Webhook pour déclencher une synchronisation manuelle immédiate
 */

import { runSyncJob } from '../tasks/cron-sync'
import { airtableTursoSync } from '../services/airtable-sync'

interface SyncRequest {
  tables?: string[]
  dryRun?: boolean
  force?: boolean
  source?: 'admin' | 'webhook' | 'automation'
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    // Vérifier la méthode
    if (getMethod(event) !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    console.log('🔄 POST /api/sync-manual - Début synchronisation manuelle')

    // Récupération du body
    const body: SyncRequest = await readBody(event).catch(() => ({}))
    const { tables, dryRun = false, force = false, source = 'admin' } = body

    console.log('📋 Paramètres sync:', { tables, dryRun, force, source })

    // Authentification basique (TODO: améliorer avec vraie auth)
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader && !force) {
      // En développement, permettre sans auth
      if (process.env.NODE_ENV !== 'development') {
        throw createError({
          statusCode: 401,
          statusMessage: 'Authorization required'
        })
      }
    }

    // Health check préalable
    const health = await airtableTursoSync.healthCheck()
    if (!health.turso && !health.airtable) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Services Turso et Airtable indisponibles'
      })
    }

    if (!health.turso) {
      console.warn('⚠️ Turso indisponible - sync Airtable seulement')
    }

    if (!health.airtable) {
      console.warn('⚠️ Airtable indisponible - impossible de synchroniser')
      throw createError({
        statusCode: 503,
        statusMessage: 'Service Airtable indisponible'
      })
    }

    // Mode dry-run informatif
    if (dryRun) {
      console.log('🔍 Mode DRY RUN activé - aucune modification')
    }

    // Exécution de la synchronisation
    const result = await airtableTursoSync.syncFromAirtable({
      direction: 'airtable_to_turso',
      tables: tables || ['Products', 'Categories', 'CampaignBundles'],
      dryRun,
      batchSize: 50
    })

    const duration = Date.now() - startTime
    const responseData = {
      success: result.success,
      trigger: 'manual',
      source,
      duration,
      dryRun,
      health,
      sync: {
        tables: tables || ['Products', 'Categories', 'CampaignBundles'],
        records: result.records,
        errors: result.errors
      },
      timestamp: new Date().toISOString()
    }

    // Log selon le résultat
    if (result.success) {
      console.log(`✅ Synchronisation manuelle réussie en ${duration}ms:`, result.records)
    } else {
      console.error(`❌ Synchronisation manuelle échouée:`, result.errors)
    }

    // Headers de cache
    setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
    setHeader(event, 'Content-Type', 'application/json')

    // Status selon le résultat
    if (result.success) {
      setResponseStatus(event, 200)
    } else {
      setResponseStatus(event, 207) // Multi-Status
    }

    return responseData

  } catch (error) {
    console.error('❌ Erreur API sync-manual:', error)

    const duration = Date.now() - startTime
    const isHttpError = error && typeof error === 'object' && 'statusCode' in error

    if (isHttpError) {
      throw error // Re-throw HTTP errors
    }

    setResponseStatus(event, 500)
    return {
      success: false,
      trigger: 'manual',
      source: 'unknown',
      duration,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString(),
      sync: {
        tables: [],
        records: { created: 0, updated: 0, skipped: 0, errors: 1 },
        errors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }
})