<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">
            {{ isEdit ? 'Modifier la réalisation' : 'Nouvelle réalisation' }}
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-500"
          >
            <Icon name="heroicons:x-mark" class="w-6 h-6" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="submitForm" class="space-y-6">
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
                  v-model="form.description"
                  rows="4"
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Description détaillée de la réalisation..."
                ></textarea>
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
                      type="checkbox"
                      :value="category.id"
                      v-model="form.category_ids"
                      class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                    />
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
                      type="checkbox"
                      :value="product.id"
                      v-model="form.product_ids"
                      class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                    />
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
                        @click="removeTag(index)"
                        class="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-amber-600 hover:bg-amber-200"
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
                    />
                    <button
                      type="button"
                      @click="addTag"
                      class="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                          @change="handleFileUpload"
                          class="hidden"
                        />
                        <button
                          type="button"
                          @click="$refs.fileInput.click()"
                          class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4 mr-2" />
                          Ajouter des images
                        </button>
                      </div>
                      <p class="text-xs text-gray-500 mt-1">PNG, JPG, GIF jusqu'à 10MB</p>
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
                    <p class="text-xs text-gray-500">Afficher en priorité sur le site</p>
                  </div>
                  <button
                    type="button"
                    @click="form.is_featured = !form.is_featured"
                    :class="[
                      form.is_featured ? 'bg-amber-600' : 'bg-gray-200',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2'
                    ]"
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
                    <p class="text-xs text-gray-500">Visible sur le site public</p>
                  </div>
                  <button
                    type="button"
                    @click="form.is_active = !form.is_active"
                    :class="[
                      form.is_active ? 'bg-green-600' : 'bg-gray-200',
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    ]"
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
                  />
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
                    <option value="turso">Turso (Manuel)</option>
                    <option value="airtable">Airtable (Migration)</option>
                    <option value="cloudinary-auto-discovery">Cloudinary (Auto-découverte)</option>
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
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
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
interface Realisation {
  id?: string
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
}

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
}

const props = defineProps<{
  realisation?: Realisation | null
  categories: Category[]
  products: Product[]
}>()

const emit = defineEmits<{
  close: []
  saved: [realisation: Realisation]
}>()

const isEdit = computed(() => !!props.realisation)
const isLoading = ref(false)
const errors = ref<Record<string, string>>({})
const newTag = ref('')

// Form data
const form = reactive({
  title: '',
  description: '',
  cloudinary_public_ids: [] as string[],
  product_ids: [] as string[],
  category_ids: [] as string[],
  customization_option_ids: [] as string[],
  tags: [] as string[],
  is_featured: false,
  order_position: 0,
  is_active: true,
  source: 'turso',
  cloudinary_urls: [] as string[],
  cloudinary_metadata: {} as Record<string, any>
})

// Initialize form with existing data
watchEffect(() => {
  if (props.realisation) {
    Object.assign(form, {
      title: props.realisation.title || '',
      description: props.realisation.description || '',
      cloudinary_public_ids: [...(props.realisation.cloudinaryPublicIds || [])],
      product_ids: [...(props.realisation.productIds || [])],
      category_ids: [...(props.realisation.categoryIds || [])],
      customization_option_ids: [...(props.realisation.customizationOptionIds || [])],
      tags: [...(props.realisation.tags || [])],
      is_featured: props.realisation.isFeatured || false,
      order_position: props.realisation.orderPosition || 0,
      is_active: props.realisation.isActive !== undefined ? props.realisation.isActive : true,
      source: props.realisation.source || 'turso',
      cloudinary_urls: [...(props.realisation.cloudinaryUrls || [])],
      cloudinary_metadata: { ...(props.realisation.cloudinaryMetadata || {}) }
    })
  } else {
    // Reset form for new realisation
    Object.assign(form, {
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
      source: 'turso',
      cloudinary_urls: [],
      cloudinary_metadata: {}
    })
  }
})

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

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  isLoading.value = true
  try {
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'realisations')
      formData.append('folder', 'ns2po/realisations')

      const response = await fetch('https://api.cloudinary.com/v1_1/dsrvzogof/image/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload')
      }

      const data = await response.json()
      form.cloudinary_public_ids.push(data.public_id)
      form.cloudinary_urls.push(data.secure_url)
    }
  } catch (error) {
    console.error('Erreur upload:', error)
    // Handle error appropriately
  } finally {
    isLoading.value = false
    // Reset input
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

// Form submission
const submitForm = async () => {
  if (!validateForm()) return

  isLoading.value = true
  try {
    const payload = {
      title: form.title,
      description: form.description || undefined,
      cloudinary_public_ids: form.cloudinary_public_ids,
      product_ids: form.product_ids,
      category_ids: form.category_ids,
      customization_option_ids: form.customization_option_ids,
      tags: form.tags,
      is_featured: form.is_featured,
      order_position: form.order_position,
      is_active: form.is_active,
      source: form.source,
      cloudinary_urls: form.cloudinary_urls.length > 0 ? form.cloudinary_urls : undefined,
      cloudinary_metadata: Object.keys(form.cloudinary_metadata).length > 0 ? form.cloudinary_metadata : undefined
    }

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