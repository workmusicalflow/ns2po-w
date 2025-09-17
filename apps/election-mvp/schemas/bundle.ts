import { z } from 'zod'

// Bundle Product Schema
export const bundleProductSchema = z.object({
  id: z.string()
    .min(1, 'L\'ID du produit est requis'),

  name: z.string()
    .min(1, 'Le nom du produit est requis'),

  basePrice: z.number()
    .min(0, 'Le prix de base ne peut pas être négatif'),

  quantity: z.number()
    .int('La quantité doit être un nombre entier')
    .min(1, 'La quantité doit être au moins 1')
    .max(1000, 'La quantité ne peut pas dépasser 1000'),

  subtotal: z.number()
    .min(0, 'Le sous-total ne peut pas être négatif')
})

export type BundleProductInput = z.infer<typeof bundleProductSchema>

// Main Campaign Bundle Schema
export const campaignBundleSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .min(3, 'Le nom doit contenir au moins 3 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),

  description: z.string()
    .min(1, 'La description est requise')
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères'),

  targetAudience: z.enum(['local', 'regional', 'national', 'universal'], {
    errorMap: () => ({ message: 'Audience cible invalide' })
  }),

  budgetRange: z.enum(['starter', 'medium', 'premium', 'enterprise'], {
    errorMap: () => ({ message: 'Gamme de budget invalide' })
  }),

  products: z.array(bundleProductSchema)
    .min(1, 'Au moins un produit est requis')
    .max(20, 'Un bundle ne peut pas contenir plus de 20 produits'),

  estimatedTotal: z.number()
    .min(0, 'Le prix total ne peut pas être négatif')
    .max(10000000, 'Le prix total ne peut pas dépasser 10 000 000 XOF'),

  originalTotal: z.number()
    .min(0, 'Le prix original ne peut pas être négatif')
    .max(10000000, 'Le prix original ne peut pas dépasser 10 000 000 XOF')
    .optional(),

  savings: z.number()
    .min(0, 'Les économies ne peuvent pas être négatives')
    .optional(),

  popularity: z.number()
    .int('La popularité doit être un nombre entier')
    .min(0, 'La popularité doit être au moins 0')
    .max(10, 'La popularité ne peut pas dépasser 10')
    .default(5),

  isActive: z.boolean()
    .default(true),

  isFeatured: z.boolean()
    .optional()
    .default(false),

  tags: z.array(z.string())
    .optional()
    .default([])
    .refine(
      (tags) => !tags || tags.every(tag => tag.length <= 50),
      { message: 'Chaque tag ne peut pas dépasser 50 caractères' }
    )
    .refine(
      (tags) => !tags || tags.length <= 10,
      { message: 'Un bundle ne peut pas avoir plus de 10 tags' }
    )
})

export type CampaignBundleInput = z.infer<typeof campaignBundleSchema>

// Schema for bundle updates (all fields optional except ID)
export const campaignBundleUpdateSchema = campaignBundleSchema.partial().extend({
  id: z.string().min(1, 'L\'ID est requis')
})

export type CampaignBundleUpdateInput = z.infer<typeof campaignBundleUpdateSchema>

// Schema for bundle filters
export const bundleFiltersSchema = z.object({
  search: z.string().optional(),
  targetAudience: z.enum(['local', 'regional', 'national', 'universal']).optional(),
  budgetRange: z.enum(['starter', 'medium', 'premium', 'enterprise']).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minProducts: z.number().int().min(0).optional(),
  maxProducts: z.number().int().min(0).optional(),
  minPopularity: z.number().min(0).max(10).optional(),
  maxPopularity: z.number().min(0).max(10).optional(),
  sort_by: z.enum(['name', 'estimatedTotal', 'popularity', 'created_at', 'updated_at']).optional().default('updated_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20)
})

export type BundleFilters = z.infer<typeof bundleFiltersSchema>

// Bundle customization schema
export const bundleCustomizationSchema = z.object({
  originalBundleId: z.string().min(1, 'L\'ID du bundle original est requis'),

  modifiedProducts: z.array(bundleProductSchema).optional().default([]),

  addedProducts: z.array(bundleProductSchema).optional().default([]),

  removedProductIds: z.array(z.string()).optional().default([]),

  totalAdjustment: z.number()
    .min(-1000000, 'L\'ajustement ne peut pas être inférieur à -1 000 000 XOF')
    .max(1000000, 'L\'ajustement ne peut pas dépasser 1 000 000 XOF')
    .default(0),

  customizationReason: z.string()
    .max(500, 'La raison ne peut pas dépasser 500 caractères')
    .optional()
})

export type BundleCustomizationInput = z.infer<typeof bundleCustomizationSchema>

// Bundle quote request schema
export const bundleQuoteRequestSchema = z.object({
  customerInfo: z.object({
    name: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(8, 'Le téléphone doit contenir au moins 8 caractères'),
    organization: z.string().optional(),
    position: z.string().optional()
  }),

  bundleId: z.string().optional(),
  isCustomized: z.boolean().optional().default(false),
  customization: bundleCustomizationSchema.optional(),

  totalAmount: z.number()
    .min(0, 'Le montant total ne peut pas être négatif'),

  currency: z.string()
    .min(3, 'La devise doit contenir 3 caractères')
    .max(3, 'La devise doit contenir 3 caractères')
    .default('XOF'),

  urgency: z.enum(['standard', 'urgent', 'asap']).optional().default('standard'),

  notes: z.string()
    .max(1000, 'Les notes ne peuvent pas dépasser 1000 caractères')
    .optional(),

  deliveryLocation: z.string()
    .max(200, 'Le lieu de livraison ne peut pas dépasser 200 caractères')
    .optional(),

  requestedDeliveryDate: z.string()
    .datetime('Date de livraison invalide')
    .optional()
})

export type BundleQuoteRequestInput = z.infer<typeof bundleQuoteRequestSchema>

// Bundle analytics schema
export const bundleAnalyticsSchema = z.object({
  bundleId: z.string().min(1, 'L\'ID du bundle est requis'),

  viewCount: z.number().int().min(0).default(0),
  selectionCount: z.number().int().min(0).default(0),
  customizationCount: z.number().int().min(0).default(0),
  quoteCount: z.number().int().min(0).default(0),
  orderCount: z.number().int().min(0).default(0),

  customizationRate: z.number().min(0).max(100).default(0),
  conversionRate: z.number().min(0).max(100).default(0),

  averageOrderValue: z.number().min(0).default(0),

  lastViewedAt: z.string().datetime().optional(),
  lastSelectedAt: z.string().datetime().optional(),
  lastOrderedAt: z.string().datetime().optional()
})

export type BundleAnalyticsInput = z.infer<typeof bundleAnalyticsSchema>

// Validation helpers
export function validateBundleProducts(products: any[]): string[] {
  const errors: string[] = []

  if (!products || products.length === 0) {
    errors.push('Au moins un produit est requis')
    return errors
  }

  // Check for duplicate products
  const productIds = products.map(p => p.id)
  const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index)
  if (duplicates.length > 0) {
    errors.push('Les produits dupliqués ne sont pas autorisés')
  }

  // Validate each product
  products.forEach((product, index) => {
    try {
      bundleProductSchema.parse(product)

      // Additional validation: subtotal should match quantity * basePrice
      const expectedSubtotal = product.quantity * product.basePrice
      if (Math.abs(product.subtotal - expectedSubtotal) > 0.01) {
        errors.push(`Sous-total incorrect pour le produit ${index + 1}`)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push(`Produit ${index + 1}: ${err.message}`)
        })
      }
    }
  })

  return errors
}

export function validateBundleTotal(bundle: any): string[] {
  const errors: string[] = []

  if (!bundle.products || bundle.products.length === 0) {
    return errors
  }

  const calculatedTotal = bundle.products.reduce((total: number, product: any) => {
    return total + (product.subtotal || 0)
  }, 0)

  // Allow small floating point differences
  if (Math.abs(bundle.estimatedTotal - calculatedTotal) > 0.01) {
    errors.push('Le prix total ne correspond pas à la somme des produits')
  }

  if (bundle.originalTotal && bundle.originalTotal < bundle.estimatedTotal) {
    errors.push('Le prix original ne peut pas être inférieur au prix estimé')
  }

  if (bundle.savings) {
    const expectedSavings = (bundle.originalTotal || 0) - bundle.estimatedTotal
    if (Math.abs(bundle.savings - expectedSavings) > 0.01) {
      errors.push('Les économies calculées sont incorrectes')
    }
  }

  return errors
}

// Bundle business logic validation
export function validateBundleBusinessRules(bundle: any): string[] {
  const errors: string[] = []

  // Budget range validation based on estimated total
  const budgetRanges = {
    starter: { min: 0, max: 10000 },
    medium: { min: 10000, max: 50000 },
    premium: { min: 50000, max: 200000 },
    enterprise: { min: 200000, max: Infinity }
  }

  const range = budgetRanges[bundle.budgetRange as keyof typeof budgetRanges]
  if (range && (bundle.estimatedTotal < range.min || bundle.estimatedTotal > range.max)) {
    errors.push(`Le prix total ne correspond pas à la gamme de budget ${bundle.budgetRange}`)
  }

  // Featured bundles should have high popularity
  if (bundle.isFeatured && bundle.popularity < 7) {
    errors.push('Les bundles vedettes doivent avoir une popularité d\'au moins 7')
  }

  // Inactive bundles cannot be featured
  if (!bundle.isActive && bundle.isFeatured) {
    errors.push('Un bundle inactif ne peut pas être en vedette')
  }

  return errors
}