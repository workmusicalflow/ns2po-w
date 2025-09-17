<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900">Gestion des Bundles</h1>
        <p class="mt-2 text-sm text-gray-700">
          Liste et gestion des packs de campagne disponibles dans le système.
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:w-auto"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Nouveau Bundle
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-4">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="heroicons:shopping-bag" class="h-6 w-6 text-gray-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Bundles</dt>
                <dd class="text-lg font-medium text-gray-900">{{ bundles.length }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="heroicons:star" class="h-6 w-6 text-amber-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Featured</dt>
                <dd class="text-lg font-medium text-gray-900">{{ featuredCount }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="heroicons:check-circle" class="h-6 w-6 text-green-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Actifs</dt>
                <dd class="text-lg font-medium text-gray-900">{{ activeCount }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon name="heroicons:chart-bar" class="h-6 w-6 text-blue-400" />
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Source</dt>
                <dd class="text-lg font-medium text-gray-900">{{ dataSource }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <AdminDataTable
      :data="bundles"
      :columns="columns"
      :is-loading="isLoading"
      title="Campaign Bundles"
      description="Gestion complète des bundles de campagne"
      empty-title="Aucun bundle trouvé"
      empty-description="Aucun bundle de campagne n'a été configuré pour le moment."
    >
      <template #cell-featured="{ item }">
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            item.isFeatured
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          ]"
        >
          <Icon
            :name="item.isFeatured ? 'heroicons:star-solid' : 'heroicons:star'"
            class="w-3 h-3 mr-1"
          />
          {{ item.isFeatured ? 'Vedette' : 'Normal' }}
        </span>
      </template>

      <template #cell-budgetRange="{ value }">
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            value === 'starter'
              ? 'bg-green-100 text-green-800'
              : value === 'standard'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-purple-100 text-purple-800'
          ]"
        >
          {{
            value === 'starter' ? 'Starter' :
            value === 'standard' ? 'Standard' :
            'Premium'
          }}
        </span>
      </template>

      <template #cell-estimatedTotal="{ value }">
        <span class="font-medium text-gray-900">
          {{ new Intl.NumberFormat('fr-CI', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
          }).format(value) }}
        </span>
      </template>

      <template #cell-popularity="{ value }">
        <div class="flex items-center">
          <div class="flex-1 bg-gray-200 rounded-full h-2 mr-2">
            <div
              class="bg-amber-600 h-2 rounded-full"
              :style="{ width: `${value}%` }"
            ></div>
          </div>
          <span class="text-sm text-gray-600">{{ value }}%</span>
        </div>
      </template>

      <template #cell-status="{ item }">
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            item.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          ]"
        >
          {{ item.isActive ? 'Actif' : 'Inactif' }}
        </span>
      </template>

      <template #actions="{ item }">
        <div class="flex items-center space-x-2">
          <button
            class="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            @click="editBundle(item)"
          >
            Modifier
          </button>
          <button
            class="text-green-600 hover:text-green-900 text-sm font-medium"
            @click="duplicateBundle(item)"
          >
            Dupliquer
          </button>
          <button
            class="text-red-600 hover:text-red-900 text-sm font-medium"
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
import type { BundleApiResponse } from '@ns2po/types'

// Meta et layout
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Reactive data
const isLoading = ref(true)
const bundles = ref([])
const dataSource = ref('unknown')

// Computed
const featuredCount = computed(() =>
  bundles.value.filter((bundle: any) => bundle.isFeatured).length
)

const activeCount = computed(() =>
  bundles.value.filter((bundle: any) => bundle.isActive).length
)

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
    class: 'text-center',
    formatter: (value: any, item: any) => item.products?.length || 0
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
      return new Date(value).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
  }
]

// Methods
async function loadBundles() {
  try {
    isLoading.value = true

    const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

    if (response.success) {
      bundles.value = response.data
      dataSource.value = response.source || 'unknown'
    } else {
      throw new Error(response.error || 'Erreur lors du chargement des bundles')
    }
  } catch (error) {
    console.error('Erreur loading bundles:', error)

    // Utiliser les données de fallback si disponibles
    bundles.value = []
    dataSource.value = 'error'
  } finally {
    isLoading.value = false
  }
}

function editBundle(bundle: any) {
  console.log('Edit bundle:', bundle)
  // TODO: Implémenter l'édition
}

function duplicateBundle(bundle: any) {
  console.log('Duplicate bundle:', bundle)
  // TODO: Implémenter la duplication
}

function deleteBundle(bundle: any) {
  console.log('Delete bundle:', bundle)
  // TODO: Implémenter la suppression
}

// Lifecycle
onMounted(() => {
  loadBundles()
})
</script>
