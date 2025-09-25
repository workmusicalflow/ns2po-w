/**
 * API Route: POST /api/realisations
 * Crée une nouvelle réalisation avec stratégie Turso-first
 */

import { getDatabase } from "../../utils/database"
import { z } from "zod"

// Schéma de validation pour création de réalisation
const createRealisationSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200, "Le titre ne peut pas dépasser 200 caractères"),
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
    console.log(`🎨 POST /api/realisations - Création réalisation`)

    // Validation du body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = createRealisationSchema.parse(body)
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

    try {
      // Vérifier l'unicité du titre
      const existingCheck = await db.execute({
        sql: 'SELECT id FROM realisations WHERE title = ?',
        args: [validatedData.title]
      })

      if (existingCheck.rows.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Une réalisation avec ce titre existe déjà'
        })
      }

      // Si order_position n'est pas spécifié, utiliser la prochaine position
      let orderPosition = validatedData.order_position
      if (orderPosition === undefined) {
        const maxOrderResult = await db.execute({
          sql: 'SELECT COALESCE(MAX(order_position), 0) + 1 as next_position FROM realisations',
          args: []
        })
        orderPosition = maxOrderResult.rows[0].next_position as number
      }

      // Générer un ID unique
      const realisationId = `real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Insérer la nouvelle réalisation
      await db.execute({
        sql: `INSERT INTO realisations
          (id, title, description, cloudinary_public_ids, product_ids, category_ids,
           customization_option_ids, tags, is_featured, order_position, is_active,
           source, cloudinary_urls, cloudinary_metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          validatedData.source || 'turso',
          validatedData.cloudinary_urls ? JSON.stringify(validatedData.cloudinary_urls) : null,
          validatedData.cloudinary_metadata ? JSON.stringify(validatedData.cloudinary_metadata) : null
        ]
      })

      console.log(`✅ Réalisation créée avec succès: ${realisationId}`)

      // Récupérer la réalisation créée
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
          statusMessage: 'Réalisation non trouvée après création'
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
        message: `Réalisation "${realisation.title}" créée avec succès`,
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
        statusMessage: 'Erreur lors de la création de la réalisation',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur POST /api/realisations:`, error)

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