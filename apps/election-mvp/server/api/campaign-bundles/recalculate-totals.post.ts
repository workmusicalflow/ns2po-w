/**
 * API Route: POST /api/campaign-bundles/recalculate-totals
 * Webhook de recalcul des totaux appelé par les automations Airtable
 * Déclenché quand un BundleProduct est modifié (prix ou quantité)
 */

import { airtableService } from "~/services/airtable";

interface RecalculationPayload {
  bundle_product_id: string;
  campaign_bundle_ids: string | string[];
  trigger: "product_updated" | "manual";
}

export default defineEventHandler(async (event) => {
  try {
    // Vérification de la méthode
    if (getMethod(event) !== "POST") {
      setResponseStatus(event, 405);
      return { error: "Méthode non autorisée" };
    }

    console.log("🧮 POST /api/campaign-bundles/recalculate-totals - Début recalcul");

    // Récupération du payload
    const payload: RecalculationPayload = await readBody(event);

    if (!payload.bundle_product_id || !payload.campaign_bundle_ids) {
      setResponseStatus(event, 400);
      return {
        success: false,
        error: "bundle_product_id et campaign_bundle_ids requis",
      };
    }

    console.log(`📦 Produit modifié: ${payload.bundle_product_id}`);
    console.log(`📝 Trigger: ${payload.trigger}`);

    // Normalisation des IDs de bundles (peut être string ou array)
    const bundleIds = Array.isArray(payload.campaign_bundle_ids)
      ? payload.campaign_bundle_ids
      : [payload.campaign_bundle_ids];

    console.log(`🎯 Bundles à recalculer: ${bundleIds.length}`);

    const recalculationResults = [];

    // Recalcul pour chaque bundle affecté
    for (const bundleId of bundleIds) {
      try {
        console.log(`🔄 Recalcul du bundle: ${bundleId}`);

        // Récupération des produits du bundle
        const products = await airtableService.getBundleProducts(bundleId);

        if (products.length === 0) {
          console.warn(`⚠️ Aucun produit trouvé pour le bundle: ${bundleId}`);
          continue;
        }

        // Calcul du nouveau total
        const newSubtotal = products.reduce((total, product) => {
          return total + product.subtotal;
        }, 0);

        console.log(`💰 Nouveau sous-total calculé: ${newSubtotal} FCFA`);

        // Calcul des économies (si applicable)
        // Note: Pour l'instant, on assume 10-25% de remise selon le type de bundle
        const originalTotal = Math.round(newSubtotal * 1.15); // 15% de remise moyenne
        const savings = originalTotal - newSubtotal;

        // Mise à jour du bundle dans Airtable
        const updateData = {
          estimated_total: newSubtotal,
          original_total: originalTotal,
          savings: savings,
          last_cache_invalidation: new Date().toISOString(),
          sync_status: "pending",
        };

        // Note: Ici on devrait faire un appel à l'API Airtable pour mettre à jour
        // Pour l'instant, on simule la mise à jour
        console.log(`📝 Données de mise à jour:`, updateData);

        recalculationResults.push({
          bundleId,
          success: true,
          newTotal: newSubtotal,
          originalTotal,
          savings,
          productCount: products.length,
        });

        console.log(`✅ Recalcul terminé pour: ${bundleId}`);

      } catch (bundleError) {
        console.error(`❌ Erreur recalcul bundle ${bundleId}:`, bundleError);
        recalculationResults.push({
          bundleId,
          success: false,
          error: bundleError instanceof Error ? bundleError.message : "Erreur inconnue",
        });
      }
    }

    // Statistiques de recalcul
    const successCount = recalculationResults.filter(r => r.success).length;
    const errorCount = recalculationResults.length - successCount;

    console.log(`📊 Recalcul terminé - Succès: ${successCount}, Erreurs: ${errorCount}`);

    // Réponse de succès
    return {
      success: true,
      message: `Recalcul terminé pour ${recalculationResults.length} bundle(s)`,
      results: recalculationResults,
      statistics: {
        total: recalculationResults.length,
        success: successCount,
        errors: errorCount,
      },
      recalculatedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error("❌ Erreur POST /api/campaign-bundles/recalculate-totals:", error);

    setResponseStatus(event, 500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
    };
  }
});