/**
 * Product Reference Validation API
 * Validates single product reference for bundle integration
 */

import { productReferenceValidator } from '~/services/ProductReferenceValidator'
import type { ProductReferenceValidation } from '~/types/domain/ProductReference'

export default defineEventHandler(async (event) => {
  try {
    const productId = getRouterParam(event, 'productId')

    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Product ID is required'
      })
    }

    // Validate product reference using ProductReferenceValidator
    const validation: ProductReferenceValidation = await productReferenceValidator.validateProductReference(productId)

    return {
      success: true,
      data: validation
    }

  } catch (error) {
    console.error('Product reference validation error:', error)

    throw createError({
      statusCode: 500,
      statusMessage: `Product reference validation failed: ${error}`
    })
  }
})