/**
 * Bundle Store - Pinia Global State Management
 * SOLID Architecture - Global State Layer
 * Synchronizes Bundle state with Product store for optimal data consistency
 */

import { defineStore } from 'pinia'
import type {
  Bundle,
  BundleAggregate,
  BundleProduct,
  BundleFilters,
  BundleSortOptions,
  PaginatedBundles,
  BundleCalculation,
  BundleTargetAudience,
  BundleBudgetRange
} from '../types/domain/Bundle'
// Note: bundleService removed - Vue Query handles API calls
// import { useProductStore } from './useProductStore' // Not used currently

interface BundleStoreState {
  // Core State
  bundles: Bundle[]
  selectedBundle: Bundle | null
  selectedBundleProducts: BundleProduct[]

  // Loading States
  loading: boolean
  loadingCreate: boolean
  loadingUpdate: boolean
  loadingDelete: boolean
  loadingProducts: boolean

  // Error States
  error: string | null
  validationErrors: Record<string, string>

  // Cache Management
  lastFetch: Date | null
  isInitialized: boolean

  // Filters & Pagination
  currentFilters: BundleFilters | null
  currentSort: BundleSortOptions | null
  currentPage: number
  totalCount: number

  // Product Management
  productOperationLoading: boolean
  availableProducts: any[] // From product store

  // Performance Optimization
  searchCache: Map<string, Bundle[]>
  aggregateCache: Map<string, BundleAggregate>
  calculationCache: Map<string, BundleCalculation>
}

export const useBundleStore = defineStore('bundles', {
  state: (): BundleStoreState => ({
    // Core State
    bundles: [],
    selectedBundle: null,
    selectedBundleProducts: [],

    // Loading States
    loading: false,
    loadingCreate: false,
    loadingUpdate: false,
    loadingDelete: false,
    loadingProducts: false,

    // Error States
    error: null,
    validationErrors: {},

    // Cache Management
    lastFetch: null,
    isInitialized: false,

    // Filters & Pagination
    currentFilters: null,
    currentSort: null,
    currentPage: 1,
    totalCount: 0,

    // Product Management
    productOperationLoading: false,
    availableProducts: [],

    // Performance Optimization
    searchCache: new Map(),
    aggregateCache: new Map(),
    calculationCache: new Map()
  }),

  getters: {
    // Bundle Queries
    getBundleById: (state) => (id: string): Bundle | undefined => {
      return state.bundles.find(bundle => bundle.id === id)
    },

    getActiveBundles: (state): Bundle[] => {
      return state.bundles.filter(bundle => bundle.isActive)
    },

    getFeaturedBundles: (state): Bundle[] => {
      return state.bundles.filter(bundle => bundle.isFeatured && bundle.isActive)
    },

    getBundlesByTargetAudience: (state) => (audience: BundleTargetAudience): Bundle[] => {
      return state.bundles.filter(bundle => bundle.targetAudience === audience)
    },

    getBundlesByBudgetRange: (state) => (range: BundleBudgetRange): Bundle[] => {
      return state.bundles.filter(bundle => bundle.budgetRange === range)
    },

    // Filtered Bundles
    filteredBundles: (state): Bundle[] => {
      let filtered = [...state.bundles]

      if (state.currentFilters) {
        const filters = state.currentFilters

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          filtered = filtered.filter(bundle =>
            bundle.name.toLowerCase().includes(searchTerm) ||
            bundle.description.toLowerCase().includes(searchTerm)
          )
        }

        if (filters.targetAudience) {
          filtered = filtered.filter(bundle => bundle.targetAudience === filters.targetAudience)
        }

        if (filters.budgetRange) {
          filtered = filtered.filter(bundle => bundle.budgetRange === filters.budgetRange)
        }

        if (filters.featured !== undefined) {
          filtered = filtered.filter(bundle => bundle.isFeatured === filters.featured)
        }

        if (filters.priceRange) {
          filtered = filtered.filter(bundle =>
            bundle.estimatedTotal >= filters.priceRange!.min &&
            bundle.estimatedTotal <= filters.priceRange!.max
          )
        }

        if (filters.tags && filters.tags.length > 0) {
          filtered = filtered.filter(bundle =>
            filters.tags!.some(tag => bundle.tags.includes(tag))
          )
        }
      }

      // Apply sorting
      if (state.currentSort) {
        const { field, direction } = state.currentSort
        filtered.sort((a, b) => {
          const aValue = a[field]
          const bValue = b[field]

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return direction === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue)
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc'
              ? aValue - bValue
              : bValue - aValue
          }

          return 0
        })
      }

      return filtered
    },

    // Bundle Product Queries
    getBundleProductById: (state) => (productId: string): BundleProduct | undefined => {
      return state.selectedBundleProducts.find(product => product.productId === productId)
    },

    // Statistics
    totalBundles: (state): number => state.bundles.length,
    activeBundlesCount: (state): number => state.bundles.filter(b => b.isActive).length,
    featuredBundlesCount: (state): number => state.bundles.filter(b => b.isFeatured).length,
    averageBundleValue: (state): number => {
      if (state.bundles.length === 0) return 0
      const total = state.bundles.reduce((sum, bundle) => sum + bundle.estimatedTotal, 0)
      return Math.round((total / state.bundles.length) * 100) / 100
    },

    // Selected Bundle Stats
    selectedBundleTotal: (state): number => {
      return state.selectedBundleProducts.reduce((total, product) => total + product.subtotal, 0)
    },

    selectedBundleProductsCount: (state): number => {
      return state.selectedBundleProducts.reduce((total, product) => total + product.quantity, 0)
    },

    // Cache & Performance
    isCacheValid: (state): boolean => {
      if (!state.lastFetch) return false
      const cacheTimeout = 5 * 60 * 1000 // 5 minutes
      return Date.now() - state.lastFetch.getTime() < cacheTimeout
    },

    isLoading: (state): boolean => {
      return state.loading || state.loadingCreate || state.loadingUpdate ||
             state.loadingDelete || state.loadingProducts || state.productOperationLoading
    },

    hasError: (state): boolean => {
      return state.error !== null || Object.keys(state.validationErrors).length > 0
    }
  },

  actions: {
    // Bundle Management (Vue Query handles data fetching)
    // CRUD operations moved to Vue Query mutations
    // Store only handles local state management

    // Bundle Products Management (Vue Query handles fetching)

    // Product management methods moved to Vue Query mutations

    // Business Logic - calculations handled by Vue Query

    // Search & Filtering (Vue Query handles search)

    applyFilters(filters: BundleFilters): void {
      this.currentFilters = filters
      this.searchCache.clear()
    },

    applySorting(sort: BundleSortOptions): void {
      this.currentSort = sort
    },

    clearFilters(): void {
      this.currentFilters = null
      this.searchCache.clear()
    },

    // State Management
    setSelectedBundle(bundle: Bundle | null): void {
      this.selectedBundle = bundle
      if (!bundle) {
        this.selectedBundleProducts = []
      }
    },

    clearError(): void {
      this.error = null
      this.validationErrors = {}
    },

    clearCache(): void {
      this.searchCache.clear()
      this.aggregateCache.clear()
      this.calculationCache.clear()
      this.lastFetch = null
      this.isInitialized = false
    },

    // Synchronization with Product Store
    handleProductUpdate(productId: string, updatedProduct: any): void {
      // Update bundle products that reference this product (immutable update)
      this.selectedBundleProducts = this.selectedBundleProducts.map(bundleProduct => {
        if (bundleProduct.productId === productId) {
          const newBasePrice = updatedProduct.basePrice || updatedProduct.price
          return {
            ...bundleProduct,
            name: updatedProduct.name,
            basePrice: newBasePrice,
            subtotal: bundleProduct.quantity * newBasePrice
          }
        }
        return bundleProduct
      })

      // Recalculate bundle totals for selected bundle
      if (this.selectedBundle) {
        this.recalculateBundleTotal(this.selectedBundle.id)
      }

      // Clear related caches
      this.calculationCache.clear()
      this.aggregateCache.clear()
    },

    handleProductDelete(productId: string): void {
      // Remove product from selected bundle products
      const index = this.selectedBundleProducts.findIndex(p => p.productId === productId)
      if (index !== -1) {
        this.selectedBundleProducts.splice(index, 1)

        // Recalculate bundle total
        if (this.selectedBundle) {
          this.recalculateBundleTotal(this.selectedBundle.id)
        }
      }

      // Clear caches
      this.calculationCache.clear()
      this.aggregateCache.clear()
    },

    // Recalculate bundle total from selectedBundleProducts
    recalculateBundleTotal(bundleId: string): void {
      if (!this.selectedBundle || this.selectedBundle.id !== bundleId) {
        return
      }

      // Calculate new total from selected bundle products
      const newTotal = this.selectedBundleProducts.reduce(
        (sum, product) => sum + product.subtotal,
        0
      )

      // Update selected bundle with new total (immutable)
      this.selectedBundle = {
        ...this.selectedBundle,
        estimatedTotal: newTotal,
        updatedAt: new Date().toISOString()
      }

      // Clear calculation cache for this bundle
      this.calculationCache.delete(bundleId)
      this.aggregateCache.delete(bundleId)
    }
  }
})