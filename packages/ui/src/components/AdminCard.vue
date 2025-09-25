<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200"
    :class="{
      'hover:shadow-md': hoverable,
      'p-6': !noPadding
    }"
  >
    <!-- Header with title and optional action -->
    <div
      v-if="title || $slots.header || $slots.action"
      class="flex items-center justify-between"
      :class="{ 'mb-4': title || $slots.header }"
    >
      <div class="flex items-center space-x-3">
        <!-- Icon -->
        <div
          v-if="icon"
          class="w-12 h-12 rounded-lg flex items-center justify-center"
          :class="iconBgClass"
        >
          <Icon :name="icon" class="w-6 h-6" :class="iconClass" />
        </div>

        <!-- Title -->
        <div v-if="title || $slots.header">
          <h3 v-if="title" class="text-lg font-semibold text-gray-900">
            {{ title }}
          </h3>
          <slot name="header" />
        </div>
      </div>

      <!-- Action slot -->
      <div v-if="$slots.action">
        <slot name="action" />
      </div>
    </div>

    <!-- Main content -->
    <div>
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="mt-4 pt-4 border-t border-gray-200">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  icon?: string
  iconColor?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  hoverable?: boolean
  noPadding?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'blue',
  hoverable: false,
  noPadding: false
})

// Compute icon classes based on color
const iconBgClass = computed(() => {
  const colorMap = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    purple: 'bg-purple-100',
    gray: 'bg-gray-100'
  }
  return colorMap[props.iconColor]
})

const iconClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  }
  return colorMap[props.iconColor]
})
</script>