/**
 * API Route: GET /api/campaign-bundles/[id]
 * Récupère un campaign bundle spécifique par ID avec stratégie Turso-first → Fallback statique
 * SOLID Architecture - API Layer with Type-safe Bundle Adapter
 */

import { getDatabase } from "../../utils/database";
import type { BundleApiResponse, CampaignBundle, BundleProduct as ExternalBundleProduct } from "@ns2po/types";
import {
  adaptCampaignBundleToBundle,
  adaptCampaignBundleToAggregate,
  adaptExternalBundleProduct,
  safeAdaptCampaignBundle,
  debugBundleTransformation
} from "../../../utils/BundleAdapter";
import type { Bundle, BundleAggregate } from "../../../types/domain/Bundle";

// Fallback statique pour un bundle individuel (format CampaignBundle)
const STATIC_CAMPAIGN_BUNDLE_FALLBACK: CampaignBundle = {
  id: 'pack-starter',
  name: 'Pack Starter Campagne',
  description: 'Pack essentiel pour débuter votre campagne',
  targetAudience: 'local',
  budgetRange: 'starter',
  products: [], // Will be populated separately
  estimatedTotal: 750000,
  originalTotal: 900000,
  savings: 150000,
  popularity: 85,
  isActive: true,
  isFeatured: true,
  tags: ['starter', 'essentiel'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

const STATIC_BUNDLE_PRODUCTS: ExternalBundleProduct[] = [
  {
    id: 'prod-tshirt-001',
    name: 'T-Shirt Personnalisé',
    basePrice: 5000,
    quantity: 100,
    subtotal: 500000
  },
  {
    id: 'prod-stylo-001',
    name: 'Stylo Publicitaire',
    basePrice: 500,
    quantity: 500,
    subtotal: 250000
  }
]

export default defineEventHandler(async (event): Promise<BundleApiResponse> => {
  const startTime = Date.now()
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID du bundle requis"
    })
  }

  console.log(`📦 GET /api/campaign-bundles/${id} - Début récupération`)

  try {
    let bundleAggregate: BundleAggregate | null = null;
    let source = 'unknown';

    // 1. Priorité : Turso Database
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log(`🎯 Tentative Turso pour bundle ${id}...`)

        // Recherche par ID ou nom du bundle
        const bundleResult = await tursoClient.execute({
          sql: `
            SELECT
              cb.id, cb.name, cb.description, cb.target_audience,
              cb.base_price, cb.discount_percentage,
              cb.final_price as estimated_total, cb.is_active,
              cb.display_order, cb.icon, cb.color, cb.features,
              cb.created_at, cb.updated_at
            FROM campaign_bundles cb
            WHERE cb.is_active = 1 AND (cb.id = ? OR cb.name LIKE ?)
            LIMIT 1
          `,
          args: [id, `%${id}%`]
        })

        if (bundleResult.rows.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: "Bundle non trouvé"
          })
        }

        const row = bundleResult.rows[0] as any

        // Récupération des produits du bundle
        const productsResult = await tursoClient.execute({
          sql: `
            SELECT
              bp.product_id, p.name as product_name, p.description as product_description,
              p.id as product_reference,
              p.base_price as product_base_price,
              bp.custom_price,
              CASE
                WHEN bp.price_locked = 1 THEN bp.custom_price
                ELSE p.base_price
              END as base_price,
              CASE
                WHEN bp.price_locked = 1 THEN bp.custom_price
                ELSE p.base_price
              END as unit_price,
              CASE
                WHEN bp.price_locked = 1 THEN bp.custom_price
                ELSE p.base_price
              END as price,
              bp.quantity,
              (CASE
                WHEN bp.price_locked = 1 THEN bp.custom_price
                ELSE p.base_price
              END * bp.quantity) as subtotal,
              bp.is_required, bp.price_locked, p.image_url, p.category,
              bp.created_at as bp_created_at
            FROM bundle_products bp
            LEFT JOIN products p ON bp.product_id = p.id
            WHERE bp.bundle_id = ?
            ORDER BY bp.display_order ASC
          `,
          args: [row.id]
        })

        // Transform raw data to CampaignBundle format
        const campaignBundle: CampaignBundle = {
          id: String(row.id),
          name: row.name,
          description: row.description || '',
          targetAudience: row.target_audience || 'general',
          budgetRange: row.estimated_total < 20000 ? 'starter' : row.estimated_total < 50000 ? 'standard' : 'premium',
          products: [], // Will be set after transformation
          estimatedTotal: Number(row.estimated_total) || 0,
          originalTotal: 0, // Will be calculated from products
          savings: 0, // Will be calculated
          popularity: 90,
          isActive: Boolean(row.is_active),
          isFeatured: Number(row.display_order) <= 3,
          tags: row.features ? JSON.parse(row.features) : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }

        // 🐛 DEBUG ULTRA-DETAILLÉ: Afficher TOUTES les colonnes SQL brutes
        console.log('🔍 [GET BUNDLE] RAW SQL ROWS COUNT:', productsResult.rows.length)
        console.log('🔍 [GET BUNDLE] RAW SQL ROWS:', JSON.stringify(productsResult.rows, null, 2))
        console.log('🔍 [GET BUNDLE] Bundle ID utilisé dans LEFT JOIN:', row.id)
        console.log('🔍 [GET BUNDLE] SQL QUERY:', `
          SELECT bp.product_id, p.name as product_name
          FROM bundle_products bp
          LEFT JOIN products p ON bp.product_id = p.id
          WHERE bp.bundle_id = ${row.id}
        `)

        // Transform products to external format (matching @ns2po/types BundleProduct)
        const externalProducts: ExternalBundleProduct[] = productsResult.rows.map((productRow: any) => {
          // 🐛 DEBUG: Logs pour diagnostiquer échecs tests E2E
          console.log(`🔍 [GET BUNDLE] Produit récupéré:`, {
            product_id: productRow.product_id,
            product_base_price_catalog: productRow.product_base_price,
            custom_price_from_db: productRow.custom_price,
            price_locked_from_db: productRow.price_locked,
            case_when_result_base_price: productRow.base_price,
            case_when_result_unit_price: productRow.unit_price,
            case_when_result_price: productRow.price,
            final_basePrice: Number(productRow.base_price) || 0,
            '⚠️_IF_NULL_OR_ZERO': Number(productRow.base_price) === 0 ? 'ZERO!' : 'OK'
          })

          return {
            id: productRow.product_id,
            name: productRow.product_name || 'Produit sans nom',
            basePrice: Number(productRow.base_price) || 0,
            customPrice: productRow.custom_price ? Number(productRow.custom_price) : undefined,
            priceLocked: Boolean(productRow.price_locked),
            quantity: Number(productRow.quantity) || 1,
            subtotal: Number(productRow.subtotal) || 0,
            image_url: productRow.image_url || undefined
          }
        })

        // Calculate totals
        const originalTotal = externalProducts.reduce((sum, p) => sum + (p.basePrice * p.quantity), 0)
        campaignBundle.originalTotal = originalTotal
        campaignBundle.savings = Math.max(0, originalTotal - campaignBundle.estimatedTotal)

        // Use BundleAdapter to create type-safe aggregate
        bundleAggregate = adaptCampaignBundleToAggregate(campaignBundle, externalProducts)

        source = 'turso'
        const duration = Date.now() - startTime
        console.log(`✅ Turso OK: Bundle ${id} trouvé en ${duration}ms`)

        // Debug transformation in development
        if (process.env.NODE_ENV === 'development') {
          const debug = debugBundleTransformation(campaignBundle)
          console.log(`🔍 Bundle transformation debug:`, debug.mapping)
        }

      } catch (tursoError) {
        console.warn(`⚠️ Turso failed pour bundle ${id}, using static fallback...`, tursoError)
      }
    }

    // 2. Fallback final : Données statiques avec BundleAdapter
    if (!bundleAggregate) {
      bundleAggregate = adaptCampaignBundleToAggregate(STATIC_CAMPAIGN_BUNDLE_FALLBACK, STATIC_BUNDLE_PRODUCTS)
      source = 'static'
      const duration = Date.now() - startTime
      console.log(`🛡️ Fallback statique: Bundle ${id} en ${duration}ms`)
    }

    console.log(`✅ Bundle récupéré: ${bundleAggregate.name} (${bundleAggregate.products.length} produits)`)

    // Cache headers optimisés selon la source
    if (source === 'turso') {
      setHeader(event, "Cache-Control", "public, max-age=1800") // 30 minutes pour Turso
    } else {
      setHeader(event, "Cache-Control", "public, max-age=60") // 1 minute pour fallback
    }
    setHeader(event, "CDN-Cache-Control", "public, max-age=3600") // 1 heure sur CDN
    setHeader(event, "ETag", `"bundle-${bundleAggregate.id}-${bundleAggregate.updatedAt}"`)

    const response = {
      success: true,
      data: bundleAggregate, // Retourner le BundleAggregate type-safe adapté
      source,
      duration: Date.now() - startTime,
      // Meta information for debugging and monitoring
      meta: {
        adapter_version: '1.0.0',
        total_products: bundleAggregate.totalProducts,
        total_quantity: bundleAggregate.totalQuantity,
        data_flow: `Database → CampaignBundle → BundleAdapter → BundleAggregate`
      }
    }

    if (source === 'static') {
      response.warning = 'Service dégradé - données limitées'
    }

    // Performance metrics
    console.log(`⚡ Bundle API Performance: ${response.duration}ms (${source})`)

    return response

  } catch (error) {
    console.error(`❌ Erreur GET /api/campaign-bundles/${id}:`, error)

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : "Erreur interne du serveur",
      data: {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: Date.now() - startTime
      }
    })
  }
})