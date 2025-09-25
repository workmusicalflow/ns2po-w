#!/usr/bin/env node

/**
 * Script de correction du schéma de la table bundle_products
 * Corrige le type de product_id de INTEGER vers TEXT
 */

import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config({ path: '../../.env' })

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

async function fixBundleProductsSchema() {
  console.log('🔧 Correction du schéma bundle_products...')

  try {
    // Vérifier l'état actuel de la table
    const tableInfo = await db.execute({
      sql: "PRAGMA table_info(bundle_products)",
      args: []
    })

    console.log('📊 Structure actuelle de bundle_products:', tableInfo.rows)

    // Vérifier si product_id est déjà de type TEXT
    const productIdColumn = tableInfo.rows.find(row => row.name === 'product_id')
    if (productIdColumn && productIdColumn.type === 'TEXT') {
      console.log('✅ La table bundle_products a déjà le bon schéma')
      return
    }

    console.log('🔄 Migration du schéma nécessaire...')

    // Sauvegarder les données existantes
    const existingData = await db.execute({
      sql: "SELECT * FROM bundle_products",
      args: []
    })

    console.log(`📦 Sauvegarde de ${existingData.rows.length} enregistrements`)

    // Supprimer l'ancienne table
    await db.execute({
      sql: "DROP TABLE IF EXISTS bundle_products",
      args: []
    })

    // Recréer la table avec le bon schéma
    await db.execute({
      sql: `CREATE TABLE bundle_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bundle_id INTEGER NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
        custom_price REAL,
        is_required BOOLEAN DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bundle_id) REFERENCES campaign_bundles(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(bundle_id, product_id)
      )`,
      args: []
    })

    console.log('✅ Table bundle_products recréée avec le bon schéma')

    // Restaurer les données si il y en avait
    if (existingData.rows.length > 0) {
      console.log('🔄 Restauration des données...')
      for (const row of existingData.rows) {
        await db.execute({
          sql: `INSERT INTO bundle_products
            (bundle_id, product_id, quantity, custom_price, is_required, display_order, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            row.bundle_id,
            String(row.product_id), // Conversion en TEXT
            row.quantity,
            row.custom_price,
            row.is_required,
            row.display_order,
            row.metadata
          ]
        })
      }
      console.log('✅ Données restaurées')
    }

    console.log('🎉 Migration terminée avec succès')

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  }
}

// Exécution
fixBundleProductsSchema()
  .then(() => {
    console.log('✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Échec du script:', error)
    process.exit(1)
  })