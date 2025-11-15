/**
 * API Route: GET /api/realisations/[id]
 * Récupère une réalisation spécifique avec stratégie Turso-first
 */

import { getDatabase } from "../../utils/database"
import { handleApiError } from "../../utils/errorHandler"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const realisationId = getRouterParam(event, 'id')
    console.log(`🎨 GET /api/realisations/${realisationId} - Récupération réalisation`)

    if (!realisationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de la réalisation requis'
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

    try {
      // Récupérer la réalisation
      const realisationResult = await db.execute({
        sql: `SELECT
          id, title, description, cloudinary_public_ids, product_ids, category_ids,
          customization_option_ids, tags, is_featured, order_position, is_active,
          source, cloudinary_urls, cloudinary_metadata, created_at, updated_at
        FROM realisations WHERE id = ?`,
        args: [realisationId]
      })

      if (realisationResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Réalisation non trouvée'
        })
      }

      const realisationData = realisationResult.rows[0] as any

      const realisation = {
        id: realisationData.id,
        title: realisationData.title,
        description: realisationData.description || undefined,
        cloudinaryPublicIds: JSON.parse(realisationData.cloudinary_public_ids || '[]'),
        productIds: JSON.parse(realisationData.product_ids || '[]'),
        categoryIds: JSON.parse(realisationData.category_ids || '[]'),
        customizationOptionIds: JSON.parse(realisationData.customization_option_ids || '[]'),
        tags: JSON.parse(realisationData.tags || '[]'),
        isFeatured: Boolean(realisationData.is_featured),
        orderPosition: Number(realisationData.order_position),
        isActive: Boolean(realisationData.is_active),
        source: realisationData.source,
        cloudinaryUrls: realisationData.cloudinary_urls ? JSON.parse(realisationData.cloudinary_urls) : undefined,
        cloudinaryMetadata: realisationData.cloudinary_metadata ? JSON.parse(realisationData.cloudinary_metadata) : undefined,
        createdAt: realisationData.created_at,
        updatedAt: realisationData.updated_at
      }

      console.log(`✅ Réalisation récupérée avec succès: ${realisationId}`)

      const response = {
        success: true,
        data: realisation,
        source: 'turso',
        duration: Date.now() - startTime
      }

      // Cache headers
      setHeader(event, "Cache-Control", "public, max-age=1800") // 30 minutes

      return response

    } catch (dbError) {
      // Si c'est une erreur 404/400, la renvoyer telle quelle
      if (dbError.statusCode) {
        throw dbError
      }
      // ✅ ERROR HANDLING UNIFIÉ
      throw handleApiError(dbError, event)
    }

  } catch (error) {
    // ✅ ERROR HANDLING UNIFIÉ
    throw handleApiError(error, event)
  }
})