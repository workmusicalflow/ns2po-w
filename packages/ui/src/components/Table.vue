<template>
  <div class="table-wrapper">
    <div v-if="loading" class="table-loading">
      <div class="spinner" />
      <span>Chargement...</span>
    </div>
    
    <table v-else class="table">
      <thead class="table-header">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="getHeaderClasses(column)"
            @click="handleSort(column)"
          >
            <div class="header-content">
              <span>{{ column.label }}</span>
              <div v-if="column.sortable" class="sort-icon">
                <ChevronUpIcon v-if="sortColumn === column.key && sortOrder === 'asc'" class="w-4 h-4" />
                <ChevronDownIcon v-else-if="sortColumn === column.key && sortOrder === 'desc'" class="w-4 h-4" />
                <div v-else class="w-4 h-4" />
              </div>
            </div>
          </th>
        </tr>
      </thead>
      
      <tbody class="table-body">
        <tr v-for="(row, index) in data" :key="index" class="table-row">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="getCellClasses(column)"
          >
            <component
              v-if="column.component"
              :is="column.component"
              v-bind="column.componentProps?.(getValue(row, column.key), row)"
            />
            <span v-else>
              {{ column.render ? column.render(getValue(row, column.key), row) : getValue(row, column.key) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    
    <!-- Pagination -->
    <div v-if="pagination" class="table-pagination">
      <div class="pagination-info">
        Affichage {{ startItem }}-{{ endItem }} sur {{ pagination.total }} éléments
      </div>
      
      <div class="pagination-controls">
        <Button
          variant="outline"
          size="small"
          :disabled="(pagination?.page || 1) <= 1"
          @click="goToPage((pagination?.page || 1) - 1)"
        >
          Précédent
        </Button>
        
        <span class="page-numbers">
          Page {{ pagination?.page || 1 }} sur {{ totalPages }}
        </span>
        
        <Button
          variant="outline"
          size="small"
          :disabled="(pagination?.page || 1) >= totalPages"
          @click="goToPage((pagination?.page || 1) + 1)"
        >
          Suivant
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, defineComponent } from 'vue'
import type { TableProps, SortOrder } from '@ns2po/types'
import { SortOrder as SortOrderEnum, ButtonVariant, ButtonSize } from '@ns2po/types'
import Button from './Button.vue'

// Icons (simplified, in real project would use proper icon library)
const ChevronUpIcon = defineComponent({
  template: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>'
})

const ChevronDownIcon = defineComponent({
  template: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>'
})

interface Props extends TableProps<any> {
  class?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  sort: [column: string, order: SortOrder]
  pageChange: [page: number]
}>()

// État local pour le tri
const sortColumn = ref<string | null>(null)
const sortOrder = ref<SortOrder>('asc')

// Méthodes
const getValue = (row: any, key: string | number | symbol) => {
  const keyStr = String(key)
  return keyStr.split('.').reduce((obj, k) => obj?.[k], row)
}

const handleSort = (column: any) => {
  if (!column.sortable) return
  
  if (sortColumn.value === column.key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column.key
    sortOrder.value = 'asc'
  }
  
  emit('sort', column.key, sortOrder.value)
}

const goToPage = (page: number) => {
  emit('pageChange', page)
}

const getHeaderClasses = (column: any) => [
  'table-header-cell',
  {
    'sortable': column.sortable,
    'text-left': column.align === 'left' || !column.align,
    'text-center': column.align === 'center',
    'text-right': column.align === 'right'
  }
]

const getCellClasses = (column: any) => [
  'table-cell',
  {
    'text-left': column.align === 'left' || !column.align,
    'text-center': column.align === 'center',
    'text-right': column.align === 'right'
  }
]

// Computed pour la pagination
const totalPages = computed(() => {
  if (!props.pagination?.total || !props.pagination?.pageSize) return 1
  return Math.ceil(props.pagination.total / props.pagination.pageSize)
})

const startItem = computed(() => {
  if (!props.pagination?.page || !props.pagination?.pageSize || props.data.length === 0) return 0
  return (props.pagination.page - 1) * props.pagination.pageSize + 1
})

const endItem = computed(() => {
  if (!props.pagination?.page || !props.pagination?.pageSize || !props.pagination?.total) return props.data.length
  return Math.min(props.pagination.page * props.pagination.pageSize, props.pagination.total)
})
</script>

<style scoped>
.table-wrapper {
  @apply relative;
}

.table-loading {
  @apply flex items-center justify-center py-8 space-x-2;
}

.spinner {
  @apply inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.table {
  @apply w-full border-collapse;
}

.table-header {
  @apply bg-gray-50;
}

.table-header-cell {
  @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200;
}

.table-header-cell.sortable {
  @apply cursor-pointer hover:bg-gray-100;
}

.header-content {
  @apply flex items-center justify-between;
}

.sort-icon {
  @apply ml-2 text-gray-400;
}

.table-body {
  @apply bg-white divide-y divide-gray-200;
}

.table-row {
  @apply hover:bg-gray-50;
}

.table-cell {
  @apply px-4 py-3 text-sm text-gray-900;
}

.table-pagination {
  @apply flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200;
}

.pagination-info {
  @apply text-sm text-gray-700;
}

.pagination-controls {
  @apply flex items-center space-x-4;
}

.page-numbers {
  @apply text-sm text-gray-700;
}
</style>