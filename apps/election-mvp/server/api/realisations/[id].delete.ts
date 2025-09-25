/**
 * API Route: DELETE /api/realisations/[id]
 * Supprime une réalisation existante de la base Turso
 */

import { getDatabase } from "../../utils/database"

// Import des services SOLID depuis assetService (temporaire - à déplacer vers services/domain)
import { RealisationService } from "../../services/assetService"

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const realisationId = getRouterParam(event, 'id')
    console.log(`🎨 DELETE /api/realisations/${realisationId} - Suppression réalisation`)

    if (!realisationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de la réalisation requis'
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

    // Paramètres de requête pour suppression Cloudinary
    const query = getQuery(event)
    const deleteFromCloudinary = query.deleteFromCloudinary === 'true'

    console.log(`🔍 Paramètres: deleteFromCloudinary=${deleteFromCloudinary}`)

    // Gérer les réalisations auto-discovery qui ne sont pas en base
    let realisationData: any = null
    let publicIds: string[] = []

    // D'abord, vérifier si c'est une réalisation auto-discovery
    if (realisationId.startsWith('cloudinary_')) {
      console.log(`🔍 Réalisation auto-discovery détectée: ${realisationId}`)

      // Pour les auto-discovery, extraire le publicId depuis l'ID
      // Format: cloudinary_ns2po_gallery_creative_sac_001 -> ns2po/gallery/creative/sac_001
      const publicId = realisationId
        .replace('cloudinary_', '')
        .replace(/_/g, '/')

      realisationData = {
        id: realisationId,
        title: `Réalisation auto-discovery`,
        source: 'cloudinary-auto-discovery',
        cloudinary_public_ids: JSON.stringify([publicId])
      }

      console.log(`☁️ PublicId extrait: ${publicId}`)
    } else {
      // Pour les réalisations Turso, vérifier en base
      const existingRealisation = await db.execute({
        sql: 'SELECT id, title, source, cloudinary_public_ids FROM realisations WHERE id = ?',
        args: [realisationId]
      })

      if (existingRealisation.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Réalisation non trouvée'
        })
      }

      realisationData = existingRealisation.rows[0]
    }

    const realisationTitle = realisationData.title as string
    const realisationSource = realisationData.source as string
    const cloudinaryPublicIdsRaw = realisationData.cloudinary_public_ids as string | null

    // Parser les publicIds Cloudinary pour la suppression
    if (deleteFromCloudinary && cloudinaryPublicIdsRaw) {
      try {
        publicIds = JSON.parse(cloudinaryPublicIdsRaw) || []
        console.log(`☁️ ${publicIds.length} assets Cloudinary à supprimer:`, publicIds)
      } catch (parseError) {
        console.warn('⚠️ Erreur parsing cloudinary_public_ids:', parseError)
        publicIds = []
      }
    }

    try {
      // Architecture SOLID avec Strategy Pattern + Extension Cloudinary
      const realisationService = new RealisationService(db)
      await realisationService.deleteRealisation(realisationId, realisationSource, {
        deleteFromCloudinary,
        publicIds
      })

      // Déterminer l'action effectuée pour la réponse
      const action = realisationSource === 'cloudinary-auto-discovery' ? 'deactivated' : 'deleted'
      const actionLabel = action === 'deactivated' ? 'désactivée' : 'supprimée'

      // Information sur la suppression Cloudinary
      const cloudinaryInfo = deleteFromCloudinary ?
        ` + ${publicIds.length} assets Cloudinary supprimés` : ''

      console.log(`✅ Réalisation ${actionLabel}: ${realisationId} (${realisationTitle})${cloudinaryInfo}`)

      const response = {
        success: true,
        message: `Réalisation "${realisationTitle}" ${actionLabel} avec succès${cloudinaryInfo}`,
        data: {
          id: realisationId,
          action,
          cloudinaryDeletion: {
            requested: deleteFromCloudinary,
            assetsCount: publicIds.length
          },
          ...(action === 'deactivated'
            ? { reason: 'auto-discovery-source', deactivatedAt: new Date().toISOString() }
            : { deletedAt: new Date().toISOString() }
          )
        },
        source: 'turso',
        duration: Date.now() - startTime
      }

      // Cache headers
      setHeader(event, "Cache-Control", "no-cache")

      return response

    } catch (dbError: any) {
      console.error('❌ Erreur base de données:', dbError)

      // Si c'est une erreur de contrainte, la renvoyer telle quelle
      if (dbError.statusCode) {
        throw dbError
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression de la réalisation',
        data: { error: dbError.message }
      })
    }

  } catch (error: any) {
    console.error(`❌ Erreur DELETE /api/realisations/${getRouterParam(event, 'id')}:`, error)

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