/**
 * API Route: GET /api/categories/[id]
 * Récupère une catégorie spécifique avec stratégie Turso-first
 */

import { getDatabase } from "../../utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const categoryId = getRouterParam(event, 'id')
    console.log(`📂 GET /api/categories/${categoryId} - Récupération catégorie`)

    if (!categoryId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de la catégorie requis'
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
      // Récupérer la catégorie avec les détails du parent et des sous-catégories
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
          statusMessage: 'Catégorie non trouvée'
        })
      }

      const categoryData = categoryResult.rows[0] as any

      // Récupérer les sous-catégories
      const subcategoriesResult = await db.execute({
        sql: `SELECT
          id, name, slug, description, icon, color,
          sort_order as sortOrder, is_active as isActive,
          created_at as createdAt, updated_at as updatedAt
        FROM categories
        WHERE parent_id = ?
        ORDER BY sort_order, name`,
        args: [categoryId]
      })

      const subcategories = subcategoriesResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description || '',
        icon: row.icon,
        color: row.color,
        sortOrder: Number(row.sortOrder),
        isActive: Boolean(row.isActive),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }))

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
        updatedAt: categoryData.updatedAt,
        subcategories
      }

      console.log(`✅ Catégorie récupérée avec succès: ${categoryId}`)

      const response = {
        success: true,
        data: category,
        source: 'turso',
        duration: Date.now() - startTime
      }

      // Cache headers
      setHeader(event, "Cache-Control", "public, max-age=1800") // 30 minutes

      return response

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)

      if (dbError.statusCode) {
        throw dbError
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération de la catégorie',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur GET /api/categories/${getRouterParam(event, 'id')}:`, error)

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