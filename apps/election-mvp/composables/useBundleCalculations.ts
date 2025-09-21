/**
 * Bundle Calculations Composable
 * SOLID Architecture - Single Responsibility for Bundle Calculations
 * Centralized business logic for bundle pricing and totals
 */

import { computed, ref, isRef, type Ref } from 'vue'
import type {
  Bundle,
  BundleProduct,
  BundleCalculation,
  BundlePricing
} from '../types/domain/Bundle'
import { calculateBundleFromProducts } from '../utils/BundleAdapter'

/**
 * Reactive Bundle Calculations
 * Single source of truth for all bundle financial calculations
 */
export function useBundleCalculations(
  products: Ref<BundleProduct[]> | BundleProduct[] = []
) {
  const productsRef = isRef(products) ? products : ref(products)

  // 🧮 Core Calculations (Reactive)
  const calculations = computed((): BundleCalculation => {
    if (!productsRef.value || productsRef.value.length === 0) {
      return {
        originalTotal: 0,
        estimatedTotal: 0,
        savings: 0,
        discountPercentage: 0,
        totalProducts: 0
      }
    }

    return calculateBundleFromProducts(productsRef.value)
  })

  // 💰 Financial Metrics
  const originalTotal = computed(() => calculations.value.originalTotal)
  const estimatedTotal = computed(() => calculations.value.estimatedTotal)
  const savings = computed(() => calculations.value.savings)
  const discountPercentage = computed(() => calculations.value.discountPercentage)
  const totalProducts = computed(() => calculations.value.totalProducts)

  // 📊 Additional Metrics
  const totalQuantity = computed(() =>
    productsRef.value.reduce((sum, product) => sum + product.quantity, 0)
  )

  const averageProductPrice = computed(() => {
    const products = productsRef.value
    if (products.length === 0) return 0

    const totalPrice = products.reduce((sum, product) => sum + product.basePrice, 0)
    return Math.round((totalPrice / products.length) * 100) / 100
  })

  const averageQuantityPerProduct = computed(() => {
    const products = productsRef.value
    if (products.length === 0) return 0

    return Math.round((totalQuantity.value / products.length) * 100) / 100
  })

  // 💸 Pricing Breakdown
  const pricingBreakdown = computed((): BundlePricing => {
    const baseTotal = originalTotal.value
    const discountAmount = savings.value
    const finalTotal = estimatedTotal.value

    return {
      baseTotal,
      discountAmount,
      finalTotal,
      currency: 'XOF', // West African CFA franc
      taxAmount: 0, // No tax calculation for now
      shippingCost: 0 // No shipping for digital campaigns
    }
  })

  // 🏷️ Product Analysis
  const productAnalysis = computed(() => {
    const products = productsRef.value
    if (products.length === 0) return null

    // Find most/least expensive products
    const sortedByPrice = [...products].sort((a, b) => b.basePrice - a.basePrice)
    const mostExpensive = sortedByPrice[0]
    const leastExpensive = sortedByPrice[sortedByPrice.length - 1]

    // Find highest quantity product
    const sortedByQuantity = [...products].sort((a, b) => b.quantity - a.quantity)
    const highestQuantity = sortedByQuantity[0]

    // Category distribution
    const categoryCount = products.reduce((acc, product) => {
      const category = product.categoryId || 'uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      mostExpensive,
      leastExpensive,
      highestQuantity,
      categoryDistribution: categoryCount,
      priceRange: {
        min: leastExpensive.basePrice,
        max: mostExpensive.basePrice,
        spread: mostExpensive.basePrice - leastExpensive.basePrice
      }
    }
  })

  // 📈 Budget Category Classification
  const budgetCategory = computed(() => {
    const total = estimatedTotal.value

    if (total < 20000) return 'starter'      // < 20k FCFA
    if (total < 50000) return 'standard'     // 20k-50k FCFA
    if (total < 150000) return 'premium'     // 50k-150k FCFA
    return 'enterprise'                      // > 150k FCFA
  })

  // 🎯 Recommendation Engine
  const recommendations = computed(() => {
    const analysis = productAnalysis.value
    const total = estimatedTotal.value
    const discountPct = discountPercentage.value

    const recs: string[] = []

    if (discountPct < 5) {
      recs.push('Consider adding more products to increase bundle savings')
    }

    if (totalQuantity.value < 50 && total > 30000) {
      recs.push('Low quantities for this budget - consider higher volumes for better ROI')
    }

    if (analysis && analysis.priceRange.spread > 10000) {
      recs.push('Wide price range detected - ensure consistent quality across products')
    }

    if (totalProducts.value === 1) {
      recs.push('Single product bundle - consider adding complementary items')
    }

    return recs
  })

  // 🔄 Dynamic Calculations
  const calculateWithNewProduct = (newProduct: Omit<BundleProduct, 'id'>) => {
    const tempProduct: BundleProduct = {
      id: `temp-${Date.now()}`,
      ...newProduct
    }

    const newProducts = [...productsRef.value, tempProduct]
    return calculateBundleFromProducts(newProducts)
  }

  const calculateWithUpdatedQuantity = (productId: string, newQuantity: number) => {
    const updatedProducts = productsRef.value.map(product =>
      product.id === productId
        ? { ...product, quantity: newQuantity, subtotal: product.basePrice * newQuantity }
        : product
    )

    return calculateBundleFromProducts(updatedProducts)
  }

  const calculateWithRemovedProduct = (productId: string) => {
    const filteredProducts = productsRef.value.filter(product => product.id !== productId)
    return calculateBundleFromProducts(filteredProducts)
  }

  // 💼 Business Logic Helpers
  const isDiscountSignificant = computed(() => discountPercentage.value >= 10)
  const isHighValueBundle = computed(() => estimatedTotal.value >= 100000) // 100k FCFA
  const isOptimalQuantity = computed(() => totalQuantity.value >= 100 && totalQuantity.value <= 1000)

  // 🎨 Display Formatters
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100)
  }

  // 📊 Summary for UI Display
  const summary = computed(() => ({
    // Financial
    total: formatCurrency(estimatedTotal.value),
    originalTotal: formatCurrency(originalTotal.value),
    savings: formatCurrency(savings.value),
    discountPercentage: formatPercentage(discountPercentage.value),

    // Quantities
    totalProducts: totalProducts.value,
    totalQuantity: totalQuantity.value,
    averagePrice: formatCurrency(averageProductPrice.value),

    // Categories
    budgetCategory: budgetCategory.value,

    // Flags
    hasSignificantDiscount: isDiscountSignificant.value,
    isHighValue: isHighValueBundle.value,
    isOptimalQuantity: isOptimalQuantity.value
  }))

  return {
    // 🧮 Core Calculations
    calculations,
    originalTotal,
    estimatedTotal,
    savings,
    discountPercentage,
    totalProducts,
    totalQuantity,
    averageProductPrice,
    averageQuantityPerProduct,

    // 💰 Financial Analysis
    pricingBreakdown,
    budgetCategory,

    // 📊 Product Analysis
    productAnalysis,
    recommendations,

    // 🔄 Dynamic Calculations
    calculateWithNewProduct,
    calculateWithUpdatedQuantity,
    calculateWithRemovedProduct,

    // 💼 Business Logic
    isDiscountSignificant,
    isHighValueBundle,
    isOptimalQuantity,

    // 🎨 Display Helpers
    formatCurrency,
    formatPercentage,
    summary,

    // 🔧 Utilities
    updateProducts: (newProducts: BundleProduct[]) => {
      productsRef.value = newProducts
    },
    addProduct: (product: Omit<BundleProduct, 'id'>) => {
      const newProduct: BundleProduct = {
        id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...product
      }
      productsRef.value = [...productsRef.value, newProduct]
    },
    removeProduct: (productId: string) => {
      productsRef.value = productsRef.value.filter(p => p.id !== productId)
    },
    updateProductQuantity: (productId: string, quantity: number) => {
      productsRef.value = productsRef.value.map(product =>
        product.id === productId
          ? { ...product, quantity, subtotal: product.basePrice * quantity }
          : product
      )
    }
  }
}

/**
 * Static Bundle Calculation Utilities
 * For use in services and non-reactive contexts
 */
export const BundleCalculationUtils = {
  calculateTotal: (products: BundleProduct[]): BundleCalculation => {
    return calculateBundleFromProducts(products)
  },

  validateBundleIntegrity: (bundle: Bundle, products: BundleProduct[]): boolean => {
    const calculated = calculateBundleFromProducts(products)

    // Allow 1 FCFA tolerance for rounding
    const tolerance = 1

    return Math.abs(bundle.estimatedTotal - calculated.estimatedTotal) <= tolerance
  },

  calculateBudgetRange: (total: number): string => {
    if (total < 20000) return 'starter'
    if (total < 50000) return 'standard'
    if (total < 150000) return 'premium'
    return 'enterprise'
  },

  formatCurrencyStatic: (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }
}