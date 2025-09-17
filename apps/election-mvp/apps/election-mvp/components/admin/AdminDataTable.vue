<template>
  <div class="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
    <!-- Header avec titre et actions -->
    <div v-if="title || $slots.header" class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div>
          <h3 v-if="title" class="text-lg font-medium text-gray-900">{{ title }}</h3>
          <p v-if="description" class="text-sm text-gray-600 mt-1">{{ description }}</p>
        </div>
        <div v-if="$slots.header">
          <slot name="header" />
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
            <th v-if="$slots.actions" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="isLoading" v-for="n in 3" :key="`loading-${n}`">
            <td v-for="column in columns" :key="column.key" class="px-6 py-4 whitespace-nowrap">
              <div class="animate-pulse">
                <div class="h-4 bg-gray-200 rounded"></div>
              </div>
            </td>
            <td v-if="$slots.actions" class="px-6 py-4 whitespace-nowrap text-right">
              <div class="animate-pulse">
                <div class="h-4 w-16 bg-gray-200 rounded ml-auto"></div>
              </div>
            </td>
          </tr>

          <template v-else-if="paginatedData.length > 0">
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
              <td v-if="$slots.actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <slot name="actions" :item="item" :index="index" />
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else>
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center justify-center">
                <Icon name="heroicons:document-text" class="w-12 h-12 text-gray-400 mb-4" />
                <h3 class="text-sm font-medium text-gray-900 mb-1">{{ emptyTitle || 'Aucune donnée' }}</h3>
                <p class="text-sm text-gray-500">{{ emptyDescription || 'Aucun élément à afficher pour le moment.' }}</p>
              </div>
            </td>
          </tr>
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
            @click="currentPage--"
            :disabled="currentPage <= 1"
            class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span class="text-sm text-gray-700">
            Page {{ currentPage }} sur {{ totalPages }}
          </span>
          <button
            @click="currentPage++"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  sortable?: boolean
  formatter?: (value: any, item: any) => string
  class?: string
}

interface Props {
  data: any[]
  columns: Column[]
  title?: string
  description?: string
  isLoading?: boolean
  pageSize?: number
  showPagination?: boolean
  searchKey?: string
  searchValue?: string
  emptyTitle?: string
  emptyDescription?: string
  getRowKey?: (item: any) => string | number
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  pageSize: 10,
  showPagination: true,
  searchKey: '',
  searchValue: ''
})

// Reactive state
const currentPage = ref(1)
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

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
  if (!props.showPagination) return filteredData.value

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

// Watch for data changes to reset pagination
watch(() => props.data, () => {
  currentPage.value = 1
})

watch(() => props.searchValue, () => {
  currentPage.value = 1
})
</script>