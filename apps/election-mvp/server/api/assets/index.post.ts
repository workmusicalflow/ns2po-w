/**
 * API POST /api/assets - Création d'un nouvel asset
 * Utilise upload direct vers Cloudinary puis enregistrement en base
 */

import { assetService } from '../../services/assetService'
import { cloudinaryService } from '../../utils/cloudinaryService'
import type { UpdateAssetData } from '../../services/assetService'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun fichier fourni'
      })
    }

    const fileEntry = formData.find(entry => entry.name === 'file')
    if (!fileEntry || !fileEntry.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Fichier manquant'
      })
    }

    // Récupération des métadonnées optionnelles
    const getFormValue = (name: string): string | undefined => {
      const entry = formData.find(e => e.name === name)
      return entry?.data ? new TextDecoder().decode(entry.data) : undefined
    }

    const altText = getFormValue('alt_text')
    const caption = getFormValue('caption')
    const tagsString = getFormValue('tags')
    const folder = getFormValue('folder') || 'ns2po/products'

    // Parsing des tags
    let tags: string[] = []
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString)
        if (!Array.isArray(tags)) {
          tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
        }
      } catch {
        tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
      }
    }

    // Upload vers Cloudinary
    console.log('📤 Upload vers Cloudinary...')
    const cloudinaryResult = await cloudinaryService.uploadFile(fileEntry.data, {
      folder,
      tags: [...tags, 'ns2po', 'api-upload']
    })

    // Préparation des métadonnées
    const metadata: Partial<UpdateAssetData> = {}
    if (altText) metadata.alt_text = altText
    if (caption) metadata.caption = caption
    if (tags.length > 0) metadata.tags = tags

    // Création en base de données
    console.log('💾 Enregistrement en base...')
    const asset = await assetService.createAsset(cloudinaryResult, metadata)

    return {
      success: true,
      data: asset,
      message: `Asset créé avec succès: ${asset.id}`
    }

  } catch (error: any) {
    console.error('❌ Erreur API POST /api/assets:', error)

    // Si c'est une erreur avec statusCode, la retourner telle quelle
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création de l\'asset',
      data: { error: error.message }
    })
  }
})