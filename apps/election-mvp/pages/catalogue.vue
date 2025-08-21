<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Catalogue de produits
        </h1>
        <p class="text-gray-600">
          Découvrez notre gamme complète de produits personnalisables
        </p>
      </div>

      <!-- Search Bar -->
      <Card class="mb-6">
        <div class="flex gap-4">
          <div class="flex-1">
            <Input 
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un produit..."
              class="w-full"
            />
          </div>
          <Button @click="resetFilters" variant="outline">
            Réinitialiser
          </Button>
        </div>
      </Card>

      <!-- Filters -->
      <Card class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select 
              v-model="selectedCategory"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Toutes catégories</option>
              <option 
                v-for="category in activeCategories" 
                :key="category.id"
                :value="category.slug"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Prix maximum (FCFA)
            </label>
            <Input 
              v-model="maxPrice"
              type="number"
              placeholder="Prix max"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Quantité minimum
            </label>
            <Input 
              v-model="minQuantity"
              type="number"
              placeholder="Qté min"
            />
          </div>
        </div>
      </Card>

      <!-- Error Message -->
      <div v-if="error" class="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700">{{ error }}</p>
        <Button @click="loadProducts" variant="outline" size="small" class="mt-2">
          Réessayer
        </Button>
      </div>

      <!-- Products Grid -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600">Chargement des produits...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0 && !loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Aucun produit trouvé avec ces critères</p>
        <Button @click="resetFilters" variant="outline" class="mt-4">
          Voir tous les produits
        </Button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <Card 
          v-for="product in filteredProducts" 
          :key="product.id"
          hoverable
          class="overflow-hidden"
        >
          <template #header>
            <div class="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <img 
                v-if="product.image"
                :src="product.image"
                :alt="product.name"
                class="w-full h-full object-cover rounded-lg"
              />
              <div v-else class="text-gray-400 text-4xl">📦</div>
            </div>
          </template>

          <div class="space-y-3">
            <div>
              <h3 class="font-semibold text-gray-900">{{ product.name }}</h3>
              <p class="text-sm text-gray-600">{{ product.category }}</p>
            </div>
            
            <p class="text-sm text-gray-700 line-clamp-2">
              {{ product.description }}
            </p>
            
            <div class="flex justify-between items-center">
              <span class="text-lg font-bold text-blue-600">
                {{ product.basePrice.toLocaleString() }} FCFA
              </span>
              <span class="text-xs text-gray-500">
                Min. {{ product.minQuantity }}
              </span>
            </div>
            
            <div v-if="product.tags && product.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
              <span 
                v-for="tag in product.tags.slice(0, 3)" 
                :key="tag"
                class="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <template #footer>
            <Button 
              @click="addToQuote(product)"
              class="w-full"
            >
              Ajouter au devis
            </Button>
          </template>
        </Card>
      </div>

      <!-- Pagination -->
      <div v-if="filteredProducts.length > 0" class="mt-12 flex justify-center">
        <div class="flex space-x-2">
          <Button variant="outline" size="small" disabled>
            Précédent
          </Button>
          <Button variant="primary" size="small">
            1
          </Button>
          <Button variant="outline" size="small">
            Suivant
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Card, Input } from '@ns2po/ui'
import type { Product } from '@ns2po/types'

useHead({
  title: 'Catalogue - NS2PO Élections',
  meta: [
    {
      name: 'description',
      content: 'Catalogue complet de produits personnalisables pour campagnes électorales en Côte d\'Ivoire'
    }
  ]
})

// Composables
const { 
  activeProducts, 
  activeCategories, 
  loading, 
  error, 
  loadProducts, 
  loadCategories 
} = useProducts()

// État des filtres
const selectedCategory = ref('')
const maxPrice = ref('')
const minQuantity = ref('')
const searchQuery = ref('')

// Computed pour les produits filtrés
const filteredProducts = computed(() => {
  let filtered = activeProducts.value

  // Filtrage par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Filtrage par catégorie
  if (selectedCategory.value) {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }

  // Filtrage par prix maximum
  if (maxPrice.value) {
    filtered = filtered.filter(p => p.basePrice <= Number(maxPrice.value))
  }

  // Filtrage par quantité minimum
  if (minQuantity.value) {
    filtered = filtered.filter(p => p.minQuantity <= Number(minQuantity.value))
  }

  return filtered
})

// Méthodes
const resetFilters = () => {
  selectedCategory.value = ''
  maxPrice.value = ''
  minQuantity.value = ''
  searchQuery.value = ''
}

const addToQuote = (product: Product) => {
  // TODO: Intégrer avec le store Pinia pour le panier
  console.log('Produit ajouté au devis:', product)
  // Naviguer vers la page de devis avec le produit pré-sélectionné
  navigateTo({
    path: '/devis',
    query: { productId: product.id }
  })
}

// Chargement initial
onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadCategories()
  ])
})
</script>