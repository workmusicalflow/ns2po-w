<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Nouvelle Réalisation
          </h1>
          <p class="text-gray-600">
            Ajouter une nouvelle réalisation au portfolio
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

    <!-- Realisation Form -->
    <RealisationForm
      :available-products="availableProducts"
      :available-categories="availableCategories"
      :available-customization-options="availableCustomizationOptions"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
// Auto-imported via Nuxt 3: globalNotifications
import RealisationForm from '../../../components/admin/RealisationForm.vue'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Nouvelle Réalisation | Admin'
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
const availableProducts = ref<Product[]>([])
const availableCategories = ref<Category[]>([])
const availableCustomizationOptions = ref<CustomizationOption[]>([])

// Methods
const handleSubmit = async (realisation: Realisation) => {
  try {
    const response = await $fetch('/api/realisations', {
      method: 'POST',
      body: realisation
    })

    if (response.success) {
      crudSuccess.created(realisation.title, 'réalisation')
      await navigateTo(`/admin/realisations/${response.data.id}`)
    }
  } catch (error: any) {
    console.error('Error creating realisation:', error)
    crudError.created('réalisation', error.message || 'Une erreur est survenue lors de la création.')
  }
}

const handleCancel = () => {
  navigateTo('/admin/realisations')
}

// Fetch related data on mount
onMounted(async () => {
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
    crudError.validation('Impossible de charger les données nécessaires')

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
})
</script>