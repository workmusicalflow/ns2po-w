<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Assets Cloudinary
          </h1>
          <p class="text-gray-600 mt-1">
            Gestion centralisée de tous les médias NS2PO
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-3">
          <!-- Sync Button -->
          <button
            @click="syncCloudinaryAssets"
            :disabled="isSyncing"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Icon
              :name="isSyncing ? 'heroicons:arrow-path' : 'heroicons:arrow-path'"
              :class="['w-4 h-4', isSyncing && 'animate-spin']"
            />
            <span>{{ isSyncing ? 'Synchronisation...' : 'Sync Cloudinary' }}</span>
          </button>

          <!-- Upload Button -->
          <button
            @click="showUploadModal = true"
            class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4" />
            <span>Uploader un asset</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Recherche
          </label>
          <div class="relative">
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Public ID, alt text, caption..."
              class="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
          </div>
        </div>

        <!-- Format Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <select
            v-model="filters.format"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Tous les formats</option>
            <option value="jpg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
            <option value="avif">AVIF</option>
            <option value="gif">GIF</option>
            <option value="pdf">PDF</option>
            <option value="mp4">MP4</option>
          </select>
        </div>

        <!-- Folder Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Dossier
          </label>
          <select
            v-model="filters.folder"
            class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="">Tous les dossiers</option>
            <option value="ns2po/products">Produits</option>
            <option value="ns2po/realisations">Réalisations</option>
            <option value="ns2po/campaigns">Campagnes</option>
            <option value="ns2po/misc">Divers</option>
          </select>
        </div>
      </div>

      <!-- Sort and View Options -->
      <div class="mt-4 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Trier par:</label>
            <select
              v-model="pagination.sortBy"
              class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="created_at">Date de création</option>
              <option value="updated_at">Dernière modification</option>
              <option value="bytes">Taille</option>
            </select>
            <select
              v-model="pagination.sortOrder"
              class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="desc">Décroissant</option>
              <option value="asc">Croissant</option>
            </select>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">Par page:</span>
          <select
            v-model="pagination.limit"
            class="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option :value="12">12</option>
            <option :value="24">24</option>
            <option :value="48">48</option>
            <option :value="96">96</option>
          </select>
        </div>
      </div>

      <!-- Clear Filters -->
      <div v-if="hasActiveFilters" class="mt-4 pt-4 border-t border-gray-200">
        <button
          @click="clearFilters"
          class="text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>

    <!-- Sync Message -->
    <div v-if="syncMessage" class="mb-6">
      <div :class="[
        'rounded-lg border p-4',
        syncError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
      ]">
        <div class="flex items-center space-x-3">
          <Icon
            :name="syncError ? 'heroicons:exclamation-triangle' : 'heroicons:check-circle'"
            class="w-5 h-5"
          />
          <p class="font-medium">{{ syncMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="assetsQuery.isLoading.value" class="text-center py-12">
      <div class="inline-flex items-center space-x-2">
        <div class="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-gray-600">Chargement des assets...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="assetsQuery.isError.value" class="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div class="flex items-center space-x-3">
        <Icon name="heroicons:exclamation-triangle" class="w-6 h-6 text-red-600" />
        <div>
          <h3 class="font-medium text-red-800">
            Erreur lors du chargement des assets
          </h3>
          <p class="text-red-700 mt-1">
            {{ assetsQuery.error.value?.message || 'Une erreur inconnue s\'est produite' }}
          </p>
        </div>
      </div>
      <button
        @click="assetsQuery.refetch()"
        class="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
      >
        Réessayer
      </button>
    </div>

    <!-- Assets Grid -->
    <div v-else-if="assetsData?.assets.length">
      <!-- Stats -->
      <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div class="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span class="font-medium">{{ assetsData.total }}</span>
            asset(s) total •
            <span class="font-medium">{{ assetsData.assets.length }}</span>
            affiché(s) sur cette page
          </div>
          <div>
            Page <span class="font-medium">{{ assetsData.page }}</span>
            sur <span class="font-medium">{{ assetsData.totalPages }}</span>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-6">
        <AssetCard
          v-for="asset in assetsData.assets"
          :key="asset.id"
          :asset="asset"
          @view="handleViewAsset"
          @edit="handleEditAsset"
          @replace="handleReplaceAsset"
          @delete="handleDeleteAsset"
        />
      </div>

      <!-- Pagination -->
      <div v-if="assetsData.totalPages > 1" class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <button
            @click="goToPage(assetsData.page - 1)"
            :disabled="!assetsData.hasPrev"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <Icon name="heroicons:chevron-left" class="w-4 h-4" />
          </button>

          <div class="flex items-center space-x-1">
            <template v-for="pageNum in visiblePages" :key="pageNum">
              <button
                v-if="pageNum !== '...'"
                @click="goToPage(pageNum)"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                  pageNum === assetsData.page
                    ? 'bg-amber-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                ]"
              >
                {{ pageNum }}
              </button>
              <span v-else class="px-2 text-gray-500">...</span>
            </template>
          </div>

          <button
            @click="goToPage(assetsData.page + 1)"
            :disabled="!assetsData.hasNext"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <Icon name="heroicons:chevron-right" class="w-4 h-4" />
          </button>
        </div>

        <div class="text-sm text-gray-600">
          {{ (assetsData.page - 1) * (pagination.limit || 12) + 1 }}-{{
            Math.min(assetsData.page * (pagination.limit || 12), assetsData.total)
          }} sur {{ assetsData.total }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Icon name="heroicons:folder-open" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Aucun asset trouvé
      </h3>
      <p class="text-gray-600 mb-6">
        {{ hasActiveFilters
          ? 'Aucun asset ne correspond aux filtres appliqués.'
          : 'Commencez par uploader votre premier asset.'
        }}
      </p>
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="text-amber-600 hover:text-amber-700 font-medium mr-4"
      >
        Réinitialiser les filtres
      </button>
      <button
        @click="showUploadModal = true"
        class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
      >
        Uploader un asset
      </button>
    </div>

    <!-- Modals -->
    <!-- Delete Modal -->
    <AssetDeleteModal
      :show="showDeleteModal"
      :asset="selectedAsset"
      @close="closeDeleteModal"
      @deleted="handleAssetDeleted"
    />

    <!-- Replace Modal -->
    <AssetReplaceModal
      :show="showReplaceModal"
      :asset="selectedAsset"
      @close="closeReplaceModal"
      @replaced="handleAssetReplaced"
    />

    <!-- View Modal -->
    <AssetViewModal
      :show="showViewModal"
      :asset="selectedAsset"
      @close="closeViewModal"
    />

    <!-- TODO: Add Upload Modal -->
    <!-- TODO: Add Edit Modal -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAssetsQuery, type Asset, type AssetFilters, type PaginationOptions } from '~/composables/useAssetsQuery'
import AssetCard from '~/components/admin/AssetCard.vue'
import AssetDeleteModal from '~/components/admin/AssetDeleteModal.vue'
import AssetReplaceModal from '~/components/admin/AssetReplaceModal.vue'
import AssetViewModal from '~/components/admin/AssetViewModal.vue'

// Page meta
useHead({
  title: 'Assets Cloudinary'
})

// State
const showUploadModal = ref(false)
const isSyncing = ref(false)
const syncMessage = ref('')
const syncError = ref(false)

// Modals state
const showDeleteModal = ref(false)
const showReplaceModal = ref(false)
const showViewModal = ref(false)
const showEditModal = ref(false)
const selectedAsset = ref<Asset | null>(null)

// Filters and pagination
const filters = ref<AssetFilters>({
  search: '',
  format: '',
  folder: '',
  tags: []
})

const pagination = ref<PaginationOptions>({
  page: 1,
  limit: 24,
  sortBy: 'created_at',
  sortOrder: 'desc'
})

// Query
const assetsQuery = useAssetsQuery(filters, pagination)
const assetsData = computed(() => assetsQuery.data.value)

// Computed
const hasActiveFilters = computed(() => {
  return !!(filters.value.search ||
           filters.value.format ||
           filters.value.folder ||
           (filters.value.tags && filters.value.tags.length > 0))
})

const visiblePages = computed(() => {
  if (!assetsData.value) return []

  const current = assetsData.value.page
  const total = assetsData.value.totalPages
  const pages = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
})

// Methods
const clearFilters = () => {
  filters.value = {
    search: '',
    format: '',
    folder: '',
    tags: []
  }
  pagination.value.page = 1
}

const goToPage = (page: number) => {
  pagination.value.page = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleViewAsset = (asset: Asset) => {
  selectedAsset.value = asset
  showViewModal.value = true
}

const handleEditAsset = (asset: Asset) => {
  // TODO: Implémenter la modale d'édition des métadonnées
  selectedAsset.value = asset
  showEditModal.value = true
  console.log('Edit asset metadata:', asset)
}

const handleReplaceAsset = (asset: Asset) => {
  selectedAsset.value = asset
  showReplaceModal.value = true
}

const handleDeleteAsset = (asset: Asset) => {
  selectedAsset.value = asset
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedAsset.value = null
}

const closeReplaceModal = () => {
  showReplaceModal.value = false
  selectedAsset.value = null
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedAsset.value = null
}

const handleAssetDeleted = (deletedAsset: Asset) => {
  console.log('✅ Asset supprimé:', deletedAsset.public_id)

  // Recharger la liste des assets
  assetsQuery.refetch()
  closeDeleteModal()
}

const handleAssetReplaced = (oldAsset: Asset, newAsset: Asset) => {
  console.log('✅ Asset remplacé:', oldAsset.public_id, '→', newAsset.public_id)

  // Recharger la liste des assets
  assetsQuery.refetch()
  closeReplaceModal()
}

// Synchronization function
const syncCloudinaryAssets = async () => {
  if (isSyncing.value) return

  isSyncing.value = true
  syncMessage.value = ''
  syncError.value = false

  try {
    console.log('🔄 Démarrage de la synchronisation Cloudinary...')

    const response = await $fetch('/api/admin/sync-assets', {
      method: 'POST'
    })

    if (response.success) {
      const { totalProcessed, totalSynced, totalUpdated, totalErrors, duration } = response.data
      syncMessage.value = `Synchronisation réussie ! ${totalSynced} nouveaux assets, ${totalUpdated} mis à jour, ${totalErrors} erreurs (${Math.round(duration / 1000)}s)`
      syncError.value = false

      console.log('✅ Synchronisation terminée:', response.data)

      // Recharger la liste des assets après synchronisation
      await assetsQuery.refetch()
    } else {
      throw new Error(response.message || 'Erreur de synchronisation')
    }
  } catch (error: any) {
    console.error('❌ Erreur synchronisation:', error)
    syncMessage.value = `Erreur de synchronisation: ${error.data?.message || error.message || 'Erreur inconnue'}`
    syncError.value = true
  } finally {
    isSyncing.value = false

    // Effacer le message après 10 secondes
    setTimeout(() => {
      syncMessage.value = ''
      syncError.value = false
    }, 10000)
  }
}

// Reset to page 1 when filters change
watch([filters], () => {
  pagination.value.page = 1
}, { deep: true })

// Page loading
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})
</script>