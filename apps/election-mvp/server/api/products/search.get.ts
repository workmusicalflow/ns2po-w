/**
 * API Route: GET /api/products/search
 * Recherche de produits par terme avec stratégie hybride Turso → Airtable → Fallback
 */

import { airtableService } from '../../../services/airtable'
import { getDatabase } from '../../utils/database'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const query = getQuery(event)
  const searchTerm = query.q as string

  if (!searchTerm || searchTerm.trim().length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Terme de recherche requis (minimum 2 caractères)'
    })
  }

  const cleanTerm = searchTerm.trim()

  try {
    // 1. Priorité : Turso Database
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log(`🎯 Recherche Turso pour "${cleanTerm}"...`)
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
            WHERE is_active = true
              AND (
                name LIKE ? OR
                description LIKE ? OR
                category LIKE ? OR
                subcategory LIKE ? OR
                materials LIKE ?
              )
            ORDER BY
              CASE
                WHEN name LIKE ? THEN 1
                WHEN category LIKE ? THEN 2
                WHEN description LIKE ? THEN 3
                ELSE 4
              END,
              name
          `,
          args: [
            `%${cleanTerm}%`, `%${cleanTerm}%`, `%${cleanTerm}%`, `%${cleanTerm}%`, `%${cleanTerm}%`,
            `%${cleanTerm}%`, `%${cleanTerm}%`, `%${cleanTerm}%`
          ]
        })

        const products = result.rows.map((row: any) => ({
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
        }))

        const duration = Date.now() - startTime
        console.log(`✅ Turso recherche OK: ${products.length} produits pour "${cleanTerm}" en ${duration}ms`)

        return {
          success: true,
          data: products,
          count: products.length,
          query: cleanTerm,
          source: 'turso',
          duration
        }
      } catch (tursoError) {
        console.warn(`⚠️ Turso recherche failed pour "${cleanTerm}", trying Airtable...`, tursoError)
      }
    }

    // 2. Fallback : Airtable
    try {
      console.log(`🔄 Recherche Airtable pour "${cleanTerm}"...`)
      const products = await airtableService.searchProducts(cleanTerm)

      const duration = Date.now() - startTime
      console.log(`✅ Airtable recherche OK: ${products.length} produits pour "${cleanTerm}" en ${duration}ms`)

      return {
        success: true,
        data: products,
        count: products.length,
        query: cleanTerm,
        source: 'airtable',
        duration
      }
    } catch (airtableError) {
      console.warn(`⚠️ Airtable recherche failed pour "${cleanTerm}"`, airtableError)

      // 3. Fallback final : Recherche dans données statiques
      const staticFallback = [
        {
          id: 'static-1',
          name: 'T-Shirt Personnalisé',
          category: 'Textile',
          basePrice: 5000,
          description: 'T-shirt coton personnalisable',
          tags: ['textile', 'personnalisable']
        }
      ].filter(product =>
        product.name.toLowerCase().includes(cleanTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(cleanTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(cleanTerm.toLowerCase())
      )

      const duration = Date.now() - startTime
      console.log(`🛡️ Fallback recherche statique: ${staticFallback.length} produits pour "${cleanTerm}" en ${duration}ms`)

      return {
        success: true,
        data: staticFallback,
        count: staticFallback.length,
        query: cleanTerm,
        source: 'static',
        duration,
        warning: 'Service dégradé - recherche limitée'
      }
    }

  } catch (error) {
    console.error(`❌ Erreur critique recherche "${cleanTerm}":`, error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la recherche de produits',
      data: {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: Date.now() - startTime
      }
    })
  }
})