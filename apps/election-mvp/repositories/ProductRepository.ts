/**
 * Product Repository Implementation
 * SOLID Architecture - Repository Pattern (DIP)
 * Abstraction layer for Product data access
 */

/// <reference path="../types/nuxt.d.ts" />

import type {
  Product,
  ProductAggregate,
  ProductFilters,
  ProductSortOptions,
  PaginatedProducts,
  ProductDomainEvent
} from '../types/domain/Product'
import type {
  IProductRepository,
  ProductPerformanceMetrics
} from '../types/repositories/ProductRepository'
import { ProductRepositoryError } from '../types/repositories/ProductRepository'
import type { ApiResponse } from '../types/api/solid'

export class ProductRepository implements IProductRepository {
  private baseUrl = '/api/products'

  // Query Operations (Read)
  async findById(id: string): Promise<Product | null> {
    try {
      const response = await $fetch<ApiResponse<Product>>(`${this.baseUrl}/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null
      }
      throw this.createRepositoryError('PRODUCT_NOT_FOUND', `Product with id ${id} not found`, error)
    }
  }

  async findAll(filters?: ProductFilters, sort?: ProductSortOptions): Promise<Product[]> {
    try {
      const queryParams = this.buildQueryParams(filters, sort)
      const response = await $fetch<ApiResponse<Product[]>>(`${this.baseUrl}${queryParams}`)

      if (!response.success || !Array.isArray(response.data)) {
        throw this.createRepositoryError('INVALID_PRODUCT_DATA', 'Invalid response format from API')
      }

      return response.data
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', 'Failed to fetch products', error)
    }
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: ProductFilters,
    sort?: ProductSortOptions
  ): Promise<PaginatedProducts> {
    try {
      const queryParams = this.buildQueryParams(filters, sort, { page, limit })
      const response = await $fetch<ApiResponse<Product[]> & { pagination: any }>(`${this.baseUrl}${queryParams}`)

      if (!response.success) {
        throw this.createRepositoryError('INVALID_PRODUCT_DATA', 'Invalid pagination response')
      }

      return {
        data: response.data,
        pagination: {
          page,
          limit,
          total: response.pagination?.total || response.data.length,
          hasNext: response.pagination?.hasNext || false,
          hasPrevious: response.pagination?.hasPrevious || false
        },
        filters,
        sort
      }
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', 'Failed to fetch paginated products', error)
    }
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    try {
      if (ids.length === 0) return []

      const queryParams = `?ids=${ids.join(',')}`
      const response = await $fetch<ApiResponse<Product[]>>(`${this.baseUrl}${queryParams}`)

      return response.success ? response.data : []
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', 'Failed to fetch products by IDs', error)
    }
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    try {
      const filters: ProductFilters = { category: categoryId }
      return await this.findAll(filters)
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', `Failed to fetch products for category ${categoryId}`, error)
    }
  }

  async findByReference(reference: string): Promise<Product | null> {
    try {
      const response = await $fetch<ApiResponse<Product[]>>(`${this.baseUrl}?reference=${reference}`)

      if (response.success && response.data.length > 0) {
        return response.data[0]
      }

      return null
    } catch (error) {
      throw this.createRepositoryError('PRODUCT_NOT_FOUND', `Product with reference ${reference} not found`, error)
    }
  }

  async search(query: string, filters?: ProductFilters): Promise<Product[]> {
    try {
      const searchFilters = { ...filters, search: query }
      return await this.findAll(searchFilters)
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', `Failed to search products with query: ${query}`, error)
    }
  }

  async count(filters?: ProductFilters): Promise<number> {
    try {
      const queryParams = this.buildQueryParams(filters) + '&count=true'
      const response = await $fetch<ApiResponse<{ count: number }>>(`${this.baseUrl}${queryParams}`)

      return response.success ? response.data.count : 0
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', 'Failed to count products', error)
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const product = await this.findById(id)
      return product !== null
    } catch (error) {
      return false
    }
  }

  // Aggregate Queries
  async findAggregateById(id: string): Promise<ProductAggregate | null> {
    try {
      const response = await $fetch<ApiResponse<ProductAggregate>>(`${this.baseUrl}/${id}?aggregate=true`)
      return response.success ? response.data : null
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null
      }
      throw this.createRepositoryError('PRODUCT_NOT_FOUND', `Product aggregate with id ${id} not found`, error)
    }
  }

  async findPopularProducts(limit: number): Promise<Product[]> {
    try {
      // Use createdAt as a proxy for popularity since Product domain doesn't have popularity field
      const sort: ProductSortOptions = { field: 'createdAt', direction: 'desc' }
      const products = await this.findAll(undefined, sort)
      return products.slice(0, limit)
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', 'Failed to fetch popular products', error)
    }
  }

  async findRecentProducts(limit: number): Promise<Product[]> {
    try {
      const sort: ProductSortOptions = { field: 'createdAt', direction: 'desc' }
      const products = await this.findAll(undefined, sort)
      return products.slice(0, limit)
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', 'Failed to fetch recent products', error)
    }
  }

  async findLowStockProducts(threshold: number): Promise<Product[]> {
    try {
      // This would need to be implemented based on inventory system
      // For now, return empty array as inventory is not implemented
      return []
    } catch (error) {
      throw this.createRepositoryError('DATABASE_CONNECTION_ERROR', 'Failed to fetch low stock products', error)
    }
  }

  // Command Operations (Write)
  async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const response = await $fetch<ApiResponse<Product>>(this.baseUrl, {
        method: 'POST',
        body: productData
      })

      if (!response.success) {
        throw this.createRepositoryError('VALIDATION_ERROR', response.error?.message || 'Product creation failed')
      }

      return response.data
    } catch (error) {
      throw this.createRepositoryError('VALIDATION_ERROR', 'Failed to create product', error)
    }
  }

  async update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    try {
      const response = await $fetch<ApiResponse<Product>>(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: data
      })

      if (!response.success) {
        throw this.createRepositoryError('VALIDATION_ERROR', response.error?.message || 'Product update failed')
      }

      return response.data
    } catch (error) {
      throw this.createRepositoryError('VALIDATION_ERROR', `Failed to update product ${id}`, error)
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const response = await $fetch<ApiResponse<{ deleted: boolean }>>(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      })

      return response.success && response.data.deleted
    } catch (error) {
      throw this.createRepositoryError('PRODUCT_NOT_FOUND', `Failed to delete product ${id}`, error)
    }
  }

  async activate(id: string): Promise<Product> {
    return await this.update(id, { isActive: true })
  }

  async deactivate(id: string): Promise<Product> {
    return await this.update(id, { isActive: false })
  }

  async updatePrice(id: string, newPrice: number): Promise<Product> {
    return await this.update(id, { price: newPrice })
  }

  async bulkUpdate(updates: Array<{ id: string; data: Partial<Product> }>): Promise<Product[]> {
    try {
      const response = await $fetch<ApiResponse<Product[]>>(`${this.baseUrl}/bulk`, {
        method: 'PUT',
        body: { updates }
      })

      if (!response.success) {
        throw this.createRepositoryError('VALIDATION_ERROR', 'Bulk update failed')
      }

      return response.data
    } catch (error) {
      throw this.createRepositoryError('VALIDATION_ERROR', 'Failed to bulk update products', error)
    }
  }

  // Event Sourcing (Optional)
  async getEvents(productId: string): Promise<ProductDomainEvent[]> {
    try {
      const response = await $fetch<ApiResponse<ProductDomainEvent[]>>(`${this.baseUrl}/${productId}/events`)
      return response.success ? response.data : []
    } catch (error) {
      return []
    }
  }

  async saveEvent(event: ProductDomainEvent): Promise<void> {
    try {
      await $fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        body: event
      })
    } catch (error) {
      // Event sourcing is optional, log but don't throw
      console.warn('Failed to save product event:', error)
    }
  }

  // Private Helper Methods
  private buildQueryParams(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    pagination?: { page: number; limit: number }
  ): string {
    const params = new URLSearchParams()

    if (filters) {
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.status) params.append('status', filters.status)
      if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','))
      if (filters.priceRange) {
        params.append('priceMin', filters.priceRange.min.toString())
        params.append('priceMax', filters.priceRange.max.toString())
      }
    }

    if (sort) {
      params.append('sortBy', sort.field)
      params.append('sortOrder', sort.direction)
    }

    if (pagination) {
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
    }

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }

  private isNotFoundError(error: unknown): boolean {
    return (
      (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) ||
      (error && typeof error === 'object' && 'status' in error && error.status === 404)
    )
  }

  private createRepositoryError(
    code: string,
    message: string,
    originalError?: unknown
  ): ProductRepositoryError {
    return new ProductRepositoryError(message, code as any, originalError)
  }
}

// Export singleton instance
export const productRepository = new ProductRepository()