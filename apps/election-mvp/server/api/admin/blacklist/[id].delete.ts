/**
 * API: DELETE /api/admin/blacklist/[id]
 * Retire un élément de la blacklist (permet la re-découverte)
 */

import { getDatabase } from "../../../utils/database"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const publicId = getRouterParam(event, 'id')
    if (!publicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Public ID requis'
      })
    }

    console.log(`🔓 DELETE /api/admin/blacklist/${publicId} - Retrait de la blacklist`)

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

    // Décoder le public_id s'il est URL-encodé
    const decodedPublicId = decodeURIComponent(publicId)

    // Supprimer de la blacklist
    const result = await db.execute(
      'DELETE FROM realisation_blacklist WHERE public_id = ?',
      [decodedPublicId]
    )

    if (result.rowsAffected === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Élément non trouvé dans la blacklist'
      })
    }

    console.log(`✅ Retiré de la blacklist: ${decodedPublicId}`)

    return {
      success: true,
      message: 'Élément retiré de la blacklist avec succès',
      data: {
        publicId: decodedPublicId,
        removedAt: new Date().toISOString()
      },
      duration: Date.now() - startTime
    }

  } catch (error: any) {
    console.error('❌ Erreur retrait blacklist:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors du retrait de la blacklist',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})