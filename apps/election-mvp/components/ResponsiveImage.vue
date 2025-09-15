<template>
  <NuxtImg
    :src="optimizedSrc"
    :alt="alt"
    :loading="loading"
    :width="width"
    :height="height"
    :placeholder="placeholder"
    :class="[
      'transition-all duration-300',
      imageClasses,
      {
        'group-hover:scale-105': hover,
        'opacity-0': !loaded && !error,
        'opacity-100': loaded,
      },
    ]"
    :sizes="sizes"
    :quality="quality"
    :format="format"
    @load="handleLoad"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { CloudinaryPreset } from "~/composables/useCloudinaryImage";

interface Props {
  publicId: string;
  preset?: keyof CloudinaryPreset;
  alt: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  placeholder?: boolean | string | number[];
  hover?: boolean;
  quality?: number | string;
  format?: string;
  sizes?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  preset: "productCard",
  loading: "lazy",
  placeholder: true,
  hover: false,
  quality: "auto:good",
  format: "auto",
  sizes: "sm:300px md:400px lg:500px",
});

const emit = defineEmits<{
  load: [event: Event];
  error: [event: Event];
}>();

// Composables
const { getOptimizedUrl, presets, isValidPublicId } = useCloudinaryImage();

// État réactif
const loaded = ref(false);
const error = ref(false);

// URL optimisée
const optimizedSrc = computed(() => {
  if (!props.publicId || !isValidPublicId(props.publicId)) {
    return "/placeholder-product.jpg";
  }

  // Si un preset est fourni, on l'utilise pour définir les dimensions
  const presetConfig = props.preset ? presets[props.preset] : {};

  return getOptimizedUrl(props.publicId, {
    width: props.width || presetConfig.width,
    height: props.height || presetConfig.height,
    crop: presetConfig.crop,
    gravity: presetConfig.gravity,
    quality: props.quality || presetConfig.quality,
    format: props.format || presetConfig.format,
  });
});

// Classes CSS dynamiques
const imageClasses = computed(() => {
  const classes = [];

  if (props.class) {
    classes.push(props.class);
  }

  if (error.value) {
    classes.push("bg-gray-200");
  }

  return classes.join(" ");
});

// Gestionnaires d'événements
const handleLoad = (event: Event) => {
  loaded.value = true;
  error.value = false;
  emit("load", event);
};

const handleError = (event: Event) => {
  loaded.value = false;
  error.value = true;
  emit("error", event);
};

// Validation initiale
onMounted(() => {
  if (!props.publicId || !isValidPublicId(props.publicId)) {
    error.value = true;
  }
});
</script>
