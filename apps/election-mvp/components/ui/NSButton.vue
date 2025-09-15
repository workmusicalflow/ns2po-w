<template>
  <component
    :is="tag"
    :class="buttonClasses"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span 
      v-if="loading" 
      class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" 
    />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  tag?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  tag: 'button',
  class: ''
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const buttonClasses = computed(() => [
  // Base styles
  'inline-flex items-center justify-center font-heading font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
  
  // Size variants
  {
    'px-3 py-1.5 text-sm rounded-sm': props.size === 'sm',
    'px-4 py-2 text-base rounded-md': props.size === 'md', 
    'px-6 py-3 text-lg rounded-lg': props.size === 'lg',
  },
  
  // Color variants
  {
    // Primary - NS2PO Primaire (Ocre/Or)
    'bg-primary text-white hover:bg-primary/90 focus:ring-primary/50': props.variant === 'primary',
    
    // Secondary - NS2PO Fond Neutre avec texte principal
    'bg-background text-text-main border border-text-main/20 hover:bg-text-main/5 focus:ring-text-main/50': props.variant === 'secondary',
    
    // Accent - NS2PO Accent (Bourgogne)
    'bg-accent text-white hover:bg-accent/90 focus:ring-accent/50': props.variant === 'accent',
    
    // Outline - Bordure primaire
    'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary/50': props.variant === 'outline',
    
    // Danger - Rouge sémantique
    'bg-error text-white hover:bg-error/90 focus:ring-error/50': props.variant === 'danger',
    
    // Ghost - Transparent avec hover
    'text-text-main hover:bg-text-main/5 focus:ring-text-main/50': props.variant === 'ghost',
  },
  
  // States
  {
    'opacity-50 cursor-not-allowed': props.disabled,
    'cursor-wait': props.loading,
  },
  
  props.class
])
</script>