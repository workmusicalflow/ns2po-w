<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <NuxtLink
          to="/admin/bundles"
          class="flex items-center text-gray-500 hover:text-gray-700"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5 mr-1" />
          Retour
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isNew ? 'Nouveau Bundle' : 'Modifier le Bundle' }}
          </h1>
          <p class="text-gray-600">
            {{ isNew ? 'Créez un nouveau pack de campagne' : `Modification de ${form.name || 'ce bundle'}` }}
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
          <!-- Bundle Name -->
          <AdminFormField
            id="name"
            type="text"
            label="Nom du bundle"
            placeholder="Ex: Pack Campagne Municipale"
            v-model="form.name"
            :error="errors.name"
            required
          />

          <!-- Target Audience -->
          <AdminFormField
            id="targetAudience"
            type="select"
            label="Audience Cible"
            v-model="form.targetAudience"
            :options="audienceOptions"
            :error="errors.targetAudience"
            required
          />

          <!-- Budget Range -->
          <AdminFormField
            id="budgetRange"
            type="select"
            label="Gamme de Budget"
            v-model="form.budgetRange"
            :options="budgetOptions"
            :error="errors.budgetRange"
            required
          />

          <!-- Popularity Score -->
          <AdminFormField
            id="popularity"
            type="number"
            label="Score de Popularité"
            placeholder="0-10"
            v-model="form.popularity"
            :error="errors.popularity"
            help-text="Score de 0 à 10 pour le classement"
          />

          <!-- Estimated Total -->
          <AdminFormField
            id="estimatedTotal"
            type="number"
            label="Prix Total Estimé (XOF)"
            placeholder="0"
            v-model="form.estimatedTotal"
            :error="errors.estimatedTotal"
            help-text="Prix total du bundle"
            required
          />

          <!-- Original Total -->
          <AdminFormField
            id="originalTotal"
            type="number"
            label="Prix Original (XOF)"
            placeholder="0"
            v-model="form.originalTotal"
            :error="errors.originalTotal"
            help-text="Prix avant remise (optionnel)"
          />
        </div>

        <!-- Description -->
        <div class="mt-6">
          <AdminFormField
            id="description"
            type="textarea"
            label="Description"
            placeholder="Décrivez ce pack de campagne..."
            v-model="form.description"
            :rows="4"
            :error="errors.description"
            required
          />
        </div>

        <!-- Toggles -->
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label class="flex items-center">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              />
              <span class="ml-2 text-sm text-gray-700">Bundle actif</span>
            </label>
          </div>
          <div>
            <label class="flex items-center">
              <input
                v-model="form.isFeatured"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              />
              <span class="ml-2 text-sm text-gray-700">Bundle vedette</span>
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tags (séparés par des virgules)
          </label>
          <input
            v-model="tagsInput"
            type="text"
            placeholder="municipale, affichage, flyers"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <p class="mt-1 text-xs text-gray-500">
            Utilisez des virgules pour séparer les tags
          </p>
        </div>
      </div>

      <!-- Product Selection -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-medium text-gray-900">Produits du Bundle</h2>
          <button
            type="button"
            @click="showProductSelector = true"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
            Ajouter Produit
          </button>
        </div>

        <!-- Products List -->
        <div v-if="selectedProducts.length > 0" class="space-y-4">
          <div
            v-for="(product, index) in selectedProducts"
            :key="product.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="w-12 h-12 rounded-lg object-cover"
              />
              <div
                v-else
                class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"
              >
                <Icon name="heroicons:cube" class="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900">{{ product.name }}</h3>
                <p class="text-sm" :class="product.price && product.price > 0 ? 'text-gray-500' : 'text-red-500'">
                  {{ product.price && product.price > 0 ? formatPrice(product.price) : 'Prix non défini' }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex items-center space-x-2">
                <label class="text-sm text-gray-700">Quantité:</label>
                <input
                  v-model.number="product.quantity"
                  type="number"
                  min="1"
                  class="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  @input="updateProductTotal(index)"
                />
              </div>
              <div class="text-sm font-medium text-gray-900">
                {{ formatPrice(product.subtotal) }}
              </div>
              <button
                type="button"
                @click="removeProduct(index)"
                class="text-red-600 hover:text-red-700"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Icon name="heroicons:cube" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun produit sélectionné</p>
          <p class="text-sm">Cliquez sur "Ajouter Produit" pour commencer</p>
        </div>

        <!-- Bundle Total -->
        <div v-if="selectedProducts.length > 0" class="mt-6 pt-6 border-t border-gray-200">
          <div class="flex justify-between items-center">
            <span class="text-lg font-medium text-gray-900">Total des Produits:</span>
            <span class="text-lg font-bold text-gray-900">{{ formatPrice(calculatedTotal) }}</span>
          </div>
          <div v-if="form.originalTotal && form.originalTotal > calculatedTotal" class="flex justify-between items-center mt-2">
            <span class="text-sm text-gray-600">Économies:</span>
            <span class="text-sm font-medium text-green-600">{{ formatPrice(form.originalTotal - calculatedTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-200">
        <div class="flex items-center space-x-4">
          <NuxtLink
            to="/admin/bundles"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Annuler
          </NuxtLink>

          <button
            v-if="!isNew"
            type="button"
            @click="duplicateBundle"
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Dupliquer
          </button>
        </div>

        <div class="flex items-center space-x-4">
          <button
            v-if="!isNew"
            type="button"
            @click="deleteBundle"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Supprimer
          </button>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            {{ isNew ? 'Créer le bundle' : 'Sauvegarder' }}
          </button>
        </div>
      </div>
    </form>

    <!-- Product Selector Modal -->
    <AdminModal
      :show="showProductSelector"
      @close="showProductSelector = false"
      title="Sélectionner des Produits"
      size="xl"
    >
      <div class="space-y-4">
        <!-- Search -->
        <div class="relative">
          <input
            v-model="productSearch"
            type="text"
            placeholder="Rechercher des produits..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <div
            v-for="product in filteredAvailableProducts"
            :key="product.id"
            :class="[
              'border border-gray-200 rounded-lg p-4',
              product.price && product.price > 0
                ? 'hover:bg-gray-50 cursor-pointer'
                : 'bg-gray-50 cursor-not-allowed opacity-60'
            ]"
            @click="product.price && product.price > 0 ? addProduct(product) : null"
          >
            <div class="flex items-center space-x-3">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="w-10 h-10 rounded object-cover"
              />
              <div
                v-else
                class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center"
              >
                <Icon name="heroicons:cube" class="w-5 h-5 text-gray-400" />
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-medium text-gray-900">{{ product.name }}</h3>
                <p class="text-sm" :class="product.price && product.price > 0 ? 'text-gray-500' : 'text-red-500'">
                  {{ product.price && product.price > 0 ? formatPrice(product.price) : 'Prix non défini' }}
                </p>
              </div>
              <button
                class="text-amber-600 hover:text-amber-700"
              >
                <Icon name="heroicons:plus" class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredAvailableProducts.length === 0" class="text-center py-8 text-gray-500">
          <Icon name="heroicons:cube" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun produit trouvé</p>
        </div>
      </div>
    </AdminModal>
  </div>
</template>

<script setup lang="ts">
/**
 * Admin Bundle Edit/Create Page - SOLID Architecture
 * Uses VueQuery + Pinia for optimal state management and caching
 * Synchronized with Product store for cross-interface consistency
 */

// SOLID Architecture imports
import { useBundleQuery, useCreateBundleMutation, useUpdateBundleMutation, useDeleteBundleMutation } from '../../../composables/useBundlesQuery'
import { useProductsQuery } from '../../../composables/useProductsQuery'
import { useBundleCalculations } from '../../../composables/useBundleCalculations'
import { globalNotifications } from '../../../composables/useNotifications'
import { useBundleStore } from '../../../stores/useBundleStore'
import { initializeGlobalEventBus, useGlobalEventBus } from '../../../stores/useGlobalEventBus'
import { refDebounced } from '@vueuse/core'
import type { Bundle, BundleProduct, BundleAggregate } from '../../../types/domain/Bundle'
import type { Product } from '../../../types/domain/Product'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Route params
const route = useRoute()
const router = useRouter()
const bundleId = computed(() => route.params.id as string)
const isNew = computed(() => bundleId.value === 'new')

// Head
useHead({
  title: computed(() => isNew.value ? 'Nouveau Bundle | Admin' : 'Modifier Bundle | Admin')
})

// Initialize global event bus for store synchronization
initializeGlobalEventBus()

// Global notifications (auto-imported via Nuxt 3)
const { crudSuccess, crudError } = globalNotifications

// ===== REACTIVE STATE =====
const showProductSelector = ref(false)
const productSearch = ref('')
const tagsInput = ref('')
const debouncedProductSearch = refDebounced(productSearch, 300)

// Form data
const form = reactive({
  name: '',
  description: '',
  targetAudience: 'local',
  budgetRange: 'starter',
  estimatedTotal: 0,
  originalTotal: 0,
  popularity: 5,
  isActive: true,
  isFeatured: false
})

// Form errors
const errors = reactive<Record<string, string>>({
  name: '',
  description: '',
  targetAudience: '',
  budgetRange: '',
  estimatedTotal: '',
  originalTotal: '',
  popularity: ''
})

// Bundle calculations composable - centralized logic
const selectedProducts = ref<BundleProduct[]>([])
const bundleCalculations = useBundleCalculations(selectedProducts)

// Options
const audienceOptions = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Régional' },
  { value: 'national', label: 'National' },
  { value: 'universal', label: 'Universel' }
]

const budgetOptions = [
  { value: 'starter', label: 'Starter (0-10k XOF)' },
  { value: 'medium', label: 'Medium (10k-50k XOF)' },
  { value: 'premium', label: 'Premium (50k-200k XOF)' },
  { value: 'enterprise', label: 'Enterprise (200k+ XOF)' }
]

// ===== VUE QUERY INTEGRATION =====
// Bundle query (for editing existing bundles)
const {
  data: bundleData,
  isLoading: bundleLoading,
  refetch: refetchBundle
} = useBundleQuery(bundleId, false, {
  enabled: computed(() => !isNew.value && !!bundleId.value)
})

// Products query for selection
const {
  data: availableProducts,
  isLoading: productsLoading
} = useProductsQuery()

// Bundle mutations
const createBundleMutation = useCreateBundleMutation({
  onSuccess: (bundle) => {
    crudSuccess.created(bundle.name, 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError.created('bundle', error.message)
  }
})

const updateBundleMutation = useUpdateBundleMutation({
  onSuccess: (bundle) => {
    crudSuccess.updated(bundle.name, 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError.updated('bundle', error.message)
  }
})

const deleteBundleMutation = useDeleteBundleMutation({
  onSuccess: () => {
    crudSuccess.deleted('Bundle', 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError.deleted('bundle', error.message)
  }
})

// ===== PINIA STORE INTEGRATION =====
const bundleStore = useBundleStore()

// ===== COMPUTED PROPERTIES =====
// Use centralized calculations from composable
const calculatedTotal = bundleCalculations.estimatedTotal

const filteredAvailableProducts = computed(() => {
  if (!availableProducts.value) return []

  let products = availableProducts.value.filter(product =>
    !selectedProducts.value.find(selected => selected.id === product.id)
  )

  if (debouncedProductSearch.value) {
    const search = debouncedProductSearch.value.toLowerCase()
    products = products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      product.reference?.toLowerCase().includes(search)
    )
  }

  return products
})

const isSubmitting = computed(() =>
  createBundleMutation.isPending.value || updateBundleMutation.isPending.value
)

// Removed unused computed properties for cleaner code

// ===== METHODS =====
function initializeFormFromBundle(bundle: Bundle | BundleAggregate) {
  // Copy form fields directly
  Object.assign(form, {
    name: bundle.name,
    description: bundle.description,
    targetAudience: bundle.targetAudience,
    budgetRange: bundle.budgetRange,
    estimatedTotal: bundle.estimatedTotal,
    originalTotal: bundle.originalTotal,
    popularity: bundle.popularity,
    isActive: bundle.isActive,
    isFeatured: bundle.isFeatured
  })

  // Use centralized bundle calculations for products (only if BundleAggregate)
  if ('products' in bundle && bundle.products && bundle.products.length > 0) {
    bundleCalculations.updateProducts(bundle.products)
  }

  // Set tags
  tagsInput.value = bundle.tags?.join(', ') || ''
}

function addProduct(product: Product) {
  // Use centralized bundle calculations
  bundleCalculations.addProduct({
    productId: product.id,
    name: product.name,
    basePrice: product.price || 0,
    quantity: 1,
    subtotal: (product.price || 0) * 1
  })

  // Show success notification
  crudSuccess.created(product.name, 'produit ajouté au bundle')
}

function removeProduct(index: number) {
  const product = selectedProducts.value[index]
  const productName = product.name

  // Use centralized bundle calculations
  bundleCalculations.removeProduct(product.id)

  // Show success notification
  crudSuccess.deleted(productName, 'produit retiré du bundle')
}

function updateProductTotal(index: number) {
  const product = selectedProducts.value[index]
  const validQuantity = product.quantity && !isNaN(product.quantity) ? product.quantity : 1

  // Use centralized bundle calculations
  bundleCalculations.updateProductQuantity(product.id, validQuantity)

  // Show info notification for quantity/price updates
  const { info } = globalNotifications
  info('Produit mis à jour', `${product.name} - Quantité: ${validQuantity}`)
}

// Removed: updateCalculatedTotal() - now handled reactively by bundleCalculations composable

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

  if (!form.description.trim()) {
    errors.description = 'La description est requise'
    isValid = false
  }

  if (!form.targetAudience) {
    errors.targetAudience = 'L\'audience cible est requise'
    isValid = false
  }

  if (!form.budgetRange) {
    errors.budgetRange = 'La gamme de budget est requise'
    isValid = false
  }

  if (form.estimatedTotal <= 0) {
    errors.estimatedTotal = 'Le prix total doit être supérieur à 0'
    isValid = false
  }

  if (form.popularity < 0 || form.popularity > 10) {
    errors.popularity = 'La popularité doit être entre 0 et 10'
    isValid = false
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) return

  // Prepare bundle data
  const bundleData = {
    ...form,
    products: selectedProducts.value.map(p => ({
      id: p.id,
      name: p.name,
      basePrice: p.basePrice,
      quantity: p.quantity,
      subtotal: p.subtotal
    })),
    tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean),
    savings: form.originalTotal && form.originalTotal > form.estimatedTotal
      ? form.originalTotal - form.estimatedTotal
      : 0
  }

  if (isNew.value) {
    createBundleMutation.mutate(bundleData)
  } else {
    updateBundleMutation.mutate({
      id: bundleId.value,
      updates: bundleData
    })
  }
}

function duplicateBundle() {
  router.push({
    path: '/admin/bundles/new',
    query: { duplicate: bundleId.value }
  })
}

async function deleteBundle() {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le bundle "${form.name}" ?`)) return

  deleteBundleMutation.mutate(bundleId.value)
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

// ===== LIFECYCLE & WATCHERS =====
// Initialize form when bundle data is loaded
watchEffect(() => {
  if (bundleData.value && !isNew.value) {
    initializeFormFromBundle(bundleData.value)
  }
})

// Watch calculated total to update form - using centralized calculations
watch(() => bundleCalculations.estimatedTotal.value, (newTotal) => {
  if (selectedProducts.value.length > 0) {
    form.estimatedTotal = newTotal
  }
})

// Sync with Pinia stores for cross-component state sharing
watchEffect(() => {
  if (bundleData.value) {
    bundleStore.setSelectedBundle(bundleData.value)
  }
})

// Handle real-time updates from other interfaces
onMounted(() => {
  const eventBus = useGlobalEventBus()

  eventBus.on('product.updated', (productId: string, updatedProduct: any) => {
    // Update selected products if they reference the updated product
    selectedProducts.value.forEach(bundleProduct => {
      if (bundleProduct.id === productId) {
        bundleProduct.name = updatedProduct.name
        bundleProduct.basePrice = updatedProduct.basePrice || updatedProduct.price
        bundleProduct.subtotal = bundleProduct.quantity * bundleProduct.basePrice
      }
    })
  })

  eventBus.on('product.deleted', (productId: string) => {
    // Remove deleted product from selected products
    const index = selectedProducts.value.findIndex(p => p.id === productId)
    if (index !== -1) {
      selectedProducts.value.splice(index, 1)
    }
  })

  eventBus.on('bundle.updated', () => {
    if (!isNew.value) {
      refetchBundle()
    }
  })
})
</script>