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
    .max(100, 'La popularité ne peut pas dépasser 100')
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
  id: z.string().min(1, 'L\'ID est requis'),
  version: z.number().int().min(0, 'La version doit être un nombre entier positif').optional()
})

export type CampaignBundleUpdateInput = z.infer<typeof campaignBundleUpdateSchema>

// Schema for bundle filters
export const bundleFiltersSchema = z.object({
  search: z.string().optional(),
  targetAudience: z.enum(['local', 'regional', 'national', 'universal']).optional(),
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

  // 1. Quantité minimale unique pour tous les bundles
  if (bundle.products && bundle.products.length > 0) {
    const totalQuantity = bundle.products.reduce((sum: number, product: any) => sum + product.quantity, 0)

    if (totalQuantity < 1000) {
      errors.push(`Quantité insuffisante: ${totalQuantity}/1000 articles minimum requis`)
    }
  } else {
    errors.push('Au moins un produit est requis')
  }

  // 2. Featured bundles should have high popularity
  if (bundle.isFeatured && bundle.popularity < 7) {
    errors.push('Les bundles vedettes doivent avoir une popularité d\'au moins 7')
  }

  // 3. Inactive bundles cannot be featured
  if (!bundle.isActive && bundle.isFeatured) {
    errors.push('Un bundle inactif ne peut pas être en vedette')
  }

  // 4. Validation quantité maximale pour contrôle qualité
  if (bundle.products && bundle.products.length > 0) {
    const totalQuantity = bundle.products.reduce((sum: number, product: any) => sum + product.quantity, 0)

    if (totalQuantity > 50000) {
      errors.push('Quantité totale trop élevée (maximum: 50 000 articles)')
    }
  }

  // 5. Price consistency validation
  if (bundle.originalTotal && bundle.estimatedTotal && bundle.savings) {
    const calculatedSavings = bundle.originalTotal - bundle.estimatedTotal
    if (Math.abs(bundle.savings - calculatedSavings) > 0.01) {
      errors.push('Les économies calculées ne correspondent pas à la différence de prix')
    }

    // Minimum discount percentage for bundles
    const discountPercentage = (calculatedSavings / bundle.originalTotal) * 100
    if (discountPercentage > 0 && discountPercentage < 5) {
      errors.push('La remise doit être d\'au moins 5% pour justifier un bundle')
    }

    // Maximum discount to prevent losses
    if (discountPercentage > 50) {
      errors.push('La remise ne peut pas dépasser 50%')
    }
  }

  // 6. Campaign timing validation
  const campaignSeasons = ['standard', 'presidentielle', 'legislatives', 'municipales', 'regionales']
  if (bundle.tags && bundle.tags.includes('election')) {
    if (!bundle.tags.some((tag: string) => campaignSeasons.includes(tag))) {
      errors.push('Les bundles électoraux doivent spécifier le type d\'élection')
    }
  }

  // 7. Product diversity validation for better campaign impact
  if (bundle.products && bundle.products.length > 0) {
    const uniqueProductTypes = new Set()
    bundle.products.forEach((product: any) => {
      // Extract product type from name/category (simplified logic)
      const productName = product.name?.toLowerCase() || ''
      if (productName.includes('t-shirt') || productName.includes('textile')) {
        uniqueProductTypes.add('textile')
      } else if (productName.includes('stylo') || productName.includes('pen')) {
        uniqueProductTypes.add('writing')
      } else if (productName.includes('casquette') || productName.includes('cap')) {
        uniqueProductTypes.add('headwear')
      } else if (productName.includes('autocollant') || productName.includes('sticker')) {
        uniqueProductTypes.add('print')
      } else {
        uniqueProductTypes.add('other')
      }
    })

    // Encourager la diversité des produits pour plus d'impact
    if (uniqueProductTypes.size < 2) {
      errors.push('Recommandé: inclure au moins 2 types de produits différents pour plus d\'impact')
    }
  }

  return errors
}

// Advanced validation for featured bundle limits (requires database check)
export async function validateFeaturedBundleLimit(bundle: any, db?: any, isUpdate = false): Promise<string[]> {
  const errors: string[] = []

  // Only check if this bundle is trying to be featured
  if (!bundle.isFeatured) {
    return errors
  }

  // If no database provided, skip this validation
  if (!db) {
    return errors
  }

  try {
    // Count currently featured bundles (excluding this one if it's an update)
    const countQuery = isUpdate
      ? 'SELECT COUNT(*) as count FROM campaign_bundles WHERE display_order <= 3 AND is_active = 1 AND id != ?'
      : 'SELECT COUNT(*) as count FROM campaign_bundles WHERE display_order <= 3 AND is_active = 1'

    const args = isUpdate ? [bundle.id] : []
    const result = await db.execute({ sql: countQuery, args })

    const currentFeaturedCount = Number(result.rows[0]?.count) || 0
    const maxFeatured = 6 // Maximum featured bundles allowed

    if (currentFeaturedCount >= maxFeatured) {
      errors.push(`Limite de bundles vedettes atteinte (${maxFeatured} maximum). Retirez d'abord un bundle de la section vedette.`)
    }

    // Check for audience diversity in featured bundles
    const audienceQuery = isUpdate
      ? 'SELECT target_audience FROM campaign_bundles WHERE display_order <= 3 AND is_active = 1 AND id != ?'
      : 'SELECT target_audience FROM campaign_bundles WHERE display_order <= 3 AND is_active = 1'

    const audienceResult = await db.execute({ sql: audienceQuery, args })
    const featuredAudiences = audienceResult.rows.map((row: any) => row.target_audience)

    // Add current bundle's audience
    featuredAudiences.push(bundle.targetAudience)

    // Count occurrences of each audience
    const audienceCounts = featuredAudiences.reduce((acc: any, audience: string) => {
      acc[audience] = (acc[audience] || 0) + 1
      return acc
    }, {})

    // Warn if too many bundles target the same audience
    for (const [audience, count] of Object.entries(audienceCounts)) {
      if (count > 3) {
        errors.push(`Trop de bundles vedettes pour l'audience "${audience}" (${count}/3 maximum pour la diversité)`)
      }
    }

  } catch (dbError) {
    console.warn('Failed to validate featured bundle limits:', dbError)
    // Don't fail validation if database check fails
  }

  return errors
}