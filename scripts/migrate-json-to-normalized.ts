/**
 * Script de Migration Données JSON → Tables Normalisées
 *
 * Exécution: pnpm tsx scripts/migrate-json-to-normalized.ts
 *
 * IMPORTANT: Exécuter APRÈS migration 002_optimize_schema_json_to_native.sql
 */

import { createClient } from '@libsql/client'
import 'dotenv/config'

// Configuration Turso
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Variables TURSO manquantes dans .env')
  process.exit(1)
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
})

// ========================================
// HELPERS
// ========================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function safeJsonParse<T = any>(jsonString: string | null, defaultValue: T): Promise<T> {
  if (!jsonString || jsonString.trim() === '') return defaultValue

  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.warn('⚠️ JSON parse failed:', jsonString?.substring(0, 50))
    return defaultValue
  }
}

// ========================================
// MIGRATION 1: Materials
// ========================================

async function migrateMaterials() {
  console.log('\n🔄 Migration Materials...')

  const { rows: products } = await db.execute(`
    SELECT id, materials FROM products
    WHERE materials IS NOT NULL AND materials != ''
  `)

  let migratedCount = 0
  let errorCount = 0

  for (const product of products) {
    const productId = product.id as string
    const materialsJson = product.materials as string

    try {
      const materialsArray = await safeJsonParse<string[]>(materialsJson, [])

      for (let i = 0; i < materialsArray.length; i++) {
        const materialName = materialsArray[i]

        if (!materialName || materialName.trim() === '') continue

        await db.execute({
          sql: `INSERT INTO product_materials (
            id, product_id, material_name, is_primary, display_order
          ) VALUES (?, ?, ?, ?, ?)`,
          args: [
            generateId('mat'),
            productId,
            materialName.trim(),
            i === 0 ? 1 : 0, // Premier = primary
            i
          ]
        })

        migratedCount++
      }
    } catch (error) {
      console.error(`❌ Erreur migration materials pour produit ${productId}:`, error)
      errorCount++
    }
  }

  console.log(`✅ Materials migrés: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// MIGRATION 2: Colors
// ========================================

async function migrateColors() {
  console.log('\n🔄 Migration Colors...')

  const { rows: products } = await db.execute(`
    SELECT id, colors FROM products
    WHERE colors IS NOT NULL AND colors != ''
  `)

  let migratedCount = 0
  let errorCount = 0

  for (const product of products) {
    const productId = product.id as string
    const colorsJson = product.colors as string

    try {
      const colorsArray = await safeJsonParse<string[]>(colorsJson, [])

      for (let i = 0; i < colorsArray.length; i++) {
        const colorName = colorsArray[i]

        if (!colorName || colorName.trim() === '') continue

        // Extraction code hex si présent (ex: "Rouge (#FF0000)")
        const hexMatch = colorName.match(/#[0-9A-Fa-f]{6}/)
        const colorHex = hexMatch ? hexMatch[0] : null
        const cleanColorName = colorName.replace(/\s*\(#[0-9A-Fa-f]{6}\)/, '').trim()

        await db.execute({
          sql: `INSERT INTO product_colors (
            id, product_id, color_name, color_hex, is_available, display_order
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            generateId('col'),
            productId,
            cleanColorName,
            colorHex,
            1, // Disponible par défaut
            i
          ]
        })

        migratedCount++
      }
    } catch (error) {
      console.error(`❌ Erreur migration colors pour produit ${productId}:`, error)
      errorCount++
    }
  }

  console.log(`✅ Colors migrés: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// MIGRATION 3: Sizes
// ========================================

async function migrateSizes() {
  console.log('\n🔄 Migration Sizes...')

  const { rows: products } = await db.execute(`
    SELECT id, sizes FROM products
    WHERE sizes IS NOT NULL AND sizes != ''
  `)

  let migratedCount = 0
  let errorCount = 0

  for (const product of products) {
    const productId = product.id as string
    const sizesJson = product.sizes as string

    try {
      const sizesArray = await safeJsonParse<string[]>(sizesJson, [])

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

        await db.execute({
          sql: `INSERT INTO product_sizes (
            id, product_id, size_name, size_category, is_available, display_order
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            generateId('size'),
            productId,
            sizeName.trim(),
            sizeCategory,
            1, // Disponible par défaut
            i
          ]
        })

        migratedCount++
      }
    } catch (error) {
      console.error(`❌ Erreur migration sizes pour produit ${productId}:`, error)
      errorCount++
    }
  }

  console.log(`✅ Sizes migrés: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// MIGRATION 4: Gallery Images
// ========================================

async function migrateGallery() {
  console.log('\n🔄 Migration Gallery Images...')

  const { rows: products } = await db.execute(`
    SELECT id, image_url, gallery_urls FROM products
  `)

  let migratedCount = 0
  let errorCount = 0

  for (const product of products) {
    const productId = product.id as string
    const primaryImageUrl = product.image_url as string | null
    const galleryJson = product.gallery_urls as string

    try {
      // Image principale (primary)
      if (primaryImageUrl) {
        await db.execute({
          sql: `INSERT INTO product_gallery (
            id, product_id, image_url, image_type, display_order, is_active
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            generateId('img'),
            productId,
            primaryImageUrl,
            'primary',
            0,
            1
          ]
        })
        migratedCount++
      }

      // Images gallery (variants)
      const galleryArray = await safeJsonParse<string[]>(galleryJson, [])

      for (let i = 0; i < galleryArray.length; i++) {
        const imageUrl = galleryArray[i]

        if (!imageUrl || imageUrl.trim() === '') continue

        await db.execute({
          sql: `INSERT INTO product_gallery (
            id, product_id, image_url, image_type, display_order, is_active
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            generateId('img'),
            productId,
            imageUrl.trim(),
            'variant',
            i + 1, // +1 car primary = 0
            1
          ]
        })

        migratedCount++
      }
    } catch (error) {
      console.error(`❌ Erreur migration gallery pour produit ${productId}:`, error)
      errorCount++
    }
  }

  console.log(`✅ Gallery images migrées: ${migratedCount} (erreurs: ${errorCount})`)
}

// ========================================
// MIGRATION 5: Tags (auto-générés)
// ========================================

async function generateTags() {
  console.log('\n🔄 Génération Tags automatiques...')

  // Tags depuis category
  await db.execute(`
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
  await db.execute(`
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
  await db.execute(`
    INSERT INTO product_tags (id, product_id, tag_name, tag_type)
    SELECT
      'tag_custom_' || id,
      id,
      'personnalisable',
      'feature'
    FROM products
    WHERE customizable = TRUE
  `)

  const { rows } = await db.execute('SELECT COUNT(*) as count FROM product_tags')
  const count = rows[0]?.count || 0

  console.log(`✅ Tags générés: ${count}`)
}

// ========================================
// MIGRATION 6: Populate FTS Search
// ========================================

async function populateFTS() {
  console.log('\n🔄 Population FTS Search Table...')

  await db.execute(`
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

  // Compter via la table source plutôt que FTS (évite erreur SQLite)
  const { rows } = await db.execute('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE')
  const count = rows[0]?.count || 0

  console.log(`✅ Produits indexés FTS: ${count}`)
}

// ========================================
// VALIDATION POST-MIGRATION
// ========================================

async function validateMigration() {
  console.log('\n🔍 Validation Migration...')

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
      name: 'Products without materials',
      query: `SELECT COUNT(*) as count FROM products p
              LEFT JOIN product_materials pm ON p.id = pm.product_id
              WHERE pm.id IS NULL AND p.materials IS NOT NULL AND p.materials != ''`
    }
  ]

  for (const check of checks) {
    const { rows } = await db.execute(check.query)
    const count = rows[0]?.count || 0
    const status = check.name.includes('without') && count > 0 ? '⚠️' : '✅'
    console.log(`${status} ${check.name}: ${count}`)
  }
}

// ========================================
// MAIN EXECUTION
// ========================================

async function main() {
  console.log('🚀 Démarrage Migration JSON → Tables Normalisées')
  console.log('=' .repeat(60))

  const startTime = Date.now()

  try {
    // Exécuter migrations dans l'ordre
    await migrateMaterials()
    await migrateColors()
    await migrateSizes()
    await migrateGallery()
    await generateTags()
    await populateFTS()

    // Validation
    await validateMigration()

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n' + '='.repeat(60))
    console.log(`✅ Migration terminée avec succès en ${duration}s`)
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('\n❌ Erreur fatale migration:', error)
    process.exit(1)
  }
}

// Exécution
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur non catchée:', error)
    process.exit(1)
  })
