#!/usr/bin/env node

/**
 * Script pour créer la table assets dans Turso
 * Lance avec: node scripts/create-assets-table.js
 */

import { createClient } from '@libsql/client'
import 'dotenv/config'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function createAssetsTable() {
  console.log('🗄️ Création de la table assets...')

  try {
    // Créer la table assets
    await client.execute(`
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        public_id TEXT NOT NULL UNIQUE,
        secure_url TEXT NOT NULL,
        url TEXT,
        format TEXT NOT NULL,
        resource_type TEXT NOT NULL DEFAULT 'image',
        bytes INTEGER NOT NULL DEFAULT 0,
        width INTEGER,
        height INTEGER,
        alt_text TEXT,
        caption TEXT,
        tags TEXT, -- JSON string pour les tags
        folder TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_deleted INTEGER NOT NULL DEFAULT 0
      )
    `)

    console.log('✅ Table assets créée avec succès')

    // Créer les index pour les performances
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_assets_public_id ON assets(public_id)
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_assets_folder ON assets(folder)
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_assets_format ON assets(format)
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at)
    `)

    console.log('✅ Index créés avec succès')

    // Vérifier la structure de la table
    const result = await client.execute("PRAGMA table_info(assets)")
    console.log('📊 Structure de la table assets:')
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.pk ? '(PRIMARY KEY)' : ''}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    client.close()
  }
}

createAssetsTable()