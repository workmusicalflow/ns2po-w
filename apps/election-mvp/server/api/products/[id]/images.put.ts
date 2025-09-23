/**
 * API Route: PUT /api/products/{id}/images
 * Synchronise les métadonnées d'image d'un produit avec Cloudinary
 */

import { getDatabase } from '../../../utils/database'

export default defineEventHandler(async (event) => {
  try {
    const productId = getRouterParam(event, 'id')
    const body = await readBody(event)

    const {
      publicId,
      metadata,
      isMainImage,
      cloudinaryInfo
    } = body

    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID produit requis'
      })
    }

    if (!publicId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Public ID de l\'image requis'
      })
    }

    const tursoClient = getDatabase()
    if (!tursoClient) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    const startTime = Date.now()

    // Vérifier que le produit existe
    const productCheck = await tursoClient.execute({
      sql: 'SELECT id, images FROM products WHERE id = ?',
      args: [productId]
    })

    if (productCheck.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }

    const product = productCheck.rows[0]
    let currentImages = []

    try {
      currentImages = product.images ? JSON.parse(product.images as string) : []
    } catch (error) {
      console.warn('Erreur parsing images existantes:', error)
      currentImages = []
    }

    // Vérifier si l'image existe déjà dans la liste
    const imageIndex = currentImages.findIndex((img: any) =>
      (typeof img === 'string' ? img : img.publicId) === publicId
    )

    // Préparer les métadonnées enrichies
    const enrichedImageData = {
      publicId,
      alt: metadata?.alt || '',
      caption: metadata?.caption || '',
      tags: metadata?.tags || [],
      isMainImage: isMainImage || false,
      sortOrder: imageIndex !== -1 ? imageIndex : currentImages.length,
      cloudinaryInfo: {
        url: cloudinaryInfo?.url || `https://res.cloudinary.com/dsrvzogof/image/upload/${publicId}`,
        width: cloudinaryInfo?.width || 0,
        height: cloudinaryInfo?.height || 0,
        format: cloudinaryInfo?.format || 'jpg',
        bytes: cloudinaryInfo?.bytes || 0
      },
      metadata: {
        ...metadata,
        lastSynced: new Date().toISOString(),
        syncedBy: 'admin'
      }
    }

    // Mettre à jour ou ajouter l'image
    if (imageIndex !== -1) {
      // Mettre à jour l'image existante
      currentImages[imageIndex] = enrichedImageData
    } else {
      // Ajouter la nouvelle image
      currentImages.push(enrichedImageData)
    }

    // Si c'est l'image principale, mettre à jour image_url
    let updateFields = ['images = ?']
    let updateArgs = [JSON.stringify(currentImages)]

    if (isMainImage && cloudinaryInfo?.url) {
      updateFields.push('image_url = ?')
      updateArgs.push(cloudinaryInfo.url)
    }

    updateArgs.push(productId)

    // Mettre à jour le produit dans la base
    const updateResult = await tursoClient.execute({
      sql: `UPDATE products SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: updateArgs
    })

    if (updateResult.rowsAffected === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Échec de la mise à jour'
      })
    }

    // Récupérer le produit mis à jour
    const updatedProductResult = await tursoClient.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [productId]
    })

    const updatedProduct = updatedProductResult.rows[0]

    // Structurer la réponse
    return {
      success: true,
      data: {
        productId,
        imagePublicId: publicId,
        isMainImage,
        syncedAt: new Date().toISOString(),
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          images: JSON.parse(updatedProduct.images as string || '[]'),
          image_url: updatedProduct.image_url
        }
      },
      performance: {
        responseTime: Date.now() - startTime
      }
    }

  } catch (error) {
    console.error("❌ Erreur synchronisation métadonnées produit:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Erreur serveur'
    })
  }
})