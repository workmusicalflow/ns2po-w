<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="px-6 py-4 border-b border-text-main/10">
      <slot name="header" />
    </div>
    
    <div :class="bodyClasses">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="px-6 py-4 border-t border-text-main/10 bg-background/50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type CardVariant = 'default' | 'elevated' | 'bordered' | 'ghost'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

interface Props {
  variant?: CardVariant
  padding?: CardPadding
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  class: ''
})

const cardClasses = computed(() => [
  // Base styles
  'bg-white rounded-md overflow-hidden',
  
  // Variant styles
  {
    'shadow-sm border border-text-main/10': props.variant === 'default',
    'shadow-lg border border-text-main/10': props.variant === 'elevated', 
    'border-2 border-text-main/20': props.variant === 'bordered',
    'bg-transparent shadow-none border-none': props.variant === 'ghost',
  },
  
  props.class
])

const bodyClasses = computed(() => [
  // Padding variants
  {
    '': props.padding === 'none',
    'p-4': props.padding === 'sm',
    'p-6': props.padding === 'md',
    'p-8': props.padding === 'lg',
  }
])
</script>