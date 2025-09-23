/**
 * API Route: PUT /api/cloudinary/metadata
 * Met à jour les métadonnées d'une image Cloudinary
 */

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { public_id: publicId, metadata } = body

    if (!publicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Public ID requis'
      })
    }

    if (!metadata || typeof metadata !== 'object') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Métadonnées requises'
      })
    }

    // Import dynamique de cloudinary pour éviter les erreurs SSR
    const { v2: cloudinary } = await import('cloudinary')

    // Configuration Cloudinary
    cloudinary.config({
      cloud_name: useRuntimeConfig().cloudinaryCloudName,
      api_key: useRuntimeConfig().cloudinaryApiKey,
      api_secret: useRuntimeConfig().cloudinaryApiSecret,
    })

    const startTime = Date.now()

    // Préparer les données de contexte pour Cloudinary
    const contextData = {}

    // Ajouter les métadonnées textuelles au contexte
    if (metadata.alt) contextData.alt = metadata.alt
    if (metadata.caption) contextData.caption = metadata.caption
    if (metadata.lastUpdated) contextData.lastUpdated = metadata.lastUpdated
    if (metadata.updatedBy) contextData.updatedBy = metadata.updatedBy

    // Sérialiser les associations produits pour le contexte
    if (metadata.productAssociations) {
      contextData.productAssociations = JSON.stringify(metadata.productAssociations)
    }

    // Construire les paramètres de mise à jour
    const updateParams = {
      public_id: publicId,
      resource_type: 'image'
    }

    // Ajouter le contexte si présent
    if (Object.keys(contextData).length > 0) {
      updateParams.context = contextData
    }

    // Ajouter les tags si présents
    if (metadata.tags && Array.isArray(metadata.tags)) {
      updateParams.tags = metadata.tags.join(',')
    }

    // Mettre à jour les métadonnées via Cloudinary Admin API
    const result = await cloudinary.api.update(publicId, updateParams)

    // Si des coordonnées personnalisées sont fournies, les appliquer
    if (metadata.customCoordinates) {
      const { x, y, width, height } = metadata.customCoordinates
      await cloudinary.api.update(publicId, {
        coordinates: [[x, y, width, height]]
      })
    }

    // Récupérer les informations mises à jour
    const updatedResource = await cloudinary.api.resource(publicId, {
      image_metadata: true,
      colors: true
    })

    // Structurer la réponse
    const updatedMetadata = {
      publicId: updatedResource.public_id,
      alt: updatedResource.context?.alt || '',
      caption: updatedResource.context?.caption || '',
      tags: updatedResource.tags || [],
      context: updatedResource.context || {},
      customCoordinates: updatedResource.coordinates?.custom?.[0] || null,
      transformations: {
        quality: 'auto:good',
        format: 'auto',
        crop: 'fill',
        gravity: 'center',
        effects: []
      },
      productAssociations: updatedResource.context?.productAssociations ?
        JSON.parse(updatedResource.context.productAssociations) : []
    }

    const imageInfo = {
      publicId: updatedResource.public_id,
      url: updatedResource.url,
      secureUrl: updatedResource.secure_url,
      width: updatedResource.width,
      height: updatedResource.height,
      format: updatedResource.format,
      resourceType: updatedResource.resource_type,
      createdAt: updatedResource.created_at,
      bytes: updatedResource.bytes,
      metadata: updatedMetadata
    }

    return {
      success: true,
      data: imageInfo,
      performance: {
        responseTime: Date.now() - startTime
      }
    }

  } catch (error) {
    console.error("❌ Erreur mise à jour métadonnées Cloudinary:", error)

    // Gestion des erreurs spécifiques Cloudinary
    if (error.http_code === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image non trouvée'
      })
    }

    if (error.http_code === 400) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Données invalides: ' + (error.message || 'Erreur de validation')
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Erreur serveur'
    })
  }
})