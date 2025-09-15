<template>
  <div
    :class="[
      'relative overflow-hidden',
      aspectRatio,
      roundedClass,
      { 'bg-gray-100 animate-pulse': isLoading },
    ]"
    :style="{ backgroundColor: isLoading ? '#f3f4f6' : 'transparent' }"
  >
    <!-- Image principale -->
    <img
      v-if="optimizedProps.src && !isLoading"
      v-bind="optimizedProps"
      :class="[
        'w-full h-full object-cover transition-all duration-300',
        {
          'group-hover:scale-105': hover,
          'opacity-0': imageLoading,
        },
      ]"
      @load="handleImageLoad"
      @error="handleImageError"
    >

    <!-- Placeholder en cas d'échec de chargement -->
    <div
      v-if="hasError || (!publicId && !isLoading)"
      class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
    >
      <div class="text-center text-gray-400">
        <svg
          class="w-12 h-12 mx-auto mb-2"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clip-rule="evenodd"
          />
        </svg>
        <p class="text-sm">
          {{ fallbackText }}
        </p>
      </div>
    </div>

    <!-- Overlay optionnel -->
    <div
      v-if="overlay"
      class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    />

    <!-- Badge optionnel -->
    <div v-if="badge" class="absolute top-2 left-2">
      <span
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
        :class="badgeClasses"
      >
        {{ badge }}
      </span>
    </div>

    <!-- Indicateur de chargement -->
    <div
      v-if="imageLoading"
      class="absolute inset-0 flex items-center justify-center bg-gray-50"
    >
      <div
        class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { CloudinaryPreset } from "~/composables/useCloudinaryImage";

interface Props {
  publicId: string;
  preset: keyof CloudinaryPreset;
  alt: string;
  aspectRatio?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  hover?: boolean;
  overlay?: boolean;
  badge?: string;
  badgeVariant?:
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error";
  fallbackText?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: "aspect-[4/3]",
  rounded: "md",
  hover: false,
  overlay: false,
  badgeVariant: "primary",
  fallbackText: "Image non disponible",
  loading: false,
});

// Composables
const { getResponsiveProps, isValidPublicId } = useCloudinaryImage();

// État local
const imageLoading = ref(true);
const hasError = ref(false);
const isLoading = computed(() => props.loading);

// Props optimisées pour l'image
const optimizedProps = computed(() => {
  if (!props.publicId || !isValidPublicId(props.publicId)) {
    return { src: "", alt: props.alt };
  }

  return getResponsiveProps(props.publicId, props.preset, props.alt);
});

// Classes CSS dynamiques
const roundedClass = computed(() => {
  const roundedMap = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };
  return roundedMap[props.rounded];
});

const badgeClasses = computed(() => {
  const variantMap = {
    primary: "bg-primary/90 text-white",
    secondary: "bg-gray-600/90 text-white",
    accent: "bg-accent/90 text-white",
    success: "bg-green-600/90 text-white",
    warning: "bg-yellow-600/90 text-white",
    error: "bg-red-600/90 text-white",
  };
  return variantMap[props.badgeVariant];
});

// Gestionnaires d'événements
const handleImageLoad = () => {
  imageLoading.value = false;
  hasError.value = false;
};

const handleImageError = () => {
  imageLoading.value = false;
  hasError.value = true;
};

// Initialisation
onMounted(() => {
  if (!props.publicId || !isValidPublicId(props.publicId)) {
    imageLoading.value = false;
    hasError.value = true;
  }
});
</script>
