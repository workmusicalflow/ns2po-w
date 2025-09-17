/**
 * API Route: GET /api/campaign-bundles/[id]
 * Récupère un campaign bundle spécifique par ID avec stratégie Turso-first → Fallback statique
 */

import { getDatabase } from "~/server/utils/database";
import type { BundleApiResponse } from "@ns2po/types";

// Fallback statique pour un bundle individuel
const STATIC_BUNDLE_FALLBACK = {
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
}

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
    let bundle;
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
              cb.id, cb.name, cb.description, cb.target_audience as targetAudience,
              cb.base_price as basePrice, cb.discount_percentage as discountPercentage,
              cb.final_price as finalPrice, cb.is_active as isActive,
              cb.display_order as displayOrder, cb.icon, cb.color, cb.features,
              cb.created_at as createdAt, cb.updated_at as updatedAt
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
              bp.product_id, p.name as product_name,
              COALESCE(bp.custom_price, p.base_price) as basePrice,
              bp.quantity,
              (COALESCE(bp.custom_price, p.base_price) * bp.quantity) as subtotal,
              bp.is_required
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
          isRequired: Boolean(productRow.is_required)
        }))

        // Calculer les totaux
        const estimatedTotal = Number(row.finalPrice) || 0
        const originalTotal = products.reduce((sum, p) => sum + p.subtotal, 0)
        const savings = originalTotal - estimatedTotal

        bundle = {
          id: String(row.id),
          name: row.name,
          description: row.description || '',
          targetAudience: row.targetAudience,
          budgetRange: estimatedTotal < 20000 ? 'starter' : estimatedTotal < 50000 ? 'standard' : 'premium',
          products,
          estimatedTotal,
          originalTotal,
          savings: Math.max(0, savings),
          popularity: 90,
          isActive: Boolean(row.isActive),
          isFeatured: row.displayOrder <= 3,
          tags: row.features ? JSON.parse(row.features) : [],
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          icon: row.icon,
          color: row.color
        }

        source = 'turso'
        const duration = Date.now() - startTime
        console.log(`✅ Turso OK: Bundle ${id} trouvé en ${duration}ms`)

      } catch (tursoError) {
        console.warn(`⚠️ Turso failed pour bundle ${id}, using static fallback...`, tursoError)
      }
    }

    // 2. Fallback final : Données statiques
    if (!bundle) {
      bundle = { ...STATIC_BUNDLE_FALLBACK }
      source = 'static'
      const duration = Date.now() - startTime
      console.log(`🛡️ Fallback statique: Bundle ${id} en ${duration}ms`)
    }

    console.log(`✅ Bundle récupéré: ${bundle.name} (${bundle.products.length} produits)`)

    // Cache headers optimisés selon la source
    if (source === 'turso') {
      setHeader(event, "Cache-Control", "public, max-age=1800") // 30 minutes pour Turso
    } else {
      setHeader(event, "Cache-Control", "public, max-age=60") // 1 minute pour fallback
    }
    setHeader(event, "CDN-Cache-Control", "public, max-age=3600") // 1 heure sur CDN
    setHeader(event, "ETag", `"bundle-${bundle.id}-${bundle.updatedAt}"`)

    const response: BundleApiResponse = {
      success: true,
      data: [bundle], // Retourner un array pour cohérence avec l'interface BundleApiResponse
      source,
      duration: Date.now() - startTime,
      pagination: {
        page: 1,
        limit: 1,
        total: 1,
        hasMore: false,
      },
    }

    if (source === 'static') {
      response.warning = 'Service dégradé - données limitées'
    }

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