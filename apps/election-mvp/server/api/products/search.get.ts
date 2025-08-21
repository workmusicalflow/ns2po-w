/**
 * API Route: GET /api/products/search
 * Recherche de produits par terme
 */

import { airtableService } from '../../../services/airtable'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchTerm = query.q as string
  
  if (!searchTerm || searchTerm.trim().length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Terme de recherche requis (minimum 2 caractères)'
    })
  }

  try {
    const products = await airtableService.searchProducts(searchTerm.trim())
    
    return {
      success: true,
      data: products,
      count: products.length,
      query: searchTerm.trim()
    }
  } catch (error) {
    console.error('Erreur API /products/search:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la recherche de produits'
    })
  }
})