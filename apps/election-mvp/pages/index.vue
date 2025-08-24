<template>
  <div class="min-h-screen bg-background">
    <!-- Hero Section -->
    <div class="container mx-auto px-4 py-16">
      <div class="text-center mb-16">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">
          NS2PO Élections
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          Plateforme de génération de devis et pré-commande de gadgets personnalisés 
          pour les acteurs politiques ivoiriens
        </p>
      </div>

      <!-- Services Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card class="text-center" hoverable>
          <template #header>
            <div class="text-primary text-4xl mb-2">
              👕
            </div>
            <h3 class="text-xl font-semibold">
              Textiles
            </h3>
          </template>
          <p class="text-gray-600">
            T-shirts, casquettes, polos personnalisés avec vos couleurs et logos
          </p>
          <template #footer>
            <Button variant="outline" class="w-full">
              Voir les produits
            </Button>
          </template>
        </Card>

        <Card class="text-center" hoverable>
          <template #header>
            <div class="text-accent text-4xl mb-2">
              🎁
            </div>
            <h3 class="text-xl font-semibold">
              Gadgets
            </h3>
          </template>
          <p class="text-gray-600">
            Objets promotionnels, goodies et accessoires de campagne
          </p>
          <template #footer>
            <Button variant="outline" class="w-full">
              Découvrir
            </Button>
          </template>
        </Card>

        <Card class="text-center" hoverable>
          <template #header>
            <div class="text-safety text-4xl mb-2">
              🦺
            </div>
            <h3 class="text-xl font-semibold">
              EPI
            </h3>
          </template>
          <p class="text-gray-600">
            Équipements de protection personnalisés pour vos événements
          </p>
          <template #footer>
            <Button variant="outline" class="w-full">
              Explorer
            </Button>
          </template>
        </Card>
      </div>

      <!-- Section Nos Réalisations Phares -->
      <div class="mb-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-text-main mb-4">
            Nos Réalisations Phares
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez nos créations réalisées pour des campagnes électorales et inspirez-vous pour votre projet
          </p>
        </div>

        <!-- Grille des réalisations en vedette -->
        <div v-if="featuredRealisations?.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <RealisationCard
            v-for="realisation in featuredRealisations"
            :key="realisation.id"
            :realisation="realisation"
            @inspire="handleInspiration"
            @view-details="handleViewDetails"
            @select="handleSelectRealisation"
          />
        </div>

        <!-- État de chargement -->
        <div v-else-if="realisationsLoading" class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>

        <!-- Bouton pour voir toutes les réalisations -->
        <div class="text-center">
          <Button 
            variant="outline" 
            @click="navigateTo('/realisations')"
            class="px-8"
          >
            Voir toutes nos réalisations
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="text-center">
        <Card variant="primary" class="max-w-4xl mx-auto">
          <div class="py-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">
              Créez votre devis personnalisé
            </h2>
            <p class="text-lg text-gray-600 mb-8">
              Sélectionnez vos produits, uploadez votre logo et obtenez un devis instantané
            </p>
            <div class="space-x-4">
              <Button size="large" @click="navigateTo('/catalogue')">
                Commencer
              </Button>
              <Button variant="outline" size="large" @click="navigateTo('/contact')">
                Nous contacter
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Card } from '@ns2po/ui'
import type { Realisation } from '@ns2po/types'

// Gestion des réalisations
const { featured: featuredRealisations, loading: realisationsLoading, fetchRealisations } = useRealisations()

// Chargement initial des réalisations
onMounted(async () => {
  await fetchRealisations()
})

// Gestionnaires d'événements pour les réalisations
const handleInspiration = (realisation: Realisation) => {
  // Redirection vers le catalogue avec contexte d'inspiration
  const productId = realisation.productIds[0] // Premier produit associé
  if (productId) {
    navigateTo(`/catalogue?inspiredBy=${realisation.id}&product=${productId}`)
  } else {
    navigateTo(`/catalogue?inspiredBy=${realisation.id}`)
  }
}

const handleViewDetails = (realisation: Realisation) => {
  navigateTo(`/realisations/${realisation.id}`)
}

const handleSelectRealisation = (realisation: Realisation) => {
  handleViewDetails(realisation)
}

useHead({
  title: 'NS2PO Élections - Gadgets personnalisés pour campagnes politiques',
  meta: [
    {
      name: 'description',
      content: 'Plateforme ivoirienne de devis et commande de gadgets personnalisés pour campagnes électorales. Textiles, goodies, EPI avec impression de logos. Découvrez nos réalisations inspirantes.'
    }
  ]
})
</script>