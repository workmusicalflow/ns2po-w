/**
 * Types pour le formulaire admin RealisationFormModal.vue / RealisationForm.vue
 * Pattern Adapter: Sépare clairement format API vs format Formulaire
 *
 * Centralise les 3 définitions Realisation dupliquées dans:
 * - pages/admin/realisations/index.vue (ligne 602)
 * - components/admin/RealisationFormModal.vue (ligne 333)
 * - components/admin/RealisationForm.vue (ligne 399)
 *
 * @see schemas/realisation.ts pour la validation Zod
 */

// ===== Types Source de Référence =====

export type RealisationSource = 'airtable' | 'cloudinary-auto-discovery' | 'turso'

// ===== Format API (ce que retourne GET /api/realisations/:id) =====

/**
 * Structure de la réalisation telle que retournée par l'API
 * Utilise camelCase (transformé depuis snake_case par l'API)
 */
export interface RealisationFromApi {
  id: string
  title: string
  description?: string

  // Relations (arrays)
  cloudinaryPublicIds: string[]
  productIds: string[]
  categoryIds: string[]
  customizationOptionIds: string[]
  tags: string[]

  // Booléens
  isFeatured: boolean
  isActive: boolean

  // Numérique
  orderPosition: number

  // Source
  source: RealisationSource

  // Métadonnées Cloudinary optionnelles
  cloudinaryUrls?: string[]
  cloudinaryMetadata?: Record<string, unknown>

  // Timestamps
  createdAt: string
  updatedAt: string
}

// ===== Format Formulaire (ce qu'utilise le composant Vue) =====

/**
 * Structure des données dans le formulaire RealisationFormModal.vue
 * Utilise snake_case pour correspondre aux noms des inputs
 */
export interface RealisationFormData {
  title: string
  description: string

  // Relations (arrays de strings)
  cloudinary_public_ids: string[]
  product_ids: string[]
  category_ids: string[]
  customization_option_ids: string[]
  tags: string[]

  // Booléens
  is_featured: boolean
  is_active: boolean

  // Numérique
  order_position: number

  // Source
  source: RealisationSource

  // Métadonnées Cloudinary optionnelles
  cloudinary_urls: string[]
  cloudinary_metadata: Record<string, unknown>
}

// ===== Types pour les entités liées =====

export interface RealisationCategory {
  id: string
  name: string
  slug?: string
}

export interface RealisationProduct {
  id: string
  name: string
  reference?: string
  category?: string
}

export interface RealisationCustomizationOption {
  id: string
  name: string
}

// ===== Valeurs par défaut =====

/**
 * Valeurs par défaut pour une nouvelle réalisation
 */
export function getDefaultRealisationFormData(): RealisationFormData {
  return {
    title: '',
    description: '',
    cloudinary_public_ids: [],
    product_ids: [],
    category_ids: [],
    customization_option_ids: [],
    tags: [],
    is_featured: false,
    is_active: true,
    order_position: 0,
    source: 'turso',
    cloudinary_urls: [],
    cloudinary_metadata: {}
  }
}

// ===== Type Guards =====

/**
 * Vérifie si un objet est une réalisation API valide
 */
export function isRealisationFromApi(obj: unknown): obj is RealisationFromApi {
  if (!obj || typeof obj !== 'object') return false

  const r = obj as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.title === 'string' &&
    Array.isArray(r.cloudinaryPublicIds)
  )
}

/**
 * Vérifie si un objet est des données de formulaire valides
 */
export function isRealisationFormData(obj: unknown): obj is RealisationFormData {
  if (!obj || typeof obj !== 'object') return false

  const r = obj as Record<string, unknown>
  return (
    typeof r.title === 'string' &&
    Array.isArray(r.cloudinary_public_ids)
  )
}
