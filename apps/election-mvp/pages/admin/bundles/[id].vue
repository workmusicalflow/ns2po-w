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
    <form class="space-y-8" @submit.prevent="handleSubmit">
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-6">
          Informations générales
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Bundle Name -->
          <AdminFormField
            id="name"
            v-model="form.name"
            type="text"
            label="Nom du bundle"
            placeholder="Ex: Pack Campagne Municipale"
            :error="errors.name"
            required
          />

          <!-- Target Audience -->
          <AdminFormField
            id="targetAudience"
            v-model="form.targetAudience"
            type="select"
            label="Audience Cible"
            :options="audienceOptions"
            :error="errors.targetAudience"
            required
          />

          <!-- Budget Range -->
          <AdminFormField
            id="budgetRange"
            v-model="form.budgetRange"
            type="select"
            label="Gamme de Budget"
            :options="budgetOptions"
            :error="errors.budgetRange"
            required
          />

          <!-- Popularity Score -->
          <AdminFormField
            id="popularity"
            v-model="form.popularity"
            type="number"
            label="Score de Popularité"
            placeholder="0-10"
            :error="errors.popularity"
            help-text="Score de 0 à 10 pour le classement"
          />

          <!-- Estimated Total -->
          <AdminFormField
            id="estimatedTotal"
            v-model="form.estimatedTotal"
            type="number"
            label="Prix Total Estimé (XOF)"
            placeholder="0"
            :error="errors.estimatedTotal"
            help-text="Prix total du bundle"
            required
          />

          <!-- Original Total -->
          <AdminFormField
            id="originalTotal"
            v-model="form.originalTotal"
            type="number"
            label="Prix Original (XOF)"
            placeholder="0"
            :error="errors.originalTotal"
            help-text="Prix avant remise (optionnel)"
          />
        </div>

        <!-- Description -->
        <div class="mt-6">
          <AdminFormField
            id="description"
            v-model="form.description"
            type="textarea"
            label="Description"
            placeholder="Décrivez ce pack de campagne..."
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
              >
              <span class="ml-2 text-sm text-gray-700">Bundle actif</span>
            </label>
          </div>
          <div>
            <label class="flex items-center">
              <input
                v-model="form.isFeatured"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              >
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
          >
          <p class="mt-1 text-xs text-gray-500">
            Utilisez des virgules pour séparer les tags
          </p>
        </div>
      </div>

      <!-- Product Selection -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-medium text-gray-900">
            Produits du Bundle
          </h2>
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            @click="showProductSelector = true"
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
              >
              <div
                v-else
                class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"
              >
                <Icon name="heroicons:cube" class="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900">
                  {{ product.name }}
                </h3>
                <p class="text-sm" :class="product.basePrice && product.basePrice > 0 ? 'text-gray-500' : 'text-red-500'">
                  {{ product.basePrice && product.basePrice > 0 ? formatPrice(product.basePrice) : 'Prix non défini' }}
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
                >
              </div>
              <div class="text-sm font-medium text-gray-900">
                {{ formatPrice(product.subtotal) }}
              </div>
              <button
                type="button"
                class="text-red-600 hover:text-red-700"
                @click="removeProduct(index)"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Icon name="heroicons:cube" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun produit sélectionné</p>
          <p class="text-sm">
            Cliquez sur "Ajouter Produit" pour commencer
          </p>
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

          <!-- Bouton de synchronisation manuelle avec feedback UX avancé -->
          <button
            v-if="!isNew"
            type="button"
            :disabled="isSyncing"
            :class="[
              'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200',
              isSyncing
                ? 'text-amber-700 bg-amber-50 border border-amber-200 cursor-not-allowed'
                : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 focus:ring-green-500'
            ]"
            @click="manualSync"
          >
            <Icon
              name="heroicons:arrow-path"
              :class="['w-4 h-4 mr-2', isSyncing ? 'animate-spin' : '']"
            />
            {{ isSyncing ? 'Synchronisation...' : 'Synchroniser' }}
          </button>

          <button
            v-if="!isNew"
            type="button"
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="duplicateBundle"
          >
            Dupliquer
          </button>
        </div>

        <div class="flex items-center space-x-4">
          <button
            v-if="!isNew"
            type="button"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click="deleteBundle"
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
      title="Sélectionner des Produits"
      size="xl"
      @close="showProductSelector = false"
    >
      <div class="space-y-4">
        <!-- Search -->
        <div class="relative">
          <input
            v-model="productSearch"
            type="text"
            placeholder="Rechercher des produits..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <div
            v-for="product in filteredAvailableProducts"
            :key="product.id"
            :class="[
              'border border-gray-200 rounded-lg p-4',
              product.basePrice && product.basePrice > 0
                ? 'hover:bg-gray-50 cursor-pointer'
                : 'bg-gray-50 cursor-not-allowed opacity-60'
            ]"
            @click="product.basePrice && product.basePrice > 0 ? addProduct(product) : null"
          >
            <div class="flex items-center space-x-3">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="w-10 h-10 rounded object-cover"
              >
              <div
                v-else
                class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center"
              >
                <Icon name="heroicons:cube" class="w-5 h-5 text-gray-400" />
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-medium text-gray-900">
                  {{ product.name }}
                </h3>
                <p class="text-sm" :class="product.basePrice && product.basePrice > 0 ? 'text-gray-500' : 'text-red-500'">
                  {{ product.basePrice && product.basePrice > 0 ? formatPrice(product.basePrice) : 'Prix non défini' }}
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
import { useProductReferenceValidation, useBundleProductsValidation, useProductSelectorValidation } from '../../../composables/useProductReferenceValidation'
import { globalNotifications } from '../../../composables/useNotifications'
import { useBundleStore } from '../../../stores/useBundleStore'
import { initializeGlobalEventBus, useGlobalEventBus } from '../../../stores/useGlobalEventBus'
import { refDebounced } from '@vueuse/core'
import type { Bundle, BundleProduct, BundleAggregate, BundleTargetAudience, BundleBudgetRange } from '../../../types/domain/Bundle'
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

// Initialize global event bus and notifications ONLY on client
let crudSuccess: typeof globalNotifications.crudSuccess | undefined
let crudError: typeof globalNotifications.crudError | undefined
let info: typeof globalNotifications.info | undefined
let warn: typeof globalNotifications.warn | undefined

// Client-only initialization
if (import.meta.client) {
  initializeGlobalEventBus()
  const notifications = globalNotifications
  crudSuccess = notifications.crudSuccess
  crudError = notifications.crudError
  info = notifications.info
  warn = notifications.warn
}

// ===== REACTIVE STATE =====
const showProductSelector = ref(false)
const productSearch = ref('')
const tagsInput = ref('')
const isSyncing = ref(false) // État pour la synchronisation manuelle
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
} = useBundleQuery(bundleId, true)

// Products query for selection
const {
  data: availableProducts,
  isLoading: productsLoading
} = useProductsQuery()

// 🔒 PRODUCT REFERENCE VALIDATION
// Bundle products validation for referential integrity
const bundleValidation = useBundleProductsValidation(bundleId, selectedProducts)

// Product selector validation for safe additions
const productSelectorValidation = useProductSelectorValidation(
  computed(() => availableProducts.value || []),
  selectedProducts
)

// Bundle mutations
const createBundleMutation = useCreateBundleMutation({
  onSuccess: (bundle) => {
    crudSuccess?.created(bundle.name, 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError?.created('bundle', error.message)
  }
})

const updateBundleMutation = useUpdateBundleMutation({
  onSuccess: (bundle) => {
    crudSuccess?.updated(bundle.name, 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError?.updated('bundle', error.message)
  }
})

const deleteBundleMutation = useDeleteBundleMutation({
  onSuccess: () => {
    crudSuccess?.deleted('Bundle', 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError?.deleted('bundle', error.message)
  }
})

// ===== PINIA STORE INTEGRATION =====
const bundleStore = useBundleStore()

// ===== COMPUTED PROPERTIES =====
// Use centralized calculations from composable
const calculatedTotal = bundleCalculations.estimatedTotal

const filteredAvailableProducts = computed(() => {
  // 🔒 Use validated products only - ensures referential integrity
  const validProducts = productSelectorValidation.validProducts.value

  if (!validProducts || validProducts.length === 0) return []

  let products = [...validProducts]

  // Apply search filter
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

// 🔄 SYNCHRONISATION MANUELLE - Fonction avec feedback UX avancé
async function manualSync() {
  if (isSyncing.value) return // Éviter double-clic

  isSyncing.value = true
  const startTime = Date.now()

  try {
    console.log('🔄 Synchronisation manuelle initiée...')

    // Étape 1: Vérifier si on a des produits à synchroniser
    if (!selectedProducts.value || selectedProducts.value.length === 0) {
      if (info) {
        info('Aucun produit à synchroniser', 'Ce bundle ne contient pas de produits')
      }
      return
    }

    const productCount = selectedProducts.value.length
    console.log(`📦 Synchronisation de ${productCount} produits...`)

    // Étape 2: Afficher notification de début
    if (info) {
      info('Synchronisation en cours...', `Mise à jour de ${productCount} produit(s)`)
    }

    // Étape 3: Synchroniser chaque produit avec gestion d'erreur individuelle
    const syncResults = await Promise.allSettled(
      selectedProducts.value.map(async (bundleProduct, index) => {
        try {
          console.log(`🔍 Sync produit ${index + 1}/${productCount}: ${bundleProduct.name}`)

          // Récupérer les données fraîches du produit
          const latestProduct = await $fetch(`/api/products/${bundleProduct.id}`)

          if (latestProduct) {
            // Détecter les changements significatifs
            const priceChanged = (latestProduct.base_price || latestProduct.price) !== bundleProduct.basePrice
            const nameChanged = latestProduct.name !== bundleProduct.name
            const imageChanged = latestProduct.image_url !== bundleProduct.image_url

            // 🖼️ SYNCHRONISATION CLOUDINARY AVANCÉE - Enrichir avec métadonnées
            let enrichedImages = latestProduct.images || bundleProduct.images || []
            let cloudinarySync = false

            // Si le produit a des images, synchroniser avec Cloudinary
            if (latestProduct.images && latestProduct.images.length > 0) {
              try {
                // Utiliser le composable de métadonnées Cloudinary
                const { fetchImageMetadata, getContextualTransformations } = useCloudinaryMetadata()

                // Enrichir chaque image avec ses métadonnées Cloudinary
                const enrichedImagePromises = latestProduct.images.map(async (imagePublicId: string) => {
                  try {
                    const imageInfo = await fetchImageMetadata(imagePublicId)
                    if (imageInfo) {
                      return {
                        publicId: imagePublicId,
                        url: getContextualTransformations(imagePublicId, 'product_card'),
                        metadata: imageInfo.metadata,
                        width: imageInfo.width,
                        height: imageInfo.height,
                        format: imageInfo.format
                      }
                    }
                    return { publicId: imagePublicId, url: null }
                  } catch (error) {
                    console.warn(`⚠️ Cloudinary metadata sync failed for ${imagePublicId}:`, error)
                    return { publicId: imagePublicId, url: null }
                  }
                })

                enrichedImages = await Promise.all(enrichedImagePromises)
                cloudinarySync = true
                console.log(`🎨 Métadonnées Cloudinary synchronisées pour "${latestProduct.name}"`)
              } catch (error) {
                console.warn(`⚠️ Cloudinary sync partielle pour "${latestProduct.name}":`, error)
              }
            }

            // Mettre à jour le produit avec synchronisation Cloudinary
            const updatedBundleProduct = {
              ...bundleProduct,
              name: latestProduct.name || bundleProduct.name,
              basePrice: latestProduct.base_price || latestProduct.price || bundleProduct.basePrice,
              image_url: latestProduct.image_url || bundleProduct.image_url,
              images: enrichedImages,
              subtotal: bundleProduct.quantity * (latestProduct.base_price || latestProduct.price || bundleProduct.basePrice),
              // Ajouter métadonnées de synchronisation
              lastSynced: new Date().toISOString(),
              cloudinarySync
            }

            // Log des changements détectés
            const changes = []
            if (priceChanged) changes.push(`prix: ${bundleProduct.basePrice}€ → ${updatedBundleProduct.basePrice}€`)
            if (nameChanged) changes.push(`nom: "${bundleProduct.name}" → "${updatedBundleProduct.name}"`)
            if (imageChanged) changes.push('image mise à jour')
            if (cloudinarySync) changes.push('métadonnées Cloudinary synchronisées')

            if (changes.length > 0) {
              console.log(`✨ Changements détectés pour "${latestProduct.name}": ${changes.join(', ')}`)
            }

            return { success: true, product: updatedBundleProduct, changes, cloudinarySync }
          }

          return { success: true, product: bundleProduct, changes: [] }
        } catch (error) {
          console.error(`❌ Erreur sync produit ${bundleProduct.id}:`, error)
          return { success: false, product: bundleProduct, error }
        }
      })
    )

    // Étape 4: Traiter les résultats et mettre à jour l'interface
    const successful = syncResults.filter(result => result.status === 'fulfilled' && result.value.success)
    const failed = syncResults.filter(result => result.status === 'rejected' || !result.value.success)

    // Mettre à jour les produits sélectionnés
    selectedProducts.value = syncResults.map(result => {
      if (result.status === 'fulfilled') {
        return result.value.product
      }
      return selectedProducts.value.find(p => p.id === result.value?.product?.id) || result.value?.product
    }).filter(Boolean)

    // Calculer les statistiques de synchronisation
    const duration = Date.now() - startTime
    const changesDetected = successful.reduce((count, result) =>
      count + (result.value.changes?.length || 0), 0
    )
    const cloudinarySynced = successful.reduce((count, result) =>
      count + (result.value.cloudinarySync ? 1 : 0), 0
    )

    console.log(`✅ Synchronisation terminée: ${successful.length}/${productCount} réussies en ${duration}ms`)

    // Étape 5: Afficher les résultats avec notifications appropriées
    if (failed.length === 0) {
      // Succès complet
      if (crudSuccess) {
        const details = []
        if (changesDetected > 0) details.push(`${changesDetected} changement(s) détecté(s)`)
        if (cloudinarySynced > 0) details.push(`${cloudinarySynced} produit(s) avec métadonnées Cloudinary`)

        crudSuccess.updated(
          `Bundle synchronisé avec succès`,
          `${successful.length} produit(s) synchronisé(s)${details.length > 0 ? ` - ${details.join(', ')}` : ''}`
        )
      }
    } else {
      // Succès partiel
      if (warn) {
        warn(
          'Synchronisation partielle',
          `${successful.length}/${productCount} produits synchronisés. ${failed.length} erreur(s).${cloudinarySynced > 0 ? ` ${cloudinarySynced} avec Cloudinary.` : ''}`
        )
      }
    }

  } catch (error) {
    console.error('❌ Erreur globale de synchronisation:', error)
    if (crudError) {
      crudError.validation('Erreur de synchronisation', 'Impossible de synchroniser le bundle. Veuillez réessayer.')
    }
  } finally {
    // Délai minimum pour UX (éviter le flash)
    const minDelay = 800
    const elapsed = Date.now() - startTime
    if (elapsed < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
    }

    isSyncing.value = false
  }
}

function addProduct(product: Product) {
  // 🔒 STRICT VALIDATION - Check if product can be safely added
  const canAdd = productSelectorValidation.canAddProduct(product)

  if (!canAdd.canAdd) {
    crudError?.validation(`Impossible d'ajouter le produit: ${canAdd.reason}`)
    return
  }

  // Additional validation: ensure product exists in /admin/products interface
  if (!product.isActive) {
    crudError?.validation(`Le produit "${product.name}" n'est pas actif et ne peut être ajouté au bundle`)
    return
  }

  if (!product.price || product.price <= 0) {
    crudError?.validation(`Le produit "${product.name}" n'a pas de prix valide`)
    return
  }

  // Use centralized bundle calculations
  bundleCalculations.addProduct({
    productId: product.id,
    name: product.name,
    basePrice: product.price || 0,
    quantity: 1,
    subtotal: (product.price || 0) * 1,
    productReference: product.reference,
    categoryId: product.category_id,
    image_url: product.image_url
  })

  // Close product selector modal
  showProductSelector.value = false

  // Show success notification
  crudSuccess?.created(product.name, 'produit ajouté au bundle')
}

function removeProduct(index: number) {
  const product = selectedProducts.value[index]
  const productName = product.name

  // Use centralized bundle calculations
  bundleCalculations.removeProduct(product.id)

  // Show success notification
  crudSuccess?.deleted(productName, 'produit retiré du bundle')
}

function updateProductTotal(index: number) {
  const product = selectedProducts.value[index]
  const validQuantity = product.quantity && !isNaN(product.quantity) ? product.quantity : 1

  // Use centralized bundle calculations
  bundleCalculations.updateProductQuantity(product.id, validQuantity)

  // Show info notification for quantity/price updates
  info?.('Produit mis à jour', `${product.name} - Quantité: ${validQuantity}`)
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

  // Prepare bundle data with proper type casting
  const bundleData = {
    ...form,
    targetAudience: form.targetAudience as BundleTargetAudience,
    budgetRange: form.budgetRange as BundleBudgetRange,
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
onMounted(async () => {
  const eventBus = useGlobalEventBus()

  // 🔄 AUTO-SYNCHRONISATION AU CHARGEMENT - Synchroniser immédiatement les données
  console.log('🚀 Auto-synchronisation du bundle au chargement...')

  try {
    // Synchroniser les prix et métadonnées des produits sélectionnés
    if (selectedProducts.value && selectedProducts.value.length > 0) {
      console.log(`📦 Synchronisation de ${selectedProducts.value.length} produits...`)

      const syncPromises = selectedProducts.value.map(async (bundleProduct) => {
        try {
          // Récupérer les données les plus récentes du produit
          const latestProduct = await $fetch(`/api/products/${bundleProduct.id}`)

          if (latestProduct) {
            // Mettre à jour les données du produit dans le bundle
            const updatedBundleProduct = {
              ...bundleProduct,
              name: latestProduct.name || bundleProduct.name,
              basePrice: latestProduct.base_price || latestProduct.price || bundleProduct.basePrice,
              image_url: latestProduct.image_url || bundleProduct.image_url,
              images: latestProduct.images || bundleProduct.images || [],
              subtotal: bundleProduct.quantity * (latestProduct.base_price || latestProduct.price || bundleProduct.basePrice)
            }

            console.log(`✅ Produit "${latestProduct.name}" synchronisé`)
            return updatedBundleProduct
          }

          return bundleProduct
        } catch (error) {
          console.warn(`⚠️ Erreur sync produit ${bundleProduct.id}:`, error)
          return bundleProduct // Garder les données existantes en cas d'erreur
        }
      })

      // Attendre toutes les synchronisations
      const syncedProducts = await Promise.all(syncPromises)
      selectedProducts.value = syncedProducts

      console.log('✅ Auto-synchronisation terminée avec succès')

      // Afficher notification de synchronisation
      if (info) {
        info('Bundle synchronisé', `${syncedProducts.length} produits mis à jour`)
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'auto-synchronisation:', error)
    if (warn) {
      warn('Synchronisation partielle', 'Certaines données peuvent ne pas être à jour')
    }
  }

  eventBus.on('product.updated', (event: any) => {
    // Update selected products if they reference the updated product
    const productId = event.payload?.productId || event.productId
    const updatedProduct = event.payload?.product || event.updatedProduct

    selectedProducts.value = selectedProducts.value.map(bundleProduct => {
      if (bundleProduct.id === productId) {
        return {
          ...bundleProduct,
          name: updatedProduct.name,
          basePrice: updatedProduct.basePrice || updatedProduct.price,
          subtotal: bundleProduct.quantity * (updatedProduct.basePrice || updatedProduct.price)
        }
      }
      return bundleProduct
    })
  })


  eventBus.on('product.price_changed', (event: any) => {
    // Handle specific price changes with detailed logging
    const productId = event.payload?.productId
    const oldPrice = event.payload?.oldPrice
    const newPrice = event.payload?.newPrice

    selectedProducts.value = selectedProducts.value.map(bundleProduct => {
      if (bundleProduct.id === productId) {
        const updatedProduct = {
          ...bundleProduct,
          basePrice: newPrice,
          subtotal: bundleProduct.quantity * newPrice
        }

        // Show notification for price change impact
        info?.(`Prix mis à jour: ${bundleProduct.name}`, `${formatPrice(oldPrice)} → ${formatPrice(newPrice)}`)

        return updatedProduct
      }
      return bundleProduct
    })
  })

  // 🖼️ SYNCHRONISATION IMAGES CLOUDINARY - Gestion en temps réel des changements d'images
  eventBus.on('product.image_added', (event: any) => {
    const { productId, imagePublicId, imageUrl, metadata } = event

    selectedProducts.value = selectedProducts.value.map(bundleProduct => {
      if (bundleProduct.id === productId) {
        const updatedImages = [...(bundleProduct.images || []), imagePublicId]
        const updatedProduct = {
          ...bundleProduct,
          images: updatedImages,
          // Update main image if it was empty
          image_url: bundleProduct.image_url || imageUrl
        }

        // Show notification for image addition
        info?.(`Image ajoutée: ${bundleProduct.name}`, `Nouvelle image (${metadata?.format?.toUpperCase()}, ${Math.round(metadata?.size / 1024)}KB)`)

        return updatedProduct
      }
      return bundleProduct
    })
  })

  eventBus.on('product.image_removed', (event: any) => {
    const { productId, imagePublicId, remainingImages } = event

    selectedProducts.value = selectedProducts.value.map(bundleProduct => {
      if (bundleProduct.id === productId) {
        const wasMainImage = bundleProduct.image_url?.includes(imagePublicId)
        const updatedProduct = {
          ...bundleProduct,
          images: remainingImages,
          // Update main image if the removed image was the main one
          image_url: wasMainImage && remainingImages.length > 0
            ? `https://res.cloudinary.com/dsrvzogof/image/upload/w_400,h_300,c_fill/${remainingImages[0]}`
            : bundleProduct.image_url
        }

        // Show notification for image removal
        info?.(`Image supprimée: ${bundleProduct.name}`, `Image retirée du produit`)

        return updatedProduct
      }
      return bundleProduct
    })
  })

  eventBus.on('product.image_metadata_updated', (event: any) => {
    const { productId, imagePublicId, metadata } = event

    selectedProducts.value = selectedProducts.value.map(bundleProduct => {
      if (bundleProduct.id === productId && bundleProduct.image_url?.includes(imagePublicId)) {
        // If the updated image is the main image, potentially refresh the URL with new transformations
        const updatedProduct = {
          ...bundleProduct,
          // Could add logic here to apply new transformations if needed
        }

        // Show notification for metadata update
        info?.(`Métadonnées mises à jour: ${bundleProduct.name}`, `Image "${metadata.alt || 'sans titre'}" mise à jour`)

        return updatedProduct
      }
      return bundleProduct
    })
  })
  eventBus.on('product.deleted', (event: any) => {
    // Remove deleted product from selected products
    const productId = event.payload?.productId || event.productId
    selectedProducts.value = selectedProducts.value.filter(p => p.id !== productId)
  })

  eventBus.on('bundle.updated', () => {
    if (!isNew.value) {
      refetchBundle()
    }
  })
})
</script>