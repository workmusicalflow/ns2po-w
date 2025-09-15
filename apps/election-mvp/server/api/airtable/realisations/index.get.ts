/**
 * API Route: GET /api/airtable/realisations
 * Récupère toutes les réalisations depuis Airtable via MCP
 */

import type { Realisation } from "@ns2po/types";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { isFeatured, productId, categoryId } = query;

    // Note: Dans un vrai projet, on utiliserait le MCP Airtable server-side
    // const baseId = 'apprQLdnVwlbfnioT'
    // const tableId = 'tblRealisations' // À créer dans Airtable
    
    // Pour l'instant, on simule les données avec les 23 images que nous avons
    const mockRealisations: Realisation[] = [
      {
        id: 'rec1_tshirt_campagne',
        title: 'T-shirt Campagne "Ensemble pour Demain"',
        description: 'T-shirt personnalisé avec logo de campagne et slogan inspirant, impression haute qualité en sérigraphie',
        cloudinaryPublicIds: ['ns2po-elections-mvp/realisations/tshirt-campagne-ensemble'],
        productIds: ['rec8FSiYTD1XRsuBJ'], // T-shirt Campagne Politique
        categoryIds: ['textile'],
        customizationOptionIds: ['serigraphie-2-couleurs', 'position-chest'],
        tags: ['campagne', 'politique', 'slogan', 'personnalisé', 'bleu'],
        isFeatured: true,
        order: 1,
        isActive: true
      },
      {
        id: 'rec2_casquette_logo',
        title: 'Casquette Brodée Logo Candidat',
        description: 'Casquette de campagne avec broderie 3D du logo officiel, finition premium',
        cloudinaryPublicIds: ['ns2po-elections-mvp/realisations/casquette-brodee-logo'],
        productIds: ['receldxvyo1c5l8cI'], // Casquette de Campagne
        categoryIds: ['textile'],
        customizationOptionIds: ['broderie-3d', 'position-front'],
        tags: ['casquette', 'broderie', 'logo', 'premium', 'rouge'],
        isFeatured: true,
        order: 2,
        isActive: true
      },
      {
        id: 'rec3_polo_meeting',
        title: 'Polo Staff Meeting Électoral',
        description: 'Polo professionnel pour équipe de campagne avec logo discret et nom du candidat',
        cloudinaryPublicIds: ['ns2po-elections-mvp/realisations/polo-staff-meeting'],
        productIds: ['rec8FSiYTD1XRsuBJ'], // Réutilise T-shirt pour MVP
        categoryIds: ['textile'],
        customizationOptionIds: ['broderie-discrete', 'position-chest'],
        tags: ['polo', 'staff', 'professionnel', 'meeting', 'blanc'],
        isFeatured: true,
        order: 3,
        isActive: true
      },
      {
        id: 'rec4_affiche_campagne',
        title: 'Affiche de Campagne Format A2',
        description: 'Affiche de campagne électorale avec design moderne et message percutant',
        cloudinaryPublicIds: ['ns2po-elections-mvp/realisations/affiche-campagne-a2'],
        productIds: ['recSsJa9HIJohfbwp'], // Réutilise pour MVP
        categoryIds: ['communication'],
        customizationOptionIds: ['impression-haute-qualite', 'format-a2'],
        tags: ['affiche', 'communication', 'visuel', 'a2', 'multicolore'],
        isFeatured: false,
        order: 4,
        isActive: true
      },
      {
        id: 'rec5_banderole_meeting',
        title: 'Banderole Meeting Public',
        description: 'Banderole grand format pour meeting public, résistante aux intempéries',
        cloudinaryPublicIds: ['ns2po-elections-mvp/realisations/banderole-meeting-public'],
        productIds: ['recSsJa9HIJohfbwp'], // Réutilise pour MVP
        categoryIds: ['communication'],
        customizationOptionIds: ['impression-grand-format', 'materiau-resistant'],
        tags: ['banderole', 'meeting', 'exterieur', 'grand-format', 'jaune'],
        isFeatured: false,
        order: 5,
        isActive: true
      },
      {
        id: 'rec6_pins_campagne',
        title: 'Pin\'s Collector Campagne',
        description: 'Pin\'s métallique émaillé avec logo de campagne, édition limitée',
        cloudinaryPublicIds: ['ns2po-elections-mvp/realisations/pins-collector-campagne'],
        productIds: ['recSsJa9HIJohfbwp'], // Réutilise pour MVP
        categoryIds: ['gadget'],
        customizationOptionIds: ['email-couleur', 'finition-metal'],
        tags: ['pins', 'collector', 'metal', 'emaille', 'bleu'],
        isFeatured: true,
        order: 6,
        isActive: true
      }
    ];

    // Filtrage selon les paramètres de requête
    let filteredRealisations = mockRealisations;

    if (isFeatured === 'true') {
      filteredRealisations = filteredRealisations.filter(r => r.isFeatured);
    }

    if (productId) {
      filteredRealisations = filteredRealisations.filter(r => 
        r.productIds.includes(productId as string)
      );
    }

    if (categoryId) {
      filteredRealisations = filteredRealisations.filter(r => 
        r.categoryIds.includes(categoryId as string)
      );
    }

    // Tri par ordre puis par titre
    filteredRealisations.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order;
      }
      return a.title.localeCompare(b.title);
    });
    
    return {
      success: true,
      data: filteredRealisations,
      count: filteredRealisations.length,
      filters: {
        isFeatured: isFeatured === 'true',
        productId: productId as string,
        categoryId: categoryId as string
      }
    };
  } catch (error) {
    console.error('Erreur API /airtable/realisations:', error);
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des réalisations'
    });
  }
});