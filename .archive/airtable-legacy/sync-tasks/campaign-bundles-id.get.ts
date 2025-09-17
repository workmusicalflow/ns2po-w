/**
 * API Route: GET /api/campaign-bundles/[id]
 * Récupère un campaign bundle spécifique par ID ou bundle_id
 */

// Note: Airtable service removed - now using Turso-first → Static fallback architecture
import type { CampaignBundle } from "@ns2po/types";

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      console.error("❌ ID manquant dans la requête");
      setResponseStatus(event, 400);
      return {
        success: false,
        error: "ID du bundle requis",
      };
    }

    console.log(`📦 GET /api/campaign-bundles/${id} - Début récupération`);

    let bundle: CampaignBundle | null = null;

    // Essayer d'abord par bundle_id (ex: pack-argent-001)
    if (id.startsWith("pack-")) {
      console.log(`🔍 Recherche par bundle_id: ${id}`);
      bundle = await airtableService.getCampaignBundleByBundleId(id);
    }

    // Si pas trouvé, essayer par record ID Airtable
    if (!bundle) {
      console.log(`🔍 Recherche par record ID: ${id}`);
      bundle = await airtableService.getCampaignBundle(id);
    }

    if (!bundle) {
      console.log(`❌ Bundle non trouvé: ${id}`);
      setResponseStatus(event, 404);
      return {
        success: false,
        error: "Bundle non trouvé",
      };
    }

    // Vérifier si le bundle est actif
    if (!bundle.isActive) {
      console.log(`⚠️ Bundle inactif: ${id}`);
      setResponseStatus(event, 410); // Gone
      return {
        success: false,
        error: "Bundle non disponible",
      };
    }

    console.log(`✅ Bundle récupéré: ${bundle.name} (${bundle.products.length} produits)`);

    // Cache headers - cache plus long pour les bundles individuels
    setHeader(event, "Cache-Control", "public, max-age=1800"); // 30 minutes
    setHeader(event, "CDN-Cache-Control", "public, max-age=3600"); // 1 heure sur CDN
    setHeader(event, "ETag", `"bundle-${bundle.id}-${bundle.updatedAt}"`);

    return {
      success: true,
      data: bundle,
    };
  } catch (error) {
    console.error("❌ Erreur GET /api/campaign-bundles/[id]:", error);

    setResponseStatus(event, 500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
    };
  }
});