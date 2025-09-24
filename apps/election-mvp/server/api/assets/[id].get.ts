/**
 * API GET /api/assets/[id] - Récupération d'un asset par ID
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

    const asset = await assetService.getAssetById(id)

    if (!asset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset non trouvé'
      })
    }

    return {
      success: true,
      data: asset,
      message: `Asset ${id} récupéré avec succès`
    }

  } catch (error: any) {
    console.error(`❌ Erreur API GET /api/assets/${getRouterParam(event, 'id')}:`, error)

    // Si c'est une erreur avec statusCode, la retourner telle quelle
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de l\'asset',
      data: { assetId: getRouterParam(event, 'id'), error: error.message }
    })
  }
})