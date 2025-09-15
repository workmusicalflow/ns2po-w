/**
 * API Route: GET /api/campaign-bundles
 * Récupère tous les campaign bundles actifs depuis Airtable
 */

import { setHeader, setResponseStatus } from 'h3';
import { airtableService } from "~/services/airtable";
import type { BundleApiResponse } from "@ns2po/types";

export default defineEventHandler(async (event): Promise<BundleApiResponse> => {
  try {
    // Log de la requête
    console.log("📦 GET /api/campaign-bundles - Début récupération");

    // Récupération des query parameters
    const query = getQuery(event);
    const audience = query.audience as string | undefined;
    const featured = query.featured === "true";

    let bundles;

    // Filtrage par audience si spécifié
    if (audience && audience !== "all") {
      console.log(`🎯 Filtrage par audience: ${audience}`);
      bundles = await airtableService.getCampaignBundlesByAudience(audience);
    } else {
      console.log("📋 Récupération de tous les bundles");
      bundles = await airtableService.getCampaignBundles();
    }

    // Filtrage des bundles featured si demandé
    if (featured) {
      bundles = bundles.filter(bundle => bundle.isFeatured);
      console.log(`⭐ Filtrage featured - ${bundles.length} bundles trouvés`);
    }

    console.log(`✅ Récupération réussie: ${bundles.length} campaign bundles`);

    // Cache headers pour optimiser les performances
    setHeader(event, "Cache-Control", "public, max-age=900"); // 15 minutes
    setHeader(event, "CDN-Cache-Control", "public, max-age=1800"); // 30 minutes sur CDN

    return {
      success: true,
      data: bundles,
      pagination: {
        page: 1,
        limit: bundles.length,
        total: bundles.length,
        hasMore: false,
      },
    };
  } catch (error) {
    console.error("❌ Erreur GET /api/campaign-bundles:", error);

    // Status error approprié
    setResponseStatus(event, 500);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
    };
  }
});