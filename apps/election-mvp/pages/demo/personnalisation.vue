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
              <img 
                v-if="product.image" 
                :src="product.image" 
                :alt="product.name"
                class="w-full h-32 object-cover"
              >
              <div v-else class="w-full h-32 bg-gray-200 flex items-center justify-center">
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

// Configuration de la page
definePageMeta({
  title: 'Démo Personnalisation - NS2PO',
  description: 'Testez la personnalisation de produits avec prévisualisation temps réel'
})

// Produits de démonstration
const demoProducts: Product[] = [
  {
    id: 'demo-tshirt',
    name: 'T-shirt Classique',
    category: 'TEXTILE',
    basePrice: 5000,
    minQuantity: 10,
    maxQuantity: 1000,
    description: 'T-shirt 100% coton, disponible en plusieurs couleurs',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center',
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
    image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=400&fit=crop&crop=center',
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
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop&crop=center',
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
  console.log('Personnalisation mise à jour:', customization)
}

const handleCustomizationSave = (customization: ProductCustomization) => {
  console.log('Personnalisation sauvegardée:', customization)
  
  // Afficher une notification de succès
  alert('Personnalisation sauvegardée avec succès !')
  
  // En production, on pourrait sauvegarder en base de données
  // ou rediriger vers la page de devis
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