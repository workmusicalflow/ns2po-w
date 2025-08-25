/**
 * Utilitaires Cloudinary pour la gestion des images
 * Transformations et optimisations d'images
 */

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  version: number;
  url: string;
  thumbnail?: string;
  preview?: string;
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?:
    | "fill"
    | "fit"
    | "scale"
    | "crop"
    | "thumb"
    | "limit"
    | "mfit"
    | "mpad";
  quality?: "auto" | number;
  format?: "auto" | "jpg" | "png" | "webp" | "avif";
  gravity?: "center" | "face" | "faces" | "auto";
  background?: string;
  overlay?: string;
  effect?: string;
}

/**
 * Construit les transformations Cloudinary à partir des options
 */
function buildTransformations(options: CloudinaryTransformOptions): string[] {
  const transformations: string[] = [];

  // Dimensions
  const dimensionTransform = buildDimensionTransform(options);
  if (dimensionTransform) transformations.push(dimensionTransform);

  // Qualité et format
  const qualityFormatTransform = buildQualityFormatTransform(options);
  if (qualityFormatTransform) transformations.push(qualityFormatTransform);

  // Autres effets
  const effectTransforms = buildEffectTransforms(options);
  transformations.push(...effectTransforms);

  return transformations;
}

/**
 * Construit la transformation de dimensions
 */
function buildDimensionTransform(options: CloudinaryTransformOptions): string {
  if (!options.width && !options.height) return "";

  let transform = "";
  if (options.width) transform += `w_${options.width}`;
  if (options.height) transform += `,h_${options.height}`;
  if (options.crop) transform += `,c_${options.crop}`;

  return transform;
}

/**
 * Construit la transformation de qualité et format
 */
function buildQualityFormatTransform(
  options: CloudinaryTransformOptions
): string {
  const qualityFormat = [];
  if (options.quality) qualityFormat.push(`q_${options.quality}`);
  if (options.format) qualityFormat.push(`f_${options.format}`);

  return qualityFormat.length ? qualityFormat.join(",") : "";
}

/**
 * Construit les transformations d'effets
 */
function buildEffectTransforms(options: CloudinaryTransformOptions): string[] {
  const transforms = [];
  if (options.gravity) transforms.push(`g_${options.gravity}`);
  if (options.background) transforms.push(`b_${options.background}`);
  if (options.effect) transforms.push(`e_${options.effect}`);
  if (options.overlay) transforms.push(`l_${options.overlay}`);

  return transforms;
}

export function buildCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  const config = useRuntimeConfig();
  const cloudName =
    config.public.cloudinaryCloudName || config.cloudinaryCloudName;

  if (!cloudName) {
    console.error("Cloudinary Cloud Name non configuré");
    return "";
  }

  const transformations = buildTransformations(options);
  const transformString = transformations.length
    ? `/${transformations.join("/")}/`
    : "/";

  return `https://res.cloudinary.com/${cloudName}/image/upload${transformString}${publicId}`;
}

/**
 * Détecte le support des formats next-gen dans le navigateur
 */
export function detectBrowserImageSupport() {
  if (typeof window === "undefined") return { webp: false, avif: false };

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  return {
    webp: canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0,
    avif: canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0,
  };
}

/**
 * Génère une URL Cloudinary avec format next-gen optimal
 */
export function buildOptimalCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  const support = detectBrowserImageSupport();

  // Prioriser AVIF > WebP > Auto
  let format = options.format || "auto";
  if (format === "auto") {
    if (support.avif) {
      format = "avif";
    } else if (support.webp) {
      format = "webp";
    } else {
      format = "auto";
    }
  }

  return buildCloudinaryUrl(publicId, { ...options, format });
}

/**
 * Génère plusieurs URLs avec fallbacks pour <picture> element
 */
export function buildResponsiveImageSources(
  publicId: string,
  options: CloudinaryTransformOptions = {}
) {
  const baseOptions = { ...options };
  delete baseOptions.format;

  return {
    avif: buildCloudinaryUrl(publicId, { ...baseOptions, format: "avif" }),
    webp: buildCloudinaryUrl(publicId, { ...baseOptions, format: "webp" }),
    fallback: buildCloudinaryUrl(publicId, { ...baseOptions, format: "auto" }),
  };
}

/**
 * Options prédéfinies pour différents cas d'usage
 */
export const cloudinaryPresets = {
  // Thumbnail pour galerie - Format next-gen optimisé
  thumbnail: {
    width: 300,
    height: 300,
    crop: "fill" as const,
    quality: "auto" as const,
    format: "auto" as const, // Sera optimisé vers WebP/AVIF via buildOptimalCloudinaryUrl
    gravity: "center" as const,
  },

  // Prévisualisation produit principale - Format next-gen optimisé
  productMain: {
    width: 800,
    height: 600,
    crop: "fit" as const,
    quality: "auto" as const,
    format: "auto" as const, // Sera optimisé vers WebP/AVIF via buildOptimalCloudinaryUrl
    background: "white",
  },

  // Produit demo page - Format next-gen optimisé
  productDemo: {
    width: 600,
    height: 600,
    crop: "fit" as const,
    quality: "auto" as const,
    format: "auto" as const, // Sera optimisé vers WebP/AVIF via buildOptimalCloudinaryUrl
    gravity: "center" as const,
  },

  // Logo upload (optimisé pour personnalisation)
  logoUpload: {
    width: 500,
    height: 500,
    crop: "fit" as const,
    quality: 90,
    format: "png" as const,
    background: "transparent",
  },

  // Galerie responsive
  gallery: {
    width: 600,
    height: 400,
    crop: "fill" as const,
    quality: "auto" as const,
    format: "auto" as const,
    gravity: "auto" as const,
  },

  // Avatar utilisateur
  avatar: {
    width: 150,
    height: 150,
    crop: "fill" as const,
    quality: "auto" as const,
    format: "auto" as const,
    gravity: "face" as const,
  },
} as const;

/**
 * Construit l'URL avec un preset prédéfini
 */
export function getCloudinaryPresetUrl(
  publicId: string,
  preset: keyof typeof cloudinaryPresets
): string {
  return buildCloudinaryUrl(publicId, cloudinaryPresets[preset]);
}

/**
 * Valide si un fichier est une image supportée
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize;
}

/**
 * Formate la taille de fichier pour affichage
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Extrait le public_id depuis une URL Cloudinary
 */
export function extractPublicIdFromUrl(url: string): string | null {
  // Pattern pour extraire le public_id d'une URL Cloudinary
  const match = url.match(
    /\/upload\/(?:v\d+\/)?(.+)\.(?:jpg|jpeg|png|webp|gif|svg)$/i
  );
  return match?.[1] || null;
}

/**
 * Breakpoints responsive optimaux pour différents usages
 */
export const responsiveBreakpoints = {
  // Pour images de produits (aspect ratio 1:1 ou 4:3)
  product: [320, 480, 640, 800, 1024, 1280],
  // Pour images de galerie (aspect ratio 16:9)
  gallery: [320, 640, 960, 1280, 1600, 1920],
  // Pour thumbnails (petites images)
  thumbnail: [80, 120, 160, 240, 320],
  // Pour images hero (pleine largeur)
  hero: [640, 768, 1024, 1280, 1536, 1920],
  // Configuration par défaut
  default: [320, 640, 960, 1280, 1600],
} as const;

/**
 * Génère un srcset responsive avec breakpoints Cloudinary
 */
export function buildResponsiveSrcSet(
  publicId: string,
  options: CloudinaryTransformOptions = {},
  breakpoints: readonly number[] = responsiveBreakpoints.default,
  format: "webp" | "avif" | "auto" = "auto"
): string {
  const baseOptions = { ...options, format };

  return breakpoints
    .map((width) => {
      const srcOptions = { ...baseOptions, width };
      const url = buildCloudinaryUrl(publicId, srcOptions);
      return `${url} ${width}w`;
    })
    .join(", ");
}

/**
 * Génère sources multiples pour élément <picture> avec srcset
 */
export function buildResponsiveImageSourcesWithSrcSet(
  publicId: string,
  options: CloudinaryTransformOptions = {},
  breakpoints: readonly number[] = responsiveBreakpoints.default
) {
  const baseOptions = { ...options };
  delete baseOptions.format;

  return {
    avif: {
      srcset: buildResponsiveSrcSet(publicId, baseOptions, breakpoints, "avif"),
      type: "image/avif",
    },
    webp: {
      srcset: buildResponsiveSrcSet(publicId, baseOptions, breakpoints, "webp"),
      type: "image/webp",
    },
    fallback: {
      srcset: buildResponsiveSrcSet(publicId, baseOptions, breakpoints, "auto"),
      src: buildCloudinaryUrl(publicId, { ...baseOptions, format: "auto" }),
    },
  };
}

/**
 * Calcule l'attribut sizes optimal selon le contexte d'usage
 */
export function calculateOptimalSizes(
  context: "product" | "gallery" | "thumbnail" | "hero" | "custom",
  customSizes?: string
): string {
  const sizeMap = {
    // Images de produits: 100% sur mobile, 50% sur tablet, 33% sur desktop
    product: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    // Images de galerie: responsive par défaut
    gallery: "(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw",
    // Thumbnails: taille fixe petite
    thumbnail: "(max-width: 640px) 80px, (max-width: 1024px) 120px, 160px",
    // Images hero: toujours pleine largeur
    hero: "100vw",
    // Taille personnalisée
    custom: customSizes || "100vw",
  };

  return sizeMap[context];
}

/**
 * Génère une configuration complète pour image responsive
 */
export function buildCompleteResponsiveConfig(
  publicId: string,
  context: "product" | "gallery" | "thumbnail" | "hero" = "product",
  options: CloudinaryTransformOptions = {}
) {
  const breakpoints =
    responsiveBreakpoints[context] || responsiveBreakpoints.default;
  const sources = buildResponsiveImageSourcesWithSrcSet(
    publicId,
    options,
    breakpoints
  );
  const sizes = calculateOptimalSizes(context);

  return {
    sources,
    sizes,
    breakpoints,
    // Image par défaut pour les navigateurs sans support srcset
    defaultSrc: buildOptimalCloudinaryUrl(publicId, options),
  };
}
