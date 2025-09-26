/**
 * Bundle Adapter - Type-safe Transformation Layer
 * SOLID Architecture - Data Transformation Layer
 * Converts between CampaignBundle (API) and Bundle (Domain) types
 */

import type { CampaignBundle, BundleProduct as ExternalBundleProduct } from '@ns2po/types'
import type {
  Bundle,
  BundleProduct,
  BundleAggregate,
  BundleCalculation
} from '../types/domain/Bundle'

/**
 * Transforms CampaignBundle from API to Domain Bundle
 */
export function adaptCampaignBundleToBundle(campaignBundle: CampaignBundle): Bundle {
  return {
    id: campaignBundle.id,
    name: campaignBundle.name,
    description: campaignBundle.description || '',

    // Direct camelCase mapping
    targetAudience: campaignBundle.targetAudience || 'local',
    budgetRange: campaignBundle.budgetRange || 'medium',

    // Boolean flags with defaults
    isActive: campaignBundle.isActive ?? true,
    isFeatured: campaignBundle.isFeatured ?? false,

    // Financial calculations
    estimatedTotal: campaignBundle.estimatedTotal || 0,
    originalTotal: campaignBundle.originalTotal || campaignBundle.estimatedTotal || 0,
    savings: campaignBundle.savings || 0,

    // Popularity score
    popularity: campaignBundle.popularity || 0,

    // Arrays with defaults
    tags: (campaignBundle.tags as string[]) || [],

    // Timestamps (already strings)
    createdAt: campaignBundle.createdAt,
    updatedAt: campaignBundle.updatedAt
  }
}

/**
 * Transforms external BundleProduct to domain BundleProduct
 */
export function adaptExternalBundleProduct(externalProduct: ExternalBundleProduct): BundleProduct {
  return {
    id: externalProduct.id || generateTempId(),
    productId: externalProduct.id, // External BundleProduct id = productId

    // Product details
    name: externalProduct.name || 'Unknown Product',

    // Pricing - using available properties from ExternalBundleProduct
    basePrice: externalProduct.basePrice || 0,

    // Quantity and calculations
    quantity: externalProduct.quantity || 1,
    subtotal: externalProduct.subtotal || (externalProduct.quantity || 1) * (externalProduct.basePrice || 0)
  }
}

/**
 * Transforms Domain Bundle back to CampaignBundle for API calls
 */
export function adaptBundleToCampaignBundle(bundle: Bundle): Partial<CampaignBundle> {
  return {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,

    // Direct camelCase mapping
    targetAudience: bundle.targetAudience,
    budgetRange: bundle.budgetRange,

    // Boolean flags
    isActive: bundle.isActive,
    isFeatured: bundle.isFeatured,

    // Financial calculations
    estimatedTotal: bundle.estimatedTotal,
    originalTotal: bundle.originalTotal,
    savings: bundle.savings,
    popularity: bundle.popularity,

    // Arrays
    tags: bundle.tags as readonly string[],

    // Timestamps (already strings in domain)
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt
  }
}

/**
 * Transforms domain BundleProduct back to external format
 */
export function adaptBundleProductToExternal(bundleProduct: BundleProduct): Partial<ExternalBundleProduct> {
  return {
    id: bundleProduct.productId, // Use productId as external id

    // Product details
    name: bundleProduct.name,

    // Pricing
    basePrice: bundleProduct.basePrice,

    // Quantity and calculations
    quantity: bundleProduct.quantity,
    subtotal: bundleProduct.subtotal
  }
}

/**
 * Creates a BundleAggregate from CampaignBundle with products
 */
export function adaptCampaignBundleToAggregate(
  campaignBundle: CampaignBundle,
  products: ExternalBundleProduct[] = []
): BundleAggregate {
  const domainBundle = adaptCampaignBundleToBundle(campaignBundle)
  const domainProducts = products.map(adaptExternalBundleProduct)

  return {
    ...domainBundle,
    products: domainProducts,
    totalProducts: domainProducts.length,
    averageProductPrice: domainProducts.length > 0
      ? domainProducts.reduce((sum, p) => sum + p.basePrice, 0) / domainProducts.length
      : 0
  }
}

/**
 * Calculates bundle totals from products
 */
export function calculateBundleFromProducts(products: BundleProduct[]): BundleCalculation {
  const originalTotal = products.reduce((sum, product) =>
    sum + (product.basePrice * product.quantity), 0
  )

  const estimatedTotal = products.reduce((sum, product) =>
    sum + product.subtotal, 0
  )

  const savings = originalTotal - estimatedTotal
  const discountPercentage = originalTotal > 0 ? (savings / originalTotal) * 100 : 0

  return {
    originalTotal,
    estimatedTotal,
    savings,
    discountPercentage,
    totalProducts: products.length
  }
}

/**
 * Validates if a CampaignBundle can be safely adapted
 */
export function validateCampaignBundle(campaignBundle: any): campaignBundle is CampaignBundle {
  if (!campaignBundle || typeof campaignBundle !== 'object') {
    return false
  }

  // Required fields check
  const requiredFields = ['id', 'name']
  for (const field of requiredFields) {
    if (!(field in campaignBundle)) {
      console.warn(`BundleAdapter: Missing required field '${field}' in CampaignBundle`)
      return false
    }
  }

  return true
}

/**
 * Safe adapter with validation and error handling
 */
export function safeAdaptCampaignBundle(data: any): Bundle | null {
  try {
    if (!validateCampaignBundle(data)) {
      console.error('BundleAdapter: Invalid CampaignBundle data', data)
      return null
    }

    return adaptCampaignBundleToBundle(data)
  } catch (error) {
    console.error('BundleAdapter: Error adapting CampaignBundle', error, data)
    return null
  }
}

/**
 * Utility function to generate temporary IDs
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debug helper to compare Bundle vs CampaignBundle structures
 */
export function debugBundleTransformation(campaignBundle: CampaignBundle): {
  original: CampaignBundle
  adapted: Bundle
  mapping: Record<string, any>
} {
  const adapted = adaptCampaignBundleToBundle(campaignBundle)

  return {
    original: campaignBundle,
    adapted,
    mapping: {
      'campaign_bundle.target_audience': `→ bundle.targetAudience (${adapted.targetAudience})`,
      'campaign_bundle.budget_range': `→ bundle.budgetRange (${adapted.budgetRange})`,
      'campaign_bundle.is_active': `→ bundle.isActive (${adapted.isActive})`,
      'campaign_bundle.is_featured': `→ bundle.isFeatured (${adapted.isFeatured})`,
      'campaign_bundle.estimated_total': `→ bundle.estimatedTotal (${adapted.estimatedTotal})`,
      'campaign_bundle.popularity': `→ bundle.popularity (${adapted.popularity})`
    }
  }
}