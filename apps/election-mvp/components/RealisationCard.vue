<template>
  <article
    ref="cardRef"
    data-testid="realisation-card"
    :class="[
      'group relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg',
      'transition-all duration-300 cursor-pointer',
      'aspect-square',
    ]"
    @click="handleClick"
  >
    <!-- Image principale avec overlay gradué -->
    <div class="relative h-full overflow-hidden">
      <NuxtImg
        v-if="
          realisation.cloudinaryUrls && realisation.cloudinaryUrls.length > 0
        "
        :src="realisation.cloudinaryUrls[0]"
        :alt="realisation.title"
        :preset="variant === 'compact' ? 'thumbnail' : 'realisationHero'"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
        loading="lazy"
        placeholder
        :sizes="sizes"
        @click.stop="handleImageClick"
      />

      <!-- Fallback si pas d'image -->
      <div
        v-else
        class="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20"
      >
        <svg
          class="h-12 w-12 text-primary/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <!-- Overlay gradué pour le texte -->
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <!-- Badge "En vedette" -->
      <div
        v-if="realisation.isFeatured && showFeaturedBadge"
        class="absolute left-3 top-3 rounded-full bg-safety px-2 py-1 text-xs font-medium text-black"
      >
        ⭐ En vedette
      </div>

      <!-- Tags (limités à 2 visibles) -->
      <div
        v-if="realisation.tags.length > 0 && showTags"
        class="absolute right-3 top-3 flex flex-wrap gap-1"
      >
        <span
          v-for="tag in realisation.tags.slice(0, 2)"
          :key="tag"
          class="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm"
        >
          {{ tag }}
        </span>
        <span
          v-if="realisation.tags.length > 2"
          class="rounded-full bg-white/90 px-2 py-1 text-xs font-medium text-gray-500 backdrop-blur-sm"
        >
          +{{ realisation.tags.length - 2 }}
        </span>
      </div>
    </div>

    <!-- Contenu textuel (overlay en bas) -->
    <div
      :class="[
        'absolute bottom-0 left-0 right-0 p-4 text-white',
        'transform translate-y-2 opacity-0 transition-all duration-300',
        'group-hover:translate-y-0 group-hover:opacity-100',
        variant === 'compact' ? 'p-3' : 'p-4',
      ]"
    >
      <h3
        :class="[
          'font-heading font-semibold leading-tight',
          variant === 'compact' ? 'text-sm' : 'text-lg',
        ]"
      >
        {{ realisation.title }}
      </h3>

      <p
        v-if="realisation.description && variant !== 'compact'"
        class="mt-1 line-clamp-2 text-sm opacity-90"
      >
        {{ realisation.description }}
      </p>

      <!-- Compteur de produits liés -->
      <div
        v-if="realisation.productIds.length > 0"
        class="mt-2 flex items-center gap-1 text-xs opacity-75"
      >
        <svg
          class="h-3 w-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <span>{{ realisation.productIds.length }} produit{{
          realisation.productIds.length > 1 ? "s" : ""
        }}</span>
      </div>
    </div>

    <!-- Actions CTA (visibles au hover) -->
    <div
      class="absolute bottom-4 right-4 flex flex-col gap-2 transform translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
    >
      <!-- Bouton S'inspirer -->
      <button
        class="rounded-full bg-accent p-2 shadow-lg hover:bg-accent/90 transition-colors"
        title="S'inspirer de cette réalisation"
        @click.stop="handleInspiration"
      >
        <svg
          class="h-4 w-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </button>

      <!-- Bouton Voir détails -->
      <button
        class="rounded-full bg-white p-2 shadow-lg hover:bg-gray-50 transition-colors"
        title="Voir les détails"
        @click.stop="handleClick"
      >
        <svg
          class="h-4 w-4 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from "vue";
import type { Realisation } from "@ns2po/types";

interface EnrichedRealisation extends Realisation {
  readonly cloudinaryUrls?: readonly string[];
}

interface Props {
  realisation: EnrichedRealisation;
  variant?: "default" | "compact";
  showFeaturedBadge?: boolean;
  showTags?: boolean;
  sizes?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  showFeaturedBadge: true,
  showTags: true,
  sizes: "sm:400px md:500px lg:600px",
});

const emit = defineEmits<{
  select: [realisation: EnrichedRealisation];
  inspire: [realisation: EnrichedRealisation];
  "view-details": [realisation: EnrichedRealisation];
  click: [realisation: EnrichedRealisation];
}>();

// Référence du composant pour les interactions
const cardRef = ref<HTMLElement>();

// Destructuration réactive
const { realisation, variant } = toRefs(props);

// Gestionnaire de clic principal
const handleClick = () => {
  trackRealisationInteraction("click", {
    realisationId: realisation.value.id,
    realisationTitle: realisation.value.title,
    variant: variant.value,
  });
  emit("click", realisation.value);
  emit("view-details", realisation.value);
};

// Gestionnaire d'inspiration
const handleInspiration = () => {
  trackRealisationInteraction("inspire", {
    realisationId: realisation.value.id,
    realisationTitle: realisation.value.title,
    variant: variant.value,
  });
  emit("inspire", realisation.value);
};

// Gestionnaire de clic sur l'image pour ouvrir le modal
const handleImageClick = () => {
  if (
    realisation.value.cloudinaryUrls &&
    realisation.value.cloudinaryUrls.length > 0
  ) {
    // Utiliser une version haute qualité pour le modal
    const fullImageUrl = realisation.value.cloudinaryUrls[0].replace(
      /\/w_\d+,h_\d+,c_fill/,
      "/w_1200,h_1200,c_fit"
    );

    trackRealisationInteraction("image_view", {
      realisationId: realisation.value.id,
      realisationTitle: realisation.value.title,
      variant: variant.value,
    });

    openModal(fullImageUrl, realisation.value.title, realisation.value.title);
  }
};

// Composables
const { trackRealisationInteraction } = useObservability();
const { openModal } = useImageModal();

// Suivre les clics pour l'analytique
watch(
  () => realisation.value,
  (newRealisation) => {
    if (newRealisation) {
      trackRealisationInteraction("view", {
        realisationId: newRealisation.id,
        realisationTitle: newRealisation.title,
        variant: variant.value,
      });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
