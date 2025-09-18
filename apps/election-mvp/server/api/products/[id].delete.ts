/**
 * API Route: DELETE /api/products/[id]
 * Supprime un produit existant de la base Turso
 */

import { getDatabase } from "~/server/utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const productId = getRouterParam(event, 'id')
    console.log(`📦 DELETE /api/products/${productId} - Suppression produit`)

    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du produit requis'
      })
    }

    // Accès à la base de données
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le produit existe
    const existingProduct = await db.execute({
      sql: 'SELECT id, name FROM products WHERE id = ?',
      args: [productId]
    })

    if (existingProduct.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }

    const productName = existingProduct.rows[0].name

    try {
      // Vérifier si le produit est utilisé dans des bundles
      const bundleUsage = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM bundle_products WHERE product_id = ?',
        args: [productId]
      })

      const usageCount = bundleUsage.rows[0].count as number

      if (usageCount > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Impossible de supprimer le produit. Il est utilisé dans ${usageCount} bundle(s).`,
          data: {
            reason: 'product_in_use',
            bundleCount: usageCount
          }
        })
      }

      // Supprimer le produit
      await db.execute({
        sql: 'DELETE FROM products WHERE id = ?',
        args: [productId]
      })

      console.log(`✅ Produit supprimé avec succès: ${productId} (${productName})`)

      const response = {
        success: true,
        message: `Produit "${productName}" supprimé avec succès`,
        data: {
          id: productId,
          deletedAt: new Date().toISOString()
        },
        source: 'turso',
        duration: Date.now() - startTime
      }

      // Cache headers
      setHeader(event, "Cache-Control", "no-cache")

      return response

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)

      // Si c'est une erreur de contrainte, la renvoyer telle quelle
      if (dbError.statusCode) {
        throw dbError
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du produit',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur DELETE /api/products/${getRouterParam(event, 'id')}:`, error)

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