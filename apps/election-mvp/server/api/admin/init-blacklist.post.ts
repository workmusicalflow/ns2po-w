/**
 * API: POST /api/admin/init-blacklist
 * Initialise la table de blacklist pour les réalisations auto-discovery
 */

import { getDatabase } from "../../utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('🔧 POST /api/admin/init-blacklist - Initialisation table blacklist')

    // Vérification sécurité (optionnel - à activer en prod)
    // const authResult = await verifyAdminAuth(event)
    // if (!authResult.success) {
    //   throw createError({
    //     statusCode: 401,
    //     statusMessage: 'Accès administrateur requis'
    //   })
    // }

    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // 1. Créer la table de blacklist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS realisation_blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        public_id TEXT UNIQUE NOT NULL,
        original_title TEXT,
        reason TEXT DEFAULT 'user_deleted',
        blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blacklisted_by TEXT DEFAULT 'admin'
      )
    `)
    console.log('✅ Table realisation_blacklist créée')

    // 2. Créer les index pour optimiser les requêtes
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_realisation_blacklist_public_id
      ON realisation_blacklist(public_id)
    `)

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_realisation_blacklist_date
      ON realisation_blacklist(blacklisted_at DESC)
    `)
    console.log('✅ Index créés')

    // 3. Vérifier la structure
    const tableInfoResult = await db.execute(`
      SELECT name, sql FROM sqlite_master
      WHERE type='table' AND name='realisation_blacklist'
    `)

    if (tableInfoResult.rows.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Table non créée correctement'
      })
    }

    // 4. Vérifier le count actuel
    const countResult = await db.execute('SELECT COUNT(*) as count FROM realisation_blacklist')
    const currentCount = Number(countResult.rows[0]?.count) || 0

    console.log(`✅ Initialisation terminée: ${currentCount} entrées existantes`)

    const response = {
      success: true,
      message: 'Table de blacklist initialisée avec succès',
      data: {
        table: 'realisation_blacklist',
        exists: true,
        currentEntries: currentCount,
        indexes: ['idx_realisation_blacklist_public_id', 'idx_realisation_blacklist_date']
      },
      duration: Date.now() - startTime
    }

    return response

  } catch (error: any) {
    console.error('❌ Erreur initialisation blacklist:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'initialisation de la blacklist',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})