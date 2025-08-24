<template>
  <div class="min-h-screen bg-background">
    <!-- État de chargement -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <div class="text-center">
        <div class="inline-block w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p class="mt-4 text-gray-600">
          Chargement de la réalisation...
        </p>
      </div>
    </div>

    <!-- Erreur 404 -->
    <div v-else-if="!realisation" class="text-center py-16">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">
        Réalisation non trouvée
      </h1>
      <p class="text-gray-600 mb-8">
        Cette réalisation n'existe pas ou n'est plus disponible.
      </p>
      <div class="space-x-4">
        <Button @click="navigateTo('/realisations')">
          Voir toutes les réalisations
        </Button>
        <Button variant="outline" @click="navigateTo('/')">
          Retour à l'accueil
        </Button>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-else class="container mx-auto px-4 py-8">
      <!-- Breadcrumb -->
      <nav class="mb-8 text-sm">
        <ol class="flex items-center space-x-2">
          <li>
            <NuxtLink to="/" class="text-gray-500 hover:text-gray-700">
              Accueil
            </NuxtLink>
          </li>
          <li class="text-gray-400">/</li>
          <li>
            <NuxtLink to="/realisations" class="text-gray-500 hover:text-gray-700">
              Réalisations
            </NuxtLink>
          </li>
          <li class="text-gray-400">/</li>
          <li class="text-gray-900 font-medium">
            {{ realisation.title }}
          </li>
        </ol>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <!-- Images -->
        <div class="space-y-4">
          <!-- Image principale -->
          <div class="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer group">
            <NuxtImg
              v-if="mainImage"
              :src="mainImage"
              :alt="realisation.title"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="sm:400px md:500px lg:600px"
              @click="handleMainImageClick"
            />
            <div v-else class="flex items-center justify-center h-full">
              <div class="text-gray-400 text-6xl">📸</div>
            </div>
            
            <!-- Overlay d'indication pour le clic -->
            <div v-if="mainImage" class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <div class="bg-white/90 rounded-full p-3 shadow-lg backdrop-blur-sm">
                <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Galerie thumbnails -->
          <div 
            v-if="realisation.cloudinaryUrls && realisation.cloudinaryUrls.length > 1"
            class="grid grid-cols-4 gap-2"
          >
            <button
              v-for="(url, index) in realisation.cloudinaryUrls"
              :key="index"
              @click="setMainImage(url)"
              @dblclick="handleThumbnailDoubleClick(url)"
              :class="[
                'aspect-square bg-gray-200 rounded-md overflow-hidden border-2 transition-colors hover:scale-105 transform',
                url === mainImage ? 'border-accent' : 'border-transparent hover:border-gray-300'
              ]"
              :title="`Clic simple: voir l'image | Double-clic: agrandir`"
            >
              <NuxtImg
                :src="url"
                :alt="`${realisation.title} - Image ${index + 1}`"
                class="w-full h-full object-cover transition-transform duration-200"
                sizes="100px"
              />
            </button>
          </div>
        </div>

        <!-- Informations -->
        <div class="space-y-6">
          <!-- Titre et badge -->
          <div>
            <div class="flex items-start gap-3 mb-2">
              <h1 class="text-3xl font-bold text-text-main">
                {{ realisation.title }}
              </h1>
              <span 
                v-if="realisation.isFeatured"
                class="px-2 py-1 bg-accent text-white text-xs font-medium rounded-full whitespace-nowrap"
              >
                En vedette
              </span>
            </div>
            
            <p v-if="realisation.description" class="text-lg text-gray-600">
              {{ realisation.description }}
            </p>
          </div>

          <!-- Tags -->
          <div v-if="realisation.tags?.length > 0">
            <h3 class="font-medium text-gray-900 mb-3">
              Caractéristiques
            </h3>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="tag in realisation.tags" 
                :key="tag"
                class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Produits associés -->
          <div v-if="relatedProducts.length > 0">
            <h3 class="font-medium text-gray-900 mb-3">
              Produits utilisés ({{ relatedProducts.length }})
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <div 
                v-for="product in relatedProducts.slice(0, 4)"
                :key="product.id"
                class="p-3 border border-gray-200 rounded-lg hover:border-accent transition-colors"
              >
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                    <img 
                      v-if="product.image"
                      :src="product.image"
                      :alt="product.name"
                      class="w-full h-full object-cover rounded-md"
                    >
                    <span v-else class="text-gray-400 text-lg">📦</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm text-gray-900 truncate">
                      {{ product.name }}
                    </p>
                    <p class="text-xs text-gray-600">
                      {{ product.category }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions CTA -->
          <div class="space-y-4 pt-6 border-t border-gray-200">
            <div class="space-y-3">
              <Button 
                size="large" 
                class="w-full"
                @click="handleInspiration"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                S'inspirer de cette réalisation
              </Button>
              
              <div class="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  @click="navigateTo('/catalogue')"
                >
                  Voir le catalogue
                </Button>
                <Button 
                  variant="outline"
                  @click="navigateTo('/contact')"
                >
                  Nous contacter
                </Button>
              </div>
            </div>

            <!-- Informations complémentaires -->
            <div class="text-sm text-gray-600 space-y-1">
              <p>
                ✨ Personnalisation complète avec votre logo et couleurs
              </p>
              <p>
                📞 Conseils gratuits pour votre projet
              </p>
              <p>
                ⚡ Devis instantané en ligne
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Section réalisations similaires -->
      <div v-if="similarRealisations.length > 0" class="mt-16">
        <h2 class="text-2xl font-bold text-text-main mb-8">
          Réalisations similaires
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RealisationCard
            v-for="similar in similarRealisations"
            :key="similar.id"
            :realisation="similar"
            @inspire="handleInspiration"
            @view-details="handleViewDetails"
            @select="handleViewDetails"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@ns2po/ui'
import type { Product, Realisation } from '@ns2po/types'

// Paramètres de la route
const route = useRoute()
const realisationId = route.params.id as string

// État de la page
const loading = ref(true)
const realisation = ref<Realisation | null>(null)
const mainImage = ref<string>('')
const relatedProducts = ref<Product[]>([])
const similarRealisations = ref<Realisation[]>([])

// Composables
const { 
  getRealisationById, 
  getSimilarRealisations,
  fetchRealisations 
} = useRealisations()

const { activeProducts, loadProducts } = useProducts()
const { trackRealisationInteraction, trackUserJourney } = useObservability()
const { openModal } = useImageModal()

// Chargement des données
onMounted(async () => {
  try {
    // Charger les données de base si nécessaire
    await Promise.all([
      fetchRealisations(),
      loadProducts()
    ])

    // Charger la réalisation spécifique
    const loadedRealisation = await getRealisationById(realisationId)
    
    if (loadedRealisation) {
      realisation.value = loadedRealisation
      
      // Image principale (première image ou image par défaut)
      if (loadedRealisation.cloudinaryUrls?.length > 0) {
        mainImage.value = loadedRealisation.cloudinaryUrls[0]
      }
      
      // Charger les produits associés
      if (loadedRealisation.productIds?.length > 0) {
        relatedProducts.value = activeProducts.value.filter(
          product => loadedRealisation.productIds.includes(product.id)
        )
      }
      
      // Charger les réalisations similaires
      similarRealisations.value = getSimilarRealisations(realisationId, 3)
      
      // Tracking
      trackRealisationInteraction('view_detail', {
        realisationId: loadedRealisation.id,
        realisationTitle: loadedRealisation.title
      })

      trackUserJourney('realisation_detail_view', {
        realisationId: loadedRealisation.id,
        hasRelatedProducts: relatedProducts.value.length > 0,
        hasSimilarRealisations: similarRealisations.value.length > 0
      })

      // Mettre à jour le title de la page
      useHead({
        title: `${loadedRealisation.title} - Réalisations NS2PO`,
        meta: [
          {
            name: 'description',
            content: `Découvrez notre réalisation "${loadedRealisation.title}" - ${loadedRealisation.description?.substring(0, 150) || 'Gadgets personnalisés pour campagnes électorales'}`
          },
          {
            property: 'og:title',
            content: `${loadedRealisation.title} - Réalisations NS2PO`
          },
          {
            property: 'og:description',
            content: loadedRealisation.description || 'Inspiration pour vos gadgets électoraux personnalisés'
          },
          {
            property: 'og:image',
            content: mainImage.value
          }
        ]
      })
    } else {
      // 404 - Réalisation non trouvée
      throw createError({
        statusCode: 404,
        statusMessage: 'Réalisation non trouvée'
      })
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la réalisation:', error)
  } finally {
    loading.value = false
  }
})

// Actions
const setMainImage = (url: string) => {
  mainImage.value = url
  trackRealisationInteraction('gallery_interaction', {
    realisationId: realisation.value!.id,
    realisationTitle: realisation.value!.title,
    imageUrl: url
  })
}

// Gestionnaire de clic sur l'image principale
const handleMainImageClick = () => {
  if (mainImage.value && realisation.value) {
    // Utiliser une version haute qualité pour le modal
    const fullImageUrl = mainImage.value.replace(
      /\/w_\d+,h_\d+,c_\w+/,
      '/w_1200,h_1200,c_fit'
    )
    
    trackRealisationInteraction('image_modal_open', {
      realisationId: realisation.value.id,
      realisationTitle: realisation.value.title,
      imageUrl: mainImage.value,
      sourceLocation: 'detail_page_main_image'
    })
    
    openModal(
      fullImageUrl,
      realisation.value.title,
      realisation.value.title
    )
  }
}

// Gestionnaire de double-clic sur les thumbnails
const handleThumbnailDoubleClick = (url: string) => {
  if (realisation.value) {
    // Utiliser une version haute qualité pour le modal
    const fullImageUrl = url.replace(
      /\/w_\d+,h_\d+,c_\w+/,
      '/w_1200,h_1200,c_fit'
    )
    
    trackRealisationInteraction('image_modal_open', {
      realisationId: realisation.value.id,
      realisationTitle: realisation.value.title,
      imageUrl: url,
      sourceLocation: 'detail_page_thumbnail'
    })
    
    openModal(
      fullImageUrl,
      `${realisation.value.title} - Image ${realisation.value.cloudinaryUrls?.indexOf(url)! + 1}`,
      realisation.value.title
    )
  }
}

const handleInspiration = (targetRealisation?: Realisation) => {
  const realisationToUse = targetRealisation || realisation.value
  if (!realisationToUse) return

  const productId = realisationToUse.productIds[0]
  
  trackRealisationInteraction('inspire_click', {
    realisationId: realisationToUse.id,
    realisationTitle: realisationToUse.title,
    sourceLocation: 'detail_page'
  })

  if (productId) {
    navigateTo(`/catalogue?inspiredBy=${realisationToUse.id}&product=${productId}`)
  } else {
    navigateTo(`/catalogue?inspiredBy=${realisationToUse.id}`)
  }
}

const handleViewDetails = (targetRealisation: Realisation) => {
  navigateTo(`/realisations/${targetRealisation.id}`)
}
</script>