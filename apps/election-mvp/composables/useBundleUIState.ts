/**
 * Bundle UI State Composable
 * Pure UI State Management - NO Server State
 * Gère la sélection utilisateur (selectedBundle) et les produits associés
 */

import { ref, computed } from 'vue'
import type { Bundle, BundleProduct } from '../types/domain/Bundle'

// Singleton state (shared across components)
const selectedBundle = ref<Bundle | null>(null)
const selectedBundleProducts = ref<BundleProduct[]>([])

/**
 * Bundle UI State Composable
 * Gère la sélection d'un bundle et ses produits (UI state pur)
 */
export function useBundleUIState() {
  // ✅ Selection Management
  const selectBundle = (bundle: Bundle | null) => {
    selectedBundle.value = bundle
  }

  const clearSelection = () => {
    selectedBundle.value = null
    selectedBundleProducts.value = []
  }

  // ✅ Bundle Products Management (UI State)
  const setSelectedBundleProducts = (products: BundleProduct[]) => {
    selectedBundleProducts.value = products
  }

  const addProductToSelection = (product: BundleProduct) => {
    // Check if product already exists
    const existingIndex = selectedBundleProducts.value.findIndex(
      p => p.productId === product.productId
    )

    if (existingIndex === -1) {
      selectedBundleProducts.value = [...selectedBundleProducts.value, product]
    } else {
      // Update existing product (e.g., quantity changed)
      selectedBundleProducts.value = selectedBundleProducts.value.map((p, index) =>
        index === existingIndex ? product : p
      )
    }
  }

  const removeProductFromSelection = (productId: string) => {
    selectedBundleProducts.value = selectedBundleProducts.value.filter(
      p => p.productId !== productId
    )
  }

  const updateProductQuantity = (productId: string, quantity: number) => {
    selectedBundleProducts.value = selectedBundleProducts.value.map(product => {
      if (product.productId === productId) {
        const subtotal = quantity * product.basePrice
        return {
          ...product,
          quantity,
          subtotal
        }
      }
      return product
    })
  }

  // ✅ Computed Properties
  const hasSelection = computed(() => selectedBundle.value !== null)

  const totalProducts = computed(() => selectedBundleProducts.value.length)

  const estimatedTotal = computed(() => {
    return selectedBundleProducts.value.reduce(
      (sum, product) => sum + product.subtotal,
      0
    )
  })

  const totalQuantity = computed(() => {
    return selectedBundleProducts.value.reduce(
      (sum, product) => sum + product.quantity,
      0
    )
  })

  return {
    // State
    selectedBundle,
    selectedBundleProducts,

    // Actions
    selectBundle,
    clearSelection,
    setSelectedBundleProducts,
    addProductToSelection,
    removeProductFromSelection,
    updateProductQuantity,

    // Computed
    hasSelection,
    totalProducts,
    estimatedTotal,
    totalQuantity
  }
}
