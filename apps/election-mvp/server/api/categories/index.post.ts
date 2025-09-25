/**
 * API Route: POST /api/categories
 * Crée une nouvelle catégorie avec stratégie Turso-first
 */

import { getDatabase } from "../../utils/database"
import { z } from "zod"

// Schéma de validation pour création de catégorie
const createCategorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(50, "Le nom ne peut pas dépasser 50 caractères"),
  slug: z.string().min(1, "Le slug est requis").max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(/^[a-z0-9-]+$/, "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets"),
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
    console.log(`📂 POST /api/categories - Création catégorie`)

    // Validation du body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = createCategorySchema.parse(body)
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
      // Vérifier l'unicité du nom et du slug
      const existingCheck = await db.execute({
        sql: 'SELECT id FROM categories WHERE name = ? OR slug = ?',
        args: [validatedData.name, validatedData.slug]
      })

      if (existingCheck.rows.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Une catégorie avec ce nom ou ce slug existe déjà'
        })
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
      }

      // Générer un ID unique
      const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Insérer la nouvelle catégorie
      await db.execute({
        sql: `INSERT INTO categories
          (id, name, slug, description, parent_id, icon, color, sort_order, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          categoryId,
          validatedData.name,
          validatedData.slug,
          validatedData.description || null,
          validatedData.parent_id || null,
          validatedData.icon || null,
          validatedData.color || null,
          validatedData.sort_order || 0,
          validatedData.is_active !== undefined ? (validatedData.is_active ? 1 : 0) : 1
        ]
      })

      console.log(`✅ Catégorie créée avec succès: ${categoryId}`)

      // Récupérer la catégorie créée avec les détails du parent
      const categoryResult = await db.execute({
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

      if (categoryResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Catégorie non trouvée après création'
        })
      }

      const categoryData = categoryResult.rows[0] as any

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
        message: `Catégorie "${category.name}" créée avec succès`,
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
        statusMessage: 'Erreur lors de la création de la catégorie',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur POST /api/categories:`, error)

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