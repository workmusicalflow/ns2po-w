/**
 * Product Reference Domain Types
 * SOLID Architecture - Domain Layer for Cross-Domain Validation
 * Ensures referential integrity between Products and Bundles
 */

import type { Product } from './Product'
import type { BundleProduct } from './Bundle'

// Product Reference Validation Result
export interface ProductReferenceValidation {
  readonly isValid: boolean
  readonly productId: string
  readonly exists: boolean
  readonly isActive: boolean
  readonly currentProduct?: Product
  readonly issues: ProductReferenceIssue[]
  readonly recommendations: string[]
}

// Product Reference Issues
export interface ProductReferenceIssue {
  readonly type: ProductReferenceIssueType
  readonly severity: 'error' | 'warning' | 'info'
  readonly message: string
  readonly productId: string
  readonly productName?: string
}

export type ProductReferenceIssueType =
  | 'product_not_found'
  | 'product_inactive'
  | 'price_mismatch'
  | 'name_changed'
  | 'category_changed'
  | 'bundle_calculation_outdated'

// Bundle Product Reference Status
export interface BundleProductReference extends BundleProduct {
  readonly validation: ProductReferenceValidation
  readonly lastValidated: string
  readonly needsUpdate: boolean
}

// Product Reference Options
export interface ProductReferenceOptions {
  readonly strictValidation: boolean
  readonly allowInactiveProducts: boolean
  readonly cacheTimeout: number // milliseconds
  readonly autoCorrectPrices: boolean
  readonly autoCorrectNames: boolean
}

// Batch Validation Results
export interface BundleReferenceValidation {
  readonly bundleId: string
  readonly isValid: boolean
  readonly totalProducts: number
  readonly validProducts: number
  readonly invalidProducts: ProductReferenceValidation[]
  readonly orphanedProducts: ProductReferenceValidation[]
  readonly recommendedActions: BundleReferenceAction[]
  readonly lastValidated: string
}

export interface BundleReferenceAction {
  readonly type: BundleReferenceActionType
  readonly productId: string
  readonly productName: string
  readonly description: string
  readonly priority: 'high' | 'medium' | 'low'
  readonly autoExecutable: boolean
}

export type BundleReferenceActionType =
  | 'remove_orphaned_product'
  | 'update_product_price'
  | 'update_product_name'
  | 'reactivate_product'
  | 'recalculate_bundle_total'
  | 'notify_admin'

// Product Cache Entry for Performance
export interface ProductCacheEntry {
  readonly product: Product
  readonly cachedAt: string
  readonly expiresAt: string
  readonly isValid: boolean
}

// Events for Cross-Interface Synchronization
export interface ProductReferenceEvent {
  readonly eventId: string
  readonly eventType: ProductReferenceEventType
  readonly productId: string
  readonly bundleIds: string[]
  readonly timestamp: string
  readonly payload: unknown
}

export type ProductReferenceEventType =
  | 'product.reference.validated'
  | 'product.reference.invalid'
  | 'product.reference.orphaned'
  | 'product.reference.updated'
  | 'bundle.integrity.check.completed'
  | 'bundle.integrity.issues.found'

// Configuration
export const ProductReferenceConfig = {
  defaultOptions: {
    strictValidation: true,
    allowInactiveProducts: false,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    autoCorrectPrices: true,
    autoCorrectNames: true
  } as ProductReferenceOptions,

  validation: {
    maxBatchSize: 50,
    timeoutMs: 10000,
    retryAttempts: 3
  },

  cache: {
    maxEntries: 1000,
    cleanupInterval: 10 * 60 * 1000 // 10 minutes
  }
} as const

// Type Guards
export function isValidProductReference(obj: unknown): obj is ProductReferenceValidation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'isValid' in obj &&
    'productId' in obj &&
    'exists' in obj &&
    'isActive' in obj &&
    typeof (obj as ProductReferenceValidation).isValid === 'boolean' &&
    typeof (obj as ProductReferenceValidation).productId === 'string'
  )
}

export function isOrphanedProduct(validation: ProductReferenceValidation): boolean {
  return !validation.exists || validation.issues.some(issue =>
    issue.type === 'product_not_found'
  )
}

export function requiresImmedateAction(validation: ProductReferenceValidation): boolean {
  return validation.issues.some(issue =>
    issue.severity === 'error' ||
    ['product_not_found', 'product_inactive'].includes(issue.type)
  )
}

// Helpers
export const ProductReferenceHelpers = {
  createValidationResult: (
    productId: string,
    product: Product | null,
    options: ProductReferenceOptions
  ): ProductReferenceValidation => {
    const exists = product !== null
    const isActive = product?.isActive ?? false
    const issues: ProductReferenceIssue[] = []
    const recommendations: string[] = []

    if (!exists) {
      issues.push({
        type: 'product_not_found',
        severity: 'error',
        message: `Product with ID '${productId}' no longer exists`,
        productId
      })
      recommendations.push(`Remove product '${productId}' from bundle or replace with alternative`)
    } else if (!isActive && !options.allowInactiveProducts) {
      issues.push({
        type: 'product_inactive',
        severity: options.strictValidation ? 'error' : 'warning',
        message: `Product '${product.name}' is inactive`,
        productId,
        productName: product.name
      })
      recommendations.push(`Activate product '${product.name}' or remove from bundle`)
    }

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      productId,
      exists,
      isActive,
      currentProduct: product || undefined,
      issues,
      recommendations
    }
  },

  shouldRefreshCache: (entry: ProductCacheEntry): boolean => {
    return Date.now() > new Date(entry.expiresAt).getTime()
  },

  prioritizeActions: (actions: BundleReferenceAction[]): BundleReferenceAction[] => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return [...actions].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  }
} as const