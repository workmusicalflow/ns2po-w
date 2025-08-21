/**
 * API Route: GET /api/products/[id]/prices
 * Récupère les règles de prix pour un produit
 */

import { airtableService } from '../../../../services/airtable'

export default defineEventHandler(async (event) => {
  const productId = getRouterParam(event, 'id')
  
  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID du produit requis'
    })
  }

  try {
    const priceRules = await airtableService.getPriceRules(productId)
    
    return {
      success: true,
      data: priceRules,
      count: priceRules.length,
      productId
    }
  } catch (error) {
    console.error(`Erreur API /products/${productId}/prices:`, error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des règles de prix'
    })
  }
})