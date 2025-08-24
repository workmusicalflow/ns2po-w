<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Test CMS Airtable - Réalisations</h1>
    
    <div v-if="loading" class="text-blue-600">
      Chargement des réalisations...
    </div>
    
    <div v-else-if="error" class="text-red-600">
      Erreur: {{ error }}
    </div>
    
    <div v-else>
      <h2 class="text-xl font-semibold mb-2">Réalisations en vedette ({{ featuredCount }})</h2>
      <div class="grid gap-4">
        <div v-for="realisation in featured" :key="realisation.id" class="border p-4 rounded">
          <h3 class="font-bold">{{ realisation.title }}</h3>
          <p class="text-sm text-gray-600">{{ realisation.description }}</p>
          <div class="mt-2">
            <strong>Images Cloudinary:</strong>
            <ul class="list-disc list-inside">
              <li v-for="url in realisation.cloudinaryUrls" :key="url" class="text-xs">
                {{ url }}
              </li>
            </ul>
          </div>
          <div class="mt-2">
            <strong>Public IDs:</strong>
            <ul class="list-disc list-inside">
              <li v-for="id in realisation.cloudinaryPublicIds" :key="id" class="text-xs">
                {{ id }}
              </li>
            </ul>
          </div>
          <div class="mt-2 text-sm">
            <span class="bg-green-100 px-2 py-1 rounded">En vedette: {{ realisation.isFeatured ? 'Oui' : 'Non' }}</span>
          </div>
        </div>
      </div>
      
      <h2 class="text-xl font-semibold mb-2 mt-6">Toutes les réalisations ({{ totalCount }})</h2>
      <div class="text-sm text-gray-600">
        {{ realisations.length }} réalisations chargées
      </div>
    </div>
  </div>
</template>

<script setup>
const { realisations, featured, loading, error, featuredCount, totalCount, fetchRealisations } = useRealisations()

// Force le chargement
onMounted(async () => {
  console.log('Test page mounted - fetching realisations')
  await fetchRealisations()
  console.log('Featured realisations:', featured.value)
  console.log('Total realisations:', realisations.value.length)
})
</script>