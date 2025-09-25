/**
 * API Route: POST /api/assets/:id/replace
 * Remplace un asset par un autre avec préservation des références
 */

import { defineEventHandler, createError, getRouterParam, readBody, readMultipartFormData, getHeader } from 'h3'
import { assetService } from '../../../services/assetService'

export default defineEventHandler(async (event) => {
  const oldAssetId = getRouterParam(event, 'id')

  if (!oldAssetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID d\'asset à remplacer requis'
    })
  }

  try {
    console.log(`🔄 Remplacement asset: ${oldAssetId}`)

    let newAssetId: string | undefined = undefined
    let newAssetFile: any = undefined
    let deleteOldAsset: boolean = false

    // Déterminer le type de contenu de la requête
    const contentType = getHeader(event, 'content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Traitement d'un upload de fichier
      const formData = await readMultipartFormData(event)

      if (!formData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Données de formulaire invalides'
        })
      }

      // Extraire le fichier et les métadonnées
      for (const field of formData) {
        if (field.name === 'file' && field.data) {
          newAssetFile = {
            data: field.data,
            filename: field.filename,
            type: field.type
          }
        } else if (field.name === 'newAssetId' && field.data) {
          newAssetId = field.data.toString()
        } else if (field.name === 'deleteOldAsset' && field.data) {
          deleteOldAsset = field.data.toString() === 'true'
        }
      }

    } else {
      // Traitement d'un JSON (remplacement par un asset existant)
      const body = await readBody(event)

      newAssetId = body.newAssetId
      deleteOldAsset = body.deleteOldAsset === true
    }

    // Validation : il faut au moins un asset de remplacement ou un fichier
    if (!newAssetId && !newAssetFile) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun asset de remplacement ou fichier fourni'
      })
    }

    console.log(`📝 Paramètres replacement:`, {
      oldAssetId,
      newAssetId: newAssetId || 'nouveau fichier',
      hasFile: !!newAssetFile,
      deleteOldAsset
    })

    // Appel du service de remplacement
    const result = await assetService.replaceAsset(
      oldAssetId,
      newAssetId,
      newAssetFile,
      deleteOldAsset
    )

    console.log(`✅ Asset remplacé: ${oldAssetId} → ${result.newAsset.id}`)

    return {
      success: true,
      data: {
        oldAsset: result.oldAsset,
        newAsset: result.newAsset,
        replacementSuccessful: result.success,
        oldAssetDeleted: deleteOldAsset && result.success
      },
      message: `Asset remplacé avec succès. ${result.oldAsset.public_id} → ${result.newAsset.public_id}`
    }

  } catch (error: any) {
    console.error(`❌ Erreur remplacement asset ${oldAssetId}:`, error)

    // Si c'est une erreur avec statusCode (venant du service), la relancer telle quelle
    if (error.statusCode) {
      throw error
    }

    // Sinon, créer une erreur générique
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors du remplacement de l\'asset',
      data: {
        oldAssetId,
        error: error.message || 'Erreur inconnue'
      }
    })
  }
})