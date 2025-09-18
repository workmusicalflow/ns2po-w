import { z } from 'zod'

// Base category schema for all CRUD operations
export const baseCategorySchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets et underscores'),

  slug: z.string()
    .min(1, 'Le slug est requis')
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),

  description: z.string()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),

  parent_id: z.string()
    .min(1)
    .optional()
    .or(z.literal('')),

  icon: z.string()
    .max(50, 'L\'icône ne peut pas dépasser 50 caractères')
    .optional(),

  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'La couleur doit être un code hexadécimal valide (#RRGGBB)')
    .optional(),

  sort_order: z.number()
    .int('L\'ordre de tri doit être un nombre entier')
    .min(0, 'L\'ordre de tri ne peut pas être négatif')
    .max(9999, 'L\'ordre de tri ne peut pas dépasser 9999')
    .optional(),

  is_active: z.boolean()
    .optional()
})

// Create category schema (for POST operations)
export const createCategorySchema = baseCategorySchema.extend({
  // All fields from base, no additional requirements for creation
})

// Update category schema (for PUT operations) - all fields optional except validation rules
export const updateCategorySchema = baseCategorySchema.partial().extend({
  // When name is provided, it should follow the same rules
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/, 'Le nom ne peut contenir que des lettres, chiffres, espaces, tirets et underscores')
    .optional(),

  // When slug is provided, it should follow the same rules
  slug: z.string()
    .min(2, 'Le slug doit contenir au moins 2 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets')
    .optional()
}).refine(
  (data) => {
    // If updating parent_id, ensure it's not the same as the category ID
    // This validation would need to be implemented in the API with access to the category ID
    return true
  },
  {
    message: 'Une catégorie ne peut pas être son propre parent',
    path: ['parent_id']
  }
)

// Category response schema (what we return from API)
export const categoryResponseSchema = baseCategorySchema.extend({
  id: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Computed fields
  subcategories_count: z.number().optional(),
  products_count: z.number().optional(),
  parent_name: z.string().optional()
})

// Category tree node schema (for hierarchical display)
export const categoryTreeNodeSchema = categoryResponseSchema.extend({
  children: z.array(z.lazy(() => categoryTreeNodeSchema)).optional(),
  level: z.number().int().min(0).optional()
})

// Validation for category relationships
export const categoryRelationshipValidation = {
  // Validate that parent_id exists and is not circular
  validateParentId: (parentId: string, categoryId?: string) => {
    if (parentId === categoryId) {
      throw new Error('Une catégorie ne peut pas être son propre parent')
    }
    return true
  },

  // Validate slug uniqueness (to be used in API)
  validateSlugUnique: (slug: string, excludeId?: string) => {
    // This would be implemented in the API with database access
    return true
  }
}

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CategoryResponse = z.infer<typeof categoryResponseSchema>
export type CategoryTreeNode = z.infer<typeof categoryTreeNodeSchema>

// Helper functions for form validation
export const categoryValidationHelpers = {
  // Generate slug from name
  generateSlug: (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  },

  // Validate color format
  isValidColor: (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color)
  },

  // Default sort order for new categories
  getDefaultSortOrder: (): number => {
    return 0
  }
}