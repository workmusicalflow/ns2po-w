/**
 * API Route: PUT /api/realisations/[id]
 * Met à jour une réalisation existante avec la stratégie Turso-first
 */

import { getDatabase } from "../../utils/database"
import { z } from "zod"

// Schéma de validation pour mise à jour de réalisation
const updateRealisationSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200, "Le titre ne peut pas dépasser 200 caractères").optional(),
  description: z.string().optional(),
  cloudinary_public_ids: z.array(z.string()).optional(),
  product_ids: z.array(z.string()).optional(),
  category_ids: z.array(z.string()).optional(),
  customization_option_ids: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  order_position: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  source: z.enum(['airtable', 'cloudinary-auto-discovery', 'turso']).optional(),
  cloudinary_urls: z.array(z.string().url()).optional(),
  cloudinary_metadata: z.record(z.any()).optional()
})

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const realisationId = getRouterParam(event, 'id')
    console.log(`🎨 PUT /api/realisations/${realisationId} - Mise à jour réalisation`)

    if (!realisationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de la réalisation requis'
      })
    }

    // Validation du body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = updateRealisationSchema.parse(body)
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

    // Vérifier que la réalisation existe
    const existingRealisation = await db.execute({
      sql: 'SELECT id, title FROM realisations WHERE id = ?',
      args: [realisationId]
    })

    if (existingRealisation.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Réalisation non trouvée'
      })
    }

    try {
      // Vérifier l'unicité du titre (sauf pour la réalisation actuelle)
      if (validatedData.title) {
        const uniqueCheck = await db.execute({
          sql: 'SELECT id FROM realisations WHERE title = ? AND id != ?',
          args: [validatedData.title, realisationId]
        })

        if (uniqueCheck.rows.length > 0) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Une autre réalisation avec ce titre existe déjà'
          })
        }
      }

      // Construire la requête UPDATE dynamiquement
      const updateFields = []
      const updateArgs = []

      if (validatedData.title !== undefined) {
        updateFields.push('title = ?')
        updateArgs.push(validatedData.title)
      }

      if (validatedData.description !== undefined) {
        updateFields.push('description = ?')
        updateArgs.push(validatedData.description)
      }

      if (validatedData.cloudinary_public_ids !== undefined) {
        updateFields.push('cloudinary_public_ids = ?')
        updateArgs.push(JSON.stringify(validatedData.cloudinary_public_ids))
      }

      if (validatedData.product_ids !== undefined) {
        updateFields.push('product_ids = ?')
        updateArgs.push(JSON.stringify(validatedData.product_ids))
      }

      if (validatedData.category_ids !== undefined) {
        updateFields.push('category_ids = ?')
        updateArgs.push(JSON.stringify(validatedData.category_ids))
      }

      if (validatedData.customization_option_ids !== undefined) {
        updateFields.push('customization_option_ids = ?')
        updateArgs.push(JSON.stringify(validatedData.customization_option_ids))
      }

      if (validatedData.tags !== undefined) {
        updateFields.push('tags = ?')
        updateArgs.push(JSON.stringify(validatedData.tags))
      }

      if (validatedData.is_featured !== undefined) {
        updateFields.push('is_featured = ?')
        updateArgs.push(validatedData.is_featured ? 1 : 0)
      }

      if (validatedData.order_position !== undefined) {
        updateFields.push('order_position = ?')
        updateArgs.push(validatedData.order_position)
      }

      if (validatedData.is_active !== undefined) {
        updateFields.push('is_active = ?')
        updateArgs.push(validatedData.is_active ? 1 : 0)
      }

      if (validatedData.source !== undefined) {
        updateFields.push('source = ?')
        updateArgs.push(validatedData.source)
      }

      if (validatedData.cloudinary_urls !== undefined) {
        updateFields.push('cloudinary_urls = ?')
        updateArgs.push(validatedData.cloudinary_urls ? JSON.stringify(validatedData.cloudinary_urls) : null)
      }

      if (validatedData.cloudinary_metadata !== undefined) {
        updateFields.push('cloudinary_metadata = ?')
        updateArgs.push(validatedData.cloudinary_metadata ? JSON.stringify(validatedData.cloudinary_metadata) : null)
      }

      // Toujours mettre à jour updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP')

      if (updateFields.length > 1) { // Plus que juste updated_at
        updateArgs.push(realisationId) // Pour la clause WHERE
        const sql = `UPDATE realisations SET ${updateFields.join(', ')} WHERE id = ?`

        await db.execute({
          sql,
          args: updateArgs
        })
      }

      console.log(`✅ Réalisation mise à jour avec succès: ${realisationId}`)

      // Récupérer la réalisation mise à jour
      const updatedRealisationResult = await db.execute({
        sql: `SELECT
          id, title, description, cloudinary_public_ids, product_ids, category_ids,
          customization_option_ids, tags, is_featured, order_position, is_active,
          source, cloudinary_urls, cloudinary_metadata, created_at, updated_at
        FROM realisations WHERE id = ?`,
        args: [realisationId]
      })

      if (updatedRealisationResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Réalisation non trouvée après mise à jour'
        })
      }

      const realisationData = updatedRealisationResult.rows[0] as any

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
        message: `Réalisation "${realisation.title}" mise à jour avec succès`,
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
        statusMessage: 'Erreur lors de la mise à jour de la réalisation',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur PUT /api/realisations/${getRouterParam(event, 'id')}:`, error)

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