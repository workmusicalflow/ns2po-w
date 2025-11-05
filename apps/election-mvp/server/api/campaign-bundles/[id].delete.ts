/**
 * API Route: DELETE /api/campaign-bundles/[id]
 * Supprime un campaign bundle existant
 */

import { getDatabase } from "../../utils/database"
import { invalidateCampaignBundlesCache } from "../../utils/cache-invalidation"

/**
 * Vérifie les contraintes référentielles avant suppression d'un bundle
 * @param db - Instance de la base de données
 * @param bundleId - ID du bundle à supprimer
 * @param bundleName - Nom du bundle pour les messages d'erreur
 * @throws CreateError si des références existent
 */
async function checkReferentialConstraints(db: any, bundleId: string, bundleName: string) {
  const constraints = []

  // 1. Vérifier si le bundle est référencé dans des devis actifs
  const activeQuotes = await db.execute({
    sql: `SELECT id, customer_data, status
          FROM quotes
          WHERE status NOT IN ('cancelled', 'expired')
          AND (items LIKE ? OR items LIKE ?)`,
    args: [`%"bundleId":"${bundleId}"%`, `%"bundle_id":"${bundleId}"%`]
  })

  if (activeQuotes.rows.length > 0) {
    constraints.push({
      type: 'quotes',
      count: activeQuotes.rows.length,
      message: `${activeQuotes.rows.length} devis actif(s) utilisent ce bundle`
    })
  }

  // 2. Vérifier si le bundle est référencé dans des commandes
  const orders = await db.execute({
    sql: `SELECT id, customer_data, status
          FROM orders
          WHERE status NOT IN ('cancelled', 'refunded')
          AND (items LIKE ? OR items LIKE ?)`,
    args: [`%"bundleId":"${bundleId}"%`, `%"bundle_id":"${bundleId}"%`]
  })

  if (orders.rows.length > 0) {
    constraints.push({
      type: 'orders',
      count: orders.rows.length,
      message: `${orders.rows.length} commande(s) utilisent ce bundle`
    })
  }

  // 3. Vérifier si le bundle est featured (important pour la vitrine)
  const featuredCheck = await db.execute({
    sql: 'SELECT display_order FROM campaign_bundles WHERE id = ? AND display_order <= 3',
    args: [bundleId]
  })

  if (featuredCheck.rows.length > 0) {
    constraints.push({
      type: 'featured',
      count: 1,
      message: 'Ce bundle est en vedette sur la page d\'accueil'
    })
  }

  // Si des contraintes existent, lever une erreur avec les détails
  if (constraints.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Impossible de supprimer le bundle',
      data: {
        error: `Le bundle "${bundleName}" ne peut pas être supprimé car il est encore utilisé`,
        constraints,
        alternatives: [
          'Désactiver le bundle au lieu de le supprimer',
          'Annuler d\'abord les devis et commandes associés',
          'Retirer le bundle de la section vedette'
        ]
      }
    })
  }
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const bundleId = getRouterParam(event, 'id')
    const query = getQuery(event)
    const force = query.force === 'true'
    const soft = query.soft === 'true'

    console.log(`📦 DELETE /api/campaign-bundles/${bundleId} - Suppression bundle (force: ${force}, soft: ${soft})`)

    if (!bundleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du bundle requis'
      })
    }

    // Accès à la base de données
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le bundle existe
    const existingBundle = await db.execute({
      sql: 'SELECT id, name FROM campaign_bundles WHERE id = ?',
      args: [bundleId]
    })

    if (existingBundle.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    }

    const bundleName = existingBundle.rows[0].name

    // Vérifier les contraintes référentielles avant suppression (sauf si force=true)
    if (!force) {
      await checkReferentialConstraints(db, bundleId, bundleName)
    }

    try {
      if (soft) {
        // Soft delete: désactiver le bundle au lieu de le supprimer
        await db.execute({
          sql: 'UPDATE campaign_bundles SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          args: [bundleId]
        })

        console.log(`✅ Bundle désactivé avec succès: ${bundleId} (${bundleName})`)

        // ⭐ INVALIDATION CACHE REDIS (architecture unifiée)
        try {
          await invalidateCampaignBundlesCache()
          console.log('🗑️ [DELETE BUNDLE - SOFT] Cache Redis invalidé')
        } catch (cacheError) {
          console.error('❌ [DELETE BUNDLE - SOFT] Échec invalidation cache:', cacheError)
        }

        const response = {
          success: true,
          message: `Bundle "${bundleName}" désactivé avec succès`,
          data: {
            id: bundleId,
            deactivatedAt: new Date().toISOString(),
            action: 'soft_delete'
          },
          duration: Date.now() - startTime
        }

        return response
      } else {
        // Hard delete: suppression définitive
        // 1. Supprimer les produits du bundle (CASCADE automatique grâce aux FK)
        await db.execute({
          sql: 'DELETE FROM bundle_products WHERE bundle_id = ?',
          args: [bundleId]
        })

        // 2. Supprimer le bundle principal
        await db.execute({
          sql: 'DELETE FROM campaign_bundles WHERE id = ?',
          args: [bundleId]
        })

        console.log(`✅ Bundle supprimé avec succès: ${bundleId} (${bundleName})`)

        // ⭐ INVALIDATION CACHE REDIS (architecture unifiée)
        try {
          await invalidateCampaignBundlesCache()
          console.log('🗑️ [DELETE BUNDLE - HARD] Cache Redis invalidé')
        } catch (cacheError) {
          console.error('❌ [DELETE BUNDLE - HARD] Échec invalidation cache:', cacheError)
        }

        const response = {
          success: true,
          message: `Bundle "${bundleName}" supprimé définitivement`,
          data: {
            id: bundleId,
            deletedAt: new Date().toISOString(),
            action: 'hard_delete',
            forced: force
          },
          duration: Date.now() - startTime
        }

        return response
      }

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du bundle',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur DELETE /api/campaign-bundles/${getRouterParam(event, 'id')}:`, error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})