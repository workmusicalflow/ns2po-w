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
        
        <!-- Message d'inspiration si arrivé via une réalisation -->
        <div 
          v-if="inspirationContext"
          class="mt-4 p-4 bg-accent/10 border border-accent/20 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <div>
              <p class="font-medium text-accent">
                Inspiré par "{{ inspirationContext.realisationTitle }}"
              </p>
              <p class="text-sm text-gray-600">
                Explorez nos produits similaires pour créer votre propre réalisation
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Section "Inspirez-vous" si contexte d'inspiration -->
      <div v-if="inspirationContext || inspirationLoading" class="mb-8">
        <Card class="bg-gradient-to-r from-accent/5 to-primary/5 border-accent/20">
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-text-main mb-2">
              💡 Inspirez-vous de nos réalisations
            </h2>
            <p class="text-gray-600 text-sm">
              Ces créations pourraient vous donner des idées pour votre projet
            </p>
          </div>
          
          <!-- État de chargement -->
          <div v-if="inspirationLoading" class="flex justify-center py-8">
            <div class="inline-block w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p class="ml-3 text-gray-600 text-sm">
              Chargement des suggestions...
            </p>
          </div>
          
          <!-- Suggestions de réalisations -->
          <div v-else-if="suggestedRealisations.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RealisationCard
              v-for="realisation in suggestedRealisations.slice(0, 3)"
              :key="realisation.id"
              :realisation="realisation"
              :show-related-products="false"
              :max-tags="2"
              class="transform scale-95"
              @inspire="handleRealisationInspiration"
              @view-details="handleViewRealisationDetails"
              @select="handleViewRealisationDetails"
            />
          </div>
          
          <!-- Message si pas de suggestions -->
          <div v-else-if="inspirationContext && suggestedRealisations.length === 0" class="text-center py-6">
            <p class="text-gray-600 text-sm mb-4">
              Aucune réalisation similaire trouvée pour le moment
            </p>
            <Button variant="outline" size="small" @click="navigateTo('/realisations')">
              Voir toutes nos réalisations
            </Button>
          </div>
        </Card>
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
          <Button variant="outline" @click="resetFilters">
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
              <option value="">
                Toutes catégories
              </option>
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
        <p class="text-red-700">
          {{ error }}
        </p>
        <Button variant="outline" size="small" class="mt-2" @click="loadProducts">
          Réessayer
        </Button>
      </div>

      <!-- Products Grid -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p class="mt-4 text-gray-600">
          Chargement des produits...
        </p>
      </div>

      <div v-else-if="filteredProducts.length === 0 && !loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">
          Aucun produit trouvé avec ces critères
        </p>
        <Button variant="outline" class="mt-4" @click="resetFilters">
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
              >
              <div v-else class="text-gray-400 text-4xl">
                📦
              </div>
            </div>
          </template>

          <div class="space-y-3">
            <div>
              <h3 class="font-semibold text-gray-900">
                {{ product.name }}
              </h3>
              <p class="text-sm text-gray-600">
                {{ product.category }}
              </p>
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
              class="w-full"
              @click="addToQuote(product)"
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
import { ref, computed, onMounted } from 'vue'
import { Button, Card, Input } from '@ns2po/ui'
import type { Product } from '@ns2po/types'
import { useProducts } from '../composables/useProducts'

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
  // Store the selected product in sessionStorage for quote generation
  try {
    sessionStorage.setItem('selectedProduct', JSON.stringify({
      id: product.id,
      name: product.name,
      category: product.category,
      basePrice: product.basePrice,
      image: product.image,
      addedAt: new Date().toISOString()
    }))
    
    console.log('Produit ajouté au devis:', product)
    
    // Navigate to quote page with product pre-selected
    navigateTo({
      path: '/devis',
      query: { productId: product.id }
    })
  } catch (error) {
    console.error('Erreur lors de l\'ajout au devis:', error)
    // Fallback: navigate without storing in sessionStorage
    navigateTo({
      path: '/devis',
      query: { productId: product.id }
    })
  }
}

// Gestion du contexte d'inspiration
const route = useRoute()
const inspirationContext = ref(null)
const suggestedRealisations = ref([])
const inspirationLoading = ref(false)

// Composable pour les réalisations
const { getInspirationSuggestions, getRealisation } = useRealisations()

// Initialisation du contexte d'inspiration
const initInspirationContext = async () => {
  const inspiredBy = route.query.inspiredBy as string
  if (inspiredBy) {
    inspirationLoading.value = true
    try {
      const realisation = await getRealisation(inspiredBy)
      if (realisation) {
        inspirationContext.value = {
          realisationId: realisation.id,
          realisationTitle: realisation.title
        }
        
        // Suggestions d'inspiration basées sur cette réalisation
        const productId = route.query.product as string
        suggestedRealisations.value = getInspirationSuggestions(
          productId,
          realisation.categoryIds[0],
          realisation.tags
        )
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contexte d\'inspiration:', error)
      // En cas d'erreur, on cache la section inspiration
      inspirationContext.value = null
    } finally {
      inspirationLoading.value = false
    }
  }
}

// Gestionnaires d'événements pour les réalisations
const handleRealisationInspiration = (realisation) => {
  // Redirection vers le catalogue avec contexte d'inspiration mis à jour
  const productId = realisation.productIds[0]
  if (productId) {
    navigateTo(`/catalogue?inspiredBy=${realisation.id}&product=${productId}`)
  } else {
    navigateTo(`/catalogue?inspiredBy=${realisation.id}`)
  }
}

const handleViewRealisationDetails = (realisation) => {
  navigateTo(`/realisations/${realisation.id}`)
}

// Chargement initial
onMounted(async () => {
  await Promise.all([
    loadProducts(),
    loadCategories(),
    initInspirationContext()
  ])
})
</script>