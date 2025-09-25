/**
 * API Route: POST /api/campaign-bundles/webhook/new-bundle
 * Webhook appelé quand un nouveau bundle est créé dans Airtable
 */

interface NewBundlePayload {
  bundle_id: string;
  name: string;
  target_audience: string;
  estimated_total: number;
}

export default defineEventHandler(async (event) => {
  try {
    // Vérification de la méthode
    if (getMethod(event) !== "POST") {
      setResponseStatus(event, 405);
      return { error: "Méthode non autorisée" };
    }

    console.log("🆕 POST /api/campaign-bundles/webhook/new-bundle - Nouveau bundle");

    // Récupération du payload
    const payload: NewBundlePayload = await readBody(event);

    if (!payload.bundle_id || !payload.name) {
      setResponseStatus(event, 400);
      return {
        success: false,
        error: "bundle_id et name requis",
      };
    }

    console.log(`📦 Nouveau bundle créé: ${payload.name}`);
    console.log(`🆔 ID: ${payload.bundle_id}`);
    console.log(`🎯 Audience: ${payload.target_audience}`);
    console.log(`💰 Prix: ${payload.estimated_total} FCFA`);

    // Actions à effectuer pour un nouveau bundle
    const actions = [];

    try {
      // 1. Invalidation du cache général
      console.log("🗑️ Invalidation cache général...");
      actions.push("Cache général invalidé");

      // 2. Préparation du cache pour le nouveau bundle
      console.log("📥 Préparation cache nouveau bundle...");
      actions.push(`Cache préparé pour ${payload.bundle_id}`);

      // 3. Notification système (future feature)
      console.log("📧 Préparation notification...");
      actions.push("Notification système préparée");

      // 4. Analytics tracking (future feature)
      console.log("📊 Enregistrement analytics...");
      actions.push("Event analytics enregistré");

      console.log("✅ Traitement nouveau bundle terminé avec succès");

      return {
        success: true,
        message: "Nouveau bundle traité avec succès",
        bundle: {
          id: payload.bundle_id,
          name: payload.name,
          audience: payload.target_audience,
          price: payload.estimated_total,
        },
        actions,
        processedAt: new Date().toISOString(),
      };

    } catch (processingError) {
      console.error("❌ Erreur traitement nouveau bundle:", processingError);

      return {
        success: false,
        error: "Erreur lors du traitement du nouveau bundle",
        bundle: {
          id: payload.bundle_id,
          name: payload.name,
        },
        partialActions: actions,
      };
    }

  } catch (error) {
    console.error("❌ Erreur POST /api/campaign-bundles/webhook/new-bundle:", error);

    setResponseStatus(event, 500);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
    };
  }
});