/**
 * API Route: GET /api/products/[id]
 * Récupère un produit spécifique par ID
 */

import { airtableService } from '~/services/airtable'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID du produit requis'
    })
  }

  try {
    const product = await airtableService.getProduct(id)
    
    if (!product) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }
    
    return {
      success: true,
      data: product
    }
  } catch (error) {
    console.error(`Erreur API /products/${id}:`, error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération du produit'
    })
  }
})