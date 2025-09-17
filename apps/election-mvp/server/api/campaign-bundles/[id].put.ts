/**
 * API Route: PUT /api/campaign-bundles/[id]
 * Met à jour un campaign bundle existant
 */

import { getDatabase } from "~/server/utils/database"
import { campaignBundleUpdateSchema, validateBundleProducts, validateBundleTotal, validateBundleBusinessRules } from "~/schemas/bundle"
import { z } from "zod"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const bundleId = getRouterParam(event, 'id')
    console.log(`📦 PUT /api/campaign-bundles/${bundleId} - Mise à jour bundle`)

    if (!bundleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du bundle requis'
      })
    }

    // Récupération du body
    const body = await readBody(event)

    // Ajouter l'ID au body pour la validation
    body.id = bundleId

    // Validation du schéma
    let validatedData
    try {
      validatedData = campaignBundleUpdateSchema.parse(body)
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

    // Accès à la base de données
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le bundle existe
    const existingBundle = await db.execute({
      sql: 'SELECT id FROM campaign_bundles WHERE id = ? OR airtable_id = ?',
      args: [bundleId, bundleId]
    })

    if (existingBundle.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    }

    // Validations métier si des produits sont fournis
    if (validatedData.products) {
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
    }

    // Calculs automatiques si des produits sont fournis
    let calculatedTotal = validatedData.estimatedTotal
    let savings = validatedData.savings

    if (validatedData.products) {
      calculatedTotal = validatedData.products.reduce((total, product) => total + product.subtotal, 0)
      savings = (validatedData.originalTotal || 0) - calculatedTotal
    }

    try {
      // Construire la requête UPDATE dynamiquement
      const updateFields = []
      const updateArgs = []

      if (validatedData.name !== undefined) {
        updateFields.push('name = ?')
        updateArgs.push(validatedData.name)
      }

      if (validatedData.description !== undefined) {
        updateFields.push('description = ?')
        updateArgs.push(validatedData.description)
      }

      if (validatedData.targetAudience !== undefined) {
        updateFields.push('target_audience = ?')
        updateArgs.push(validatedData.targetAudience)
      }

      if (validatedData.budgetRange !== undefined) {
        updateFields.push('budget_range = ?')
        updateArgs.push(validatedData.budgetRange)
      }

      if (calculatedTotal !== undefined) {
        updateFields.push('estimated_total = ?')
        updateArgs.push(calculatedTotal)
      }

      if (validatedData.originalTotal !== undefined) {
        updateFields.push('original_total = ?')
        updateArgs.push(validatedData.originalTotal)
      }

      if (savings !== undefined) {
        updateFields.push('savings = ?')
        updateArgs.push(savings)
      }

      if (validatedData.popularity !== undefined) {
        updateFields.push('popularity = ?')
        updateArgs.push(validatedData.popularity)
      }

      if (validatedData.isActive !== undefined) {
        updateFields.push('is_active = ?')
        updateArgs.push(validatedData.isActive ? 1 : 0)
      }

      if (validatedData.isFeatured !== undefined) {
        updateFields.push('is_featured = ?')
        updateArgs.push(validatedData.isFeatured ? 1 : 0)
      }

      if (validatedData.tags !== undefined) {
        updateFields.push('tags = ?')
        updateArgs.push(JSON.stringify(validatedData.tags))
      }

      // Toujours mettre à jour updated_at
      updateFields.push('updated_at = datetime(\'now\')')
      updateArgs.push(bundleId) // Pour la clause WHERE

      if (updateFields.length > 1) { // Plus que juste updated_at
        const sql = `UPDATE campaign_bundles SET ${updateFields.join(', ')} WHERE id = ? OR airtable_id = ?`
        updateArgs.push(bundleId) // Deuxième paramètre pour la clause WHERE

        await db.execute({
          sql,
          args: updateArgs
        })
      }

      // Mettre à jour les produits si fournis
      if (validatedData.products) {
        // Supprimer les anciens produits
        await db.execute({
          sql: 'DELETE FROM bundle_products WHERE campaign_bundle_id = ?',
          args: [bundleId]
        })

        // Ajouter les nouveaux produits
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
      }

      console.log(`✅ Bundle mis à jour avec succès: ${bundleId}`)

      // Récupérer le bundle mis à jour
      const updatedBundleResult = await db.execute({
        sql: `SELECT
          id, airtable_id, name, description, target_audience as targetAudience,
          budget_range as budgetRange, estimated_total as estimatedTotal,
          original_total as originalTotal, savings, popularity, is_active as isActive,
          is_featured as isFeatured, tags, created_at as createdAt, updated_at as updatedAt
        FROM campaign_bundles WHERE id = ? OR airtable_id = ?`,
        args: [bundleId, bundleId]
      })

      const bundleData = updatedBundleResult.rows[0]

      // Récupérer les produits
      const productsResult = await db.execute({
        sql: `SELECT product_id, product_name, base_price, quantity, subtotal
              FROM bundle_products WHERE campaign_bundle_id = ?`,
        args: [bundleId]
      })

      const products = productsResult.rows.map((row: any) => ({
        id: row.product_id,
        name: row.product_name,
        basePrice: Number(row.base_price) || 0,
        quantity: Number(row.quantity) || 1,
        subtotal: Number(row.subtotal) || 0
      }))

      const response = {
        success: true,
        data: {
          id: bundleData.airtable_id || bundleData.id,
          name: bundleData.name,
          description: bundleData.description || '',
          targetAudience: bundleData.targetAudience,
          budgetRange: bundleData.budgetRange,
          products,
          estimatedTotal: Number(bundleData.estimatedTotal) || 0,
          originalTotal: Number(bundleData.originalTotal) || 0,
          savings: Number(bundleData.savings) || 0,
          popularity: Number(bundleData.popularity) || 0,
          isActive: Boolean(bundleData.isActive),
          isFeatured: Boolean(bundleData.isFeatured),
          tags: bundleData.tags ? JSON.parse(bundleData.tags) : [],
          createdAt: bundleData.createdAt,
          updatedAt: bundleData.updatedAt
        },
        duration: Date.now() - startTime
      }

      return response

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour du bundle',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur PUT /api/campaign-bundles/${getRouterParam(event, 'id')}:`, error)

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