/**
 * API Route: GET /api/products/[id]/bundles
 * Liste tous les bundles utilisant ce produit spécifique
 * Endpoint pour gérer les contraintes d'intégrité référentielle
 */

import { getDatabase } from "../../../utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const productId = getRouterParam(event, 'id')
    console.log(`📦 GET /api/products/${productId}/bundles - Recherche bundles utilisant produit`)

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

    // Vérifier que le produit existe d'abord
    const productExists = await db.execute({
      sql: 'SELECT id, name FROM products WHERE id = ?',
      args: [productId]
    })

    if (productExists.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }

    const productName = productExists.rows[0].name

    // Récupérer tous les bundles utilisant ce produit
    const bundlesResult = await db.execute({
      sql: `
        SELECT
          cb.id,
          cb.name,
          cb.description,
          cb.target_audience,
          cb.final_price as estimated_total,
          cb.is_active,
          cb.display_order,
          bp.quantity,
          bp.custom_price,
          COALESCE(bp.custom_price, p.base_price) as product_price,
          (COALESCE(bp.custom_price, p.base_price) * bp.quantity) as product_subtotal,
          bp.is_required,
          bp.created_at as added_to_bundle_at
        FROM bundle_products bp
        LEFT JOIN campaign_bundles cb ON bp.bundle_id = cb.id
        LEFT JOIN products p ON bp.product_id = p.id
        WHERE bp.product_id = ? AND cb.is_active = 1
        ORDER BY cb.display_order ASC, cb.name ASC
      `,
      args: [productId]
    })

    // Formatter les résultats
    const bundles = bundlesResult.rows.map((row: any) => ({
      id: String(row.id),
      name: row.name,
      description: row.description || '',
      targetAudience: row.target_audience || 'general',
      estimatedTotal: Number(row.estimated_total) || 0,
      isActive: Boolean(row.is_active),
      displayOrder: Number(row.display_order) || 999,

      // Détails sur l'utilisation du produit dans ce bundle
      productUsage: {
        quantity: Number(row.quantity) || 1,
        customPrice: row.custom_price ? Number(row.custom_price) : null,
        currentPrice: Number(row.product_price) || 0,
        subtotal: Number(row.product_subtotal) || 0,
        isRequired: Boolean(row.is_required),
        addedAt: row.added_to_bundle_at
      }
    }))

    // Statistiques d'utilisation
    const stats = {
      totalBundles: bundles.length,
      activeBundles: bundles.filter(b => b.isActive).length,
      totalQuantityUsed: bundles.reduce((sum, b) => sum + b.productUsage.quantity, 0),
      totalRevenueImpact: bundles.reduce((sum, b) => sum + b.productUsage.subtotal, 0),
      isRequiredInBundles: bundles.filter(b => b.productUsage.isRequired).length
    }

    const response = {
      success: true,
      data: {
        product: {
          id: productId,
          name: productName
        },
        bundles,
        stats,
        canDelete: bundles.length === 0,
        deleteBlockedReason: bundles.length > 0
          ? `Produit utilisé dans ${bundles.length} bundle(s) actif(s)`
          : null
      },
      source: 'turso',
      duration: Date.now() - startTime
    }

    // Cache headers optimisés
    setHeader(event, "Cache-Control", "public, max-age=300") // 5 minutes
    setHeader(event, "CDN-Cache-Control", "public, max-age=600") // 10 minutes

    console.log(`✅ Bundles trouvés pour produit ${productId}: ${bundles.length} bundle(s)`)
    return response

  } catch (error) {
    console.error(`❌ Erreur GET /api/products/${getRouterParam(event, 'id')}/bundles:`, error)

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