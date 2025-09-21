<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Produits</h1>
          <p class="text-gray-600">Gérez votre catalogue de produits électoraux</p>
        </div>
        <NuxtLink
          to="/admin/products/new"
          class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Nouveau Produit
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Nom, référence..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              @input="handleSearchInput"
            />
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
          <select
            v-model="selectedCategory"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            @change="applyFilters"
          >
            <option value="">Toutes les catégories</option>
            <option v-for="category in categories.data" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            v-model="selectedStatus"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            @change="applyFilters"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="draft">Brouillon</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex items-end space-x-2">
          <button
            @click="resetFilters"
            class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Réinitialiser
          </button>
          <button
            @click="exportProducts"
            class="px-4 py-2 text-sm text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            :disabled="isLoading"
          >
            Exporter
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isInitialLoading" class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div class="animate-pulse space-y-4">
        <div class="flex items-center justify-between">
          <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          <div class="h-8 bg-gray-200 rounded w-32"></div>
        </div>
        <div class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error || searchError" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div class="flex">
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Erreur de chargement</h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error?.message || searchError?.message || 'Une erreur est survenue' }}</p>
          </div>
          <div class="mt-4">
            <button
              @click="refetch"
              class="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <AdminDataTable
      v-else
      :data="displayedProducts"
      :columns="columns"
      :is-loading="isRefreshing"
      :has-initial-data="!isLoading && displayedProducts.length > 0"
      :search-key="'name'"
      :search-value="searchQuery"
      title="Produits"
      description="Liste de tous les produits disponibles"
      empty-title="Aucun produit trouvé"
      empty-description="Commencez par créer votre premier produit."
      :get-row-key="(item) => item.id"
    >
      <!-- Custom slot for product image -->
      <template #cell-image="{ item }">
        <div class="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
          <AdvancedResponsiveImage
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            :width="48"
            :height="48"
            class="w-full h-full object-cover"
            preset="productCard"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Icon name="heroicons:photo" class="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </template>

      <!-- Custom slot for product name -->
      <template #cell-name="{ item }">
        <div>
          <div class="font-medium text-gray-900">{{ item.name }}</div>
          <div v-if="item.reference" class="text-sm text-gray-500">{{ item.reference }}</div>
        </div>
      </template>

      <!-- Custom slot for price -->
      <template #cell-price="{ item }">
        <div class="text-right">
          <div class="font-medium text-gray-900">
            {{ formatPrice(item.price || item.basePrice || 0) }}
          </div>
          <div v-if="item.basePrice && item.price !== item.basePrice" class="text-sm text-gray-500 line-through">
            {{ formatPrice(item.basePrice) }}
          </div>
        </div>
      </template>

      <!-- Custom slot for status -->
      <template #cell-status="{ item }">
        <StatusBadge :status="getProductStatus(item)">
          {{ getProductStatusLabel(item) }}
        </StatusBadge>
      </template>

      <!-- Custom slot for actions -->
      <template #cell-actions="{ item }">
        <div class="flex items-center space-x-2">
          <NuxtLink
            :to="`/admin/products/${item.id}`"
            class="text-amber-600 hover:text-amber-900 text-sm font-medium"
          >
            Modifier
          </NuxtLink>
          <button
            @click="handleDeleteProduct(item)"
            class="text-red-600 hover:text-red-900 text-sm font-medium"
            :disabled="deleteProductMutation.isPending.value"
          >
            {{ deleteProductMutation.isPending.value ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </template>
    </AdminDataTable>

    <!-- Stats Summary -->
    <div v-if="!isLoading && data" class="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-gray-900">{{ totalProducts }}</div>
          <div class="text-sm text-gray-500">Produits total</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">{{ activeProductsCount }}</div>
          <div class="text-sm text-gray-500">Produits actifs</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-amber-600">{{ Math.round(averagePrice).toLocaleString() }} XOF</div>
          <div class="text-sm text-gray-500">Prix moyen</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-600">{{ categories.data?.length || 0 }}</div>
          <div class="text-sm text-gray-500">Catégories</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Admin Products List Page - SOLID Architecture
 * Uses VueQuery + Pinia for optimal state management and caching
 */

import AdminDataTable from '../../../components/admin/AdminDataTable.vue'
import { StatusBadge } from '@ns2po/ui'
import AdvancedResponsiveImage from '../../../components/AdvancedResponsiveImage.vue'

// SOLID Architecture imports
import { useProductsQuery, useProductSearchQuery, useDeleteProductMutation } from '../../../composables/useProductsQuery'
import { useProductStore } from '../../../stores/useProductStore'
import { initializeGlobalEventBus, useGlobalEventBus } from '../../../stores/useGlobalEventBus'
import { refDebounced } from '@vueuse/core'
import type { Product, ProductFilters, ProductStatus } from '../../../types/domain/Product'

// Layout and metadata
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

useHead({
  title: 'Produits | Admin'
})

// Initialize global event bus for store synchronization
initializeGlobalEventBus()

// Auto-imported via Nuxt 3: globalNotifications, useLazyAsyncData
const { crudSuccess, crudError } = globalNotifications

// ===== REACTIVE STATE =====
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const debouncedSearch = refDebounced(searchQuery, 300)

// ===== COMPUTED FILTERS =====
const currentFilters = computed((): ProductFilters => {
  const filters: ProductFilters = {}

  if (selectedCategory.value) {
    filters.category = selectedCategory.value
  }

  if (selectedStatus.value) {
    filters.status = selectedStatus.value as ProductStatus
  }

  return filters
})

// ===== VUE QUERY INTEGRATION =====
// Main products query with intelligent caching
const {
  data,
  error,
  isLoading,
  isFetching,
  refetch
} = useProductsQuery(currentFilters)

// Search query (separate for performance)
const {
  data: searchResults,
  error: searchError,
  isLoading: isSearching
} = useProductSearchQuery(debouncedSearch, currentFilters, {
  enabled: computed(() => debouncedSearch.value.length >= 2)
})

// Categories query (could be moved to separate composable)
const { data: categoriesData } = await useLazyAsyncData(
  'categories',
  () => $fetch('/api/categories'),
  { default: () => ({ data: [] }) }
)

const categories = computed(() => categoriesData.value || { data: [] })

// Delete mutation with optimistic updates
const deleteProductMutation = useDeleteProductMutation({
  onSuccess: (success, productId) => {
    if (success) {
      crudSuccess.deleted('Produit', 'product')
    }
  },
  onError: (error) => {
    crudError.deleted('product', error.message)
  }
})

// ===== PINIA STORE INTEGRATION =====
const productStore = useProductStore()

// ===== COMPUTED PROPERTIES =====
const displayedProducts = computed(() => {
  // Use search results if searching, otherwise use main query
  if (debouncedSearch.value.length >= 2) {
    return searchResults.value || []
  }
  return data.value || []
})

const isInitialLoading = computed(() =>
  isLoading.value && !data.value
)

const isRefreshing = computed(() =>
  isFetching.value || isSearching.value
)

const totalProducts = computed(() =>
  productStore.totalProducts
)

const activeProductsCount = computed(() =>
  productStore.activeProductsCount
)

const averagePrice = computed(() =>
  productStore.averagePrice
)

// ===== TABLE CONFIGURATION =====
const columns = [
  {
    key: 'image',
    label: 'Image',
    sortable: false,
    class: 'w-20'
  },
  {
    key: 'name',
    label: 'Nom',
    sortable: true
  },
  {
    key: 'price',
    label: 'Prix',
    sortable: true,
    class: 'text-right'
  },
  {
    key: 'category',
    label: 'Catégorie',
    sortable: true
  },
  {
    key: 'status',
    label: 'Statut',
    sortable: true
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    class: 'w-32'
  }
]

// ===== METHODS =====
function handleSearchInput() {
  // Apply filters will be triggered by computed property reactivity
}

function applyFilters() {
  // Filters are applied automatically via computed properties
  // Force refetch if needed
  if (!debouncedSearch.value) {
    refetch()
  }
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedStatus.value = ''
  refetch()
}

async function exportProducts() {
  try {
    // Use current filtered products for export
    const productsToExport = displayedProducts.value

    if (productsToExport.length === 0) {
      crudError.validation('Aucun produit à exporter')
      return
    }

    // Create CSV content
    const headers = ['Nom', 'Référence', 'Prix', 'Catégorie', 'Statut']
    const csvContent = [
      headers.join(','),
      ...productsToExport.map(product => [
        `"${product.name}"`,
        `"${product.reference || ''}"`,
        product.price || product.basePrice || 0,
        `"${product.category || ''}"`,
        `"${getProductStatus(product)}"`
      ].join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `produits-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)

    crudSuccess.created('Export CSV', 'export')
  } catch (error) {
    crudError.created('export', 'Erreur lors de l\'export')
  }
}

async function handleDeleteProduct(product: Product) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
    return
  }

  deleteProductMutation.mutate(product.id)
}

function getProductStatus(product: Product): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  // Mapping des statuts produit vers les statuts StatusBadge
  if (product.status) {
    switch (product.status) {
      case 'active': return 'success'
      case 'inactive': return 'error'
      case 'draft': return 'warning'
      default: return 'neutral'
    }
  }
  if (product.isActive !== undefined) {
    return product.isActive ? 'success' : 'error'
  }
  return 'warning' // draft par défaut
}

function getProductStatusLabel(product: Product): string {
  // Mapping des statuts produit vers les labels affichés
  if (product.status) {
    switch (product.status) {
      case 'active': return 'Actif'
      case 'inactive': return 'Inactif'
      case 'draft': return 'Brouillon'
      default: return 'Inconnu'
    }
  }
  if (product.isActive !== undefined) {
    return product.isActive ? 'Actif' : 'Inactif'
  }
  return 'Brouillon'
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price) + ' XOF'
}

// ===== LIFECYCLE =====
// Sync with Pinia store for cross-component state sharing
watchEffect(() => {
  if (data.value) {
    // Update store with fresh data (will trigger global event bus)
    productStore.products = data.value
  }
})

// Handle real-time updates (if SSE is configured)
onMounted(() => {
  // Listen for product updates from other interfaces
  const eventBus = useGlobalEventBus()

  eventBus.on('product.updated', () => {
    refetch()
  })

  eventBus.on('product.created', () => {
    refetch()
  })

  eventBus.on('product.deleted', () => {
    refetch()
  })
})
</script>