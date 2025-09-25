<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}
          </h3>
          <button
            class="text-gray-400 hover:text-gray-500"
            @click="$emit('close')"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>

        <!-- Form -->
        <form class="space-y-6" @submit.prevent="submitForm">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Nom de la catégorie *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Ex: TEXTILE, ACCESSOIRE..."
            >
            <p v-if="errors.name || realTimeErrors.name" class="mt-1 text-sm text-red-600">
              {{ errors.name || realTimeErrors.name }}
            </p>
          </div>

          <!-- Slug -->
          <div>
            <label for="slug" class="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <input
              id="slug"
              v-model="form.slug"
              type="text"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Ex: textile, accessoire..."
            >
            <p class="mt-1 text-xs text-gray-500">
              URL-friendly version du nom (lettres minuscules, chiffres et tirets uniquement)
            </p>
            <p v-if="errors.slug || realTimeErrors.slug" class="mt-1 text-sm text-red-600">
              {{ errors.slug || realTimeErrors.slug }}
            </p>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Description de la catégorie..."
            />
          </div>

          <!-- Parent Category -->
          <div>
            <label for="parent_id" class="block text-sm font-medium text-gray-700 mb-1">
              Catégorie parent
            </label>
            <select
              id="parent_id"
              v-model="form.parent_id"
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">
                Catégorie principale
              </option>
              <option
                v-for="parentCategory in availableParents"
                :key="parentCategory.id"
                :value="parentCategory.id"
              >
                {{ parentCategory.name }}
              </option>
            </select>
            <p class="mt-1 text-xs text-gray-500">
              Laissez vide pour créer une catégorie principale
            </p>
          </div>

          <!-- Icon and Color Row -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Icon -->
            <div>
              <label for="icon" class="block text-sm font-medium text-gray-700 mb-1">
                Icône
              </label>
              <select
                id="icon"
                v-model="form.icon"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">
                  Aucune icône
                </option>
                <option value="heroicons:shirt">
                  👕 Textile
                </option>
                <option value="heroicons:cap">
                  🧢 Accessoire
                </option>
                <option value="heroicons:pen">
                  ✏️ Bureau
                </option>
                <option value="heroicons:folder">
                  📁 Dossier
                </option>
                <option value="heroicons:tag">
                  🏷️ Tag
                </option>
                <option value="heroicons:star">
                  ⭐ Étoile
                </option>
                <option value="heroicons:heart">
                  ❤️ Cœur
                </option>
                <option value="heroicons:gift">
                  🎁 Cadeau
                </option>
              </select>
            </div>

            <!-- Color -->
            <div>
              <label for="color" class="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <div class="flex items-center space-x-2">
                <input
                  id="color"
                  v-model="form.color"
                  type="color"
                  class="h-10 w-16 border border-gray-300 rounded-md"
                >
                <input
                  v-model="form.color"
                  type="text"
                  placeholder="#3B82F6"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
              </div>
              <p v-if="errors.color || realTimeErrors.color" class="mt-1 text-sm text-red-600">
                {{ errors.color || realTimeErrors.color }}
              </p>
            </div>
          </div>

          <!-- Sort Order and Status Row -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Sort Order -->
            <div>
              <label for="sort_order" class="block text-sm font-medium text-gray-700 mb-1">
                Ordre de tri
              </label>
              <input
                id="sort_order"
                v-model.number="form.sort_order"
                type="number"
                min="0"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
            </div>

            <!-- Active Status -->
            <div class="flex items-center mt-6">
              <input
                id="is_active"
                v-model="form.is_active"
                type="checkbox"
                class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              >
              <label for="is_active" class="ml-2 block text-sm text-gray-900">
                Catégorie active
              </label>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="form.name || form.color" class="p-4 bg-gray-50 rounded-lg">
            <p class="text-sm font-medium text-gray-700 mb-2">
              Aperçu :
            </p>
            <div class="flex items-center">
              <div
                class="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-medium mr-3"
                :style="{ backgroundColor: form.color || '#6B7280' }"
              >
                <Icon v-if="form.icon" :name="form.icon" class="w-4 h-4" />
                <span v-else>{{ form.name.charAt(0) }}</span>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900">
                  {{ form.name || 'Nom de la catégorie' }}
                </div>
                <div class="text-sm text-gray-500">
                  {{ form.slug || 'slug-de-la-categorie' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              @click="$emit('close')"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="loading || !isFormValid"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              {{ isEdit ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createCategorySchema } from '~/schemas/category'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  icon?: string
  color?: string
  sortOrder: number
  isActive: boolean
}

interface Props {
  category?: Category | null
  categories: Category[]
}

// Props & Emits
const props = withDefaults(defineProps<Props>(), {
  category: null,
  categories: () => []
})

const emit = defineEmits<{
  close: []
  saved: [message: string]
}>()

// State
const loading = ref(false)
const errors = ref<Record<string, string>>({})

// Real-time validation setup
const { validateWithSchema } = useFormValidation()
const realTimeErrors = ref<Record<string, string>>({})

// Form
const form = reactive({
  name: '',
  slug: '',
  description: '',
  parent_id: '',
  icon: '',
  color: '#3B82F6',
  sort_order: 0,
  is_active: true
})

// Computed
const isEdit = computed(() => !!props.category)

const availableParents = computed(() => {
  if (!props.category) return props.categories
  // Exclude current category and its descendants when editing
  return props.categories.filter(cat => cat.id !== props.category?.id)
})

const isFormValid = computed(() => {
  return (
    form.name.trim() &&
    form.slug.trim() &&
    !Object.keys(errors.value).length &&
    !Object.keys(realTimeErrors.value).length
  )
})

// Methods
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const validateForm = () => {
  errors.value = {}

  // Name validation
  if (!form.name.trim()) {
    errors.value.name = 'Le nom est requis'
  } else if (form.name.length > 50) {
    errors.value.name = 'Le nom ne peut pas dépasser 50 caractères'
  }

  // Slug validation
  if (!form.slug.trim()) {
    errors.value.slug = 'Le slug est requis'
  } else if (form.slug.length > 50) {
    errors.value.slug = 'Le slug ne peut pas dépasser 50 caractères'
  } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
    errors.value.slug = 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'
  }

  // Color validation
  if (form.color && !/^#[0-9A-Fa-f]{6}$/.test(form.color)) {
    errors.value.color = 'La couleur doit être au format hexadécimal #RRGGBB'
  }

  return Object.keys(errors.value).length === 0
}

const submitForm = async () => {
  if (!validateForm()) return

  try {
    loading.value = true

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      parent_id: form.parent_id || undefined,
      icon: form.icon || undefined,
      color: form.color || undefined,
      sort_order: form.sort_order,
      is_active: form.is_active
    }

    if (isEdit.value && props.category) {
      // Update existing category
      await $fetch(`/api/categories/${props.category.id}`, {
        method: 'PUT',
        body: payload
      })
      emit('saved', 'Catégorie mise à jour avec succès')
    } else {
      // Create new category
      await $fetch('/api/categories', {
        method: 'POST',
        body: payload
      })
      emit('saved', 'Catégorie créée avec succès')
    }
  } catch (err: any) {
    console.error('Erreur lors de la sauvegarde:', err)

    // Handle validation errors from server
    if (err.data?.errors) {
      err.data.errors.forEach((error: any) => {
        errors.value[error.field] = error.message
      })
    } else {
      const message = err.data?.message || 'Erreur lors de la sauvegarde'
      errors.value.general = message
    }
  } finally {
    loading.value = false
  }
}

// Real-time validation watchers
watch(() => form.name, (newName) => {
  // Auto-generate slug for new categories
  if (newName && !isEdit.value) {
    form.slug = generateSlug(newName)
  }

  // Real-time validation for name
  if (newName.trim()) {
    const nameValidation = validateWithSchema(createCategorySchema.pick({ name: true }), { name: newName })
    const nameError = nameValidation.errors.find(e => e.field === 'name')
    if (nameError) {
      realTimeErrors.value.name = nameError.message
    } else {
      delete realTimeErrors.value.name
    }
  } else {
    delete realTimeErrors.value.name
  }
}, { immediate: true })

watch(() => form.slug, (newSlug) => {
  // Real-time validation for slug
  if (newSlug.trim()) {
    const slugValidation = validateWithSchema(createCategorySchema.pick({ slug: true }), { slug: newSlug })
    const slugError = slugValidation.errors.find(e => e.field === 'slug')
    if (slugError) {
      realTimeErrors.value.slug = slugError.message
    } else {
      delete realTimeErrors.value.slug
    }
  } else {
    delete realTimeErrors.value.slug
  }
}, { immediate: true })

watch(() => form.color, (newColor) => {
  // Real-time validation for color
  if (newColor && !/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
    realTimeErrors.value.color = 'La couleur doit être au format hexadécimal #RRGGBB'
  } else {
    delete realTimeErrors.value.color
  }
}, { immediate: true })

// Watchers

// Initialize form with category data if editing
watchEffect(() => {
  if (props.category) {
    Object.assign(form, {
      name: props.category.name,
      slug: props.category.slug,
      description: props.category.description || '',
      parent_id: props.category.parentId || '',
      icon: props.category.icon || '',
      color: props.category.color || '#3B82F6',
      sort_order: props.category.sortOrder,
      is_active: props.category.isActive
    })
  } else {
    // Reset form for new category
    Object.assign(form, {
      name: '',
      slug: '',
      description: '',
      parent_id: '',
      icon: '',
      color: '#3B82F6',
      sort_order: 0,
      is_active: true
    })
  }
  errors.value = {}
  realTimeErrors.value = {}
})
</script>