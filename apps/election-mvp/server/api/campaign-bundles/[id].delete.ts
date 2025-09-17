/**
 * API Route: DELETE /api/campaign-bundles/[id]
 * Supprime un campaign bundle existant
 */

import { getDatabase } from "~/server/utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const bundleId = getRouterParam(event, 'id')
    console.log(`📦 DELETE /api/campaign-bundles/${bundleId} - Suppression bundle`)

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

    try {
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

      const response = {
        success: true,
        message: `Bundle "${bundleName}" supprimé avec succès`,
        data: {
          id: bundleId,
          deletedAt: new Date().toISOString()
        },
        duration: Date.now() - startTime
      }

      return response

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