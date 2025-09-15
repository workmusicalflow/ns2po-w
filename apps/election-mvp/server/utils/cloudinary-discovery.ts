import { v2 as cloudinary } from "cloudinary";
import type { HybridRealisation } from "@ns2po/types";

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Parse le nom de fichier pour extraire les métadonnées
 */
export function parseCreativeFilename(filename: string) {
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|svg)$/i, "");
  const extension =
    filename.match(/\.(jpg|jpeg|png|webp|svg)$/i)?.[1]?.toLowerCase() || "jpg";

  // Patterns de reconnaissance
  const patterns = [
    /^([a-zA-Z-]+)-(\\d+)$/, // banderole-001
    /^([a-zA-Z-]+)-([a-zA-Z0-9-]+)$/, // banderole-rouge
    /^([a-zA-Z]+)(\\d+)$/, // banderole001
    /^([a-zA-Z-]+)$/, // banderole
  ];

  let type = null;
  let identifier = null;
  let keywords: string[] = [];

  // Test des patterns
  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      type = match[1].toLowerCase();
      identifier = match[2] || null;

      // Mots-clés depuis le type
      if (type.includes("-")) {
        keywords = type.split("-");
        type = keywords[0];
        keywords = keywords.slice(1);
      }
      break;
    }
  }

  // Fallback si aucun pattern
  if (!type) {
    type = nameWithoutExt.toLowerCase();
  }

  return {
    type,
    identifier,
    keywords,
    extension,
    originalFilename: filename,
  };
}

/**
 * Génère un titre intelligent basé sur le parsing
 */
export function generateSmartTitle(filename: string): string {
  const parsed = parseCreativeFilename(filename);

  // Mapping des types vers des titres français
  const typeTranslations: Record<string, string> = {
    banderole: "Banderole",
    tshirt: "T-Shirt",
    polo: "Polo",
    casquette: "Casquette",
    foulard: "Foulard",
    visiere: "Visière",
    gilet: "Gilet",
    casque: "Casque",
    affiche: "Affiche",
    flyer: "Flyer",
    drapeau: "Drapeau",
    calendrier: "Calendrier",
    pins: "Pins",
    badge: "Badge",
    stylo: "Stylo",
    mug: "Mug",
    cle: "Porte-clés",
  };

  let title = typeTranslations[parsed.type] || parsed.type || "Création";

  if (parsed.identifier) {
    if (/^\\d+$/.test(parsed.identifier)) {
      title += ` #${parsed.identifier}`;
    } else {
      title += ` ${parsed.identifier}`;
    }
  }

  if (parsed.keywords.length > 0) {
    title += ` (${parsed.keywords.join(", ")})`;
  }

  return title;
}

/**
 * Génère des tags basés sur le type de produit
 */
export function generateTags(filename: string): string[] {
  const parsed = parseCreativeFilename(filename);
  const tags: string[] = [];

  // Mapper le type vers des tags existants dans Airtable
  const typeToTags: Record<string, string[]> = {
    banderole: ["Textile", "Campagne"],
    tshirt: ["Textile", "Vêtement"],
    polo: ["Textile", "Vêtement"],
    casquette: ["Textile", "Accessoire"],
    foulard: ["Textile", "Accessoire"],
    visiere: ["EPI", "Protection"],
    gilet: ["EPI", "Vêtement"],
    casque: ["EPI", "Protection"],
    affiche: ["Communication", "Politique"],
    flyer: ["Communication", "Politique"],
    drapeau: ["Textile", "Politique"],
    calendrier: ["Corporate", "Communication"],
    pins: ["Gadget", "Accessoire"],
    badge: ["Gadget", "Accessoire"],
    stylo: ["Gadget", "Bureautique"],
    mug: ["Gadget", "Corporate"],
  };

  // Ajouter les tags correspondants au type
  if (parsed.type && typeToTags[parsed.type]) {
    tags.push(...typeToTags[parsed.type]);
  }

  // Tags par défaut si aucun match
  if (tags.length === 0) {
    tags.push("Gadget", "Personnalisé");
  }

  return [...new Set(tags)]; // Supprimer les doublons
}

/**
 * Récupère toutes les images du dossier creative Cloudinary
 */
export async function getCloudinaryCreativeImages(): Promise<any[]> {
  try {
    const result = await cloudinary.search
      .expression("folder:ns2po/gallery/creative/*")
      .sort_by("created_at", "desc")
      .max_results(500)
      .execute();

    return result.resources.map((resource: any) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      created_at: resource.created_at,
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      filename: resource.public_id.split("/").pop(),
    }));
  } catch (error) {
    console.error("❌ Erreur lors du scan Cloudinary:", error);
    throw error;
  }
}

/**
 * Transforme une image Cloudinary en HybridRealisation
 */
export function cloudinaryImageToHybridRealisation(
  image: any
): HybridRealisation {
  const filename = image.filename || image.public_id.split("/").pop();

  return {
    id: `cloudinary_${image.public_id.replace(/[^a-zA-Z0-9]/g, "_")}`,
    title: generateSmartTitle(filename),
    description: `Image découverte automatiquement depuis Cloudinary. Type: ${parseCreativeFilename(filename).type || "non spécifié"}.`,
    cloudinaryPublicIds: [image.public_id],
    cloudinaryUrls: [
      `https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/${image.public_id}`,
    ],
    productIds: [],
    categoryIds: [],
    customizationOptionIds: [],
    tags: generateTags(filename),
    isFeatured: false,
    isActive: true,
    order: undefined,
    source: "cloudinary-auto-discovery" as const,
    cloudinaryMetadata: {
      publicId: image.public_id,
      width: image.width,
      height: image.height,
      format: image.format,
      bytes: image.bytes,
      createdAt: image.created_at,
      url: image.secure_url,
    },
  };
}

/**
 * Génère les URLs Cloudinary optimisées
 */
export function generateCloudinaryUrls(
  publicIds: readonly string[]
): readonly string[] {
  return publicIds.map((publicId) => {
    // Assurer que l'extension .jpg est présente pour les images mappées
    const fullPath =
      publicId.includes("/") && !publicId.includes(".")
        ? `${publicId}.jpg`
        : publicId;

    // Transformations simplifiées et fiables - use c_fit to preserve proportions
    return `https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/${fullPath}`;
  });
}
