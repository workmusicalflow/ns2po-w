<template>
  <div class="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
    <!-- Header avec titre et actions -->
    <div v-if="title || $slots.header || createButton" class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div>
          <h3 v-if="title" class="text-lg font-medium text-gray-900">
            {{ title }}
          </h3>
          <p v-if="description" class="text-sm text-gray-600 mt-1">
            {{ description }}
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <!-- Standardized Create Button -->
          <button
            v-if="createButton"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            @click="$emit('create')"
          >
            <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
            {{ typeof createButton === 'object' ? createButton.text : 'Nouveau' }}
          </button>
          <!-- Custom header actions -->
          <div v-if="$slots.header">
            <slot name="header" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="$slots.filters" class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <slot name="filters" />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <!-- Headers -->
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
              ]"
              @click="column.sortable ? toggleSort(column.key) : null"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <div v-if="column.sortable" class="flex flex-col ml-1">
                  <Icon
                    name="heroicons:chevron-up-solid"
                    class="w-3 h-3"
                    :class="{
                      'text-amber-600': sortKey === column.key && sortOrder === 'asc',
                      'text-gray-400': sortKey !== column.key || sortOrder !== 'asc'
                    }"
                  />
                  <Icon
                    name="heroicons:chevron-down-solid"
                    class="w-3 h-3 -mt-1"
                    :class="{
                      'text-amber-600': sortKey === column.key && sortOrder === 'desc',
                      'text-gray-400': sortKey !== column.key || sortOrder !== 'desc'
                    }"
                  />
                </div>
              </div>
            </th>
            <th v-if="$slots.actions || showStandardActions" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Skeleton loading pendant initialisation (évite FOEC) -->
          <template v-if="isLoading && !hasInitialData">
            <tr v-for="n in 6" :key="`skeleton-${n}`">
              <td v-for="column in columns" :key="column.key" class="px-6 py-4 whitespace-nowrap">
                <div class="animate-pulse">
                  <div
                    class="bg-gray-200 rounded"
                    :class="{
                      'w-12 h-12 rounded-lg': column.key === 'image',
                      'h-4 w-20': column.key === 'basePrice',
                      'h-6 w-16 rounded-full': column.key === 'isActive',
                      'h-4 w-32': column.key === 'name',
                      'h-4 w-16': column.key === 'id',
                      'h-4 w-24': column.key === 'category',
                      'h-4 w-28': column.key === 'updatedAt',
                      'h-4': !['image', 'basePrice', 'isActive', 'name', 'id', 'category', 'updatedAt'].includes(column.key)
                    }"
                  />
                </div>
              </td>
              <td v-if="$slots.actions || showStandardActions" class="px-6 py-4 whitespace-nowrap text-right">
                <div class="animate-pulse flex justify-end space-x-2">
                  <div class="h-6 bg-gray-200 rounded w-16" />
                  <div class="h-6 bg-gray-200 rounded w-20" />
                  <div class="h-6 bg-gray-200 rounded w-18" />
                </div>
              </td>
            </tr>
          </template>

          <!-- Données avec overlay loading pour rechargements -->
          <template v-else-if="paginatedData.length > 0">
            <!-- Loading overlay pour actions utilisateur (quand on a déjà des données) -->
            <div v-if="isLoading && hasInitialData" class="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
            </div>

            <tr
              v-for="(item, index) in paginatedData"
              :key="getRowKey ? getRowKey(item) : index"
              class="hover:bg-gray-50"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-6 py-4 whitespace-nowrap text-sm"
                :class="column.class || 'text-gray-900'"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :item="item"
                  :value="getNestedValue(item, column.key)"
                  :column="column"
                >
                  {{ column.formatter ? column.formatter(getNestedValue(item, column.key), item) : getNestedValue(item, column.key) }}
                </slot>
              </td>
              <td v-if="$slots.actions || showStandardActions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <!-- Standard Actions -->
                <div v-if="showStandardActions" class="flex items-center justify-end space-x-2">
                  <button
                    v-if="allowEdit"
                    class="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    :title="`Modifier ${getItemLabel(item)}`"
                    @click="$emit('edit', item)"
                  >
                    <Icon name="heroicons:pencil" class="w-3 h-3" />
                  </button>
                  <button
                    v-if="allowDelete"
                    class="inline-flex items-center px-2 py-1 border border-red-300 rounded text-xs font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    :title="`Supprimer ${getItemLabel(item)}`"
                    @click="confirmDelete(item)"
                  >
                    <Icon name="heroicons:trash" class="w-3 h-3" />
                  </button>
                  <!-- Custom action buttons via slot -->
                  <slot name="custom-actions" :item="item" :index="index" />
                </div>
                <!-- Legacy actions slot (fallback) -->
                <slot v-else name="actions" :item="item" :index="index" />
              </td>
            </tr>
          </template>

          <!-- Empty state - seulement si initialisé et vraiment vide -->
          <template v-else-if="!isLoading && hasInitialData">
            <tr>
              <td :colspan="columns.length + (($slots.actions || showStandardActions) ? 1 : 0)" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center justify-center">
                  <Icon name="heroicons:document-text" class="w-12 h-12 text-gray-400 mb-4" />
                  <h3 class="text-sm font-medium text-gray-900 mb-1">
                    {{ emptyTitle || 'Aucune donnée' }}
                  </h3>
                  <p class="text-sm text-gray-500">
                    {{ emptyDescription || 'Aucun élément à afficher pour le moment.' }}
                  </p>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination && !isLoading && data.length > pageSize" class="px-6 py-3 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Affichage de {{ (currentPage - 1) * pageSize + 1 }} à {{ Math.min(currentPage * pageSize, filteredData.length) }}
          sur {{ filteredData.length }} résultats
        </div>
        <div class="flex items-center space-x-2">
          <button
            :disabled="currentPage <= 1"
            class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="currentPage--"
          >
            Précédent
          </button>
          <span class="text-sm text-gray-700">
            Page {{ currentPage }} sur {{ totalPages }}
          </span>
          <button
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            @click="currentPage++"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 overflow-y-auto"
      @click.self="cancelDelete"
    >
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <!-- Modal panel -->
        <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-red-600" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ deleteModal?.title || 'Confirmer la suppression' }}
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  {{ deleteModal?.message || `Êtes-vous sûr de vouloir supprimer "${getItemLabel(itemToDelete)}" ? Cette action est irréversible.` }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              :disabled="isDeleting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              @click="executeDelete"
            >
              <Icon v-if="isDeleting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              {{ deleteModal?.confirmText || 'Supprimer' }}
            </button>
            <button
              :disabled="isDeleting"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
              @click="cancelDelete"
            >
              {{ deleteModal?.cancelText || 'Annuler' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Auto-imported via Nuxt 3: globalNotifications

interface Column {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any, item: any) => string
  class?: string
}

interface CreateButton {
  text?: string
  icon?: string
}

interface DeleteModal {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

interface Props {
  data: any[]
  columns: Column[]
  title?: string
  description?: string
  isLoading?: boolean
  hasInitialData?: boolean // Pour éviter FOEC
  pageSize?: number
  showPagination?: boolean
  searchKey?: string
  searchValue?: string
  emptyTitle?: string
  emptyDescription?: string
  getRowKey?: (item: any) => string | number
  // New standardized CRUD props
  createButton?: CreateButton | boolean
  showStandardActions?: boolean
  allowEdit?: boolean
  allowDelete?: boolean
  itemLabelKey?: string
  deleteModal?: DeleteModal
  onDelete?: (item: any) => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasInitialData: false, // Par défaut pas de données initiales
  pageSize: 10,
  showPagination: true,
  searchKey: '',
  searchValue: '',
  showStandardActions: false,
  allowEdit: true,
  allowDelete: true,
  itemLabelKey: 'name'
})

// Emits
const emit = defineEmits<{
  create: []
  edit: [item: any]
  delete: [item: any]
  'delete-success': [item: any]
  'delete-error': [error: any, item: any]
}>()

// Reactive state
const currentPage = ref(1)
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Delete modal state
const showDeleteModal = ref(false)
const itemToDelete = ref<any>(null)
const isDeleting = ref(false)

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Computed
const filteredData = computed(() => {
  let result = [...props.data]

  // Apply search filter
  if (props.searchValue && props.searchKey) {
    result = result.filter(item => {
      const value = getNestedValue(item, props.searchKey)
      return String(value).toLowerCase().includes(props.searchValue.toLowerCase())
    })
  }

  // Apply sorting
  if (sortKey.value) {
    result.sort((a, b) => {
      const aVal = getNestedValue(a, sortKey.value)
      const bVal = getNestedValue(b, sortKey.value)

      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / props.pageSize)
})

const paginatedData = computed(() => {
  if (!props.showPagination) {
    return filteredData.value
  }

  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return filteredData.value.slice(start, end)
})

// Methods
function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  currentPage.value = 1 // Reset to first page when sorting
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// New CRUD methods
function getItemLabel(item: any): string {
  if (!item) return ''
  return getNestedValue(item, props.itemLabelKey) || item.id || item.name || 'Élément'
}

function confirmDelete(item: any) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  itemToDelete.value = null
  isDeleting.value = false
}

async function executeDelete() {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    if (props.onDelete) {
      // Use custom delete handler
      await props.onDelete(itemToDelete.value)
    } else {
      // Emit delete event for parent to handle
      emit('delete', itemToDelete.value)
    }

    crudSuccess.deleted(getItemLabel(itemToDelete.value))
    emit('delete-success', itemToDelete.value)
    cancelDelete()
  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)
    crudError.deleted('élément', error.message || 'Une erreur est survenue lors de la suppression.')
    emit('delete-error', error, itemToDelete.value)
    isDeleting.value = false
  }
}

// Watch for data changes to reset pagination
watch(() => props.data, () => {
  currentPage.value = 1
})

watch(() => props.searchValue, () => {
  currentPage.value = 1
})
</script>