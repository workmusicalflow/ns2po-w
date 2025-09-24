/**
 * API DELETE /api/assets/[id] - Suppression d'un asset
 * Supprime l'asset de la base ET de Cloudinary avec vérification d'usage
 */

import { assetService } from '../../services/assetService'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id || typeof id !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID d\'asset manquant ou invalide'
      })
    }

    // Récupération des paramètres de requête optionnels
    const query = getQuery(event)
    const force = query.force === 'true' // Pour forcer la suppression même si utilisé

    console.log(`🗑️ Suppression de l'asset ${id} ${force ? '(forcée)' : '(avec vérification)'}`)

    // La suppression avec vérification d'usage est gérée par le service
    const result = await assetService.deleteAsset(id)

    return {
      success: result.success,
      data: {
        asset: result.asset,
        deleted_from_cloudinary: result.success,
        deleted_from_database: result.success
      },
      message: result.success
        ? `Asset ${id} supprimé avec succès`
        : `Erreur lors de la suppression de l'asset ${id}`
    }

  } catch (error: any) {
    console.error(`❌ Erreur API DELETE /api/assets/${getRouterParam(event, 'id')}:`, error)

    // Si c'est une erreur avec statusCode, la retourner telle quelle
    if (error.statusCode) {
      throw error
    }

    // Cas spécial pour asset en cours d'utilisation
    if (error.data && error.data.reason === 'asset_in_use') {
      throw createError({
        statusCode: 409,
        statusMessage: error.statusMessage || 'Asset en cours d\'utilisation',
        data: {
          reason: 'asset_in_use',
          usageCount: error.data.usageCount,
          assetId: getRouterParam(event, 'id'),
          suggestion: 'Utilisez force=true pour forcer la suppression ou supprimez d\'abord les références'
        }
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la suppression de l\'asset',
      data: { assetId: getRouterParam(event, 'id'), error: error.message }
    })
  }
})