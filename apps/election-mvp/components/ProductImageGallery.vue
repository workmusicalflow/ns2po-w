<template>
  <div class="space-y-4">
    <!-- Image principale -->
    <div
      class="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 group"
    >
      <OptimizedImage
        v-if="currentImage"
        :public-id="currentImage"
        preset="realisationHero"
        :alt="alt"
        hover
        overlay
        class="cursor-pointer"
        @click="openLightbox"
      />

      <!-- Contrôles de navigation si plusieurs images -->
      <template v-if="publicIds.length > 1">
        <button
          v-if="currentIndex > 0"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
          aria-label="Image précédente"
          @click="previousImage"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          v-if="currentIndex < publicIds.length - 1"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
          aria-label="Image suivante"
          @click="nextImage"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </template>

      <!-- Indicateur de position -->
      <div
        v-if="publicIds.length > 1"
        class="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm"
      >
        {{ currentIndex + 1 }} / {{ publicIds.length }}
      </div>

      <!-- Badge de zoom -->
      <div
        class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <div
          class="w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Miniatures si plusieurs images -->
    <div
      v-if="publicIds.length > 1 && showThumbnails"
      class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2"
    >
      <button
        v-for="(publicId, index) in publicIds"
        :key="publicId"
        :class="[
          'relative aspect-square rounded-md overflow-hidden transition-all duration-200',
          {
            'ring-2 ring-primary ring-offset-2': index === currentIndex,
            'opacity-60 hover:opacity-80': index !== currentIndex,
            'opacity-100': index === currentIndex,
          },
        ]"
        :aria-label="`Voir l'image ${index + 1}`"
        @click="setCurrentImage(index)"
      >
        <OptimizedImage
          :public-id="publicId"
          preset="thumbnail"
          :alt="`${alt} - Image ${index + 1}`"
          aspect-ratio="aspect-square"
          rounded="md"
        />
      </button>
    </div>

    <!-- Lightbox modal -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        @click="closeLightbox"
      >
        <div class="relative max-w-7xl max-h-full p-4" @click.stop>
          <!-- Bouton de fermeture -->
          <button
            class="absolute -top-2 -right-2 z-10 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
            @click="closeLightbox"
          >
            <svg
              class="w-6 h-6"
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

          <!-- Image haute résolution -->
          <OptimizedImage
            v-if="currentImage"
            :public-id="currentImage"
            preset="preview"
            :alt="alt"
            aspect-ratio="aspect-auto"
            class="max-h-[90vh] max-w-full object-contain"
          />

          <!-- Navigation dans le lightbox -->
          <template v-if="publicIds.length > 1">
            <button
              v-if="currentIndex > 0"
              class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Image précédente"
              @click="previousImage"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              v-if="currentIndex < publicIds.length - 1"
              class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label="Image suivante"
              @click="nextImage"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </template>

          <!-- Indicateur dans le lightbox -->
          <div
            v-if="publicIds.length > 1"
            class="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white rounded-full backdrop-blur-sm"
          >
            {{ currentIndex + 1 }} / {{ publicIds.length }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

interface Props {
  publicIds: string[];
  alt: string;
  showThumbnails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showThumbnails: true,
});

const emit = defineEmits<{
  imageChange: [index: number];
}>();

// État local
const currentIndex = ref(0);
const lightboxOpen = ref(false);

// Image actuelle
const currentImage = computed(() => {
  return props.publicIds[currentIndex.value] || null;
});

// Navigation
const setCurrentImage = (index: number) => {
  if (index >= 0 && index < props.publicIds.length) {
    currentIndex.value = index;
    emit("imageChange", index);
  }
};

const nextImage = () => {
  if (currentIndex.value < props.publicIds.length - 1) {
    setCurrentImage(currentIndex.value + 1);
  }
};

const previousImage = () => {
  if (currentIndex.value > 0) {
    setCurrentImage(currentIndex.value - 1);
  }
};

// Lightbox
const openLightbox = () => {
  lightboxOpen.value = true;
  // Empêcher le défilement du body
  document.body.style.overflow = "hidden";
};

const closeLightbox = () => {
  lightboxOpen.value = false;
  // Réactiver le défilement
  document.body.style.overflow = "";
};

// Navigation au clavier dans le lightbox
const handleKeydown = (event: KeyboardEvent) => {
  if (!lightboxOpen.value) return;

  switch (event.key) {
    case "Escape":
      closeLightbox();
      break;
    case "ArrowLeft":
      previousImage();
      break;
    case "ArrowRight":
      nextImage();
      break;
  }
};

// Nettoyage
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  // S'assurer que le défilement est restauré
  document.body.style.overflow = "";
});
</script>

<style scoped>
/* Animation d'entrée pour le lightbox */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
