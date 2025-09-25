<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Gestion des Produits
          </h1>
          <p class="text-gray-600">
            Gérez votre catalogue de produits électoraux
          </p>
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
            >
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
            <option value="">
              Toutes les catégories
            </option>
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
            <option value="">
              Tous les statuts
            </option>
            <option value="active">
              Actif
            </option>
            <option value="inactive">
              Inactif
            </option>
            <option value="draft">
              Brouillon
            </option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex items-end space-x-2">
          <button
            class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            @click="resetFilters"
          >
            Réinitialiser
          </button>
          <button
            class="px-4 py-2 text-sm text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            :disabled="isLoading"
            @click="exportProducts"
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
          <div class="h-4 bg-gray-200 rounded w-1/4" />
          <div class="h-8 bg-gray-200 rounded w-32" />
        </div>
        <div class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error || searchError" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div class="flex">
        <Icon name="heroicons:exclamation-triangle" class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">
            Erreur de chargement
          </h3>
          <div class="mt-2 text-sm text-red-700">
            <p>{{ error?.message || searchError?.message || 'Une erreur est survenue' }}</p>
          </div>
          <div class="mt-4">
            <button
              class="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              @click="refetch"
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
          <div class="font-medium text-gray-900">
            {{ item.name }}
          </div>
          <div v-if="item.reference" class="text-sm text-gray-500">
            {{ item.reference }}
          </div>
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

      <!-- Custom slot for bundles usage -->
      <template #cell-bundles="{ item }">
        <div class="flex items-center space-x-2">
          <span
            :class="[
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              getBundleUsageBadge(item.id).class
            ]"
          >
            {{ getBundleUsageBadge(item.id).text }}
          </span>
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

          <!-- Bouton "Voir bundles" si le produit est utilisé -->
          <button
            v-if="!getBundleUsageBadge(item.id).canDelete"
            class="text-blue-600 hover:text-blue-900 text-sm font-medium"
            @click="viewProductBundles(item)"
          >
            Voir bundles
          </button>

          <!-- Bouton Supprimer avec état conditionnel -->
          <button
            :class="[
              'text-sm font-medium',
              getBundleUsageBadge(item.id).canDelete
                ? 'text-red-600 hover:text-red-900'
                : 'text-gray-400 cursor-not-allowed'
            ]"
            :disabled="deleteProductMutation.isPending.value || !getBundleUsageBadge(item.id).canDelete"
            :title="!getBundleUsageBadge(item.id).canDelete ? 'Produit utilisé dans des bundles' : ''"
            @click="getBundleUsageBadge(item.id).canDelete ? handleDeleteProduct(item) : null"
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
          <div class="text-2xl font-bold text-gray-900">
            {{ totalProducts }}
          </div>
          <div class="text-sm text-gray-500">
            Produits total
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-green-600">
            {{ activeProductsCount }}
          </div>
          <div class="text-sm text-gray-500">
            Produits actifs
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-amber-600">
            {{ Math.round(averagePrice).toLocaleString() }} XOF
          </div>
          <div class="text-sm text-gray-500">
            Prix moyen
          </div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-600">
            {{ categories.data?.length || 0 }}
          </div>
          <div class="text-sm text-gray-500">
            Catégories
          </div>
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
import { useProductsQuery, useProductSearchQuery, useDeleteProductMutation, useProductBundlesQuery } from '../../../composables/useProductsQuery'
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

// Initialize global event bus and notifications ONLY on client
let crudSuccess: typeof globalNotifications.crudSuccess | undefined
let crudError: typeof globalNotifications.crudError | undefined

// Client-only initialization
if (import.meta.client) {
  initializeGlobalEventBus()
  const notifications = globalNotifications
  crudSuccess = notifications.crudSuccess
  crudError = notifications.crudError
}

// ===== REACTIVE STATE =====
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const debouncedSearch = refDebounced(searchQuery, 300)

// State pour tracking bundle usage de chaque produit
const productBundleUsage = ref(new Map<string, any>())

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

// Delete mutation with enhanced error handling
const deleteProductMutation = useDeleteProductMutation({
  onSuccess: (success, productId) => {
    if (success) {
      crudSuccess?.deleted('Produit', 'product')
    }
  },
  onError: (error: any) => {
    // Enhanced error display for referential integrity issues
    if (error.name === 'ReferentialIntegrityError') {
      const bundleCount = error.data?.bundleCount || 1
      const productName = error.productName || 'ce produit'

      crudError?.validation(
        `Impossible de supprimer "${productName}"`,
        `Il est utilisé dans ${bundleCount} bundle(s). Retirez-le des bundles avant de le supprimer.`
      )
    } else {
      // Fallback for other types of errors
      crudError?.deleted('product', error.message || 'Erreur lors de la suppression du produit')
    }
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
    key: 'bundles',
    label: 'Utilisé dans',
    sortable: false,
    class: 'w-32'
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
    class: 'w-40'
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
      crudError?.validation('Aucun produit à exporter')
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

    crudSuccess?.created('Export CSV', 'export')
  } catch (error) {
    crudError?.created('export', 'Erreur lors de l\'export')
  }
}

async function handleDeleteProduct(product: Product) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
    return
  }

  deleteProductMutation.mutate(product.id)
}

function viewProductBundles(product: Product) {
  // Rediriger vers la page des bundles avec le produit dans l'URL pour filtrage
  navigateTo({
    path: '/admin/bundles',
    query: { product: product.id, product_name: product.name }
  })
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

// Fonction pour récupérer les informations de bundles d'un produit
async function fetchProductBundleInfo(productId: string) {
  if (productBundleUsage.value.has(productId)) {
    return productBundleUsage.value.get(productId)
  }

  try {
    const response = await $fetch(`/api/products/${productId}/bundles`)
    const bundleInfo = response.data

    productBundleUsage.value.set(productId, bundleInfo)
    return bundleInfo
  } catch (error) {
    // En cas d'erreur, considérer que le produit n'est pas utilisé
    const emptyInfo = { bundles: [], stats: { totalBundles: 0 }, canDelete: true }
    productBundleUsage.value.set(productId, emptyInfo)
    return emptyInfo
  }
}

// Fonction helper pour obtenir le badge d'utilisation bundle
function getBundleUsageBadge(productId: string) {
  const bundleInfo = productBundleUsage.value.get(productId)

  if (!bundleInfo || bundleInfo.stats.totalBundles === 0) {
    return {
      text: 'Non utilisé',
      class: 'bg-gray-100 text-gray-700',
      canDelete: true,
      bundleCount: 0
    }
  }

  const count = bundleInfo.stats.totalBundles
  return {
    text: `${count} bundle${count > 1 ? 's' : ''}`,
    class: count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700',
    canDelete: false,
    bundleCount: count,
    bundles: bundleInfo.bundles
  }
}

// ===== LIFECYCLE =====
// Sync with Pinia store for cross-component state sharing
watchEffect(() => {
  if (data.value) {
    // Update store with fresh data (will trigger global event bus)
    productStore.products = data.value
  }
})

// Pre-charger les informations de bundles pour tous les produits visibles
watchEffect(async () => {
  if (displayedProducts.value && displayedProducts.value.length > 0) {
    // Charger les infos de bundles pour chaque produit (en parallèle)
    const loadPromises = displayedProducts.value.map(product =>
      fetchProductBundleInfo(product.id)
    )

    try {
      await Promise.all(loadPromises)
    } catch (error) {
      console.warn('Erreur lors du chargement des infos bundles:', error)
    }
  }
})

// Handle real-time updates (if SSE is configured)
onMounted(() => {
  // Listen for product updates from other interfaces
  const eventBus = useGlobalEventBus()

  eventBus.on('product.updated', () => {
    refetch()
    // Clear bundle cache pour forcer reload
    productBundleUsage.value.clear()
  })

  eventBus.on('product.created', () => {
    refetch()
  })

  eventBus.on('product.deleted', () => {
    refetch()
    // Clear bundle cache
    productBundleUsage.value.clear()
  })

  // Clear cache when bundles are updated
  eventBus.on('bundle.updated', () => {
    productBundleUsage.value.clear()
  })
})
</script>