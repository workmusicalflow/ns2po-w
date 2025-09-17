<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Gestion des Bundles</h1>
          <p class="text-gray-600">Gérez vos packs de campagne pré-configurés</p>
        </div>
        <NuxtLink
          to="/admin/bundles/new"
          class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Nouveau Bundle
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
              placeholder="Nom, description..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <!-- Target Audience Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Audience Cible</label>
          <select
            v-model="filters.audience"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Toutes les audiences</option>
            <option value="local">Local</option>
            <option value="regional">Régional</option>
            <option value="national">National</option>
            <option value="universal">Universel</option>
          </select>
        </div>

        <!-- Budget Range Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Gamme de Budget</label>
          <select
            v-model="filters.budget"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Tous les budgets</option>
            <option value="starter">Starter (0-10k XOF)</option>
            <option value="medium">Medium (10k-50k XOF)</option>
            <option value="premium">Premium (50k-200k XOF)</option>
            <option value="enterprise">Enterprise (200k+ XOF)</option>
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
          </select>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center space-x-2">
          <button
            @click="resetFilters"
            class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Réinitialiser
          </button>
          <button
            @click="exportBundles"
            class="px-4 py-2 text-sm text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Exporter
          </button>
        </div>
        <div class="text-sm text-gray-500">
          {{ filteredBundles.length }} bundle(s) trouvé(s)
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <AdminDataTable
      :data="filteredBundles"
      :columns="columns"
      :is-loading="isLoading"
      :search-key="'name'"
      :search-value="filters.search"
      title="Bundles"
      description="Liste de tous les packs de campagne disponibles"
      empty-title="Aucun bundle trouvé"
      empty-description="Commencez par créer votre premier pack de campagne."
      :get-row-key="(item) => item.id"
    >
      <!-- Custom slot for featured badge -->
      <template #cell-featured="{ value, item }">
        <div class="flex items-center">
          <span
            v-if="item.isFeatured"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
          >
            <Icon name="heroicons:star" class="w-3 h-3 mr-1" />
            Vedette
          </span>
          <span v-else class="text-gray-400 text-sm">-</span>
        </div>
      </template>

      <!-- Custom slot for target audience -->
      <template #cell-targetAudience="{ value }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="getAudienceClasses(value)"
        >
          {{ getAudienceText(value) }}
        </span>
      </template>

      <!-- Custom slot for budget range -->
      <template #cell-budgetRange="{ value }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="getBudgetClasses(value)"
        >
          {{ getBudgetText(value) }}
        </span>
      </template>

      <!-- Custom slot for product count -->
      <template #cell-productCount="{ value, item }">
        <span class="font-medium text-gray-900">
          {{ item.products?.length || 0 }} produit(s)
        </span>
      </template>

      <!-- Custom slot for estimated total -->
      <template #cell-estimatedTotal="{ value }">
        <span class="font-medium text-gray-900">
          {{ formatPrice(value) }}
        </span>
      </template>

      <!-- Custom slot for status -->
      <template #cell-status="{ value, item }">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          :class="{
            'bg-green-100 text-green-800': item.isActive,
            'bg-red-100 text-red-800': !item.isActive
          }"
        >
          {{ item.isActive ? 'Actif' : 'Inactif' }}
        </span>
      </template>

      <!-- Custom slot for popularity -->
      <template #cell-popularity="{ value }">
        <div class="flex items-center">
          <div class="flex-1 bg-gray-200 rounded-full h-2">
            <div
              class="bg-amber-600 h-2 rounded-full"
              :style="{ width: `${Math.min(value * 10, 100)}%` }"
            ></div>
          </div>
          <span class="ml-2 text-sm text-gray-500">{{ value }}</span>
        </div>
      </template>

      <!-- Actions slot -->
      <template #actions="{ item }">
        <div class="flex items-center space-x-2">
          <NuxtLink
            :to="`/admin/bundles/${item.id}`"
            class="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            Modifier
          </NuxtLink>
          <button
            @click="duplicateBundle(item)"
            class="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Dupliquer
          </button>
          <button
            @click="toggleStatus(item)"
            :class="item.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'"
            class="text-sm font-medium"
          >
            {{ item.isActive ? 'Désactiver' : 'Activer' }}
          </button>
          <button
            @click="deleteBundle(item)"
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
// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Bundles | Admin'
})

// Types
interface Bundle {
  id: string
  name: string
  description: string
  targetAudience: 'local' | 'regional' | 'national' | 'universal'
  budgetRange: 'starter' | 'medium' | 'premium' | 'enterprise'
  products: any[]
  estimatedTotal: number
  originalTotal?: number
  savings?: number
  popularity: number
  isActive: boolean
  isFeatured?: boolean
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// Reactive data
const isLoading = ref(false)
const bundles = ref<Bundle[]>([])

// Filters
const filters = reactive({
  search: '',
  audience: '',
  budget: '',
  status: ''
})

// Table columns configuration
const columns = [
  {
    key: 'featured',
    label: 'Vedette',
    sortable: false,
    class: 'w-20'
  },
  {
    key: 'name',
    label: 'Nom',
    sortable: true
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    class: 'max-w-xs truncate'
  },
  {
    key: 'targetAudience',
    label: 'Audience',
    sortable: true
  },
  {
    key: 'budgetRange',
    label: 'Budget',
    sortable: true
  },
  {
    key: 'productCount',
    label: 'Produits',
    sortable: false,
    class: 'text-center'
  },
  {
    key: 'estimatedTotal',
    label: 'Prix Total',
    sortable: true,
    class: 'text-right'
  },
  {
    key: 'popularity',
    label: 'Popularité',
    sortable: true,
    class: 'w-32'
  },
  {
    key: 'status',
    label: 'Statut',
    sortable: true
  },
  {
    key: 'updatedAt',
    label: 'Modifié',
    sortable: true,
    formatter: (value: string) => new Date(value).toLocaleDateString('fr-FR')
  }
]

// Computed
const filteredBundles = computed(() => {
  let result = [...bundles.value]

  // Filter by audience
  if (filters.audience) {
    result = result.filter(bundle => bundle.targetAudience === filters.audience)
  }

  // Filter by budget
  if (filters.budget) {
    result = result.filter(bundle => bundle.budgetRange === filters.budget)
  }

  // Filter by status
  if (filters.status) {
    const isActive = filters.status === 'active'
    result = result.filter(bundle => bundle.isActive === isActive)
  }

  return result
})

// Methods
async function fetchBundles() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/campaign-bundles')
    bundles.value = response.data || []
  } catch (error) {
    console.error('Error fetching bundles:', error)
    // TODO: Show error toast
  } finally {
    isLoading.value = false
  }
}

function resetFilters() {
  filters.search = ''
  filters.audience = ''
  filters.budget = ''
  filters.status = ''
}

function exportBundles() {
  // TODO: Implement export functionality
  console.log('Export bundles')
}

function duplicateBundle(bundle: Bundle) {
  // TODO: Implement duplicate functionality
  console.log('Duplicate bundle:', bundle)
}

async function toggleStatus(bundle: Bundle) {
  try {
    await $fetch(`/api/campaign-bundles/${bundle.id}`, {
      method: 'PUT',
      body: {
        isActive: !bundle.isActive
      }
    })

    // Update local state
    bundle.isActive = !bundle.isActive

    // TODO: Show success toast
  } catch (error) {
    console.error('Error toggling bundle status:', error)
    // TODO: Show error toast
  }
}

async function deleteBundle(bundle: Bundle) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le bundle "${bundle.name}" ?`)) return

  try {
    await $fetch(`/api/campaign-bundles/${bundle.id}`, {
      method: 'DELETE'
    })

    // Remove from local state
    const index = bundles.value.findIndex(b => b.id === bundle.id)
    if (index > -1) {
      bundles.value.splice(index, 1)
    }

    // TODO: Show success toast
  } catch (error) {
    console.error('Error deleting bundle:', error)
    // TODO: Show error toast
  }
}

function getAudienceText(audience: string): string {
  const audienceLabels = {
    local: 'Local',
    regional: 'Régional',
    national: 'National',
    universal: 'Universel'
  }
  return audienceLabels[audience] || audience
}

function getAudienceClasses(audience: string): string {
  const audienceClasses = {
    local: 'bg-blue-100 text-blue-800',
    regional: 'bg-green-100 text-green-800',
    national: 'bg-purple-100 text-purple-800',
    universal: 'bg-gray-100 text-gray-800'
  }
  return audienceClasses[audience] || 'bg-gray-100 text-gray-800'
}

function getBudgetText(budget: string): string {
  const budgetLabels = {
    starter: 'Starter',
    medium: 'Medium',
    premium: 'Premium',
    enterprise: 'Enterprise'
  }
  return budgetLabels[budget] || budget
}

function getBudgetClasses(budget: string): string {
  const budgetClasses = {
    starter: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    premium: 'bg-orange-100 text-orange-800',
    enterprise: 'bg-red-100 text-red-800'
  }
  return budgetClasses[budget] || 'bg-gray-100 text-gray-800'
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price)
}

// Lifecycle
onMounted(async () => {
  await fetchBundles()
})
</script>