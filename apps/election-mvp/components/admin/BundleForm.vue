<template>
  <form class="space-y-6" @submit.prevent="submitForm">
    <!-- Basic Information -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Informations de base
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Bundle Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Nom du bundle *
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.name ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Ex: Pack Campagne Municipale"
            @blur="validateField('name')"
          >
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>

        <!-- Target Audience -->
        <div>
          <label for="targetAudience" class="block text-sm font-medium text-gray-700 mb-1">
            Audience cible *
          </label>
          <select
            id="targetAudience"
            v-model="formData.targetAudience"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.targetAudience ? 'border-red-300' : 'border-gray-300'
            ]"
            @change="validateField('targetAudience')"
          >
            <option value="">
              Sélectionner une audience
            </option>
            <option value="local">
              Local
            </option>
            <option value="regional">
              Régional
            </option>
            <option value="national">
              National
            </option>
            <option value="universal">
              Universel
            </option>
          </select>
          <p v-if="errors.targetAudience" class="mt-1 text-sm text-red-600">
            {{ errors.targetAudience }}
          </p>
        </div>
      </div>

      <!-- Description -->
      <div class="mt-6">
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          v-model="formData.description"
          rows="4"
          required
          :class="[
            'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
            errors.description ? 'border-red-300' : 'border-gray-300'
          ]"
          placeholder="Description détaillée du bundle de campagne..."
          @blur="validateField('description')"
        />
        <p v-if="errors.description" class="mt-1 text-sm text-red-600">
          {{ errors.description }}
        </p>
      </div>
    </div>

    <!-- Configuration and Status -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Configuration et statut
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Budget Range -->
        <div>
          <label for="budgetRange" class="block text-sm font-medium text-gray-700 mb-1">
            Gamme de budget *
          </label>
          <select
            id="budgetRange"
            v-model="formData.budgetRange"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.budgetRange ? 'border-red-300' : 'border-gray-300'
            ]"
            @change="validateField('budgetRange')"
          >
            <option value="">
              Sélectionner un budget
            </option>
            <option value="starter">
              Starter (0-10k XOF)
            </option>
            <option value="medium">
              Medium (10k-50k XOF)
            </option>
            <option value="premium">
              Premium (50k-200k XOF)
            </option>
            <option value="enterprise">
              Enterprise (200k+ XOF)
            </option>
          </select>
          <p v-if="errors.budgetRange" class="mt-1 text-sm text-red-600">
            {{ errors.budgetRange }}
          </p>
        </div>

        <!-- Popularity -->
        <div>
          <label for="popularity" class="block text-sm font-medium text-gray-700 mb-1">
            Popularité (1-10)
          </label>
          <input
            id="popularity"
            v-model.number="formData.popularity"
            type="number"
            min="0"
            max="10"
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.popularity ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="5"
            @blur="validateField('popularity')"
          >
          <p v-if="errors.popularity" class="mt-1 text-sm text-red-600">
            {{ errors.popularity }}
          </p>
        </div>

        <!-- Status Options -->
        <div class="space-y-3">
          <div class="flex items-center">
            <input
              id="isActive"
              v-model="formData.isActive"
              type="checkbox"
              class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            >
            <label for="isActive" class="ml-2 block text-sm text-gray-700">
              Bundle actif
            </label>
          </div>
          <div class="flex items-center">
            <input
              id="isFeatured"
              v-model="formData.isFeatured"
              type="checkbox"
              class="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            >
            <label for="isFeatured" class="ml-2 block text-sm text-gray-700">
              Bundle vedette
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Products Management -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">
          Produits du bundle
        </h3>
        <button
          type="button"
          class="inline-flex items-center px-3 py-2 border border-amber-300 rounded-md shadow-sm text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          @click="addProduct"
        >
          <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
          Ajouter un produit
        </button>
      </div>

      <!-- Products List -->
      <div v-if="formData.products.length > 0" class="space-y-4">
        <div
          v-for="(product, index) in formData.products"
          :key="`product-${index}`"
          class="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 border border-gray-200 rounded-lg"
        >
          <!-- Product Selection -->
          <div class="lg:col-span-2">
            <label :for="`product-${index}`" class="block text-sm font-medium text-gray-700 mb-1">
              Produit *
            </label>
            <select
              :id="`product-${index}`"
              v-model="product.id"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              @change="updateProductInfo(index)"
            >
              <option value="">
                Sélectionner un produit
              </option>
              <option
                v-for="availableProduct in availableProducts"
                :key="availableProduct.id"
                :value="availableProduct.id"
                :disabled="!availableProduct.basePrice || availableProduct.basePrice <= 0"
              >
                {{ availableProduct.name }}
                {{ availableProduct.basePrice && availableProduct.basePrice > 0
                  ? `(${formatPrice(availableProduct.basePrice)})`
                  : '(Prix non défini)' }}
              </option>
            </select>
          </div>

          <!-- Quantity -->
          <div>
            <label :for="`quantity-${index}`" class="block text-sm font-medium text-gray-700 mb-1">
              Quantité *
            </label>
            <input
              :id="`quantity-${index}`"
              v-model.number="product.quantity"
              type="number"
              min="1"
              max="1000"
              required
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              @input="updateSubtotal(index)"
            >
          </div>

          <!-- Base Price (readonly) -->
          <div>
            <label :for="`basePrice-${index}`" class="block text-sm font-medium text-gray-700 mb-1">
              Prix unitaire
            </label>
            <input
              :id="`basePrice-${index}`"
              :value="formatPrice(product.basePrice)"
              type="text"
              readonly
              class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            >
          </div>

          <!-- Subtotal (readonly) -->
          <div class="flex items-end">
            <div class="w-full">
              <label :for="`subtotal-${index}`" class="block text-sm font-medium text-gray-700 mb-1">
                Sous-total
              </label>
              <input
                :id="`subtotal-${index}`"
                :value="formatPrice(product.subtotal)"
                type="text"
                readonly
                class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              >
            </div>
            <button
              type="button"
              class="ml-2 p-2 text-red-600 hover:text-red-800 focus:outline-none"
              @click="removeProduct(index)"
            >
              <Icon name="heroicons:trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-6">
        <Icon name="heroicons:cube" class="mx-auto h-12 w-12 text-gray-400" />
        <h3 class="mt-2 text-sm font-medium text-gray-900">
          Aucun produit
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          Commencez par ajouter des produits à ce bundle.
        </p>
      </div>

      <p v-if="errors.products" class="mt-2 text-sm text-red-600">
        {{ errors.products }}
      </p>
    </div>

    <!-- Pricing Summary -->
    <div v-if="formData.products.length > 0" class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Résumé des prix
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Estimated Total -->
        <div>
          <label for="estimatedTotal" class="block text-sm font-medium text-gray-700 mb-1">
            Prix total estimé (XOF) *
          </label>
          <input
            id="estimatedTotal"
            :value="formatPrice(calculatedTotal)"
            type="text"
            readonly
            class="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-medium"
          >
          <p class="mt-1 text-xs text-gray-500">
            Calculé automatiquement
          </p>
        </div>

        <!-- Original Total (optional) -->
        <div>
          <label for="originalTotal" class="block text-sm font-medium text-gray-700 mb-1">
            Prix original (XOF)
          </label>
          <input
            id="originalTotal"
            v-model.number="formData.originalTotal"
            type="number"
            min="0"
            step="0.01"
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.originalTotal ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="0.00"
            @blur="validateField('originalTotal')"
          >
          <p v-if="errors.originalTotal" class="mt-1 text-sm text-red-600">
            {{ errors.originalTotal }}
          </p>
        </div>

        <!-- Savings (calculated) -->
        <div>
          <label for="savings" class="block text-sm font-medium text-gray-700 mb-1">
            Économies (XOF)
          </label>
          <input
            id="savings"
            :value="formatPrice(calculatedSavings)"
            type="text"
            readonly
            :class="[
              'block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium',
              calculatedSavings > 0 ? 'text-green-600' : 'text-gray-500'
            ]"
          >
          <p class="mt-1 text-xs text-gray-500">
            Calculé automatiquement
          </p>
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Tags et métadonnées
      </h3>

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
          placeholder="campagne, municipale, affichage, goodies"
          @blur="updateTags"
        >
        <p class="mt-1 text-xs text-gray-500">
          Maximum 10 tags, 50 caractères par tag
        </p>
        <p v-if="errors.tags" class="mt-1 text-sm text-red-600">
          {{ errors.tags }}
        </p>

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
              class="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-amber-600 hover:bg-amber-200 hover:text-amber-800 focus:outline-none"
              @click="removeTag(index)"
            >
              <Icon name="heroicons:x-mark" class="w-3 h-3" />
            </button>
          </span>
        </div>
      </div>
    </div>

    <!-- Form Actions -->
    <div class="flex justify-end space-x-3 pt-6 border-t">
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        @click="$emit('cancel')"
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
// Auto-imported via Nuxt 3: useFormValidation, globalNotifications

interface Product {
  id: string
  name: string
  basePrice: number
  reference?: string
  category_id?: string
}

interface BundleProduct {
  id: string
  name: string
  basePrice: number
  quantity: number
  subtotal: number
}

interface Bundle {
  id?: string
  name: string
  description: string
  targetAudience: 'local' | 'regional' | 'national' | 'universal' | ''
  budgetRange: 'starter' | 'medium' | 'premium' | 'enterprise' | ''
  products: BundleProduct[]
  estimatedTotal: number
  originalTotal?: number
  savings?: number
  popularity: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
}

const props = defineProps<{
  bundle?: Bundle | null
  availableProducts: Product[]
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [bundle: Bundle]
  cancel: []
}>()

const { validateBundle } = useFormValidation()
const { crudSuccess, crudError } = globalNotifications

// Form state
const formData = reactive<Bundle>({
  name: '',
  description: '',
  targetAudience: '',
  budgetRange: '',
  products: [],
  estimatedTotal: 0,
  originalTotal: undefined,
  savings: undefined,
  popularity: 5,
  isActive: true,
  isFeatured: false,
  tags: []
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const tagsInput = ref('')

// Initialize form with bundle data
watchEffect(() => {
  if (props.bundle) {
    Object.assign(formData, {
      ...props.bundle,
      products: props.bundle.products || [],
      tags: props.bundle.tags || []
    })
    tagsInput.value = props.bundle.tags?.join(', ') || ''
  } else {
    // Reset form for new bundle
    Object.assign(formData, {
      name: '',
      description: '',
      targetAudience: '',
      budgetRange: '',
      products: [],
      estimatedTotal: 0,
      originalTotal: undefined,
      savings: undefined,
      popularity: 5,
      isActive: true,
      isFeatured: false,
      tags: []
    })
    tagsInput.value = ''
  }
})

// Computed
const calculatedTotal = computed(() => {
  const total = formData.products.reduce((sum, product) => sum + (product.subtotal || 0), 0)

  // Only log when there are products with valid data
  if (formData.products.length > 0 && formData.products.some(p => p.subtotal > 0)) {
    console.log('🧮 Total calculé:', {
      total,
      produits: formData.products.filter(p => p.subtotal > 0).map(p => ({
        nom: p.name,
        quantité: p.quantity,
        prixUnitaire: p.basePrice,
        sousTotal: p.subtotal
      }))
    })
  }

  return total
})

const calculatedSavings = computed(() => {
  if (formData.originalTotal && formData.originalTotal > calculatedTotal.value) {
    return formData.originalTotal - calculatedTotal.value
  }
  return 0
})

const isFormValid = computed(() => {
  // Basic field validation
  const hasBasicFields = formData.name &&
                        formData.description &&
                        formData.targetAudience &&
                        formData.budgetRange

  // Product validation
  const hasProducts = formData.products.length > 0
  const allProductsValid = formData.products.every(product =>
    product.id &&
    product.name &&
    product.basePrice > 0 &&
    product.quantity > 0
  )

  // No validation errors
  const noErrors = Object.keys(errors.value).length === 0

  // Debug: only log if there are validation issues
  if (!hasBasicFields || !hasProducts || !allProductsValid || !noErrors) {
    console.log('🔍 Form validation issues:', {
      hasBasicFields,
      hasProducts,
      allProductsValid,
      noErrors,
      productsCount: formData.products.length,
      errorsCount: Object.keys(errors.value).length
    })
  }

  return hasBasicFields && hasProducts && allProductsValid && noErrors
})

// Update calculated values
watch(calculatedTotal, (newTotal) => {
  if (newTotal !== formData.estimatedTotal) {
    console.log('💰 Total mis à jour:', { newTotal, previousTotal: formData.estimatedTotal })
    formData.estimatedTotal = newTotal
  }
})

watch(calculatedSavings, (newSavings) => {
  formData.savings = newSavings
})

// Watch for product changes to ensure calculations are updated
watch(() => formData.products, (newProducts, oldProducts) => {
  console.log('🔄 products watcher:', {
    newCount: newProducts.length,
    oldCount: oldProducts?.length || 0,
    products: newProducts.map(p => ({
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      basePrice: p.basePrice,
      subtotal: p.subtotal
    }))
  })

  // Force recalculation for all products
  newProducts.forEach((product, index) => {
    if (product.id && product.basePrice > 0 && product.quantity > 0) {
      updateSubtotal(index)
    }
  })
}, { deep: true })

// Methods
const validateField = (fieldName: string) => {
  const result = validateBundle(formData)

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

const addProduct = () => {
  console.log('🔧 addProduct called, current products length:', formData.products.length)

  const newProduct = {
    id: '',
    name: '',
    basePrice: 0,
    quantity: 1,
    subtotal: 0
  }

  formData.products.push(newProduct)
  console.log('✅ Product added:', {
    newLength: formData.products.length,
    newProduct
  })

  // Clear product validation error when adding a product
  delete errors.value.products

  // Show success notification
  globalNotifications.info('Nouveau produit', 'Ligne de produit ajoutée au bundle')
}

const removeProduct = (index: number) => {
  const product = formData.products[index]
  const productName = product.name || 'Produit'

  formData.products.splice(index, 1)

  // Validate products after removal
  if (formData.products.length === 0) {
    errors.value.products = 'Au moins un produit est requis'
  }

  // Show success notification
  globalNotifications.warning('Produit retiré', `${productName} retiré du bundle`)
}

const updateProductInfo = (index: number) => {
  const product = formData.products[index]
  const selectedProduct = props.availableProducts.find(p => p.id === product.id)

  console.log('🔄 updateProductInfo:', {
    index,
    productId: product.id,
    selectedProduct: selectedProduct ? {
      id: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.basePrice
    } : null,
    availableProductsCount: props.availableProducts.length
  })

  if (selectedProduct) {
    product.name = selectedProduct.name
    // Ensure price is valid, fallback to 0 if null/undefined
    product.basePrice = selectedProduct.basePrice && !isNaN(selectedProduct.basePrice) ? selectedProduct.basePrice : 0
    console.log('✅ Product info updated:', {
      index,
      newName: product.name,
      newBasePrice: product.basePrice,
      quantity: product.quantity
    })
    updateSubtotal(index)

    // Validate that all products have valid selections
    const hasIncompleteProducts = formData.products.some(p => !p.id || !p.name)
    if (!hasIncompleteProducts && formData.products.length > 0) {
      delete errors.value.products
    }
  }
}

const updateSubtotal = (index: number) => {
  const product = formData.products[index]
  // Ensure safe calculation with fallback values
  const validQuantity = product.quantity && !isNaN(product.quantity) ? product.quantity : 1
  const validBasePrice = product.basePrice && !isNaN(product.basePrice) ? product.basePrice : 0

  const calculatedSubtotal = validQuantity * validBasePrice
  product.subtotal = calculatedSubtotal

  console.log('💰 updateSubtotal:', {
    index,
    productId: product.id,
    productName: product.name,
    quantity: validQuantity,
    basePrice: validBasePrice,
    calculatedSubtotal,
    subtotal: product.subtotal
  })
}

const updateTags = () => {
  if (tagsInput.value.trim()) {
    formData.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, 10) // Limit to 10 tags
  } else {
    formData.tags = []
  }
  validateField('tags')
}

const removeTag = (index: number) => {
  formData.tags.splice(index, 1)
  tagsInput.value = formData.tags.join(', ')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0)
}

const submitForm = async () => {
  // Validate entire form
  const result = validateBundle(formData)

  if (!result.success) {
    // Clear previous errors
    errors.value = {}

    // Set field-specific errors
    result.errors.forEach(error => {
      errors.value[error.field] = error.message
    })

    // Show validation error notification
    const errorMessages = result.errors.map(err => err.message)
    const mainError = errorMessages[0]
    const additionalErrors = errorMessages.length > 1 ?
      `(+${errorMessages.length - 1} autre${errorMessages.length > 2 ? 's' : ''} erreur${errorMessages.length > 2 ? 's' : ''})` : ''

    crudError.validation(`${mainError} ${additionalErrors}`)
    return
  }

  isSubmitting.value = true
  try {
    console.log('📤 Soumission du formulaire bundle:', {
      name: formData.name,
      productsCount: formData.products.length,
      estimatedTotal: formData.estimatedTotal
    })

    // Emit to parent component (which handles the actual API call)
    emit('submit', { ...formData })

    // Note: Success notification will be handled by the parent component after API success
  } catch (error: any) {
    console.error('❌ Erreur soumission:', error)
    crudError.created('bundle', error.message || 'Une erreur inattendue est survenue lors de la soumission.')
  } finally {
    isSubmitting.value = false
  }
}
</script>