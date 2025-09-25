/**
 * Domain Types for Bundle Entity
 * SOLID Architecture - Domain Layer
 */

import type { Product } from './Product'

// Core Bundle Interface (Immutable)
export interface Bundle {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly targetAudience: BundleTargetAudience
  readonly estimatedTotal: number
  readonly originalTotal?: number
  readonly savings?: number
  readonly popularity: number
  readonly isActive: boolean
  readonly isFeatured: boolean
  readonly tags: string[]
  readonly createdAt: string
  readonly updatedAt: string
}

// Bundle Product Interface (Value Object)
export interface BundleProduct {
  readonly id: string
  readonly productId: string
  readonly name: string
  readonly basePrice: number
  readonly quantity: number
  readonly subtotal: number
  readonly productReference?: string
  readonly categoryId?: string
  readonly image_url?: string // Support pour les images de produits
  readonly price?: number // Compatibilité avec Product interface
}

// Bundle Enums
export type BundleTargetAudience = 'local' | 'regional' | 'national' | 'universal'
export type BundleStatus = 'active' | 'inactive' | 'draft' | 'archived'

// Bundle Aggregate Root - Complete Bundle with Relations
export interface BundleAggregate extends Bundle {
  readonly products: BundleProduct[]
  readonly productsDetails?: Product[]
  readonly totalProducts: number
  readonly averageProductPrice: number
  readonly discountPercentage?: number
  readonly usageCount?: number
  readonly lastUsedDate?: string
}

// Bundle Calculation Value Objects
export interface BundleCalculation {
  readonly originalTotal: number
  readonly estimatedTotal: number
  readonly savings: number
  readonly discountPercentage: number
  readonly totalProducts: number
}

export interface BundlePricing {
  readonly baseTotal: number
  readonly discountAmount: number
  readonly finalTotal: number
  readonly currency: 'XOF' | 'EUR' | 'USD'
  readonly taxAmount?: number
  readonly shippingCost?: number
}

// Bundle Search/Filter Value Objects
export interface BundleFilters {
  readonly search?: string
  readonly targetAudience?: BundleTargetAudience
  readonly status?: BundleStatus
  readonly featured?: boolean
  readonly tags?: string[]
  readonly priceRange?: {
    readonly min: number
    readonly max: number
  }
}

export interface BundleSortOptions {
  readonly field: keyof Bundle
  readonly direction: 'asc' | 'desc'
}

// Pagination
export interface BundlePagination {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly hasNext: boolean
  readonly hasPrevious: boolean
}

export interface PaginatedBundles {
  readonly data: Bundle[]
  readonly pagination: BundlePagination
  readonly filters?: BundleFilters
  readonly sort?: BundleSortOptions
}

// Domain Events
export interface BundleDomainEvent {
  readonly eventId: string
  readonly eventType: BundleEventType
  readonly bundleId: string
  readonly payload: unknown
  readonly timestamp: string
  readonly userId?: string
}

export type BundleEventType =
  | 'bundle.created'
  | 'bundle.updated'
  | 'bundle.deleted'
  | 'bundle.activated'
  | 'bundle.deactivated'
  | 'bundle.featured'
  | 'bundle.unfeatured'
  | 'bundle.product.added'
  | 'bundle.product.removed'
  | 'bundle.product.updated'
  | 'bundle.calculation.updated'

// Type Guards
export function isValidBundle(obj: unknown): obj is Bundle {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'estimatedTotal' in obj &&
    typeof (obj as Bundle).id === 'string' &&
    typeof (obj as Bundle).name === 'string' &&
    typeof (obj as Bundle).estimatedTotal === 'number'
  )
}

export function isValidBundleProduct(obj: unknown): obj is BundleProduct {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'productId' in obj &&
    'quantity' in obj &&
    'subtotal' in obj &&
    typeof (obj as BundleProduct).id === 'string' &&
    typeof (obj as BundleProduct).productId === 'string' &&
    typeof (obj as BundleProduct).quantity === 'number' &&
    typeof (obj as BundleProduct).subtotal === 'number'
  )
}

export function isValidTargetAudience(audience: string): audience is BundleTargetAudience {
  return ['local', 'regional', 'national', 'universal'].includes(audience)
}


// Domain Validation Rules
export const BundleValidationRules = {
  name: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  description: {
    maxLength: 1000,
    required: true
  },
  estimatedTotal: {
    min: 0,
    max: 1_000_000_000, // 1B XOF pour permettre des quantités très élevées
    required: true
  },
  products: {
    minItems: 1,
    maxItems: 50,
    required: true
  },
  popularity: {
    min: 0,
    max: 100,
    required: true
  }
} as const

// Bundle Business Logic Helpers
export const BundleHelpers = {
  calculateTotal: (products: BundleProduct[]): number => {
    return products.reduce((total, product) => {
      const validSubtotal = product.subtotal && !isNaN(product.subtotal) ? product.subtotal : 0
      return total + validSubtotal
    }, 0)
  },

  calculateSavings: (originalTotal: number, estimatedTotal: number): number => {
    if (originalTotal <= 0 || estimatedTotal <= 0) return 0
    return Math.max(0, originalTotal - estimatedTotal)
  },

  calculateDiscountPercentage: (originalTotal: number, estimatedTotal: number): number => {
    if (originalTotal <= 0) return 0
    const savings = BundleHelpers.calculateSavings(originalTotal, estimatedTotal)
    return Math.round((savings / originalTotal) * 100)
  },

  validateProductQuantity: (quantity: number): boolean => {
    return Number.isInteger(quantity) && quantity > 0
  },

  sanitizeProductPrice: (price: number | null | undefined): number => {
    return price && !isNaN(price) && price > 0 ? price : 0
  }
} as const