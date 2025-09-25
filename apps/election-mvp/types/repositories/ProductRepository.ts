/**
 * Product Repository Interface
 * SOLID Architecture - Repository Pattern (DIP)
 */

import type {
  Product,
  ProductAggregate,
  ProductFilters,
  ProductSortOptions,
  PaginatedProducts,
  ProductDomainEvent
} from '../domain/Product'

// Core Repository Interface (Abstract)
export interface IProductRepository {
  // Query Operations (Read)
  findById(id: string): Promise<Product | null>
  findAll(filters?: ProductFilters, sort?: ProductSortOptions): Promise<Product[]>
  findPaginated(
    page: number,
    limit: number,
    filters?: ProductFilters,
    sort?: ProductSortOptions
  ): Promise<PaginatedProducts>
  findByIds(ids: string[]): Promise<Product[]>
  findByCategory(categoryId: string): Promise<Product[]>
  findByReference(reference: string): Promise<Product | null>
  search(query: string, filters?: ProductFilters): Promise<Product[]>
  count(filters?: ProductFilters): Promise<number>
  exists(id: string): Promise<boolean>

  // Aggregate Queries
  findAggregateById(id: string): Promise<ProductAggregate | null>
  findPopularProducts(limit: number): Promise<Product[]>
  findRecentProducts(limit: number): Promise<Product[]>
  findLowStockProducts(threshold: number): Promise<Product[]>

  // Command Operations (Write)
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>
  update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>
  delete(id: string): Promise<boolean>
  activate(id: string): Promise<Product>
  deactivate(id: string): Promise<Product>
  updatePrice(id: string, newPrice: number): Promise<Product>
  bulkUpdate(updates: Array<{ id: string; data: Partial<Product> }>): Promise<Product[]>

  // Event Sourcing (Optional)
  getEvents(productId: string): Promise<ProductDomainEvent[]>
  saveEvent(event: ProductDomainEvent): Promise<void>
}

// Specialized Repository Interfaces
export interface IProductCacheRepository {
  get(key: string): Promise<Product | Product[] | null>
  set(key: string, value: Product | Product[], ttl?: number): Promise<void>
  invalidate(pattern: string): Promise<void>
  clear(): Promise<void>
}

export interface IProductAnalyticsRepository {
  getTopSellingProducts(limit: number, period?: string): Promise<Product[]>
  getProductPerformance(productId: string): Promise<ProductPerformanceMetrics>
  getBundleUsageByProduct(productId: string): Promise<BundleUsageMetric[]>
}

// Value Objects for Analytics
export interface ProductPerformanceMetrics {
  readonly productId: string
  readonly viewCount: number
  readonly addToCartCount: number
  readonly purchaseCount: number
  readonly conversionRate: number
  readonly avgRating?: number
  readonly revenueGenerated: number
  readonly lastUpdated: string
}

export interface BundleUsageMetric {
  readonly bundleId: string
  readonly bundleName: string
  readonly usageCount: number
  readonly lastUsed: string
}

// Repository Error Types
export class ProductRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: ProductErrorCode,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ProductRepositoryError'
  }
}

export type ProductErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'PRODUCT_ALREADY_EXISTS'
  | 'INVALID_PRODUCT_DATA'
  | 'DATABASE_CONNECTION_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONSTRAINT_VIOLATION'

// Query Builder Interface (for complex queries)
export interface IProductQueryBuilder {
  where(field: keyof Product, operator: QueryOperator, value: unknown): IProductQueryBuilder
  orderBy(field: keyof Product, direction: 'asc' | 'desc'): IProductQueryBuilder
  limit(count: number): IProductQueryBuilder
  offset(count: number): IProductQueryBuilder
  include(relations: ProductRelation[]): IProductQueryBuilder
  build(): Promise<Product[]>
}

export type QueryOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'CONTAINS'
export type ProductRelation = 'category' | 'bundles' | 'pricing' | 'metadata'