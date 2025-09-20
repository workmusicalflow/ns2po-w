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
              v-model="filters.search"
              type="text"
              placeholder="Nom, référence..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
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
            <option value="">Toutes les catégories</option>
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
          >
            Exporter
          </button>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <AdminDataTable
      :data="filteredProducts"
      :columns="columns"
      :is-loading="isLoading"
      :search-key="'name'"
      :search-value="filters.search"
      title="Produits"
      description="Liste de tous les produits disponibles"
      empty-title="Aucun produit trouvé"
      empty-description="Commencez par créer votre premier produit."
      :get-row-key="(item) => item.id"
    >
      <!-- Custom slot for product image -->
      <template #cell-image="{ value, item }">
        <div class="flex items-center">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="w-12 h-12 rounded-lg object-cover"
          />
          <div
            v-else
            class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"
          >
            <Icon name="heroicons:photo" class="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </template>

      <!-- Custom slot for status -->
      <template #cell-isActive="{ value, item }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="{
            'bg-green-100 text-green-800': value === true || item.status === 'active',
            'bg-red-100 text-red-800': value === false || item.status === 'inactive',
            'bg-yellow-100 text-yellow-800': item.status === 'draft'
          }"
        >
          {{ value === true || item.status === 'active' ? 'Actif' : value === false || item.status === 'inactive' ? 'Inactif' : getStatusText(item.status) }}
        </span>
      </template>

      <!-- Custom slot for price -->
      <template #cell-basePrice="{ value }">
        <span class="font-medium text-gray-900">
          {{ formatPrice(value) }}
        </span>
      </template>

      <!-- Actions slot -->
      <template #actions="{ item }">
        <div class="flex items-center space-x-2">
          <NuxtLink
            :to="`/admin/products/${item.id}`"
            class="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            Modifier
          </NuxtLink>
          <button
            @click="duplicateProduct(item)"
            class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Dupliquer
          </button>
          <button
            @click="deleteProduct(item)"
            class="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Supprimer
          </button>
        </div>
      </template>
    </AdminDataTable>
  </div>
</template>

<script setup lang="ts">
import AdminDataTable from '~/components/admin/AdminDataTable.vue'
import { globalNotifications } from '~/composables/useNotifications'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Produits | Admin'
})

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Types
interface Product {
  id: string
  name: string
  reference?: string
  description: string
  basePrice?: number
  price?: number
  category: string
  category_id?: string
  category_name?: string
  status?: 'active' | 'inactive' | 'draft'
  isActive?: boolean
  image?: string
  image_url?: string
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

interface Category {
  id: string
  name: string
}

// Reactive data
const isLoading = ref(false)
const products = ref<Product[]>([])
const categories = ref<Category[]>([])

// Filters
const filters = reactive({
  search: '',
  category: '',
  status: ''
})

// Table columns configuration
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
    key: 'reference',
    label: 'Référence',
    sortable: true,
    class: 'text-gray-500'
  },
  {
    key: 'category',
    label: 'Catégorie',
    sortable: true,
    class: 'text-gray-600'
  },
  {
    key: 'basePrice',
    label: 'Prix',
    sortable: true,
    class: 'text-right'
  },
  {
    key: 'isActive',
    label: 'Statut',
    sortable: true
  },
  {
    key: 'updatedAt',
    label: 'Modifié',
    sortable: true,
    formatter: (value: string) => value ? new Date(value).toLocaleDateString('fr-FR') : 'N/A'
  }
]

// Computed
const filteredProducts = computed(() => {
  let result = [...products.value]

  // Filter by category
  if (filters.category) {
    result = result.filter(product =>
      product.category === filters.category ||
      product.category_id === filters.category
    )
  }

  // Filter by status
  if (filters.status) {
    if (filters.status === 'active') {
      result = result.filter(product => product.isActive === true || product.status === 'active')
    } else if (filters.status === 'inactive') {
      result = result.filter(product => product.isActive === false || product.status === 'inactive')
    } else {
      result = result.filter(product => product.status === filters.status)
    }
  }

  return result
})

// Methods
async function fetchProducts() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/products')
    products.value = response.data || []
  } catch (error) {
    console.error('Error fetching products:', error)
    // TODO: Show error toast
  } finally {
    isLoading.value = false
  }
}

async function fetchCategories() {
  try {
    const response = await $fetch('/api/categories')
    categories.value = response.data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

function resetFilters() {
  filters.search = ''
  filters.category = ''
  filters.status = ''
}

function exportProducts() {
  // TODO: Implement export functionality
  console.log('Export products')
}

function duplicateProduct(product: Product) {
  // TODO: Implement duplicate functionality
  console.log('Duplicate product:', product)
}

async function deleteProduct(product: Product) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) return

  try {
    await $fetch(`/api/products/${product.id}`, {
      method: 'DELETE'
    })

    // Remove from local state
    const index = products.value.findIndex(p => p.id === product.id)
    if (index > -1) {
      products.value.splice(index, 1)
    }

    crudSuccess.deleted(`Produit "${product.name}" supprimé avec succès`, 'product')
  } catch (error) {
    console.error('Error deleting product:', error)
    if (error.statusCode === 409) {
      crudError.deleted('product', 'Impossible de supprimer ce produit car il est utilisé dans des bundles.')
    } else {
      crudError.deleted('product', `Erreur lors de la suppression du produit "${product.name}"`)
    }
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Actif'
    case 'inactive': return 'Inactif'
    case 'draft': return 'Brouillon'
    default: return status
  }
}

function formatPrice(price: number | undefined | null): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A'
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchCategories()
  ])
})
</script>