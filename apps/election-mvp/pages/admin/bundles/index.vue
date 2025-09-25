<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Gestion des Bundles
          </h1>
          <p class="text-gray-600">
            Gérez vos packs de campagne pré-configurés
          </p>
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
            >
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
            <option value="">
              Toutes les audiences
            </option>
            <option value="local">
              Local
            </option>
            <option value="regional">
              Régional
            </option>
            <option value="national">
              National
            </option>
            <option value="universal">
              Universel
            </option>
          </select>
        </div>

        <!-- Budget Range Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Gamme de Budget</label>
          <select
            v-model="filters.budget"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">
              Tous les budgets
            </option>
            <option value="starter">
              Starter (0-10k XOF)
            </option>
            <option value="medium">
              Medium (10k-50k XOF)
            </option>
            <option value="premium">
              Premium (50k-200k XOF)
            </option>
            <option value="enterprise">
              Enterprise (200k+ XOF)
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
          </select>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center space-x-2">
          <button
            class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            @click="resetFilters"
          >
            Réinitialiser
          </button>
          <button
            class="px-4 py-2 text-sm text-amber-600 bg-amber-50 rounded-md hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            @click="exportBundles"
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
            />
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
            class="text-blue-600 hover:text-blue-700 text-sm font-medium"
            @click="duplicateBundle(item)"
          >
            Dupliquer
          </button>
          <button
            :class="item.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'"
            class="text-sm font-medium"
            @click="toggleStatus(item)"
          >
            {{ item.isActive ? 'Désactiver' : 'Activer' }}
          </button>
          <button
            class="text-red-600 hover:text-red-700 text-sm font-medium"
            @click="deleteBundle(item)"
          >
            Supprimer
          </button>
        </div>
      </template>
    </AdminDataTable>
  </div>
</template>

<script setup lang="ts">
import AdminDataTable from '../../../components/admin/AdminDataTable.vue'
import type { BundleApiResponse, ApiResponse } from "@ns2po/types"
import type { BundleAggregate, BundleTargetAudience, BundleBudgetRange } from '../../../types/domain/Bundle'
import { globalNotifications } from '../../../composables/useNotifications'
import { useBundlesQuery, useUpdateBundleMutation, useDeleteBundleMutation } from '../../../composables/useBundlesQuery'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Bundles | Admin'
})

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Vue Query composables
const { data: bundles, isLoading, error } = useBundlesQuery()
const updateBundleMutation = useUpdateBundleMutation()
const deleteBundleMutation = useDeleteBundleMutation()

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
    formatter: (value: string) => {
      if (!value) return 'N/A'
      const date = new Date(value)
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('fr-FR')
    }
  }
]

// Computed
const filteredBundles = computed(() => {
  if (!bundles.value) return []
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

// Methods - Vue Query handles data fetching automatically
// No need for manual fetchBundles() function

function resetFilters() {
  filters.search = ''
  filters.audience = ''
  filters.budget = ''
  filters.status = ''
}

async function exportBundles() {
  try {
    const bundlesToExport = filteredBundles.value

    if (bundlesToExport.length === 0) {
      crudError.validation('Aucun bundle à exporter')
      return
    }

    // Create CSV content
    const headers = ['Nom', 'Description', 'Audience', 'Budget', 'Produits', 'Prix Total', 'Statut']
    const csvContent = [
      headers.join(','),
      ...bundlesToExport.map(bundle => [
        `"${bundle.name}"`,
        `"${bundle.description || ''}"`,
        `"${getAudienceText(bundle.targetAudience as BundleTargetAudience)}"`,
        `"${getBudgetText(bundle.budgetRange as BundleBudgetRange)}"`,
        bundle.bundleProductCount || 0,
        bundle.totalPrice || 0,
        `"${bundle.isActive ? 'Actif' : 'Inactif'}"`
      ].join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bundles-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)

    crudSuccess.created('Export CSV généré avec succès', 'export')
  } catch (error) {
    crudError.created('export', 'Erreur lors de l\'export')
  }
}

async function duplicateBundle(bundle: BundleAggregate) {
  try {
    // Create a duplicate bundle with modified name
    const duplicatedBundle = {
      name: `${bundle.name} (Copie)`,
      description: bundle.description,
      targetAudience: bundle.targetAudience,
      budgetRange: bundle.budgetRange,
      isActive: false, // New bundle starts as inactive
      displayOrder: bundle.displayOrder || 999,
      totalPrice: bundle.totalPrice,
      products: bundle.products || []
    }

    // Navigate to new bundle page with pre-filled data
    await navigateTo({
      path: '/admin/bundles/new',
      query: {
        duplicate: 'true',
        data: encodeURIComponent(JSON.stringify(duplicatedBundle))
      }
    })

    crudSuccess.created('Redirection vers la création du bundle dupliqué', 'bundle')
  } catch (error) {
    console.error('Error duplicating bundle:', error)
    crudError.validation('Erreur lors de la duplication du bundle')
  }
}

async function toggleStatus(bundle: BundleAggregate) {
  try {
    await updateBundleMutation.mutateAsync({
      id: bundle.id,
      data: {
        isActive: !bundle.isActive
      }
    })

    crudSuccess.updated(`Statut du bundle "${bundle.name}" modifié avec succès`, 'bundle')
  } catch (error) {
    console.error('Error toggling bundle status:', error)
    crudError.updated('bundle', `Erreur lors de la modification du statut du bundle "${bundle.name}"`)
  }
}

async function deleteBundle(bundle: BundleAggregate) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le bundle "${bundle.name}" ?`)) return

  try {
    await deleteBundleMutation.mutateAsync(bundle.id)
    crudSuccess.deleted(`Bundle "${bundle.name}" supprimé avec succès`, 'bundle')
  } catch (error) {
    console.error('Error deleting bundle:', error)
    crudError.deleted('bundle', `Erreur lors de la suppression du bundle "${bundle.name}"`)
  }
}

function getAudienceText(audience: BundleTargetAudience): string {
  const audienceLabels: Record<BundleTargetAudience, string> = {
    local: 'Local',
    regional: 'Régional',
    national: 'National',
    universal: 'Universel'
  }
  return audienceLabels[audience] || audience
}

function getAudienceClasses(audience: BundleTargetAudience): string {
  const audienceClasses: Record<BundleTargetAudience, string> = {
    local: 'bg-blue-100 text-blue-800',
    regional: 'bg-green-100 text-green-800',
    national: 'bg-purple-100 text-purple-800',
    universal: 'bg-gray-100 text-gray-800'
  }
  return audienceClasses[audience] || 'bg-gray-100 text-gray-800'
}

function getBudgetText(budget: BundleBudgetRange): string {
  const budgetLabels: Record<BundleBudgetRange, string> = {
    starter: 'Starter',
    medium: 'Medium',
    premium: 'Premium',
    enterprise: 'Enterprise'
  }
  return budgetLabels[budget] || budget
}

function getBudgetClasses(budget: BundleBudgetRange): string {
  const budgetClasses: Record<BundleBudgetRange, string> = {
    starter: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    premium: 'bg-orange-100 text-orange-800',
    enterprise: 'bg-red-100 text-red-800'
  }
  return budgetClasses[budget] || 'bg-gray-100 text-gray-800'
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

// Lifecycle - Vue Query handles data fetching automatically
// No need for onMounted fetchBundles() call

// Watch for errors
watch(error, (newError) => {
  if (newError) {
    console.error('Error loading bundles:', newError)
    crudError.validation('Impossible de charger les bundles')
  }
})
</script>