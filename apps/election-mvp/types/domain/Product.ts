/**
 * Domain Types for Product Entity
 * SOLID Architecture - Domain Layer
 */

// Core Product Interface (Immutable)
export interface Product {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly reference: string
  readonly basePrice: number
  readonly price: number
  readonly category: string
  readonly category_id: string
  readonly image_url?: string
  readonly isActive: boolean
  readonly status: ProductStatus
  readonly tags: string[]
  readonly createdAt: string
  readonly updatedAt: string
}

// Product Status Enum
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived'

// Product Category Interface
export interface ProductCategory {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly isActive: boolean
  readonly createdAt: string
  readonly updatedAt: string
}

// Value Objects
export interface ProductPricing {
  readonly basePrice: number
  readonly discountPercentage?: number
  readonly finalPrice: number
  readonly currency: 'XOF' | 'EUR' | 'USD'
}

export interface ProductMetadata {
  readonly weight?: number
  readonly dimensions?: {
    readonly length: number
    readonly width: number
    readonly height: number
  }
  readonly materials?: string[]
  readonly colors?: string[]
}

// Aggregate Root - Complete Product with Relations
export interface ProductAggregate extends Product {
  readonly categoryDetails?: ProductCategory
  readonly pricing: ProductPricing
  readonly metadata?: ProductMetadata
  readonly bundlesCount?: number
  readonly lastOrderDate?: string
}

// Product Search/Filter Value Objects
export interface ProductFilters {
  readonly search?: string
  readonly category?: string
  readonly status?: ProductStatus
  readonly priceRange?: {
    readonly min: number
    readonly max: number
  }
  readonly tags?: string[]
}

export interface ProductSortOptions {
  readonly field: keyof Product
  readonly direction: 'asc' | 'desc'
}

// Pagination
export interface ProductPagination {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly hasNext: boolean
  readonly hasPrevious: boolean
}

export interface PaginatedProducts {
  readonly data: Product[]
  readonly pagination: ProductPagination
  readonly filters?: ProductFilters
  readonly sort?: ProductSortOptions
}

// Domain Events
export interface ProductDomainEvent {
  readonly eventId: string
  readonly eventType: ProductEventType
  readonly productId: string
  readonly payload: unknown
  readonly timestamp: string
  readonly userId?: string
}

export type ProductEventType =
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.activated'
  | 'product.deactivated'
  | 'product.priceChanged'

// Type Guards
export function isValidProduct(obj: unknown): obj is Product {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'basePrice' in obj &&
    typeof (obj as Product).id === 'string' &&
    typeof (obj as Product).name === 'string' &&
    typeof (obj as Product).basePrice === 'number'
  )
}

export function isValidProductStatus(status: string): status is ProductStatus {
  return ['active', 'inactive', 'draft', 'archived'].includes(status)
}

// Domain Validation Rules
export const ProductValidationRules = {
  name: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  description: {
    maxLength: 500,
    required: true
  },
  basePrice: {
    min: 0,
    max: 10_000_000, // 10M XOF
    required: true
  },
  reference: {
    pattern: /^[A-Z0-9-]+$/,
    maxLength: 50,
    required: true
  }
} as const