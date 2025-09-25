<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Gestion des Réalisations
          </h1>
          <p class="text-gray-600">
            Gérez vos réalisations avec Turso + Cloudinary Auto-Discovery
          </p>

          <!-- Légende des sources -->
          <div class="mt-3 flex items-center space-x-4 text-sm">
            <span class="text-gray-500 font-medium">Sources :</span>
            <UiTooltip content="<strong>Base Turso</strong><br/>Réalisations stockées en base. Suppression définitive possible.">
              <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Icon name="heroicons:circle-stack" class="w-3 h-3 mr-1" />
                Turso
              </div>
            </UiTooltip>
            <UiTooltip content="<strong>Auto-Discovery Cloudinary</strong><br/>Réalisations découvertes automatiquement. Désactivation douce seulement.">
              <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Icon name="heroicons:cloud" class="w-3 h-3 mr-1" />
                Auto-discovery
              </div>
            </UiTooltip>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <button
            :disabled="loading"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            @click="refreshRealisations"
          >
            <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
            Synchroniser
          </button>
          <button
            class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            @click="openCreateModal"
          >
            <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
            Nouvelle Réalisation
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div v-if="stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- Total -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:document-text" class="h-6 w-6 text-gray-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">
              Total
            </p>
            <p class="text-lg font-semibold text-gray-900">
              {{ stats.total }}
            </p>
          </div>
        </div>
      </div>

      <!-- Turso -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:circle-stack" class="h-6 w-6 text-blue-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">
              Turso
            </p>
            <p class="text-lg font-semibold text-blue-900">
              {{ stats.turso }}
            </p>
          </div>
        </div>
      </div>

      <!-- Auto-discovery -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:cloud" class="h-6 w-6 text-green-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">
              Auto-discovery
            </p>
            <p class="text-lg font-semibold text-green-900">
              {{ stats.autodiscovery }}
            </p>
          </div>
        </div>
      </div>

      <!-- Featured -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <Icon name="heroicons:star" class="h-6 w-6 text-amber-600" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">
              En vedette
            </p>
            <p class="text-lg font-semibold text-amber-900">
              {{ stats.featured }}
            </p>
          </div>
        </div>
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
              placeholder="Titre, tags..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
            <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <!-- Source Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Source</label>
          <select
            v-model="filters.source"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">
              Toutes les sources
            </option>
            <option value="turso">
              Turso
            </option>
            <option value="cloudinary-auto-discovery">
              Auto-Discovery
            </option>
            <option value="airtable">
              Airtable
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
              Actives
            </option>
            <option value="inactive">
              Inactives
            </option>
            <option value="featured">
              En vedette
            </option>
          </select>
        </div>

        <!-- Sort -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Tri</label>
          <select
            v-model="filters.sort"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="order">
              Ordre
            </option>
            <option value="title">
              Titre
            </option>
            <option value="created">
              Date création
            </option>
            <option value="updated">
              Dernière modification
            </option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            {{ filteredRealisations.length }} réalisation{{ filteredRealisations.length > 1 ? 's' : '' }} trouvée{{ filteredRealisations.length > 1 ? 's' : '' }}
          </span>
          <div v-if="stats" class="flex items-center gap-4 text-sm text-gray-500">
            <span>{{ stats.turso }} Turso</span>
            <span>{{ stats.autodiscovery }} Auto-discovery</span>
            <span>{{ stats.featured }} En vedette</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            @click="toggleViewMode"
          >
            <Icon :name="viewMode === 'grid' ? 'heroicons:list-bullet' : 'heroicons:squares-2x2'" class="w-4 h-4 mr-2" />
            {{ viewMode === 'grid' ? 'Liste' : 'Grille' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Realisations Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin mx-auto text-amber-600 mb-4" />
        <p class="text-gray-600">
          Chargement des réalisations...
        </p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8 text-center">
        <Icon name="heroicons:exclamation-triangle" class="w-8 h-8 mx-auto text-red-600 mb-4" />
        <p class="text-red-600 mb-4">
          {{ error }}
        </p>
        <button
          class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
          @click="refreshRealisations"
        >
          Réessayer
        </button>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid' && filteredRealisations.length > 0" class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="realisation in filteredRealisations"
            :key="realisation.id"
            class="group relative bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <!-- Image Preview -->
            <div class="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
              <div v-if="realisation.cloudinaryPublicIds && realisation.cloudinaryPublicIds.length > 0" class="relative">
                <img
                  :src="getCloudinaryUrl(realisation.cloudinaryPublicIds[0])"
                  :alt="realisation.title"
                  class="w-full h-48 object-cover"
                >
                <div v-if="realisation.cloudinaryPublicIds.length > 1" class="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  +{{ realisation.cloudinaryPublicIds.length - 1 }}
                </div>
              </div>
              <div v-else class="flex items-center justify-center h-48 bg-gray-100">
                <Icon name="heroicons:photo" class="w-12 h-12 text-gray-400" />
              </div>

              <!-- Featured Badge -->
              <div v-if="realisation.isFeatured" class="absolute top-2 left-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <Icon name="heroicons:star" class="w-3 h-3 mr-1" />
                  Vedette
                </span>
              </div>

              <!-- Source Badge -->
              <div class="absolute top-2 right-2">
                <UiTooltip :content="getSourceTooltip(realisation.source)">
                  <span :class="getSourceBadgeClass(realisation.source)">
                    <Icon :name="getSourceIcon(realisation.source)" class="w-3 h-3 mr-1" />
                    {{ getSourceLabel(realisation.source) }}
                  </span>
                </UiTooltip>
              </div>
            </div>

            <!-- Content -->
            <div class="p-4">
              <h3 class="text-sm font-medium text-gray-900 mb-1 truncate">
                {{ realisation.title }}
              </h3>
              <p v-if="realisation.description" class="text-xs text-gray-500 mb-2 line-clamp-2">
                {{ realisation.description }}
              </p>

              <!-- Tags -->
              <div v-if="realisation.tags && realisation.tags.length > 0" class="mb-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in realisation.tags.slice(0, 3)"
                    :key="tag"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="realisation.tags.length > 3" class="text-xs text-gray-500">
                    +{{ realisation.tags.length - 3 }}
                  </span>
                </div>
              </div>

              <!-- Status -->
              <div class="flex items-center justify-between">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    realisation.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 mr-1.5 rounded-full',
                      realisation.isActive ? 'bg-green-400' : 'bg-red-400'
                    ]"
                  />
                  {{ realisation.isActive ? 'Active' : 'Inactive' }}
                </span>

                <!-- Actions -->
                <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    class="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                    title="Modifier"
                    @click="openEditModal(realisation)"
                  >
                    <Icon name="heroicons:pencil" class="w-4 h-4" />
                  </button>
                  <button
                    class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Dupliquer"
                    @click="duplicateRealisation(realisation)"
                  >
                    <Icon name="heroicons:document-duplicate" class="w-4 h-4" />
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Supprimer"
                    @click="deleteRealisation(realisation)"
                  >
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else-if="viewMode === 'table' && filteredRealisations.length > 0" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Réalisation
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Images
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ordre
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="realisation in filteredRealisations" :key="realisation.id" class="hover:bg-gray-50">
              <!-- Realisation Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-12 w-12">
                    <img
                      v-if="realisation.cloudinaryPublicIds && realisation.cloudinaryPublicIds.length > 0"
                      :src="getCloudinaryUrl(realisation.cloudinaryPublicIds[0], 'w_100,h_100,c_fill')"
                      :alt="realisation.title"
                      class="h-12 w-12 rounded-lg object-cover"
                    >
                    <div v-else class="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                      <Icon name="heroicons:photo" class="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="flex items-center">
                      <div class="text-sm font-medium text-gray-900">
                        {{ realisation.title }}
                      </div>
                      <Icon v-if="realisation.isFeatured" name="heroicons:star" class="w-4 h-4 text-amber-500 ml-1" />
                    </div>
                    <div v-if="realisation.description" class="text-sm text-gray-500 max-w-xs truncate">
                      {{ realisation.description }}
                    </div>
                    <div v-if="realisation.tags && realisation.tags.length > 0" class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="tag in realisation.tags.slice(0, 2)"
                        :key="tag"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {{ tag }}
                      </span>
                      <span v-if="realisation.tags.length > 2" class="text-xs text-gray-500">
                        +{{ realisation.tags.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Source -->
              <td class="px-6 py-4 whitespace-nowrap">
                <UiTooltip :content="getSourceTooltip(realisation.source)">
                  <span :class="getSourceBadgeClass(realisation.source)">
                    {{ getSourceLabel(realisation.source) }}
                  </span>
                </UiTooltip>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    realisation.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 mr-1.5 rounded-full',
                      realisation.isActive ? 'bg-green-400' : 'bg-red-400'
                    ]"
                  />
                  {{ realisation.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Images Count -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="inline-flex items-center">
                  <Icon name="heroicons:photo" class="w-4 h-4 mr-1" />
                  {{ realisation.cloudinaryPublicIds ? realisation.cloudinaryPublicIds.length : 0 }}
                </span>
              </td>

              <!-- Order Position -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ realisation.orderPosition }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    class="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                    title="Modifier"
                    @click="openEditModal(realisation)"
                  >
                    <Icon name="heroicons:pencil" class="w-4 h-4" />
                  </button>
                  <button
                    class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Dupliquer"
                    @click="duplicateRealisation(realisation)"
                  >
                    <Icon name="heroicons:document-duplicate" class="w-4 h-4" />
                  </button>
                  <button
                    class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                    title="Supprimer"
                    @click="deleteRealisation(realisation)"
                  >
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="p-8 text-center">
        <Icon name="heroicons:photo" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Aucune réalisation trouvée
        </h3>
        <p class="text-gray-500 mb-4">
          Commencez par créer votre première réalisation ou synchronisez avec Cloudinary.
        </p>
        <div class="flex items-center justify-center space-x-3">
          <button
            class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
            @click="openCreateModal"
          >
            <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
            Créer une réalisation
          </button>
          <button
            class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            @click="refreshRealisations"
          >
            <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-2" />
            Synchroniser
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <RealisationFormModal
      v-if="showModal"
      :realisation="selectedRealisation"
      :categories="categories"
      :products="products"
      @close="closeModal"
      @saved="onRealisationSaved"
    />

    <!-- Confirmation Modal -->
    <AdminConfirmationModal
      v-if="selectedRealisationForDelete"
      :show="showConfirmModal"
      :source="selectedRealisationForDelete.source"
      :item-name="selectedRealisationForDelete.title"
      :on-confirm="confirmDelete"
      :on-cancel="closeConfirmModal"
    />

    <!-- Notifications -->
    <div
      v-if="notification.show"
      :class="[
        'fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5',
        notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
      ]"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <Icon
              :name="notification.type === 'success' ? 'heroicons:check-circle' : 'heroicons:x-circle'"
              :class="[
                'h-5 w-5',
                notification.type === 'success' ? 'text-green-400' : 'text-red-400'
              ]"
            />
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-gray-900">
              {{ notification.message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              class="rounded-md inline-flex text-gray-400 hover:text-gray-500"
              @click="notification.show = false"
            >
              <Icon name="heroicons:x-mark" class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import RealisationFormModal from '../../../components/admin/RealisationFormModal.vue'
import AdminConfirmationModal from '../../../components/admin/ConfirmationModal.vue'

interface Realisation {
  id: string
  title: string
  description?: string
  cloudinaryPublicIds: string[]
  productIds: string[]
  categoryIds: string[]
  customizationOptionIds: string[]
  tags: string[]
  isFeatured: boolean
  orderPosition: number
  isActive: boolean
  source: string
  cloudinaryUrls?: string[]
  cloudinaryMetadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  category: string
}

// Meta
definePageMeta({
  title: 'Gestion des Réalisations - Admin',
  layout: 'admin'
})

// State
const realisations = ref<Realisation[]>([])
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const loading = ref(true)
const error = ref('')
const showModal = ref(false)
const selectedRealisation = ref<Realisation | null>(null)
const viewMode = ref<'grid' | 'table'>('grid')

// Filters
const filters = reactive({
  search: '',
  source: '',
  status: '',
  sort: 'order'
})

// Notification
const notification = reactive({
  show: false,
  type: 'success' as 'success' | 'error',
  message: ''
})

// Computed
const filteredRealisations = computed(() => {
  let filtered = [...realisations.value]

  // Search filter
  if (filters.search) {
    const search = filters.search.toLowerCase()
    filtered = filtered.filter(realisation =>
      realisation.title.toLowerCase().includes(search) ||
      (realisation.description && realisation.description.toLowerCase().includes(search)) ||
      realisation.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }

  // Source filter
  if (filters.source) {
    filtered = filtered.filter(realisation => realisation.source === filters.source)
  }

  // Status filter
  if (filters.status) {
    switch (filters.status) {
      case 'active':
        filtered = filtered.filter(realisation => realisation.isActive)
        break
      case 'inactive':
        filtered = filtered.filter(realisation => !realisation.isActive)
        break
      case 'featured':
        filtered = filtered.filter(realisation => realisation.isFeatured)
        break
    }
  }

  // Sort
  switch (filters.sort) {
    case 'order':
      filtered.sort((a, b) => a.orderPosition - b.orderPosition)
      break
    case 'title':
      filtered.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'created':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    case 'updated':
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      break
  }

  return filtered
})

const stats = computed(() => {
  if (!realisations.value.length) return null

  return {
    turso: realisations.value.filter(r => r.source === 'turso').length,
    autodiscovery: realisations.value.filter(r => r.source === 'cloudinary-auto-discovery').length,
    featured: realisations.value.filter(r => r.isFeatured).length,
    total: realisations.value.length
  }
})

// Methods
const fetchRealisations = async () => {
  try {
    loading.value = true
    error.value = ''

    const data = await $fetch('/api/realisations')
    realisations.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Erreur lors du chargement des réalisations:', err)
    error.value = 'Impossible de charger les réalisations'
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const { data } = await $fetch('/api/categories?flat=true')
    categories.value = data || []
  } catch (err) {
    console.error('Erreur lors du chargement des catégories:', err)
  }
}

const fetchProducts = async () => {
  try {
    const { data } = await $fetch('/api/products')
    products.value = data || []
  } catch (err) {
    console.error('Erreur lors du chargement des produits:', err)
  }
}

const refreshRealisations = () => {
  fetchRealisations()
}

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'table' : 'grid'
}

const openCreateModal = () => {
  selectedRealisation.value = null
  showModal.value = true
}

const openEditModal = (realisation: Realisation) => {
  selectedRealisation.value = realisation
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedRealisation.value = null
}

const onRealisationSaved = (message: string) => {
  showNotification('success', message)
  fetchRealisations()
  closeModal()
}

const duplicateRealisation = async (realisation: Realisation) => {
  try {
    const duplicatedData = {
      title: `${realisation.title} (Copie)`,
      description: realisation.description,
      cloudinary_public_ids: realisation.cloudinaryPublicIds,
      product_ids: realisation.productIds,
      category_ids: realisation.categoryIds,
      customization_option_ids: realisation.customizationOptionIds,
      tags: [...realisation.tags, 'copie'],
      is_featured: false,
      order_position: realisation.orderPosition + 1,
      is_active: false,
      source: 'turso'
    }

    await $fetch('/api/realisations', {
      method: 'POST',
      body: duplicatedData
    })

    showNotification('success', 'Réalisation dupliquée avec succès')
    fetchRealisations()
  } catch (err) {
    console.error('Erreur lors de la duplication:', err)
    showNotification('error', 'Erreur lors de la duplication de la réalisation')
  }
}

// État pour la modale de confirmation
const showConfirmModal = ref(false)
const selectedRealisationForDelete = ref<Realisation | null>(null)

const deleteRealisation = async (realisation: Realisation) => {
  selectedRealisationForDelete.value = realisation
  showConfirmModal.value = true
}

const confirmDelete = async () => {
  if (!selectedRealisationForDelete.value) return

  const realisation = selectedRealisationForDelete.value
  const action = realisation.source === 'cloudinary-auto-discovery' ? 'désactiver' : 'supprimer'

  try {
    await $fetch(`/api/realisations/${realisation.id}`, {
      method: 'DELETE'
    })

    showNotification('success', `Réalisation ${action === 'désactiver' ? 'désactivée' : 'supprimée'} avec succès`)
    fetchRealisations()
  } catch (err: any) {
    console.error('Erreur lors de la suppression:', err)
    const message = err.data?.message || `Erreur lors de la ${action === 'désactiver' ? 'désactivation' : 'suppression'} de la réalisation`
    showNotification('error', message)
  } finally {
    closeConfirmModal()
  }
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  selectedRealisationForDelete.value = null
}

const getCloudinaryUrl = (publicId: string, transformation = 'w_300,h_200,c_fill') => {
  return `https://res.cloudinary.com/dsrvzogof/image/upload/${transformation}/${publicId}`
}

const getSourceLabel = (source: string) => {
  switch (source) {
    case 'turso': return 'Turso'
    case 'cloudinary-auto-discovery': return 'Auto-discovery'
    default: return source
  }
}

const getSourceBadgeClass = (source: string) => {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105'

  switch (source) {
    case 'turso':
      return `${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`
    case 'cloudinary-auto-discovery':
      return `${baseClasses} bg-green-100 text-green-800 hover:bg-green-200`
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-200`
  }
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'turso': return 'heroicons:circle-stack'
    case 'cloudinary-auto-discovery': return 'heroicons:cloud'
    default: return 'heroicons:document'
  }
}

const getSourceTooltip = (source: string) => {
  switch (source) {
    case 'turso':
      return '<strong>Base Turso</strong><br/>Stockage permanent en base de données.<br/>🔧 <em>Actions :</em> Modification & suppression définitive'
    case 'cloudinary-auto-discovery':
      return '<strong>Auto-Discovery Cloudinary</strong><br/>Détection automatique des images.<br/>🔧 <em>Actions :</em> Modification & désactivation douce seulement'
    default:
      return '<strong>Source inconnue</strong><br/>Type de source non reconnu.<br/>⚠️ <em>Comportement par défaut</em>'
  }
}

const showNotification = (type: 'success' | 'error', message: string) => {
  notification.type = type
  notification.message = message
  notification.show = true

  setTimeout(() => {
    notification.show = false
  }, 5000)
}

// Lifecycle
onMounted(() => {
  Promise.all([
    fetchRealisations(),
    fetchCategories(),
    fetchProducts()
  ])
})

// Auto-hide notification after 5 seconds
watch(() => notification.show, (show) => {
  if (show) {
    setTimeout(() => {
      notification.show = false
    }, 5000)
  }
})
</script>