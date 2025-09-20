<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
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

        <div class="flex items-center space-x-3">
          <button
            v-if="!isNew"
            @click="duplicateProduct"
            type="button"
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            Dupliquer
          </button>
          <button
            v-if="!isNew"
            @click="deleteProduct"
            type="button"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Form -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Column: Main Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Information -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-6">Informations générales</h2>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Product Name -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nom du produit <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Ex: T-shirt personnalisé"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                :class="{ 'border-red-300': errors.name }"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Catégorie <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.category"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                :class="{ 'border-red-300': errors.category }"
              >
                <option value="">Sélectionner une catégorie</option>
                <option v-for="category in categories" :key="category.id" :value="category.name">
                  {{ category.name }}
                </option>
              </select>
              <p v-if="errors.category" class="mt-1 text-sm text-red-600">{{ errors.category }}</p>
            </div>

            <!-- Subcategory -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie</label>
              <input
                v-model="form.subcategory"
                type="text"
                placeholder="Ex: Vêtements"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <!-- Base Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Prix de base (XOF) <span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="form.base_price"
                type="number"
                min="0"
                step="100"
                placeholder="5000"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                :class="{ 'border-red-300': errors.base_price }"
              />
              <p v-if="errors.base_price" class="mt-1 text-sm text-red-600">{{ errors.base_price }}</p>
            </div>

            <!-- Unit -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Unité</label>
              <select
                v-model="form.unit"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="pièce">Pièce</option>
                <option value="lot">Lot</option>
                <option value="m²">m²</option>
                <option value="ml">Mètre linéaire</option>
                <option value="kg">Kilogramme</option>
              </select>
            </div>

            <!-- Min/Max Quantities -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Quantité minimale</label>
              <input
                v-model.number="form.min_quantity"
                type="number"
                min="1"
                placeholder="1"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Quantité maximale</label>
              <input
                v-model.number="form.max_quantity"
                type="number"
                min="1"
                placeholder="1000"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <!-- Production Time -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Délai de production (jours)</label>
              <input
                v-model.number="form.production_time_days"
                type="number"
                min="1"
                placeholder="7"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <p class="mt-1 text-xs text-gray-500">Nombre de jours nécessaires pour la production</p>
            </div>

            <!-- Description -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                v-model="form.description"
                rows="4"
                placeholder="Description détaillée du produit..."
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Product Options -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-6">Options et personnalisation</h2>

          <!-- Customizable -->
          <div class="mb-6">
            <label class="flex items-center">
              <input
                v-model="form.customizable"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span class="ml-2 text-sm text-gray-700">Produit personnalisable</span>
            </label>
            <p class="mt-1 text-xs text-gray-500">Permet au client de personnaliser ce produit</p>
          </div>

          <!-- Materials -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Matériaux</label>
            <input
              v-model="form.materials"
              type="text"
              placeholder="Ex: Coton 100%, Polyester..."
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <!-- Colors -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Couleurs disponibles</label>
            <div class="flex items-center space-x-2 mb-2">
              <input
                v-model="newColor"
                @keydown.enter.prevent="addColor"
                type="text"
                placeholder="Ajouter une couleur..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                @click="addColor"
                type="button"
                class="px-3 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
              >
                Ajouter
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(color, index) in form.colors"
                :key="index"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {{ color }}
                <button
                  @click="removeColor(index)"
                  type="button"
                  class="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </span>
            </div>
          </div>

          <!-- Sizes -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Tailles disponibles</label>
            <div class="flex items-center space-x-2 mb-2">
              <input
                v-model="newSize"
                @keydown.enter.prevent="addSize"
                type="text"
                placeholder="Ajouter une taille..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <button
                @click="addSize"
                type="button"
                class="px-3 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
              >
                Ajouter
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(size, index) in form.sizes"
                :key="index"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {{ size }}
                <button
                  @click="removeSize(index)"
                  type="button"
                  class="ml-1 text-green-600 hover:text-green-800"
                >
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </span>
            </div>
          </div>

          <!-- Specifications -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Spécifications techniques</label>
            <textarea
              v-model="form.specifications"
              rows="3"
              placeholder="Spécifications techniques détaillées..."
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            ></textarea>
          </div>
        </div>

        <!-- Images -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-6">Images du produit</h2>

          <!-- Main Image -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Image principale</label>
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <img
                  v-if="form.image_url"
                  :src="form.image_url"
                  alt="Aperçu"
                  class="w-24 h-24 rounded-lg object-cover border border-gray-300"
                />
                <div
                  v-else
                  class="w-24 h-24 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center"
                >
                  <Icon name="heroicons:photo" class="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div class="flex-1">
                <input
                  v-model="form.image_url"
                  type="url"
                  placeholder="URL de l'image principale..."
                  class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p class="mt-1 text-xs text-gray-500">URL de l'image ou utilisez le bouton d'upload</p>
              </div>
              <button
                @click="uploadMainImage"
                type="button"
                class="px-4 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
              >
                Upload
              </button>
            </div>
          </div>

          <!-- Gallery Images -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Galerie d'images</label>
            <div class="mb-4">
              <div class="flex items-center space-x-2">
                <input
                  v-model="newGalleryUrl"
                  @keydown.enter.prevent="addGalleryImage"
                  type="url"
                  placeholder="URL de l'image à ajouter..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  @click="addGalleryImage"
                  type="button"
                  class="px-3 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
                >
                  Ajouter
                </button>
              </div>
            </div>

            <div v-if="form.gallery_urls.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(url, index) in form.gallery_urls"
                :key="index"
                class="relative group"
              >
                <img
                  :src="url"
                  :alt="`Image ${index + 1}`"
                  class="w-full h-24 rounded-lg object-cover border border-gray-300"
                />
                <button
                  @click="removeGalleryImage(index)"
                  type="button"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="heroicons:x-mark" class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Preview & Settings -->
      <div class="space-y-6">
        <!-- Product Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Aperçu du produit</h3>

          <div class="space-y-4">
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-3">
                <img
                  v-if="form.image_url"
                  :src="form.image_url"
                  :alt="form.name"
                  class="w-16 h-16 rounded-lg object-cover"
                />
                <div
                  v-else
                  class="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center"
                >
                  <Icon name="heroicons:photo" class="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">{{ form.name || 'Nom du produit' }}</h4>
                  <p class="text-sm text-gray-500">{{ form.category || 'Catégorie' }}</p>
                  <p class="text-lg font-bold text-amber-600">{{ formatPrice(form.base_price) }}</p>
                </div>
              </div>

              <p class="text-sm text-gray-600 mb-2">
                {{ form.description || 'Description du produit...' }}
              </p>

              <div class="text-xs text-gray-500">
                <p>Délai: {{ form.production_time_days || 7 }} jours</p>
                <p>Qté: {{ form.min_quantity || 1 }} - {{ form.max_quantity || 1000 }} {{ form.unit }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Product Settings -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Paramètres</h3>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Produit actif</span>
              <input
                v-model="form.is_active"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Personnalisable</span>
              <span class="text-sm font-medium" :class="form.customizable ? 'text-green-600' : 'text-gray-400'">
                {{ form.customizable ? 'Oui' : 'Non' }}
              </span>
            </div>

            <div class="border-t pt-4">
              <div class="text-sm text-gray-600 mb-2">Couleurs disponibles</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="color in form.colors"
                  :key="color"
                  class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {{ color }}
                </span>
                <span v-if="form.colors.length === 0" class="text-xs text-gray-400">Aucune couleur</span>
              </div>
            </div>

            <div class="border-t pt-4">
              <div class="text-sm text-gray-600 mb-2">Tailles disponibles</div>
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="size in form.sizes"
                  :key="size"
                  class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {{ size }}
                </span>
                <span v-if="form.sizes.length === 0" class="text-xs text-gray-400">Aucune taille</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div class="space-y-4">
            <button
              @click="handleSubmit"
              :disabled="isSubmitting || !isFormValid"
              class="w-full px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
            >
              <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              {{ isNew ? 'Créer le produit' : 'Sauvegarder' }}
            </button>

            <button
              @click="saveDraft"
              :disabled="isSubmitting"
              class="w-full px-4 py-2 border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 disabled:opacity-50"
            >
              Sauvegarder comme brouillon
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Route params
const route = useRoute()
const router = useRouter()
const productId = computed(() => (route.params.id as string) || 'new')
const isNew = computed(() => {
  const id = productId.value
  return !id || id === 'new'
})

// Head
useHead({
  title: computed(() => isNew.value ? 'Nouveau Produit | Admin' : 'Modifier Produit | Admin')
})

// Reactive data
const isSubmitting = ref(false)
const newColor = ref('')
const newSize = ref('')
const newGalleryUrl = ref('')

// Form data
const form = reactive({
  name: '',
  description: '',
  category: '',
  subcategory: '',
  base_price: 0,
  min_quantity: 1,
  max_quantity: 1000,
  unit: 'pièce',
  production_time_days: 7,
  customizable: false,
  materials: '',
  colors: [] as string[],
  sizes: [] as string[],
  image_url: '',
  gallery_urls: [] as string[],
  specifications: '',
  is_active: true
})

// Form errors
const errors = reactive({
  name: '',
  category: '',
  base_price: ''
})

// Categories
const categories = ref([
  { id: 'textile', name: 'Textile' },
  { id: 'papeterie', name: 'Papeterie' },
  { id: 'signalisation', name: 'Signalisation' },
  { id: 'multimedia', name: 'Multimédia' },
  { id: 'accessoires', name: 'Accessoires' },
  { id: 'autres', name: 'Autres' }
])

// Computed
const isFormValid = computed(() => {
  return form.name.trim() !== '' &&
         form.category !== '' &&
         form.base_price > 0
})

// Methods
async function fetchProduct() {
  const id = productId.value
  if (!id || id === 'new') return

  try {
    const response = await $fetch(`/api/products/${id}`)
    const data = response.data

    // Map response to form
    Object.assign(form, {
      name: data.name,
      description: data.description || '',
      category: data.category,
      subcategory: data.subcategory || '',
      base_price: data.basePrice,
      min_quantity: data.minQuantity,
      max_quantity: data.maxQuantity,
      unit: data.unit,
      production_time_days: data.productionTimeDays,
      customizable: data.customizable,
      materials: data.materials || '',
      colors: data.colors || [],
      sizes: data.sizes || [],
      image_url: data.image || '',
      gallery_urls: data.galleryUrls || [],
      specifications: data.specifications || '',
      is_active: data.isActive
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    await router.push('/admin/products')
  }
}

async function fetchCategories() {
  try {
    const response = await $fetch('/api/categories')
    if (response.data && response.data.length > 0) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

function addColor() {
  const color = newColor.value.trim()
  if (color && !form.colors.includes(color)) {
    form.colors.push(color)
    newColor.value = ''
  }
}

function removeColor(index: number) {
  form.colors.splice(index, 1)
}

function addSize() {
  const size = newSize.value.trim()
  if (size && !form.sizes.includes(size)) {
    form.sizes.push(size)
    newSize.value = ''
  }
}

function removeSize(index: number) {
  form.sizes.splice(index, 1)
}

function addGalleryImage() {
  const url = newGalleryUrl.value.trim()
  if (url && !form.gallery_urls.includes(url)) {
    form.gallery_urls.push(url)
    newGalleryUrl.value = ''
  }
}

function removeGalleryImage(index: number) {
  form.gallery_urls.splice(index, 1)
}

function uploadMainImage() {
  // TODO: Implement Cloudinary upload
  console.log('Upload main image')
}

function validateForm(): boolean {
  errors.name = form.name.trim() === '' ? 'Le nom est requis' : ''
  errors.category = form.category === '' ? 'La catégorie est requise' : ''
  errors.base_price = form.base_price <= 0 ? 'Le prix doit être supérieur à 0' : ''

  return Object.values(errors).every(error => error === '')
}

async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const url = isNew.value ? '/api/products' : `/api/products/${productId.value}`
    const method = isNew.value ? 'POST' : 'PUT'

    const productData = {
      ...form
    }

    const response = await $fetch(url, {
      method,
      body: productData
    })

    if (response.success) {
      await router.push('/admin/products')
    }
  } catch (error) {
    console.error('Error saving product:', error)
    // TODO: Show error toast
  } finally {
    isSubmitting.value = false
  }
}

async function saveDraft() {
  const originalIsActive = form.is_active
  form.is_active = false
  await handleSubmit()
  form.is_active = originalIsActive
}

function duplicateProduct() {
  router.push({
    path: '/admin/products/new',
    query: { duplicate: productId.value }
  })
}

async function deleteProduct() {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${form.name}" ?`)) return

  try {
    await $fetch(`/api/products/${productId.value}`, {
      method: 'DELETE'
    })

    await router.push('/admin/products')
  } catch (error) {
    console.error('Error deleting product:', error)
    if (error.statusCode === 409) {
      alert('Impossible de supprimer ce produit car il est utilisé dans des bundles.')
    } else {
      // TODO: Show error toast
    }
  }
}

function formatPrice(price: number | undefined | null): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A'
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchCategories(),
    fetchProduct()
  ])
})
</script>