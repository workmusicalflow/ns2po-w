/**
 * API Route: PUT /api/campaign-bundles/[id]
 * Met à jour un campaign bundle existant avec la nouvelle structure Turso
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
      sql: 'SELECT id FROM campaign_bundles WHERE id = ?',
      args: [bundleId]
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

    try {
      // Calculs automatiques
      let calculatedTotal = validatedData.estimatedTotal
      let discountPercentage = 0
      let basePrice = validatedData.originalTotal

      if (validatedData.products) {
        const productsTotal = validatedData.products.reduce((total, product) => total + product.subtotal, 0)
        calculatedTotal = productsTotal
        basePrice = validatedData.originalTotal || productsTotal
        discountPercentage = basePrice > 0 ? ((basePrice - calculatedTotal) / basePrice * 100) : 0
      }

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

      if (basePrice !== undefined) {
        updateFields.push('base_price = ?')
        updateArgs.push(basePrice)
      }

      if (discountPercentage !== undefined) {
        updateFields.push('discount_percentage = ?')
        updateArgs.push(discountPercentage)
      }

      if (validatedData.isActive !== undefined) {
        updateFields.push('is_active = ?')
        updateArgs.push(validatedData.isActive ? 1 : 0)
      }

      if (validatedData.displayOrder !== undefined) {
        updateFields.push('display_order = ?')
        updateArgs.push(validatedData.displayOrder)
      }

      if (validatedData.icon !== undefined) {
        updateFields.push('icon = ?')
        updateArgs.push(validatedData.icon)
      }

      if (validatedData.color !== undefined) {
        updateFields.push('color = ?')
        updateArgs.push(validatedData.color)
      }

      if (validatedData.tags !== undefined) {
        updateFields.push('features = ?')
        updateArgs.push(JSON.stringify(validatedData.tags))
      }

      // Toujours mettre à jour updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP')

      if (updateFields.length > 1) { // Plus que juste updated_at
        updateArgs.push(bundleId) // Pour la clause WHERE
        const sql = `UPDATE campaign_bundles SET ${updateFields.join(', ')} WHERE id = ?`

        await db.execute({
          sql,
          args: updateArgs
        })
      }

      // Mettre à jour les produits si fournis
      if (validatedData.products) {
        // Supprimer les anciens produits
        await db.execute({
          sql: 'DELETE FROM bundle_products WHERE bundle_id = ?',
          args: [bundleId]
        })

        // Ajouter les nouveaux produits
        for (let i = 0; i < validatedData.products.length; i++) {
          const product = validatedData.products[i]
          await db.execute({
            sql: `INSERT INTO bundle_products (
              bundle_id, product_id, quantity, custom_price, is_required, display_order
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              bundleId,
              product.id,
              product.quantity,
              product.basePrice,
              product.isRequired !== false ? 1 : 0,
              i + 1
            ]
          })
        }
      }

      console.log(`✅ Bundle mis à jour avec succès: ${bundleId}`)

      // Récupérer le bundle mis à jour avec ses produits
      const updatedBundleResult = await db.execute({
        sql: `SELECT
          cb.id, cb.name, cb.description, cb.target_audience as targetAudience,
          cb.base_price as basePrice, cb.discount_percentage as discountPercentage,
          cb.final_price as finalPrice, cb.is_active as isActive,
          cb.display_order as displayOrder, cb.icon, cb.color, cb.features,
          cb.created_at as createdAt, cb.updated_at as updatedAt
        FROM campaign_bundles cb WHERE cb.id = ?`,
        args: [bundleId]
      })

      if (updatedBundleResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Bundle non trouvé après mise à jour'
        })
      }

      const bundleData = updatedBundleResult.rows[0]

      // Récupérer les produits associés
      const productsResult = await db.execute({
        sql: `
          SELECT
            bp.product_id, p.name as product_name,
            COALESCE(bp.custom_price, p.base_price) as basePrice,
            bp.quantity,
            (COALESCE(bp.custom_price, p.base_price) * bp.quantity) as subtotal,
            bp.is_required
          FROM bundle_products bp
          LEFT JOIN products p ON bp.product_id = p.id
          WHERE bp.bundle_id = ?
          ORDER BY bp.display_order ASC
        `,
        args: [bundleId]
      })

      const products = productsResult.rows.map((row: any) => ({
        id: row.product_id,
        name: row.product_name,
        basePrice: Number(row.basePrice) || 0,
        quantity: Number(row.quantity) || 1,
        subtotal: Number(row.subtotal) || 0,
        isRequired: Boolean(row.is_required)
      }))

      // Calculer les totaux
      const estimatedTotal = Number(bundleData.finalPrice) || 0
      const originalTotal = products.reduce((sum, p) => sum + p.subtotal, 0)
      const savings = originalTotal - estimatedTotal

      const response = {
        success: true,
        data: {
          id: String(bundleData.id),
          name: bundleData.name,
          description: bundleData.description || '',
          targetAudience: bundleData.targetAudience,
          budgetRange: estimatedTotal < 20000 ? 'starter' : estimatedTotal < 50000 ? 'standard' : 'premium',
          products,
          estimatedTotal,
          originalTotal,
          savings: Math.max(0, savings),
          popularity: 90,
          isActive: Boolean(bundleData.isActive),
          isFeatured: bundleData.displayOrder <= 3,
          tags: bundleData.features ? JSON.parse(bundleData.features) : [],
          createdAt: bundleData.createdAt,
          updatedAt: bundleData.updatedAt,
          icon: bundleData.icon,
          color: bundleData.color,
          displayOrder: bundleData.displayOrder,
          discountPercentage: Number(bundleData.discountPercentage) || 0
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