<template>
  <div :class="cardClasses">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardProps } from '@ns2po/types'
import { CardVariant, CardPadding } from '@ns2po/types'

type Props = CardProps & {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default' as CardVariant,
  padding: 'medium' as CardPadding,
  shadow: true,
  bordered: true,
  rounded: true
})

const cardClasses = computed(() => [
  'card',
  `card--${props.variant}`,
  `card--padding-${props.padding}`,
  {
    'card--shadow': props.shadow,
    'card--bordered': props.bordered,
    'card--rounded': props.rounded,
    'card--hoverable': props.hoverable
  },
  props.class
])
</script>

<style scoped>
.card {
  @apply bg-white;
}

/* Variants */
.card--default {
  @apply bg-white;
}

.card--primary {
  @apply bg-blue-50 border-blue-200;
}

.card--success {
  @apply bg-green-50 border-green-200;
}

.card--warning {
  @apply bg-yellow-50 border-yellow-200;
}

.card--danger {
  @apply bg-red-50 border-red-200;
}

/* Padding */
.card--padding-none {
  @apply p-0;
}

.card--padding-small {
  @apply p-3;
}

.card--padding-medium {
  @apply p-4;
}

.card--padding-large {
  @apply p-6;
}

/* Modifiers */
.card--shadow {
  @apply shadow-md;
}

.card--bordered {
  @apply border;
}

.card--rounded {
  @apply rounded-lg;
}

.card--hoverable {
  @apply transition-shadow hover:shadow-lg cursor-pointer;
}

/* Header and Footer */
.card-header {
  @apply border-b border-gray-200 pb-3 mb-4;
}

.card-footer {
  @apply border-t border-gray-200 pt-3 mt-4;
}

.card-body {
  @apply flex-1;
}
</style>