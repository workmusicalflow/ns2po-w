<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Gestion des Catégories
          </h1>
          <p class="text-gray-600">
            Gérez la hiérarchie de vos catégories et sous-catégories
          </p>
        </div>
        <button
          class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          @click="openCreateModal"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Nouvelle Catégorie
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </select>
        </div>

        <!-- Type Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            v-model="filters.type"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">
              Tous les types
            </option>
            <option value="parent">
              Catégories principales
            </option>
            <option value="child">
              Sous-catégories
            </option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
        <button
          :disabled="loading"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
          @click="refreshCategories"
        >
          <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
          Actualiser
        </button>
        <span class="text-sm text-gray-500">
          {{ filteredCategories.length }} catégorie{{ filteredCategories.length > 1 ? 's' : '' }} trouvée{{ filteredCategories.length > 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Categories List -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 text-center">
        <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin mx-auto text-amber-600 mb-4" />
        <p class="text-gray-600">
          Chargement des catégories...
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
          @click="refreshCategories"
        >
          Réessayer
        </button>
      </div>

      <!-- Categories Table/Cards -->
      <div v-else-if="filteredCategories.length > 0">
        <!-- Desktop Table View -->
        <div class="hidden md:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parent
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sous-catégories
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
            <tr v-for="category in filteredCategories" :key="category.id" class="hover:bg-gray-50">
              <!-- Category Info -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-8 w-8">
                    <div
                      class="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                      :style="{ backgroundColor: category.color || '#6B7280' }"
                    >
                      <Icon v-if="category.icon" :name="category.icon" class="w-4 h-4" />
                      <span v-else>{{ category.name.charAt(0) }}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      {{ category.name }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ category.slug }}
                    </div>
                    <div v-if="category.description" class="text-xs text-gray-400 mt-1">
                      {{ category.description }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Parent Category -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span v-if="category.parentName" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {{ category.parentName }}
                </span>
                <span v-else class="text-gray-400 italic">Catégorie principale</span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    category.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  <span
                    :class="[
                      'w-1.5 h-1.5 mr-1.5 rounded-full',
                      category.isActive ? 'bg-green-400' : 'bg-red-400'
                    ]"
                  />
                  {{ category.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <!-- Subcategories Count -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span v-if="category.subcategories && category.subcategories.length > 0" class="inline-flex items-center">
                  <Icon name="heroicons:folder" class="w-4 h-4 mr-1" />
                  {{ category.subcategories.length }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>

              <!-- Sort Order -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ category.sortOrder }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    class="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                    title="Modifier"
                    @click="openEditModal(category)"
                  >
                    <Icon name="heroicons:pencil" class="w-4 h-4" />
                  </button>
                  <button
                    class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Dupliquer"
                    @click="duplicateCategory(category)"
                  >
                    <Icon name="heroicons:document-duplicate" class="w-4 h-4" />
                  </button>
                  <button
                    :disabled="(category.subcategories && category.subcategories.length > 0)"
                    class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Supprimer"
                    @click="deleteCategory(category)"
                  >
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <!-- Mobile Cards View -->
        <div class="md:hidden space-y-4 p-4">
          <div
            v-for="category in filteredCategories"
            :key="category.id"
            class="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200 p-4"
          >
            <!-- Header avec icône et nom -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center flex-1">
                <div
                  class="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-medium mr-3 flex-shrink-0"
                  :style="{ backgroundColor: category.color || '#6B7280' }"
                >
                  <Icon v-if="category.icon" :name="category.icon" class="w-5 h-5" />
                  <span v-else>{{ category.name.charAt(0) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="text-lg font-medium text-gray-900 truncate">{{ category.name }}</h3>
                  <p class="text-sm text-gray-500">{{ category.slug }}</p>
                </div>
              </div>
              <!-- Statut -->
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2',
                  category.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 mr-1.5 rounded-full',
                    category.isActive ? 'bg-green-400' : 'bg-red-400'
                  ]"
                />
                {{ category.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <!-- Description -->
            <div v-if="category.description" class="mb-4">
              <p class="text-sm text-gray-600">{{ category.description }}</p>
            </div>

            <!-- Informations détaillées -->
            <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span class="text-gray-500">Parent :</span>
                <span v-if="category.parentName" class="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {{ category.parentName }}
                </span>
                <span v-else class="ml-1 text-gray-400 italic">Principale</span>
              </div>
              <div>
                <span class="text-gray-500">Ordre :</span>
                <span class="ml-1 font-medium">{{ category.sortOrder }}</span>
              </div>
            </div>

            <!-- Sous-catégories -->
            <div class="mb-4 text-sm">
              <span class="text-gray-500">Sous-catégories :</span>
              <span v-if="category.subcategories && category.subcategories.length > 0" class="ml-1 inline-flex items-center text-gray-700">
                <Icon name="heroicons:folder" class="w-4 h-4 mr-1" />
                {{ category.subcategories.length }}
              </span>
              <span v-else class="ml-1 text-gray-400">Aucune</span>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
              <button
                class="flex items-center justify-center w-10 h-10 text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg touch-manipulation transition-colors"
                title="Modifier"
                @click="openEditModal(category)"
              >
                <Icon name="heroicons:pencil" class="w-5 h-5" />
              </button>
              <button
                class="flex items-center justify-center w-10 h-10 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg touch-manipulation transition-colors"
                title="Dupliquer"
                @click="duplicateCategory(category)"
              >
                <Icon name="heroicons:document-duplicate" class="w-5 h-5" />
              </button>
              <button
                :disabled="(category.subcategories && category.subcategories.length > 0)"
                class="flex items-center justify-center w-10 h-10 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg touch-manipulation transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Supprimer"
                @click="deleteCategory(category)"
              >
                <Icon name="heroicons:trash" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="p-8 text-center">
        <Icon name="heroicons:folder-open" class="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          Aucune catégorie trouvée
        </h3>
        <p class="text-gray-500 mb-4">
          Commencez par créer votre première catégorie.
        </p>
        <button
          class="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700"
          @click="openCreateModal"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Créer une catégorie
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <CategoryFormModal
      v-if="showModal"
      :category="selectedCategory"
      :categories="rootCategories"
      @close="closeModal"
      @submit="onCategorySubmit"
    />
  </div>
</template>

<script setup lang="ts">
// Import explicit du composant CategoryFormModal
import CategoryFormModal from '../../../components/admin/CategoryFormModal.vue'
// Import du système de notifications
import { useNotifications } from '~/composables/useNotifications'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  parentName?: string
  icon?: string
  color?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  subcategories?: Category[]
}

// Meta
definePageMeta({
  title: 'Gestion des Catégories - Admin',
  layout: 'admin'
})

// Système de notifications
const { crudSuccess, crudError } = useNotifications()

// State
const showModal = ref(false)
const selectedCategory = ref<Category | null>(null)

// Filters with debounced search
const filters = reactive({
  search: '',
  status: '',
  type: ''
})

// Optimized data fetching with caching
const { data: categoriesResponse, pending: loading, error, refresh: refreshCategories } = await useLazyFetch<{data: Category[]}>('/api/categories?flat=true', {
  key: 'admin-categories',
  server: true,
  default: () => ({ data: [] })
})

// Reactive categories from cached data
const categories = computed(() => categoriesResponse.value?.data || [])


// Debounced search for better performance
const debouncedSearch = ref('')
const searchDebounceTimer = ref<NodeJS.Timeout | null>(null)

watch(() => filters.search, (newSearch) => {
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }

  searchDebounceTimer.value = setTimeout(() => {
    debouncedSearch.value = newSearch
  }, 300) // 300ms debounce
}, { immediate: true })

// Optimized computed with memoization
const filteredCategories = computed(() => {
  const sourceCategories = categories.value
  if (!sourceCategories.length) return []

  let filtered = sourceCategories

  // Search filter with debounced value
  if (debouncedSearch.value) {
    const search = debouncedSearch.value.toLowerCase()
    filtered = filtered.filter(category =>
      category.name.toLowerCase().includes(search) ||
      category.slug.toLowerCase().includes(search) ||
      (category.description && category.description.toLowerCase().includes(search))
    )
  }

  // Status filter
  if (filters.status) {
    filtered = filtered.filter(category =>
      filters.status === 'active' ? category.isActive : !category.isActive
    )
  }

  // Type filter
  if (filters.type) {
    filtered = filtered.filter(category =>
      filters.type === 'parent' ? !category.parentId : !!category.parentId
    )
  }

  return filtered.sort((a, b) => {
    // Sort by parent first, then by sort order
    if (!a.parentId && b.parentId) return -1
    if (a.parentId && !b.parentId) return 1
    return a.sortOrder - b.sortOrder
  })
})

const rootCategories = computed(() =>
  categories.value.filter(cat => !cat.parentId)
)

// Methods
// Optimistic update functions for better performance
const optimisticAddCategory = (newCategory: Category) => {
  const currentData = categoriesResponse.value
  if (currentData) {
    currentData.data = [newCategory, ...currentData.data]
  }
}

const optimisticUpdateCategory = (updatedCategory: Category) => {
  const currentData = categoriesResponse.value
  if (currentData) {
    const index = currentData.data.findIndex(cat => cat.id === updatedCategory.id)
    if (index !== -1) {
      currentData.data[index] = updatedCategory
    }
  }
}

const optimisticRemoveCategory = (categoryId: string) => {
  const currentData = categoriesResponse.value
  if (currentData) {
    currentData.data = currentData.data.filter(cat => cat.id !== categoryId)
  }
}

const openCreateModal = () => {
  selectedCategory.value = null
  showModal.value = true
}

const openEditModal = (category: Category) => {
  selectedCategory.value = category
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedCategory.value = null
}

const onCategorySubmit = async (formData: any) => {
  try {
    const categoryData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      is_active: formData.isActive
    }

    if (selectedCategory.value?.id) {
      // Update existing category
      await $fetch(`/api/categories/${selectedCategory.value.id}`, {
        method: 'PUT',
        body: categoryData
      })
      crudSuccess.updated(formData.name, 'catégorie')
    } else {
      // Create new category
      await $fetch('/api/categories', {
        method: 'POST',
        body: categoryData
      })
      crudSuccess.created(formData.name, 'catégorie')
    }

    // Use cache refresh instead of full refetch for better performance
    await refreshCategories()
    closeModal()
  } catch (err: any) {
    console.error('Erreur lors de la sauvegarde:', err)
    const action = selectedCategory.value?.id ? 'mise à jour' : 'création'
    const message = err.data?.message || `Erreur lors de la ${action} de la catégorie`
    crudError.created('catégorie', message)
  }
}

// Keep the old function for backward compatibility if needed
const onCategorySaved = async (message: string) => {
  crudSuccess.created(message.replace('Catégorie ', ''), 'catégorie')

  // Use cache refresh instead of full refetch for better performance
  await refreshCategories()
  closeModal()
}

const duplicateCategory = async (category: Category) => {
  try {
    const duplicatedData = {
      name: `${category.name} (Copie)`,
      slug: `${category.slug}-copy-${Date.now()}`,
      description: category.description,
      parent_id: category.parentId,
      icon: category.icon,
      color: category.color,
      sort_order: category.sortOrder + 1,
      is_active: false // Inactive by default
    }

    await $fetch('/api/categories', {
      method: 'POST',
      body: duplicatedData
    })

    crudSuccess.created(category.name + ' (Copie)', 'catégorie')
    await refreshCategories()
  } catch (err) {
    console.error('Erreur lors de la duplication:', err)
    crudError.created('catégorie', 'Erreur lors de la duplication de la catégorie')
  }
}

const deleteCategory = async (category: Category) => {
  if (category.subcategories && category.subcategories.length > 0) {
    crudError.deleted('catégorie', 'Impossible de supprimer une catégorie qui contient des sous-catégories')
    return
  }

  if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
    return
  }

  try {
    await $fetch(`/api/categories/${category.id}`, {
      method: 'DELETE'
    })

    crudSuccess.deleted(category.name, 'catégorie')

    // Optimistic update: remove from cache immediately for better UX
    optimisticRemoveCategory(category.id)
  } catch (err: any) {
    console.error('Erreur lors de la suppression:', err)
    const message = err.data?.message || 'Erreur lors de la suppression de la catégorie'
    crudError.deleted('catégorie', message)
  }
}

// Lifecycle
// Data is automatically loaded by useLazyFetch on mount - no manual onMounted needed
</script>