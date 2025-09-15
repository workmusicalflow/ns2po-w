/**
 * API Route: GET /api/airtable/products
 * Récupère tous les produits depuis Airtable via MCP
 */

export default defineEventHandler(async (_event) => {
  try {
    // Note: Dans un vrai projet, on utiliserait le MCP Airtable server-side
    // const baseId = 'apprQLdnVwlbfnioT'
    // const tableId = 'tbldm6u6qQczFxwvC'
    // Pour l'instant, on simule les données basées sur ce qu'on a créé
    const mockProducts = [
      {
        id: 'rec8FSiYTD1XRsuBJ',
        name: 'T-shirt Campagne Politique',
        description: 'T-shirt 100% coton personnalisable avec logo et slogan de campagne',
        category: 'textile',
        basePrice: 2500,
        minQuantity: 50,
        maxQuantity: 5000,
        tags: ['Politique', 'Campagne', 'Textile', 'Personnalisable'],
        isActive: true
      },
      {
        id: 'receldxvyo1c5l8cI',
        name: 'Casquette de Campagne',
        description: 'Casquette ajustable avec broderie personnalisée',
        category: 'textile',
        basePrice: 3000,
        minQuantity: 25,
        maxQuantity: 2000,
        tags: ['Politique', 'Campagne', 'Textile', 'Personnalisable'],
        isActive: true
      },
      {
        id: 'recSsJa9HIJohfbwp',
        name: 'Stylo Publicitaire',
        description: 'Stylo bille avec impression du logo de campagne',
        category: 'gadget',
        basePrice: 200,
        minQuantity: 100,
        maxQuantity: 10000,
        tags: ['Promotionnel', 'Campagne', 'Personnalisable'],
        isActive: true
      }
    ]
    
    return {
      success: true,
      data: mockProducts,
      count: mockProducts.length
    }
  } catch (error) {
    console.error('Erreur API /airtable/products:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des produits'
    })
  }
})