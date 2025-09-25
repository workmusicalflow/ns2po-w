/**
 * API Types - Request/Response Interfaces
 * SOLID Architecture - Infrastructure Layer
 */

import type { Product, ProductFilters, ProductSortOptions } from '../domain/Product'
import type { Bundle, BundleFilters, BundleSortOptions, BundleProduct } from '../domain/Bundle'

// Generic API Response Wrapper
export interface ApiResponse<T = unknown> {
  readonly success: boolean
  readonly data: T
  readonly message?: string
  readonly error?: ApiError
  readonly timestamp: string
  readonly requestId?: string
}

export interface ApiError {
  readonly code: string
  readonly message: string
  readonly details?: unknown
  readonly field?: string
}

// Pagination API Types
export interface PaginationRequest {
  readonly page: number
  readonly limit: number
  readonly sort?: string
  readonly order?: 'asc' | 'desc'
}

export interface PaginationResponse {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly totalPages: number
  readonly hasNext: boolean
  readonly hasPrevious: boolean
}

// Product API Types
export namespace ProductAPI {
  export interface ListRequest {
    readonly page?: number
    readonly limit?: number
    readonly search?: string
    readonly category?: string
    readonly status?: string
    readonly tags?: string[]
    readonly priceMin?: number
    readonly priceMax?: number
    readonly sortBy?: keyof Product
    readonly sortOrder?: 'asc' | 'desc'
  }

  export interface ListResponse extends ApiResponse<Product[]> {
    readonly pagination: PaginationResponse
    readonly filters: ProductFilters
  }

  export interface GetRequest {
    readonly id: string
    readonly includeAggregate?: boolean
  }

  export interface GetResponse extends ApiResponse<Product> {}

  export interface CreateRequest {
    readonly name: string
    readonly description: string
    readonly reference: string
    readonly basePrice: number
    readonly price: number
    readonly category_id: string
    readonly image_url?: string
    readonly tags?: string[]
    readonly isActive?: boolean
  }

  export interface CreateResponse extends ApiResponse<Product> {}

  export interface UpdateRequest {
    readonly id: string
    readonly name?: string
    readonly description?: string
    readonly reference?: string
    readonly basePrice?: number
    readonly price?: number
    readonly category_id?: string
    readonly image_url?: string
    readonly tags?: string[]
    readonly isActive?: boolean
  }

  export interface UpdateResponse extends ApiResponse<Product> {}

  export interface DeleteRequest {
    readonly id: string
  }

  export interface DeleteResponse extends ApiResponse<{ deleted: boolean }> {}

  export interface BulkUpdateRequest {
    readonly updates: Array<{
      readonly id: string
      readonly data: Partial<UpdateRequest>
    }>
  }

  export interface BulkUpdateResponse extends ApiResponse<Product[]> {}
}

// Bundle API Types
export namespace BundleAPI {
  export interface ListRequest {
    readonly page?: number
    readonly limit?: number
    readonly search?: string
    readonly targetAudience?: string
    readonly budgetRange?: string
    readonly featured?: boolean
    readonly tags?: string[]
    readonly priceMin?: number
    readonly priceMax?: number
    readonly sortBy?: keyof Bundle
    readonly sortOrder?: 'asc' | 'desc'
  }

  export interface ListResponse extends ApiResponse<Bundle[]> {
    readonly pagination: PaginationResponse
    readonly filters: BundleFilters
  }

  export interface GetRequest {
    readonly id: string
    readonly includeProducts?: boolean
    readonly includeProductDetails?: boolean
  }

  export interface GetResponse extends ApiResponse<Bundle> {
    readonly products?: BundleProduct[]
  }

  export interface CreateRequest {
    readonly name: string
    readonly description: string
    readonly targetAudience: string
    readonly budgetRange: string
    readonly products: BundleProductRequest[]
    readonly tags?: string[]
    readonly isActive?: boolean
    readonly isFeatured?: boolean
    readonly popularity?: number
  }

  export interface CreateResponse extends ApiResponse<Bundle> {}

  export interface UpdateRequest {
    readonly id: string
    readonly name?: string
    readonly description?: string
    readonly targetAudience?: string
    readonly budgetRange?: string
    readonly products?: BundleProductRequest[]
    readonly tags?: string[]
    readonly isActive?: boolean
    readonly isFeatured?: boolean
    readonly popularity?: number
  }

  export interface UpdateResponse extends ApiResponse<Bundle> {}

  export interface DeleteRequest {
    readonly id: string
  }

  export interface DeleteResponse extends ApiResponse<{ deleted: boolean }> {}

  export interface AddProductRequest {
    readonly bundleId: string
    readonly productId: string
    readonly quantity: number
  }

  export interface AddProductResponse extends ApiResponse<BundleProduct> {}

  export interface UpdateProductRequest {
    readonly bundleId: string
    readonly productId: string
    readonly quantity?: number
  }

  export interface UpdateProductResponse extends ApiResponse<BundleProduct> {}

  export interface RemoveProductRequest {
    readonly bundleId: string
    readonly productId: string
  }

  export interface RemoveProductResponse extends ApiResponse<{ removed: boolean }> {}
}

// Supporting Types
export interface BundleProductRequest {
  readonly productId: string
  readonly quantity: number
}

// Error Codes
export const API_ERROR_CODES = {
  // Generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Product specific
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS: 'PRODUCT_ALREADY_EXISTS',
  INVALID_PRODUCT_DATA: 'INVALID_PRODUCT_DATA',
  PRODUCT_IN_USE: 'PRODUCT_IN_USE',

  // Bundle specific
  BUNDLE_NOT_FOUND: 'BUNDLE_NOT_FOUND',
  BUNDLE_ALREADY_EXISTS: 'BUNDLE_ALREADY_EXISTS',
  INVALID_BUNDLE_DATA: 'INVALID_BUNDLE_DATA',
  PRODUCT_NOT_IN_BUNDLE: 'PRODUCT_NOT_IN_BUNDLE',
  BUNDLE_CALCULATION_ERROR: 'BUNDLE_CALCULATION_ERROR',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR'
} as const

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES]

// Request/Response Helpers
export class ApiResponseBuilder {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }
  }

  static error(
    code: ApiErrorCode,
    message: string,
    details?: unknown,
    field?: string
  ): ApiResponse<null> {
    return {
      success: false,
      data: null,
      error: { code, message, details, field },
      timestamp: new Date().toISOString()
    }
  }

  static paginated<T>(
    data: T[],
    pagination: PaginationResponse,
    filters?: unknown
  ): ApiResponse<T[]> & { pagination: PaginationResponse } {
    return {
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString()
    }
  }
}

// Validation Helpers
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: ValidationError[]
}

export interface ValidationError {
  readonly field: string
  readonly code: string
  readonly message: string
  readonly value?: unknown
}

export class ApiValidator {
  static validatePagination(req: PaginationRequest): ValidationResult {
    const errors: ValidationError[] = []

    if (req.page < 1) {
      errors.push({
        field: 'page',
        code: 'MIN_VALUE',
        message: 'Page must be greater than 0',
        value: req.page
      })
    }

    if (req.limit < 1 || req.limit > 100) {
      errors.push({
        field: 'limit',
        code: 'RANGE_ERROR',
        message: 'Limit must be between 1 and 100',
        value: req.limit
      })
    }

    return { isValid: errors.length === 0, errors }
  }
}