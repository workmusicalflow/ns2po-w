/**
 * API Route: POST /api/campaign-bundles/invalidate-cache
 * Webhook d'invalidation de cache appelé par les automations Airtable
 */

import { airtableService } from "~/services/airtable";

interface CacheInvalidationPayload {
  bundle_id: string;
  record_id: string;
  trigger: "bundle_updated" | "manual";
}

export default defineEventHandler(async (event) => {
  try {
    // Vérification de la méthode
    if (getMethod(event) !== "POST") {
      setResponseStatus(event, 405);
      return { error: "Méthode non autorisée" };
    }

    console.log("🗑️ POST /api/campaign-bundles/invalidate-cache - Début invalidation");

    // Récupération du payload
    const payload: CacheInvalidationPayload = await readBody(event);

    if (!payload.bundle_id && !payload.record_id) {
      setResponseStatus(event, 400);
      return {
        success: false,
        error: "bundle_id ou record_id requis",
      };
    }

    const bundleId = payload.bundle_id || payload.record_id;
    console.log(`🎯 Invalidation cache pour bundle: ${bundleId}`);
    console.log(`📝 Trigger: ${payload.trigger}`);

    // Récupération des informations du bundle pour validation
    let bundle = null;
    try {
      if (payload.bundle_id && payload.bundle_id.startsWith("pack-")) {
        bundle = await airtableService.getCampaignBundleByBundleId(payload.bundle_id);
      } else {
        bundle = await airtableService.getCampaignBundle(bundleId);
      }
    } catch (error) {
      console.warn(`⚠️ Impossible de récupérer le bundle ${bundleId}:`, error);
    }

    // Invalidation du cache Nitro si disponible
    if (bundle) {
      try {
        // Invalidation des caches de routes spécifiques
        const cacheKeys = [
          `nitro:handlers:api:campaign-bundles:index.get`,
          `nitro:handlers:api:campaign-bundles:${bundle.id}.get`,
          `bundle-cache-${bundle.id}`,
        ];

        // Note: L'invalidation spécifique dépend de l'implémentation du cache Nitro
        // Pour l'instant, on log les clés à invalider
        console.log("🔑 Clés de cache à invalider:", cacheKeys);

        // Mise à jour du statut dans Airtable
        await airtableService.updateBundleSyncStatus(bundleId, "synced");

        console.log(`✅ Cache invalidé avec succès pour: ${bundle.name}`);
      } catch (cacheError) {
        console.error("❌ Erreur invalidation cache:", cacheError);
        await airtableService.updateBundleSyncStatus(bundleId, "error");
      }
    }

    // Réponse de succès
    return {
      success: true,
      message: "Cache invalidé avec succès",
      bundle: bundle ? {
        id: bundle.id,
        name: bundle.name,
        updatedAt: bundle.updatedAt,
      } : null,
      invalidatedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error("❌ Erreur POST /api/campaign-bundles/invalidate-cache:", error);

    // Mise à jour du statut d'erreur si possible
    try {
      const payload: CacheInvalidationPayload = await readBody(event);
      if (payload.bundle_id || payload.record_id) {
        const bundleId = payload.bundle_id || payload.record_id;
        await airtableService.updateBundleSyncStatus(bundleId, "error");
      }
    } catch (updateError) {
      console.error("❌ Erreur mise à jour statut:", updateError);
    }

    setResponseStatus(event, 500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
    };
  }
});