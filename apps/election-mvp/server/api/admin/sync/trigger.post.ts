/**
 * API Route: POST /api/admin/sync/trigger
 * Déclenche une synchronisation manuelle Airtable → Turso
 */

import { getDatabase } from "~/server/utils/database"
import { fetchAirtableRecords } from "~/server/utils/airtable"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('🔄 POST /api/admin/sync/trigger - Déclenchement synchronisation manuelle')

    // Récupération du body pour le type de sync
    const body = await readBody(event)
    const { syncType = 'all', force = false } = body

    // Validation des paramètres
    const validSyncTypes = ['all', 'products', 'bundles', 'categories']
    if (!validSyncTypes.includes(syncType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Type de synchronisation invalide',
        data: { validTypes: validSyncTypes }
      })
    }

    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    const results = {
      syncType,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: 0,
      products: { synced: 0, errors: 0 },
      bundles: { synced: 0, errors: 0 },
      categories: { synced: 0, errors: 0 },
      errors: []
    }

    try {
      // Synchronisation des catégories (si nécessaire pour les produits)
      if (syncType === 'all' || syncType === 'categories') {
        console.log('📂 Synchronisation des catégories...')
        try {
          const categories = await fetchAirtableRecords('Categories')

          for (const category of categories) {
            try {
              await db.execute({
                sql: `INSERT OR REPLACE INTO categories (
                  id, airtable_id, name, description, slug, is_active, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                args: [
                  category.id,
                  category.id,
                  category.fields.Name || '',
                  category.fields.Description || '',
                  category.fields.Slug || category.fields.Name?.toLowerCase().replace(/\s+/g, '-') || '',
                  category.fields.Active !== false ? 1 : 0
                ]
              })
              results.categories.synced++
            } catch (error) {
              console.error(`❌ Erreur sync catégorie ${category.id}:`, error)
              results.categories.errors++
              results.errors.push(`Catégorie ${category.id}: ${error.message}`)
            }
          }
        } catch (error) {
          console.error('❌ Erreur récupération catégories Airtable:', error)
          results.errors.push(`Catégories: ${error.message}`)
        }
      }

      // Synchronisation des produits
      if (syncType === 'all' || syncType === 'products') {
        console.log('📦 Synchronisation des produits...')
        try {
          const products = await fetchAirtableRecords('Produits')

          for (const product of products) {
            try {
              await db.execute({
                sql: `INSERT OR REPLACE INTO products (
                  id, airtable_id, name, reference, description, category_id,
                  price, image_url, is_active, is_featured, stock_status,
                  min_quantity, max_quantity, tags, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                args: [
                  product.id,
                  product.id,
                  product.fields.Name || '',
                  product.fields.Reference || '',
                  product.fields.Description || '',
                  product.fields.Category?.[0] || null,
                  Number(product.fields.Price) || 0,
                  product.fields.Image?.[0]?.url || null,
                  product.fields.Active !== false ? 1 : 0,
                  product.fields.Featured === true ? 1 : 0,
                  product.fields.Stock || 'available',
                  Number(product.fields.MinQuantity) || 1,
                  Number(product.fields.MaxQuantity) || 1000,
                  JSON.stringify(product.fields.Tags || [])
                ]
              })
              results.products.synced++
            } catch (error) {
              console.error(`❌ Erreur sync produit ${product.id}:`, error)
              results.products.errors++
              results.errors.push(`Produit ${product.id}: ${error.message}`)
            }
          }
        } catch (error) {
          console.error('❌ Erreur récupération produits Airtable:', error)
          results.errors.push(`Produits: ${error.message}`)
        }
      }

      // Synchronisation des bundles
      if (syncType === 'all' || syncType === 'bundles') {
        console.log('🎁 Synchronisation des bundles...')
        try {
          const bundles = await fetchAirtableRecords('Campaign_Bundles')

          for (const bundle of bundles) {
            try {
              await db.execute({
                sql: `INSERT OR REPLACE INTO campaign_bundles (
                  id, airtable_id, name, description, target_audience, budget_range,
                  estimated_total, original_total, savings, popularity, is_active,
                  is_featured, tags, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                args: [
                  bundle.id,
                  bundle.id,
                  bundle.fields.Name || '',
                  bundle.fields.Description || '',
                  bundle.fields.TargetAudience || 'universal',
                  bundle.fields.BudgetRange || 'medium',
                  Number(bundle.fields.EstimatedTotal) || 0,
                  Number(bundle.fields.OriginalTotal) || 0,
                  Number(bundle.fields.Savings) || 0,
                  Number(bundle.fields.Popularity) || 5,
                  bundle.fields.Active !== false ? 1 : 0,
                  bundle.fields.Featured === true ? 1 : 0,
                  JSON.stringify(bundle.fields.Tags || [])
                ]
              })
              results.bundles.synced++
            } catch (error) {
              console.error(`❌ Erreur sync bundle ${bundle.id}:`, error)
              results.bundles.errors++
              results.errors.push(`Bundle ${bundle.id}: ${error.message}`)
            }
          }
        } catch (error) {
          console.error('❌ Erreur récupération bundles Airtable:', error)
          results.errors.push(`Bundles: ${error.message}`)
        }
      }

      results.endTime = new Date().toISOString()
      results.duration = Date.now() - startTime

      // Enregistrer le log de synchronisation
      try {
        await db.execute({
          sql: `INSERT INTO sync_logs (
            sync_type, status, items_synced, errors_count, duration,
            details, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          args: [
            syncType,
            results.errors.length === 0 ? 'success' : 'partial',
            results.products.synced + results.bundles.synced + results.categories.synced,
            results.products.errors + results.bundles.errors + results.categories.errors,
            results.duration,
            JSON.stringify(results)
          ]
        })
      } catch (logError) {
        console.error('❌ Erreur enregistrement log sync:', logError)
      }

      console.log(`✅ Synchronisation ${syncType} terminée:`, {
        synced: results.products.synced + results.bundles.synced + results.categories.synced,
        errors: results.errors.length,
        duration: results.duration
      })

      return {
        success: true,
        data: results
      }

    } catch (syncError) {
      console.error('❌ Erreur synchronisation:', syncError)

      // Enregistrer l'erreur dans les logs
      try {
        await db.execute({
          sql: `INSERT INTO sync_logs (
            sync_type, status, items_synced, errors_count, duration,
            details, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          args: [
            syncType,
            'error',
            0,
            1,
            Date.now() - startTime,
            JSON.stringify({ error: syncError.message, stack: syncError.stack })
          ]
        })
      } catch (logError) {
        console.error('❌ Erreur enregistrement log d\'erreur:', logError)
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la synchronisation',
        data: { error: syncError.message }
      })
    }

  } catch (error) {
    console.error('❌ Erreur POST /api/admin/sync/trigger:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})