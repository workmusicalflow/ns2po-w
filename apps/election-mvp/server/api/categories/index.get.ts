/**
 * API Route: GET /api/categories
 * Récupère toutes les catégories depuis Airtable
 */

import { airtableService } from '../../../services/airtable'

export default defineEventHandler(async (_event) => {
  try {
    const categories = await airtableService.getCategories()
    
    return {
      success: true,
      data: categories,
      count: categories.length
    }
  } catch (error) {
    console.error('Erreur API /categories:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des catégories'
    })
  }
})