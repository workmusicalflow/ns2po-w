<template>
  <form class="space-y-6" @submit.prevent="submitForm">
    <!-- Basic Information -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Informations de base
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Product Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Nom du produit *
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
            placeholder="Ex: T-shirt personnalisé"
            @blur="validateField('name')"
          >
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>

        <!-- Reference -->
        <div>
          <label for="reference" class="block text-sm font-medium text-gray-700 mb-1">
            Référence *
          </label>
          <input
            id="reference"
            v-model="formData.reference"
            type="text"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.reference ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Ex: TSHIRT-001"
            @blur="validateField('reference')"
          >
          <p class="mt-1 text-xs text-gray-500">
            Lettres majuscules, chiffres, tirets et underscores uniquement
          </p>
          <p v-if="errors.reference" class="mt-1 text-sm text-red-600">
            {{ errors.reference }}
          </p>
        </div>
      </div>

      <!-- Description -->
      <div class="mt-6">
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
          placeholder="Description détaillée du produit..."
          @blur="validateField('description')"
        />
        <p v-if="errors.description" class="mt-1 text-sm text-red-600">
          {{ errors.description }}
        </p>
      </div>
    </div>

    <!-- Category and Status -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Catégorie et statut
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Category -->
        <div>
          <label for="category_id" class="block text-sm font-medium text-gray-700 mb-1">
            Catégorie *
          </label>
          <select
            id="category_id"
            v-model="formData.category_id"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.category_id ? 'border-red-300' : 'border-gray-300'
            ]"
            @change="validateField('category_id')"
          >
            <option value="">
              Sélectionner une catégorie
            </option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.name"
            >
              {{ category.name }}
            </option>
          </select>
          <p v-if="errors.category_id" class="mt-1 text-sm text-red-600">
            {{ errors.category_id }}
          </p>
        </div>

        <!-- Status -->
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
            Statut *
          </label>
          <select
            id="status"
            v-model="formData.status"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.status ? 'border-red-300' : 'border-gray-300'
            ]"
            @change="validateField('status')"
          >
            <option value="active">
              Actif
            </option>
            <option value="inactive">
              Inactif
            </option>
            <option value="draft">
              Brouillon
            </option>
          </select>
          <p v-if="errors.status" class="mt-1 text-sm text-red-600">
            {{ errors.status }}
          </p>
        </div>
      </div>
    </div>

    <!-- Pricing and Quantities -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Tarification et quantités
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Price -->
        <div>
          <label for="price" class="block text-sm font-medium text-gray-700 mb-1">
            Prix (XOF) *
          </label>
          <input
            id="price"
            v-model.number="formData.price"
            type="number"
            min="0"
            step="0.01"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.price ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="0.00"
            @blur="validateField('price')"
          >
          <p v-if="errors.price" class="mt-1 text-sm text-red-600">
            {{ errors.price }}
          </p>
        </div>

        <!-- Min Quantity -->
        <div>
          <label for="min_quantity" class="block text-sm font-medium text-gray-700 mb-1">
            Quantité minimum *
          </label>
          <input
            id="min_quantity"
            v-model.number="formData.min_quantity"
            type="number"
            min="1"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.min_quantity ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="1"
            @blur="validateField('min_quantity')"
          >
          <p v-if="errors.min_quantity" class="mt-1 text-sm text-red-600">
            {{ errors.min_quantity }}
          </p>
        </div>

        <!-- Max Quantity -->
        <div>
          <label for="max_quantity" class="block text-sm font-medium text-gray-700 mb-1">
            Quantité maximum
          </label>
          <input
            id="max_quantity"
            v-model.number="formData.max_quantity"
            type="number"
            min="1"
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.max_quantity ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="1000"
            @blur="validateField('max_quantity')"
          >
          <p v-if="errors.max_quantity" class="mt-1 text-sm text-red-600">
            {{ errors.max_quantity }}
          </p>
        </div>
      </div>
    </div>

    <!-- Materials, Colors, Sizes -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Caractéristiques produit
      </h3>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Materials -->
        <div>
          <label for="materials" class="block text-sm font-medium text-gray-700 mb-1">
            Matériaux *
          </label>
          <textarea
            id="materials"
            v-model="formData.materials"
            rows="3"
            required
            :class="[
              'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
              errors.materials ? 'border-red-300' : 'border-gray-300'
            ]"
            placeholder="Coton&#10;Polyester&#10;Nylon"
            @blur="validateField('materials')"
          />
          <p class="mt-1 text-xs text-gray-500">
            Un matériau par ligne
          </p>
          <p v-if="errors.materials" class="mt-1 text-sm text-red-600">
            {{ errors.materials }}
          </p>
        </div>

        <!-- Colors -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Couleurs *
          </label>
          <div class="space-y-2">
            <div
              v-for="(color, index) in (formData.colors || [])"
              :key="index"
              class="flex items-center space-x-2"
            >
              <input
                v-model="formData.colors![index]"
                type="text"
                :class="[
                  'flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
                  errors.colors ? 'border-red-300' : 'border-gray-300'
                ]"
                placeholder="Ex: Rouge, Bleu..."
              >
              <button
                type="button"
                class="p-2 text-red-500 hover:text-red-700"
                @click="removeColor(index)"
              >
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              class="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              @click="addColor"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
              Ajouter couleur
            </button>
          </div>
          <p v-if="errors.colors" class="mt-1 text-sm text-red-600">
            {{ errors.colors }}
          </p>
        </div>

        <!-- Sizes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tailles *
          </label>
          <div class="space-y-2">
            <div
              v-for="(size, index) in (formData.sizes || [])"
              :key="index"
              class="flex items-center space-x-2"
            >
              <input
                v-model="formData.sizes![index]"
                type="text"
                :class="[
                  'flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
                  errors.sizes ? 'border-red-300' : 'border-gray-300'
                ]"
                placeholder="Ex: S, M, L, XL..."
              >
              <button
                type="button"
                class="p-2 text-red-500 hover:text-red-700"
                @click="removeSize(index)"
              >
                <Icon name="heroicons:x-mark" class="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              class="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              @click="addSize"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
              Ajouter taille
            </button>
          </div>
          <p v-if="errors.sizes" class="mt-1 text-sm text-red-600">
            {{ errors.sizes }}
          </p>
        </div>
      </div>
    </div>

    <!-- Images -->
    <div class="bg-white p-6 rounded-lg border border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        Images du produit
      </h3>

      <!-- Current Images -->
      <div v-if="formData.images && formData.images.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div
          v-for="(image, index) in formData.images"
          :key="index"
          class="relative group"
        >
          <img
            :src="getImageUrl(image)"
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

      <!-- Add Images Button -->
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div class="text-center">
          <Icon name="heroicons:photo" class="mx-auto h-12 w-12 text-gray-400" />
          <div class="mt-2">
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
              @click="showAssetModal = true"
            >
              <Icon name="heroicons:plus" class="w-4 h-4 mr-2" />
              Ajouter des images
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            Uploadez de nouvelles images ou sélectionnez depuis les assets existants
          </p>
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

  <!-- Asset Selection Modal -->
  <AssetSelectionModal
    :show="showAssetModal"
    :multiple="true"
    @close="showAssetModal = false"
    @selected="handleAssetsSelected"
  />
</template>

<script setup lang="ts">
import type { Asset } from '~/composables/useAssetsQuery'
import { useUploadAssetMutation } from '~/composables/useAssetsQuery'
import AssetSelectionModal from '~/components/admin/AssetSelectionModal.vue'
import type { ProductFromApi, ProductFormData } from '~/types/admin/product-form'
import { mapApiToForm, mapFormToApi } from '~/utils/productMapper'

/**
 * Interface interne pour les données du formulaire
 * Étendue avec les champs UI spécifiques (status, images)
 */
interface FormDataInternal extends ProductFormData {
  status: 'active' | 'inactive' | 'draft'
  images: string[]
}

// Legacy interface pour compatibilité avec les pages parentes
interface Product {
  id?: string
  name: string
  reference: string
  description?: string
  category_id: string
  status: 'active' | 'inactive' | 'draft'
  price: number
  min_quantity: number
  max_quantity?: number
  images?: string[]
  // Nouveaux champs obligatoires pour création
  materials?: string  // Texte multiligne, séparé par \n
  colors?: string[]   // Liste des noms de couleurs
  sizes?: string[]    // Liste des tailles
}

interface Category {
  id: string
  name: string
}

const props = defineProps<{
  product?: Product | null
  categories: Category[]
  isEdit?: boolean
}>()

const emit = defineEmits<{
  submit: [product: Product]
  cancel: []
}>()

// Simple validation function instead of undefined useFormValidation
const validateProduct = (product: Product) => {
  const errors: Array<{ field: string; message: string }> = []

  if (!product.name?.trim()) {
    errors.push({ field: 'name', message: 'Le nom du produit est requis' })
  }
  if (!product.reference?.trim()) {
    errors.push({ field: 'reference', message: 'La référence est requise' })
  }
  if (!product.category_id) {
    errors.push({ field: 'category_id', message: 'La catégorie est requise' })
  }
  if (product.price && product.price < 0) {
    errors.push({ field: 'price', message: 'Le prix doit être positif' })
  }

  return {
    success: errors.length === 0,
    errors
  }
}

// Simple notification functions instead of undefined globalNotifications
const crudError = {
  validation: (message: string) => console.error(`❌ Validation:`, message),
  created: (type: string, message: string) => console.error(`❌ Erreur création ${type}:`, message),
  updated: (type: string, message: string) => console.error(`❌ Erreur mise à jour ${type}:`, message)
}

// Form state
const formData = reactive<Product>({
  name: '',
  reference: '',
  description: '',
  category_id: '',
  status: 'active',
  price: 0,
  min_quantity: 1,
  max_quantity: undefined,
  images: [],
  // Nouveaux champs obligatoires
  materials: '',        // Texte multiligne
  colors: [''],         // Commence avec un champ vide
  sizes: ['']           // Commence avec un champ vide
})

const errors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const isUploading = ref(false)
const showAssetModal = ref(false)

// Template refs
const fileInput = ref<HTMLInputElement>()

/**
 * Initialisation du formulaire avec les données produit
 * Pattern Adapter: watch au lieu de watchEffect pour éviter re-triggers indésirables
 *
 * @see Gemini audit: watch + immediate est plus prévisible que watchEffect
 */
watch(
  () => props.product,
  (newProduct) => {
    if (newProduct) {
      // ⭐ Utiliser le mapper pour transformation API → Form
      const mapped = mapApiToForm(newProduct as unknown as ProductFromApi)

      Object.assign(formData, {
        ...mapped,
        // Champs spécifiques au formulaire non gérés par le mapper
        category_id: mapped.category,
        price: mapped.basePrice ?? 0,
        min_quantity: mapped.minQuantity,
        max_quantity: mapped.maxQuantity,
        status: newProduct.status || (mapped.isActive ? 'active' : 'inactive'),
        images: (newProduct as Product).images || []
      })

      console.log('📥 [ProductForm] Données chargées via mapper:', {
        materials: formData.materials,
        colors: formData.colors,
        sizes: formData.sizes
      })
    } else {
      // Reset form pour nouveau produit
      Object.assign(formData, {
        name: '',
        reference: '',
        description: '',
        category_id: '',
        status: 'active',
        price: 0,
        min_quantity: 1,
        max_quantity: undefined,
        images: [],
        materials: '',
        colors: [''],
        sizes: ['']
      })
    }
  },
  { immediate: true } // S'exécute immédiatement au montage
)

// --- Méthodes pour gérer les listes dynamiques ---
const addColor = () => {
  if (!formData.colors) formData.colors = []
  formData.colors.push('')
}

const removeColor = (index: number) => {
  if (formData.colors && formData.colors.length > 1) {
    formData.colors.splice(index, 1)
  }
}

const addSize = () => {
  if (!formData.sizes) formData.sizes = []
  formData.sizes.push('')
}

const removeSize = (index: number) => {
  if (formData.sizes && formData.sizes.length > 1) {
    formData.sizes.splice(index, 1)
  }
}

// Computed
const isFormValid = computed(() => {
  // Vérifier les champs de base
  const hasBasicFields = formData.name &&
         formData.reference &&
         formData.category_id &&
         formData.status &&
         formData.price >= 0 &&
         formData.min_quantity >= 1 &&
         Object.keys(errors.value).length === 0

  // Vérifier les nouveaux champs obligatoires pour création
  // ⭐ Gérer les deux cas: string ou array (après normalisation c'est une string)
  const hasMaterials = formData.materials && (
    Array.isArray(formData.materials)
      ? formData.materials.length > 0
      : formData.materials.trim() !== ''
  )
  const hasColors = formData.colors && formData.colors.some(c => c.trim() !== '')
  const hasSizes = formData.sizes && formData.sizes.some(s => s.trim() !== '')

  return hasBasicFields && hasMaterials && hasColors && hasSizes
})

// Methods
const validateField = (fieldName: string) => {
  const result = validateProduct(formData)

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

      // Use the uploadMutation from useAssetsQuery for consistency
      const uploadMutation = useUploadAssetMutation()
      const uploadedAsset = await uploadMutation.mutateAsync({
        file,
        metadata: {
          folder: 'products'
        }
      })

      const data = {
        public_id: uploadedAsset.public_id,
        width: uploadedAsset.width,
        height: uploadedAsset.height,
        format: uploadedAsset.format,
        bytes: uploadedAsset.bytes
      }

      // Add to form images
      if (!formData.images) {
        formData.images = []
      }
      formData.images.push(data.public_id)

      // Image added successfully
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
  if (formData.images && formData.images[index]) {
    formData.images.splice(index, 1)
  }
}

const handleAssetsSelected = (assets: Asset[]) => {
  if (!assets || assets.length === 0) return

  // Initialize images array if needed
  if (!formData.images) {
    formData.images = []
  }

  // Add selected assets to form images
  assets.forEach(asset => {
    // Avoid duplicates
    if (!formData.images!.includes(asset.public_id)) {
      formData.images!.push(asset.public_id)
    }
  })

  console.log('✅ Assets ajoutés:', assets.map(a => a.public_id))
}

const getImageUrl = (publicId: string) => {
  return `https://res.cloudinary.com/dsrvzogof/image/upload/w_200,h_200,c_fill/${publicId}`
}

const submitForm = async () => {
  // Validate entire form
  const result = validateProduct(formData)

  if (!result.success) {
    errors.value = {}
    result.errors.forEach(error => {
      errors.value[error.field] = error.message
    })
    return
  }

  isSubmitting.value = true
  try {
    /**
     * ⭐ Pattern Adapter: utilise mapFormToApi pour transformer Form → API
     * Centralise la logique de transformation dans productMapper.ts
     */
    const mappedData = mapFormToApi({
      name: formData.name,
      description: formData.description || '',
      reference: formData.reference,
      category: formData.category_id,
      subcategory: '',
      basePrice: formData.price,
      minQuantity: formData.min_quantity,
      maxQuantity: formData.max_quantity || 1000,
      imageUrl: formData.images && formData.images.length > 0
        ? `https://res.cloudinary.com/dsrvzogof/image/upload/${formData.images[0]}`
        : '',
      isActive: formData.status === 'active',
      materials: formData.materials,
      colors: formData.colors || [''],
      sizes: formData.sizes || ['']
    })

    // Construire l'objet API final avec les champs additionnels
    const apiData: Record<string, unknown> = {
      ...mappedData,
      // Renommer pour correspondre au schéma API (snake_case → camelCase pour certains)
      basePrice: mappedData.base_price,
      minQuantity: mappedData.min_quantity,
      maxQuantity: mappedData.max_quantity || undefined,
      isActive: mappedData.is_active,
      image: mappedData.image || undefined,

      // Gallery (images secondaires, non géré par le mapper)
      gallery: formData.images && formData.images.length > 1
        ? formData.images.slice(1).map(publicId => ({
            url: `https://res.cloudinary.com/dsrvzogof/image/upload/${publicId}`,
            type: 'variant' as const
          }))
        : undefined
    }

    // Nettoyer les champs snake_case dupliqués
    delete apiData.base_price
    delete apiData.min_quantity
    delete apiData.max_quantity
    delete apiData.is_active

    // Clean undefined fields
    Object.keys(apiData).forEach(key => {
      if (apiData[key] === undefined) {
        delete apiData[key]
      }
    })

    console.log('📤 [ProductForm] Submitting to API (via mapper):', apiData)
    emit('submit', apiData as unknown as Product)
  } catch (error) {
    console.error('Erreur soumission:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>