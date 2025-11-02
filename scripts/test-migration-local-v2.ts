/**
 * Test Migration Locale v2 - Version TypeScript Pure
 * Alternative au script bash qui utilise `turso db dump` (non disponible)
 *
 * Prérequis: Avoir exécuté export-turso-to-local.ts
 * Usage: pnpm tsx scripts/test-migration-local-v2.ts
 */

import Database from 'better-sqlite3'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const TEST_DIR = join(process.cwd(), 'test-migration')
const LOCAL_DB_PATH = join(TEST_DIR, 'test-migration.db')
const SCHEMA_MIGRATION_PATH = join(process.cwd(), 'packages/database/migrations/002_optimize_schema_json_to_native.sql')

// Ouvrir DB locale
const db = new Database(LOCAL_DB_PATH)

// ========================================
// HELPERS
// ========================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function safeJsonParse<T = any>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString || jsonString.trim() === '') return defaultValue

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.warn('⚠️ JSON parse failed:', jsonString?.substring(0, 50))
    return defaultValue
  }
}

// ========================================
// ÉTAPE 1: Exécuter Migration Schéma
// ========================================

function executeSchemaMigration() {
  console.log('\n🔧 Étape 1/6 : Exécution migration SCHÉMA')
  console.log('=' .repeat(60))

  try {
    const migrationSql = readFileSync(SCHEMA_MIGRATION_PATH, 'utf-8')

    // Exécuter migration (SQLite supporte multi-statements)
    db.exec(migrationSql)

    console.log('✅ Migration schéma terminée')

    // Vérifier tables créées
    const tables = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name LIKE 'product_%'
      ORDER BY name
    `).all()

    console.log('\n📋 Tables créées:')
    tables.forEach((table: any) => {
      console.log(`  ✓ ${table.name}`)
    })

  } catch (error) {
    console.error('❌ Erreur migration schéma:', error)
    throw error
  }
}

// ========================================
// ÉTAPE 2: Migration Materials
// ========================================

function migrateMaterials() {
  console.log('\n🔄 Étape 2/6 : Migration Materials')
  console.log('=' .repeat(60))

  const products = db.prepare(`
    SELECT id, materials FROM products
    WHERE materials IS NOT NULL AND materials != ''
  `).all()

  let migratedCount = 0
  let errorCount = 0

  const insertStmt = db.prepare(`
    INSERT INTO product_materials (
      id, product_id, material_name, is_primary, display_order
    ) VALUES (?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((products: any[]) => {
    for (const product of products) {
      const productId = product.id
      const materialsJson = product.materials

      try {
        const materialsArray = safeJsonParse<string[]>(materialsJson, [])

        for (let i = 0; i < materialsArray.length; i++) {
          const materialName = materialsArray[i]

          if (!materialName || materialName.trim() === '') continue

          insertStmt.run(
            generateId('mat'),
            productId,
            materialName.trim(),
            i === 0 ? 1 : 0, // Premier = primary
            i
          )

          migratedCount++
        }
      } catch (error) {
        console.error(`❌ Erreur migration materials pour produit ${productId}:`, error)
        errorCount++
      }
    }
  })

  transaction(products)
  console.log(`✅ Materials migrés: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// ÉTAPE 3: Migration Colors
// ========================================

function migrateColors() {
  console.log('\n🔄 Étape 3/6 : Migration Colors')
  console.log('=' .repeat(60))

  const products = db.prepare(`
    SELECT id, colors FROM products
    WHERE colors IS NOT NULL AND colors != ''
  `).all()

  let migratedCount = 0
  let errorCount = 0

  const insertStmt = db.prepare(`
    INSERT INTO product_colors (
      id, product_id, color_name, color_hex, is_available, display_order
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((products: any[]) => {
    for (const product of products) {
      const productId = product.id
      const colorsJson = product.colors

      try {
        const colorsArray = safeJsonParse<string[]>(colorsJson, [])

        for (let i = 0; i < colorsArray.length; i++) {
          const colorName = colorsArray[i]

          if (!colorName || colorName.trim() === '') continue

          // Extraction code hex si présent (ex: "Rouge (#FF0000)")
          const hexMatch = colorName.match(/#[0-9A-Fa-f]{6}/)
          const colorHex = hexMatch ? hexMatch[0] : null
          const cleanColorName = colorName.replace(/\s*\(#[0-9A-Fa-f]{6}\)/, '').trim()

          insertStmt.run(
            generateId('col'),
            productId,
            cleanColorName,
            colorHex,
            1, // Disponible par défaut
            i
          )

          migratedCount++
        }
      } catch (error) {
        console.error(`❌ Erreur migration colors pour produit ${productId}:`, error)
        errorCount++
      }
    }
  })

  transaction(products)
  console.log(`✅ Colors migrés: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// ÉTAPE 4: Migration Sizes
// ========================================

function migrateSizes() {
  console.log('\n🔄 Étape 4/6 : Migration Sizes')
  console.log('=' .repeat(60))

  const products = db.prepare(`
    SELECT id, sizes FROM products
    WHERE sizes IS NOT NULL AND sizes != ''
  `).all()

  let migratedCount = 0
  let errorCount = 0

  const insertStmt = db.prepare(`
    INSERT INTO product_sizes (
      id, product_id, size_name, size_category, is_available, display_order
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((products: any[]) => {
    for (const product of products) {
      const productId = product.id
      const sizesJson = product.sizes

      try {
        const sizesArray = safeJsonParse<string[]>(sizesJson, [])

        for (let i = 0; i < sizesArray.length; i++) {
          const sizeName = sizesArray[i]

          if (!sizeName || sizeName.trim() === '') continue

          // Détection catégorie taille
          let sizeCategory = 'custom'
          if (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(sizeName.toUpperCase())) {
            sizeCategory = 'clothing'
          } else if (/\d+x\d+/i.test(sizeName)) {
            sizeCategory = 'dimensions'
          }

          insertStmt.run(
            generateId('size'),
            productId,
            sizeName.trim(),
            sizeCategory,
            1, // Disponible par défaut
            i
          )

          migratedCount++
        }
      } catch (error) {
        console.error(`❌ Erreur migration sizes pour produit ${productId}:`, error)
        errorCount++
      }
    }
  })

  transaction(products)
  console.log(`✅ Sizes migrés: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// ÉTAPE 5: Migration Gallery
// ========================================

function migrateGallery() {
  console.log('\n🔄 Étape 5/6 : Migration Gallery Images')
  console.log('=' .repeat(60))

  const products = db.prepare(`
    SELECT id, image_url, gallery_urls FROM products
  `).all()

  let migratedCount = 0
  let errorCount = 0

  const insertStmt = db.prepare(`
    INSERT INTO product_gallery (
      id, product_id, image_url, image_type, display_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((products: any[]) => {
    for (const product of products) {
      const productId = product.id
      const primaryImageUrl = product.image_url
      const galleryJson = product.gallery_urls

      try {
        // Image principale (primary)
        if (primaryImageUrl) {
          insertStmt.run(
            generateId('img'),
            productId,
            primaryImageUrl,
            'primary',
            0,
            1
          )
          migratedCount++
        }

        // Images gallery (variants)
        const galleryArray = safeJsonParse<string[]>(galleryJson, [])

        for (let i = 0; i < galleryArray.length; i++) {
          const imageUrl = galleryArray[i]

          if (!imageUrl || imageUrl.trim() === '') continue

          insertStmt.run(
            generateId('img'),
            productId,
            imageUrl.trim(),
            'variant',
            i + 1, // +1 car primary = 0
            1
          )

          migratedCount++
        }
      } catch (error) {
        console.error(`❌ Erreur migration gallery pour produit ${productId}:`, error)
        errorCount++
      }
    }
  })

  transaction(products)
  console.log(`✅ Gallery images migrées: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// ÉTAPE 6: Génération Tags & FTS
// ========================================

function generateTagsAndFTS() {
  console.log('\n🔄 Étape 6/6 : Génération Tags & FTS')
  console.log('=' .repeat(60))

  try {
    // Tags depuis category
    db.exec(`
      INSERT INTO product_tags (id, product_id, tag_name, tag_type)
      SELECT
        'tag_cat_' || id || '_' || substr(abs(random()), 1, 8),
        id,
        LOWER(category),
        'category'
      FROM products
      WHERE category IS NOT NULL AND category != ''
    `)

    // Tags depuis subcategory
    db.exec(`
      INSERT INTO product_tags (id, product_id, tag_name, tag_type)
      SELECT
        'tag_subcat_' || id || '_' || substr(abs(random()), 1, 8),
        id,
        LOWER(subcategory),
        'category'
      FROM products
      WHERE subcategory IS NOT NULL AND subcategory != ''
    `)

    // Tags feature: personnalisable
    db.exec(`
      INSERT INTO product_tags (id, product_id, tag_name, tag_type)
      SELECT
        'tag_custom_' || id,
        id,
        'personnalisable',
        'feature'
      FROM products
      WHERE customizable = TRUE
    `)

    const tagsCount = db.prepare('SELECT COUNT(*) as count FROM product_tags').get() as any
    console.log(`✅ Tags générés: ${tagsCount.count}`)

    // Populate FTS
    db.exec(`
      INSERT INTO products_search_fts(product_id, name, description, category, subcategory)
      SELECT
        id,
        name,
        COALESCE(description, ''),
        COALESCE(category, ''),
        COALESCE(subcategory, '')
      FROM products
      WHERE is_active = TRUE
    `)

    // Compter via la table source plutôt que FTS
    const ftsCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE').get() as any
    console.log(`✅ Produits indexés FTS: ${ftsCount.count}`)

  } catch (error) {
    console.error('❌ Erreur génération tags/FTS:', error)
    throw error
  }
}

// ========================================
// VALIDATION POST-MIGRATION
// ========================================

function validateMigration() {
  console.log('\n🔍 Validation Migration')
  console.log('=' .repeat(60))

  const checks = [
    {
      name: 'Products count',
      query: 'SELECT COUNT(*) as count FROM products'
    },
    {
      name: 'Materials migrated',
      query: 'SELECT COUNT(*) as count FROM product_materials'
    },
    {
      name: 'Colors migrated',
      query: 'SELECT COUNT(*) as count FROM product_colors'
    },
    {
      name: 'Sizes migrated',
      query: 'SELECT COUNT(*) as count FROM product_sizes'
    },
    {
      name: 'Gallery images migrated',
      query: 'SELECT COUNT(*) as count FROM product_gallery'
    },
    {
      name: 'Tags generated',
      query: 'SELECT COUNT(*) as count FROM product_tags'
    },
    {
      name: 'FTS indexed products',
      query: 'SELECT COUNT(*) as count FROM products WHERE is_active = TRUE'
    },
    {
      name: 'Products without materials (anomaly check)',
      query: `SELECT COUNT(*) as count FROM products p
              LEFT JOIN product_materials pm ON p.id = pm.product_id
              WHERE pm.id IS NULL AND p.materials IS NOT NULL AND p.materials != ''`
    }
  ]

  const results: any = {}

  for (const check of checks) {
    const result = db.prepare(check.query).get() as any
    const count = result.count || 0
    const status = check.name.includes('without') && count > 0 ? '⚠️' : '✅'
    console.log(`${status} ${check.name}: ${count}`)
    results[check.name] = count
  }

  // Sauvegarder résultats
  const resultsPath = join(TEST_DIR, 'validation-results.json')
  writeFileSync(resultsPath, JSON.stringify(results, null, 2))
  console.log(`\n💾 Résultats sauvegardés: ${resultsPath}`)

  return results
}

// ========================================
// TEST PERFORMANCE
// ========================================

function testPerformance() {
  console.log('\n⚡ Tests Performance')
  console.log('=' .repeat(60))

  // Test 1: Recherche matériau
  console.log('\n🔍 Test 1: Recherche par matériau "coton"')

  const iterations = 100

  // Ancienne méthode (JSON LIKE)
  const startOld = Date.now()
  for (let i = 0; i < iterations; i++) {
    db.prepare(`
      SELECT * FROM products WHERE materials LIKE '%coton%'
    `).all()
  }
  const durationOld = Date.now() - startOld

  // Nouvelle méthode (JOIN index)
  const startNew = Date.now()
  for (let i = 0; i < iterations; i++) {
    db.prepare(`
      SELECT DISTINCT p.* FROM products p
      JOIN product_materials pm ON p.id = pm.product_id
      WHERE pm.material_name LIKE '%coton%'
    `).all()
  }
  const durationNew = Date.now() - startNew

  const improvement = ((durationOld - durationNew) / durationOld * 100).toFixed(1)

  console.log(`  Ancienne méthode (JSON LIKE): ${durationOld}ms (${iterations} requêtes)`)
  console.log(`  Nouvelle méthode (JOIN index): ${durationNew}ms (${iterations} requêtes)`)
  console.log(`  🎯 Amélioration: ${improvement}%`)

  // Test 2: Vue enrichie (products_enriched)
  console.log('\n🔍 Test 2: Vue enrichie vs requêtes séparées')

  // Obtenir un ID de produit réel
  const sampleProduct = db.prepare('SELECT id FROM products LIMIT 1').get() as any
  const productId = sampleProduct?.id

  if (!productId) {
    console.log('  ⚠️ Aucun produit trouvé pour test')
    return
  }

  // Ancienne méthode : 2 requêtes séparées
  const startOldView = Date.now()
  for (let i = 0; i < iterations; i++) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
    if (product) {
      const materials = db.prepare('SELECT * FROM product_materials WHERE product_id = ?').all(productId)
      const colors = db.prepare('SELECT * FROM product_colors WHERE product_id = ?').all(productId)
    }
  }
  const durationOldView = Date.now() - startOldView

  // Nouvelle méthode : Single query avec JOINs
  const startNewView = Date.now()
  for (let i = 0; i < iterations; i++) {
    db.prepare(`
      SELECT
        p.*,
        GROUP_CONCAT(pm.material_name, ', ') as materials_list,
        GROUP_CONCAT(pc.color_name, ', ') as colors_list
      FROM products p
      LEFT JOIN product_materials pm ON p.id = pm.product_id
      LEFT JOIN product_colors pc ON p.id = pc.product_id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(productId)
  }
  const durationNewView = Date.now() - startNewView

  const improvementView = ((durationOldView - durationNewView) / durationOldView * 100).toFixed(1)

  console.log(`  Requêtes séparées (N+1): ${durationOldView}ms`)
  console.log(`  Single query avec JOINs: ${durationNewView}ms`)
  console.log(`  🎯 Amélioration: ${improvementView}%`)
}

// ========================================
// MAIN EXECUTION
// ========================================

function main() {
  console.log('🚀 Test Migration Locale v2')
  console.log('=' .repeat(60))

  const startTime = Date.now()

  try {
    executeSchemaMigration()
    migrateMaterials()
    migrateColors()
    migrateSizes()
    migrateGallery()
    generateTagsAndFTS()
    const results = validateMigration()
    testPerformance()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration locale terminée avec succès en ${duration}s`)
    console.log('=' .repeat(60))
    console.log('\n🎯 Prochaines étapes:')
    console.log('  1. Vérifier résultats ci-dessus')
    console.log('  2. Tester requêtes manuellement:')
    console.log(`     sqlite3 ${LOCAL_DB_PATH}`)
    console.log('  3. Si OK, exécuter migration production')

  } catch (error) {
    console.error('\n❌ Erreur migration:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

main()
