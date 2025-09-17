/**
 * Test de validation migration Réalisations Airtable → Turso
 * Dry-run pour valider structure et connectivité SANS modifier les données
 * Usage: node --loader tsx test-migration-dry-run.ts
 */

import { config } from 'dotenv'
import { getDatabase } from './standalone-database'
import { fetchAllAirtableRealisations, transformAirtableToTurso } from './migrate-realisations-from-airtable'

// Configuration environnement
config()

/**
 * Test de connectivité Turso
 */
async function testTursoConnection() {
  console.log(`🔍 Test connectivité Turso...`)

  const db = getDatabase()
  if (!db) {
    throw new Error("❌ Impossible de se connecter à Turso. Vérifier TURSO_DATABASE_URL et TURSO_AUTH_TOKEN")
  }

  // Test simple
  const result = await db.execute("SELECT 1 as test")
  if (result.rows[0]?.test !== 1) {
    throw new Error("❌ Test de base Turso échoué")
  }

  console.log(`✅ Connectivité Turso validée`)
}

/**
 * Validation schéma Turso requis
 */
async function validateTursoSchema() {
  console.log(`🔍 Validation schéma Turso...`)

  const db = getDatabase()
  if (!db) throw new Error("❌ Connexion Turso impossible")

  // Vérifier table realisations existe
  const tablesResult = await db.execute(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name IN ('realisations', 'products', 'categories')
    ORDER BY name
  `)

  const existingTables = tablesResult.rows.map(row => row.name)
  const requiredTables = ['realisations', 'products', 'categories']

  console.log(`📊 Tables existantes: ${existingTables.join(', ')}`)

  for (const table of requiredTables) {
    if (!existingTables.includes(table)) {
      throw new Error(`❌ Table manquante: ${table}. Exécuter d'abord les migrations SQL.`)
    }
  }

  // Vérifier structure table realisations
  const columnsResult = await db.execute(`PRAGMA table_info(realisations)`)
  const columns = columnsResult.rows.map(row => row.name)

  const requiredColumns = [
    'id', 'title', 'description', 'cloudinary_public_ids',
    'product_ids', 'category_ids', 'customization_option_ids',
    'tags', 'is_featured', 'order_position', 'is_active', 'source'
  ]

  console.log(`📋 Colonnes realisations: ${columns.length} trouvées`)

  for (const column of requiredColumns) {
    if (!columns.includes(column)) {
      throw new Error(`❌ Colonne manquante: realisations.${column}`)
    }
  }

  console.log(`✅ Schéma Turso validé`)
}

/**
 * Test connectivité Airtable et récupération sample
 */
async function testAirtableConnection() {
  console.log(`🔍 Test connectivité Airtable...`)

  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error("❌ AIRTABLE_API_KEY manquante")
  }

  try {
    // Récupérer 1 seul enregistrement pour test
    const sampleRealisations = await fetchAllAirtableRealisations()

    console.log(`📊 Airtable: ${sampleRealisations.length} réalisations trouvées`)

    if (sampleRealisations.length === 0) {
      console.log(`⚠️ Aucune réalisation dans Airtable (normal si table vide)`)
      return []
    }

    // Analyser premier enregistrement
    const firstRealisation = sampleRealisations[0]
    console.log(`📝 Sample réalisation:`)
    console.log(`  - ID: ${firstRealisation.id}`)
    console.log(`  - Title: ${firstRealisation.fields.Title || 'N/A'}`)
    console.log(`  - CloudinaryPublicIds: ${JSON.stringify(firstRealisation.fields.CloudinaryPublicIds)}`)
    console.log(`  - Products: ${JSON.stringify(firstRealisation.fields.Products)}`)
    console.log(`  - Categories: ${JSON.stringify(firstRealisation.fields.Categories)}`)

    console.log(`✅ Connectivité Airtable validée`)
    return sampleRealisations.slice(0, 3) // Retourner seulement 3 samples

  } catch (error) {
    throw new Error(`❌ Erreur Airtable: ${error.message}`)
  }
}

/**
 * Test transformation données
 */
async function testDataTransformation(sampleRealisations: any[]) {
  console.log(`🔍 Test transformation données...`)

  if (sampleRealisations.length === 0) {
    console.log(`ℹ️ Pas de données à transformer (Airtable vide)`)
    return
  }

  try {
    const transformedSamples = sampleRealisations.map(transformAirtableToTurso)

    console.log(`📊 Transformation: ${transformedSamples.length} réalisations traitées`)

    // Analyser première transformation
    const firstTransformed = transformedSamples[0]
    console.log(`📝 Sample transformé:`)
    console.log(`  - ID: ${firstTransformed.id}`)
    console.log(`  - Title: ${firstTransformed.title}`)
    console.log(`  - Cloudinary IDs: ${firstTransformed.cloudinary_public_ids}`)
    console.log(`  - Product IDs: ${firstTransformed.product_ids}`)
    console.log(`  - Category IDs: ${firstTransformed.category_ids}`)
    console.log(`  - Source: ${firstTransformed.source}`)

    // Validation JSON
    try {
      JSON.parse(firstTransformed.cloudinary_public_ids)
      JSON.parse(firstTransformed.product_ids)
      JSON.parse(firstTransformed.category_ids)
      JSON.parse(firstTransformed.customization_option_ids)
      JSON.parse(firstTransformed.tags)
      console.log(`✅ Validation JSON: Tous les champs JSON sont valides`)
    } catch (jsonError) {
      throw new Error(`❌ JSON invalide: ${jsonError.message}`)
    }

    console.log(`✅ Transformation données validée`)

  } catch (error) {
    throw new Error(`❌ Erreur transformation: ${error.message}`)
  }
}

/**
 * Test relations avec tables existantes
 */
async function testRelationalIntegrity() {
  console.log(`🔍 Test intégrité relationnelle...`)

  const db = getDatabase()
  if (!db) throw new Error("❌ Connexion Turso impossible")

  // Vérifier quelques produits existent
  const productsResult = await db.execute("SELECT COUNT(*) as count FROM products WHERE is_active = 1")
  const productsCount = productsResult.rows[0]?.count || 0

  console.log(`📦 Products actifs dans Turso: ${productsCount}`)

  // Vérifier quelques catégories existent
  const categoriesResult = await db.execute("SELECT COUNT(*) as count FROM categories WHERE is_active = 1")
  const categoriesCount = categoriesResult.rows[0]?.count || 0

  console.log(`📂 Catégories actives dans Turso: ${categoriesCount}`)

  if (productsCount === 0) {
    console.log(`⚠️ Aucun produit actif dans Turso (migrations products peut-être manquante)`)
  }

  if (categoriesCount === 0) {
    console.log(`⚠️ Aucune catégorie active dans Turso (migration 003_create_categories.sql peut-être manquante)`)
  }

  console.log(`✅ Test intégrité relationnelle terminé`)
}

/**
 * Validation environnement complet
 */
async function validateEnvironment() {
  console.log(`🔍 Validation environnement...`)

  const requiredEnvVars = [
    'AIRTABLE_API_KEY',
    'TURSO_DATABASE_URL',
    'TURSO_AUTH_TOKEN'
  ]

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    throw new Error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}`)
  }

  console.log(`✅ Variables d'environnement validées`)
}

/**
 * Script principal de test
 */
async function runDryRunTest() {
  const startTime = Date.now()

  try {
    console.log(`🧪 TEST MIGRATION AIRTABLE → TURSO (DRY RUN)`)
    console.log(`📅 Début: ${new Date().toISOString()}`)
    console.log(`─────────────────────────────────────────────`)

    // 1. Validation environnement
    await validateEnvironment()

    // 2. Test connectivité Turso
    await testTursoConnection()

    // 3. Validation schéma Turso
    await validateTursoSchema()

    // 4. Test connectivité Airtable
    const sampleRealisations = await testAirtableConnection()

    // 5. Test transformation données
    await testDataTransformation(sampleRealisations)

    // 6. Test intégrité relationnelle
    await testRelationalIntegrity()

    const duration = Date.now() - startTime
    console.log(`─────────────────────────────────────────────`)
    console.log(`✅ DRY RUN RÉUSSI en ${duration}ms`)
    console.log(`📅 Fin: ${new Date().toISOString()}`)
    console.log(``)
    console.log(`🚀 La migration peut être exécutée en toute sécurité !`)
    console.log(`💡 Commande: node --loader tsx migrate-realisations-from-airtable.ts`)

  } catch (error) {
    console.error(`❌ ERREUR DRY RUN:`, error.message)
    console.log(``)
    console.log(`🛠️ Actions recommandées:`)
    console.log(`  - Vérifier variables d'environnement (.env)`)
    console.log(`  - Exécuter migrations SQL manquantes`)
    console.log(`  - Vérifier connectivité Airtable/Turso`)
    process.exit(1)
  }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runDryRunTest()
}

export { runDryRunTest }