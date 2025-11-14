/**
 * API Route: GET /api/campaign-bundles
 * Récupère tous les campaign bundles avec stratégie Redis Cache-Aside → Turso → Fallback statique
 *
 * ARCHITECTURE CACHE UNIFIÉE (Gemini 20 sources):
 * - Redis cache layer (TTL 300s, clé: campaign-bundles:list:active)
 * - Invalidation programmatique après mutations admin
 * - Headers HTTP adaptatifs (CDN + Browser)
 * - Synchronisation avec /api/admin/products mutations
 */

// Note: Airtable service removed - now using Turso-first → Static fallback architecture
import { getDatabase } from "../../utils/database";
import type { BundleApiResponse } from "@ns2po/types";

// Fallback statique pour campaign bundles
const STATIC_BUNDLES_FALLBACK = [
  {
    id: 'pack-starter',
    name: 'Pack Starter Campagne',
    description: 'Pack essentiel pour débuter votre campagne',
    targetAudience: 'local',
    budgetRange: 'starter',
    products: [
      { id: 'static-1', name: 'T-Shirt Personnalisé', basePrice: 5000, quantity: 100, subtotal: 500000 },
      { id: 'static-3', name: 'Stylo Publicitaire', basePrice: 500, quantity: 500, subtotal: 250000 }
    ],
    estimatedTotal: 750000,
    originalTotal: 900000,
    savings: 150000,
    popularity: 85,
    isActive: true,
    isFeatured: true,
    tags: ['starter', 'essentiel'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  },
  {
    id: 'pack-premium',
    name: 'Pack Premium Campagne',
    description: 'Pack complet pour une campagne professionnelle',
    targetAudience: 'national',
    budgetRange: 'premium',
    products: [
      { id: 'static-1', name: 'T-Shirt Personnalisé', basePrice: 5000, quantity: 500, subtotal: 2500000 },
      { id: 'static-2', name: 'Casquette Brodée', basePrice: 3500, quantity: 200, subtotal: 700000 },
      { id: 'static-3', name: 'Stylo Publicitaire', basePrice: 500, quantity: 1000, subtotal: 500000 }
    ],
    estimatedTotal: 3700000,
    originalTotal: 4500000,
    savings: 800000,
    popularity: 92,
    isActive: true,
    isFeatured: true,
    tags: ['premium', 'complet'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  }
]

export default defineEventHandler(async (event): Promise<BundleApiResponse> => {
  const startTime = Date.now()

  try {
    console.log("📦 GET /api/campaign-bundles - Début récupération Redis → Turso → Fallback");

    // Récupération des query parameters
    const query = getQuery(event);
    const audience = query.audience as string | undefined;
    const featured = query.featured === "true";

    let bundles;
    let source = 'unknown';
    let cached = false;

    // ⭐ ÉTAPE 1: Check Redis Cache (NOUVEAU - Architecture unifiée)
    const cacheKey = 'campaign-bundles:list:active'
    const cacheStorage = useStorage('cache')

    try {
      const cachedData = await cacheStorage.getItem(cacheKey)
      if (cachedData) {
        bundles = cachedData as any[]
        source = 'redis-cache'
        cached = true

        const duration = Date.now() - startTime
        console.log(`✅ [GET CAMPAIGN-BUNDLES] Cache HIT Redis: ${bundles.length} bundles en ${duration}ms`)

        // Appliquer filtres sur cache (pas de re-query Turso)
        if (audience && audience !== "all") {
          bundles = bundles.filter(bundle => bundle.targetAudience === audience)
        }
        if (featured) {
          bundles = bundles.filter(bundle => bundle.isFeatured)
        }

        // Headers conservateurs pour données cachées
        setHeader(event, 'Cache-Control', 'public, max-age=30, must-revalidate')
        setHeader(event, 'CDN-Cache-Control', 'public, s-maxage=180') // 3 min CDN (vs 30 min avant)

        return {
          success: true,
          data: bundles,
          source,
          duration,
          cached: true
        }
      }
      console.log('ℹ️ [GET CAMPAIGN-BUNDLES] Cache MISS Redis - Fetch Turso')
    } catch (cacheError) {
      console.warn('⚠️ [GET CAMPAIGN-BUNDLES] Erreur Redis (continue sans cache):', cacheError)
    }

    // ⭐ ÉTAPE 2: Cache MISS → Fetch Turso Database
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log('🎯 Tentative Turso...')

        let sql = `
          SELECT
            cb.id, cb.name, cb.description, cb.target_audience as targetAudience,
            cb.base_price as basePrice, cb.discount_percentage as discountPercentage,
            cb.final_price as finalPrice, cb.is_active as isActive,
            cb.display_order as displayOrder, cb.icon, cb.color, cb.features,
            cb.version, cb.created_at as createdAt, cb.updated_at as updatedAt
          FROM campaign_bundles cb
          WHERE cb.is_active = 1
        `

        const conditions = []
        const args = []

        if (audience && audience !== "all") {
          conditions.push("cb.target_audience = ?")
          args.push(audience)
        }

        if (conditions.length > 0) {
          sql += " AND " + conditions.join(" AND ")
        }

        sql += " ORDER BY cb.display_order ASC, cb.created_at DESC"

        const result = await tursoClient.execute({ sql, args })

        bundles = await Promise.all(result.rows.map(async (row: any) => {
          // Récupération des produits du bundle depuis la table bundle_products
          const productsResult = await tursoClient.execute({
            sql: `
              SELECT
                bp.product_id, p.name as product_name,
                COALESCE(bp.custom_price, p.base_price) as basePrice,
                bp.quantity,
                (COALESCE(bp.custom_price, p.base_price) * bp.quantity) as subtotal,
                bp.is_required,
                p.image_url
              FROM bundle_products bp
              LEFT JOIN products p ON bp.product_id = p.id
              WHERE bp.bundle_id = ?
              ORDER BY bp.display_order ASC
            `,
            args: [row.id]
          })

          const products = productsResult.rows.map((productRow: any) => ({
            id: productRow.product_id,
            name: productRow.product_name,
            basePrice: Number(productRow.basePrice) || 0,
            quantity: Number(productRow.quantity) || 1,
            subtotal: Number(productRow.subtotal) || 0,
            isRequired: Boolean(productRow.is_required),
            image_url: productRow.image_url || null
          }))

          // Calculer les totaux
          const estimatedTotal = Number(row.finalPrice) || 0
          const originalTotal = products.reduce((sum, p) => sum + p.subtotal, 0)
          const savings = originalTotal - estimatedTotal

          return {
            id: String(row.id),
            name: row.name,
            description: row.description || '',
            targetAudience: row.targetAudience,
            budgetRange: estimatedTotal < 20000 ? 'starter' : estimatedTotal < 50000 ? 'standard' : 'premium',
            products,
            estimatedTotal,
            originalTotal,
            savings: Math.max(0, savings),
            popularity: 90, // Valeur par défaut, pourrait être calculée
            isActive: Boolean(row.isActive),
            isFeatured: row.displayOrder <= 3, // Les 3 premiers sont featured
            tags: row.features ? JSON.parse(row.features) : [],
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            icon: row.icon,
            color: row.color,
            version: Number(row.version) || 1
          }
        }))

        source = 'turso-fresh'
        const duration = Date.now() - startTime
        console.log(`✅ [GET CAMPAIGN-BUNDLES] Turso OK: ${bundles.length} bundles en ${duration}ms`)

        // ⭐ ÉTAPE 3: Store Redis Cache (TTL 5 min = aligné /api/products)
        try {
          await cacheStorage.setItem(cacheKey, bundles, { ttl: 300 })
          console.log(`💾 [GET CAMPAIGN-BUNDLES] Cache Redis créé avec succès (TTL 300s)`)
        } catch (cacheStoreError) {
          console.error('❌ [GET CAMPAIGN-BUNDLES] Échec stockage cache Redis:', cacheStoreError)
          // Continue sans bloquer (fallback graceful)
        }

      } catch (tursoError) {
        console.warn('⚠️ Turso failed, using static fallback...', tursoError)
      }
    }

    // 2. Fallback final : Données statiques (Airtable abandonné)
    if (!bundles) {
      bundles = [...STATIC_BUNDLES_FALLBACK]

      // Appliquer les filtres sur les données statiques
      if (audience && audience !== "all") {
        bundles = bundles.filter(bundle => bundle.targetAudience === audience)
      }

      if (featured) {
        bundles = bundles.filter(bundle => bundle.isFeatured)
      }

      source = 'static'
      const duration = Date.now() - startTime
      console.log(`🛡️ Fallback statique: ${bundles.length} bundles en ${duration}ms`)
    }

    console.log(`✅ Récupération réussie: ${bundles.length} campaign bundles (source: ${source})`);

    // ⭐ ÉTAPE 4: Headers HTTP adaptatifs (NOUVEAU - Validé Gemini)
    if (source === 'turso-fresh') {
      // Données fraîches Turso → Permettre cache CDN modéré + SWR
      setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      setHeader(event, 'CDN-Cache-Control', 'public, s-maxage=300') // 5 min CDN (aligné Redis, vs 30 min avant)
      console.log('📤 [HEADERS] Fresh Turso: CDN 5min + Browser 60s + SWR')
    } else if (source === 'static') {
      // Fallback statique → Cache court
      setHeader(event, 'Cache-Control', 'public, max-age=60')
      setHeader(event, 'CDN-Cache-Control', 'public, s-maxage=60')
      console.log('📤 [HEADERS] Static fallback: CDN/Browser 60s')
    }
    // Note: Headers pour 'redis-cache' déjà définis au return early (ligne 101-102)

    const response: BundleApiResponse = {
      success: true,
      data: bundles,
      source,
      duration: Date.now() - startTime,
      cached,
      pagination: {
        page: 1,
        limit: bundles.length,
        total: bundles.length,
        hasMore: false,
      },
    }

    if (source === 'static') {
      response.warning = 'Service dégradé - données limitées'
    }

    return response

  } catch (error) {
    console.error("❌ Erreur critique GET /api/campaign-bundles:", error);

    // Même en cas d'erreur critique, on retourne le fallback
    const fallbackBundles = [...STATIC_BUNDLES_FALLBACK]
    let bundles = fallbackBundles

    // Appliquer les filtres sur les données statiques
    const query = getQuery(event);
    const audience = query.audience as string | undefined;
    const featured = query.featured === "true";

    if (audience && audience !== "all") {
      bundles = fallbackBundles.filter(bundle => bundle.targetAudience === audience)
    }

    if (featured) {
      bundles = fallbackBundles.filter(bundle => bundle.isFeatured)
    }

    return {
      success: false,
      data: bundles || fallbackBundles,
      source: 'static',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
      warning: 'Service en mode dégradé',
      pagination: {
        page: 1,
        limit: (bundles || fallbackBundles).length,
        total: (bundles || fallbackBundles).length,
        hasMore: false,
      },
    };
  }
});