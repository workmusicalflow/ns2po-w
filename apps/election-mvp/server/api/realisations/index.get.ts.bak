/**
 * API Réalisations Hybride: Turso-first avec fallback Airtable + Auto-discovery Cloudinary
 * Performance: 5-10x amélioration via Turso local vs API Airtable externe
 */

import type { HybridRealisation, AirtableRealisation } from "@ns2po/types";
import { getDatabase } from "../../utils/database";
import {
  getCloudinaryCreativeImages,
  cloudinaryImageToHybridRealisation,
} from "../../utils/cloudinary-discovery";

// Configuration Airtable (fallback seulement)
const AIRTABLE_BASE_ID = "apprQLdnVwlbfnioT";
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

/**
 * Récupère réalisations depuis Turso (priorité 1)
 */
async function fetchTursoRealisations(): Promise<HybridRealisation[]> {
  const db = getDatabase();
  if (!db) {
    throw new Error("Turso database unavailable");
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
    order: Number(row.order_position) || undefined,
    isActive: Boolean(row.is_active),
    source: row.source as "turso" | "airtable",
    // Générer URLs Cloudinary optimisées
    cloudinaryUrls: JSON.parse(row.cloudinary_public_ids || '[]').map((publicId: string) => {
      const fullPath = publicId.includes("/") && !publicId.includes(".")
        ? `${publicId}.jpg`
        : publicId;
      return `https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/${fullPath}`;
    })
  })) as HybridRealisation[];

  console.log(`✅ Turso: ${realisations.length} réalisations récupérées`);
  return realisations;
}

/**
 * Récupère réalisations depuis Airtable (fallback)
 */
async function fetchAirtableData<T>(tableName: string, view?: string): Promise<T[]> {
  if (!AIRTABLE_API_KEY) {
    throw new Error("AIRTABLE_API_KEY manquante");
  }

  const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`);
  if (view) url.searchParams.set("view", view);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Erreur Airtable ${tableName}: ${response.statusText}`,
    });
  }

  const data = await response.json();
  return data.records || [];
}

/**
 * Transforme réalisation Airtable en HybridRealisation
 */
function transformAirtableToHybrid(airtableRealisation: AirtableRealisation): HybridRealisation {
  const fields = airtableRealisation.fields as any;

  // Parse CloudinaryPublicIds
  let cloudinaryIds: string[] = [];
  if (fields.CloudinaryPublicIds) {
    if (typeof fields.CloudinaryPublicIds === "string") {
      cloudinaryIds = fields.CloudinaryPublicIds.split(",")
        .map((id: string) => id.trim())
        .filter((id: string) => id);
    } else if (Array.isArray(fields.CloudinaryPublicIds)) {
      cloudinaryIds = fields.CloudinaryPublicIds;
    }
  }

  // Générer URLs optimisées
  const cloudinaryUrls = cloudinaryIds.map((publicId) => {
    const fullPath = publicId.includes("/") && !publicId.includes(".")
      ? `${publicId}.jpg`
      : publicId;
    return `https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/${fullPath}`;
  });

  return {
    id: airtableRealisation.id,
    title: fields.Title || "Sans titre",
    description: fields.Description,
    cloudinaryPublicIds: cloudinaryIds,
    productIds: fields.Products || [],
    categoryIds: fields.Categories || [],
    customizationOptionIds: fields.CustomizationOptions || [],
    tags: fields.Tags || [],
    isFeatured: fields.IsFeatured || false,
    order: fields.DisplayOrder,
    isActive: fields.IsActive !== false,
    source: "airtable" as const,
    cloudinaryUrls,
  };
}

/**
 * Récupère réalisations Airtable (fallback)
 */
async function fetchAirtableRealisations(): Promise<HybridRealisation[]> {
  console.log("🔄 Fallback Airtable réalisations...");

  const airtableRealisations = await fetchAirtableData<AirtableRealisation>("Realisations");

  const realisations = airtableRealisations
    .map(transformAirtableToHybrid)
    .filter((r: HybridRealisation) => r.isActive);

  console.log(`✅ Airtable: ${realisations.length} réalisations actives`);
  return realisations;
}

/**
 * Génère réalisations auto-discovery Cloudinary
 */
async function generateAutoDiscoveryRealisations(existingPublicIds: Set<string>): Promise<HybridRealisation[]> {
  try {
    console.log("🔍 Auto-discovery Cloudinary...");

    const cloudinaryImages = await getCloudinaryCreativeImages();

    const autoDiscoveryImages = cloudinaryImages.filter(
      (image: any) => !existingPublicIds.has(image.public_id)
    );

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
 * Handler principal API hybride
 */
export default defineEventHandler(async (event): Promise<HybridRealisation[]> => {
  const startTime = Date.now();

  try {
    console.log("🚀 API Réalisations TURSO-FIRST hybride");
    console.log("🔍 Debug env vars:", {
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? "✅ Set" : "❌ Missing",
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? "✅ Set" : "❌ Missing",
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Set" : "❌ Missing",
    });

    let realisations: HybridRealisation[] = [];
    let source = 'unknown';

    // 1. PRIORITÉ: Turso Database (performance optimale)
    try {
      realisations = await fetchTursoRealisations();
      source = 'turso';
      console.log(`⚡ Turso success: ${realisations.length} réalisations`);

    } catch (tursoError) {
      console.warn("⚠️ Turso failed, trying Airtable fallback...", tursoError);

      // 2. FALLBACK: Airtable (service dégradé)
      try {
        realisations = await fetchAirtableRealisations();
        source = 'airtable';
        console.log(`🔄 Airtable fallback: ${realisations.length} réalisations`);

      } catch (airtableError) {
        console.error("❌ Airtable also failed:", airtableError);

        // 3. FALLBACK FINAL: Réalisations vides avec auto-discovery seulement
        realisations = [];
        source = 'auto-discovery-only';
        console.log("🛡️ Service dégradé: auto-discovery seulement");
      }
    }

    // 4. Complément: Auto-discovery Cloudinary (toujours exécuté)
    const existingPublicIds = new Set(
      realisations.flatMap((r: HybridRealisation) => r.cloudinaryPublicIds)
    );

    const autoDiscoveryRealisations = await generateAutoDiscoveryRealisations(existingPublicIds);

    // 5. Fusion et tri final
    const allRealisations = [...realisations, ...autoDiscoveryRealisations].sort((a, b) => {
      // Priorité: Turso > Airtable > Auto-discovery
      const sourceOrder = { 'turso': 0, 'airtable': 1, 'cloudinary-auto-discovery': 2 };
      const aPriority = sourceOrder[a.source as keyof typeof sourceOrder] ?? 3;
      const bPriority = sourceOrder[b.source as keyof typeof sourceOrder] ?? 3;

      if (aPriority !== bPriority) return aPriority - bPriority;

      // Tri secondaire par ordre puis titre
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.title.localeCompare(b.title);
    });

    const duration = Date.now() - startTime;
    console.log(`🎯 API Hybride: ${allRealisations.length} réalisations totales (${realisations.length} ${source} + ${autoDiscoveryRealisations.length} auto-discovery) en ${duration}ms`);

    // Cache headers optimisés selon la source
    if (source === 'turso') {
      setHeader(event, "Cache-Control", "public, max-age=1800"); // 30min pour Turso
    } else if (source === 'airtable') {
      setHeader(event, "Cache-Control", "public, max-age=600");  // 10min pour Airtable
    } else {
      setHeader(event, "Cache-Control", "public, max-age=300");  // 5min pour service dégradé
    }

    // Response avec métadonnées performance
    const response = {
      success: true,
      data: allRealisations,
      count: allRealisations.length,
      source,
      duration,
      performance: {
        improvement: source === 'turso' ? '5-10x faster' : 'degraded mode',
        cacheStrategy: source === 'turso' ? '30min' : source === 'airtable' ? '10min' : '5min'
      }
    };

    if (source !== 'turso') {
      response.warning = 'Service dégradé - performance réduite';
    }

    return allRealisations;

  } catch (error) {
    console.error("❌ Erreur critique API Réalisations:", error);

    // Fallback ultime: Auto-discovery seulement
    try {
      const emergencyRealisations = await generateAutoDiscoveryRealisations(new Set());
      console.log(`🚨 Fallback ultime: ${emergencyRealisations.length} réalisations auto-discovery`);

      setHeader(event, "Cache-Control", "public, max-age=60"); // Cache très court
      return emergencyRealisations;

    } catch (finalError) {
      console.error("❌ Fallback ultime échoué:", finalError);
      throw createError({
        statusCode: 500,
        statusMessage: "Service temporairement indisponible",
      });
    }
  }
});