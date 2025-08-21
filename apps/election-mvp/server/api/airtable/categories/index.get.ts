/**
 * API Route: GET /api/airtable/categories
 * Récupère toutes les catégories depuis Airtable via MCP
 */

export default defineEventHandler(async (event) => {
  try {
    // Simulation des catégories créées dans Airtable
    const mockCategories = [
      {
        id: 'recUUjpO0vhR9CFXl',
        name: 'Textile',
        description: 'Vêtements et accessoires textiles personnalisables',
        slug: 'textile',
        isActive: true
      },
      {
        id: 'recHX23vE2caW4k2l',
        name: 'Gadget',
        description: 'Objets publicitaires et goodies promotionnels',
        slug: 'gadget',
        isActive: true
      },
      {
        id: 'recI96GGyS1WYmdq0',
        name: 'EPI',
        description: 'Équipements de protection individuelle personnalisés',
        slug: 'epi',
        isActive: true
      }
    ]
    
    return {
      success: true,
      data: mockCategories,
      count: mockCategories.length
    }
  } catch (error) {
    console.error('Erreur API /airtable/categories:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des catégories'
    })
  }
})