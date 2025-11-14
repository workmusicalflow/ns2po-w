/**
 * Cloudinary URL Builder - Utility pour construire URLs optimisées
 * Génère URLs Cloudinary avec transformations (resize, quality, format)
 */

const CLOUDINARY_CLOUD_NAME = 'dsrvzogof'
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`

export interface CloudinaryTransformOptions {
  width?: number
  height?: number
  quality?: number
  crop?: 'fit' | 'fill' | 'scale' | 'crop'
  format?: 'auto' | 'jpg' | 'png' | 'webp'
}

/**
 * Construit une URL Cloudinary optimisée avec transformations
 *
 * @param publicId - Public ID Cloudinary (ex: "logo-ns2po-mailing_vzelsq", "ns2po-w/products/textile-tshirt-001")
 * @param options - Options de transformation
 * @returns URL Cloudinary complète avec transformations
 *
 * @example
 * buildCloudinaryUrl('logo-ns2po-mailing_vzelsq', { width: 200, height: 200, quality: 90 })
 * // => https://res.cloudinary.com/dsrvzogof/image/upload/c_fit,h_200,w_200,q_90,f_auto/logo-ns2po-mailing_vzelsq
 */
export function buildCloudinaryUrl(
  publicId: string,
  options: CloudinaryTransformOptions = {}
): string {
  const {
    width,
    height,
    quality = 85,
    crop = 'fit',
    format = 'auto',
  } = options

  // Construire chaîne transformations
  const transformations: string[] = []

  if (crop) transformations.push(`c_${crop}`)
  if (height) transformations.push(`h_${height}`)
  if (width) transformations.push(`w_${width}`)
  if (quality) transformations.push(`q_${quality}`)
  if (format) transformations.push(`f_${format}`)

  const transformString = transformations.join(',')

  // Nettoyer publicId (retirer version si présente)
  const cleanPublicId = publicId.replace(/^v\d+\//, '')

  return `${CLOUDINARY_BASE_URL}/${transformString}/${cleanPublicId}`
}

/**
 * Preset logo NS2PO optimisé pour PDF (200x200, PNG, 90% quality)
 */
export function getLogoUrl(): string {
  return buildCloudinaryUrl('v1759082596/logo-ns2po-mailing_vzelsq.png', {
    width: 200,
    height: 200,
    quality: 90,
    crop: 'fit',
  })
}

/**
 * Preset image produit optimisée pour PDF (400x400, JPEG, 85% quality)
 *
 * @param publicId - Public ID du produit (ex: "ns2po-w/products/textile-tshirt-001.jpg")
 */
export function getProductImageUrl(publicId: string): string {
  return buildCloudinaryUrl(publicId, {
    width: 400,
    height: 400,
    quality: 85,
    crop: 'fit',
  })
}

/**
 * Détecte si une URL est déjà une URL Cloudinary valide
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com')
}

/**
 * Extrait le public_id d'une URL Cloudinary complète
 *
 * @example
 * extractPublicId('https://res.cloudinary.com/dsrvzogof/image/upload/v1/products/tshirt-001.jpg')
 * // => 'products/tshirt-001.jpg'
 */
export function extractPublicId(cloudinaryUrl: string): string | null {
  const match = cloudinaryUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/)
  return match ? match[1] : null
}
