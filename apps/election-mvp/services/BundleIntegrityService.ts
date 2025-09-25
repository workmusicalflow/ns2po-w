/**
 * Bundle Integrity Service
 * SOLID Architecture - Single Responsibility for Bundle Data Integrity
 * Orchestrates automatic cleanup and maintenance of bundle-product relationships
 */

import { productReferenceValidator } from './ProductReferenceValidator'
import { bundleService } from './BundleService'
// productService not needed for current bundle integrity checks
import type { Bundle } from '../types/domain/Bundle'
import type {
  BundleReferenceValidation,
  BundleReferenceAction,
  ProductReferenceEvent
} from '../types/domain/ProductReference'

export interface BundleIntegrityReport {
  readonly timestamp: string
  readonly totalBundles: number
  readonly bundlesChecked: number
  readonly bundlesWithIssues: number
  readonly issuesFound: number
  readonly actionsExecuted: number
  readonly orphanedProductsRemoved: number
  readonly bundlesFixed: string[]
  readonly criticalIssues: string[]
  readonly recommendations: string[]
  readonly executionTimeMs: number
}

export interface BundleIntegrityOptions {
  readonly autoFix: boolean
  readonly dryRun: boolean
  readonly batchSize: number
  readonly maxConcurrency: number
  readonly notifyAdmins: boolean
  readonly preserveInactiveBundles: boolean
}

/**
 * Automated Bundle Integrity Management
 * Handles orphaned references, data synchronization, and proactive maintenance
 */
export class BundleIntegrityService {
  private readonly defaultOptions: BundleIntegrityOptions = {
    autoFix: true,
    dryRun: false,
    batchSize: 10,
    maxConcurrency: 3,
    notifyAdmins: true,
    preserveInactiveBundles: false
  }

  private isRunning = false
  private lastReport: BundleIntegrityReport | null = null

  /**
   * Full integrity check across all bundles
   */
  async performFullIntegrityCheck(
    options: Partial<BundleIntegrityOptions> = {}
  ): Promise<BundleIntegrityReport> {
    if (this.isRunning) {
      throw new Error('Integrity check already in progress')
    }

    const startTime = Date.now()
    this.isRunning = true

    try {
      const opts = { ...this.defaultOptions, ...options }
      const allBundles = await bundleService.getBundles()

      console.log(`🔍 Starting integrity check for ${allBundles.length} bundles...`)

      const report: BundleIntegrityReport = {
        timestamp: new Date().toISOString(),
        totalBundles: allBundles.length,
        bundlesChecked: 0,
        bundlesWithIssues: 0,
        issuesFound: 0,
        actionsExecuted: 0,
        orphanedProductsRemoved: 0,
        bundlesFixed: [],
        criticalIssues: [],
        recommendations: [],
        executionTimeMs: 0
      }

      // Process bundles in batches for performance
      const batches = this.createBatches(allBundles, opts.batchSize)

      for (const batch of batches) {
        await this.processBundleBatch(batch, opts, report)
      }

      report.executionTimeMs = Date.now() - startTime
      this.lastReport = report

      console.log(`✅ Integrity check completed:`, {
        bundlesChecked: report.bundlesChecked,
        issuesFound: report.issuesFound,
        actionsExecuted: report.actionsExecuted,
        executionTime: `${report.executionTimeMs}ms`
      })

      return report

    } finally {
      this.isRunning = false
    }
  }

  /**
   * Check integrity for a specific bundle
   */
  async checkBundleIntegrity(
    bundleId: string,
    options: Partial<BundleIntegrityOptions> = {}
  ): Promise<BundleReferenceValidation> {
    const opts = { ...this.defaultOptions, ...options }

    try {
      // Get bundle and its products
      const bundle = await bundleService.getBundle(bundleId)
      if (!bundle) {
        throw new Error(`Bundle ${bundleId} not found`)
      }

      const bundleProducts = await bundleService.getBundleProducts(bundleId)

      // Validate using ProductReferenceValidator
      const validation = await productReferenceValidator.validateBundleIntegrity(
        bundleId,
        bundleProducts
      )

      // Execute auto-fixes if enabled
      if (opts.autoFix && !opts.dryRun && validation.recommendedActions.length > 0) {
        await this.executeBundleActions(bundleId, validation.recommendedActions, opts)
      }

      return validation

    } catch (error) {
      console.error(`Error checking bundle integrity for ${bundleId}:`, error)
      throw error
    }
  }

  /**
   * Cleanup orphaned products from a specific bundle
   */
  async cleanupBundleOrphans(
    bundleId: string,
    options: Partial<BundleIntegrityOptions> = {}
  ): Promise<{ removedProducts: string[]; updatedBundle: Bundle | null }> {
    const opts = { ...this.defaultOptions, ...options }
    const removedProducts: string[] = []

    try {
      const validation = await this.checkBundleIntegrity(bundleId, { ...opts, autoFix: false })

      if (validation.orphanedProducts.length === 0) {
        return { removedProducts, updatedBundle: null }
      }

      console.log(`🧹 Cleaning ${validation.orphanedProducts.length} orphaned products from bundle ${bundleId}`)

      if (!opts.dryRun) {
        // Remove orphaned products
        for (const orphan of validation.orphanedProducts) {
          await bundleService.removeProductFromBundle(bundleId, orphan.productId)
          removedProducts.push(orphan.productId)
        }

        // Recalculate bundle totals
        await bundleService.recalculateBundleTotal(bundleId)
      }

      const updatedBundle = opts.dryRun ? null : await bundleService.getBundle(bundleId)

      return { removedProducts, updatedBundle }

    } catch (error) {
      console.error(`Error cleaning bundle orphans for ${bundleId}:`, error)
      throw error
    }
  }

  /**
   * Handle product deletion event
   */
  async handleProductDeleted(productId: string): Promise<void> {
    try {
      console.log(`🔄 Handling product deletion: ${productId}`)

      // Find all bundles containing this product
      const allBundles = await bundleService.getBundles()
      const affectedBundles: string[] = []

      for (const bundle of allBundles) {
        const bundleProducts = await bundleService.getBundleProducts(bundle.id)
        if (bundleProducts.some(bp => bp.productId === productId)) {
          affectedBundles.push(bundle.id)
        }
      }

      console.log(`Found ${affectedBundles.length} bundles affected by product deletion`)

      // Clean up affected bundles
      for (const bundleId of affectedBundles) {
        await this.cleanupBundleOrphans(bundleId, { autoFix: true, dryRun: false })
      }

      // Emit events for UI synchronization
      this.emitProductReferenceEvent({
        eventType: 'product.reference.orphaned',
        productId,
        bundleIds: affectedBundles,
        payload: { reason: 'product_deleted', affectedBundles: affectedBundles.length }
      })

    } catch (error) {
      console.error(`Error handling product deletion ${productId}:`, error)
    }
  }

  /**
   * Handle product deactivation event
   */
  async handleProductDeactivated(productId: string): Promise<void> {
    try {
      console.log(`⚠️ Handling product deactivation: ${productId}`)

      // Find affected bundles
      const allBundles = await bundleService.getBundles()
      const affectedBundles: string[] = []

      for (const bundle of allBundles) {
        const bundleProducts = await bundleService.getBundleProducts(bundle.id)
        if (bundleProducts.some(bp => bp.productId === productId)) {
          affectedBundles.push(bundle.id)
        }
      }

      console.log(`Found ${affectedBundles.length} bundles affected by product deactivation`)

      // Emit warning events for admin notification
      this.emitProductReferenceEvent({
        eventType: 'product.reference.invalid',
        productId,
        bundleIds: affectedBundles,
        payload: { reason: 'product_deactivated', requiresAttention: true }
      })

    } catch (error) {
      console.error(`Error handling product deactivation ${productId}:`, error)
    }
  }

  /**
   * Execute recommended actions for a bundle
   */
  private async executeBundleActions(
    bundleId: string,
    actions: BundleReferenceAction[],
    options: BundleIntegrityOptions
  ): Promise<number> {
    let executedCount = 0

    const autoExecutableActions = actions.filter(action => action.autoExecutable)

    for (const action of autoExecutableActions) {
      try {
        switch (action.type) {
          case 'remove_orphaned_product':
            if (!options.dryRun) {
              await bundleService.removeProductFromBundle(bundleId, action.productId)
            }
            console.log(`🗑️ Removed orphaned product ${action.productName} from bundle ${bundleId}`)
            break

          case 'update_product_price':
            // This would require current product price - implement if needed
            console.log(`💰 Price update needed for ${action.productName} in bundle ${bundleId}`)
            break

          case 'recalculate_bundle_total':
            if (!options.dryRun) {
              await bundleService.recalculateBundleTotal(bundleId)
            }
            console.log(`🧮 Recalculated totals for bundle ${bundleId}`)
            break

          case 'notify_admin':
            if (options.notifyAdmins) {
              console.warn(`🚨 Admin notification: ${action.description}`)
              // Implement admin notification system here
            }
            break
        }

        executedCount++

      } catch (error) {
        console.error(`Error executing action ${action.type} for bundle ${bundleId}:`, error)
      }
    }

    return executedCount
  }

  /**
   * Process a batch of bundles
   */
  private async processBundleBatch(
    bundles: Bundle[],
    options: BundleIntegrityOptions,
    report: BundleIntegrityReport
  ): Promise<void> {
    const promises = bundles.map(async (bundle) => {
      try {
        const validation = await this.checkBundleIntegrity(bundle.id, options)

        report.bundlesChecked++

        if (!validation.isValid) {
          report.bundlesWithIssues++
          report.issuesFound += validation.invalidProducts.length

          if (validation.orphanedProducts.length > 0) {
            report.orphanedProductsRemoved += validation.orphanedProducts.length
          }

          // Execute auto-fixes
          if (options.autoFix && !options.dryRun) {
            const actionsExecuted = await this.executeBundleActions(
              bundle.id,
              validation.recommendedActions,
              options
            )
            report.actionsExecuted += actionsExecuted

            if (actionsExecuted > 0) {
              report.bundlesFixed.push(bundle.id)
            }
          }

          // Collect critical issues
          const criticalActions = validation.recommendedActions.filter(a => a.priority === 'high')
          if (criticalActions.length > 0) {
            report.criticalIssues.push(
              `Bundle ${bundle.name} (${bundle.id}): ${criticalActions.length} critical issues`
            )
          }
        }

      } catch (error) {
        console.error(`Error processing bundle ${bundle.id}:`, error)
        report.criticalIssues.push(`Bundle ${bundle.id}: Processing failed - ${error}`)
      }
    })

    await Promise.all(promises)
  }

  /**
   * Create batches for processing
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * Emit product reference event for cross-interface synchronization
   */
  private emitProductReferenceEvent(
    event: Omit<ProductReferenceEvent, 'eventId' | 'timestamp'>
  ): void {
    const fullEvent: ProductReferenceEvent = {
      eventId: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    }

    // Emit to global event bus
    if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).eventBus) {
      ((globalThis as Record<string, unknown>).eventBus as { emit: (event: string, data: unknown) => void }).emit('product.reference.event', fullEvent)
    }

    console.log(`📡 Emitted product reference event:`, fullEvent)
  }

  /**
   * Get last integrity report
   */
  getLastReport(): BundleIntegrityReport | null {
    return this.lastReport
  }

  /**
   * Check if integrity service is currently running
   */
  isIntegrityCheckRunning(): boolean {
    return this.isRunning
  }

  /**
   * Schedule periodic integrity checks
   */
  schedulePeriodicCheck(intervalMs: number = 3600000): ReturnType<typeof setInterval> { // Default 1 hour
    return setInterval(async () => {
      try {
        console.log('🕐 Running scheduled integrity check...')
        await this.performFullIntegrityCheck({ dryRun: false, autoFix: true })
      } catch (error) {
        console.error('Scheduled integrity check failed:', error)
      }
    }, intervalMs)
  }
}

// Singleton instance for application-wide use
export const bundleIntegrityService = new BundleIntegrityService()

// Export factory function
export function createBundleIntegrityService(): BundleIntegrityService {
  return new BundleIntegrityService()
}