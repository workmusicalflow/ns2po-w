/**
 * Script de migration automatique: Airtable Réalisations → Turso
 * Usage: node --loader tsx migrate-realisations-from-airtable.ts
 * ATTENTION: Exécuter APRÈS avoir appliqué la migration 004_create_realisations.sql
 */

import { config } from 'dotenv'
import { getDatabase } from './standalone-database'

// Configuration environnement
config()

const AIRTABLE_BASE_ID = "apprQLdnVwlbfnioT"
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_TABLE = "Realisations"

interface AirtableRealisation {
  id: string
  fields: {
    Title?: string
    Description?: string
    CloudinaryPublicIds?: string | string[]
    Products?: string[]
    Categories?: string[]
    CustomizationOptions?: string[]
    Tags?: string[]
    IsFeatured?: boolean
    DisplayOrder?: number
    IsActive?: boolean
  }
}

interface TursoRealisationRow {
  id: string
  title: string
  description?: string
  cloudinary_public_ids: string // JSON array
  product_ids: string // JSON array
  category_ids: string // JSON array
  customization_option_ids: string // JSON array
  tags: string // JSON array
  is_featured: boolean
  order_position: number
  is_active: boolean
  source: 'airtable'
  created_at: string
  updated_at: string
}

/**
 * Récupère toutes les réalisations depuis Airtable
 */
async function fetchAllAirtableRealisations(): Promise<AirtableRealisation[]> {
  console.log(`🔄 Récupération des réalisations depuis Airtable...`)

  if (!AIRTABLE_API_KEY) {
    throw new Error("❌ AIRTABLE_API_KEY manquante dans les variables d'environnement")
  }

  const allRecords: AirtableRealisation[] = []
  let offset: string | undefined

  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`)

    // Pagination Airtable
    if (offset) {
      url.searchParams.set('offset', offset)
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`❌ Erreur Airtable ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    allRecords.push(...(data.records || []))
    offset = data.offset

    console.log(`📄 Batch: +${data.records?.length || 0} réalisations (total: ${allRecords.length})`)

  } while (offset)

  console.log(`✅ Total récupéré: ${allRecords.length} réalisations Airtable`)
  return allRecords
}

/**
 * Transforme une réalisation Airtable vers format Turso
 */
function transformAirtableToTurso(airtableRealisation: AirtableRealisation): TursoRealisationRow {
  const fields = airtableRealisation.fields

  // Parse CloudinaryPublicIds (peut être string CSV ou array)
  let cloudinaryIds: string[] = []
  if (fields.CloudinaryPublicIds) {
    if (typeof fields.CloudinaryPublicIds === 'string') {
      cloudinaryIds = fields.CloudinaryPublicIds
        .split(',')
        .map(id => id.trim())
        .filter(id => id)
    } else if (Array.isArray(fields.CloudinaryPublicIds)) {
      cloudinaryIds = fields.CloudinaryPublicIds
    }
  }

  const now = new Date().toISOString()

  return {
    id: `airtable-${airtableRealisation.id}`, // Préfixe pour éviter collision
    title: fields.Title || 'Sans titre',
    description: fields.Description || undefined,
    cloudinary_public_ids: JSON.stringify(cloudinaryIds),
    product_ids: JSON.stringify(fields.Products || []),
    category_ids: JSON.stringify(fields.Categories || []),
    customization_option_ids: JSON.stringify(fields.CustomizationOptions || []),
    tags: JSON.stringify(fields.Tags || []),
    is_featured: fields.IsFeatured || false,
    order_position: fields.DisplayOrder || 0,
    is_active: fields.IsActive !== false, // Active par défaut
    source: 'airtable',
    created_at: now,
    updated_at: now
  }
}

/**
 * Insère les réalisations dans Turso
 */
async function insertRealisationsIntoTurso(realisations: TursoRealisationRow[]) {
  const db = getDatabase()
  if (!db) {
    throw new Error("❌ Impossible de se connecter à Turso. Vérifier TURSO_DATABASE_URL")
  }

  console.log(`🏗️ Insertion de ${realisations.length} réalisations dans Turso...`)

  // Vider la table d'abord (pour éviter doublons lors de tests)
  console.log(`🧹 Nettoyage table realisations...`)
  await db.execute("DELETE FROM realisations WHERE source = 'airtable'")

  // Préparer statement d'insertion
  const insertSql = `
    INSERT INTO realisations (
      id, title, description, cloudinary_public_ids, product_ids, category_ids,
      customization_option_ids, tags, is_featured, order_position, is_active,
      source, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `

  let successCount = 0
  let errorCount = 0

  // Insertion batch par batch (pour éviter timeout)
  const batchSize = 50
  for (let i = 0; i < realisations.length; i += batchSize) {
    const batch = realisations.slice(i, i + batchSize)

    for (const realisation of batch) {
      try {
        await db.execute({
          sql: insertSql,
          args: [
            realisation.id,
            realisation.title,
            realisation.description || null,
            realisation.cloudinary_public_ids,
            realisation.product_ids,
            realisation.category_ids,
            realisation.customization_option_ids,
            realisation.tags,
            realisation.is_featured,
            realisation.order_position,
            realisation.is_active,
            realisation.source,
            realisation.created_at,
            realisation.updated_at
          ]
        })
        successCount++
      } catch (error) {
        console.error(`❌ Erreur insertion ${realisation.id}:`, error)
        errorCount++
      }
    }

    console.log(`📦 Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} réalisations traitées`)
  }

  console.log(`✅ Migration terminée: ${successCount} succès, ${errorCount} erreurs`)
}

/**
 * Validation post-migration
 */
async function validateMigration() {
  const db = getDatabase()
  if (!db) return

  console.log(`🔍 Validation post-migration...`)

  // Statistiques générales
  const statsResult = await db.execute("SELECT * FROM realisation_statistics")
  console.log(`📊 Statistiques:`, statsResult.rows[0])

  // Réalisations actives
  const activeResult = await db.execute(`
    SELECT COUNT(*) as count, source
    FROM realisations
    WHERE is_active = 1
    GROUP BY source
  `)
  console.log(`🎯 Réalisations actives par source:`)
  activeResult.rows.forEach(row => {
    console.log(`  - ${row.source}: ${row.count}`)
  })

  // Test requête complexe (avec JSON)
  const jsonTestResult = await db.execute(`
    SELECT
      title,
      json_array_length(cloudinary_public_ids) as nb_images,
      json_array_length(product_ids) as nb_products
    FROM realisations
    WHERE source = 'airtable' AND is_active = 1
    LIMIT 3
  `)
  console.log(`🧪 Test requêtes JSON:`)
  jsonTestResult.rows.forEach(row => {
    console.log(`  - "${row.title}": ${row.nb_images} images, ${row.nb_products} produits`)
  })
}

/**
 * Script principal de migration
 */
async function runMigration() {
  const startTime = Date.now()

  try {
    console.log(`🚀 MIGRATION AIRTABLE → TURSO RÉALISATIONS`)
    console.log(`📅 Début: ${new Date().toISOString()}`)
    console.log(`─────────────────────────────────────────────`)

    // 1. Récupération données Airtable
    const airtableRealisations = await fetchAllAirtableRealisations()

    if (airtableRealisations.length === 0) {
      console.log(`⚠️ Aucune réalisation trouvée dans Airtable`)
      return
    }

    // 2. Transformation vers format Turso
    console.log(`🔄 Transformation vers format Turso...`)
    const tursoRealisations = airtableRealisations.map(transformAirtableToTurso)

    // Statistiques de transformation
    const activeCount = tursoRealisations.filter(r => r.is_active).length
    const featuredCount = tursoRealisations.filter(r => r.is_featured).length
    const withImagesCount = tursoRealisations.filter(r =>
      JSON.parse(r.cloudinary_public_ids).length > 0
    ).length

    console.log(`📈 Analyse transformation:`)
    console.log(`  - ${tursoRealisations.length} réalisations totales`)
    console.log(`  - ${activeCount} actives (${Math.round(activeCount/tursoRealisations.length*100)}%)`)
    console.log(`  - ${featuredCount} mises en avant`)
    console.log(`  - ${withImagesCount} avec images Cloudinary`)

    // 3. Insertion dans Turso
    await insertRealisationsIntoTurso(tursoRealisations)

    // 4. Validation
    await validateMigration()

    const duration = Date.now() - startTime
    console.log(`─────────────────────────────────────────────`)
    console.log(`✅ MIGRATION RÉUSSIE en ${duration}ms`)
    console.log(`📅 Fin: ${new Date().toISOString()}`)

  } catch (error) {
    console.error(`❌ ERREUR MIGRATION:`, error)
    process.exit(1)
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
}

export { runMigration, fetchAllAirtableRealisations, transformAirtableToTurso }