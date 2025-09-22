/**
 * Bundle Reference Validation API
 * Validates all product references in a bundle
 */

import { productReferenceValidator } from '~/services/ProductReferenceValidator'
import { bundleService } from '~/services/BundleService'
import type { BundleProduct } from '~/types/domain/Bundle'
import type { BundleReferenceValidation } from '~/types/domain/ProductReference'

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
    let bundleProducts: BundleProduct[] = []

    if (body?.products && Array.isArray(body.products)) {
      // Use products from request body (for real-time validation)
      bundleProducts = body.products
    } else {
      // Fetch current bundle products from database
      try {
        bundleProducts = await bundleService.getBundleProducts(bundleId)
      } catch (error) {
        console.warn(`Could not fetch products for bundle ${bundleId}, using empty array`)
        bundleProducts = []
      }
    }

    // Validate bundle integrity using ProductReferenceValidator
    const validation: BundleReferenceValidation = await productReferenceValidator.validateBundleIntegrity(
      bundleId,
      bundleProducts
    )

    return {
      success: true,
      data: validation
    }

  } catch (error) {
    console.error('Bundle reference validation error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: `Bundle reference validation failed: ${error}`
    })
  }
})