/**
 * API Route: GET /api/campaign-bundles
 * Récupère tous les campaign bundles avec stratégie hybride Turso → Airtable → Fallback statique
 */

import { airtableService } from "~/services/airtable";
import { getDatabase } from "~/server/utils/database";
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
    updatedAt: new Date().toISOString()
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
    updatedAt: new Date().toISOString()
  }
]

export default defineEventHandler(async (event): Promise<BundleApiResponse> => {
  const startTime = Date.now()

  try {
    console.log("📦 GET /api/campaign-bundles - Début récupération hybride");

    // Récupération des query parameters
    const query = getQuery(event);
    const audience = query.audience as string | undefined;
    const featured = query.featured === "true";

    let bundles;
    let source = 'unknown';

    // 1. Priorité : Turso Database (performance optimale)
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log('🎯 Tentative Turso...')

        let sql = `
          SELECT
            id, airtable_id, name, description, target_audience as targetAudience,
            budget_range as budgetRange, estimated_total as estimatedTotal,
            original_total as originalTotal, savings, popularity, is_active as isActive,
            is_featured as isFeatured, tags, created_at as createdAt, updated_at as updatedAt
          FROM campaign_bundles
          WHERE is_active = true
        `

        const conditions = []
        const args = []

        if (audience && audience !== "all") {
          conditions.push("target_audience = ?")
          args.push(audience)
        }

        if (featured) {
          conditions.push("is_featured = true")
        }

        if (conditions.length > 0) {
          sql += " AND " + conditions.join(" AND ")
        }

        sql += " ORDER BY is_featured DESC, popularity DESC"

        const result = await tursoClient.execute({ sql, args })

        bundles = await Promise.all(result.rows.map(async (row: any) => {
          // Récupération des produits du bundle depuis Turso
          const productsResult = await tursoClient.execute({
            sql: `SELECT product_id, product_name, base_price, quantity, subtotal
                  FROM bundle_products WHERE campaign_bundle_id = ?`,
            args: [row.airtable_id || row.id]
          })

          const products = productsResult.rows.map((productRow: any) => ({
            id: productRow.product_id,
            name: productRow.product_name,
            basePrice: Number(productRow.base_price) || 0,
            quantity: Number(productRow.quantity) || 1,
            subtotal: Number(productRow.subtotal) || 0
          }))

          return {
            id: row.airtable_id || row.id,
            name: row.name,
            description: row.description || '',
            targetAudience: row.targetAudience,
            budgetRange: row.budgetRange,
            products,
            estimatedTotal: Number(row.estimatedTotal) || 0,
            originalTotal: Number(row.originalTotal) || 0,
            savings: Number(row.savings) || 0,
            popularity: Number(row.popularity) || 0,
            isActive: Boolean(row.isActive),
            isFeatured: Boolean(row.isFeatured),
            tags: row.tags ? JSON.parse(row.tags) : [],
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          }
        }))

        source = 'turso'
        const duration = Date.now() - startTime
        console.log(`✅ Turso OK: ${bundles.length} bundles en ${duration}ms`)

      } catch (tursoError) {
        console.warn('⚠️ Turso failed, trying Airtable...', tursoError)
      }
    }

    // 2. Fallback : Airtable (données autoritaires)
    if (!bundles) {
      try {
        console.log('🔄 Tentative Airtable...')

        if (audience && audience !== "all") {
          bundles = await airtableService.getCampaignBundlesByAudience(audience);
        } else {
          bundles = await airtableService.getCampaignBundles();
        }

        // Filtrage des bundles featured si demandé
        if (featured) {
          bundles = bundles.filter(bundle => bundle.isFeatured);
        }

        source = 'airtable'
        const duration = Date.now() - startTime
        console.log(`✅ Airtable OK: ${bundles.length} bundles en ${duration}ms`)

      } catch (airtableError) {
        console.warn('⚠️ Airtable failed, using static fallback...', airtableError)
      }
    }

    // 3. Fallback final : Données statiques
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

    // Cache headers pour optimiser les performances
    if (source === 'turso') {
      setHeader(event, "Cache-Control", "public, max-age=900"); // 15 minutes pour Turso
    } else if (source === 'airtable') {
      setHeader(event, "Cache-Control", "public, max-age=300"); // 5 minutes pour Airtable
    } else {
      setHeader(event, "Cache-Control", "public, max-age=60"); // 1 minute pour fallback
    }
    setHeader(event, "CDN-Cache-Control", "public, max-age=1800"); // 30 minutes sur CDN

    const response: BundleApiResponse = {
      success: true,
      data: bundles,
      source,
      duration: Date.now() - startTime,
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