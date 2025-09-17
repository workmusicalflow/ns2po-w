<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <NuxtLink
          to="/admin/products"
          class="flex items-center text-gray-500 hover:text-gray-700"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5 mr-1" />
          Retour
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isNew ? 'Nouveau Produit' : 'Modifier le Produit' }}
          </h1>
          <p class="text-gray-600">
            {{ isNew ? 'Créez un nouveau produit dans votre catalogue' : `Modification de ${form.name || 'ce produit'}` }}
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-8">
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-6">Informations générales</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Product Name -->
          <AdminFormField
            id="name"
            type="text"
            label="Nom du produit"
            placeholder="Ex: T-shirt personnalisé"
            v-model="form.name"
            :error="errors.name"
            required
          />

          <!-- Reference -->
          <AdminFormField
            id="reference"
            type="text"
            label="Référence"
            placeholder="Ex: TS-001"
            v-model="form.reference"
            :error="errors.reference"
            help-text="Référence unique pour identifier le produit"
          />

          <!-- Category -->
          <AdminFormField
            id="category"
            type="select"
            label="Catégorie"
            placeholder="Sélectionner une catégorie"
            v-model="form.category_id"
            :options="categoryOptions"
            :error="errors.category_id"
            required
          />

          <!-- Status -->
          <AdminFormField
            id="status"
            type="select"
            label="Statut"
            v-model="form.status"
            :options="statusOptions"
            :error="errors.status"
            required
          />
        </div>

        <!-- Description -->
        <div class="mt-6">
          <AdminFormField
            id="description"
            type="textarea"
            label="Description"
            placeholder="Décrivez les caractéristiques du produit..."
            v-model="form.description"
            :rows="4"
            :error="errors.description"
          />
        </div>
      </div>

      <!-- Pricing & Details -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-6">Prix et détails</h2>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Price -->
          <AdminFormField
            id="price"
            type="number"
            label="Prix unitaire (XOF)"
            placeholder="0"
            v-model="form.price"
            :error="errors.price"
            required
          />

          <!-- Minimum Quantity -->
          <AdminFormField
            id="min_quantity"
            type="number"
            label="Quantité minimum"
            placeholder="1"
            v-model="form.min_quantity"
            :error="errors.min_quantity"
            help-text="Quantité minimum de commande"
          />

          <!-- Weight -->
          <AdminFormField
            id="weight"
            type="number"
            label="Poids (grammes)"
            placeholder="0"
            v-model="form.weight"
            :error="errors.weight"
            help-text="Poids pour calcul livraison"
          />
        </div>
      </div>

      <!-- Image Upload -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-6">Image du produit</h2>

        <div class="space-y-4">
          <!-- Current Image -->
          <div v-if="form.image_url" class="flex items-start space-x-4">
            <img
              :src="form.image_url"
              :alt="form.name"
              class="w-32 h-32 rounded-lg object-cover border border-gray-200"
            />
            <div class="flex-1">
              <p class="text-sm text-gray-600 mb-2">Image actuelle</p>
              <button
                type="button"
                @click="removeImage"
                class="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Supprimer l'image
              </button>
            </div>
          </div>

          <!-- Upload Area -->
          <div
            @drop="handleFileDrop"
            @dragover.prevent
            @dragenter.prevent
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
            :class="{ 'border-amber-400 bg-amber-50': isDragOver }"
          >
            <Icon name="heroicons:cloud-arrow-up" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div class="space-y-2">
              <p class="text-sm text-gray-600">
                <label for="image-upload" class="font-medium text-amber-600 hover:text-amber-500 cursor-pointer">
                  Cliquez pour sélectionner
                </label>
                ou glissez-déposez une image
              </p>
              <p class="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 10MB</p>
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
            />
          </div>

          <!-- Upload Progress -->
          <div v-if="isUploading" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Upload en cours...</span>
              <span class="text-gray-900">{{ uploadProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-amber-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-200">
        <div class="flex items-center space-x-4">
          <NuxtLink
            to="/admin/products"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Annuler
          </NuxtLink>

          <button
            v-if="!isNew"
            type="button"
            @click="duplicateProduct"
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Dupliquer
          </button>
        </div>

        <div class="flex items-center space-x-4">
          <button
            v-if="!isNew"
            type="button"
            @click="deleteProduct"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Supprimer
          </button>

          <button
            type="submit"
            :disabled="isSubmitting || isUploading"
            class="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            {{ isNew ? 'Créer le produit' : 'Sauvegarder' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: computed(() => isNew.value ? 'Nouveau Produit | Admin' : 'Modifier Produit | Admin')
})

// Route params
const route = useRoute()
const router = useRouter()
const productId = computed(() => route.params.id as string)
const isNew = computed(() => productId.value === 'new')

// Reactive data
const isSubmitting = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)
const isDragOver = ref(false)

// Form data
const form = reactive({
  name: '',
  reference: '',
  description: '',
  category_id: '',
  status: 'draft' as 'active' | 'inactive' | 'draft',
  price: 0,
  min_quantity: 1,
  weight: 0,
  image_url: ''
})

// Form errors
const errors = reactive({
  name: '',
  reference: '',
  description: '',
  category_id: '',
  status: '',
  price: '',
  min_quantity: '',
  weight: '',
  image_url: ''
})

// Options
const categories = ref([])
const categoryOptions = computed(() =>
  categories.value.map((cat: any) => ({
    value: cat.id,
    label: cat.name
  }))
)

const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'draft', label: 'Brouillon' }
]

// Methods
async function fetchProduct() {
  if (isNew.value) return

  try {
    const response = await $fetch(`/api/products/${productId.value}`)
    Object.assign(form, response.data)
  } catch (error) {
    console.error('Error fetching product:', error)
    // Redirect to list if product not found
    await router.push('/admin/products')
  }
}

async function fetchCategories() {
  try {
    const response = await $fetch('/api/categories')
    categories.value = response.data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

function clearErrors() {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

function validateForm(): boolean {
  clearErrors()
  let isValid = true

  if (!form.name.trim()) {
    errors.name = 'Le nom est requis'
    isValid = false
  }

  if (!form.category_id) {
    errors.category_id = 'La catégorie est requise'
    isValid = false
  }

  if (form.price <= 0) {
    errors.price = 'Le prix doit être supérieur à 0'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const url = isNew.value ? '/api/products' : `/api/products/${productId.value}`
    const method = isNew.value ? 'POST' : 'PUT'

    const response = await $fetch(url, {
      method,
      body: form
    })

    // Redirect to product list with success message
    await router.push('/admin/products')
  } catch (error) {
    console.error('Error saving product:', error)
    // TODO: Show error toast
  } finally {
    isSubmitting.value = false
  }
}

async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    await uploadImage(file)
  }
}

async function handleFileDrop(event: DragEvent) {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await uploadImage(file)
  }
}

async function uploadImage(file: File) {
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    alert('Le fichier est trop volumineux (max 10MB)')
    return
  }

  isUploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    formData.append('file', file)

    // Simulate upload progress
    const interval = setInterval(() => {
      uploadProgress.value += 10
      if (uploadProgress.value >= 90) {
        clearInterval(interval)
      }
    }, 100)

    const response = await $fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    })

    clearInterval(interval)
    uploadProgress.value = 100

    form.image_url = response.url
  } catch (error) {
    console.error('Error uploading image:', error)
    // TODO: Show error toast
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

function removeImage() {
  form.image_url = ''
}

function duplicateProduct() {
  // Navigate to new product with current form data
  router.push({
    path: '/admin/products/new',
    query: { duplicate: productId.value }
  })
}

async function deleteProduct() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

  try {
    await $fetch(`/api/products/${productId.value}`, {
      method: 'DELETE'
    })

    await router.push('/admin/products')
  } catch (error) {
    console.error('Error deleting product:', error)
    // TODO: Show error toast
  }
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchProduct()
  ])
})

// Drag & drop handlers
onMounted(() => {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragOver.value = true
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    isDragOver.value = false
  }

  document.addEventListener('dragover', handleDragOver)
  document.addEventListener('dragleave', handleDragLeave)

  onUnmounted(() => {
    document.removeEventListener('dragover', handleDragOver)
    document.removeEventListener('dragleave', handleDragLeave)
  })
})
</script>