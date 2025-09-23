/**
 * API Route: GET /api/products
 * Récupère tous les produits avec stratégie Turso-first → Fallback statique
 */

import { getDatabase } from '../../utils/database'

// Fallback statique minimal pour résilience
const STATIC_FALLBACK = [
  {
    id: 'static-1',
    name: 'T-Shirt Personnalisé',
    category: 'Textile',
    basePrice: 5000,
    price: 5000, // 🔧 FIX: Ajout du champ price pour cohérence
    minQuantity: 50,
    maxQuantity: 1000,
    description: 'T-shirt coton personnalisable avec logo',
    image: 'https://res.cloudinary.com/dsrvzogof/image/upload/v1/ns2po-assets/tshirt',
    tags: ['textile', 'personnalisable'],
    isActive: true
  },
  {
    id: 'static-2',
    name: 'Casquette Brodée',
    category: 'Textile',
    basePrice: 3500,
    price: 3500, // 🔧 FIX: Ajout du champ price pour cohérence
    minQuantity: 25,
    maxQuantity: 500,
    description: 'Casquette avec broderie personnalisée',
    image: 'https://res.cloudinary.com/dsrvzogof/image/upload/v1/ns2po-assets/casquette',
    tags: ['textile', 'broderie'],
    isActive: true
  },
  {
    id: 'static-3',
    name: 'Stylo Publicitaire',
    category: 'Bureau',
    basePrice: 500,
    price: 500, // 🔧 FIX: Ajout du champ price pour cohérence
    minQuantity: 100,
    maxQuantity: 5000,
    description: 'Stylo personnalisé avec logo',
    image: 'https://res.cloudinary.com/dsrvzogof/image/upload/v1/ns2po-assets/stylo',
    tags: ['bureau', 'publicitaire'],
    isActive: true
  }
]

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    // 1. Priorité : Turso Database (performance optimale)
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log('🎯 Tentative Turso...')
        const result = await tursoClient.execute(`
          SELECT
            id, name, description, category, subcategory,
            base_price as basePrice, min_quantity as minQuantity,
            max_quantity as maxQuantity, unit, production_time_days,
            customizable, materials, colors, sizes,
            image_url as image, gallery_urls, specifications,
            is_active as isActive, created_at as createdAt, updated_at as updatedAt
          FROM products
          WHERE is_active = true
          ORDER BY category, name
        `)

        const products = result.rows.map((row: any) => ({
          id: String(row.id),
          name: row.name,
          description: row.description || '',
          category: row.category,
          subcategory: row.subcategory,
          basePrice: Number(row.basePrice) || 0,
          price: Number(row.basePrice) || 0, // 🔧 FIX: Ajout du champ price requis par la validation
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
        console.log(`✅ Turso OK: ${products.length} produits en ${duration}ms`)

        return {
          success: true,
          data: products,
          source: 'turso',
          count: products.length,
          duration,
          cached: false
        }
      } catch (tursoError) {
        console.warn('⚠️ Turso failed, using static fallback...', tursoError)
      }
    }

    // 2. Fallback final : Données statiques (résilience maximale)
    const duration = Date.now() - startTime
    console.log(`🛡️ Fallback statique: ${STATIC_FALLBACK.length} produits en ${duration}ms`)

    return {
      success: true,
      data: STATIC_FALLBACK,
      source: 'static',
      count: STATIC_FALLBACK.length,
      duration,
      cached: false,
      warning: 'Service dégradé - données limitées'
    }

  } catch (error) {
    console.error('❌ Erreur critique API /products:', error)

    // Même en cas d'erreur critique, on retourne le fallback
    return {
      success: false,
      data: STATIC_FALLBACK,
      source: 'static',
      count: STATIC_FALLBACK.length,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Erreur serveur',
      warning: 'Service en mode dégradé'
    }
  }
})