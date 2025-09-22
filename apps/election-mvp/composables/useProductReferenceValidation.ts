/**
 * Product Reference Validation Composable
 * SOLID Architecture - Single Responsibility for Frontend Validation
 * Real-time validation for product references in bundles
 */

import { ref, reactive, computed, watch, isRef, readonly, type Ref } from 'vue'
import { useQuery, useMutation } from '@tanstack/vue-query'
import type { Product } from '../types/domain/Product'
import type { BundleProduct } from '../types/domain/Bundle'
import type {
  ProductReferenceValidation,
  BundleReferenceValidation,
  ProductReferenceOptions
} from '../types/domain/ProductReference'
import { globalNotifications } from './useNotifications'

// Query keys for caching
const productReferenceQueryKeys = {
  validation: (productId: string) => ['product-reference', 'validation', productId],
  bundleValidation: (bundleId: string) => ['product-reference', 'bundle', bundleId]
} as const

/**
 * Single Product Reference Validation
 */
export function useProductReferenceValidation(
  productId: string | Ref<string>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options: Partial<ProductReferenceOptions> = {}
) {
  const productIdRef = isRef(productId) ? productId : ref(productId)
  const { crudError, crudWarning } = globalNotifications

  // Reactive validation state
  const validationState = reactive({
    isValid: false,
    isLoading: false,
    lastChecked: null as string | null,
    issues: [] as ProductReferenceValidation['issues'],
    recommendations: [] as string[]
  })

  // Query for real-time validation
  const validationQuery = useQuery({
    queryKey: computed(() => productReferenceQueryKeys.validation(productIdRef.value)),
    queryFn: async (): Promise<ProductReferenceValidation> => {
      if (!productIdRef.value) {
        throw new Error('Product ID is required for validation')
      }

      const response = await $fetch<{ success: boolean; data: ProductReferenceValidation }>(
        `/api/admin/product-reference/validate/${productIdRef.value}`,
        { method: 'GET' }
      )

      if (!response.success) {
        throw new Error('Failed to validate product reference')
      }

      return response.data
    },
    enabled: computed(() => !!productIdRef.value),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true
  })

  // Update reactive state when query data changes
  watch(
    () => validationQuery.data.value,
    (validation) => {
      if (validation) {
        validationState.isValid = validation.isValid
        validationState.issues = validation.issues
        validationState.recommendations = validation.recommendations
        validationState.lastChecked = new Date().toISOString()

        // Show notifications for critical issues
        const criticalIssues = validation.issues.filter(issue => issue.severity === 'error')
        if (criticalIssues.length > 0) {
          crudError.validation(
            `Product reference validation failed: ${criticalIssues.map(i => i.message).join(', ')}`
          )
        } else if (validation.issues.some(issue => issue.severity === 'warning')) {
          crudWarning.validation(
            'Product reference has warnings that should be addressed'
          )
        }
      }
    },
    { immediate: true }
  )

  // Update loading state
  watch(
    () => validationQuery.isLoading.value,
    (isLoading) => {
      validationState.isLoading = isLoading
    },
    { immediate: true }
  )

  // Computed properties for UI
  const hasErrors = computed(() =>
    validationState.issues.some(issue => issue.severity === 'error')
  )

  const hasWarnings = computed(() =>
    validationState.issues.some(issue => issue.severity === 'warning')
  )

  const isProductActive = computed(() =>
    validationQuery.data.value?.isActive ?? false
  )

  const productExists = computed(() =>
    validationQuery.data.value?.exists ?? false
  )

  const validationSummary = computed(() => {
    if (!validationQuery.data.value) return null

    const validation = validationQuery.data.value
    return {
      status: validation.isValid ? 'valid' : 'invalid',
      product: validation.currentProduct,
      errorCount: validation.issues.filter(i => i.severity === 'error').length,
      warningCount: validation.issues.filter(i => i.severity === 'warning').length,
      lastValidated: validationState.lastChecked
    }
  })

  // Manual refresh
  const refresh = () => {
    validationQuery.refetch()
  }

  return {
    // 🔍 Validation State
    validation: readonly(validationState),
    validationData: computed(() => validationQuery.data.value),

    // ⚡ Status Checks
    isValid: computed(() => validationState.isValid),
    isLoading: computed(() => validationState.isLoading),
    hasErrors,
    hasWarnings,
    isProductActive,
    productExists,

    // 📊 Summary
    validationSummary,

    // 🔄 Actions
    refresh,

    // 🎨 UI Helpers
    getValidationClasses: () => ({
      'border-green-300 bg-green-50': validationState.isValid && !hasWarnings.value,
      'border-yellow-300 bg-yellow-50': validationState.isValid && hasWarnings.value,
      'border-red-300 bg-red-50': !validationState.isValid || hasErrors.value,
      'opacity-50': validationState.isLoading
    }),

    getStatusIcon: () => {
      if (validationState.isLoading) return 'heroicons:arrow-path'
      if (hasErrors.value) return 'heroicons:x-circle'
      if (hasWarnings.value) return 'heroicons:exclamation-triangle'
      return 'heroicons:check-circle'
    },

    getStatusColor: () => {
      if (validationState.isLoading) return 'text-gray-400'
      if (hasErrors.value) return 'text-red-500'
      if (hasWarnings.value) return 'text-yellow-500'
      return 'text-green-500'
    }
  }
}

/**
 * Bundle Products Validation
 */
export function useBundleProductsValidation(
  bundleId: string | Ref<string>,
  products: Ref<BundleProduct[]>
) {
  const bundleIdRef = isRef(bundleId) ? bundleId : ref(bundleId)
  const { crudError, crudSuccess } = globalNotifications

  // Individual product validations
  const productValidations = computed(() => {
    return products.value.map(product => ({
      product,
      validation: useProductReferenceValidation(product.productId)
    }))
  })

  // Bundle-wide validation query
  const bundleValidationQuery = useQuery({
    queryKey: computed(() => productReferenceQueryKeys.bundleValidation(bundleIdRef.value)),
    queryFn: async (): Promise<BundleReferenceValidation> => {
      if (!bundleIdRef.value || products.value.length === 0) {
        return {
          bundleId: bundleIdRef.value,
          isValid: true,
          totalProducts: 0,
          validProducts: 0,
          invalidProducts: [],
          orphanedProducts: [],
          recommendedActions: [],
          lastValidated: new Date().toISOString()
        }
      }

      const response = await $fetch<{ success: boolean; data: BundleReferenceValidation }>(
        `/api/admin/bundle-reference/validate/${bundleIdRef.value}`,
        {
          method: 'POST',
          body: { products: products.value }
        }
      )

      if (!response.success) {
        throw new Error('Failed to validate bundle product references')
      }

      return response.data
    },
    enabled: computed(() => !!bundleIdRef.value && products.value.length > 0),
    staleTime: 30 * 1000 // 30 seconds
  })

  // Computed validation summaries
  const validProducts = computed(() =>
    productValidations.value.filter(pv => pv.validation.isValid.value)
  )

  const invalidProducts = computed(() =>
    productValidations.value.filter(pv => !pv.validation.isValid.value)
  )

  const orphanedProducts = computed(() =>
    productValidations.value.filter(pv => !pv.validation.productExists.value)
  )

  const productsWithWarnings = computed(() =>
    productValidations.value.filter(pv => pv.validation.hasWarnings.value)
  )

  const bundleIsValid = computed(() =>
    products.value.length > 0 && invalidProducts.value.length === 0
  )

  const validationStats = computed(() => ({
    total: products.value.length,
    valid: validProducts.value.length,
    invalid: invalidProducts.value.length,
    orphaned: orphanedProducts.value.length,
    withWarnings: productsWithWarnings.value.length,
    validationRate: products.value.length > 0
      ? Math.round((validProducts.value.length / products.value.length) * 100)
      : 0
  }))

  // Auto-cleanup mutation for orphaned products
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const orphanedIds = orphanedProducts.value.map(op => op.product.productId)

      if (orphanedIds.length === 0) return { removed: [] }

      const response = await $fetch(`/api/admin/bundle-reference/cleanup/${bundleIdRef.value}`, {
        method: 'POST',
        body: { orphanedProductIds: orphanedIds }
      })

      return response.data
    },
    onSuccess: (result) => {
      if (result.removed.length > 0) {
        crudSuccess.updated(
          `${result.removed.length} orphaned product(s) removed from bundle`,
          'bundle'
        )
      }
    },
    onError: (error) => {
      crudError.updated('bundle', `Failed to cleanup orphaned products: ${error}`)
    }
  })

  // Batch validation refresh
  const refreshAllValidations = () => {
    productValidations.value.forEach(pv => pv.validation.refresh())
    bundleValidationQuery.refetch()
  }

  // Automated cleanup of orphaned products
  const cleanupOrphanedProducts = () => {
    if (orphanedProducts.value.length > 0) {
      cleanupMutation.mutate()
    }
  }

  // Validation report for UI display
  const getValidationReport = () => {
    const report = {
      summary: validationStats.value,
      criticalIssues: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[]
    }

    invalidProducts.value.forEach(pv => {
      const issues = pv.validation.validationData.value?.issues || []
      issues.forEach(issue => {
        if (issue.severity === 'error') {
          report.criticalIssues.push(`${pv.product.name}: ${issue.message}`)
        } else if (issue.severity === 'warning') {
          report.warnings.push(`${pv.product.name}: ${issue.message}`)
        }
      })

      const recommendations = pv.validation.validationData.value?.recommendations || []
      report.recommendations.push(...recommendations)
    })

    return report
  }

  return {
    // 📊 Validation State
    productValidations: readonly(productValidations),
    bundleValidation: computed(() => bundleValidationQuery.data.value),

    // ✅ Status
    bundleIsValid,
    validationStats,

    // 📋 Product Lists
    validProducts,
    invalidProducts,
    orphanedProducts,
    productsWithWarnings,

    // 🔄 Actions
    refreshAllValidations,
    cleanupOrphanedProducts,
    isCleaningUp: computed(() => cleanupMutation.isPending.value),

    // 📝 Reports
    getValidationReport,

    // 🎨 UI Helpers
    getBundleValidationClasses: () => ({
      'border-green-300 bg-green-50': bundleIsValid.value && productsWithWarnings.value.length === 0,
      'border-yellow-300 bg-yellow-50': bundleIsValid.value && productsWithWarnings.value.length > 0,
      'border-red-300 bg-red-50': !bundleIsValid.value,
      'opacity-75': bundleValidationQuery.isLoading.value
    })
  }
}

/**
 * Bulk Product Validation for Product Selector
 */
export function useProductSelectorValidation(
  availableProducts: Ref<Product[]>,
  selectedProducts: Ref<BundleProduct[]>
) {
  // Filter products that can be safely added to bundle
  const validProducts = computed(() => {
    return availableProducts.value.filter(product => {
      // Must be active
      if (!product.isActive) return false

      // Must have valid price
      if (!product.price || product.price <= 0) return false

      // Must not already be in bundle
      const alreadySelected = selectedProducts.value.some(sp => sp.productId === product.id)
      if (alreadySelected) return false

      return true
    })
  })

  const inactiveProducts = computed(() => {
    return availableProducts.value.filter(product => !product.isActive)
  })

  const invalidPriceProducts = computed(() => {
    return availableProducts.value.filter(product =>
      product.isActive && (!product.price || product.price <= 0)
    )
  })

  const alreadySelectedProducts = computed(() => {
    return availableProducts.value.filter(product =>
      selectedProducts.value.some(sp => sp.productId === product.id)
    )
  })

  // Validation method for individual product
  const canAddProduct = (product: Product): { canAdd: boolean; reason?: string } => {
    if (!product.isActive) {
      return { canAdd: false, reason: 'Product is inactive' }
    }

    if (!product.price || product.price <= 0) {
      return { canAdd: false, reason: 'Product has no valid price' }
    }

    const alreadySelected = selectedProducts.value.some(sp => sp.productId === product.id)
    if (alreadySelected) {
      return { canAdd: false, reason: 'Product already in bundle' }
    }

    return { canAdd: true }
  }

  return {
    // 📋 Filtered Lists
    validProducts,
    inactiveProducts,
    invalidPriceProducts,
    alreadySelectedProducts,

    // 🔍 Validation
    canAddProduct,

    // 📊 Stats
    validationStats: computed(() => ({
      total: availableProducts.value.length,
      valid: validProducts.value.length,
      inactive: inactiveProducts.value.length,
      invalidPrice: invalidPriceProducts.value.length,
      alreadySelected: alreadySelectedProducts.value.length
    }))
  }
}