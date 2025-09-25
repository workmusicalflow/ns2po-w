<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Mobile: Fullscreen Modal -->
    <div class="md:hidden fixed inset-0 bg-white">
      <!-- Mobile Header with Close -->
      <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <button
              class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 touch-manipulation transition-colors duration-200"
              @click="$emit('close')"
            >
              <Icon name="heroicons:x-mark" class="w-6 h-6" />
            </button>
            <h3 class="text-lg font-medium text-gray-900">
              {{ isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}
            </h3>
          </div>
          <button
            :disabled="isLoading"
            form="category-form"
            type="submit"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-colors duration-200"
          >
            <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            {{ isEdit ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </div>

      <!-- Mobile Form Content -->
      <div class="flex-1 px-4 py-6">
        <form id="category-form" class="space-y-6" @submit.prevent="submitForm">
          <CategoryFormFields
            v-model:form="form"
            v-model:errors="errors"
            :real-time-errors="realTimeErrors"
            :is-loading="isLoading"
          />
        </form>
      </div>
    </div>

    <!-- Desktop: Centered Modal -->
    <div class="hidden md:flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <!-- Desktop Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}
          </h3>
          <button
            class="p-1 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors duration-200"
            @click="$emit('close')"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>

        <!-- Desktop Form -->
        <form class="space-y-6" @submit.prevent="submitForm">
          <CategoryFormFields
            v-model:form="form"
            v-model:errors="errors"
            :real-time-errors="realTimeErrors"
            :is-loading="isLoading"
          />

          <!-- Desktop Form Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors duration-200"
              @click="$emit('close')"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              {{ isEdit ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import CategoryFormFields from './CategoryFormFields.vue'

interface CategoryForm {
  name: string
  slug: string
  description: string
  isActive: boolean
}

interface Props {
  category?: {
    id: string
    name: string
    slug: string
    description?: string
    isActive: boolean
  }
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<{
  close: []
  submit: [form: CategoryForm]
}>()

// Form state
const form = ref<CategoryForm>({
  name: props.category?.name || '',
  slug: props.category?.slug || '',
  description: props.category?.description || '',
  isActive: props.category?.isActive ?? true
})

// Error states
const errors = ref<Record<string, string>>({})
const realTimeErrors = ref<Record<string, string>>({})

// Computed properties
const isEdit = computed(() => !!props.category?.id)

// Form submission
const submitForm = () => {
  // Reset errors
  errors.value = {}
  realTimeErrors.value = {}

  // Basic validation
  if (!form.value.name.trim()) {
    errors.value.name = 'Le nom est requis'
    return
  }

  // Generate slug from name if empty
  if (!form.value.slug.trim()) {
    form.value.slug = form.value.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Keep only alphanumeric, spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
  }

  emit('submit', { ...form.value })
}

// Watch for prop changes
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    form.value = {
      name: newCategory.name || '',
      slug: newCategory.slug || '',
      description: newCategory.description || '',
      isActive: newCategory.isActive ?? true
    }
  }
}, { immediate: true, deep: true })

// Prevent body scroll when modal is open
onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>