/**
 * Bundle Service - Business Logic Layer (DEPRECATED)
 * SOLID Architecture - Service Layer (SRP)
 *
 * ⚠️ DEPRECATED: This service is being replaced by Vue Query.
 * New implementations should use useBundlesQuery composable instead.
 *
 * FIXME: This service has been partially refactored to remove BundleRepository
 * Some methods still need implementation or should be migrated to Vue Query
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
// NOTE: BundleRepository removed - Vue Query now handles data layer
// import type { IBundleRepository } from '../types/repositories/BundleRepository'
import type { Product } from '../types/domain/Product'
// import { bundleRepository } from '../repositories/BundleRepository'
import { productService } from './ProductService'
import { productReferenceValidator } from './ProductReferenceValidator'
import { BundleValidationRules as ValidationRules, BundleHelpers } from '../types/domain/Bundle'
import type { BundleApiResponse, SingleBundleApiResponse } from '../types/api'

export class BundleService {
  // NOTE: Repository pattern replaced by Vue Query + direct API calls
  constructor() {}

  // Query Operations
  async getBundle(id: string): Promise<Bundle | null> {
    this.validateId(id)
    
    try {
      const response = await $fetch<SingleBundleApiResponse>(`/api/campaign-bundles/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error(`Error fetching bundle ${id}:`, error)
      return null
    }
  }

  async getBundleAggregate(id: string): Promise<BundleAggregate | null> {
    this.validateId(id)
    
    try {
      const response = await $fetch<SingleBundleApiResponse>(`/api/campaign-bundles/${id}`)
      return response.success ? response.data as BundleAggregate : null
    } catch (error) {
      console.error(`Error fetching bundle aggregate ${id}:`, error)
      return null
    }
  }

  async getBundles(filters?: BundleFilters, sort?: BundleSortOptions): Promise<Bundle[]> {
    this.validateFilters(filters)
    
    try {
      const queryParams = new URLSearchParams()
      
      if (filters) {
        if (filters.isActive !== undefined) queryParams.set('isActive', String(filters.isActive))
        if (filters.targetAudience) queryParams.set('targetAudience', filters.targetAudience)
        if (filters.budgetRange) queryParams.set('budgetRange', filters.budgetRange)
        if (filters.tags?.length) queryParams.set('tags', filters.tags.join(','))
      }
      
      if (sort) {
        if (sort.field) queryParams.set('sortBy', sort.field)
        if (sort.direction) queryParams.set('sortOrder', sort.direction)
      }
      
      const response = await $fetch<BundleApiResponse>(`/api/campaign-bundles?${queryParams}`)
      return response.success ? response.data : []
    } catch (error) {
      console.error('Error fetching bundles:', error)
      return []
    }
  }

  async getBundlesPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: BundleFilters,
    sort?: BundleSortOptions
  ): Promise<PaginatedBundles> {
    this.validatePagination(page, limit)
    this.validateFilters(filters)

    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles(filters, sort)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return {
      data: bundles.slice(startIndex, endIndex),
      pagination: {
        page,
        limit,
        total: bundles.length,
        hasMore: endIndex < bundles.length
      }
    }
  }

  async searchBundles(query: string, filters?: BundleFilters): Promise<Bundle[]> {
    if (!query || query.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters long')
    }

    this.validateFilters(filters)
    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles(filters)
    const searchTerm = query.trim().toLowerCase()

    return bundles.filter(bundle =>
      bundle.name.toLowerCase().includes(searchTerm) ||
      bundle.description.toLowerCase().includes(searchTerm)
    )
  }

  async getBundlesByTargetAudience(audience: string): Promise<Bundle[]> {
    if (!audience || !['local', 'regional', 'national', 'universal'].includes(audience)) {
      throw new Error('Invalid target audience')
    }

    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles()
    return bundles.filter(bundle => bundle.targetAudience === audience)
  }

  async getBundlesByBudgetRange(range: string): Promise<Bundle[]> {
    if (!range || !['starter', 'medium', 'premium', 'enterprise'].includes(range)) {
      throw new Error('Invalid budget range')
    }

    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles()
    return bundles.filter(bundle => bundle.budgetRange === range)
  }

  async getFeaturedBundles(limit?: number): Promise<Bundle[]> {
    if (limit && (limit < 1 || limit > 50)) {
      throw new Error('Featured bundles limit must be between 1 and 50')
    }

    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles()
    const featured = bundles.filter(bundle => bundle.isFeatured)
    return limit ? featured.slice(0, limit) : featured
  }

  async getPopularBundles(limit: number = 10): Promise<Bundle[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles()
    return bundles
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit)
  }

  async getRecentBundles(limit: number = 10): Promise<Bundle[]> {
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100')
    }

    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles()
    return bundles
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit)
  }

  async getSimilarBundles(bundleId: string, limit: number = 5): Promise<Bundle[]> {
    this.validateId(bundleId)
    if (limit < 1 || limit > 20) {
      throw new Error('Similar bundles limit must be between 1 and 20')
    }

    // FIXME: Replace with Vue Query implementation
    const bundle = await this.getBundle(bundleId)
    if (!bundle) return []

    const bundles = await this.getBundles()
    return bundles
      .filter(b => b.id !== bundleId && b.targetAudience === bundle.targetAudience)
      .slice(0, limit)
  }

  async getBundlesCount(filters?: BundleFilters): Promise<number> {
    this.validateFilters(filters)
    // FIXME: Replace with Vue Query implementation
    const bundles = await this.getBundles(filters)
    return bundles.length
  }

  async bundleExists(id: string): Promise<boolean> {
    this.validateId(id)
    // FIXME: Replace with Vue Query implementation
    const bundle = await this.getBundle(id)
    return bundle !== null
  }

  // Bundle Products Management
  async getBundleProducts(bundleId: string): Promise<BundleProduct[]> {
    this.validateId(bundleId)
    
    try {
      const response = await $fetch<SingleBundleApiResponse>(`/api/campaign-bundles/${bundleId}`)
      if (response.success && response.data) {
        return response.data.products || []
      }
      return []
    } catch (error) {
      console.error(`Error fetching bundle products for ${bundleId}:`, error)
      return []
    }
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
    const existingProducts = await this.getBundleProducts(bundleId)
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

    // FIXME: Replace with direct API call
    try {
      const response = await $fetch(`/api/campaign-bundles/${bundleId}/products`, {
        method: 'POST',
        body: { productId, quantity }
      })
      
      // Recalculate bundle totals
      await this.recalculateBundleTotal(bundleId)

      // 📡 Emit event for cross-interface synchronization
      this.emitBundleEvent('bundle.product.added', bundleId, { 
        productId, 
        productName: product.name,
        bundleProduct: bundleProduct 
      })

      return bundleProduct
    } catch (error) {
      console.error(`Error adding product to bundle ${bundleId}:`, error)
      throw error
    }
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
      const products = await this.getBundleProducts(bundleId)
      const currentProduct = products.find(p => p.productId === productId)

      if (!currentProduct) {
        throw new Error(`Product '${productId}' not found in bundle '${bundleId}'`)
      }

      updates = {
        ...updates,
        subtotal: currentProduct.basePrice * updates.quantity
      } as any
    }

    // FIXME: Replace with direct API call
    try {
      const response = await $fetch(`/api/campaign-bundles/${bundleId}/products/${productId}`, {
        method: 'PUT',
        body: updates
      })

      // Recalculate bundle totals
      await this.recalculateBundleTotal(bundleId)

      // Return updated product (stub)
      const products = await this.getBundleProducts(bundleId)
      const updatedProduct = products.find(p => p.productId === productId)
      
      if (!updatedProduct) {
        throw new Error(`Failed to find updated product ${productId}`)
      }

      return updatedProduct
    } catch (error) {
      console.error(`Error updating product in bundle ${bundleId}:`, error)
      throw error
    }
  }

  async removeProductFromBundle(bundleId: string, productId: string): Promise<boolean> {
    this.validateId(bundleId)
    this.validateId(productId)

    // FIXME: Replace with direct API call
    try {
      const response = await $fetch(`/api/campaign-bundles/${bundleId}/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.success) {
        // Recalculate bundle totals
        await this.recalculateBundleTotal(bundleId)
      }

      return response.success
    } catch (error) {
      console.error(`Error removing product from bundle ${bundleId}:`, error)
      return false
    }
  }

  // Command Operations
  async createBundle(bundleData: Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bundle> {
    this.validateBundleData(bundleData)

    try {
      const response = await $fetch<SingleBundleApiResponse>('/api/campaign-bundles', {
        method: 'POST',
        body: bundleData
      })
      
      if (response.success) {
        return response.data
      }
      
      throw new Error('Failed to create bundle')
    } catch (error) {
      console.error('Error creating bundle:', error)
      throw error
    }
  }

  async updateBundle(
    id: string,
    updates: Partial<Omit<Bundle, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Bundle> {
    this.validateId(id)
    this.validateBundleUpdates(updates)

    try {
      const response = await $fetch<SingleBundleApiResponse>(`/api/campaign-bundles/${id}`, {
        method: 'PUT',
        body: updates
      })
      
      if (response.success) {
        return response.data
      }
      
      throw new Error('Failed to update bundle')
    } catch (error) {
      console.error(`Error updating bundle ${id}:`, error)
      throw error
    }
  }

  async deleteBundle(id: string): Promise<boolean> {
    this.validateId(id)

    try {
      // Check if bundle exists before deletion
      const bundle = await this.getBundle(id)
      if (!bundle) {
        throw new Error(`Bundle with id '${id}' not found`)
      }

      const response = await $fetch<SingleBundleApiResponse>(`/api/campaign-bundles/${id}`, {
        method: 'DELETE'
      })
      
      return response.success
    } catch (error) {
      console.error(`Error deleting bundle ${id}:`, error)
      throw error
    }
  }

  async activateBundle(id: string): Promise<Bundle> {
    this.validateId(id)
    // FIXME: Replace with Vue Query implementation
    return await this.updateBundle(id, { isActive: true })
  }

  async deactivateBundle(id: string): Promise<Bundle> {
    this.validateId(id)
    // FIXME: Replace with Vue Query implementation
    return await this.updateBundle(id, { isActive: false })
  }

  async setFeaturedBundle(id: string, featured: boolean): Promise<Bundle> {
    this.validateId(id)
    // FIXME: Replace with Vue Query implementation
    return await this.updateBundle(id, { isFeatured: featured })
  }

  // Business Logic Methods
  async calculateBundleTotal(bundleId: string): Promise<BundleCalculation> {
    const products = await this.getBundleProducts(bundleId)

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
    // FIXME: Replace with direct API call for bundle total update
    return await this.updateBundle(bundleId, {
      estimatedTotal: calculation.estimatedTotal,
      originalTotal: calculation.originalTotal,
      savings: calculation.savings
    })
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

    const newBundle = await this.createBundle(duplicatedData)

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

    const products = await this.getBundleProducts(bundleId)
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
      throw new Error('Quantity must be a positive integer')
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