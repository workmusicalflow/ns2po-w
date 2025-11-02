<template>
  <div
    v-if="show"
    :class="containerClasses"
  >
    <div :class="overlayClasses">
      <div class="flex flex-col items-center justify-center gap-4">
        <!-- Spinner SVG animé -->
        <div :class="spinnerClasses">
          <svg
            class="animate-spin"
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

        <!-- Message de chargement -->
        <p
          v-if="message"
          :class="messageClasses"
        >
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SpinnerSize = 'sm' | 'md' | 'lg'
type SpinnerVariant = 'primary' | 'accent' | 'neutral'

interface Props {
  show?: boolean
  size?: SpinnerSize
  variant?: SpinnerVariant
  message?: string
  fullScreen?: boolean
  overlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true,
  size: 'md',
  variant: 'primary',
  message: '',
  fullScreen: false,
  overlay: true
})

const containerClasses = computed(() => [
  props.fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0',
  'flex items-center justify-center'
])

const overlayClasses = computed(() => [
  props.overlay ? 'bg-black/60 backdrop-blur-md' : '',
  'rounded-lg p-8',
  'flex items-center justify-center'
])

const spinnerClasses = computed(() => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  const variantClasses = {
    primary: 'text-white', // BLANC pour visibilité maximale sur fond noir
    accent: 'text-white',
    neutral: 'text-white'
  }

  return [
    sizeClasses[props.size],
    variantClasses[props.variant]
  ]
})

const messageClasses = computed(() => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return [
    sizeClasses[props.size],
    'text-white font-medium text-center'
  ]
})
</script>
