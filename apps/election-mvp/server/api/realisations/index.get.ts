import type { HybridRealisation, AirtableRealisation } from "@ns2po/types";
import {
  getCloudinaryCreativeImages,
  cloudinaryImageToHybridRealisation,
} from "../../utils/cloudinary-discovery";

const AIRTABLE_BASE_ID = "apprQLdnVwlbfnioT";
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

async function fetchAirtableData<T>(
  tableName: string,
  view?: string
): Promise<T[]> {
  const url = new URL(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}`
  );
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

// Solution hybride : Auto-discovery Cloudinary + Curation Airtable
// Les images sont automatiquement découvertes, les métadonnées peuvent être éditées dans Airtable

function transformAirtableToHybrid(
  airtableRealisation: AirtableRealisation
): HybridRealisation {
  const fields = airtableRealisation.fields as any; // Use any to access capitalized fields

  // Parse CloudinaryPublicIds as comma-separated string if needed
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

  // Generate optimized URLs for Airtable-managed realisations
  const cloudinaryUrls = cloudinaryIds.map((publicId) => {
    const fullPath =
      publicId.includes("/") && !publicId.includes(".")
        ? `${publicId}.jpg`
        : publicId;
    // Use c_fit instead of c_fill to preserve image proportions and avoid truncation
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
    // Hybrid-specific fields
    source: "airtable" as const,
    cloudinaryUrls,
  };
}

export default defineEventHandler(
  async (event): Promise<HybridRealisation[]> => {
    try {
      console.log(
        "🔄 Hybrid API: Fusion des données Airtable et auto-discovery Cloudinary..."
      );

      // 1. Récupération parallèle des données Airtable et Cloudinary
      const [airtableRealisations, cloudinaryImages] = await Promise.all([
        fetchAirtableData<AirtableRealisation>("Realisations"),
        getCloudinaryCreativeImages(),
      ]);

      console.log(
        `📊 Hybrid API: ${airtableRealisations.length} réalisations Airtable, ${cloudinaryImages.length} images Cloudinary`
      );

      // 2. Transformation des réalisations Airtable en format hybride
      const airtableHybridRealisations = airtableRealisations
        .map(transformAirtableToHybrid)
        .filter((r: HybridRealisation) => r.isActive);

      console.log(
        `✅ Airtable: ${airtableHybridRealisations.length} réalisations actives`
      );

      // 3. Génération des réalisations auto-discovery pour les images non référencées
      const airtablePublicIds = new Set(
        airtableHybridRealisations.flatMap(
          (r: HybridRealisation) => r.cloudinaryPublicIds
        )
      );

      const autoDiscoveryImages = cloudinaryImages.filter(
        (image: any) => !airtablePublicIds.has(image.public_id)
      );

      const autoDiscoveryRealisations = autoDiscoveryImages.map((image: any) =>
        cloudinaryImageToHybridRealisation(image)
      );

      console.log(
        `🔍 Auto-discovery: ${autoDiscoveryRealisations.length} nouvelles réalisations découvertes`
      );

      // 4. Fusion et tri des réalisations
      const allRealisations = [
        ...airtableHybridRealisations,
        ...autoDiscoveryRealisations,
      ].sort((a, b) => {
        // Prioriser les réalisations Airtable (curées) puis par ordre/titre
        if (a.source === "airtable" && b.source !== "airtable") return -1;
        if (b.source === "airtable" && a.source !== "airtable") return 1;

        // Tri par ordre puis par titre pour les réalisations de même source
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return a.title.localeCompare(b.title);
      });

      console.log(
        `🎯 Hybrid API: ${allRealisations.length} réalisations totales (${airtableHybridRealisations.length} curées + ${autoDiscoveryRealisations.length} auto-discovery)`
      );

      // Mise en cache pour 15 minutes (recommandation expert)
      setHeader(event, "Cache-Control", "public, max-age=900");

      return allRealisations;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la fusion hybride des réalisations:",
        error
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          "Erreur lors de la récupération des réalisations hybrides",
      });
    }
  }
);
