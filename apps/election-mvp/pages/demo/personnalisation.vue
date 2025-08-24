<template>
  <div class="demo-page">
    <div class="container mx-auto px-4 py-8">
      <!-- En-tête -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">
          Démo - Personnalisation de Produits
        </h1>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Testez notre système de personnalisation avec prévisualisation en temps réel. 
          Ajoutez votre logo, du texte et choisissez les couleurs.
        </p>
      </div>

      <!-- Sélecteur de produit -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">
          Choisissez un produit
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            v-for="product in demoProducts"
            :key="product.id"
            :class="[
              'product-card',
              { 'product-card--selected': selectedProduct?.id === product.id }
            ]"
            @click="selectedProduct = product"
          >
            <div class="product-image">
              <AdvancedResponsiveImage
                v-if="product.image"
                :public-id-or-url="getPublicIdFromProduct(product)"
                :alt="product.name"
                context="product"
                :options="{ height: 128, crop: 'fill', quality: 'auto' }"
                img-class="w-full h-32 object-cover rounded-t-lg"
                container-class="w-full h-32 relative overflow-hidden rounded-t-lg"
                root-margin="100px"
                custom-sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                :show-debug-info="false"
              />
              <div v-else class="w-full h-32 bg-gray-200 flex items-center justify-center rounded-t-lg">
                <span class="text-gray-500">{{ product.name }}</span>
              </div>
            </div>
            <div class="product-info">
              <h3 class="font-medium">
                {{ product.name }}
              </h3>
              <p class="text-sm text-gray-500">
                {{ product.category }}
              </p>
              <p class="text-sm font-semibold text-blue-600">
                {{ formatPrice(product.basePrice) }} FCFA
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Composant de personnalisation -->
      <div v-if="selectedProduct" class="mb-8">
        <ProductPreview
          :product="selectedProduct"
          @customization:change="handleCustomizationChange"
          @customization:save="handleCustomizationSave"
        />
      </div>

      <!-- Données de debug (en mode développement) -->
      <div v-if="selectedProduct && customizationData" class="debug-panel">
        <details class="bg-gray-100 rounded-lg p-4">
          <summary class="cursor-pointer font-medium text-gray-700 mb-2">
            Données de personnalisation (Debug)
          </summary>
          <pre class="text-xs bg-white p-3 rounded border overflow-auto">{{ JSON.stringify(customizationData, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProductPreview from '../../components/ProductPreview.vue'
import type { Product, ProductCustomization } from '@ns2po/types'
import { useCloudinaryImage } from '~/composables/useCloudinaryImage'

// Configuration de la page
definePageMeta({
  title: 'Démo Personnalisation - NS2PO',
  description: 'Testez la personnalisation de produits avec prévisualisation temps réel'
})

// Composable pour optimiser les images Cloudinary
const { getProductImageUrl } = useCloudinaryImage()

// Helper pour extraire le public_id des produits
const getPublicIdFromProduct = (product: Product): string => {
  // Pour les produits de démo, utiliser directement le public_id
  const publicIds: Record<string, string> = {
    'demo-tshirt': 'ns2po-w/products/textile-tshirt-001.jpg',
    'demo-polo': 'ns2po-w/products/textile-polo-001.jpg',
    'demo-casquette': 'ns2po-w/products/textile-casquette-001.jpg'
  }
  
  return publicIds[product.id] || product.id
}

// Produits de démonstration avec images optimisées
const demoProducts: Product[] = [
  {
    id: 'demo-tshirt',
    name: 'T-shirt Classique',
    category: 'TEXTILE',
    basePrice: 5000,
    minQuantity: 10,
    maxQuantity: 1000,
    description: 'T-shirt 100% coton, disponible en plusieurs couleurs',
    image: getProductImageUrl('ns2po-w/products/textile-tshirt-001.jpg'),
    tags: ['coton', 'unisexe', 'personnalisable'],
    isActive: true
  },
  {
    id: 'demo-polo',
    name: 'Polo Élégant',
    category: 'TEXTILE',
    basePrice: 8000,
    minQuantity: 5,
    maxQuantity: 500,
    description: 'Polo professionnel en coton piqué',
    image: getProductImageUrl('ns2po-w/products/textile-polo-001.jpg'),
    tags: ['polo', 'professionnel', 'coton'],
    isActive: true
  },
  {
    id: 'demo-casquette',
    name: 'Casquette Publicitaire',
    category: 'ACCESSOIRE',
    basePrice: 3000,
    minQuantity: 20,
    maxQuantity: 2000,
    description: 'Casquette ajustable avec visière incurvée',
    image: getProductImageUrl('ns2po-w/products/textile-casquette-001.jpg'),
    tags: ['casquette', 'ajustable', 'visière'],
    isActive: true
  }
]

// État local
const selectedProduct = ref<Product | null>(demoProducts[0] || null)
const customizationData = ref<ProductCustomization | null>(null)

// Méthodes
const handleCustomizationChange = (customization: ProductCustomization) => {
  customizationData.value = customization
  // Customization updated in real-time
}

const handleCustomizationSave = (customization: ProductCustomization) => {
  // Store customization data
  customizationData.value = customization
  
  // Show success notification
  alert('Personnalisation sauvegardée avec succès !')
  
  // In production, could save to database or redirect to quote page
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR').format(price)
}

// Données SEO
useHead({
  title: 'Démo Personnalisation - NS2PO Election MVP',
  meta: [
    {
      name: 'description',
      content: 'Découvrez notre système de personnalisation de produits avec prévisualisation en temps réel. Parfait pour vos campagnes électorales.'
    }
  ]
})
</script>

<style scoped>
.demo-page {
  @apply min-h-screen bg-gray-50;
}

.product-card {
  @apply bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden transition-all hover:shadow-md hover:border-gray-300 text-left;
}

.product-card--selected {
  @apply border-blue-500 ring-2 ring-blue-200;
}

.product-info {
  @apply p-4;
}

.debug-panel {
  @apply mt-12 pt-8 border-t border-gray-200;
}
</style>