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

      <!-- Filters -->
      <Card class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select 
              v-model="selectedCategory"
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Toutes catégories</option>
              <option value="textile">Textile</option>
              <option value="gadget">Gadgets</option>
              <option value="epi">EPI</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Prix maximum
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
          
          <div class="flex items-end">
            <Button @click="resetFilters" variant="outline" class="w-full">
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      <!-- Products Grid -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-600">Chargement des produits...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="text-center py-12">
        <p class="text-gray-600 text-lg">Aucun produit trouvé avec ces critères</p>
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
                {{ product.basePrice }}€
              </span>
              <span class="text-xs text-gray-500">
                Min. {{ product.minQuantity }}
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

useHead({
  title: 'Catalogue - NS2PO Élections',
  meta: [
    {
      name: 'description',
      content: 'Catalogue complet de produits personnalisables pour campagnes électorales en Côte d\'Ivoire'
    }
  ]
})

// État réactif
const loading = ref(true)
const products = ref([])
const selectedCategory = ref('')
const maxPrice = ref('')
const minQuantity = ref('')

// Produits mockés pour la démo
const mockProducts = [
  {
    id: 'prod-1',
    name: 'T-shirt personnalisé',
    category: 'Textile',
    description: 'T-shirt 100% coton avec impression haute qualité de votre logo',
    basePrice: 12,
    minQuantity: 50,
    maxQuantity: 5000,
    image: null
  },
  {
    id: 'prod-2',
    name: 'Casquette brodée',
    category: 'Textile',
    description: 'Casquette réglable avec broderie de votre logo sur le devant',
    basePrice: 8,
    minQuantity: 25,
    maxQuantity: 2000,
    image: null
  },
  {
    id: 'prod-3',
    name: 'Stylo publicitaire',
    category: 'Gadgets',
    description: 'Stylo bille avec impression de votre message publicitaire',
    basePrice: 0.8,
    minQuantity: 100,
    maxQuantity: 10000,
    image: null
  },
  {
    id: 'prod-4',
    name: 'Masque personnalisé',
    category: 'EPI',
    description: 'Masque de protection avec impression de votre logo',
    basePrice: 2.5,
    minQuantity: 100,
    maxQuantity: 5000,
    image: null
  }
]

// Computed pour les produits filtrés
const filteredProducts = computed(() => {
  let filtered = products.value

  if (selectedCategory.value) {
    filtered = filtered.filter(p => 
      p.category.toLowerCase() === selectedCategory.value.toLowerCase()
    )
  }

  if (maxPrice.value) {
    filtered = filtered.filter(p => p.basePrice <= Number(maxPrice.value))
  }

  if (minQuantity.value) {
    filtered = filtered.filter(p => p.minQuantity >= Number(minQuantity.value))
  }

  return filtered
})

// Méthodes
const loadProducts = async () => {
  loading.value = true
  
  try {
    // Simulation d'un appel API
    await new Promise(resolve => setTimeout(resolve, 1000))
    products.value = mockProducts
  } catch (error) {
    console.error('Erreur lors du chargement des produits:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  selectedCategory.value = ''
  maxPrice.value = ''
  minQuantity.value = ''
}

const addToQuote = (product) => {
  // TODO: Intégrer avec le store Pinia pour le panier
  console.log('Produit ajouté au devis:', product)
  // Ici on pourrait naviguer vers la page de devis
  navigateTo('/devis')
}

// Lifecycle
onMounted(() => {
  loadProducts()
})
</script>