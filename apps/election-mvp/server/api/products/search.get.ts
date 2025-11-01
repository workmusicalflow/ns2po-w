/**
 * API Route: GET /api/products/search
 * Recherche de produits avec FTS5 + filtres avancés (schéma normalisé)
 *
 * MIGRATION POST-002:
 * - FTS5 (Full-Text Search) pour recherche textuelle ultra-rapide
 * - Filtres par matériaux/couleurs depuis tables normalisées
 * - Support multi-critères: ?q=shirt&material=coton&color=blanc
 */

import { getDatabase } from '../../utils/database'
import {
  searchProductsFTS,
  searchProductsByMaterial,
  searchProductsByColor,
  getProductWithRelations
} from '../../utils/db-queries'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const query = getQuery(event)
  const searchTerm = query.q as string
  const materialFilter = query.material as string | undefined
  const colorFilter = query.color as string | undefined

  if (!searchTerm || searchTerm.trim().length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Terme de recherche requis (minimum 2 caractères)'
    })
  }

  const cleanTerm = searchTerm.trim()

  try {
    const tursoClient = getDatabase()
    if (!tursoClient) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Base de données indisponible'
      })
    }

    console.log(`🔍 Recherche FTS5 pour "${cleanTerm}" (material: ${materialFilter || 'none'}, color: ${colorFilter || 'none'})...`)

    // 1. Recherche Full-Text Search (FTS5) - Ultra rapide
    let productIds = await searchProductsFTS(tursoClient, cleanTerm)
    let searchMethod = 'fts5'

    // 2. Filtres additionnels (intersection des résultats)
    if (materialFilter) {
      const materialIds = await searchProductsByMaterial(tursoClient, materialFilter)
      productIds = productIds.filter(id => materialIds.includes(id))
      searchMethod += '+material'
    }

    if (colorFilter) {
      const colorIds = await searchProductsByColor(tursoClient, colorFilter)
      productIds = productIds.filter(id => colorIds.includes(id))
      searchMethod += '+color'
    }

    // 3. Récupérer produits complets avec relations
    const products = await Promise.all(
      productIds.map(id => getProductWithRelations(tursoClient, id))
    )

    // Filtrer les nulls (produits supprimés entre-temps)
    const validProducts = products.filter(p => p !== null)

    const duration = Date.now() - startTime
    console.log(`✅ Recherche ${searchMethod} OK: ${validProducts.length} produits pour "${cleanTerm}" en ${duration}ms`)

    return {
      success: true,
      data: validProducts,
      count: validProducts.length,
      query: cleanTerm,
      filters: {
        material: materialFilter || null,
        color: colorFilter || null
      },
      source: 'turso-normalized-fts5',
      searchMethod,
      duration
    }

  } catch (error) {
    console.error(`❌ Erreur critique recherche "${cleanTerm}":`, error)

    // Fallback: Recherche dans données statiques en cas d'erreur
    const staticFallback = [
      {
        id: 'static-1',
        name: 'T-Shirt Personnalisé',
        category: 'Textile',
        basePrice: 5000,
        price: 5000,
        description: 'T-shirt coton personnalisable',
        tags: ['textile', 'personnalisable'],
        materials: ['Coton'],
        colors: ['Blanc', 'Noir'],
        sizes: ['S', 'M', 'L'],
        isActive: true
      }
    ].filter(product =>
      product.name.toLowerCase().includes(cleanTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(cleanTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(cleanTerm.toLowerCase())
    )

    const fallbackDuration = Date.now() - startTime
    console.log(`🛡️ Fallback recherche statique: ${staticFallback.length} produits pour "${cleanTerm}" en ${fallbackDuration}ms`)

    return {
      success: true,
      data: staticFallback,
      count: staticFallback.length,
      query: cleanTerm,
      source: 'static-fallback',
      duration: fallbackDuration,
      warning: 'Service en mode dégradé suite à erreur'
    }
  }
})