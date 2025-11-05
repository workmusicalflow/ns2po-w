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

    // Validation du schéma
    let validatedData
    try {
      validatedData = campaignBundleSchema.parse(body)
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

    // Transaction pour créer le bundle et ses produits
    try {
      // Calcul du prix de base et remise
      const originalTotal = validatedData.originalTotal || calculatedTotal
      const discountPercentage = originalTotal > 0 ? ((originalTotal - calculatedTotal) / originalTotal * 100) : 0

      // 1. Créer le bundle principal
      const bundleResult = await db.execute({
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

      const newBundleId = bundleResult.lastInsertRowid

      // 2. Créer les produits du bundle
      for (let i = 0; i < validatedData.products.length; i++) {
        const product = validatedData.products[i]
        await db.execute({
          sql: `INSERT INTO bundle_products (
            bundle_id, product_id, quantity, custom_price, is_required, display_order
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            newBundleId,
            product.id,
            product.quantity,
            product.basePrice, // Utiliser comme prix custom si différent du prix produit
            product.isRequired !== false ? 1 : 0, // true par défaut
            i + 1 // Ordre basé sur la position dans le tableau
          ]
        })
      }

      console.log(`✅ Bundle créé avec succès: ${newBundleId}`)

      // ⭐ INVALIDATION CACHE REDIS (architecture unifiée)
      try {
        await invalidateCampaignBundlesCache()
        console.log('🗑️ [POST BUNDLE] Cache Redis invalidé')
      } catch (cacheError) {
        console.error('❌ [POST BUNDLE] Échec invalidation cache:', cacheError)
        // Continue sans bloquer (non-critique pour cette création)
      }

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
        duration: Date.now() - startTime
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