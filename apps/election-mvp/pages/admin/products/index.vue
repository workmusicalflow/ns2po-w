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
          class="inline-flex items-center px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50"
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

    <!-- Loading State avec Spinner - Feedback visuel données fraîches -->
    <div v-if="isLoading || isFetching" class="bg-white p-12 rounded-lg shadow-sm border border-gray-200 mb-6 text-center">
      <div class="inline-flex items-center space-x-3">
        <div class="w-6 h-6 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <span class="text-gray-600">
          {{ isLoading ? 'Chargement des produits...' : 'Actualisation des données...' }}
        </span>
      </div>
    </div>

    <!-- Products Table -->
    <AdminDataTable
      v-else
      :data="filteredProducts as any"
      :columns="columns"
      :loading="false"
      :error="error"
    >
      <!-- Custom slot for image -->
      <template #cell-image="{ item }">
        <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
          <AdvancedResponsiveImage
            v-if="(item as any).image"
            :src="(item as any).image"
            :alt="(item as any).name"
            context="thumbnail"
            :eager="true"
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
          {{ formatPrice((item as any).price || (item as any).basePrice) }}
        </span>
      </template>

      <!-- Custom slot for category -->
      <template #cell-category="{ item }">
        <span class="text-gray-900">
          {{ (item as any).category || 'Non catégorisé' }}
        </span>
      </template>

      <!-- Custom slot for bundles usage -->
      <template #cell-bundles="{ item }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="getBundleUsageBadgeWrapper((item as any).id).class"
        >
          {{ getBundleUsageBadgeWrapper((item as any).id).text }}
        </span>
      </template>

      <!-- Custom slot for status -->
      <template #cell-status="{ item }">
        <StatusBadge :status="getProductStatus(item as any)">
          {{ getProductStatusLabel(item as any) }}
        </StatusBadge>
      </template>

      <!-- Actions slot -->
      <template #actions="{ item }">
        <div class="flex items-center space-x-2">
          <NuxtLink
            :to="`/admin/products/${(item as any).id}`"
            class="text-amber-600 hover:text-amber-900 text-sm font-medium"
          >
            Modifier
          </NuxtLink>

          <!-- Bouton "Voir bundles" si le produit est utilisé -->
          <button
            v-if="!getBundleUsageBadgeWrapper((item as any).id).canDelete"
            class="text-blue-600 hover:text-blue-900 text-sm font-medium"
            @click="viewProductBundles(item as any)"
          >
            Voir bundles
          </button>

          <!-- Bouton Supprimer avec état conditionnel -->
          <button
            :class="[
              'text-sm font-medium',
              getBundleUsageBadgeWrapper((item as any).id).canDelete
                ? 'text-red-600 hover:text-red-900'
                : 'text-gray-400 cursor-not-allowed'
            ]"
            disabled
            :title="!getBundleUsageBadgeWrapper((item as any).id).canDelete ? 'Produit utilisé dans des bundles' : ''"
            @click="getBundleUsageBadgeWrapper((item as any).id).canDelete ? handleDeleteProduct(item as any) : null"
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
 * Admin Products List Page - AUDIT FIX
 * Architecture hybride: useAsyncData (liste principale) + TanStack Query (mutations/recherche)
 * Pattern identique Page Édition pour spinner global garanti
 * FIX: Migration useProductsQuery → useAsyncData pour résoudre spinner invisible
 */

import AdminDataTable from '../../../components/admin/AdminDataTable.vue'
import { StatusBadge } from '@ns2po/ui'
import AdvancedResponsiveImage from '../../../components/AdvancedResponsiveImage.vue'

// SOLID Architecture imports - Architecture Hybride (Reversement Phase 3)
// useAsyncData pour data loading (Nuxt Cache) + TanStack Query pour mutations CRUD
import { useProductSearchQuery } from '../../../composables/useProductsQuery'
import { useCategoriesQuery } from '../../../composables/useCategoriesQuery'
import { useMultipleProductBundleInfoQuery, useProductBundleUsageBadge, useProductBundleActions } from '../../../composables/useProductBundlesQuery'
import { useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '../../../composables/useProductMutations'
import { globalNotifications } from '../../../composables/useNotifications'
import { useGlobalLoading } from '../../../composables/useGlobalLoading'
import { useCacheInvalidation } from '../../../composables/useCacheInvalidation'
import { refDebounced } from '@vueuse/core'
import type { Product, ProductFilters, ProductStatus } from '../../../types/domain/Product'

// Layout and metadata
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
  ssr: false
})

useHead({
  title: 'Produits | Admin'
})

// Global notifications - Pattern Bundles
const { crudSuccess, crudError } = globalNotifications

// Global loading control - Pattern Page Édition
const { startLoading, stopLoading } = useGlobalLoading()

// ===== FILTERS - Simple et cohérent avec Bundles =====
const filters = ref({
  search: '',
  category: '',
  status: ''
})

const debouncedSearch = refDebounced(computed(() => filters.value.search), 300)

// ===== COMPUTED FILTERS - Simplifié =====
const currentFilters = computed((): Partial<ProductFilters> => {
  const result: Record<string, any> = {} // Utiliser Record pour éviter readonly errors

  if (filters.value.search) {
    result.search = filters.value.search
  }

  if (filters.value.category) {
    result.category = filters.value.category
  }

  if (filters.value.status) {
    result.status = filters.value.status as ProductStatus
  }

  return result as Partial<ProductFilters>
})

// ===== MAIN DATA LOADING - useAsyncData (Reversement Phase 3) =====
// ⭐ REVERSEMENT PHASE 3: Migration TanStack Query → useAsyncData pour copier le pattern réussi de [id].vue
// Pattern identique à [Page Édition [id].vue] → useAsyncData → Nuxt Cache
// Utilise /api/products car /api/admin/products GET liste n'existe pas (seulement POST/PUT/DELETE)

// ⭐ FIX 6: Cache invalidation tracker pour forcer refetch après mutations (sans F5)
const { getCachedDataOrRefetch } = useCacheInvalidation()

const { data: productsData, pending, error, refresh } = await useAsyncData(
  'admin-products-list', // Key unique pour le cache Nuxt
  async () => {
    const startTime = Date.now()
    console.log('🔄 [useAsyncData] Fetching products list from API')

    try {
      // Appel API avec filtres (cache Nitro actif avec invalidation auto)
      const response = await $fetch('/api/products', {
        query: currentFilters.value
      }) as { success: boolean; data: Product[] }

      // Garantir 3 secondes minimum de spinner (UX cohérente 3G comme [id].vue)
      const elapsed = Date.now() - startTime
      const remaining = 3000 - elapsed

      if (remaining > 0) {
        console.log(`⏱️ [useAsyncData] Délai artificiel: ${remaining}ms pour atteindre 3s minimum`)
        await new Promise(resolve => setTimeout(resolve, remaining))
      }

      console.log(`✅ [useAsyncData] Produits chargés en ${Date.now() - startTime}ms`)

      return response.success ? response.data : []
    } catch (e) {
      console.error('❌ [useAsyncData] Error fetching products:', e)
      throw e
    }
  },
  {
    server: true,   // SSR enabled
    lazy: false,    // Bloque le rendu jusqu'à ce que les données arrivent (spinner garanti visible)
    immediate: true, // Exécute immédiatement
    getCachedData: (key) => getCachedDataOrRefetch(key) // ⭐ FIX 6: Force refetch si cache invalidé récemment
  }
)

// Convertir Ref<Product[]> en computed pour réactivité
const products = computed(() => productsData.value || [])

// Gérer le spinner global basé sur l'état `pending` de useAsyncData (pattern [id].vue)
watch(pending, (isPending) => {
  if (isPending) {
    console.log('🔄 [watch(pending)] Spinner activé - Chargement en cours...')
    startLoading('Chargement des produits...')
  } else {
    console.log('✅ [watch(pending)] Spinner désactivé - Chargement terminé')
    // Petit délai pour fluidité visuelle (comme dans [id].vue)
    setTimeout(() => stopLoading(), 300)
  }
}, { immediate: true })

// ⭐ FIX FINAL: Pinia Store + refresh() explicite (Solution Gemini Google Search)
// Résout problème bfcache: refreshNuxtData inter-pages ne fonctionne pas
// Pattern validé communauté 2024-2025 (24 sources citées)
const productStore = useProductStore()

onMounted(async () => {
  console.log('🔄 [LISTE PRODUITS] onMounted - Check flag Pinia needsProductListRefresh:', productStore.needsProductListRefresh)

  if (productStore.needsProductListRefresh) {
    console.log('🔄 [LISTE PRODUITS] Détection besoin rafraîchissement via Pinia. Forçage refetch.')
    await refresh() // Appel explicite refresh() de useAsyncData
    productStore.clearProductListStaleFlag()
    console.log('✅ [LISTE PRODUITS] Rafraîchissement terminé, flag réinitialisé')
  }
})

// Créer isLoading et isFetching pour compatibilité template
const isLoading = computed(() => pending.value)
const isFetching = computed(() => pending.value)

// ===== SYNCHRONISATION CACHE (Phase 3 Reversal Final) =====
// ⭐ Synchronisation via refreshNuxtData() - Pas besoin d'Event Bus
// [id].vue appelle refreshNuxtData('admin-products-list') après chaque mutation
// → useAsyncData('admin-products-list') détecte cache stale et refetch automatiquement
// → Fonctionne même si index.vue n'est pas encore monté (zéro problème de chronologie)

// Search query (separate for performance)
const {
  data: searchResults,
  error: searchError,
  isLoading: isSearching
} = useProductSearchQuery(debouncedSearch, currentFilters, {
  enabled: computed(() => debouncedSearch.value.length >= 2)
} as any)

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
  filters.value.search = ''
  filters.value.category = ''
  filters.value.status = ''
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
        `"${product.category || ''}"`,
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