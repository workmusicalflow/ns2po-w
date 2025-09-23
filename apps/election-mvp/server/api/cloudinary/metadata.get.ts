/**
 * API Route: GET /api/cloudinary/metadata
 * Récupère les métadonnées détaillées d'une image Cloudinary
 */

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const publicId = query.public_id as string

    if (!publicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Public ID requis'
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

    // Récupérer les informations détaillées de l'image
    const resource = await cloudinary.api.resource(publicId, {
      image_metadata: true,
      colors: true,
      faces: true,
      quality_analysis: true,
      accessibility_analysis: true,
      cinemagraph_analysis: true
    })

    // Structurer les métadonnées pour le frontend
    const metadata = {
      publicId: resource.public_id,
      alt: resource.context?.alt || '',
      caption: resource.context?.caption || '',
      tags: resource.tags || [],
      context: resource.context || {},
      customCoordinates: resource.coordinates?.custom?.[0] || null,
      transformations: {
        quality: 'auto:good',
        format: 'auto',
        crop: 'fill',
        gravity: 'center',
        effects: []
      },
      productAssociations: resource.context?.productAssociations ?
        JSON.parse(resource.context.productAssociations) : []
    }

    const imageInfo = {
      publicId: resource.public_id,
      url: resource.url,
      secureUrl: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      resourceType: resource.resource_type,
      createdAt: resource.created_at,
      bytes: resource.bytes,
      metadata,
      // Informations supplémentaires utiles
      colors: resource.colors || [],
      faces: resource.faces || [],
      qualityAnalysis: resource.quality_analysis || null,
      accessibilityAnalysis: resource.accessibility_analysis || null
    }

    // Headers de cache
    setHeader(event, "Cache-Control", "public, max-age=300") // 5 minutes

    return {
      success: true,
      data: imageInfo,
      performance: {
        responseTime: Date.now() - startTime
      }
    }

  } catch (error) {
    console.error("❌ Erreur récupération métadonnées Cloudinary:", error)

    // Gestion des erreurs spécifiques Cloudinary
    if (error.http_code === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Image non trouvée'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Erreur serveur'
    })
  }
})