import { z } from 'zod'

// Base realisation schema for all CRUD operations
export const baseRealisationSchema = z.object({
  title: z.string()
    .min(1, 'Le titre est requis')
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères'),

  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .optional(),

  cloudinary_public_ids: z.array(z.string())
    .max(10, 'Maximum 10 images par réalisation')
    .optional()
    .default([]),

  product_ids: z.array(z.string())
    .max(50, 'Maximum 50 produits par réalisation')
    .optional()
    .default([]),

  category_ids: z.array(z.string())
    .max(10, 'Maximum 10 catégories par réalisation')
    .optional()
    .default([]),

  customization_option_ids: z.array(z.string())
    .max(20, 'Maximum 20 options de personnalisation par réalisation')
    .optional()
    .default([]),

  tags: z.array(z.string())
    .max(20, 'Maximum 20 tags par réalisation')
    .refine(
      (tags) => tags.every(tag => tag.length >= 2 && tag.length <= 30),
      'Chaque tag doit contenir entre 2 et 30 caractères'
    )
    .optional()
    .default([]),

  is_featured: z.boolean()
    .optional()
    .default(false),

  order_position: z.number()
    .int('La position d\'affichage doit être un nombre entier')
    .min(0, 'La position d\'affichage ne peut pas être négative')
    .max(9999, 'La position d\'affichage ne peut pas dépasser 9999')
    .optional()
    .default(0),

  is_active: z.boolean()
    .optional()
    .default(true),

  source: z.enum(['airtable', 'cloudinary-auto-discovery', 'turso'], {
    errorMap: () => ({ message: 'Source invalide' })
  })
    .optional()
    .default('turso'),

  cloudinary_urls: z.array(z.string().url('URL Cloudinary invalide'))
    .max(10, 'Maximum 10 URLs Cloudinary par réalisation')
    .optional(),

  cloudinary_metadata: z.record(z.any())
    .optional()
})

// Create realisation schema (for POST operations)
export const createRealisationSchema = baseRealisationSchema.extend({
  // Title is required for creation
  title: z.string()
    .min(1, 'Le titre est requis')
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
}).refine(
  (data) => {
    // If cloudinary_public_ids are provided, they should be valid
    if (data.cloudinary_public_ids && data.cloudinary_public_ids.length > 0) {
      return data.cloudinary_public_ids.every(id => id.length > 0)
    }
    return true
  },
  {
    message: 'Les IDs publics Cloudinary ne peuvent pas être vides',
    path: ['cloudinary_public_ids']
  }
)

// Update realisation schema (for PUT operations) - all fields optional except validation rules
export const updateRealisationSchema = baseRealisationSchema.partial().extend({
  // When title is provided, it should follow the same rules
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .optional()
})

// Realisation response schema (what we return from API)
export const realisationResponseSchema = baseRealisationSchema.extend({
  id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Transformed fields for client compatibility
  cloudinaryPublicIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  customizationOptionIds: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  orderPosition: z.number().optional(),
  isActive: z.boolean().optional(),
  cloudinaryUrls: z.array(z.string()).optional(),
  cloudinaryMetadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
})

// Realisation with related data schema (for detailed views)
export const realisationWithRelationsSchema = realisationResponseSchema.extend({
  // Related entities
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    reference: z.string().optional(),
    price: z.number().optional()
  })).optional(),

  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string().optional(),
    color: z.string().optional()
  })).optional(),

  // Computed fields
  images_count: z.number().optional(),
  total_products: z.number().optional()
})

// Validation for realisation business rules
export const realisationValidationRules = {
  // Validate title uniqueness (to be used in API)
  validateTitleUnique: (title: string, excludeId?: string) => {
    // This would be implemented in the API with database access
    return true
  },

  // Validate Cloudinary public IDs format
  validateCloudinaryIds: (publicIds: string[]): boolean => {
    if (!publicIds || publicIds.length === 0) return true
    return publicIds.every(id =>
      id.length > 0 &&
      /^[a-zA-Z0-9/_-]+$/.test(id) &&
      id.length <= 100
    )
  },

  // Validate tags format
  validateTags: (tags: string[]): boolean => {
    if (!tags || tags.length === 0) return true
    return tags.every(tag =>
      tag.trim().length >= 2 &&
      tag.trim().length <= 30 &&
      /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/.test(tag.trim())
    )
  },

  // Validate source compatibility
  validateSourceCompatibility: (source: string, data: any): boolean => {
    if (source === 'cloudinary-auto-discovery') {
      // Auto-discovery realisations should have cloudinary data
      return data.cloudinary_public_ids && data.cloudinary_public_ids.length > 0
    }
    return true
  }
}

// Type exports
export type CreateRealisationInput = z.infer<typeof createRealisationSchema>
export type UpdateRealisationInput = z.infer<typeof updateRealisationSchema>
export type RealisationResponse = z.infer<typeof realisationResponseSchema>
export type RealisationWithRelations = z.infer<typeof realisationWithRelationsSchema>

// Helper functions for form validation and data transformation
export const realisationHelpers = {
  // Transform server response to client format
  transformToClientFormat: (serverData: any): RealisationResponse => {
    return {
      ...serverData,
      cloudinaryPublicIds: serverData.cloudinary_public_ids || [],
      productIds: serverData.product_ids || [],
      categoryIds: serverData.category_ids || [],
      customizationOptionIds: serverData.customization_option_ids || [],
      isFeatured: Boolean(serverData.is_featured),
      orderPosition: Number(serverData.order_position),
      isActive: Boolean(serverData.is_active),
      cloudinaryUrls: serverData.cloudinary_urls || [],
      cloudinaryMetadata: serverData.cloudinary_metadata || {},
      createdAt: serverData.created_at,
      updatedAt: serverData.updated_at
    }
  },

  // Transform client input to server format
  transformToServerFormat: (clientData: CreateRealisationInput | UpdateRealisationInput) => {
    return {
      title: clientData.title,
      description: clientData.description,
      cloudinary_public_ids: clientData.cloudinary_public_ids || [],
      product_ids: clientData.product_ids || [],
      category_ids: clientData.category_ids || [],
      customization_option_ids: clientData.customization_option_ids || [],
      tags: clientData.tags || [],
      is_featured: clientData.is_featured || false,
      order_position: clientData.order_position || 0,
      is_active: clientData.is_active !== undefined ? clientData.is_active : true,
      source: clientData.source || 'turso',
      cloudinary_urls: clientData.cloudinary_urls || [],
      cloudinary_metadata: clientData.cloudinary_metadata || {}
    }
  },

  // Generate default order position
  getDefaultOrderPosition: (): number => {
    return Date.now() % 9999
  },

  // Clean and validate tags
  cleanTags: (tags: string[]): string[] => {
    if (!tags) return []
    return tags
      .map(tag => tag.trim())
      .filter(tag => tag.length >= 2 && tag.length <= 30)
      .filter((tag, index, array) => array.indexOf(tag) === index) // Remove duplicates
      .slice(0, 20) // Limit to 20 tags
  },

  // Validate Cloudinary URL format
  isValidCloudinaryUrl: (url: string): boolean => {
    return /^https:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/.+/.test(url)
  }
}