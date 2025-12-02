/**
 * API Route: POST /api/realisations/promote
 * Promeut une réalisation auto-discovery vers Turso (UPSERT atomique)
 *
 * Cas d'usage métier: Transformer une réalisation virtuelle (Cloudinary)
 * en réalisation persistée (Turso)
 *
 * Comportement:
 * - Si le titre n'existe pas → INSERT nouvelle réalisation
 * - Si le titre existe déjà → UPDATE l'existante
 * - Source forcée à 'turso' dans tous les cas
 *
 * @see Recommandation Gemini-copilot: Option E + D (endpoint dédié + UPSERT)
 */

import { getDatabase } from "../../utils/database"
import { z } from "zod"
import { handleApiError, handleValidationError } from "../../utils/errorHandler"
import { createRealisationSchema } from "../../../schemas/realisation"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log(`🚀 POST /api/realisations/promote - Promotion réalisation auto-discovery`)

    // Validation du body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = createRealisationSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw handleValidationError(error, event)
      }
      throw error
    }

    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      // Vérifier si une réalisation avec ce titre existe déjà
      const existingCheck = await db.execute({
        sql: 'SELECT id FROM realisations WHERE title = ?',
        args: [validatedData.title]
      })

      const isUpdate = existingCheck.rows.length > 0
      let realisationId: string

      if (isUpdate) {
        // UPDATE: La réalisation existe, on la met à jour
        realisationId = existingCheck.rows[0].id as string
        console.log(`📝 Promotion: UPDATE réalisation existante ${realisationId}`)

        await db.execute({
          sql: `UPDATE realisations SET
            description = ?,
            cloudinary_public_ids = ?,
            product_ids = ?,
            category_ids = ?,
            customization_option_ids = ?,
            tags = ?,
            is_featured = ?,
            is_active = ?,
            source = 'turso',
            cloudinary_urls = ?,
            cloudinary_metadata = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
          args: [
            validatedData.description || null,
            JSON.stringify(validatedData.cloudinary_public_ids || []),
            JSON.stringify(validatedData.product_ids || []),
            JSON.stringify(validatedData.category_ids || []),
            JSON.stringify(validatedData.customization_option_ids || []),
            JSON.stringify(validatedData.tags || []),
            validatedData.is_featured ? 1 : 0,
            validatedData.is_active !== undefined ? (validatedData.is_active ? 1 : 0) : 1,
            validatedData.cloudinary_urls ? JSON.stringify(validatedData.cloudinary_urls) : null,
            validatedData.cloudinary_metadata ? JSON.stringify(validatedData.cloudinary_metadata) : null,
            realisationId
          ]
        })
      } else {
        // INSERT: Nouvelle réalisation
        realisationId = `real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        console.log(`✨ Promotion: INSERT nouvelle réalisation ${realisationId}`)

        // Calculer order_position si non spécifié
        let orderPosition = validatedData.order_position
        if (orderPosition === undefined) {
          const maxOrderResult = await db.execute({
            sql: 'SELECT COALESCE(MAX(order_position), 0) + 1 as next_position FROM realisations',
            args: []
          })
          orderPosition = maxOrderResult.rows[0].next_position as number
        }

        await db.execute({
          sql: `INSERT INTO realisations
            (id, title, description, cloudinary_public_ids, product_ids, category_ids,
             customization_option_ids, tags, is_featured, order_position, is_active,
             source, cloudinary_urls, cloudinary_metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'turso', ?, ?)`,
          args: [
            realisationId,
            validatedData.title,
            validatedData.description || null,
            JSON.stringify(validatedData.cloudinary_public_ids || []),
            JSON.stringify(validatedData.product_ids || []),
            JSON.stringify(validatedData.category_ids || []),
            JSON.stringify(validatedData.customization_option_ids || []),
            JSON.stringify(validatedData.tags || []),
            validatedData.is_featured ? 1 : 0,
            orderPosition,
            validatedData.is_active !== undefined ? (validatedData.is_active ? 1 : 0) : 1,
            validatedData.cloudinary_urls ? JSON.stringify(validatedData.cloudinary_urls) : null,
            validatedData.cloudinary_metadata ? JSON.stringify(validatedData.cloudinary_metadata) : null
          ]
        })
      }

      console.log(`✅ Promotion réussie: ${realisationId} (${isUpdate ? 'UPDATE' : 'INSERT'})`)

      // 🔧 FIX Bug #2: Enregistrer les cloudinary_public_ids promus pour éviter re-découverte
      // Même si l'image est changée plus tard, les originaux restent "consommés"
      if (validatedData.cloudinary_public_ids && validatedData.cloudinary_public_ids.length > 0) {
        for (const publicId of validatedData.cloudinary_public_ids) {
          try {
            await db.execute({
              sql: `INSERT OR IGNORE INTO promoted_cloudinary_assets
                    (public_id, promoted_to_realisation_id, original_title)
                    VALUES (?, ?, ?)`,
              args: [publicId, realisationId, validatedData.title]
            })
          } catch (insertError) {
            // Ignorer si déjà existant (UNIQUE constraint)
            console.log(`📝 Public ID ${publicId} déjà enregistré ou erreur:`, insertError)
          }
        }
        console.log(`📦 ${validatedData.cloudinary_public_ids.length} public_ids enregistrés comme promus`)
      }

      // Récupérer la réalisation promue
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
          statusMessage: 'Réalisation non trouvée après promotion'
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

      const response = {
        success: true,
        data: realisation,
        message: isUpdate
          ? `Réalisation "${realisation.title}" mise à jour avec succès`
          : `Réalisation "${realisation.title}" promue et créée avec succès`,
        operation: isUpdate ? 'update' : 'create',
        source: 'turso',
        duration: Date.now() - startTime
      }

      setHeader(event, "Cache-Control", "no-cache")

      return response

    } catch (dbError: any) {
      if (dbError.statusCode) {
        throw dbError
      }
      throw handleApiError(dbError, event)
    }

  } catch (error) {
    throw handleApiError(error, event)
  }
})
