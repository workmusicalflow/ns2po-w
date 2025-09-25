/**
 * API: GET /api/admin/blacklist
 * Récupère la liste des réalisations blacklistées
 */

import { getDatabase } from "../../../utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('📋 GET /api/admin/blacklist - Récupération liste blacklist')

    // Vérification sécurité (optionnel - à activer en prod)
    // const authResult = await verifyAdminAuth(event)
    // if (!authResult.success) {
    //   throw createError({
    //     statusCode: 401,
    //     statusMessage: 'Accès administrateur requis'
    //   })
    // }

    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    const result = await db.execute(`
      SELECT
        id,
        public_id,
        original_title,
        reason,
        blacklisted_at,
        blacklisted_by
      FROM realisation_blacklist
      ORDER BY blacklisted_at DESC
    `)

    const blacklistItems = result.rows || []

    console.log(`✅ ${blacklistItems.length} éléments blacklistés récupérés`)

    return {
      success: true,
      data: blacklistItems,
      total: blacklistItems.length,
      duration: Date.now() - startTime
    }

  } catch (error: any) {
    console.error('❌ Erreur récupération blacklist:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de la blacklist',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})