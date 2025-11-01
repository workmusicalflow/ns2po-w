/**
 * API Route: GET /api/admin/products/[id]
 * Récupère un produit spécifique par ID avec schéma normalisé (admin)
 *
 * IDENTIQUE à /api/products/[id] mais dans le namespace admin pour cohérence architecture
 * Utilise getProductWithRelations() depuis tables normalisées
 * - product_materials, product_colors, product_sizes, product_gallery
 */

import { getDatabase } from '../../../utils/database'
import { getProductWithRelations } from '../../../utils/db-queries'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID du produit requis'
    })
  }

  try {
    const tursoClient = getDatabase()
    if (!tursoClient) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Base de données indisponible'
      })
    }

    console.log(`🎯 [ADMIN] Récupération produit ${id} (schéma normalisé)...`)

    // Utilisation du helper optimisé avec relations
    const product = await getProductWithRelations(tursoClient, id)

    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }

    const duration = Date.now() - startTime
    console.log(`✅ [ADMIN] Produit ${id} récupéré en ${duration}ms (schéma normalisé)`)

    return {
      success: true,
      data: product,
      source: 'turso-normalized',
      duration
    }

  } catch (error: any) {
    console.error(`❌ [ADMIN] Erreur API /admin/products/${id}:`, error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération du produit',
      data: {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: Date.now() - startTime
      }
    })
  }
})
