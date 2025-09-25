/**
 * API Route: PUT /api/categories/[id]
 * Met à jour une catégorie existante avec la stratégie Turso-first
 */

import { getDatabase } from "../../utils/database"
import { z } from "zod"

// Schéma de validation pour mise à jour de catégorie
const updateCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50, "Le nom ne peut pas dépasser 50 caractères").optional(),
  slug: z.string().min(1, "Le slug est requis").max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(/^[a-z0-9-]+$/, "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets").optional(),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "La couleur doit être au format hexadécimal #RRGGBB").optional(),
  sort_order: z.number().min(0).optional(),
  is_active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const categoryId = getRouterParam(event, 'id')
    console.log(`📂 PUT /api/categories/${categoryId} - Mise à jour catégorie`)

    if (!categoryId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de la catégorie requis'
      })
    }

    // Validation du body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = updateCategorySchema.parse(body)
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

    // Vérifier que la catégorie existe
    const existingCategory = await db.execute({
      sql: 'SELECT id, name FROM categories WHERE id = ?',
      args: [categoryId]
    })

    if (existingCategory.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Catégorie non trouvée'
      })
    }

    try {
      // Vérifier l'unicité du nom et slug (sauf pour la catégorie actuelle)
      if (validatedData.name || validatedData.slug) {
        const conditions = []
        const args = []

        if (validatedData.name) {
          conditions.push('name = ?')
          args.push(validatedData.name)
        }

        if (validatedData.slug) {
          if (conditions.length > 0) {
            conditions[conditions.length - 1] = conditions[conditions.length - 1] + ' OR slug = ?'
          } else {
            conditions.push('slug = ?')
          }
          args.push(validatedData.slug)
        }

        args.push(categoryId)

        const uniqueCheck = await db.execute({
          sql: `SELECT id FROM categories WHERE (${conditions.join(' OR ')}) AND id != ?`,
          args
        })

        if (uniqueCheck.rows.length > 0) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Une autre catégorie avec ce nom ou ce slug existe déjà'
          })
        }
      }

      // Vérifier que le parent existe (si spécifié)
      if (validatedData.parent_id) {
        const parentCheck = await db.execute({
          sql: 'SELECT id FROM categories WHERE id = ?',
          args: [validatedData.parent_id]
        })

        if (parentCheck.rows.length === 0) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Catégorie parent introuvable'
          })
        }

        // Vérifier qu'on ne crée pas de référence circulaire
        if (validatedData.parent_id === categoryId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Une catégorie ne peut pas être son propre parent'
          })
        }
      }

      // Construire la requête UPDATE dynamiquement
      const updateFields = []
      const updateArgs = []

      if (validatedData.name !== undefined) {
        updateFields.push('name = ?')
        updateArgs.push(validatedData.name)
      }

      if (validatedData.slug !== undefined) {
        updateFields.push('slug = ?')
        updateArgs.push(validatedData.slug)
      }

      if (validatedData.description !== undefined) {
        updateFields.push('description = ?')
        updateArgs.push(validatedData.description)
      }

      if (validatedData.parent_id !== undefined) {
        updateFields.push('parent_id = ?')
        updateArgs.push(validatedData.parent_id)
      }

      if (validatedData.icon !== undefined) {
        updateFields.push('icon = ?')
        updateArgs.push(validatedData.icon)
      }

      if (validatedData.color !== undefined) {
        updateFields.push('color = ?')
        updateArgs.push(validatedData.color)
      }

      if (validatedData.sort_order !== undefined) {
        updateFields.push('sort_order = ?')
        updateArgs.push(validatedData.sort_order)
      }

      if (validatedData.is_active !== undefined) {
        updateFields.push('is_active = ?')
        updateArgs.push(validatedData.is_active ? 1 : 0)
      }

      // Toujours mettre à jour updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP')

      if (updateFields.length > 1) { // Plus que juste updated_at
        updateArgs.push(categoryId) // Pour la clause WHERE
        const sql = `UPDATE categories SET ${updateFields.join(', ')} WHERE id = ?`

        await db.execute({
          sql,
          args: updateArgs
        })
      }

      console.log(`✅ Catégorie mise à jour avec succès: ${categoryId}`)

      // Récupérer la catégorie mise à jour
      const updatedCategoryResult = await db.execute({
        sql: `SELECT
          c.id, c.name, c.slug, c.description, c.parent_id as parentId,
          c.icon, c.color, c.sort_order as sortOrder, c.is_active as isActive,
          c.created_at as createdAt, c.updated_at as updatedAt,
          p.name as parentName
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.id = ?`,
        args: [categoryId]
      })

      if (updatedCategoryResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Catégorie non trouvée après mise à jour'
        })
      }

      const categoryData = updatedCategoryResult.rows[0] as any

      const category = {
        id: categoryData.id,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || '',
        parentId: categoryData.parentId,
        parentName: categoryData.parentName,
        icon: categoryData.icon,
        color: categoryData.color,
        sortOrder: Number(categoryData.sortOrder),
        isActive: Boolean(categoryData.isActive),
        createdAt: categoryData.createdAt,
        updatedAt: categoryData.updatedAt
      }

      const response = {
        success: true,
        data: category,
        message: `Catégorie "${category.name}" mise à jour avec succès`,
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
        statusMessage: 'Erreur lors de la mise à jour de la catégorie',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur PUT /api/categories/${getRouterParam(event, 'id')}:`, error)

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