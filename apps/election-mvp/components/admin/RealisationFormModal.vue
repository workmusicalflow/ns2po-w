<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')" />

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEdit ? 'Modifier la réalisation' : 'Nouvelle réalisation' }}
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
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left Column -->
            <div class="space-y-6">
              <!-- Title -->
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la réalisation *
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  maxlength="200"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ex: Casquettes personnalisées campagne 2024"
                >
                <p v-if="errors.title" class="mt-1 text-sm text-red-600">
                  {{ errors.title }}
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
                  rows="4"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Description détaillée de la réalisation..."
                />
              </div>

              <!-- Categories -->
              <div>
                <label for="categories" class="block text-sm font-medium text-gray-700 mb-1">
                  Catégories
                </label>
                <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  <label
                    v-for="category in categories"
                    :key="category.id"
                    class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      v-model="form.category_ids"
                      type="checkbox"
                      :value="category.id"
                      class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                    >
                    <span class="text-sm">{{ category.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Products -->
              <div>
                <label for="products" class="block text-sm font-medium text-gray-700 mb-1">
                  Produits associés
                </label>
                <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  <label
                    v-for="product in products"
                    :key="product.id"
                    class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      v-model="form.product_ids"
                      type="checkbox"
                      :value="product.id"
                      class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                    >
                    <span class="text-sm">{{ product.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Tags -->
              <div>
                <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div class="space-y-2">
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="(tag, index) in form.tags"
                      :key="index"
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
                    >
                      {{ tag }}
                      <button
                        type="button"
                        class="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-amber-600 hover:bg-amber-200"
                        @click="removeTag(index)"
                      >
                        <Icon name="heroicons:x-mark" class="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                  <div class="flex space-x-2">
                    <input
                      v-model="newTag"
                      type="text"
                      placeholder="Ajouter un tag..."
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      @keyup.enter="addTag"
                    >
                    <button
                      type="button"
                      class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      @click="addTag"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
              <!-- Images Cloudinary -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Images Cloudinary
                </label>
                <div class="space-y-4">
                  <!-- Current Images -->
                  <div v-if="form.cloudinary_public_ids.length > 0" class="grid grid-cols-2 gap-2">
                    <div
                      v-for="(publicId, index) in form.cloudinary_public_ids"
                      :key="index"
                      class="relative group"
                    >
                      <img
                        :src="getCloudinaryUrl(publicId, 'w_150,h_150,c_fill')"
                        :alt="`Image ${index + 1}`"
                        class="w-full h-24 object-cover rounded-lg"
                      >
                      <button
                        type="button"
                        class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        @click="removeImage(index)"
                      >
                        <Icon name="heroicons:x-mark" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Add Images -->
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div class="text-center">
                      <Icon name="heroicons:photo" class="mx-auto h-12 w-12 text-gray-400" />
                      <div class="mt-2">
                        <input
                          ref="fileInput"
                          type="file"
                          multiple
                          accept="image/*"
                          class="hidden"
                          @change="handleFileUpload"
                        >
                        <button
                          type="button"
                          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          @click="triggerFileInput"
                        >
                          <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4 mr-2" />
                          Ajouter des images
                        </button>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF jusqu'à 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Settings -->
              <div class="space-y-4">
                <!-- Featured -->
                <div class="flex items-center justify-between">
                  <div>
                    <label for="is_featured" class="text-sm font-medium text-gray-700">
                      Réalisation vedette
                    </label>
                    <p class="text-xs text-gray-500">
                      Afficher en priorité sur le site
                    </p>
                  </div>
                  <button
                    type="button"
                    :class="[
                      form.is_featured ? 'bg-amber-600' : 'bg-gray-200',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
                    ]"
                    @click="form.is_featured = !form.is_featured"
                  >
                    <span
                      :class="[
                        form.is_featured ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                      ]"
                    />
                  </button>
                </div>

                <!-- Active -->
                <div class="flex items-center justify-between">
                  <div>
                    <label for="is_active" class="text-sm font-medium text-gray-700">
                      Réalisation active
                    </label>
                    <p class="text-xs text-gray-500">
                      Visible sur le site public
                    </p>
                  </div>
                  <button
                    type="button"
                    :class="[
                      form.is_active ? 'bg-green-600' : 'bg-gray-200',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    ]"
                    @click="form.is_active = !form.is_active"
                  >
                    <span
                      :class="[
                        form.is_active ? 'translate-x-5' : 'translate-x-0',
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                      ]"
                    />
                  </button>
                </div>

                <!-- Order Position -->
                <div>
                  <label for="order_position" class="block text-sm font-medium text-gray-700 mb-1">
                    Position d'affichage
                  </label>
                  <input
                    id="order_position"
                    v-model.number="form.order_position"
                    type="number"
                    min="0"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="0"
                  >
                  <p class="mt-1 text-xs text-gray-500">
                    Plus le nombre est bas, plus la réalisation apparaît en premier
                  </p>
                </div>

                <!-- Source -->
                <div>
                  <label for="source" class="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <select
                    id="source"
                    v-model="form.source"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="turso">
                      Turso (Manuel)
                    </option>
                    <option value="airtable">
                      Airtable (Migration)
                    </option>
                    <option value="cloudinary-auto-discovery">
                      Cloudinary (Auto-découverte)
                    </option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500">
                    Indique l'origine de cette réalisation
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              @click="$emit('close')"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              <Icon v-if="isLoading" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              {{ isEdit ? 'Mettre à jour' : 'Créer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ✅ Types centralisés (DRY - Single Source of Truth)
import type {
  RealisationFromApi,
  RealisationFormData,
  RealisationCategory,
  RealisationProduct
} from '~/types/admin/realisation-form'
import {
  getDefaultRealisationFormData
} from '~/types/admin/realisation-form'

// ✅ Pattern Adapter: Mapper centralisé
import {
  mapRealisationApiToForm,
  mapRealisationFormToApi,
  isFormDataValid
} from '~/utils/realisationMapper'

// ✅ Composable Cloudinary existant (évite duplication upload)
import { useCloudinary } from '~/composables/useCloudinary'

const props = defineProps<{
  realisation?: RealisationFromApi | null
  categories: RealisationCategory[]
  products: RealisationProduct[]
}>()

const emit = defineEmits<{
  close: []
  saved: [realisation: RealisationFromApi]
}>()

// ✅ Utiliser le composable Cloudinary existant
const cloudinary = useCloudinary()

const isEdit = computed(() => !!props.realisation)
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const newTag = ref('')

// ✅ Ref typée pour l'input file (évite erreur TS18046)
const fileInput = ref<HTMLInputElement | null>(null)

/**
 * Déclenche le click sur l'input file via la ref typée
 */
const triggerFileInput = () => {
  fileInput.value?.click()
}

// ✅ Form data avec type explicite
const form = reactive<RealisationFormData>(getDefaultRealisationFormData())

/**
 * ✅ Pattern Adapter: watch au lieu de watchEffect
 * Plus prévisible, s'exécute seulement quand props.realisation change
 * @see Gemini audit: watch + immediate est plus prévisible que watchEffect
 */
watch(
  () => props.realisation,
  (newRealisation) => {
    if (newRealisation) {
      // ✅ Utiliser le mapper centralisé
      const mapped = mapRealisationApiToForm(newRealisation)
      Object.assign(form, mapped)
      console.log('📥 [RealisationFormModal] Données chargées via mapper:', {
        title: form.title,
        imagesCount: form.cloudinary_public_ids.length
      })
    } else {
      // Reset form pour nouvelle réalisation
      Object.assign(form, getDefaultRealisationFormData())
    }
  },
  { immediate: true }
)

// Helper function for Cloudinary URLs
const getCloudinaryUrl = (publicId: string, transformations = '') => {
  const baseUrl = 'https://res.cloudinary.com/dsrvzogof'
  if (transformations) {
    return `${baseUrl}/image/upload/${transformations}/${publicId}`
  }
  return `${baseUrl}/image/upload/${publicId}`
}

// Tag management
const addTag = () => {
  if (newTag.value.trim() && !form.tags.includes(newTag.value.trim())) {
    form.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

// Image management
const removeImage = (index: number) => {
  form.cloudinary_public_ids.splice(index, 1)
  if (form.cloudinary_urls.length > index) {
    form.cloudinary_urls.splice(index, 1)
  }
}

/**
 * ✅ Utilise le composable useCloudinary au lieu de l'appel direct
 * Avantages: DRY, gestion d'erreurs centralisée, progress tracking
 */
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  isLoading.value = true
  try {
    // ✅ Utiliser le composable Cloudinary
    const results = await cloudinary.uploadMultipleFiles(
      Array.from(files),
      { folder: 'ns2po/realisations' }
    )

    // Ajouter les résultats au formulaire
    results.forEach(result => {
      form.cloudinary_public_ids.push(result.public_id)
      form.cloudinary_urls.push(result.secure_url)
    })

    console.log(`✅ ${results.length} image(s) uploadée(s) via useCloudinary`)
  } catch (error) {
    console.error('Erreur upload:', error)
    errors.value.upload = 'Erreur lors de l\'upload des images'
  } finally {
    isLoading.value = false
    target.value = ''
  }
}

// Form validation
const validateForm = () => {
  errors.value = {}

  if (!form.title.trim()) {
    errors.value.title = 'Le titre est requis'
  } else if (form.title.length > 200) {
    errors.value.title = 'Le titre ne peut pas dépasser 200 caractères'
  }

  return Object.keys(errors.value).length === 0
}

/**
 * ✅ Form submission avec mapper centralisé
 * Avantages: transformation cohérente, validation intégrée
 */
const submitForm = async () => {
  if (!validateForm()) return

  // ✅ Validation supplémentaire via mapper
  const validation = isFormDataValid(form)
  if (!validation.valid) {
    validation.errors.forEach(err => {
      errors.value.form = err
    })
    return
  }

  isLoading.value = true
  try {
    // ✅ Utiliser le mapper pour transformer Form → API
    const payload = mapRealisationFormToApi(form)

    console.log('📤 [RealisationFormModal] Payload via mapper:', payload)

    let response
    if (isEdit.value && props.realisation?.id) {
      response = await $fetch(`/api/realisations/${props.realisation.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      response = await $fetch('/api/realisations', {
        method: 'POST',
        body: payload
      })
    }

    if (response.success) {
      emit('saved', response.data)
      emit('close')
    }
  } catch (error: any) {
    console.error('Erreur:', error)
    if (error.data?.errors) {
      error.data.errors.forEach((err: any) => {
        errors.value[err.field] = err.message
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>