<template>
  <div class="step-choice-mode">
    <div class="text-center mb-8">
      <h2 class="text-2xl md:text-3xl font-bold text-accent mb-3">
        Comment souhaitez-vous procéder ?
      </h2>
      <p class="text-gray-600">
        Choisissez un pack prêt à l'emploi ou créez votre sélection sur mesure
      </p>
    </div>

    <div class="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <!-- Option Custom (REPOSITIONNÉ EN PREMIER) -->
      <button
        :class="[
          'choice-card group relative overflow-hidden rounded-xl p-6 transition-all duration-300',
          'bg-white border-2 hover:border-primary hover:shadow-lg cursor-pointer',
          'min-h-[200px] flex flex-col items-center justify-center text-center'
        ]"
        @click="$emit('select-mode', 'custom')"
      >
        <!-- Icône -->
        <div class="w-16 h-16 mb-4 bg-accent/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>

        <h3 class="text-lg font-bold text-accent mb-2">
          Sur Mesure
        </h3>
        <p class="text-sm text-gray-600">
          Composez votre sélection produit par produit selon vos besoins
        </p>

        <!-- Badge recommandé -->
        <span class="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
          Recommandé
        </span>
      </button>

      <!-- Option Bundle (REPOSITIONNÉ EN SECOND) -->
      <button
        :class="[
          'choice-card group relative overflow-hidden rounded-xl p-6 transition-all duration-300',
          'bg-white border-2 hover:border-primary hover:shadow-lg cursor-pointer',
          'min-h-[200px] flex flex-col items-center justify-center text-center'
        ]"
        @click="$emit('select-mode', 'bundle')"
      >
        <!-- Icône -->
        <div class="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>

        <h3 class="text-lg font-bold text-accent mb-2">
          Packs Campagne
        </h3>
        <p class="text-sm text-gray-600">
          Solutions clés en main optimisées pour chaque niveau d'élection
        </p>
      </button>
    </div>

    <!-- Message d'aide mobile -->
    <div class="mt-6 text-center text-sm text-gray-500 md:hidden">
      <p>👆 Tapez pour choisir votre mode</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'select-mode': [mode: 'bundle' | 'custom']
}>()
</script>

<style scoped>
.choice-card {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: hover) {
  .choice-card:hover {
    transform: translateY(-2px);
  }
}
</style>