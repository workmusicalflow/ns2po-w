/**
 * API Route: GET /api/products/[id]
 * Récupère un produit spécifique par ID avec stratégie hybride Turso → Airtable → Fallback
 */

import { airtableService } from '../../../services/airtable'
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
              id, name, description, category, subcategory,
              base_price as basePrice, min_quantity as minQuantity,
              max_quantity as maxQuantity, unit, production_time_days,
              customizable, materials, colors, sizes,
              image_url as image, gallery_urls, specifications,
              is_active as isActive, created_at as createdAt, updated_at as updatedAt
            FROM products
            WHERE id = ? AND is_active = true
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
        console.warn(`⚠️ Turso failed pour produit ${id}, trying Airtable...`, tursoError)
      }
    }

    // 2. Fallback : Airtable
    try {
      console.log(`🔄 Tentative Airtable pour produit ${id}...`)
      const product = await airtableService.getProduct(id)

      if (!product) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Produit non trouvé'
        })
      }

      const duration = Date.now() - startTime
      console.log(`✅ Airtable OK: produit ${id} en ${duration}ms`)

      return {
        success: true,
        data: product,
        source: 'airtable',
        duration
      }
    } catch (airtableError) {
      console.warn(`⚠️ Airtable failed pour produit ${id}`, airtableError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
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