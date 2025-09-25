<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            Nouveau Produit
          </h1>
          <p class="text-gray-600">
            Ajouter un nouveau produit au catalogue
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <NuxtLink
            to="/admin/products"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4 mr-2" />
            Retour
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Product Form -->
    <ProductForm
      :categories="categories"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
// Auto-imported via Nuxt 3: globalNotifications
import ProductForm from '../../../components/admin/ProductForm.vue'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Nouveau Produit | Admin'
})

// Types
interface Category {
  id: string
  name: string
}

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
}

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Reactive data
const categories = ref<Category[]>([])

// Import the TanStack Query mutation
const { mutate: createProduct, isPending: isCreating, error: createError } = useCreateProductMutation({
  onSuccess: (newProduct) => {
    crudSuccess.created(newProduct.name, 'produit')
    // Redirection explicite vers la page d'édition du produit créé
    navigateTo(`/admin/products/${newProduct.id}`)
  },
  onError: (error: any) => {
    console.error('Error creating product:', error)
    crudError.created('produit', error.message || 'Une erreur est survenue lors de la création.')
  }
})

// Methods
const handleSubmit = async (product: Product) => {
  if (isCreating.value) return // Prevent double submission
  createProduct(product)
}

const handleCancel = () => {
  navigateTo('/admin/products')
}

// Fetch categories on mount
onMounted(async () => {
  try {
    const response = await $fetch('/api/categories')
    if (response.data && response.data.length > 0) {
      categories.value = response.data
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    // Fallback categories
    categories.value = [
      { id: 'textile', name: 'Textile' },
      { id: 'papeterie', name: 'Papeterie' },
      { id: 'signalisation', name: 'Signalisation' },
      { id: 'multimedia', name: 'Multimédia' },
      { id: 'accessoires', name: 'Accessoires' },
      { id: 'autres', name: 'Autres' }
    ]
  }
})
</script>