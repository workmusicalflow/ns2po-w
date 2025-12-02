/**
 * Types pour la gestion unifiée des médias produit
 * Remplace la structure fragmentée image_url + gallery_urls
 */

export type MediaStatus = 'pending' | 'uploading' | 'uploaded' | 'error'

export interface ProductMedia {
  /** ID unique (public_id Cloudinary ou ID temporaire pour preview) */
  id: string
  /** URL de l'image (Cloudinary ou blob local pour preview) */
  url: string
  /** Indique si c'est l'image principale du produit */
  isMain: boolean
  /** Statut de l'upload */
  status: MediaStatus
  /** Fichier local pour preview avant upload */
  file?: File
  /** Message d'erreur si status === 'error' */
  errorMessage?: string
  /** Progression de l'upload (0-100) */
  uploadProgress?: number
}

export interface ProductMediaState {
  /** Liste unifiée des médias (principale + galerie) */
  items: ProductMedia[]
  /** Indique si un upload est en cours */
  isUploading: boolean
  /** Erreur globale */
  error: string | null
}

/**
 * Convertit la structure legacy (image_url + gallery_urls) vers ProductMedia[]
 *
 * ✅ Protection anti-duplication: utilise un Set pour garantir unicité des URLs
 * Même si l'API renvoie des données incohérentes, cette fonction ne créera jamais de doublons
 */
export function legacyToProductMedia(imageUrl?: string, galleryUrls?: string[]): ProductMedia[] {
  const items: ProductMedia[] = []
  const addedUrls = new Set<string>() // Protection anti-duplication

  // Image principale
  if (imageUrl) {
    items.push({
      id: extractPublicId(imageUrl) || `main-${Date.now()}`,
      url: imageUrl,
      isMain: true,
      status: 'uploaded'
    })
    addedUrls.add(imageUrl) // Marquer comme ajoutée
  }

  // Images galerie (uniquement si pas déjà ajoutée)
  if (galleryUrls && galleryUrls.length > 0) {
    galleryUrls.forEach((url, index) => {
      // ✅ Protection: ignorer si URL déjà présente (évite doublons visuels)
      if (!addedUrls.has(url)) {
        items.push({
          id: extractPublicId(url) || `gallery-${index}-${Date.now()}`,
          url,
          isMain: false,
          status: 'uploaded'
        })
        addedUrls.add(url)
      }
    })
  }

  return items
}

/**
 * Convertit ProductMedia[] vers la structure legacy pour l'API
 */
export function productMediaToLegacy(items: ProductMedia[]): { imageUrl: string; galleryUrls: string[] } {
  const mainImage = items.find(item => item.isMain && item.status === 'uploaded')
  const galleryImages = items.filter(item => !item.isMain && item.status === 'uploaded')

  return {
    imageUrl: mainImage?.url || '',
    galleryUrls: galleryImages.map(item => item.url)
  }
}

/**
 * Extrait le public_id d'une URL Cloudinary
 */
function extractPublicId(url: string): string | null {
  if (!url || !url.includes('cloudinary.com')) return null

  try {
    // Format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

/**
 * Génère un ID temporaire pour les previews
 */
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
