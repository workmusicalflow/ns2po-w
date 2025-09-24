/**
 * API PUT /api/assets/[id] - Mise à jour d'un asset (métadonnées uniquement)
 */

import { assetService } from '../../services/assetService'
import type { UpdateAssetData } from '../../services/assetService'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id || typeof id !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID d\'asset manquant ou invalide'
      })
    }

    const body = await readBody(event)

    if (!body || typeof body !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Corps de la requête manquant ou invalide'
      })
    }

    // Validation des données de mise à jour
    const updates: UpdateAssetData = {}

    if (body.alt_text !== undefined) {
      if (typeof body.alt_text !== 'string' && body.alt_text !== null) {
        throw createError({
          statusCode: 400,
          statusMessage: 'alt_text doit être une chaîne de caractères ou null'
        })
      }
      updates.alt_text = body.alt_text
    }

    if (body.caption !== undefined) {
      if (typeof body.caption !== 'string' && body.caption !== null) {
        throw createError({
          statusCode: 400,
          statusMessage: 'caption doit être une chaîne de caractères ou null'
        })
      }
      updates.caption = body.caption
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'tags doit être un tableau de chaînes de caractères'
        })
      }

      // Validation que tous les éléments sont des strings
      const invalidTags = body.tags.filter(tag => typeof tag !== 'string')
      if (invalidTags.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Tous les tags doivent être des chaînes de caractères'
        })
      }

      updates.tags = body.tags
    }

    // Vérification qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updates).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun champ valide à mettre à jour'
      })
    }

    const updatedAsset = await assetService.updateAsset(id, updates)

    if (!updatedAsset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset non trouvé'
      })
    }

    return {
      success: true,
      data: updatedAsset,
      message: `Asset ${id} mis à jour avec succès`
    }

  } catch (error: any) {
    console.error(`❌ Erreur API PUT /api/assets/${getRouterParam(event, 'id')}:`, error)

    // Si c'est une erreur avec statusCode, la retourner telle quelle
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour de l\'asset',
      data: { assetId: getRouterParam(event, 'id'), error: error.message }
    })
  }
})