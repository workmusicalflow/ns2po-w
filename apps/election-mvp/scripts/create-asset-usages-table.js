#!/usr/bin/env node

/**
 * Script pour créer la table asset_usages dans Turso
 * Lance avec: node scripts/create-asset-usages-table.js
 */

import { createClient } from '@libsql/client'
import 'dotenv/config'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function createAssetUsagesTable() {
  console.log('🗄️ Création de la table asset_usages...')

  try {
    // Créer la table asset_usages
    await client.execute(`
      CREATE TABLE IF NOT EXISTS asset_usages (
        id TEXT PRIMARY KEY,
        asset_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        field_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      )
    `)

    console.log('✅ Table asset_usages créée avec succès')

    // Créer les index pour les performances
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_asset_usages_asset_id ON asset_usages(asset_id)
    `)

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_asset_usages_entity ON asset_usages(entity_type, entity_id)
    `)

    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_usages_unique ON asset_usages(asset_id, entity_type, entity_id, field_name)
    `)

    console.log('✅ Index créés avec succès')

    // Vérifier la structure de la table
    const result = await client.execute("PRAGMA table_info(asset_usages)")
    console.log('📊 Structure de la table asset_usages:')
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.pk ? '(PRIMARY KEY)' : ''}`)
    })

    // Vérifier les index
    const indexResult = await client.execute("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='asset_usages'")
    console.log('🔍 Index sur la table asset_usages:')
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.name}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    client.close()
  }
}

createAssetUsagesTable()