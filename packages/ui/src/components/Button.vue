<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span 
      v-if="loading" 
      class="spinner" 
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from '@ns2po/types'
import { ButtonVariant, ButtonSize } from '@ns2po/types'

type Props = ButtonProps & {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary' as ButtonVariant,
  size: 'medium' as ButtonSize,
  disabled: false,
  loading: false,
  class: undefined
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  {
    'btn--disabled': props.disabled,
    'btn--loading': props.loading
  },
  props.class
])
</script>

<style scoped>
.btn {
  @apply inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

/* Variants */
.btn--primary {
  @apply bg-primary text-white hover:bg-primary/90 focus:ring-primary/50;
}

.btn--secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
}

.btn--success {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
}

.btn--danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.btn--outline {
  @apply border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/50;
}

/* Sizes */
.btn--small {
  @apply px-3 py-1.5 text-sm rounded;
}

.btn--medium {
  @apply px-4 py-2 text-base rounded-md;
}

.btn--large {
  @apply px-6 py-3 text-lg rounded-lg;
}

/* States */
.btn--disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn--loading {
  @apply cursor-wait;
}

/* Spinner animation */
.spinner {
  @apply inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin;
}
</style>