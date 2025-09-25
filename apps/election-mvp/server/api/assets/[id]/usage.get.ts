/**
 * API Route: GET /api/assets/:id/usage
 * Récupère les détails d'usage d'un asset spécifique
 */

import { defineEventHandler, createError, getRouterParam } from 'h3'
import { assetService } from '../../../services/assetService'

export default defineEventHandler(async (event) => {
  const assetId = getRouterParam(event, 'id')

  if (!assetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID d\'asset requis'
    })
  }

  try {
    console.log(`📊 Récupération usage asset: ${assetId}`)

    const usageDetails = await assetService.getAssetUsage(assetId)

    console.log(`✅ Usage récupéré pour asset ${assetId}: ${usageDetails.totalUsages} usage(s)`)

    return {
      success: true,
      data: usageDetails,
      message: usageDetails.totalUsages > 0
        ? `Asset utilisé dans ${usageDetails.totalUsages} élément(s)`
        : 'Asset non utilisé'
    }

  } catch (error: any) {
    console.error(`❌ Erreur récupération usage asset ${assetId}:`, error)

    // Si c'est une erreur avec statusCode (venant du service), la relancer telle quelle
    if (error.statusCode) {
      throw error
    }

    // Sinon, créer une erreur générique
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de l\'usage de l\'asset',
      data: {
        assetId,
        error: error.message || 'Erreur inconnue'
      }
    })
  }
})