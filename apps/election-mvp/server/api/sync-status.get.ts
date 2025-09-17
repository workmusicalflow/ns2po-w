/**
 * API Route: GET /api/sync-status
 * Statut de la synchronisation et historique des tâches
 */

import { airtableTursoSync } from '../services/airtable-sync'

interface SyncStatus {
  lastSync: {
    timestamp: string | null
    status: 'success' | 'error' | 'running' | 'never'
    duration?: number
    records?: {
      created: number
      updated: number
      skipped: number
      errors: number
    }
    errors?: string[]
  }
  health: {
    turso: boolean
    airtable: boolean
    sync: boolean
  }
  configuration: {
    syncInterval: string
    nextScheduledSync?: string
    enabledTables: string[]
    environment: string
  }
  statistics: {
    totalSyncs: number
    successRate: number
    averageDuration: number
    lastErrors: string[]
  }
}

// État global simple pour tracking (en production, utiliser une base de données)
const syncState = {
  lastSyncTimestamp: null as string | null,
  lastSyncStatus: 'never' as 'success' | 'error' | 'running' | 'never',
  lastSyncDuration: null as number | null,
  lastSyncRecords: null as any,
  lastSyncErrors: [] as string[],
  totalSyncs: 0,
  totalErrors: 0,
  totalDuration: 0,
  recentErrors: [] as string[]
}

export default defineEventHandler(async (event): Promise<SyncStatus> => {
  const startTime = Date.now()

  try {
    console.log('📊 GET /api/sync-status - Récupération statut synchronisation')

    // Health check en temps réel
    const health = await airtableTursoSync.healthCheck()

    // Configuration de synchronisation
    const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 heures
    const nextSync = syncState.lastSyncTimestamp
      ? new Date(new Date(syncState.lastSyncTimestamp).getTime() + SYNC_INTERVAL_MS)
      : new Date(Date.now() + SYNC_INTERVAL_MS)

    // Calcul des statistiques
    const successRate = syncState.totalSyncs > 0
      ? ((syncState.totalSyncs - syncState.totalErrors) / syncState.totalSyncs) * 100
      : 0

    const averageDuration = syncState.totalSyncs > 0
      ? Math.round(syncState.totalDuration / syncState.totalSyncs)
      : 0

    const status: SyncStatus = {
      lastSync: {
        timestamp: syncState.lastSyncTimestamp,
        status: syncState.lastSyncStatus,
        duration: syncState.lastSyncDuration || undefined,
        records: syncState.lastSyncRecords || undefined,
        errors: syncState.lastSyncErrors.length > 0 ? syncState.lastSyncErrors : undefined
      },
      health: {
        turso: health.turso,
        airtable: health.airtable,
        sync: health.turso && health.airtable
      },
      configuration: {
        syncInterval: '6 hours',
        nextScheduledSync: nextSync.toISOString(),
        enabledTables: ['Products', 'Categories', 'CampaignBundles'],
        environment: process.env.NODE_ENV || 'development'
      },
      statistics: {
        totalSyncs: syncState.totalSyncs,
        successRate: Math.round(successRate * 100) / 100,
        averageDuration,
        lastErrors: syncState.recentErrors.slice(-5) // 5 dernières erreurs
      }
    }

    const duration = Date.now() - startTime
    console.log(`📊 Statut sync récupéré en ${duration}ms`)

    // Headers de cache court pour données dynamiques
    setHeader(event, 'Cache-Control', 'public, max-age=30') // 30 secondes
    setHeader(event, 'Content-Type', 'application/json')

    return status

  } catch (error) {
    console.error('❌ Erreur GET /api/sync-status:', error)

    // Fallback en cas d'erreur
    const duration = Date.now() - startTime
    return {
      lastSync: {
        timestamp: null,
        status: 'error'
      },
      health: {
        turso: false,
        airtable: false,
        sync: false
      },
      configuration: {
        syncInterval: '6 hours',
        enabledTables: ['Products', 'Categories', 'CampaignBundles'],
        environment: process.env.NODE_ENV || 'development'
      },
      statistics: {
        totalSyncs: 0,
        successRate: 0,
        averageDuration: 0,
        lastErrors: [error instanceof Error ? error.message : 'Erreur inconnue']
      }
    }
  }
})

// Fonctions utilitaires pour mettre à jour l'état (appelées par les tâches cron)
export function updateSyncStatus(
  status: 'success' | 'error' | 'running',
  duration?: number,
  records?: any,
  errors?: string[]
) {
  syncState.lastSyncTimestamp = new Date().toISOString()
  syncState.lastSyncStatus = status
  syncState.lastSyncDuration = duration || null
  syncState.lastSyncRecords = records || null
  syncState.lastSyncErrors = errors || []

  if (status === 'success' || status === 'error') {
    syncState.totalSyncs++
    if (duration) {
      syncState.totalDuration += duration
    }
  }

  if (status === 'error' && errors && errors.length > 0) {
    syncState.totalErrors++
    syncState.recentErrors.push(...errors)
    // Garder seulement les 10 dernières erreurs
    if (syncState.recentErrors.length > 10) {
      syncState.recentErrors = syncState.recentErrors.slice(-10)
    }
  }

  console.log(`📊 État sync mis à jour: ${status} (total: ${syncState.totalSyncs})`)
}