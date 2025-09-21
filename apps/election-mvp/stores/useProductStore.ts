/**
 * Product Store - Pinia Global State Management
 * SOLID Architecture - Global State Layer
 * Synchronizes Product state between /admin/products and /admin/bundles/[id]
 */

import { defineStore } from 'pinia'
import type {
  Product,
  ProductAggregate,
  ProductFilters,
  ProductSortOptions,
  PaginatedProducts
} from '../types/domain/Product'
import { productService } from '../services/ProductService'

interface ProductStoreState {
  // Core State
  products: Product[]
  selectedProduct: Product | null

  // Loading States
  loading: boolean
  loadingCreate: boolean
  loadingUpdate: boolean
  loadingDelete: boolean

  // Error States
  error: string | null
  validationErrors: Record<string, string>

  // Cache Management
  lastFetch: Date | null
  isInitialized: boolean

  // Filters & Pagination
  currentFilters: ProductFilters | null
  currentSort: ProductSortOptions | null
  currentPage: number
  totalCount: number

  // Performance Optimization
  searchCache: Map<string, Product[]>
  aggregateCache: Map<string, ProductAggregate>
}

export const useProductStore = defineStore('products', {
  state: (): ProductStoreState => ({
    // Core State
    products: [],
    selectedProduct: null,

    // Loading States
    loading: false,
    loadingCreate: false,
    loadingUpdate: false,
    loadingDelete: false,

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

    // Performance Optimization
    searchCache: new Map(),
    aggregateCache: new Map()
  }),

  getters: {
    // Product Queries
    getProductById: (state) => (id: string): Product | undefined => {
      return state.products.find(product => product.id === id)
    },

    getActiveProducts: (state): Product[] => {
      return state.products.filter(product => product.isActive)
    },

    getProductsByCategory: (state) => (categoryId: string): Product[] => {
      return state.products.filter(product => product.category_id === categoryId)
    },

    getProductsByIds: (state) => (ids: string[]): Product[] => {
      return state.products.filter(product => ids.includes(product.id))
    },

    // Filtered Products
    filteredProducts: (state): Product[] => {
      let filtered = [...state.products]

      if (state.currentFilters) {
        const filters = state.currentFilters

        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          filtered = filtered.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.reference.toLowerCase().includes(searchTerm)
          )
        }

        if (filters.category) {
          filtered = filtered.filter(product => product.category_id === filters.category)
        }

        if (filters.status) {
          filtered = filtered.filter(product => product.status === filters.status)
        }

        if (filters.priceRange) {
          filtered = filtered.filter(product =>
            product.price >= filters.priceRange!.min &&
            product.price <= filters.priceRange!.max
          )
        }

        if (filters.tags && filters.tags.length > 0) {
          filtered = filtered.filter(product =>
            filters.tags!.some(tag => product.tags.includes(tag))
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

    // Statistics
    totalProducts: (state): number => state.products.length,
    activeProductsCount: (state): number => state.products.filter(p => p.isActive).length,
    averagePrice: (state): number => {
      if (state.products.length === 0) return 0
      const total = state.products.reduce((sum, product) => {
        // Utiliser basePrice comme propriété principale, price comme fallback
        const price = product.basePrice ?? product.price ?? 0
        return sum + price
      }, 0)
      return Math.round((total / state.products.length) * 100) / 100
    },

    // Cache & Performance
    isCacheValid: (state): boolean => {
      if (!state.lastFetch) return false
      const cacheTimeout = 5 * 60 * 1000 // 5 minutes
      return Date.now() - state.lastFetch.getTime() < cacheTimeout
    },

    isLoading: (state): boolean => {
      return state.loading || state.loadingCreate || state.loadingUpdate || state.loadingDelete
    },

    hasError: (state): boolean => {
      return state.error !== null || Object.keys(state.validationErrors).length > 0
    }
  },

  actions: {
    // Core Data Fetching
    async fetchProducts(force = false): Promise<void> {
      // Use cache if valid and not forced
      if (!force && this.isCacheValid && this.isInitialized) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const products = await productService.getProducts(this.currentFilters || undefined, this.currentSort || undefined)

        this.products = products
        this.totalCount = products.length
        this.lastFetch = new Date()
        this.isInitialized = true

        // Clear search cache when data changes
        this.searchCache.clear()
        this.aggregateCache.clear()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch products'
        console.error('Failed to fetch products:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchProductsPaginated(page = 1, limit = 20, force = false): Promise<PaginatedProducts> {
      this.loading = true
      this.error = null

      try {
        const result = await productService.getProductsPaginated(
          page,
          limit,
          this.currentFilters || undefined,
          this.currentSort || undefined
        )

        // Update store state
        if (page === 1) {
          this.products = result.data
        } else {
          // Append for pagination
          this.products.push(...result.data)
        }

        this.currentPage = page
        this.totalCount = result.pagination.total
        this.lastFetch = new Date()
        this.isInitialized = true

        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch products'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchProductById(id: string, includeAggregate = false): Promise<Product | ProductAggregate | null> {
      // Check cache first
      const cachedProduct = this.getProductById(id)
      if (cachedProduct && !includeAggregate) {
        return cachedProduct
      }

      if (includeAggregate && this.aggregateCache.has(id)) {
        return this.aggregateCache.get(id)!
      }

      this.loading = true
      this.error = null

      try {
        let product
        if (includeAggregate) {
          product = await productService.getProductAggregate(id)
          if (product) {
            this.aggregateCache.set(id, product)
          }
        } else {
          product = await productService.getProduct(id)
        }

        if (product && !includeAggregate) {
          // Update product in store if it exists
          const index = this.products.findIndex(p => p.id === id)
          if (index !== -1) {
            this.products[index] = product as Product
          } else {
            this.products.push(product as Product)
          }
        }

        this.selectedProduct = product as Product
        return product
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch product'
        return null
      } finally {
        this.loading = false
      }
    },

    // Product Management
    async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> {
      this.loadingCreate = true
      this.error = null
      this.validationErrors = {}

      try {
        const newProduct = await productService.createProduct(productData)

        // Add to store
        this.products.unshift(newProduct)
        this.totalCount += 1

        // Clear caches
        this.searchCache.clear()
        this.aggregateCache.clear()

        return newProduct
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
        this.error = errorMessage

        // Parse validation errors if available
        if (error instanceof Error && error.message.includes('validation')) {
          this.validationErrors = { general: errorMessage }
        }

        return null
      } finally {
        this.loadingCreate = false
      }
    },

    async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> {
      this.loadingUpdate = true
      this.error = null
      this.validationErrors = {}

      try {
        const updatedProduct = await productService.updateProduct(id, updates)

        // Update in store
        const index = this.products.findIndex(p => p.id === id)
        if (index !== -1) {
          this.products[index] = updatedProduct
        }

        // Update selected product if it's the same
        if (this.selectedProduct?.id === id) {
          this.selectedProduct = updatedProduct
        }

        // Clear caches
        this.searchCache.clear()
        this.aggregateCache.delete(id)

        return updatedProduct
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product'
        this.error = errorMessage

        if (error instanceof Error && error.message.includes('validation')) {
          this.validationErrors = { general: errorMessage }
        }

        return null
      } finally {
        this.loadingUpdate = false
      }
    },

    async deleteProduct(id: string): Promise<boolean> {
      this.loadingDelete = true
      this.error = null

      try {
        const success = await productService.deleteProduct(id)

        if (success) {
          // Remove from store
          const index = this.products.findIndex(p => p.id === id)
          if (index !== -1) {
            this.products.splice(index, 1)
            this.totalCount -= 1
          }

          // Clear selected product if it's the deleted one
          if (this.selectedProduct?.id === id) {
            this.selectedProduct = null
          }

          // Clear caches
          this.searchCache.clear()
          this.aggregateCache.delete(id)
        }

        return success
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete product'
        return false
      } finally {
        this.loadingDelete = false
      }
    },

    // Bulk Operations
    async bulkUpdateProducts(updates: Array<{ id: string; data: Partial<Product> }>): Promise<Product[]> {
      this.loading = true
      this.error = null

      try {
        const updatedProducts = await productService.bulkUpdateProducts(updates)

        // Update products in store
        updatedProducts.forEach(updatedProduct => {
          const index = this.products.findIndex(p => p.id === updatedProduct.id)
          if (index !== -1) {
            this.products[index] = updatedProduct
          }
        })

        // Clear caches
        this.searchCache.clear()
        this.aggregateCache.clear()

        return updatedProducts
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to bulk update products'
        throw error
      } finally {
        this.loading = false
      }
    },

    // Search & Filtering
    async searchProducts(query: string, useCache = true): Promise<Product[]> {
      // Check cache first
      if (useCache && this.searchCache.has(query)) {
        return this.searchCache.get(query)!
      }

      this.loading = true
      this.error = null

      try {
        const results = await productService.searchProducts(query, this.currentFilters || undefined)

        // Cache results
        if (useCache) {
          this.searchCache.set(query, results)
        }

        return results
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to search products'
        return []
      } finally {
        this.loading = false
      }
    },

    applyFilters(filters: ProductFilters): void {
      this.currentFilters = filters
      // Clear search cache when filters change
      this.searchCache.clear()
    },

    applySorting(sort: ProductSortOptions): void {
      this.currentSort = sort
    },

    clearFilters(): void {
      this.currentFilters = null
      this.searchCache.clear()
    },

    // State Management
    setSelectedProduct(product: Product | null): void {
      this.selectedProduct = product
    },

    clearError(): void {
      this.error = null
      this.validationErrors = {}
    },

    clearCache(): void {
      this.searchCache.clear()
      this.aggregateCache.clear()
      this.lastFetch = null
      this.isInitialized = false
    },

    // Cache Management
    invalidateProduct(id: string): void {
      this.aggregateCache.delete(id)

      // Clear search cache entries that might contain this product
      this.searchCache.clear()

      // Optionally refetch the product
      const index = this.products.findIndex(p => p.id === id)
      if (index !== -1) {
        this.fetchProductById(id)
      }
    },

    // Synchronization helpers for Bundle interface
    syncProductChanges(productId: string, changes: Partial<Product>): void {
      const index = this.products.findIndex(p => p.id === productId)
      if (index !== -1) {
        this.products[index] = { ...this.products[index], ...changes }

        // Update selected product if it's the same
        if (this.selectedProduct?.id === productId) {
          this.selectedProduct = { ...this.selectedProduct, ...changes }
        }

        // Clear related caches
        this.aggregateCache.delete(productId)
        this.searchCache.clear()
      }
    }
  }
})