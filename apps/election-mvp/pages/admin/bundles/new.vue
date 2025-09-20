<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Nouveau Bundle</h1>
          <p class="text-gray-600">Créer un nouveau pack de campagne pré-configuré</p>
        </div>
        <div class="flex items-center space-x-3">
          <NuxtLink
            to="/admin/bundles"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <Icon name="heroicons:arrow-left" class="w-4 h-4 mr-2" />
            Retour
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Bundle Form -->
    <BundleForm
      :available-products="availableProducts"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { globalNotifications } from '~/composables/useNotifications'
import BundleForm from '~/components/admin/BundleForm.vue'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Head
useHead({
  title: 'Nouveau Bundle | Admin'
})

// Types
interface Product {
  id: string
  name: string
  basePrice: number
  reference?: string
  category_id?: string
}

interface Bundle {
  id?: string
  name: string
  description: string
  targetAudience: 'local' | 'regional' | 'national' | 'universal'
  budgetRange: 'starter' | 'medium' | 'premium' | 'enterprise'
  products: BundleProduct[]
  estimatedTotal: number
  originalTotal?: number
  savings?: number
  popularity: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
}

interface BundleProduct {
  id: string
  name: string
  basePrice: number
  quantity: number
  subtotal: number
}

// Global notifications
const { crudSuccess, crudError } = globalNotifications

// Reactive data
const availableProducts = ref<Product[]>([])

// Methods
const handleSubmit = async (bundle: Bundle) => {
  try {
    const response = await $fetch('/api/bundles', {
      method: 'POST',
      body: bundle
    })

    if (response.success) {
      crudSuccess.created(bundle.name, 'bundle')
      await navigateTo(`/admin/bundles/${response.data.id}`)
    }
  } catch (error: any) {
    console.error('Error creating bundle:', error)
    crudError.created('bundle', error.message || 'Une erreur est survenue lors de la création.')
  }
}

const handleCancel = () => {
  navigateTo('/admin/bundles')
}

// Fetch available products on mount
onMounted(async () => {
  try {
    const response = await $fetch('/api/products')
    if (response.data && response.data.length > 0) {
      availableProducts.value = response.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        basePrice: product.basePrice || 0,
        reference: product.reference,
        category_id: product.category_id
      }))
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    crudError.validation('Impossible de charger les produits disponibles')
  }
})
</script>