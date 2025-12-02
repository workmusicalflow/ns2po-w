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
            type="button"
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            @click="duplicateProduct"
          >
            Dupliquer
          </button>
          <button
            v-if="!isNew"
            type="button"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
            @click="deleteProduct"
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
          <h2 class="text-lg font-medium text-gray-900 mb-6">
            Informations générales
          </h2>

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
              >
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </p>
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
                <option value="">
                  Sélectionner une catégorie
                </option>
                <option v-for="category in categories" :key="category.id" :value="category.name">
                  {{ category.name }}
                </option>
              </select>
              <p v-if="errors.category" class="mt-1 text-sm text-red-600">
                {{ errors.category }}
              </p>
            </div>

            <!-- Subcategory -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sous-catégorie</label>
              <input
                v-model="form.subcategory"
                type="text"
                placeholder="Ex: Vêtements"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
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
              >
              <p v-if="errors.base_price" class="mt-1 text-sm text-red-600">
                {{ errors.base_price }}
              </p>
            </div>

            <!-- Unit -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Unité</label>
              <select
                v-model="form.unit"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="pièce">
                  Pièce
                </option>
                <option value="lot">
                  Lot
                </option>
                <option value="m²">
                  m²
                </option>
                <option value="ml">
                  Mètre linéaire
                </option>
                <option value="kg">
                  Kilogramme
                </option>
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
              >
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Quantité maximale</label>
              <input
                v-model.number="form.max_quantity"
                type="number"
                min="1"
                placeholder="1000"
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
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
              >
              <p class="mt-1 text-xs text-gray-500">
                Nombre de jours nécessaires pour la production
              </p>
            </div>

            <!-- Description -->
            <div class="lg:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                v-model="form.description"
                rows="4"
                placeholder="Description détaillée du produit..."
                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <!-- Product Options -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-6">
            Options et personnalisation
          </h2>

          <!-- Customizable -->
          <div class="mb-6">
            <label class="flex items-center">
              <input
                v-model="form.customizable"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              >
              <span class="ml-2 text-sm text-gray-700">Produit personnalisable</span>
            </label>
            <p class="mt-1 text-xs text-gray-500">
              Permet au client de personnaliser ce produit
            </p>
          </div>

          <!-- Materials -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Matériaux</label>
            <input
              v-model="form.materials"
              type="text"
              placeholder="Ex: Coton 100%, Polyester..."
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
          </div>

          <!-- Colors -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Couleurs disponibles</label>
            <div class="flex items-center space-x-2 mb-2">
              <input
                v-model="newColor"
                type="text"
                placeholder="Ajouter une couleur..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                @keydown.enter.prevent="addColor"
              >
              <button
                type="button"
                class="px-3 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
                @click="addColor"
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
                  type="button"
                  class="ml-1 text-blue-600 hover:text-blue-800"
                  @click="removeColor(index)"
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
                type="text"
                placeholder="Ajouter une taille..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                @keydown.enter.prevent="addSize"
              >
              <button
                type="button"
                class="px-3 py-2 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700"
                @click="addSize"
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
                  type="button"
                  class="ml-1 text-green-600 hover:text-green-800"
                  @click="removeSize(index)"
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
            />
          </div>
        </div>

        <!-- Images - Nouveau composant unifié -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-6">
            Images du produit
          </h2>

          <!-- ProductMediaManager avec v-model -->
          <AdminProductMediaManager
            v-model="mediaItems"
            :max-items="10"
            folder="ns2po-election/products"
            :disabled="isSubmitting"
          />
        </div>
      </div>

      <!-- Right Column: Preview & Settings -->
      <div class="space-y-6">
        <!-- Product Preview -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Aperçu du produit
          </h3>

          <div class="space-y-4">
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-3">
                <img
                  v-if="form.image_url"
                  :src="form.image_url"
                  :alt="form.name"
                  class="w-16 h-16 rounded-lg object-cover"
                >
                <div
                  v-else
                  class="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center"
                >
                  <Icon name="heroicons:photo" class="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">
                    {{ form.name || 'Nom du produit' }}
                  </h4>
                  <p class="text-sm text-gray-500">
                    {{ form.category || 'Catégorie' }}
                  </p>
                  <p class="text-lg font-bold text-amber-600">
                    {{ formatPrice(form.base_price) }}
                  </p>
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
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Paramètres
          </h3>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Produit actif</span>
              <input
                v-model="form.is_active"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              >
            </div>

            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Personnalisable</span>
              <span class="text-sm font-medium" :class="form.customizable ? 'text-green-600' : 'text-gray-400'">
                {{ form.customizable ? 'Oui' : 'Non' }}
              </span>
            </div>

            <div class="border-t pt-4">
              <div class="text-sm text-gray-600 mb-2">
                Couleurs disponibles
              </div>
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
              <div class="text-sm text-gray-600 mb-2">
                Tailles disponibles
              </div>
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
              :disabled="isSubmitting || !isFormValid"
              class="w-full px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              @click="handleSubmit"
            >
              <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
              {{ isNew ? 'Créer le produit' : 'Sauvegarder' }}
            </button>

            <button
              :disabled="isSubmitting"
              class="w-full px-4 py-2 border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 disabled:opacity-50"
              @click="saveDraft"
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
// Imports explicites (doivent être en haut)
import { useQueryClient } from '@tanstack/vue-query'
import { productQueryKeys } from '~/composables/useProductsQuery'
import type { ProductMedia } from '~/types/media'
import { legacyToProductMedia, productMediaToLegacy } from '~/types/media'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Route params - DOIT être défini AVANT useAsyncData
const route = useRoute()
const router = useRouter()
const productId = computed(() => (route.params.id as string) || 'new')
const isNew = computed(() => {
  const id = productId.value
  return !id || id === 'new'
})

// Loading state GLOBAL - Solution ROOT CAUSE FINALE identifiée par Gemini
// useAsyncData bloque le rendu AVANT que la page ne s'affiche avec données vides
// Résout le problème : onMounted() permet rendu PUIS fetch → spinner invisible
const { startLoading, stopLoading } = useGlobalLoading()

// Head
useHead({
  title: computed(() => isNew.value ? 'Nouveau Produit | Admin' : 'Modifier Produit | Admin')
})

// ========================================================================
// SOLUTION GEMINI ROOT CAUSE: useAsyncData au lieu de onMounted()
// ========================================================================
// useAsyncData s'exécute AVANT le rendu de la page (bloque le rendu)
// Résout le problème: onMounted s'exécute APRÈS le rendu avec données vides
// Spinner est visible car la page attend les données avant de s'afficher
// ========================================================================

const { data: productData, pending, error: fetchError } = await useAsyncData(
  `product-${productId.value}`,
  async () => {
    // Ne charger que si ce n'est pas un nouveau produit
    if (isNew.value) return null

    const startTime = Date.now()
    console.log(`🔄 [useAsyncData] Fetching product ${productId.value} from ADMIN API`)

    try {
      const response = await $fetch(`/api/admin/products/${productId.value}`)

      // Garantir 3 secondes minimum de spinner (même si Railway cache < 100ms)
      const elapsed = Date.now() - startTime
      const remaining = 3000 - elapsed

      if (remaining > 0) {
        console.log(`⏱️ [useAsyncData] Délai artificiel: ${remaining}ms pour atteindre 3s minimum`)
        await new Promise(resolve => setTimeout(resolve, remaining))
      }

      console.log(`✅ [useAsyncData] Produit chargé en ${Date.now() - startTime}ms`)
      return response.data
    } catch (e) {
      console.error('❌ [useAsyncData] Error fetching product:', e)
      throw e // Propage l'erreur pour que error.value soit défini
    }
  },
  {
    // Options useAsyncData
    server: true, // SSR enabled (défaut)
    lazy: false,  // Bloque le rendu jusqu'à ce que les données arrivent
    immediate: true // Exécute immédiatement
  }
)

// Gérer le spinner global basé sur l'état `pending` de useAsyncData
watch(pending, (isPending) => {
  if (isPending) {
    console.log('🔄 [watch(pending)] Spinner activé - Chargement en cours...')
    startLoading(`Chargement du produit ${productId.value}...`)
  } else {
    console.log('✅ [watch(pending)] Spinner désactivé - Chargement terminé')
    // Petit délai pour fluidité visuelle (comme dans plugin navigation)
    setTimeout(() => stopLoading(), 300)
  }
}, { immediate: true })

// 🚨 PATCH URGENCE GPT-5: Contourner useProducts cassé (storeToRefs exclut méthodes)
// Railway n'a pas rebuild avec commits b2121bd + 5ca5232
// Solution temporaire: $fetch direct + TanStack Query invalidation
const queryClient = useQueryClient()

// Notifications - DOIT être déclaré avant son utilisation
// Auto-imported via Nuxt 3: globalNotifications
const { crudSuccess, crudError } = globalNotifications

// Gérer les erreurs de chargement
if (fetchError.value) {
  console.error('❌ [useAsyncData] Failed to load product:', fetchError.value)
  crudError.loaded('product', `Erreur lors du chargement du produit "${productId.value}"`)
  await router.push('/admin/products')
}

// Reactive data
const isSubmitting = ref(false)
const newColor = ref('')
const newSize = ref('')

// Media items (remplace image_url + gallery_urls)
const mediaItems = ref<ProductMedia[]>([])

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

// Mapper les données productData vers le formulaire quand elles changent
watch(productData, (newData) => {
  if (newData) {
    console.log('📝 [watch(productData)] Mapping données vers formulaire')
    mapProductToForm(newData)
  }
}, { immediate: true }) // immediate pour initialiser dès que les données arrivent

// Synchroniser mediaItems → form.image_url + form.gallery_urls (pour API)
watch(mediaItems, (newItems) => {
  const legacy = productMediaToLegacy(newItems)
  form.image_url = legacy.imageUrl
  form.gallery_urls = legacy.galleryUrls
}, { deep: true })

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
  // Validation basique pour le bouton (création + édition)
  const hasBasicFields = form.name.trim() !== '' &&
         form.category !== '' &&
         form.base_price > 0

  // Pour la création, on vérifie aussi les champs requis par l'API
  if (isNew.value) {
    const hasMaterials = form.materials.trim() !== ''
    const hasColors = form.colors.length > 0
    const hasSizes = form.sizes.length > 0
    return hasBasicFields && hasMaterials && hasColors && hasSizes
  }

  return hasBasicFields
})

// Methods
// ❌ SUPPRIMÉ: fetchProduct() - Remplacé par useAsyncData (Solution Gemini)
// L'ancienne approche onMounted() + fetchProduct() permettait au rendu de se faire avec données vides
// AVANT que les données n'arrivent, rendant le spinner invisible
// useAsyncData bloque le rendu jusqu'à ce que les données soient chargées

function mapProductToForm(data: any) {
  // Map response to form - corriger le mapping des champs API vers form
  const mappedPrice = data.basePrice || data.base_price || data.price || 0

  // 🔍 DEBUG: Logger les valeurs de prix reçues
  console.log('🔍 [mapProductToForm] Prix reçu depuis API:', {
    basePrice: data.basePrice,
    base_price: data.base_price,
    price: data.price,
    mappedPrice
  })

  // Mapper les images legacy vers ProductMedia[]
  const imageUrl = data.image || data.image_url || ''
  const galleryUrls = data.galleryUrls || data.gallery_urls || []
  mediaItems.value = legacyToProductMedia(imageUrl, galleryUrls)

  Object.assign(form, {
    name: data.name,
    description: data.description || '',
    category: data.categoryDetails?.name || data.category,
    subcategory: data.subcategory || '',
    base_price: mappedPrice, // API: basePrice → form: base_price
    min_quantity: data.minQuantity || data.min_quantity, // API: minQuantity → form: min_quantity
    max_quantity: data.maxQuantity || data.max_quantity, // API: maxQuantity → form: max_quantity
    unit: data.unit || 'pièce',
    production_time_days: data.productionTimeDays || data.production_time_days || 7, // API: productionTimeDays → form: production_time_days
    customizable: data.customizable || false,
    materials: data.materials || '',
    colors: data.colors || [],
    sizes: data.sizes || [],
    image_url: imageUrl, // Conservé pour rétrocompatibilité API
    gallery_urls: galleryUrls, // Conservé pour rétrocompatibilité API
    specifications: data.specifications || '',
    is_active: data.isActive ?? data.is_active ?? true // API: isActive → form: is_active
  })

  console.log('✅ [mapProductToForm] Formulaire après mapping - base_price:', form.base_price)
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

// Les anciennes fonctions addGalleryImage, removeGalleryImage, uploadMainImage
// ont été remplacées par le composant ProductMediaManager

function validateForm(): boolean {
  errors.name = form.name.trim() === '' ? 'Le nom est requis' : ''
  errors.category = form.category === '' ? 'La catégorie est requise' : ''
  errors.base_price = form.base_price <= 0 ? 'Le prix doit être supérieur à 0' : ''

  // Validation supplémentaire pour la création (champs requis par API)
  if (isNew.value) {
    if (form.materials.trim() === '') {
      errors.name = 'Au moins un matériau est requis (ex: Coton, Polyester)'
      return false
    }
    if (form.colors.length === 0) {
      errors.name = 'Au moins une couleur est requise'
      return false
    }
    if (form.sizes.length === 0) {
      errors.name = 'Au moins une taille est requise'
      return false
    }
  }

  return Object.values(errors).every(error => error === '')
}

async function handleSubmit() {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    // 🔧 FIX: Utiliser toRaw() pour éviter erreurs sérialisation reactive() → 502
    const rawForm = toRaw(form)

    // ✅ FIX COMPLET: Transformer form → format API
    // Frontend snake_case → API camelCase
    // Frontend types simples → API types complexes
    const productData = {
      // Champs texte (direct)
      name: rawForm.name,
      description: rawForm.description || undefined,
      category: rawForm.category,
      subcategory: rawForm.subcategory || undefined,

      // Champs numériques (snake_case → camelCase)
      basePrice: rawForm.base_price,
      minQuantity: rawForm.min_quantity,
      maxQuantity: rawForm.max_quantity || undefined,

      // Booléen (snake_case → camelCase)
      isActive: rawForm.is_active,

      // Image principale (image_url → image)
      image: rawForm.image_url || undefined,

      // Gallery (string[] → object[])
      gallery: rawForm.gallery_urls?.length
        ? rawForm.gallery_urls.map((url: string) => ({ url, type: 'variant' as const }))
        : undefined,

      // Materials (string → array, split par virgule/newline)
      materials: rawForm.materials
        ? rawForm.materials.split(/[,\n]+/).map((m: string) => m.trim()).filter(Boolean)
        : [],

      // Colors (string[] → object[] avec {name})
      colors: rawForm.colors?.length
        ? rawForm.colors.map((c: string) => ({ name: c }))
        : [],

      // Sizes (string[] → object[] avec {name})
      sizes: rawForm.sizes?.length
        ? rawForm.sizes.map((s: string) => ({ name: s }))
        : []
    }

    console.log('📤 [handleSubmit] Payload transformé pour API:', productData)

    if (isNew.value) {
      // 🚨 PATCH GPT-5: Création directe via $fetch
      const response = await $fetch('/api/admin/products', {
        method: 'POST',
        body: productData
      }) as { success: boolean; data: any }

      if (response.success && response.data) {
        // ✅ Clean Architecture: Invalidation centralisée via composable
        const { invalidateProductsList } = useDataInvalidator()
        await invalidateProductsList()

        crudSuccess.created(`Produit "${response.data.name}" créé avec succès`, 'product')
        await router.push('/admin/products')
      }
    } else {
      // 🚨 PATCH GPT-5: Update direct via $fetch + invalidation TanStack Query
      const response = await $fetch(`/api/admin/products/${productId.value}`, {
        method: 'PUT',
        body: productData
      }) as { success: boolean; data: any }

      if (response.success && response.data) {
        // ✅ Clean Architecture: Invalidation centralisée via composable
        const { invalidateProductsList } = useDataInvalidator()
        await invalidateProductsList()

        // Rafraîchir form local
        mapProductToForm(response.data)

        crudSuccess.updated(`Produit "${response.data.name}" mis à jour`)
      }
    }

  } catch (error) {
    console.error('Error saving product:', error)
    if (isNew.value) {
      crudError.created('product', `Erreur lors de la création du produit "${form.name}"`)
    } else {
      crudError.updated(`Erreur lors de la mise à jour du produit "${form.name}"`)
    }
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
    // 🚨 PATCH GPT-5: Delete direct via $fetch
    const response = await $fetch(`/api/admin/products/${productId.value}`, {
      method: 'DELETE'
    }) as { success: boolean }

    if (response.success) {
      // ✅ Clean Architecture: Invalidation centralisée via composable
      const { invalidateProductsList } = useDataInvalidator()
      await invalidateProductsList()

      crudSuccess.deleted(`Produit "${form.name}" supprimé avec succès`, 'product')
      await router.push('/admin/products')
    }
  } catch (error: any) {
    console.error('Error deleting product:', error)
    if (error.statusCode === 409) {
      crudError.deleted('product', 'Impossible de supprimer ce produit car il est utilisé dans des bundles.')
    } else {
      crudError.deleted('product', `Erreur lors de la suppression du produit "${form.name}"`)
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
// ℹ️ onMounted() simplifié: fetchProduct() remplacé par useAsyncData (Solution Gemini)
// useAsyncData charge les données AVANT le rendu, plus besoin de onMounted()
onMounted(async () => {
  // Charge seulement les catégories (non critique pour le spinner)
  await fetchCategories()
  console.log('✅ [onMounted] Catégories chargées')
})
</script>