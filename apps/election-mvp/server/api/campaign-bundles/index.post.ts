/**
 * API Route: POST /api/campaign-bundles
 * Crée un nouveau campaign bundle
 */

import { getDatabase } from "../../utils/database"
import { campaignBundleSchema, validateBundleProducts, validateBundleTotal, validateBundleBusinessRules, validateFeaturedBundleLimit } from "~/schemas/bundle"
import { z } from "zod"
import { invalidateCampaignBundlesCache } from "../../utils/cache-invalidation"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log("📦 POST /api/campaign-bundles - Création d'un nouveau bundle")

    // Récupération du body
    const body = await readBody(event)

    // 🐛 DEBUG: Logger body AVANT validation Zod
    console.log('🔍 [POST BUNDLE] Body AVANT validation Zod:',{
      products: body.products?.map((p: any) => ({
        id: p.id,
        basePrice: p.basePrice,
        priceLocked: p.priceLocked
      }))
    })

    // Validation du schéma
    let validatedData
    try {
      validatedData = campaignBundleSchema.parse(body)

      // 🐛 DEBUG: Logger APRÈS validation Zod
      console.log('🔍 [POST BUNDLE] Products APRÈS validation Zod:', {
        products: validatedData.products?.map((p: any) => ({
          id: p.id,
          basePrice: p.basePrice,
          priceLocked: p.priceLocked
        }))
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Données invalides',
          data: {
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        })
      }
      throw error
    }

    // Accès à la base de données (nécessaire pour certaines validations)
    const db = getDatabase()

    // Validations métier supplémentaires
    const productErrors = validateBundleProducts(validatedData.products)
    const totalErrors = validateBundleTotal(validatedData)
    const businessErrors = validateBundleBusinessRules(validatedData)

    let allErrors = [...productErrors, ...totalErrors, ...businessErrors]

    // Validation des bundles vedettes (nécessite l'accès à la base de données)
    if (db && validatedData.isFeatured) {
      const featuredErrors = await validateFeaturedBundleLimit(validatedData, db, false)
      allErrors = [...allErrors, ...featuredErrors]
    }

    if (allErrors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: { errors: allErrors }
      })
    }

    // Vérifier que la base de données est disponible
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Calculs automatiques
    const calculatedTotal = validatedData.products.reduce((total, product) => total + product.subtotal, 0)
    const savings = (validatedData.originalTotal || 0) - calculatedTotal

    // 🔧 FIX TURSO REPLICATION: Utiliser db.batch() pour transaction atomique
    // Source: Gemini Copilot + Google Search Grounding (turso.tech, dev.to)
    // Garantit que bundle + produits sont committés ensemble (évite race conditions)
    try {
      // Calcul du prix de base et remise
      const originalTotal = validatedData.originalTotal || calculatedTotal
      const discountPercentage = originalTotal > 0 ? ((originalTotal - calculatedTotal) / originalTotal * 100) : 0

      // Préparer toutes les statements pour batch atomique
      const batchStatements: Array<{ sql: string; args: any[] }> = []

      // 1. Statement INSERT bundle principal
      batchStatements.push({
        sql: `INSERT INTO campaign_bundles (
          name, description, target_audience, base_price, discount_percentage,
          is_active, display_order, icon, color, features
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          validatedData.name,
          validatedData.description,
          validatedData.targetAudience,
          originalTotal,
          discountPercentage,
          validatedData.isActive ? 1 : 0,
          validatedData.displayOrder || 0,
          validatedData.icon || null,
          validatedData.color || null,
          JSON.stringify(validatedData.tags || [])
        ]
      })

      // ⚠️ IMPORTANT: Batch exécute dans l'ordre, donc on peut récupérer lastInsertRowid après
      // Mais on ne peut pas l'utiliser DANS le batch pour les produits
      // Solution: Faire 2 opérations séquentielles avec transaction implicite

      // Exécuter INSERT bundle (batch de 1 pour cohérence)
      const bundleResults = await db.batch([batchStatements[0]], "write")
      const newBundleId = Number(bundleResults[0].lastInsertRowid)

      console.log('🔍 [POST BUNDLE] ID généré:', newBundleId)

      // 2. Préparer statements INSERT produits avec le bundle_id
      const productStatements: Array<{ sql: string; args: any[] }> = []

      for (let i = 0; i < validatedData.products.length; i++) {
        const product = validatedData.products[i]

        console.log(`🔍 [POST BUNDLE] Insertion produit ${i + 1}:`, {
          product_id: product.id,
          basePrice_from_request: product.basePrice,
          priceLocked_from_request: product.priceLocked,
          will_insert_custom_price: product.basePrice,
          will_insert_price_locked: product.priceLocked ? 1 : 0
        })

        productStatements.push({
          sql: `INSERT INTO bundle_products (
            bundle_id, product_id, quantity, custom_price, is_required, display_order, price_locked
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            newBundleId,
            product.id,
            product.quantity,
            product.basePrice,
            1, // is_required: true par défaut
            i + 1, // display_order
            product.priceLocked ? 1 : 0
          ]
        })
      }

      // Exécuter TOUS les INSERTs produits en une seule transaction atomique
      await db.batch(productStatements, "write")

      console.log(`✅ Bundle + ${validatedData.products.length} produits créés atomiquement: ${newBundleId}`)

      // ⭐ INVALIDATION CACHE REDIS (architecture unifiée)
      try {
        await invalidateCampaignBundlesCache()
        console.log('🗑️ [POST BUNDLE] Cache Redis invalidé')
      } catch (cacheError) {
        console.error('❌ [POST BUNDLE] Échec invalidation cache:', cacheError)
        // Continue sans bloquer (non-critique pour cette création)
      }

      // 🐛 DEBUG: Lire les valeurs réellement insérées dans la DB
      const insertedProducts = await db.execute({
        sql: `SELECT product_id, custom_price, price_locked FROM bundle_products WHERE bundle_id = ?`,
        args: [newBundleId]
      })

      console.log('🔍 [POST BUNDLE] Valeurs DB après INSERT:', insertedProducts.rows)

      // Retourner le bundle créé
      const response = {
        success: true,
        data: {
          id: newBundleId,
          ...validatedData,
          estimatedTotal: calculatedTotal,
          originalTotal: originalTotal,
          savings: savings,
          discountPercentage: discountPercentage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        duration: Date.now() - startTime,
        // 🐛 DEBUG: Exposer les valeurs DB dans la réponse API pour diagnostic
        _debug: process.env.NODE_ENV === 'development' ? {
          inserted_db_values: insertedProducts.rows
        } : undefined
      }

      setResponseStatus(event, 201)
      return response

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la création du bundle',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error("❌ Erreur POST /api/campaign-bundles:", error)

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