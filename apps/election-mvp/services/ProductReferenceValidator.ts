/**
 * Product Reference Validator Service
 * SOLID Architecture - Single Responsibility for Cross-Domain Validation
 * Ensures referential integrity between Products and Bundles
 */

import { productService } from './ProductService'
import type { Product } from '../types/domain/Product'
import type { BundleProduct } from '../types/domain/Bundle'
import type {
  ProductReferenceValidation,
  BundleReferenceValidation,
  ProductReferenceOptions,
  ProductCacheEntry,
  BundleReferenceAction
} from '../types/domain/ProductReference'
import { ProductReferenceConfig, ProductReferenceHelpers } from '../types/domain/ProductReference'

/**
 * High-Performance Product Reference Validator
 * Implements caching, batch validation, and cross-domain integrity checks
 */
export class ProductReferenceValidator {
  private readonly productCache = new Map<string, ProductCacheEntry>()
  private readonly options: ProductReferenceOptions
  private cleanupTimer?: ReturnType<typeof setInterval>

  constructor(options: Partial<ProductReferenceOptions> = {}) {
    this.options = { ...ProductReferenceConfig.defaultOptions, ...options }
    this.setupCacheCleanup()
  }

  /**
   * Validate single product reference
   */
  async validateProductReference(productId: string): Promise<ProductReferenceValidation> {
    try {
      const product = await this.getProductWithCache(productId)
      return ProductReferenceHelpers.createValidationResult(productId, product, this.options)
    } catch (error) {
      console.error(`Error validating product reference ${productId}:`, error)

      return {
        isValid: false,
        productId,
        exists: false,
        isActive: false,
        issues: [{
          type: 'product_not_found',
          severity: 'error',
          message: `Failed to validate product '${productId}': ${error}`,
          productId
        }],
        recommendations: [`Check product '${productId}' availability and remove from bundle if necessary`]
      }
    }
  }

  /**
   * Validate bundle product with additional checks
   */
  async validateBundleProduct(bundleProduct: BundleProduct): Promise<ProductReferenceValidation> {
    const baseValidation = await this.validateProductReference(bundleProduct.productId)

    if (!baseValidation.isValid) {
      return baseValidation
    }

    const currentProduct = baseValidation.currentProduct!
    const additionalIssues = [...baseValidation.issues]
    const additionalRecommendations = [...baseValidation.recommendations]

    // Check price consistency
    if (bundleProduct.basePrice !== currentProduct.price) {
      additionalIssues.push({
        type: 'price_mismatch',
        severity: 'warning',
        message: `Price mismatch: bundle has ${bundleProduct.basePrice}, product has ${currentProduct.price}`,
        productId: bundleProduct.productId,
        productName: currentProduct.name
      })

      if (this.options.autoCorrectPrices) {
        additionalRecommendations.push(`Auto-update bundle price to ${currentProduct.price}`)
      } else {
        additionalRecommendations.push(`Update bundle price from ${bundleProduct.basePrice} to ${currentProduct.price}`)
      }
    }

    // Check name consistency
    if (bundleProduct.name !== currentProduct.name) {
      additionalIssues.push({
        type: 'name_changed',
        severity: 'info',
        message: `Product name changed from "${bundleProduct.name}" to "${currentProduct.name}"`,
        productId: bundleProduct.productId,
        productName: currentProduct.name
      })

      if (this.options.autoCorrectNames) {
        additionalRecommendations.push(`Auto-update bundle product name to "${currentProduct.name}"`)
      }
    }

    // Check category consistency
    if (bundleProduct.categoryId !== currentProduct.category_id) {
      additionalIssues.push({
        type: 'category_changed',
        severity: 'info',
        message: `Product category changed`,
        productId: bundleProduct.productId,
        productName: currentProduct.name
      })
    }

    return {
      ...baseValidation,
      issues: additionalIssues,
      recommendations: additionalRecommendations,
      isValid: additionalIssues.filter(i => i.severity === 'error').length === 0
    }
  }

  /**
   * Batch validate all products in a bundle
   */
  async validateBundleIntegrity(
    bundleId: string,
    bundleProducts: BundleProduct[]
  ): Promise<BundleReferenceValidation> {
    try {
      // Validate all products in parallel for performance
      const validationPromises = bundleProducts.map(bundleProduct =>
        this.validateBundleProduct(bundleProduct).then(validation => ({
          bundleProduct,
          validation
        }))
      )

      const results = await Promise.all(validationPromises)

      // Analyze results
      const validProducts = results.filter(r => r.validation.isValid).length
      const invalidProducts = results.filter(r => !r.validation.isValid).map(r => r.validation)
      const orphanedProducts = results.filter(r => !r.validation.exists).map(r => r.validation)

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(results)

      return {
        bundleId,
        isValid: invalidProducts.length === 0,
        totalProducts: bundleProducts.length,
        validProducts,
        invalidProducts,
        orphanedProducts,
        recommendedActions: ProductReferenceHelpers.prioritizeActions(recommendedActions),
        lastValidated: new Date().toISOString()
      }
    } catch (error) {
      console.error(`Error validating bundle integrity for ${bundleId}:`, error)
      throw new Error(`Bundle integrity validation failed: ${error}`)
    }
  }

  /**
   * Get product with intelligent caching
   */
  private async getProductWithCache(productId: string): Promise<Product | null> {
    // Check cache first
    const cached = this.productCache.get(productId)
    if (cached && !ProductReferenceHelpers.shouldRefreshCache(cached)) {
      return cached.product
    }

    // Fetch from service
    try {
      const product = await productService.getProduct(productId)

      // Cache the result (both null and valid products)
      if (product) {
        this.cacheProduct(product)
      } else {
        // Cache null result to avoid repeated failed lookups
        this.productCache.set(productId, {
          product: null as Product | null,
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + this.options.cacheTimeout).toISOString(),
          isValid: false
        })
      }

      return product
    } catch (error) {
      console.error(`Failed to fetch product ${productId}:`, error)
      return null
    }
  }

  /**
   * Cache product with expiration
   */
  private cacheProduct(product: Product): void {
    const cacheEntry: ProductCacheEntry = {
      product,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.options.cacheTimeout).toISOString(),
      isValid: true
    }

    this.productCache.set(product.id, cacheEntry)

    // Enforce cache size limit
    if (this.productCache.size > ProductReferenceConfig.cache.maxEntries) {
      this.cleanupOldEntries()
    }
  }

  /**
   * Generate recommended actions based on validation results
   */
  private generateRecommendedActions(
    results: Array<{ bundleProduct: BundleProduct; validation: ProductReferenceValidation }>
  ): BundleReferenceAction[] {
    const actions: BundleReferenceAction[] = []

    results.forEach(({ bundleProduct, validation }) => {
      validation.issues.forEach(issue => {
        switch (issue.type) {
          case 'product_not_found':
            actions.push({
              type: 'remove_orphaned_product',
              productId: bundleProduct.productId,
              productName: bundleProduct.name,
              description: `Remove non-existent product "${bundleProduct.name}" from bundle`,
              priority: 'high',
              autoExecutable: true
            })
            break

          case 'product_inactive':
            actions.push({
              type: 'reactivate_product',
              productId: bundleProduct.productId,
              productName: bundleProduct.name,
              description: `Reactivate product "${bundleProduct.name}" or remove from bundle`,
              priority: 'medium',
              autoExecutable: false
            })
            break

          case 'price_mismatch':
            actions.push({
              type: 'update_product_price',
              productId: bundleProduct.productId,
              productName: bundleProduct.name,
              description: `Update bundle price for "${bundleProduct.name}"`,
              priority: 'medium',
              autoExecutable: this.options.autoCorrectPrices
            })
            break

          case 'name_changed':
            actions.push({
              type: 'update_product_name',
              productId: bundleProduct.productId,
              productName: validation.currentProduct?.name || bundleProduct.name,
              description: `Update product name in bundle`,
              priority: 'low',
              autoExecutable: this.options.autoCorrectNames
            })
            break

          case 'bundle_calculation_outdated':
            actions.push({
              type: 'recalculate_bundle_total',
              productId: bundleProduct.productId,
              productName: bundleProduct.name,
              description: `Recalculate bundle total due to product changes`,
              priority: 'medium',
              autoExecutable: true
            })
            break
        }
      })
    })

    // Add general notification if there are critical issues
    const criticalIssues = results.filter(r =>
      r.validation.issues.some(i => i.severity === 'error')
    )

    if (criticalIssues.length > 0) {
      actions.push({
        type: 'notify_admin',
        productId: 'multiple',
        productName: 'Multiple products',
        description: `${criticalIssues.length} critical product reference issues found`,
        priority: 'high',
        autoExecutable: true
      })
    }

    return actions
  }

  /**
   * Clear expired cache entries
   */
  private cleanupOldEntries(): void {
    const toDelete: string[] = []

    this.productCache.forEach((entry, productId) => {
      if (ProductReferenceHelpers.shouldRefreshCache(entry)) {
        toDelete.push(productId)
      }
    })

    toDelete.forEach(productId => this.productCache.delete(productId))
  }

  /**
   * Setup automatic cache cleanup
   */
  private setupCacheCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldEntries()
    }, ProductReferenceConfig.cache.cleanupInterval)
  }

  /**
   * Manual cache invalidation
   */
  invalidateCache(productId?: string): void {
    if (productId) {
      this.productCache.delete(productId)
    } else {
      this.productCache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const entries = Array.from(this.productCache.values())
    const valid = entries.filter(e => e.isValid).length
    const expired = entries.filter(e => ProductReferenceHelpers.shouldRefreshCache(e)).length

    return {
      totalEntries: this.productCache.size,
      validEntries: valid,
      expiredEntries: expired,
      cacheHitRatio: this.productCache.size > 0 ? (valid / this.productCache.size) : 0
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    this.productCache.clear()
  }
}

// Singleton instance for application-wide use
export const productReferenceValidator = new ProductReferenceValidator()

// Export type-safe factory function
export function createProductReferenceValidator(
  options?: Partial<ProductReferenceOptions>
): ProductReferenceValidator {
  return new ProductReferenceValidator(options)
}