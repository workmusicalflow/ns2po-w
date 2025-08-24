<template>
  <MenuItem v-slot="{ active, close }">
    <component
      :is="tag"
      :href="href"
      :to="to"
      :class="[
        active ? 'bg-primary/10 text-primary' : 'text-text-main',
        'group flex w-full items-center px-4 py-2 text-sm transition-colors',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        class
      ]"
      @click="handleClick($event, close)"
    >
      <component
        v-if="icon"
        :is="icon"
        :class="[
          active ? 'text-primary' : 'text-text-main/60',
          'mr-3 h-5 w-5 transition-colors'
        ]"
        aria-hidden="true"
      />
      <slot :active="active" :close="close" />
    </component>
  </MenuItem>
</template>

<script setup lang="ts">
import { MenuItem } from '@headlessui/vue'
import type { Component } from 'vue'

interface Props {
  icon?: Component
  href?: string
  to?: string | object
  disabled?: boolean
  tag?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  tag: 'button',
  class: ''
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent, close: () => void) => {
  if (props.disabled) {
    event.preventDefault()
    return
  }
  
  emit('click', event)
  
  // Auto-close menu on click if it's not a link
  if (!props.href && !props.to) {
    close()
  }
}

// Determine the tag to use
const tag = computed(() => {
  if (props.href) return 'a'
  if (props.to) return 'NuxtLink'
  return props.tag
})
</script>