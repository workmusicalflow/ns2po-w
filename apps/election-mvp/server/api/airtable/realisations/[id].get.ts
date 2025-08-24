/**
 * API Route: GET /api/airtable/realisations/[id]
 * Récupère une réalisation spécifique par son ID avec ses relations enrichies
 */

import type { Realisation, Product, Category, CustomizationOption } from "@ns2po/types";

export default defineEventHandler(async (event) => {
  try {
    const realisationId = getRouterParam(event, 'id');
    
    if (!realisationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID de réalisation requis'
      });
    }

    // Récupération de la réalisation (simulated pour MVP)
    // Dans un vrai projet, on interrogerait Airtable via MCP
    const mockRealisations: Realisation[] = [
      {
        id: 'rec1_tshirt_campagne',
        title: 'T-shirt Campagne "Ensemble pour Demain"',
        description: 'T-shirt personnalisé avec logo de campagne et slogan inspirant, impression haute qualité en sérigraphie. Cette réalisation montre un excellent exemple de personnalisation textile pour campagne politique avec un design moderne et percutant.',
        cloudinaryPublicIds: ['ns2po-elections-mvp/realisations/tshirt-campagne-ensemble'],
        productIds: ['rec8FSiYTD1XRsuBJ'],
        categoryIds: ['textile'],
        customizationOptionIds: ['serigraphie-2-couleurs', 'position-chest'],
        tags: ['campagne', 'politique', 'slogan', 'personnalisé', 'bleu'],
        isFeatured: true,
        order: 1,
        isActive: true
      },
      // Ajout d'autres réalisations si nécessaire...
    ];

    const realisation = mockRealisations.find(r => r.id === realisationId);
    
    if (!realisation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Réalisation non trouvée'
      });
    }

    // Enrichissement avec les relations (simulated pour MVP)
    const enrichedRealisation: Realisation = {
      ...realisation,
      // Dans un vrai projet, on récupérerait ces données via des requêtes séparées
      products: [
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
        }
      ] as Product[],
      categories: [
        {
          id: 'textile',
          name: 'Textile',
          description: 'Vêtements et accessoires textiles personnalisables',
          slug: 'textile',
          isActive: true
        }
      ] as Category[],
      customizationOptions: [
        {
          id: 'serigraphie-2-couleurs',
          name: 'Sérigraphie 2 couleurs',
          type: 'logo',
          price: 500,
          priceModifier: 500
        },
        {
          id: 'position-chest',
          name: 'Position poitrine',
          type: 'position',
          values: ['chest', 'center']
        }
      ] as CustomizationOption[]
    };
    
    return {
      success: true,
      data: enrichedRealisation
    };
  } catch (error) {
    console.error('Erreur API /airtable/realisations/[id]:', error);
    
    if (error.statusCode) {
      throw error; // Re-throw les erreurs HTTP déjà formatées
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération de la réalisation'
    });
  }
});