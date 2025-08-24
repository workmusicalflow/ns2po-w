<template>
  <div class="min-h-screen bg-background">
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-text-main mb-2">
          Nos Réalisations
        </h1>
        <p class="text-gray-600">
          Découvrez nos créations réalisées pour des campagnes électorales et inspirez-vous pour votre projet
        </p>
      </div>

      <!-- Filtres -->
      <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <option value="textile">
              Textiles
            </option>
            <option value="gadget">
              Gadgets
            </option>
            <option value="epi">
              EPI
            </option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <select 
            v-model="selectedTag"
            class="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">
              Tous tags
            </option>
            <option v-for="tag in availableTags" :key="tag" :value="tag">
              {{ tag }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Affichage
          </label>
          <div class="flex gap-2">
            <Button 
              :variant="showFeaturedOnly ? 'primary' : 'outline'"
              size="small"
              @click="showFeaturedOnly = !showFeaturedOnly"
            >
              En vedette
            </Button>
            <Button 
              variant="outline"
              size="small"
              @click="resetFilters"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      <!-- Grille des réalisations -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="mt-4 text-gray-600">
          Chargement des réalisations...
        </p>
      </div>

      <div v-else-if="filteredRealisations.length === 0" class="text-center py-12">
        <p class="text-gray-600 text-lg">
          Aucune réalisation trouvée avec ces critères
        </p>
        <Button variant="outline" class="mt-4" @click="resetFilters">
          Voir toutes les réalisations
        </Button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RealisationCard
          v-for="realisation in filteredRealisations"
          :key="realisation.id"
          :realisation="realisation"
          @inspire="handleInspiration"
          @view-details="handleViewDetails"
          @select="handleViewDetails"
        />
      </div>

      <!-- Pagination (futur) -->
      <div v-if="filteredRealisations.length > 0" class="mt-12 text-center">
        <p class="text-gray-600">
          {{ filteredRealisations.length }} réalisation{{ filteredRealisations.length > 1 ? 's' : '' }} affichée{{ filteredRealisations.length > 1 ? 's' : '' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@ns2po/ui'
import type { Realisation } from '@ns2po/types'

useHead({
  title: 'Nos Réalisations - NS2PO Élections',
  meta: [
    {
      name: 'description',
      content: 'Découvrez nos réalisations de gadgets personnalisés pour campagnes électorales en Côte d\'Ivoire. Inspirez-vous de nos créations pour votre projet.'
    }
  ]
})

// État des filtres
const selectedCategory = ref('')
const selectedTag = ref('')
const showFeaturedOnly = ref(false)

// Composables
const { 
  realisations, 
  featured,
  loading, 
  error,
  fetchRealisations 
} = useRealisations()

// Chargement initial
onMounted(() => {
  fetchRealisations()
})

// Tags disponibles pour les filtres
const availableTags = computed(() => {
  if (!realisations.value?.length) return []
  
  const allTags = realisations.value.flatMap(r => r.tags)
  return [...new Set(allTags)].sort()
})

// Réalisations filtrées
const filteredRealisations = computed(() => {
  let filtered = showFeaturedOnly.value ? featured.value : realisations.value

  // Filtrage par catégorie
  if (selectedCategory.value) {
    filtered = filtered.filter(r => 
      r.categoryIds.some(catId => 
        catId.toLowerCase().includes(selectedCategory.value.toLowerCase())
      )
    )
  }

  // Filtrage par tag
  if (selectedTag.value) {
    filtered = filtered.filter(r => 
      r.tags.some(tag => 
        tag.toLowerCase().includes(selectedTag.value.toLowerCase())
      )
    )
  }

  return filtered
})

// Actions
const resetFilters = () => {
  selectedCategory.value = ''
  selectedTag.value = ''
  showFeaturedOnly.value = false
}

const handleInspiration = (realisation: Realisation) => {
  // Redirection vers le catalogue avec contexte d'inspiration
  const productId = realisation.productIds[0]
  if (productId) {
    navigateTo(`/catalogue?inspiredBy=${realisation.id}&product=${productId}`)
  } else {
    navigateTo(`/catalogue?inspiredBy=${realisation.id}`)
  }
}

const handleViewDetails = (realisation: Realisation) => {
  navigateTo(`/realisations/${realisation.id}`)
}
</script>