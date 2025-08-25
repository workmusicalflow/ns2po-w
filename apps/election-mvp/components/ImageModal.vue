<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        @click="closeModal"
      >
        <!-- Container modal -->
        <div class="relative max-w-7xl max-h-full w-full" @click.stop>
          <!-- Bouton fermeture -->
          <button
            class="absolute -top-12 right-0 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
            title="Fermer (Échap)"
            @click="closeModal"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- Image principale -->
          <div class="relative rounded-lg overflow-hidden bg-white shadow-2xl">
            <NuxtImg
              v-if="imageUrl"
              :src="imageUrl"
              :alt="imageAlt || 'Image agrandie'"
              class="w-full h-auto max-h-[80vh] object-contain"
              :preset="'realisationFull'"
              loading="eager"
              :sizes="'100vw'"
              @load="handleImageLoad"
            />

            <!-- Titre de la réalisation si disponible -->
            <div
              v-if="realisationTitle"
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6"
            >
              <h3 class="text-white text-xl font-heading font-semibold">
                {{ realisationTitle }}
              </h3>
            </div>
          </div>

          <!-- Indicateur de chargement -->
          <div
            v-if="isLoading"
            class="absolute inset-0 flex items-center justify-center bg-white rounded-lg"
          >
            <div class="animate-pulse flex space-x-4">
              <div class="rounded-full bg-primary/20 h-10 w-10" />
              <div class="flex-1 space-y-6 py-1">
                <div class="h-2 bg-primary/20 rounded" />
                <div class="space-y-3">
                  <div class="grid grid-cols-3 gap-4">
                    <div class="h-2 bg-primary/20 rounded col-span-2" />
                    <div class="h-2 bg-primary/20 rounded col-span-1" />
                  </div>
                  <div class="h-2 bg-primary/20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions utilisateur -->
        <div
          class="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm text-center"
        >
          <p>
            Cliquez en dehors ou appuyez sur
            <kbd class="px-2 py-1 bg-white/20 rounded">Échap</kbd> pour fermer
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const { isOpen, imageUrl, imageAlt, realisationTitle, closeModal } =
  useImageModal();

// État de chargement de l'image
const isLoading = ref(true);

const handleImageLoad = () => {
  isLoading.value = false;
};

// Réinitialiser l'état de chargement quand une nouvelle image est ouverte
watch(imageUrl, (newUrl) => {
  if (newUrl) {
    isLoading.value = true;
  }
});
</script>

<style scoped>
/* Style pour le kbd */
kbd {
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo,
    monospace;
  font-size: 0.75rem;
  font-weight: 500;
}

/* Assurer que l'image ne dépasse pas la hauteur viewport */
.max-h-[80vh] {
  max-height: 80vh;
}
</style>
