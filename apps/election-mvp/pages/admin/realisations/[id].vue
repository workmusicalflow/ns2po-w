<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isNew ? 'Nouvelle Réalisation' : 'Modifier Réalisation' }}
          </h1>
          <p class="text-gray-600">
            {{ isNew ? 'Créer une nouvelle réalisation pour le portfolio' : 'Modifier les informations de la réalisation' }}
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <NuxtLink
            to="/admin/realisations"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4 mr-2" />
            Retour
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <Icon name="heroicons:arrow-path" class="w-8 h-8 animate-spin text-amber-600" />
      <span class="ml-2 text-gray-600">Chargement...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
      <div class="flex">
        <Icon name="heroicons:x-circle" class="w-5 h-5 text-red-400" />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Erreur</h3>
          <p class="mt-1 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Realisation Form -->
    <RealisationForm
      v-else
      :realisation="realisation"
      :available-products="availableProducts"
      :available-categories="availableCategories"
      :available-customization-options="availableCustomizationOptions"
      :is-edit="!isNew"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { globalNotifications } from '~/composables/useNotifications'
import RealisationForm from '~/components/admin/RealisationForm.vue'

// Route params
const route = useRoute()
const router = useRouter()
const realisationId = computed(() => route.params.id as string)
const isNew = computed(() => realisationId.value === 'new')

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: computed(() => isNew.value ? 'Nouvelle Réalisation | Admin' : 'Modifier Réalisation | Admin')
})

// Types
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

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Reactive data
const isLoading = ref(false)
const error = ref('')
const realisation = ref<Realisation | null>(null)
const availableProducts = ref<Product[]>([])
const availableCategories = ref<Category[]>([])
const availableCustomizationOptions = ref<CustomizationOption[]>([])

// Methods
const fetchRealisation = async () => {
  if (isNew.value) return

  isLoading.value = true
  try {
    const response = await $fetch(`/api/realisations/${realisationId.value}`)
    if (response.success && response.data) {
      realisation.value = response.data
    } else {
      error.value = 'Réalisation introuvable'
    }
  } catch (err: any) {
    console.error('Error fetching realisation:', err)
    error.value = err.message || 'Erreur lors du chargement de la réalisation'
  } finally {
    isLoading.value = false
  }
}

const fetchRelatedData = async () => {
  try {
    // Fetch products
    const productsResponse = await $fetch('/api/products')
    if (productsResponse.data && productsResponse.data.length > 0) {
      availableProducts.value = productsResponse.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        reference: product.reference
      }))
    }

    // Fetch categories
    const categoriesResponse = await $fetch('/api/categories')
    if (categoriesResponse.data && categoriesResponse.data.length > 0) {
      availableCategories.value = categoriesResponse.data.map((category: any) => ({
        id: category.id,
        name: category.name
      }))
    }

    // Fetch customization options (fallback if API doesn't exist)
    try {
      const optionsResponse = await $fetch('/api/customization-options')
      if (optionsResponse.data && optionsResponse.data.length > 0) {
        availableCustomizationOptions.value = optionsResponse.data.map((option: any) => ({
          id: option.id,
          name: option.name
        }))
      }
    } catch (error) {
      // Provide fallback customization options
      availableCustomizationOptions.value = [
        { id: 'impression', name: 'Impression' },
        { id: 'broderie', name: 'Broderie' },
        { id: 'serigraphie', name: 'Sérigraphie' },
        { id: 'sublimation', name: 'Sublimation' },
        { id: 'gravure', name: 'Gravure' },
        { id: 'marquage-laser', name: 'Marquage laser' }
      ]
    }
  } catch (error) {
    console.error('Error fetching related data:', error)
    // Provide minimal fallback data
    availableProducts.value = []
    availableCategories.value = [
      { id: 'textile', name: 'Textile' },
      { id: 'papeterie', name: 'Papeterie' },
      { id: 'signalisation', name: 'Signalisation' },
      { id: 'multimedia', name: 'Multimédia' },
      { id: 'accessoires', name: 'Accessoires' }
    ]
    availableCustomizationOptions.value = [
      { id: 'impression', name: 'Impression' },
      { id: 'broderie', name: 'Broderie' },
      { id: 'serigraphie', name: 'Sérigraphie' }
    ]
  }
}

const handleSubmit = async (realisationData: Realisation) => {
  try {
    if (isNew.value) {
      // Create new realisation
      const response = await $fetch('/api/realisations', {
        method: 'POST',
        body: realisationData
      })

      if (response.success) {
        crudSuccess.created(realisationData.title, 'réalisation')
        await navigateTo(`/admin/realisations/${response.data.id}`)
      }
    } else {
      // Update existing realisation
      const response = await $fetch(`/api/realisations/${realisationId.value}`, {
        method: 'PUT',
        body: realisationData
      })

      if (response.success) {
        crudSuccess.updated(realisationData.title, 'réalisation')
        realisation.value = response.data
      }
    }
  } catch (error: any) {
    console.error('Error saving realisation:', error)
    const action = isNew.value ? 'création' : 'modification'
    crudError.validation(`Une erreur est survenue lors de la ${action} de la réalisation: ${error.message || 'Erreur inconnue'}`)
  }
}

const handleCancel = () => {
  navigateTo('/admin/realisations')
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    fetchRealisation(),
    fetchRelatedData()
  ])
})

// Watch for route changes
watch(() => route.params.id, async (newId) => {
  if (newId && newId !== 'new') {
    await fetchRealisation()
  } else {
    realisation.value = null
  }
})
</script>