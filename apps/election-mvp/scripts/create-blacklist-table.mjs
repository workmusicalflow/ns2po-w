/**
 * Script pour créer la table realisation_blacklist
 * Execute depuis le serveur Nuxt pour utiliser getDatabase()
 */

import { getDatabase } from '../server/utils/database.js'

async function createBlacklistTable() {
  console.log('🚀 Création de la table realisation_blacklist...')

  try {
    const db = getDatabase()

    if (!db) {
      throw new Error('Database non disponible')
    }

    // Créer la table de blacklist
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

    // Créer les index pour optimiser les requêtes
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_realisation_blacklist_public_id
      ON realisation_blacklist(public_id)
    `)
    console.log('✅ Index public_id créé')

    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_realisation_blacklist_date
      ON realisation_blacklist(blacklisted_at DESC)
    `)
    console.log('✅ Index date créé')

    // Vérifier la structure
    const tableInfo = await db.execute(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='realisation_blacklist'
    `)

    if (tableInfo.rows.length > 0) {
      console.log('✅ Vérification: table realisation_blacklist existe')
    } else {
      throw new Error('Table non créée')
    }

    // Test d'insertion
    await db.execute(`
      INSERT OR IGNORE INTO realisation_blacklist (public_id, original_title, reason) VALUES
      ('test/example', 'Test Example', 'test_init')
    `)
    console.log('✅ Test d\'insertion réussi')

    // Vérifier le count
    const countResult = await db.execute('SELECT COUNT(*) as count FROM realisation_blacklist')
    const count = countResult.rows[0]?.count || 0
    console.log(`📊 ${count} entrées dans realisation_blacklist`)

    console.log('🎉 Initialisation de la table blacklist terminée!')

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error)
    throw error
  }
}

// Export pour utilisation dans d'autres scripts
export { createBlacklistTable }

// Exécution directe si script appelé
if (import.meta.url === `file://${process.argv[1]}`) {
  createBlacklistTable().catch(console.error)
}