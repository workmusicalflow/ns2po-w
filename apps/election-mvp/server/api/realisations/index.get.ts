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
import {
  getCachedCloudinaryRealisations,
  setCachedCloudinaryRealisations,
} from "../../utils/cloudinaryCache";
import { handleApiError } from "../../utils/errorHandler";

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
        id, title, description, cloudinary_public_ids, cloudinary_urls, product_ids, category_ids,
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
    cloudinaryUrls: row.cloudinary_urls ? JSON.parse(row.cloudinary_urls) : undefined,
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
 * ⚡ CACHE: Utilise cache Nitro (TTL 1h) pour éviter N+1 Problem
 *
 * 🔧 FIX Architecture (2025-12-02):
 * - Bug #1: Comparaison formats incompatibles → Maintenant compare public_id BRUT
 * - Bug #2: Perte traçabilité après modification → Utilise promoted_cloudinary_assets
 */
async function generateAutoDiscoveryRealisations(existingPublicIds: Set<string>): Promise<HybridRealisation[]> {
  try {
    console.log("🔍 Auto-discovery Cloudinary...");

    // ✅ CACHE: Vérifier cache avant appel API Cloudinary
    let cloudinaryImages = await getCachedCloudinaryRealisations();

    if (!cloudinaryImages) {
      // MISS: Appel API Cloudinary + mise en cache
      cloudinaryImages = await getCloudinaryCreativeImages();
      await setCachedCloudinaryRealisations(cloudinaryImages);
    }

    const db = getDatabase();
    if (!db) {
      console.warn("⚠️ Database non disponible pour auto-discovery filtering");
      return cloudinaryImages.map((image: any) => cloudinaryImageToHybridRealisation(image));
    }

    // 1. Récupérer les public_ids blacklistés (supprimés par l'admin)
    const blacklistResult = await db.execute('SELECT public_id FROM realisation_blacklist');
    const blacklistedPublicIds = new Set(blacklistResult.rows.map(row => row.public_id));
    console.log(`🚫 ${blacklistedPublicIds.size} réalisations blacklistées`);

    // 2. Récupérer les public_ids promus (déjà transformés en réalisations Turso)
    // Cette table persiste même si l'image de la réalisation est modifiée plus tard
    const promotedResult = await db.execute('SELECT public_id FROM promoted_cloudinary_assets');
    const promotedPublicIds = new Set(promotedResult.rows.map(row => row.public_id));
    console.log(`📦 ${promotedPublicIds.size} réalisations promues`);

    // 3. Filtrer les images auto-discovery
    // ✅ FIX Bug #1: Comparer le public_id BRUT (pas l'ID transformé)
    const autoDiscoveryImages = cloudinaryImages.filter((image: any) => {
      const rawPublicId = image.public_id; // ex: "ns2po/gallery/creative/banderole-001"
      const transformedId = `cloudinary_${rawPublicId.replace(/[^a-zA-Z0-9]/g, "_")}`;

      // Exclure si:
      // a) Le public_id brut est déjà dans une réalisation Turso (existingPublicIds)
      // b) Le public_id brut a été promu (même si l'image a changé depuis)
      // c) L'ID transformé est blacklisté (suppression admin)
      const isInTurso = existingPublicIds.has(rawPublicId);
      const wasPromoted = promotedPublicIds.has(rawPublicId);
      const isBlacklisted = blacklistedPublicIds.has(transformedId);

      return !isInTurso && !wasPromoted && !isBlacklisted;
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
    // ✅ ERROR HANDLING UNIFIÉ: Throw error structuré (au lieu de return [] silencieux)
    // Pattern validé: Anti-pattern 5 corrigé (Audit Architecture /realisations)
    throw handleApiError(error, event);
  }
});