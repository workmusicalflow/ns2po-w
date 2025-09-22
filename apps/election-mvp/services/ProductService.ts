/**
 * Product Service - Business Logic Layer
 * SOLID Architecture - Service Layer (SRP)
 * Orchestrates Product operations with validation and caching
 */

import type {
  Product,
  ProductAggregate,
  ProductFilters,
  ProductSortOptions,
  PaginatedProducts
} from '../types/domain/Product'
import type { IProductRepository } from '../types/repositories/ProductRepository'
import { productRepository } from '../repositories/ProductRepository'
import { ProductValidationRules as ValidationRules } from '../types/domain/Product'

// 🔄 Event Bus Integration
import { useEventEmitter } from '../stores/useGlobalEventBus'
import { bundleIntegrityService } from './BundleIntegrityService'

export class ProductService {
  private eventEmitter: ReturnType<typeof useEventEmitter> | null = null

  constructor(private repository: IProductRepository = productRepository) {
    // Initialize event emitter only on client side
    if (typeof window !== 'undefined') {
      this.eventEmitter = useEventEmitter()
    }
  }

  // Query Operations
  async getProduct(id: string): Promise<Product | null> {
    this.validateId(id)
    return await this.repository.findById(id)
  }

  async getProductAggregate(id: string): Promise<ProductAggregate | null> {
    this.validateId(id)
    return await this.repository.findAggregateById(id)
  }

  async getProducts(filters?: ProductFilters, sort?: ProductSortOptions): Promise<Product[]> {
    this.validateFilters(filters)
    return await this.repository.findAll(filters, sort)
  }

  async getProductsPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: ProductFilters,
    sort?: ProductSortOptions
  ): Promise<PaginatedProducts> {
    this.validatePagination(page, limit)
    this.validateFilters(filters)

    return await this.repository.findPaginated(page, limit, filters, sort)
  }

  async searchProducts(query: string, filters?: ProductFilters): Promise<Product[]> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long')
    }

    this.validateFilters(filters)
    return await this.repository.search(query.trim(), filters)
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    this.validateId(categoryId)
    return await this.repository.findByCategory(categoryId)
  }

  async getProductByReference(reference: string): Promise<Product | null> {
    if (!reference || !ValidationRules.reference.pattern.test(reference)) {
      throw new Error('Invalid product reference format')
    }

    return await this.repository.findByReference(reference)
  }

  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    return await this.repository.findPopularProducts(limit)
  }

  async getRecentProducts(limit: number = 10): Promise<Product[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    return await this.repository.findRecentProducts(limit)
  }

  async getProductsCount(filters?: ProductFilters): Promise<number> {
    this.validateFilters(filters)
    return await this.repository.count(filters)
  }

  async productExists(id: string): Promise<boolean> {
    this.validateId(id)
    return await this.repository.exists(id)
  }

  // Command Operations with Event Bus Integration
  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    this.validateProductData(productData)

    // Check if product with same reference already exists
    const existingProduct = await this.repository.findByReference(productData.reference)
    if (existingProduct) {
      throw new Error(`Product with reference '${productData.reference}' already exists`)
    }

    const product = await this.repository.create(productData)

    // 🔄 Emit product.created event
    this.eventEmitter?.product.created(product)

    console.log(`📦 Product created: ${product.name} (ID: ${product.id})`)
    return product
  }

  async updateProduct(
    id: string,
    updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Product> {
    this.validateId(id)
    this.validateProductUpdates(updates)

    // Get the current product for change detection
    const currentProduct = await this.repository.findById(id)
    if (!currentProduct) {
      throw new Error(`Product with id '${id}' not found`)
    }

    // If updating reference, check for conflicts
    if (updates.reference) {
      const existingProduct = await this.repository.findByReference(updates.reference)
      if (existingProduct && existingProduct.id !== id) {
        throw new Error(`Product with reference '${updates.reference}' already exists`)
      }
    }

    const updatedProduct = await this.repository.update(id, updates)

    // 🔄 Emit product.updated event with change detection
    const changes = this.detectChanges(currentProduct, updates)
    this.eventEmitter?.product.updated(id, updatedProduct, changes)

    console.log(`📝 Product updated: ${updatedProduct.name} (ID: ${id})`, changes)
    return updatedProduct
  }

  async deleteProduct(id: string): Promise<boolean> {
    this.validateId(id)

    // Check if product exists before deletion
    const product = await this.repository.findById(id)
    if (!product) {
      throw new Error(`Product with id '${id}' not found`)
    }

    const success = await this.repository.delete(id)

    if (success) {
      // 🔄 Emit product.deleted event FIRST
      this.eventEmitter?.product.deleted(id)

      // 🧹 Trigger automatic bundle cleanup (async, non-blocking)
      setTimeout(async () => {
        try {
          await bundleIntegrityService.handleProductDeleted(id)
          console.log(`🧹 Bundle cleanup completed for deleted product: ${id}`)
        } catch (error) {
          console.error(`❌ Bundle cleanup failed for deleted product ${id}:`, error)
        }
      }, 100)

      console.log(`🗑️ Product deleted: ${product.name} (ID: ${id})`)
    }

    return success
  }

  async activateProduct(id: string): Promise<Product> {
    this.validateId(id)
    const product = await this.repository.activate(id)

    console.log(`✅ Product activated: ${product.name} (ID: ${id})`)
    return product
  }

  async deactivateProduct(id: string): Promise<Product> {
    this.validateId(id)
    const product = await this.repository.deactivate(id)

    // 🔄 Emit product.deactivated event
    this.eventEmitter?.product.deleted(id) // Use deleted for consistency with bundle cleanup

    // 🚨 Optional: Warning about bundles containing this product
    setTimeout(async () => {
      try {
        const issues = await bundleIntegrityService.detectOrphanedProducts()
        const affectedBundles = issues.filter(issue => 
          issue.orphanedProducts.includes(id)
        )

        if (affectedBundles.length > 0) {
          console.warn(`⚠️ Product deactivated but still referenced in ${affectedBundles.length} bundle(s):`, 
            affectedBundles.map(b => b.bundleId))
        }
      } catch (error) {
        console.error(`❌ Bundle integrity check failed for deactivated product ${id}:`, error)
      }
    }, 100)

    console.log(`❌ Product deactivated: ${product.name} (ID: ${id})`)
    return product
  }

  async updateProductPrice(id: string, newPrice: number): Promise<Product> {
    this.validateId(id)

    if (newPrice < ValidationRules.basePrice.min || newPrice > ValidationRules.basePrice.max) {
      throw new Error(`Price must be between ${ValidationRules.basePrice.min} and ${ValidationRules.basePrice.max}`)
    }

    const currentProduct = await this.repository.findById(id)
    if (!currentProduct) {
      throw new Error(`Product with id '${id}' not found`)
    }

    const oldPrice = currentProduct.price
    const updatedProduct = await this.repository.updatePrice(id, newPrice)

    // 🔄 Emit product.updated with price change
    const changes = { price: oldPrice }
    this.eventEmitter?.product.updated(id, updatedProduct, changes)

    console.log(`💰 Product price updated: ${updatedProduct.name} (${oldPrice} → ${newPrice})`)
    return updatedProduct
  }

  async bulkUpdateProducts(
    updates: Array<{ id: string; data: Partial<Product> }>
  ): Promise<Product[]> {
    if (!updates || updates.length === 0) {
      throw new Error('No updates provided')
    }

    if (updates.length > 100) {
      throw new Error('Cannot update more than 100 products at once')
    }

    // Validate each update
    for (const update of updates) {
      this.validateId(update.id)
      this.validateProductUpdates(update.data)
    }

    const results = await this.repository.bulkUpdate(updates)

    // 🔄 Emit individual update events for each product
    for (let i = 0; i < results.length; i++) {
      const product = results[i]
      const updateData = updates[i]
      
      this.eventEmitter?.product.updated(product.id, product, updateData.data)
    }

    console.log(`📦 Bulk updated ${results.length} products`)
    return results
  }

  // Business Logic Methods
  async calculateProductMetrics(id: string): Promise<{
    totalBundles: number
    averageRating: number
    salesCount: number
  }> {
    const product = await this.getProductAggregate(id)
    if (!product) {
      throw new Error(`Product with id '${id}' not found`)
    }

    return {
      totalBundles: product.bundlesCount || 0,
      averageRating: 0, // Would be calculated from reviews
      salesCount: 0 // Would be calculated from orders
    }
  }

  async suggestSimilarProducts(id: string, limit: number = 5): Promise<Product[]> {
    const product = await this.getProduct(id)
    if (!product) {
      throw new Error(`Product with id '${id}' not found`)
    }

    // Find similar products by category and price range
    const filters: ProductFilters = {
      category: product.category,
      priceRange: {
        min: Math.max(0, product.price * 0.7),
        max: product.price * 1.3
      }
    }

    const similarProducts = await this.repository.findAll(filters)
    return similarProducts
      .filter(p => p.id !== id)
      .slice(0, limit)
  }

  // 🔄 Helper method for change detection
  private detectChanges(currentProduct: Product, updates: Partial<Product>): Partial<Product> {
    const changes: Partial<Product> = {}
    
    Object.keys(updates).forEach(key => {
      const typedKey = key as keyof Product
      if (currentProduct[typedKey] !== updates[typedKey]) {
        changes[typedKey] = currentProduct[typedKey] as Product[keyof Product]
      }
    })

    return changes
  }

  // Private Validation Methods
  private validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid product ID is required')
    }
  }

  private validatePagination(page: number, limit: number): void {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be a positive integer')
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }
  }

  private validateFilters(filters?: ProductFilters): void {
    if (!filters) return

    if (filters.priceRange) {
      if (filters.priceRange.min < 0 || filters.priceRange.max < 0) {
        throw new Error('Price range values must be non-negative')
      }
      if (filters.priceRange.min > filters.priceRange.max) {
        throw new Error('Price range minimum cannot be greater than maximum')
      }
    }

    if (filters.tags && filters.tags.length > 20) {
      throw new Error('Cannot filter by more than 20 tags')
    }
  }

  private validateProductData(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Name validation
    if (!data.name || data.name.length < ValidationRules.name.minLength || data.name.length > ValidationRules.name.maxLength) {
      throw new Error(`Product name must be between ${ValidationRules.name.minLength} and ${ValidationRules.name.maxLength} characters`)
    }

    // Description validation
    if (!data.description || data.description.length > ValidationRules.description.maxLength) {
      throw new Error(`Product description must not exceed ${ValidationRules.description.maxLength} characters`)
    }

    // Reference validation
    if (!data.reference || !ValidationRules.reference.pattern.test(data.reference)) {
      throw new Error('Product reference must contain only uppercase letters, numbers, and hyphens')
    }

    // Price validation
    if (data.basePrice < ValidationRules.basePrice.min || data.basePrice > ValidationRules.basePrice.max) {
      throw new Error(`Base price must be between ${ValidationRules.basePrice.min} and ${ValidationRules.basePrice.max}`)
    }

    if (data.price < ValidationRules.basePrice.min || data.price > ValidationRules.basePrice.max) {
      throw new Error(`Price must be between ${ValidationRules.basePrice.min} and ${ValidationRules.basePrice.max}`)
    }

    // Category validation
    if (!data.category_id || typeof data.category_id !== 'string') {
      throw new Error('Valid category ID is required')
    }
  }

  private validateProductUpdates(updates: Partial<Product>): void {
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.length < ValidationRules.name.minLength || updates.name.length > ValidationRules.name.maxLength) {
        throw new Error(`Product name must be between ${ValidationRules.name.minLength} and ${ValidationRules.name.maxLength} characters`)
      }
    }

    if (updates.description !== undefined) {
      if (updates.description && updates.description.length > ValidationRules.description.maxLength) {
        throw new Error(`Product description must not exceed ${ValidationRules.description.maxLength} characters`)
      }
    }

    if (updates.reference !== undefined) {
      if (!updates.reference || !ValidationRules.reference.pattern.test(updates.reference)) {
        throw new Error('Product reference must contain only uppercase letters, numbers, and hyphens')
      }
    }

    if (updates.basePrice !== undefined) {
      if (updates.basePrice < ValidationRules.basePrice.min || updates.basePrice > ValidationRules.basePrice.max) {
        throw new Error(`Base price must be between ${ValidationRules.basePrice.min} and ${ValidationRules.basePrice.max}`)
      }
    }

    if (updates.price !== undefined) {
      if (updates.price < ValidationRules.basePrice.min || updates.price > ValidationRules.basePrice.max) {
        throw new Error(`Price must be between ${ValidationRules.basePrice.min} and ${ValidationRules.basePrice.max}`)
      }
    }
  }
}

// Export singleton instance
export const productService = new ProductService()