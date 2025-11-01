/**
 * API Route: GET /api/products
 * Récupère tous les produits avec schéma normalisé
 *
 * MIGRATION POST-002: Utilise getProductsListOptimized() avec GROUP_CONCAT
 * - 1 seule requête optimisée vs N+1 queries
 * - Relations depuis tables normalisées (materials, colors, sizes, gallery)
 */

import { getDatabase } from '../../utils/database'
import { getProductsListOptimized } from '../../utils/db-queries'

// Fallback statique minimal pour résilience
const STATIC_FALLBACK = [
  {
    id: 'static-1',
    name: 'T-Shirt Personnalisé',
    category: 'Textile',
    basePrice: 5000,
    price: 5000,
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
    price: 3500,
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
    price: 500,
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
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log('🎯 Chargement produits (schéma normalisé, GROUP_CONCAT)...')

        // Récupération optimisée avec relations (1 seule requête)
        const products = await getProductsListOptimized(tursoClient, {
          isActive: true
        })

        const duration = Date.now() - startTime
        console.log(`✅ ${products.length} produits récupérés en ${duration}ms (schéma normalisé)`)

        return {
          success: true,
          data: products,
          source: 'turso-normalized',
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