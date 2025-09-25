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
              v-model="filters.search"
              type="text"
              placeholder="Nom, référence..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <!-- Category Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
          <select
            v-model="filters.category"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">
              Toutes les catégories
            </option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select
            v-model="filters.status"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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

    <!-- Products Table -->
    <AdminDataTable
      :data="filteredProducts"
      :columns="columns"
      :loading="isLoading"
      :error="error"
    >
      <!-- Custom slot for image -->
      <template #cell-image="{ item }">
        <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
          <AdvancedResponsiveImage
            v-if="item.image"
            :src="item.image"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <Icon name="heroicons:photo" class="w-6 h-6" />
          </div>
        </div>
      </template>

      <!-- Custom slot for price -->
      <template #cell-price="{ item }">
        <span class="font-medium text-gray-900">
          {{ formatPrice(item.price || item.basePrice) }}
        </span>
      </template>

      <!-- Custom slot for category -->
      <template #cell-category="{ item }">
        <span class="text-gray-900">
          {{ item.categoryDetails?.name || item.category || 'Non catégorisé' }}
        </span>
      </template>

      <!-- Custom slot for bundles usage -->
      <template #cell-bundles="{ item }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="getBundleUsageBadgeWrapper(item.id).class"
        >
          {{ getBundleUsageBadgeWrapper(item.id).text }}
        </span>
      </template>

      <!-- Custom slot for status -->
      <template #cell-status="{ item }">
        <StatusBadge :status="getProductStatus(item)">
          {{ getProductStatusLabel(item) }}
        </StatusBadge>
      </template>

      <!-- Actions slot -->
      <template #actions="{ item }">
        <div class="flex items-center space-x-2">
          <NuxtLink
            :to="`/admin/products/${item.id}`"
            class="text-amber-600 hover:text-amber-900 text-sm font-medium"
          >
            Modifier
          </NuxtLink>

          <!-- Bouton "Voir bundles" si le produit est utilisé -->
          <button
            v-if="!getBundleUsageBadgeWrapper(item.id).canDelete"
            class="text-blue-600 hover:text-blue-900 text-sm font-medium"
            @click="viewProductBundles(item)"
          >
            Voir bundles
          </button>

          <!-- Bouton Supprimer avec état conditionnel -->
          <button
            :class="[
              'text-sm font-medium',
              getBundleUsageBadgeWrapper(item.id).canDelete
                ? 'text-red-600 hover:text-red-900'
                : 'text-gray-400 cursor-not-allowed'
            ]"
            disabled
            :title="!getBundleUsageBadgeWrapper(item.id).canDelete ? 'Produit utilisé dans des bundles' : ''"
            @click="getBundleUsageBadgeWrapper(item.id).canDelete ? handleDeleteProduct(item) : null"
          >
            Supprimer (bientôt)
          </button>
        </div>
      </template>
    </AdminDataTable>

    <!-- Stats Summary -->
    <div v-if="!isLoading && filteredProducts" class="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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
            {{ categories?.length || 0 }}
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
 * Admin Products List Page - REFACTORED
 * SOLID Architecture - Cohérent avec l'interface Bundles
 * Vue Query exclusif - Pas de cache manuel ni événements globaux
 */

import AdminDataTable from '../../../components/admin/AdminDataTable.vue'
import { StatusBadge } from '@ns2po/ui'
import AdvancedResponsiveImage from '../../../components/AdvancedResponsiveImage.vue'

// SOLID Architecture imports - Vue Query exclusif
import { useProductsQuery, useProductSearchQuery } from '../../../composables/useProductsQuery'
import { useCategoriesQuery } from '../../../composables/useCategoriesQuery'
import { useMultipleProductBundleInfoQuery, useProductBundleUsageBadge, useProductBundleActions } from '../../../composables/useProductBundlesQuery'
import { useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '../../../composables/useProductMutations'
import { globalNotifications } from '../../../composables/useNotifications'
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

// Global notifications - Pattern Bundles
const { crudSuccess, crudError } = globalNotifications

// ===== FILTERS - Simple et cohérent avec Bundles =====
const filters = reactive({
  search: '',
  category: '',
  status: ''
})

const debouncedSearch = refDebounced(computed(() => filters.search), 300)

// ===== COMPUTED FILTERS - Simplifié =====
const currentFilters = computed((): ProductFilters => {
  const result: ProductFilters = {}

  if (filters.category) {
    result.category = filters.category
  }

  if (filters.status) {
    result.status = filters.status as ProductStatus
  }

  return result
})

// ===== VUE QUERY INTEGRATION - Exclusif et cohérent =====
// Main products query
const {
  data: products,
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

// Categories query - Vue Query cohérent
const { data: categories } = useCategoriesQuery()

// ===== MUTATIONS CRUD - Vue Query intégré =====
const createProductMutation = useCreateProductMutation()
const updateProductMutation = useUpdateProductMutation()
const deleteProductMutation = useDeleteProductMutation()

// ===== COMPUTED PROPERTIES - Simples et claires =====
const filteredProducts = computed(() => {
  // Use search results if searching, otherwise use main query
  if (debouncedSearch.value.length >= 2) {
    return searchResults.value || []
  }
  return products.value || []
})

// Bundle management - Vue Query cohérent
const productIds = computed(() => filteredProducts.value.map(p => p.id))
const bundleQueries = useMultipleProductBundleInfoQuery(productIds)
const { getBundleUsageBadge } = useProductBundleUsageBadge()
const { viewProductBundles } = useProductBundleActions()

// Helper pour obtenir le badge bundle d'un produit spécifique
const getBundleUsageBadgeForProduct = (productId: string) => {
  // Les queries sont dans le même ordre que les productIds
  const index = productIds.value.indexOf(productId)
  if (index !== -1 && bundleQueries.value[index]) {
    return getBundleUsageBadge(bundleQueries.value[index].data)
  }
  return getBundleUsageBadge(undefined)
}

// Stats computées simples
const totalProducts = computed(() => filteredProducts.value.length)
const activeProductsCount = computed(() =>
  filteredProducts.value.filter(p => p.isActive || p.status === 'active').length
)
const averagePrice = computed(() => {
  const prods = filteredProducts.value
  if (prods.length === 0) return 0
  const total = prods.reduce((sum, p) => sum + (p.price || p.basePrice || 0), 0)
  return total / prods.length
})

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

// ===== METHODS - Simples et focalisées =====
function resetFilters() {
  filters.search = ''
  filters.category = ''
  filters.status = ''
}

async function exportProducts() {
  try {
    const productsToExport = filteredProducts.value

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
        `"${product.categoryDetails?.name || product.category || ''}"`,
        `"${getProductStatusLabel(product)}"`
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

    crudSuccess.created('Export CSV généré avec succès', 'export')
  } catch (error) {
    crudError.created('export', 'Erreur lors de l\'export')
  }
}

async function handleDeleteProduct(product: Product) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) return

  try {
    await deleteProductMutation.mutateAsync(product.id)
    crudSuccess.deleted(`Produit "${product.name}" supprimé avec succès`, 'product')
  } catch (error) {
    console.error('Error deleting product:', error)
    crudError.deleted('product', `Erreur lors de la suppression du produit "${product.name}"`)
  }
}

// ===== HELPER FUNCTIONS - Pures et focalisées =====
function getProductStatus(product: Product): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
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

function formatPrice(price: number | undefined | null): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A'
  }
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price) + ' XOF'
}

// Fonction adaptée pour usage dans template
const getBundleUsageBadgeWrapper = (productId: string) => {
  return getBundleUsageBadgeForProduct(productId)
}

// ===== ERROR HANDLING - Pattern Bundles =====
watch(error, (newError) => {
  if (newError) {
    console.error('Error loading products:', newError)
    crudError.validation('Impossible de charger les produits')
  }
})

watch(searchError, (newError) => {
  if (newError) {
    console.error('Error searching products:', newError)
    crudError.validation('Erreur lors de la recherche')
  }
})
</script>