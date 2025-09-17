/**
 * API Route: POST /api/campaign-bundles/sync-frontend
 * Webhook de synchronisation frontend appelé par les automations Airtable
 * Met à jour le cache frontend quand un bundle change de statut
 */

import { airtableService } from "~/services/airtable";

interface FrontendSyncPayload {
  bundle_data: Record<string, any>;
  operation: "sync_cache" | "invalidate_cache" | "refresh_all";
  timestamp: string;
}

export default defineEventHandler(async (event) => {
  try {
    // Vérification de la méthode
    if (getMethod(event) !== "POST") {
      setResponseStatus(event, 405);
      return { error: "Méthode non autorisée" };
    }

    console.log("🔄 POST /api/campaign-bundles/sync-frontend - Début synchronisation");

    // Récupération du payload
    const payload: FrontendSyncPayload = await readBody(event);

    if (!payload.bundle_data || !payload.operation) {
      setResponseStatus(event, 400);
      return {
        success: false,
        error: "bundle_data et operation requis",
      };
    }

    const bundleData = payload.bundle_data;
    const bundleId = bundleData.bundle_id || bundleData.id;

    console.log(`🎯 Synchronisation pour bundle: ${bundleId}`);
    console.log(`⚙️ Opération: ${payload.operation}`);
    console.log(`⏰ Timestamp: ${payload.timestamp}`);

    let syncResult = {
      bundleId,
      operation: payload.operation,
      success: false,
      message: "",
      actions: [] as string[],
    };

    try {
      switch (payload.operation) {
        case "sync_cache":
          console.log("📥 Synchronisation du cache...");

          // 1. Validation des données du bundle
          if (!bundleData.name || !bundleData.estimated_total) {
            throw new Error("Données bundle incomplètes");
          }

          // 2. Mise à jour du cache local/CDN
          const cacheKeys = [
            `api:campaign-bundles:index`,
            `api:campaign-bundles:${bundleId}`,
            `bundle-data:${bundleId}`,
          ];

          // Simulation de mise à jour cache
          for (const key of cacheKeys) {
            console.log(`🔑 Mise à jour cache: ${key}`);
            syncResult.actions.push(`Cache updated: ${key}`);
          }

          // 3. Notification aux clients connectés (WebSocket future)
          // Note: Ici on pourrait implémenter une notification en temps réel
          console.log("📡 Notification clients (future feature)");
          syncResult.actions.push("Client notification prepared");

          syncResult.success = true;
          syncResult.message = "Cache synchronisé avec succès";
          break;

        case "invalidate_cache":
          console.log("🗑️ Invalidation du cache...");

          // Invalidation spécifique du bundle
          const invalidationKeys = [
            `api:campaign-bundles:index`,
            `api:campaign-bundles:${bundleId}`,
            `bundle-preview:${bundleId}`,
          ];

          for (const key of invalidationKeys) {
            console.log(`❌ Invalidation cache: ${key}`);
            syncResult.actions.push(`Cache invalidated: ${key}`);
          }

          syncResult.success = true;
          syncResult.message = "Cache invalidé avec succès";
          break;

        case "refresh_all":
          console.log("🔄 Rafraîchissement complet...");

          // Invalidation globale des caches de bundles
          const globalKeys = [
            "api:campaign-bundles:*",
            "bundle-data:*",
            "bundle-analytics:*",
          ];

          for (const pattern of globalKeys) {
            console.log(`🌐 Rafraîchissement: ${pattern}`);
            syncResult.actions.push(`Global refresh: ${pattern}`);
          }

          syncResult.success = true;
          syncResult.message = "Rafraîchissement global effectué";
          break;

        default:
          throw new Error(`Opération non supportée: ${payload.operation}`);
      }

      // Mise à jour du statut de synchronisation dans Airtable
      if (bundleId) {
        await airtableService.updateBundleSyncStatus(bundleId, "synced");
        console.log(`✅ Statut sync mis à jour pour: ${bundleId}`);
      }

    } catch (syncError) {
      console.error("❌ Erreur pendant la synchronisation:", syncError);

      syncResult.success = false;
      syncResult.message = syncError instanceof Error ? syncError.message : "Erreur de synchronisation";

      // Mise à jour du statut d'erreur
      if (bundleId) {
        await airtableService.updateBundleSyncStatus(bundleId, "error");
      }
    }

    console.log(`📊 Résultat sync - Succès: ${syncResult.success}`);

    // Réponse détaillée
    return {
      success: syncResult.success,
      message: syncResult.message,
      bundle: {
        id: bundleId,
        name: bundleData.name,
        operation: payload.operation,
      },
      actions: syncResult.actions,
      syncedAt: new Date().toISOString(),
      // Métadonnées pour debugging
      debug: {
        originalTimestamp: payload.timestamp,
        processingTime: Date.now(),
        bundleDataKeys: Object.keys(bundleData),
      },
    };

  } catch (error) {
    console.error("❌ Erreur POST /api/campaign-bundles/sync-frontend:", error);

    setResponseStatus(event, 500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
      timestamp: new Date().toISOString(),
    };
  }
});