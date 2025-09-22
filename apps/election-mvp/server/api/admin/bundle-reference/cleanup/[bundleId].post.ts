/**
 * Bundle Reference Cleanup API
 * Automatically removes orphaned product references from bundles
 */

import { bundleIntegrityService } from '~/services/BundleIntegrityService'
import { bundleService } from '~/services/BundleService'

export default defineEventHandler(async (event) => {
  try {
    const bundleId = getRouterParam(event, 'bundleId')

    if (!bundleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bundle ID is required'
      })
    }

    const body = await readBody(event)
    const orphanedProductIds: string[] = body?.orphanedProductIds || []

    // Verify bundle exists
    const bundle = await bundleService.getBundle(bundleId)
    if (!bundle) {
      throw createError({
        statusCode: 404,
        statusMessage: `Bundle ${bundleId} not found`
      })
    }

    let removedProducts: string[] = []

    if (orphanedProductIds.length > 0) {
      // Remove specific orphaned products provided in request
      console.log(`🧹 Removing ${orphanedProductIds.length} specified orphaned products from bundle ${bundleId}`)

      for (const productId of orphanedProductIds) {
        try {
          await bundleService.removeProductFromBundle(bundleId, productId)
          removedProducts.push(productId)
        } catch (error) {
          console.error(`Failed to remove product ${productId} from bundle ${bundleId}:`, error)
        }
      }
    } else {
      // Perform full cleanup using BundleIntegrityService
      console.log(`🔍 Performing full cleanup scan for bundle ${bundleId}`)

      const result = await bundleIntegrityService.cleanupBundleOrphans(bundleId, {
        autoFix: true,
        dryRun: false
      })

      removedProducts = result.removedProducts
    }

    // Recalculate bundle totals after cleanup
    if (removedProducts.length > 0) {
      await bundleService.recalculateBundleTotal(bundleId)
    }

    const responseMessage = removedProducts.length > 0
      ? `Successfully removed ${removedProducts.length} orphaned product(s) from bundle`
      : 'No orphaned products found to remove'

    return {
      success: true,
      message: responseMessage,
      data: {
        bundleId,
        removed: removedProducts,
        cleanupCount: removedProducts.length,
        updatedAt: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Bundle reference cleanup error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: `Bundle reference cleanup failed: ${error}`
    })
  }
})