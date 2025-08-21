/**
 * Utilitaires Cloudinary pour la gestion des images
 * Transformations et optimisations d'images
 */

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  bytes: number
  version: number
  url: string
}

export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'limit' | 'mfit' | 'mpad'
  quality?: 'auto' | number
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif'
  gravity?: 'center' | 'face' | 'faces' | 'auto'
  background?: string
  overlay?: string
  effect?: string
}

/**
 * Génère une URL transformée Cloudinary
 */
export function buildCloudinaryUrl(
  publicId: string, 
  options: CloudinaryTransformOptions = {}
): string {
  const config = useRuntimeConfig()
  const cloudName = config.public.cloudinaryCloudName || config.cloudinaryCloudName
  
  if (!cloudName) {
    console.error('Cloudinary Cloud Name non configuré')
    return ''
  }

  const transformations: string[] = []

  // Dimensions
  if (options.width || options.height) {
    let transform = ''
    if (options.width) transform += `w_${options.width}`
    if (options.height) transform += `,h_${options.height}`
    if (options.crop) transform += `,c_${options.crop}`
    transformations.push(transform)
  }

  // Qualité et format
  const qualityFormat = []
  if (options.quality) qualityFormat.push(`q_${options.quality}`)
  if (options.format) qualityFormat.push(`f_${options.format}`)
  if (qualityFormat.length) transformations.push(qualityFormat.join(','))

  // Autres effets
  if (options.gravity) transformations.push(`g_${options.gravity}`)
  if (options.background) transformations.push(`b_${options.background}`)
  if (options.effect) transformations.push(`e_${options.effect}`)
  if (options.overlay) transformations.push(`l_${options.overlay}`)

  const transformString = transformations.length 
    ? `/${transformations.join('/')}/` 
    : '/'

  return `https://res.cloudinary.com/${cloudName}/image/upload${transformString}${publicId}`
}

/**
 * Options prédéfinies pour différents cas d'usage
 */
export const cloudinaryPresets = {
  // Thumbnail pour galerie
  thumbnail: {
    width: 300,
    height: 300,
    crop: 'fill' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
    gravity: 'center' as const
  },

  // Prévisualisation produit principale
  productMain: {
    width: 800,
    height: 600,
    crop: 'fit' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
    background: 'white'
  },

  // Logo upload (optimisé pour personnalisation)
  logoUpload: {
    width: 500,
    height: 500,
    crop: 'fit' as const,
    quality: 90,
    format: 'png' as const,
    background: 'transparent'
  },

  // Galerie responsive
  gallery: {
    width: 600,
    height: 400,
    crop: 'fill' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
    gravity: 'auto' as const
  },

  // Avatar utilisateur
  avatar: {
    width: 150,
    height: 150,
    crop: 'fill' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
    gravity: 'face' as const
  }
} as const

/**
 * Construit l'URL avec un preset prédéfini
 */
export function getCloudinaryPresetUrl(
  publicId: string, 
  preset: keyof typeof cloudinaryPresets
): string {
  return buildCloudinaryUrl(publicId, cloudinaryPresets[preset])
}

/**
 * Valide si un fichier est une image supportée
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  const maxSize = 10 * 1024 * 1024 // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize
}

/**
 * Formate la taille de fichier pour affichage
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Extrait le public_id depuis une URL Cloudinary
 */
export function extractPublicIdFromUrl(url: string): string | null {
  // Pattern pour extraire le public_id d'une URL Cloudinary
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.(?:jpg|jpeg|png|webp|gif|svg)$/i)
  return match?.[1] || null
}