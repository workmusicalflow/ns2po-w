/**
 * API Route: GET /api/products/[id]
 * Récupère un produit spécifique par ID avec stratégie Turso-first
 */

import { getDatabase } from '../../utils/database'

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
    // 1. Priorité : Turso Database
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log(`🎯 Tentative Turso pour produit ${id}...`)
        const result = await tursoClient.execute({
          sql: `
            SELECT
              p.id, p.name, p.description, p.category, p.subcategory,
              p.base_price as basePrice, p.min_quantity as minQuantity,
              p.max_quantity as maxQuantity, p.unit, p.production_time_days,
              p.customizable, p.materials, p.colors, p.sizes,
              p.image_url as image, p.gallery_urls, p.specifications,
              p.is_active as isActive, p.created_at as createdAt, p.updated_at as updatedAt,
              c.id as categoryId, c.name as categoryName, c.slug as categorySlug,
              c.description as categoryDescription, c.icon as categoryIcon, c.color as categoryColor
            FROM products p
            LEFT JOIN categories c ON p.category = c.id
            WHERE p.id = ? AND p.is_active = true
          `,
          args: [id]
        })

        if (result.rows.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Produit non trouvé'
          })
        }

        const row = result.rows[0] as any
        const product = {
          id: String(row.id),
          name: row.name,
          description: row.description || '',
          category: row.category,
          subcategory: row.subcategory,
          categoryDetails: row.categoryId ? {
            id: row.categoryId,
            name: row.categoryName,
            slug: row.categorySlug,
            description: row.categoryDescription,
            icon: row.categoryIcon,
            color: row.categoryColor
          } : null,
          basePrice: Number(row.basePrice) || 0,
          minQuantity: Number(row.minQuantity) || 1,
          maxQuantity: Number(row.maxQuantity) || 1000,
          unit: row.unit || 'pièce',
          productionTimeDays: Number(row.production_time_days) || 7,
          customizable: Boolean(row.customizable),
          materials: row.materials,
          colors: row.colors ? JSON.parse(row.colors) : [],
          sizes: row.sizes ? JSON.parse(row.sizes) : [],
          image: row.image,
          galleryUrls: row.gallery_urls ? JSON.parse(row.gallery_urls) : [],
          specifications: row.specifications,
          tags: [row.category?.toLowerCase(), row.subcategory?.toLowerCase()].filter(Boolean),
          isActive: Boolean(row.isActive),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }

        const duration = Date.now() - startTime
        console.log(`✅ Turso OK: produit ${id} en ${duration}ms`)

        return {
          success: true,
          data: product,
          source: 'turso',
          duration
        }
      } catch (tursoError) {
        console.warn(`⚠️ Turso failed pour produit ${id}`, tursoError)
        throw createError({
          statusCode: 404,
          statusMessage: 'Produit non trouvé'
        })
      }
    }

  } catch (error) {
    console.error(`❌ Erreur critique API /products/${id}:`, error)

    if ((error as any).statusCode) {
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