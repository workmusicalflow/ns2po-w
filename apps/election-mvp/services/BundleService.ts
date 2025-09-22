/**
 * Bundle Service - Business Logic Layer
 * SOLID Architecture - Service Layer (SRP)
 * Orchestrates Bundle operations with validation and calculation logic
 */

import type {
  Bundle,
  BundleAggregate,
  BundleProduct,
  BundleFilters,
  BundleSortOptions,
  PaginatedBundles,
  BundleCalculation,
  BundleValidationRules
} from '../types/domain/Bundle'
import type { IBundleRepository } from '../types/repositories/BundleRepository'
import type { Product } from '../types/domain/Product'
import { bundleRepository } from '../repositories/BundleRepository'
import { productService } from './ProductService'
import { productReferenceValidator } from './ProductReferenceValidator'
import { BundleValidationRules as ValidationRules, BundleHelpers } from '../types/domain/Bundle'

export class BundleService {
  constructor(private repository: IBundleRepository = bundleRepository) {}

  // Query Operations
  async getBundle(id: string): Promise<Bundle | null> {
    this.validateId(id)
    return await this.repository.findById(id)
  }

  async getBundleAggregate(id: string): Promise<BundleAggregate | null> {
    this.validateId(id)
    return await this.repository.findAggregateById(id)
  }

  async getBundles(filters?: BundleFilters, sort?: BundleSortOptions): Promise<Bundle[]> {
    this.validateFilters(filters)
    return await this.repository.findAll(filters, sort)
  }

  async getBundlesPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: BundleFilters,
    sort?: BundleSortOptions
  ): Promise<PaginatedBundles> {
    this.validatePagination(page, limit)
    this.validateFilters(filters)

    return await this.repository.findPaginated(page, limit, filters, sort)
  }

  async searchBundles(query: string, filters?: BundleFilters): Promise<Bundle[]> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long')
    }

    this.validateFilters(filters)
    return await this.repository.search(query.trim(), filters)
  }

  async getBundlesByTargetAudience(audience: string): Promise<Bundle[]> {
    if (!audience || !['local', 'regional', 'national', 'universal'].includes(audience)) {
      throw new Error('Invalid target audience')
    }

    return await this.repository.findByTargetAudience(audience)
  }

  async getBundlesByBudgetRange(range: string): Promise<Bundle[]> {
    if (!range || !['starter', 'medium', 'premium', 'enterprise'].includes(range)) {
      throw new Error('Invalid budget range')
    }

    return await this.repository.findByBudgetRange(range)
  }

  async getFeaturedBundles(limit?: number): Promise<Bundle[]> {
    if (limit && (limit < 1 || limit > 50)) {
      throw new Error('Featured bundles limit must be between 1 and 50')
    }

    return await this.repository.findFeatured(limit)
  }

  async getPopularBundles(limit: number = 10): Promise<Bundle[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    return await this.repository.findPopularBundles(limit)
  }

  async getRecentBundles(limit: number = 10): Promise<Bundle[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    return await this.repository.findRecentBundles(limit)
  }

  async getSimilarBundles(bundleId: string, limit: number = 5): Promise<Bundle[]> {
    this.validateId(bundleId)
    if (limit < 1 || limit > 20) {
      throw new Error('Similar bundles limit must be between 1 and 20')
    }

    return await this.repository.findSimilarBundles(bundleId, limit)
  }

  async getBundlesCount(filters?: BundleFilters): Promise<number> {
    this.validateFilters(filters)
    return await this.repository.count(filters)
  }

  async bundleExists(id: string): Promise<boolean> {
    this.validateId(id)
    return await this.repository.exists(id)
  }

  // Bundle Products Management
  async getBundleProducts(bundleId: string): Promise<BundleProduct[]> {
    this.validateId(bundleId)
    return await this.repository.getBundleProducts(bundleId)
  }

  async addProductToBundle(bundleId: string, productId: string, quantity: number = 1): Promise<BundleProduct> {
    this.validateId(bundleId)
    this.validateId(productId)
    this.validateQuantity(quantity)

    // 🔒 STRICT VALIDATION - Use ProductReferenceValidator
    const validation = await productReferenceValidator.validateProductReference(productId)
    
    if (!validation.isValid) {
      const errorMessages = validation.issues
        .filter(issue => issue.severity === 'error')
        .map(issue => issue.message)
      
      throw new Error(`Cannot add product to bundle: ${errorMessages.join(', ')}`)
    }

    if (!validation.exists) {
      throw new Error(`Product with id '${productId}' not found in /admin/products interface`)
    }

    if (!validation.isActive) {
      throw new Error(`Product '${validation.currentProduct?.name || productId}' is not active and cannot be added to bundle`)
    }

    const product = validation.currentProduct!

    // 📋 Additional business validation for bundles
    const existingProducts = await this.repository.getBundleProducts(bundleId)
    const alreadyExists = existingProducts.some(bp => bp.productId === productId)
    
    if (alreadyExists) {
      throw new Error(`Product '${product.name}' is already in this bundle. Use update quantity instead.`)
    }

    const bundleProduct: BundleProduct = {
      id: `${bundleId}-${productId}`,
      productId: product.id,
      name: product.name,
      basePrice: BundleHelpers.sanitizeProductPrice(product.price || product.basePrice),
      quantity,
      subtotal: BundleHelpers.sanitizeProductPrice(product.price || product.basePrice) * quantity,
      productReference: product.reference,
      categoryId: product.category_id,
      image_url: product.image_url // Support pour les images
    }

    const result = await this.repository.addProductToBundle(bundleId, bundleProduct)

    // Recalculate bundle totals
    await this.recalculateBundleTotal(bundleId)

    // 📡 Emit event for cross-interface synchronization
    this.emitBundleEvent('bundle.product.added', bundleId, { 
      productId, 
      productName: product.name,
      bundleProduct: result 
    })

    return result
  }

  async updateProductInBundle(
    bundleId: string,
    productId: string,
    updates: { quantity?: number }
  ): Promise<BundleProduct> {
    this.validateId(bundleId)
    this.validateId(productId)

    if (updates.quantity !== undefined) {
      this.validateQuantity(updates.quantity)

      // Get current product to recalculate subtotal
      const products = await this.repository.getBundleProducts(bundleId)
      const currentProduct = products.find(p => p.productId === productId)

      if (!currentProduct) {
        throw new Error(`Product '${productId}' not found in bundle '${bundleId}'`)
      }

      updates = {
        ...updates,
        subtotal: currentProduct.basePrice * updates.quantity
      } as any
    }

    const result = await this.repository.updateProductInBundle(bundleId, productId, updates)

    // Recalculate bundle totals
    await this.recalculateBundleTotal(bundleId)

    return result
  }

  async removeProductFromBundle(bundleId: string, productId: string): Promise<boolean> {
    this.validateId(bundleId)
    this.validateId(productId)

    const result = await this.repository.removeProductFromBundle(bundleId, productId)

    if (result) {
      // Recalculate bundle totals
      await this.recalculateBundleTotal(bundleId)
    }

    return result
  }

  // Command Operations
  async createBundle(bundleData: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bundle> {
    this.validateBundleData(bundleData)

    return await this.repository.create(bundleData)
  }

  async updateBundle(
    id: string,
    updates: Partial<Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Bundle> {
    this.validateId(id)
    this.validateBundleUpdates(updates)

    return await this.repository.update(id, updates)
  }

  async deleteBundle(id: string): Promise<boolean> {
    this.validateId(id)

    // Check if bundle exists before deletion
    const exists = await this.repository.exists(id)
    if (!exists) {
      throw new Error(`Bundle with id '${id}' not found`)
    }

    return await this.repository.delete(id)
  }

  async activateBundle(id: string): Promise<Bundle> {
    this.validateId(id)
    return await this.repository.activate(id)
  }

  async deactivateBundle(id: string): Promise<Bundle> {
    this.validateId(id)
    return await this.repository.deactivate(id)
  }

  async setFeaturedBundle(id: string, featured: boolean): Promise<Bundle> {
    this.validateId(id)
    return await this.repository.setFeatured(id, featured)
  }

  // Business Logic Methods
  async calculateBundleTotal(bundleId: string): Promise<BundleCalculation> {
    const products = await this.repository.getBundleProducts(bundleId)

    const originalTotal = BundleHelpers.calculateTotal(products)
    const estimatedTotal = originalTotal * 0.9 // 10% discount for bundles
    const savings = BundleHelpers.calculateSavings(originalTotal, estimatedTotal)
    const discountPercentage = BundleHelpers.calculateDiscountPercentage(originalTotal, estimatedTotal)

    return {
      originalTotal,
      estimatedTotal,
      savings,
      discountPercentage,
      totalProducts: products.length
    }
  }

  async recalculateBundleTotal(bundleId: string): Promise<Bundle> {
    const calculation = await this.calculateBundleTotal(bundleId)
    return await this.repository.updateCalculation(bundleId, calculation)
  }

  async duplicateBundle(id: string, newName?: string): Promise<Bundle> {
    const bundle = await this.getBundleAggregate(id)
    if (!bundle) {
      throw new Error(`Bundle with id '${id}' not found`)
    }

    const duplicatedData = {
      name: newName || `${bundle.name} (Copy)`,
      description: bundle.description,
      targetAudience: bundle.targetAudience,
      budgetRange: bundle.budgetRange,
      estimatedTotal: bundle.estimatedTotal,
      originalTotal: bundle.originalTotal,
      savings: bundle.savings,
      popularity: 0, // Reset popularity for copy
      isActive: false, // Start as inactive
      isFeatured: false, // Reset featured status
      tags: [...bundle.tags]
    }

    const newBundle = await this.repository.create(duplicatedData)

    // Copy products if they exist
    if (bundle.products && bundle.products.length > 0) {
      for (const product of bundle.products) {
        await this.addProductToBundle(newBundle.id, product.productId, product.quantity)
      }
    }

    return newBundle
  }

  async validateBundleIntegrity(bundleId: string): Promise<{
    isValid: boolean
    issues: string[]
    recommendations: string[]
  }> {
    const bundle = await this.getBundle(bundleId)
    if (!bundle) {
      return {
        isValid: false,
        issues: ['Bundle not found'],
        recommendations: []
      }
    }

    const products = await this.repository.getBundleProducts(bundleId)
    const issues: string[] = []
    const recommendations: string[] = []

    // Check if bundle has products
    if (products.length === 0) {
      issues.push('Bundle has no products')
      recommendations.push('Add at least one product to the bundle')
    }

    // Check product availability
    for (const bundleProduct of products) {
      const product = await productService.getProduct(bundleProduct.productId)

      if (!product) {
        issues.push(`Product ${bundleProduct.name} (${bundleProduct.productId}) no longer exists`)
        recommendations.push(`Remove product ${bundleProduct.name} from bundle or replace with alternative`)
      } else if (!product.isActive) {
        issues.push(`Product ${bundleProduct.name} is inactive`)
        recommendations.push(`Activate product ${bundleProduct.name} or remove from bundle`)
      }
    }

    // Check total calculation
    const calculation = await this.calculateBundleTotal(bundleId)
    if (Math.abs(bundle.estimatedTotal - calculation.estimatedTotal) > 0.01) {
      issues.push('Bundle total calculation is outdated')
      recommendations.push('Recalculate bundle totals')
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * Emit bundle events for cross-interface synchronization
   */
  private emitBundleEvent(eventType: string, bundleId: string, payload: any): void {
    try {
      // Emit to global event bus if available
      if (typeof globalThis !== 'undefined' && (globalThis as any).eventBus) {
        (globalThis as any).eventBus.emit(eventType, {
          bundleId,
          timestamp: new Date().toISOString(),
          payload
        })
      }

      console.log(`📡 Emitted bundle event: ${eventType}`, { bundleId, payload })
    } catch (error) {
      console.error(`Failed to emit bundle event ${eventType}:`, error)
    }
  }

  // Private Validation Methods
  private validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Valid bundle ID is required')
    }
  }

  private validateQuantity(quantity: number): void {
    if (!BundleHelpers.validateProductQuantity(quantity)) {
      throw new Error('Quantity must be a positive integer between 1 and 1000')
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

  private validateFilters(filters?: BundleFilters): void {
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

  private validateBundleData(data: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>): void {
    // Name validation
    if (!data.name || data.name.length < ValidationRules.name.minLength || data.name.length > ValidationRules.name.maxLength) {
      throw new Error(`Bundle name must be between ${ValidationRules.name.minLength} and ${ValidationRules.name.maxLength} characters`)
    }

    // Description validation
    if (!data.description || data.description.length > ValidationRules.description.maxLength) {
      throw new Error(`Bundle description must not exceed ${ValidationRules.description.maxLength} characters`)
    }

    // Estimated total validation
    if (data.estimatedTotal < ValidationRules.estimatedTotal.min || data.estimatedTotal > ValidationRules.estimatedTotal.max) {
      throw new Error(`Estimated total must be between ${ValidationRules.estimatedTotal.min} and ${ValidationRules.estimatedTotal.max}`)
    }

    // Popularity validation
    if (data.popularity < ValidationRules.popularity.min || data.popularity > ValidationRules.popularity.max) {
      throw new Error(`Popularity must be between ${ValidationRules.popularity.min} and ${ValidationRules.popularity.max}`)
    }
  }

  private validateBundleUpdates(updates: Partial<Bundle>): void {
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.length < ValidationRules.name.minLength || updates.name.length > ValidationRules.name.maxLength) {
        throw new Error(`Bundle name must be between ${ValidationRules.name.minLength} and ${ValidationRules.name.maxLength} characters`)
      }
    }

    if (updates.description !== undefined) {
      if (updates.description && updates.description.length > ValidationRules.description.maxLength) {
        throw new Error(`Bundle description must not exceed ${ValidationRules.description.maxLength} characters`)
      }
    }

    if (updates.estimatedTotal !== undefined) {
      if (updates.estimatedTotal < ValidationRules.estimatedTotal.min || updates.estimatedTotal > ValidationRules.estimatedTotal.max) {
        throw new Error(`Estimated total must be between ${ValidationRules.estimatedTotal.min} and ${ValidationRules.estimatedTotal.max}`)
      }
    }

    if (updates.popularity !== undefined) {
      if (updates.popularity < ValidationRules.popularity.min || updates.popularity > ValidationRules.popularity.max) {
        throw new Error(`Popularity must be between ${ValidationRules.popularity.min} and ${ValidationRules.popularity.max}`)
      }
    }
  }
}

// Export singleton instance
export const bundleService = new BundleService()