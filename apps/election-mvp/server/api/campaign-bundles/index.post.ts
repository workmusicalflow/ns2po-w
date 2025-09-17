/**
 * API Route: POST /api/campaign-bundles
 * Crée un nouveau campaign bundle
 */

import { getDatabase } from "~/server/utils/database"
import { campaignBundleSchema, validateBundleProducts, validateBundleTotal, validateBundleBusinessRules } from "~/schemas/bundle"
import { z } from "zod"

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

    // Validations métier supplémentaires
    const productErrors = validateBundleProducts(validatedData.products)
    const totalErrors = validateBundleTotal(validatedData)
    const businessErrors = validateBundleBusinessRules(validatedData)

    const allErrors = [...productErrors, ...totalErrors, ...businessErrors]
    if (allErrors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: { errors: allErrors }
      })
    }

    // Génération de l'ID
    const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Calculs automatiques
    const calculatedTotal = validatedData.products.reduce((total, product) => total + product.subtotal, 0)
    const savings = (validatedData.originalTotal || 0) - calculatedTotal

    // Accès à la base de données
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Transaction pour créer le bundle et ses produits
    try {
      // 1. Créer le bundle principal
      await db.execute({
        sql: `INSERT INTO campaign_bundles (
          id, airtable_id, name, description, target_audience, budget_range,
          estimated_total, original_total, savings, popularity, is_active,
          is_featured, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [
          bundleId,
          bundleId, // Utiliser le même ID pour airtable_id dans le contexte admin
          validatedData.name,
          validatedData.description,
          validatedData.targetAudience,
          validatedData.budgetRange,
          calculatedTotal,
          validatedData.originalTotal || calculatedTotal,
          savings,
          validatedData.popularity,
          validatedData.isActive ? 1 : 0,
          validatedData.isFeatured ? 1 : 0,
          JSON.stringify(validatedData.tags || [])
        ]
      })

      // 2. Créer les produits du bundle
      for (const product of validatedData.products) {
        await db.execute({
          sql: `INSERT INTO bundle_products (
            campaign_bundle_id, product_id, product_name, base_price,
            quantity, subtotal, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          args: [
            bundleId,
            product.id,
            product.name,
            product.basePrice,
            product.quantity,
            product.subtotal
          ]
        })
      }

      console.log(`✅ Bundle créé avec succès: ${bundleId}`)

      // Retourner le bundle créé
      const response = {
        success: true,
        data: {
          id: bundleId,
          ...validatedData,
          estimatedTotal: calculatedTotal,
          savings: savings,
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