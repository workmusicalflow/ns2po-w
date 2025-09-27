/**
 * API Réalisations: Turso + Auto-discovery Cloudinary
 * Performance optimisée après suppression d'Airtable
 */

import type { HybridRealisation } from "@ns2po/types";
import { getDatabase } from "../../utils/database";
import {
  getCloudinaryCreativeImages,
  cloudinaryImageToHybridRealisation,
} from "../../utils/cloudinary-discovery";

/**
 * Récupère réalisations depuis Turso
 */
async function fetchTursoRealisations(): Promise<HybridRealisation[]> {
  const db = getDatabase();
  if (!db) {
    console.warn("⚠️ Turso database unavailable - returning empty array");
    return [];
  }

  console.log("🎯 Récupération Turso réalisations...");

  const result = await db.execute({
    sql: `
      SELECT
        id, title, description, cloudinary_public_ids, product_ids, category_ids,
        customization_option_ids, tags, is_featured, order_position, is_active,
        source, created_at, updated_at
      FROM realisations
      WHERE is_active = 1
      ORDER BY
        CASE WHEN source = 'turso' THEN 0 ELSE 1 END,
        order_position ASC,
        title ASC
    `,
    args: []
  });

  const realisations = result.rows.map((row: any) => ({
    id: String(row.id),
    title: row.title,
    description: row.description || undefined,
    cloudinaryPublicIds: JSON.parse(row.cloudinary_public_ids || '[]'),
    productIds: JSON.parse(row.product_ids || '[]'),
    categoryIds: JSON.parse(row.category_ids || '[]'),
    customizationOptionIds: JSON.parse(row.customization_option_ids || '[]'),
    tags: JSON.parse(row.tags || '[]'),
    isFeatured: Boolean(row.is_featured),
    orderPosition: row.order_position,
    isActive: Boolean(row.is_active),
    source: row.source as 'turso' | 'cloudinary',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));

  console.log(`✅ Turso: ${realisations.length} réalisations récupérées`);
  return realisations;
}

/**
 * Génère réalisations auto-discovery Cloudinary
 */
async function generateAutoDiscoveryRealisations(existingPublicIds: Set<string>): Promise<HybridRealisation[]> {
  try {
    console.log("🔍 Auto-discovery Cloudinary...");

    const cloudinaryImages = await getCloudinaryCreativeImages();

    // Récupérer les public_ids blacklistés
    const db = getDatabase();
    if (!db) {
      console.warn("⚠️ Database non disponible pour auto-discovery blacklist");
      return cloudinaryImages.map((image: any) => cloudinaryImageToHybridRealisation(image));
    }

    const blacklistResult = await db.execute('SELECT public_id FROM realisation_blacklist');
    const blacklistedPublicIds = new Set(blacklistResult.rows.map(row => row.public_id));

    console.log(`🚫 ${blacklistedPublicIds.size} réalisations blacklistées`);

    // Transformer le public_id original pour comparaison blacklist
    const autoDiscoveryImages = cloudinaryImages.filter((image: any) => {
      const transformedId = `cloudinary_${image.public_id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      return !existingPublicIds.has(transformedId) && !blacklistedPublicIds.has(transformedId);
    });

    const autoDiscoveryRealisations = autoDiscoveryImages.map((image: any) =>
      cloudinaryImageToHybridRealisation(image)
    );

    console.log(`🎨 Auto-discovery: ${autoDiscoveryRealisations.length} nouvelles réalisations`);
    return autoDiscoveryRealisations;

  } catch (error) {
    console.warn("⚠️ Auto-discovery Cloudinary échoué:", error);
    return [];
  }
}

/**
 * Handler principal API
 */
export default defineEventHandler(async (event): Promise<HybridRealisation[]> => {
  const startTime = Date.now();

  try {
    console.log("🚀 API Réalisations Turso + Cloudinary");
    console.log("🔍 Debug env vars:", {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "✅ Set" : "❌ Missing",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing",
    });

    // 1. Récupérer réalisations Turso
    const tursoRealisations = await fetchTursoRealisations();

    // 2. Extraire les public_ids existants
    const existingPublicIds = new Set(
      tursoRealisations.flatMap(r =>
        r.cloudinaryPublicIds?.map(publicId =>
          typeof publicId === 'string' ? publicId : publicId.id
        ) || []
      )
    );

    // 3. Générer réalisations auto-discovery
    const autoDiscoveryRealisations = await generateAutoDiscoveryRealisations(existingPublicIds);

    // 4. Fusionner toutes les sources
    const allRealisations = [
      ...tursoRealisations,
      ...autoDiscoveryRealisations
    ];

    // 5. Trier par ordre et titre
    const sortedRealisations = allRealisations.sort((a, b) => {
      if (a.source === 'turso' && b.source !== 'turso') return -1;
      if (a.source !== 'turso' && b.source === 'turso') return 1;

      const orderDiff = (a.orderPosition || 999) - (b.orderPosition || 999);
      if (orderDiff !== 0) return orderDiff;

      return a.title.localeCompare(b.title);
    });

    const executionTime = Date.now() - startTime;
    console.log(`🎯 API: ${sortedRealisations.length} réalisations totales`);
    console.log(`  - ${tursoRealisations.length} Turso`);
    console.log(`  - ${autoDiscoveryRealisations.length} auto-discovery`);
    console.log(`⏱️ Temps d'exécution: ${executionTime}ms`);

    // Headers de cache pour optimisation
    setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=86400');
    setHeader(event, 'X-Source', 'turso-cloudinary');
    setHeader(event, 'X-Execution-Time', `${executionTime}ms`);

    return sortedRealisations;

  } catch (error: any) {
    console.error("❌ API Réalisations erreur:", error);

    // En cas d'erreur, retourner tableau vide plutôt que de crasher
    setHeader(event, 'X-Source', 'error-fallback');
    return [];
  }
});