<template>
  <div
    ref="container"
    :class="containerClass"
    :style="containerStyle"
  >
    <!-- Placeholder pendant le chargement -->
    <div
      v-if="!isLoaded && !isInView"
      class="responsive-placeholder"
      :style="placeholderStyle"
    >
      <div class="responsive-spinner">
        <svg
          class="animate-spin h-6 w-6 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>

    <!-- Image responsive avec srcset complet -->
    <picture v-show="isInView">
      <!-- Format AVIF avec srcset -->
      <source
        v-if="responsiveConfig.sources.avif && isInView"
        :srcset="responsiveConfig.sources.avif.srcset"
        :type="responsiveConfig.sources.avif.type"
        :sizes="responsiveConfig.sizes"
      >
      
      <!-- Format WebP avec srcset -->
      <source
        v-if="responsiveConfig.sources.webp && isInView"
        :srcset="responsiveConfig.sources.webp.srcset"
        :type="responsiveConfig.sources.webp.type"
        :sizes="responsiveConfig.sizes"
      >
      
      <!-- Fallback avec srcset pour navigateurs anciens -->
      <img
        v-if="isInView"
        :srcset="responsiveConfig.sources.fallback.srcset"
        :src="responsiveConfig.sources.fallback.src"
        :sizes="responsiveConfig.sizes"
        :alt="alt"
        :class="imgClass"
        loading="lazy"
        decoding="async"
        @load="handleImageLoad"
        @error="handleImageError"
      >
    </picture>

    <!-- État d'erreur -->
    <div
      v-if="hasError"
      class="responsive-error"
      :style="placeholderStyle"
    >
      <div class="text-center text-gray-500">
        <svg class="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-xs">
          Erreur de chargement
        </p>
      </div>
    </div>

    <!-- Debug info (development only) -->
    <div 
      v-if="showDebugInfo && $dev"
      class="debug-info"
    >
      <details class="bg-gray-900 bg-opacity-75 text-white text-xs p-2 rounded">
        <summary class="cursor-pointer">
          Debug Info
        </summary>
        <div class="mt-2 space-y-1">
          <div>Context: {{ context }}</div>
          <div>Breakpoints: {{ responsiveConfig.breakpoints.join(', ') }}px</div>
          <div>Sizes: {{ responsiveConfig.sizes }}</div>
          <div>Formats: AVIF, WebP, Auto</div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { CloudinaryTransformOptions } from '../utils/cloudinary'
import { useCloudinaryImage } from '../composables/useCloudinaryImage'

interface Props {
  src: string
  alt: string
  context?: 'product' | 'gallery' | 'thumbnail' | 'hero'
  options?: CloudinaryTransformOptions
  containerClass?: string
  imgClass?: string
  placeholderColor?: string
  rootMargin?: string
  threshold?: number
  showDebugInfo?: boolean
  customSizes?: string
}

const props = withDefaults(defineProps<Props>(), {
  context: 'product',
  options: () => ({}),
  containerClass: '',
  imgClass: '',
  placeholderColor: '#f3f4f6',
  rootMargin: '50px',
  threshold: 0.1,
  showDebugInfo: false
})

// État du composant
const container = ref<HTMLElement>()
const isInView = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)

// Observer intersection
let observer: IntersectionObserver | null = null

// Configuration responsive complète
const { getOptimizedUrl } = useCloudinaryImage()

// Pour un composant simplifié, on utilise directement l'URL fournie
const responsiveConfig = computed(() => {
  // Si c'est une URL Cloudinary complète, on l'utilise directement
  if (props.src.includes('cloudinary.com')) {
    return {
      sources: {
        fallback: {
          src: props.src,
          srcset: props.src
        }
      },
      sizes: props.customSizes || '100vw',
      breakpoints: [300, 500, 800, 1200]
    }
  }

  // Si c'est un publicId, on génère l'URL optimisée
  const optimizedUrl = getOptimizedUrl(props.src, props.options)
  return {
    sources: {
      fallback: {
        src: optimizedUrl,
        srcset: optimizedUrl
      }
    },
    sizes: props.customSizes || '100vw',
    breakpoints: [300, 500, 800, 1200]
  }
})

// Styles du container et placeholder
const containerStyle = computed(() => {
  const { width, height } = props.options
  const style: Record<string, string> = {}
  
  if (width || height) {
    style.position = 'relative'
    if (width) style.width = typeof width === 'number' ? `${width}px` : width
    if (height) style.height = typeof height === 'number' ? `${height}px` : height
  }
  
  return style
})

const placeholderStyle = computed(() => ({
  backgroundColor: props.placeholderColor,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute' as const,
  top: '0',
  left: '0'
}))

// Gestionnaires d'événements
const handleImageLoad = () => {
  isLoaded.value = true
  hasError.value = false
}

const handleImageError = () => {
  hasError.value = true
  isLoaded.value = false
}

// Callback de l'intersection observer
const handleIntersection = (entries: IntersectionObserverEntry[]) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !isInView.value) {
      isInView.value = true
      // Arrêter l'observation une fois que l'image est visible
      observer?.unobserve(entry.target)
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  if (!container.value) return

  // Vérifier le support de IntersectionObserver
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(handleIntersection, {
      rootMargin: props.rootMargin,
      threshold: props.threshold
    })
    
    observer.observe(container.value)
  } else {
    // Fallback pour navigateurs sans support
    isInView.value = true
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.responsive-placeholder {
  background: linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

.responsive-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.responsive-error {
  border: 2px dashed #e5e7eb;
}

.debug-info {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 10;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Responsive debugging - visible borders in dev mode */
@media (max-width: 640px) {
  .debug-info[data-context="product"] {
    border-left: 3px solid #ef4444; /* Mobile: red */
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .debug-info[data-context="product"] {
    border-left: 3px solid #f59e0b; /* Tablet: yellow */
  }
}

@media (min-width: 1025px) {
  .debug-info[data-context="product"] {
    border-left: 3px solid #10b981; /* Desktop: green */
  }
}
</style>