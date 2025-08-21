/**
 * API Route: GET /api/products
 * Récupère tous les produits depuis Airtable
 */

import { airtableService } from '../../../services/airtable'

export default defineEventHandler(async (event) => {
  try {
    const products = await airtableService.getProducts()
    
    return {
      success: true,
      data: products,
      count: products.length
    }
  } catch (error) {
    console.error('Erreur API /products:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des produits'
    })
  }
})