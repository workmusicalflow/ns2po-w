<template>
  <div class="bg-gray-50 p-8">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-heading font-bold text-text-main mb-8">
        Sélection personnalisée
      </h1>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p class="text-text-main/70 mb-4">
          Créez votre devis personnalisé en sélectionnant les produits qui correspondent exactement à vos besoins.
        </p>

        <div class="flex gap-4">
          <button
            class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
            @click="navigateToContact"
          >
            Demander un devis personnalisé
          </button>

          <NuxtLink
            to="/devis"
            class="bg-gray-100 text-text-main px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            Retour aux packs
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Sélection personnalisée - NS2PO',
  description: 'Créez votre devis personnalisé pour votre campagne électorale'
})

function navigateToContact() {
  navigateTo({
    path: '/contact',
    query: {
      type: 'quote',
      mode: 'scratch'
    }
  })
}
</script>
