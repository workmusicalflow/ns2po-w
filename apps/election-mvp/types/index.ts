/**
 * Types Index - Main Export File
 * SOLID Architecture - Central Type Definitions
 */

// Domain Types
export * from './domain/Product'
export * from './domain/Bundle'

// Repository Interfaces
export * from './repositories/ProductRepository'
// BundleRepository removed - replaced by Vue Query

// SOLID API Types
export * from './api/solid'

// Re-export commonly used types for convenience
export type {
  Product,
  ProductAggregate,
  ProductStatus,
  ProductFilters,
  ProductSortOptions,
  PaginatedProducts
} from './domain/Product'

export type {
  Bundle,
  BundleAggregate,
  BundleProduct,
  BundleTargetAudience,
  BundleBudgetRange,
  BundleFilters,
  BundleSortOptions,
  PaginatedBundles
} from './domain/Bundle'

export type {
  IProductRepository,
  ProductRepositoryError
} from './repositories/ProductRepository'

// IBundleRepository and BundleRepositoryError removed - replaced by Vue Query

export type {
  ApiResponse,
  ApiError,
  PaginationRequest,
  PaginationResponse
} from './api/solid'

// Type Guards (commonly used)
export {
  isValidProduct,
  isValidProductStatus,
  ProductValidationRules
} from './domain/Product'

export {
  isValidBundle,
  isValidBundleProduct,
  isValidTargetAudience,
  isValidBudgetRange,
  BundleValidationRules,
  BundleHelpers
} from './domain/Bundle'

// Error Codes
export { API_ERROR_CODES } from './api/solid'

// Utility Classes
export { ApiResponseBuilder, ApiValidator } from './api/solid'