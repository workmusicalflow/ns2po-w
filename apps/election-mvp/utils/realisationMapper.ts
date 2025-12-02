/**
 * Realisation Mapper - Pattern Adapter
 * Transforme les données entre format API et format Formulaire
 *
 * Centralise toute la logique de transformation pour:
 * - Éviter les casts `as unknown as any`
 * - Garantir la cohérence des transformations
 * - Faciliter les tests unitaires
 * - Respecter le SRP (Single Responsibility Principle)
 *
 * @see types/admin/realisation-form.ts pour les définitions de types
 */

import type {
  RealisationFromApi,
  RealisationFormData,
  RealisationSource
} from '~/types/admin/realisation-form'
import { getDefaultRealisationFormData } from '~/types/admin/realisation-form'

/**
 * Transforme une réalisation API vers le format formulaire
 * Appelé quand on charge une réalisation existante pour édition
 *
 * API (camelCase) → Form (snake_case)
 */
export function mapRealisationApiToForm(realisation: RealisationFromApi): RealisationFormData {
  return {
    title: realisation.title || '',
    description: realisation.description || '',

    // Relations (copie des arrays)
    cloudinary_public_ids: [...(realisation.cloudinaryPublicIds || [])],
    product_ids: [...(realisation.productIds || [])],
    category_ids: [...(realisation.categoryIds || [])],
    customization_option_ids: [...(realisation.customizationOptionIds || [])],
    tags: [...(realisation.tags || [])],

    // Booléens
    is_featured: realisation.isFeatured ?? false,
    is_active: realisation.isActive ?? true,

    // Numérique
    order_position: realisation.orderPosition ?? 0,

    // Source
    source: realisation.source || 'turso',

    // Métadonnées Cloudinary
    cloudinary_urls: [...(realisation.cloudinaryUrls || [])],
    cloudinary_metadata: { ...(realisation.cloudinaryMetadata || {}) }
  }
}

/**
 * Transforme les données formulaire vers le format API
 * Appelé lors de la soumission (create/update)
 *
 * Form (snake_case) → API payload (snake_case pour le serveur)
 */
export function mapRealisationFormToApi(formData: RealisationFormData): {
  title: string
  description?: string
  cloudinary_public_ids: string[]
  product_ids: string[]
  category_ids: string[]
  customization_option_ids: string[]
  tags: string[]
  is_featured: boolean
  order_position: number
  is_active: boolean
  source: RealisationSource
  cloudinary_urls?: string[]
  cloudinary_metadata?: Record<string, unknown>
} {
  return {
    title: formData.title.trim(),
    description: formData.description?.trim() || undefined,

    // Relations (filtrer les valeurs vides)
    cloudinary_public_ids: formData.cloudinary_public_ids.filter(Boolean),
    product_ids: formData.product_ids.filter(Boolean),
    category_ids: formData.category_ids.filter(Boolean),
    customization_option_ids: formData.customization_option_ids.filter(Boolean),
    tags: formData.tags.filter((tag) => tag.trim().length > 0),

    // Booléens
    is_featured: formData.is_featured,
    is_active: formData.is_active,

    // Numérique
    order_position: formData.order_position,

    // Source
    source: formData.source,

    // Métadonnées Cloudinary (seulement si présentes)
    cloudinary_urls: formData.cloudinary_urls.length > 0
      ? formData.cloudinary_urls
      : undefined,
    cloudinary_metadata: Object.keys(formData.cloudinary_metadata).length > 0
      ? formData.cloudinary_metadata
      : undefined
  }
}

/**
 * Normalise un objet potentiellement mixte (API ou Form) vers le format Form
 * Utile pour gérer les données provenant de différentes sources
 *
 * Gère les cas où:
 * - Les données viennent de l'API (camelCase)
 * - Les données sont déjà au format form (snake_case)
 * - Les données sont un mix des deux
 */
export function normalizeToFormData(data: unknown): RealisationFormData {
  if (!data || typeof data !== 'object') {
    return getDefaultRealisationFormData()
  }

  const d = data as Record<string, unknown>

  // Détecter si c'est du format API (camelCase) ou Form (snake_case)
  const isApiFormat = 'cloudinaryPublicIds' in d || 'productIds' in d || 'isFeatured' in d

  if (isApiFormat) {
    // Format API → convertir
    return mapRealisationApiToForm(d as unknown as RealisationFromApi)
  }

  // Déjà format form ou format mixte → normaliser
  return {
    title: String(d.title || ''),
    description: String(d.description || ''),

    cloudinary_public_ids: normalizeStringArray(d.cloudinary_public_ids || d.cloudinaryPublicIds),
    product_ids: normalizeStringArray(d.product_ids || d.productIds),
    category_ids: normalizeStringArray(d.category_ids || d.categoryIds),
    customization_option_ids: normalizeStringArray(d.customization_option_ids || d.customizationOptionIds),
    tags: normalizeStringArray(d.tags),

    is_featured: Boolean(d.is_featured ?? d.isFeatured ?? false),
    is_active: Boolean(d.is_active ?? d.isActive ?? true),
    order_position: Number(d.order_position ?? d.orderPosition ?? 0),
    source: normalizeSource(d.source),

    cloudinary_urls: normalizeStringArray(d.cloudinary_urls || d.cloudinaryUrls),
    cloudinary_metadata: normalizeMetadata(d.cloudinary_metadata || d.cloudinaryMetadata)
  }
}

// ===== Helpers privés =====

function normalizeStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'string' && v.length > 0)
  }
  return []
}

function normalizeSource(value: unknown): RealisationSource {
  const validSources: RealisationSource[] = ['airtable', 'cloudinary-auto-discovery', 'turso']
  if (typeof value === 'string' && validSources.includes(value as RealisationSource)) {
    return value as RealisationSource
  }
  return 'turso'
}

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/**
 * Vérifie si les données du formulaire sont valides pour soumission
 */
export function isFormDataValid(formData: RealisationFormData): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!formData.title || formData.title.trim().length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères')
  }

  if (formData.title && formData.title.length > 200) {
    errors.push('Le titre ne peut pas dépasser 200 caractères')
  }

  if (formData.cloudinary_public_ids.length > 10) {
    errors.push('Maximum 10 images par réalisation')
  }

  if (formData.tags.length > 20) {
    errors.push('Maximum 20 tags par réalisation')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
