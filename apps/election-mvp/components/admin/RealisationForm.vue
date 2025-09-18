<template>
  <form @submit.prevent="submitForm" class="space-y-6">
    <!-- Basic Information -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Informations de base</h3>

      <div class="grid grid-cols-1 gap-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
            Titre de la réalisation *
          </label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.title ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Ex: Campagne municipale Abidjan 2024"
            @blur="validateField('title')"
          />
          <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="4"
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.description ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Description détaillée de la réalisation..."
            @blur="validateField('description')"
          ></textarea>
          <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
        </div>
      </div>
    </div>

    <!-- Images Management -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Images de la réalisation</h3>

      <!-- Current Images -->
      <div v-if="formData.cloudinary_public_ids && formData.cloudinary_public_ids.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div
          v-for="(publicId, index) in formData.cloudinary_public_ids"
          :key="index"
          class="relative group"
        >
          <img
            :src="getCloudinaryUrl(publicId)"
            :alt="`Image ${index + 1}`"
            class="w-full h-24 object-cover rounded-lg"
          />
          <button
            type="button"
            @click="removeImage(index)"
            class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon name="heroicons:x-mark" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Upload Area -->
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div class="text-center">
          <Icon name="heroicons:photo" class="mx-auto h-12 w-12 text-gray-400" />
          <div class="mt-2">
            <input
              ref="fileInput"
              type="file"
              multiple
              accept="image/*"
              @change="handleFileUpload"
              class="hidden"
            />
            <button
              type="button"
              @click="$refs.fileInput.click()"
              :disabled="isUploading"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Icon v-if="isUploading" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              <Icon v-else name="heroicons:cloud-arrow-up" class="w-4 h-4 mr-2" />
              {{ isUploading ? 'Upload en cours...' : 'Ajouter des images' }}
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">PNG, JPG, GIF jusqu'à 10MB (max 10 images)</p>
        </div>
      </div>

      <p v-if="errors.cloudinary_public_ids" class="mt-2 text-sm text-red-600">{{ errors.cloudinary_public_ids }}</p>
    </div>

    <!-- Relations Management -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Relations et associations</h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Products -->
        <div>
          <label for="product_ids" class="block text-sm font-medium text-gray-700 mb-1">
            Produits utilisés
          </label>
          <select
            id="product_ids"
            v-model="formData.product_ids"
            multiple
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.product_ids ? 'border-red-300' : 'border-gray-300'
            ]"
            @change="validateField('product_ids')"
          >
            <option
              v-for="product in availableProducts"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }} ({{ product.reference }})
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500">Maintenez Ctrl/Cmd pour sélectionner plusieurs produits</p>
          <p v-if="errors.product_ids" class="mt-1 text-sm text-red-600">{{ errors.product_ids }}</p>
        </div>

        <!-- Categories -->
        <div>
          <label for="category_ids" class="block text-sm font-medium text-gray-700 mb-1">
            Catégories
          </label>
          <select
            id="category_ids"
            v-model="formData.category_ids"
            multiple
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.category_ids ? 'border-red-300' : 'border-gray-300'
            ]"
            @change="validateField('category_ids')"
          >
            <option
              v-for="category in availableCategories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500">Maintenez Ctrl/Cmd pour sélectionner plusieurs catégories</p>
          <p v-if="errors.category_ids" class="mt-1 text-sm text-red-600">{{ errors.category_ids }}</p>
        </div>
      </div>

      <!-- Customization Options -->
      <div class="mt-6">
        <label for="customization_option_ids" class="block text-sm font-medium text-gray-700 mb-1">
          Options de personnalisation
        </label>
        <select
          id="customization_option_ids"
          v-model="formData.customization_option_ids"
          multiple
          :class="[
            'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
            errors.customization_option_ids ? 'border-red-300' : 'border-gray-300'
          ]"
          @change="validateField('customization_option_ids')"
        >
          <option
            v-for="option in availableCustomizationOptions"
            :key="option.id"
            :value="option.id"
          >
            {{ option.name }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">Maintenez Ctrl/Cmd pour sélectionner plusieurs options</p>
        <p v-if="errors.customization_option_ids" class="mt-1 text-sm text-red-600">{{ errors.customization_option_ids }}</p>
      </div>
    </div>

    <!-- Tags and Metadata -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Tags et métadonnées</h3>

      <div class="space-y-6">
        <!-- Tags -->
        <div>
          <label for="tags" class="block text-sm font-medium text-gray-700 mb-1">
            Tags (séparés par des virgules)
          </label>
          <input
            id="tags"
            v-model="tagsInput"
            type="text"
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.tags ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="campagne, municipale, affichage, 2024"
            @blur="updateTags"
          />
          <p class="mt-1 text-xs text-gray-500">Maximum 20 tags, 30 caractères par tag</p>
          <p v-if="errors.tags" class="mt-1 text-sm text-red-600">{{ errors.tags }}</p>

          <!-- Tags Display -->
          <div v-if="formData.tags.length > 0" class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="(tag, index) in formData.tags"
              :key="`tag-${index}`"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
            >
              {{ tag }}
              <button
                type="button"
                @click="removeTag(index)"
                class="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-amber-600 hover:bg-amber-200 hover:text-amber-800 focus:outline-none"
              >
                <Icon name="heroicons:x-mark" class="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>

        <!-- Source -->
        <div>
          <label for="source" class="block text-sm font-medium text-gray-700 mb-1">
            Source de la réalisation
          </label>
          <select
            id="source"
            v-model="formData.source"
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.source ? 'border-red-300' : 'border-gray-300'
            ]"
            @change="validateField('source')"
          >
            <option value="turso">Turso (Base de données)</option>
            <option value="airtable">Airtable (Legacy)</option>
            <option value="cloudinary-auto-discovery">Cloudinary (Auto-découverte)</option>
          </select>
          <p v-if="errors.source" class="mt-1 text-sm text-red-600">{{ errors.source }}</p>
        </div>
      </div>
    </div>

    <!-- Display Configuration -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Configuration d'affichage</h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Order Position -->
        <div>
          <label for="order_position" class="block text-sm font-medium text-gray-700 mb-1">
            Position d'affichage
          </label>
          <input
            id="order_position"
            v-model.number="formData.order_position"
            type="number"
            min="0"
            max="9999"
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.order_position ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="0"
            @blur="validateField('order_position')"
          />
          <p class="mt-1 text-xs text-gray-500">Plus le nombre est bas, plus la réalisation apparaît en premier</p>
          <p v-if="errors.order_position" class="mt-1 text-sm text-red-600">{{ errors.order_position }}</p>
        </div>

        <!-- Status Options -->
        <div class="space-y-3">
          <div class="flex items-center">
            <input
              id="is_featured"
              v-model="formData.is_featured"
              type="checkbox"
              class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label for="is_featured" class="ml-2 block text-sm text-gray-700">
              Réalisation vedette
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="is_active"
              v-model="formData.is_active"
              type="checkbox"
              class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label for="is_active" class="ml-2 block text-sm text-gray-700">
              Réalisation active
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-6 border-t">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
      >
        Annuler
      </button>
      <button
        type="submit"
        :disabled="isSubmitting || !isFormValid"
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
      >
        <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
        {{ isEdit ? 'Mettre à jour' : 'Créer' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { useFormValidation } from '~/composables/useFormValidation'
import { globalNotifications } from '~/composables/useNotifications'

interface Product {
  id: string
  name: string
  reference?: string
}

interface Category {
  id: string
  name: string
}

interface CustomizationOption {
  id: string
  name: string
}

interface Realisation {
  id?: string
  title: string
  description?: string
  cloudinary_public_ids: string[]
  product_ids: string[]
  category_ids: string[]
  customization_option_ids: string[]
  tags: string[]
  is_featured: boolean
  order_position: number
  is_active: boolean
  source: 'airtable' | 'cloudinary-auto-discovery' | 'turso'
  cloudinary_urls?: string[]
  cloudinary_metadata?: Record<string, any>
}

const props = defineProps<{
  realisation?: Realisation | null
  availableProducts: Product[]
  availableCategories: Category[]
  availableCustomizationOptions: CustomizationOption[]
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [realisation: Realisation]
  cancel: []
}>()

const { validateRealisation } = useFormValidation()
const { crudError } = globalNotifications

// Form state
const formData = reactive<Realisation>({
  title: '',
  description: '',
  cloudinary_public_ids: [],
  product_ids: [],
  category_ids: [],
  customization_option_ids: [],
  tags: [],
  is_featured: false,
  order_position: 0,
  is_active: true,
  source: 'turso'
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isUploading = ref(false)
const tagsInput = ref('')

// Initialize form with realisation data
watchEffect(() => {
  if (props.realisation) {
    Object.assign(formData, {
      ...props.realisation,
      cloudinary_public_ids: props.realisation.cloudinary_public_ids || [],
      product_ids: props.realisation.product_ids || [],
      category_ids: props.realisation.category_ids || [],
      customization_option_ids: props.realisation.customization_option_ids || [],
      tags: props.realisation.tags || []
    })
    tagsInput.value = props.realisation.tags?.join(', ') || ''
  } else {
    // Reset form for new realisation
    Object.assign(formData, {
      title: '',
      description: '',
      cloudinary_public_ids: [],
      product_ids: [],
      category_ids: [],
      customization_option_ids: [],
      tags: [],
      is_featured: false,
      order_position: 0,
      is_active: true,
      source: 'turso'
    })
    tagsInput.value = ''
  }
})

// Computed
const isFormValid = computed(() => {
  return formData.title &&
         formData.title.length >= 3 &&
         Object.keys(errors.value).length === 0
})

// Methods
const validateField = (fieldName: string) => {
  const result = validateRealisation(formData, props.isEdit)

  if (!result.success) {
    const fieldError = result.errors.find(err => err.field === fieldName)
    if (fieldError) {
      errors.value[fieldName] = fieldError.message
    } else {
      delete errors.value[fieldName]
    }
  } else {
    delete errors.value[fieldName]
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  // Check if adding these files would exceed the limit
  const newImagesCount = formData.cloudinary_public_ids.length + files.length
  if (newImagesCount > 10) {
    crudError.validation('Maximum 10 images autorisées par réalisation')
    return
  }

  isUploading.value = true
  try {
    for (const file of Array.from(files)) {
      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) { // 10MB
        crudError.validation(`Le fichier ${file.name} est trop volumineux (max 10MB)`)
        continue
      }

      if (!file.type.startsWith('image/')) {
        crudError.validation(`Le fichier ${file.name} n'est pas une image`)
        continue
      }

      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('upload_preset', 'realisations')
      formDataUpload.append('folder', 'ns2po/realisations')

      const response = await fetch('https://api.cloudinary.com/v1_1/dsrvzogof/image/upload', {
        method: 'POST',
        body: formDataUpload
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload')
      }

      const data = await response.json()

      // Add to form images
      formData.cloudinary_public_ids.push(data.public_id)
    }
  } catch (error) {
    console.error('Erreur upload:', error)
    crudError.validation('Erreur lors de l\'upload des images')
  } finally {
    isUploading.value = false
    // Reset input
    target.value = ''
  }
}

const removeImage = (index: number) => {
  formData.cloudinary_public_ids.splice(index, 1)
}

const getCloudinaryUrl = (publicId: string) => {
  return `https://res.cloudinary.com/dsrvzogof/image/upload/w_200,h_200,c_fill/${publicId}`
}

const updateTags = () => {
  if (tagsInput.value.trim()) {
    formData.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 30)
      .slice(0, 20) // Limit to 20 tags
  } else {
    formData.tags = []
  }
  validateField('tags')
}

const removeTag = (index: number) => {
  formData.tags.splice(index, 1)
  tagsInput.value = formData.tags.join(', ')
}

const submitForm = async () => {
  // Validate entire form
  const result = validateRealisation(formData, props.isEdit)

  if (!result.success) {
    errors.value = {}
    result.errors.forEach(error => {
      errors.value[error.field] = error.message
    })
    return
  }

  isSubmitting.value = true
  try {
    emit('submit', { ...formData })
  } catch (error) {
    console.error('Erreur soumission:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>