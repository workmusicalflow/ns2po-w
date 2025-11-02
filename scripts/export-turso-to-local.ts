/**
 * Export Turso Database to Local SQLite
 * Alternative to `turso db dump` which doesn't exist in CLI v1.0.13
 *
 * Usage: pnpm tsx scripts/export-turso-to-local.ts
 */

import { createClient } from '@libsql/client'
import Database from 'better-sqlite3'
import 'dotenv/config'
import { writeFileSync } from 'fs'
import { join } from 'path'

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Variables TURSO manquantes dans .env')
  process.exit(1)
}

// Client Turso distant
const tursoDb = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
})

// Database SQLite locale
const localDbPath = join(process.cwd(), 'test-migration', 'test-migration.db')
const localDb = new Database(localDbPath)

// Désactiver contraintes FK pendant l'import
localDb.pragma('foreign_keys = OFF')

async function exportTursoSchema() {
  console.log('\n📋 Étape 1/3 : Export schéma Turso...')

  const { rows: tables } = await tursoDb.execute(`
    SELECT sql FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)

  const { rows: indexes } = await tursoDb.execute(`
    SELECT sql FROM sqlite_master
    WHERE type='index' AND sql IS NOT NULL
    ORDER BY name
  `)

  const { rows: triggers } = await tursoDb.execute(`
    SELECT sql FROM sqlite_master
    WHERE type='trigger'
    ORDER BY name
  `)

  console.log(`  ✓ ${tables.length} tables`)
  console.log(`  ✓ ${indexes.length} indexes`)
  console.log(`  ✓ ${triggers.length} triggers`)

  // Créer tables localement
  for (const table of tables) {
    if (table.sql) {
      localDb.exec(table.sql as string)
    }
  }

  // Créer indexes localement
  for (const index of indexes) {
    if (index.sql) {
      try {
        localDb.exec(index.sql as string)
      } catch (error) {
        // Ignorer erreurs indexes (peuvent déjà exister)
        console.warn(`  ⚠️ Index skipped: ${error}`)
      }
    }
  }

  // Créer triggers localement
  for (const trigger of triggers) {
    if (trigger.sql) {
      localDb.exec(trigger.sql as string)
    }
  }

  console.log('✅ Schéma exporté')
}

async function exportTursoData() {
  console.log('\n📊 Étape 2/3 : Export données Turso...')

  // Liste des tables (exclure FTS et meta tables)
  const { rows: tableNames } = await tursoDb.execute(`
    SELECT name FROM sqlite_master
    WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '%_fts%'
    ORDER BY name
  `)

  for (const tableRow of tableNames) {
    const tableName = tableRow.name as string
    console.log(`  📦 Exportation ${tableName}...`)

    // Récupérer toutes les données de la table
    const { rows } = await tursoDb.execute(`SELECT * FROM ${tableName}`)

    if (rows.length === 0) {
      console.log(`    ℹ️ Aucune donnée`)
      continue
    }

    // Récupérer les colonnes
    const { rows: columns } = await tursoDb.execute(`PRAGMA table_info(${tableName})`)
    const columnNames = columns.map(col => col.name as string)

    // Préparer statement INSERT
    const placeholders = columnNames.map(() => '?').join(', ')
    const insertStmt = localDb.prepare(`
      INSERT INTO ${tableName} (${columnNames.join(', ')})
      VALUES (${placeholders})
    `)

    // Batch insert pour performance
    const batchInsert = localDb.transaction((rows: any[]) => {
      for (const row of rows) {
        const values = columnNames.map(col => row[col])
        insertStmt.run(...values)
      }
    })

    batchInsert(rows)
    console.log(`    ✓ ${rows.length} enregistrements`)
  }

  console.log('✅ Données exportées')
}

async function generateStatistics() {
  console.log('\n📈 Étape 3/3 : Statistiques DB locale...')

  const stats = {
    products: localDb.prepare('SELECT COUNT(*) as count FROM products').get(),
    customers: localDb.prepare('SELECT COUNT(*) as count FROM customers').get(),
    orders: localDb.prepare('SELECT COUNT(*) as count FROM orders').get(),
    quotes: localDb.prepare('SELECT COUNT(*) as count FROM quotes').get(),
    productsWithMaterials: localDb.prepare(`
      SELECT COUNT(*) as count FROM products
      WHERE materials IS NOT NULL AND materials != ''
    `).get(),
    productsWithColors: localDb.prepare(`
      SELECT COUNT(*) as count FROM products
      WHERE colors IS NOT NULL AND colors != ''
    `).get(),
    productsWithSizes: localDb.prepare(`
      SELECT COUNT(*) as count FROM products
      WHERE sizes IS NOT NULL AND sizes != ''
    `).get(),
  }

  console.log('\n📊 Statistiques AVANT migration:')
  console.log(`  Products total: ${(stats.products as any).count}`)
  console.log(`  Customers: ${(stats.customers as any).count}`)
  console.log(`  Orders: ${(stats.orders as any).count}`)
  console.log(`  Quotes: ${(stats.quotes as any).count}`)
  console.log(`  Products avec materials: ${(stats.productsWithMaterials as any).count}`)
  console.log(`  Products avec colors: ${(stats.productsWithColors as any).count}`)
  console.log(`  Products avec sizes: ${(stats.productsWithSizes as any).count}`)

  // Sauvegarder stats dans fichier JSON
  const statsPath = join(process.cwd(), 'test-migration', 'stats-before-migration.json')
  writeFileSync(statsPath, JSON.stringify(stats, null, 2))
  console.log(`\n💾 Stats sauvegardées: ${statsPath}`)
}

async function main() {
  console.log('🚀 Export Turso → SQLite Local')
  console.log('=' .repeat(60))

  const startTime = Date.now()

  try {
    await exportTursoSchema()
    await exportTursoData()
    generateStatistics()

    // Réactiver contraintes FK
    localDb.pragma('foreign_keys = ON')

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Export terminé en ${duration}s`)
    console.log('=' .repeat(60))
    console.log('\n📁 Database locale créée:')
    console.log(`  ${localDbPath}`)
    console.log('\n🎯 Prochaine étape:')
    console.log('  pnpm tsx scripts/test-migration-local-v2.ts')

  } catch (error) {
    console.error('\n❌ Erreur export:', error)
    process.exit(1)
  } finally {
    localDb.close()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur non catchée:', error)
    process.exit(1)
  })
