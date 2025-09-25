#!/usr/bin/env node

/**
 * Script de debug pour examiner l'état des tables products et bundle_products
 * Vérifie l'incohérence des IDs selon les recommandations de Gemini
 */

import { createClient } from '@libsql/client'
import { config } from 'dotenv'

config({ path: '../../.env' })

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})

async function debugTablesState() {
  console.log('🔍 Vérification de l\'état des tables products et bundle_products...')

  try {
    // 1. Vérifier le schéma de la table products
    console.log('\n📊 === SCHÉMA TABLE PRODUCTS ===')
    const productsSchema = await db.execute({
      sql: "PRAGMA table_info(products)",
      args: []
    })

    console.log('Structure de la table products:')
    productsSchema.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.pk ? '(PRIMARY KEY)' : ''}`)
    })

    // 2. Examiner les IDs de products
    console.log('\n📊 === ÉCHANTILLON IDS PRODUCTS ===')
    const productsIds = await db.execute({
      sql: "SELECT id, typeof(id) as id_type, name FROM products LIMIT 10",
      args: []
    })

    console.log('Premiers 10 IDs de products:')
    productsIds.rows.forEach(row => {
      console.log(`  - ID: "${row.id}" (type: ${row.id_type}) - ${row.name}`)
    })

    // 3. Vérifier le schéma de la table bundle_products
    console.log('\n📊 === SCHÉMA TABLE BUNDLE_PRODUCTS ===')
    const bundleProductsSchema = await db.execute({
      sql: "PRAGMA table_info(bundle_products)",
      args: []
    })

    console.log('Structure de la table bundle_products:')
    bundleProductsSchema.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.pk ? '(PRIMARY KEY)' : ''}`)
    })

    // 4. Examiner les données existantes dans bundle_products
    console.log('\n📊 === DONNÉES BUNDLE_PRODUCTS ===')
    const bundleProductsData = await db.execute({
      sql: "SELECT bundle_id, product_id, typeof(product_id) as product_id_type, quantity FROM bundle_products LIMIT 10",
      args: []
    })

    console.log('Données existantes dans bundle_products:')
    bundleProductsData.rows.forEach(row => {
      console.log(`  - Bundle: ${row.bundle_id}, Product ID: "${row.product_id}" (type: ${row.product_id_type}), Qty: ${row.quantity}`)
    })

    // 5. Vérifier les contraintes de clé étrangère
    console.log('\n🔗 === VÉRIFICATION CONTRAINTES FK ===')
    const fkCheck = await db.execute({
      sql: `
        SELECT bp.product_id, bp.bundle_id, p.id as product_exists
        FROM bundle_products bp
        LEFT JOIN products p ON bp.product_id = p.id
        WHERE p.id IS NULL
      `,
      args: []
    })

    if (fkCheck.rows.length > 0) {
      console.log('❌ Contraintes FK violées trouvées:')
      fkCheck.rows.forEach(row => {
        console.log(`  - Bundle ${row.bundle_id} référence le product_id "${row.product_id}" qui n'existe pas dans products`)
      })
    } else {
      console.log('✅ Toutes les contraintes FK sont respectées dans les données existantes')
    }

    // 6. Analyser les types de données dans products
    console.log('\n📊 === ANALYSE TYPES PRODUCTS ===')
    const typeAnalysis = await db.execute({
      sql: `
        SELECT
          typeof(id) as id_type,
          COUNT(*) as count,
          GROUP_CONCAT(id, ', ') as sample_ids
        FROM products
        GROUP BY typeof(id)
      `,
      args: []
    })

    console.log('Distribution des types d\'ID dans products:')
    typeAnalysis.rows.forEach(row => {
      console.log(`  - Type ${row.id_type}: ${row.count} entrées`)
      console.log(`    Exemples: ${row.sample_ids}`)
    })

    // 7. Vérifier tous les products disponibles
    console.log('\n📊 === TOUS LES PRODUCTS DISPONIBLES ===')
    const allProducts = await db.execute({
      sql: "SELECT id, name, is_active FROM products ORDER BY name",
      args: []
    })

    console.log('Tous les produits disponibles:')
    allProducts.rows.forEach(row => {
      console.log(`  - "${row.id}" | ${row.name} | ${row.is_active ? 'ACTIF' : 'INACTIF'}`)
    })

    console.log('\n🎉 Analyse terminée')

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error)
    throw error
  }
}

// Exécution
debugTablesState()
  .then(() => {
    console.log('✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Échec du script:', error)
    process.exit(1)
  })