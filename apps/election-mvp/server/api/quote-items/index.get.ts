/**
 * API Route: GET /api/quote-items
 * Récupère les articles de devis avec stratégie Turso-first → Fallback statique
 */

import { getDatabase } from '../../utils/database'

// Fallback statique minimal pour résilience
const STATIC_QUOTE_ITEMS_FALLBACK = [
  {
    id: 'fallback-1',
    name: 'T-Shirt Personnalisé',
    description: 'T-shirt coton personnalisable avec logo',
    category: 'Textile',
    subcategory: 'Vêtement',
    basePrice: 4500,
    minQuantity: 50,
    maxQuantity: 2000,
    unit: 'pièce',
    status: 'Active',
    tags: ['textile', 'personnalisable', 'campagne'],
    image_url: 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/tshirt-campagne',
    isActive: true
  },
  {
    id: 'fallback-2',
    name: 'Casquette Brodée',
    description: 'Casquette ajustable avec broderie personnalisée',
    category: 'Textile',
    subcategory: 'Couvre-Chef',
    basePrice: 3200,
    minQuantity: 25,
    maxQuantity: 1000,
    unit: 'pièce',
    status: 'Active',
    tags: ['textile', 'broderie', 'campagne'],
    image_url: 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/casquette-campagne',
    isActive: true
  }
]

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log("📋 GET /api/quote-items - Début récupération Turso-first")

    let quoteItems
    let source = 'unknown'

    // 1. Priorité : Turso Database (performance optimale)
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log('🎯 Tentative Turso quote-items...')

        const result = await tursoClient.execute(`
          SELECT
            id, name, description, category, subcategory,
            base_price as basePrice, min_quantity as minQuantity,
            max_quantity as maxQuantity, unit, status,
            tags, image_url, gallery_urls, specifications,
            production_time_days, customizable, materials, colors, sizes,
            sort_order, is_featured as isFeatured, is_active as isActive,
            created_at as createdAt, updated_at as updatedAt
          FROM quote_items
          WHERE is_active = 1 AND status = 'Active'
          ORDER BY sort_order ASC, is_featured DESC, name ASC
        `)

        quoteItems = result.rows.map((row: any) => ({
          id: String(row.id),
          name: row.name,
          description: row.description || '',
          category: row.category,
          subcategory: row.subcategory,
          basePrice: Number(row.basePrice) || 0,
          minQuantity: Number(row.minQuantity) || 1,
          maxQuantity: Number(row.maxQuantity) || 1000,
          unit: row.unit || 'pièce',
          status: row.status,
          tags: row.tags ? JSON.parse(row.tags) : [],
          image_url: row.image_url,
          galleryUrls: row.gallery_urls ? JSON.parse(row.gallery_urls) : [],
          specifications: row.specifications,
          productionTimeDays: Number(row.production_time_days) || 7,
          customizable: Boolean(row.customizable),
          materials: row.materials,
          colors: row.colors ? JSON.parse(row.colors) : [],
          sizes: row.sizes ? JSON.parse(row.sizes) : [],
          sortOrder: Number(row.sort_order) || 0,
          isFeatured: Boolean(row.isFeatured),
          isActive: Boolean(row.isActive),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }))

        source = 'turso'
        const duration = Date.now() - startTime
        console.log(`✅ Turso OK: ${quoteItems.length} quote-items en ${duration}ms`)

      } catch (tursoError) {
        console.warn('⚠️ Turso failed, using static fallback...', tursoError)
      }
    }

    // 2. Fallback final : Données statiques
    if (!quoteItems) {
      quoteItems = [...STATIC_QUOTE_ITEMS_FALLBACK]
      source = 'static'
      const duration = Date.now() - startTime
      console.log(`🛡️ Fallback statique: ${quoteItems.length} quote-items en ${duration}ms`)
    }

    console.log(`✅ Récupération réussie: ${quoteItems.length} quote-items (source: ${source})`)

    // Cache headers pour optimiser les performances
    if (source === 'turso') {
      setHeader(event, "Cache-Control", "public, max-age=1800") // 30 minutes pour Turso
    } else {
      setHeader(event, "Cache-Control", "public, max-age=300") // 5 minutes pour fallback statique
    }

    const response = {
      success: true,
      data: quoteItems,
      count: quoteItems.length,
      source,
      duration: Date.now() - startTime
    }

    if (source === 'static') {
      response.warning = 'Service dégradé - données limitées'
    }

    return response

  } catch (error) {
    console.error("❌ Erreur critique GET /api/quote-items:", error)

    // Même en cas d'erreur critique, on retourne le fallback
    const fallbackItems = [...STATIC_QUOTE_ITEMS_FALLBACK]

    return {
      success: false,
      data: fallbackItems,
      count: fallbackItems.length,
      source: 'static',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
      warning: 'Service en mode dégradé'
    }
  }
});
