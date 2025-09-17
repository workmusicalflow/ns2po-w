/**
 * Nitro Task: Synchronisation automatique Airtable → Turso
 * Exécuté automatiquement toutes les 6 heures
 */

import { airtableTursoSync } from '../services/airtable-sync'

export default defineNitroPlugin(async (nitroApp) => {
  console.log('🔄 Plugin Cron Sync initialisé')

  // Lancer la tâche immédiatement au démarrage (optionnel)
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Mode développement - sync initial différé')
    setTimeout(async () => {
      await runSyncJob('startup')
    }, 10000) // 10 secondes après le démarrage
  }

  // Programmer la synchronisation automatique
  const SYNC_INTERVAL = 6 * 60 * 60 * 1000 // 6 heures en millisecondes

  setInterval(async () => {
    await runSyncJob('cron')
  }, SYNC_INTERVAL)

  console.log(`⏰ Synchronisation programmée toutes les ${SYNC_INTERVAL / (60 * 60 * 1000)} heures`)
})

/**
 * Exécute une tâche de synchronisation avec retry et error handling
 */
async function runSyncJob(trigger: 'cron' | 'startup' | 'manual' | 'webhook', retryCount = 0): Promise<void> {
  const maxRetries = 3
  const startTime = Date.now()

  try {
    console.log(`🔄 [${trigger.toUpperCase()}] Début synchronisation Airtable → Turso...`)

    // Vérifier l'état de santé avant la sync
    const health = await airtableTursoSync.healthCheck()
    if (!health.turso || !health.airtable) {
      throw new Error(`Services indisponibles - Turso: ${health.turso}, Airtable: ${health.airtable}`)
    }

    // Exécuter la synchronisation
    const result = await airtableTursoSync.syncFromAirtable({
      direction: 'airtable_to_turso',
      tables: ['Products', 'Categories', 'CampaignBundles'],
      dryRun: false,
      batchSize: 50
    })

    const duration = Date.now() - startTime

    if (result.success) {
      console.log(`✅ [${trigger.toUpperCase()}] Synchronisation réussie en ${duration}ms:`, {
        created: result.records.created,
        updated: result.records.updated,
        skipped: result.records.skipped,
        errors: result.records.errors
      })

      // Notifier le succès si des changements importants
      if (result.records.created + result.records.updated > 10) {
        await sendNotification('success', {
          trigger,
          duration,
          records: result.records,
          message: `Synchronisation importante: ${result.records.created + result.records.updated} enregistrements modifiés`
        })
      }
    } else {
      throw new Error(`Échec sync: ${result.errors.join(', ')}`)
    }

  } catch (error) {
    console.error(`❌ [${trigger.toUpperCase()}] Erreur synchronisation:`, error)

    // Retry logic
    if (retryCount < maxRetries) {
      const retryDelay = Math.pow(2, retryCount) * 1000 // Exponential backoff
      console.log(`🔄 Tentative ${retryCount + 1}/${maxRetries} dans ${retryDelay}ms...`)

      setTimeout(async () => {
        await runSyncJob(trigger, retryCount + 1)
      }, retryDelay)
    } else {
      // Échec définitif - notifier
      await sendNotification('error', {
        trigger,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        retryCount: maxRetries,
        message: `Échec définitif après ${maxRetries} tentatives`
      })
    }
  }
}

/**
 * Envoie des notifications en cas de succès important ou d'échec
 */
async function sendNotification(
  type: 'success' | 'error' | 'warning',
  data: {
    trigger: string
    duration: number
    records?: any
    error?: string
    retryCount?: number
    message: string
  }
): Promise<void> {
  try {
    const timestamp = new Date().toISOString()
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'

    const notification = {
      timestamp,
      type,
      trigger: data.trigger,
      duration: data.duration,
      message: data.message,
      details: {
        records: data.records,
        error: data.error,
        retryCount: data.retryCount
      }
    }

    console.log(`${emoji} [NOTIFICATION] ${type.toUpperCase()}:`, notification)

    // Notifications par email/Slack (à implémenter si nécessaire)
    if (type === 'error') {
      // TODO: Implémenter notification email/Slack pour les erreurs critiques
      // await sendEmailNotification(notification)
      // await sendSlackNotification(notification)
    }

    // Stocker en base pour historique (optionnel)
    // await storeNotificationHistory(notification)

  } catch (notificationError) {
    console.error('❌ Erreur envoi notification:', notificationError)
  }
}

// Export de la fonction pour usage manuel
export { runSyncJob }