<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-white">
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
            <div class="text-blue-600 text-4xl mb-2">
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
            <div class="text-green-600 text-4xl mb-2">
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
            <div class="text-orange-600 text-4xl mb-2">
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

useHead({
  title: 'NS2PO Élections - Gadgets personnalisés pour campagnes politiques',
  meta: [
    {
      name: 'description',
      content: 'Plateforme ivoirienne de devis et commande de gadgets personnalisés pour campagnes électorales. Textiles, goodies, EPI avec impression de logos.'
    }
  ]
})
</script>