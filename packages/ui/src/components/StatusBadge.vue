<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    :class="badgeClasses"
  >
    <!-- Status dot -->
    <div
      v-if="showDot"
      class="w-2 h-2 rounded-full mr-1.5"
      :class="dotClasses"
    />

    <!-- Icon -->
    <Icon
      v-if="icon"
      :name="icon"
      class="w-3 h-3"
      :class="{ 'mr-1': $slots.default }"
    />

    <!-- Text content -->
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  icon?: string
  showDot?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'soft',
  size: 'md',
  showDot: false,
  pulse: false
})

// Compute badge classes
const badgeClasses = computed(() => {
  const baseClasses = 'inline-flex items-center font-medium'

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded',
    md: 'px-2.5 py-0.5 text-xs rounded-full',
    lg: 'px-3 py-1 text-sm rounded-full'
  }

  // Status and variant classes
  const statusClasses = {
    success: {
      solid: 'bg-green-600 text-white',
      outline: 'border border-green-600 text-green-600 bg-transparent',
      soft: 'bg-green-100 text-green-800'
    },
    warning: {
      solid: 'bg-yellow-600 text-white',
      outline: 'border border-yellow-600 text-yellow-600 bg-transparent',
      soft: 'bg-yellow-100 text-yellow-800'
    },
    error: {
      solid: 'bg-red-600 text-white',
      outline: 'border border-red-600 text-red-600 bg-transparent',
      soft: 'bg-red-100 text-red-800'
    },
    info: {
      solid: 'bg-blue-600 text-white',
      outline: 'border border-blue-600 text-blue-600 bg-transparent',
      soft: 'bg-blue-100 text-blue-800'
    },
    neutral: {
      solid: 'bg-gray-600 text-white',
      outline: 'border border-gray-600 text-gray-600 bg-transparent',
      soft: 'bg-gray-100 text-gray-800'
    }
  }

  return [
    baseClasses,
    sizeClasses[props.size],
    statusClasses[props.status][props.variant]
  ].join(' ')
})

// Compute dot classes
const dotClasses = computed(() => {
  const colorClasses = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-500'
  }

  const classes = [colorClasses[props.status]]

  if (props.pulse) {
    classes.push('animate-pulse')
  }

  return classes.join(' ')
})
</script>