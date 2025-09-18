<template>
  <div class="relative inline-block">
    <!-- Trigger element -->
    <div
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
      class="cursor-help"
    >
      <slot />
    </div>

    <!-- Tooltip content -->
    <Teleport to="body">
      <div
        v-if="showTooltip"
        ref="tooltipRef"
        :class="[
          'fixed z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg max-w-xs',
          'pointer-events-none transition-opacity duration-200',
          showTooltip ? 'opacity-100' : 'opacity-0'
        ]"
        :style="tooltipStyle"
        role="tooltip"
      >
        <div v-html="content"></div>
        <!-- Tooltip arrow -->
        <div
          class="absolute w-2 h-2 bg-gray-900 transform rotate-45"
          :class="arrowClasses"
        ></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Props {
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

const props = withDefaults(defineProps<Props>(), {
  placement: 'top',
  delay: 200
})

const showTooltip = ref(false)
const tooltipRef = ref<HTMLElement>()
const tooltipStyle = ref({})
const arrowClasses = ref('')

// Calculate tooltip position
const updateTooltipPosition = () => {
  if (!tooltipRef.value) return

  const trigger = tooltipRef.value.parentElement?.querySelector('[data-tooltip-trigger]') as HTMLElement
  if (!trigger) return

  const triggerRect = trigger.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()

  let top = 0
  let left = 0
  let arrowClass = ''

  switch (props.placement) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - 8
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
      arrowClass = '-bottom-1 left-1/2 transform -translate-x-1/2'
      break
    case 'bottom':
      top = triggerRect.bottom + 8
      left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2)
      arrowClass = '-top-1 left-1/2 transform -translate-x-1/2'
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
      left = triggerRect.left - tooltipRect.width - 8
      arrowClass = '-right-1 top-1/2 transform -translate-y-1/2'
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2)
      left = triggerRect.right + 8
      arrowClass = '-left-1 top-1/2 transform -translate-y-1/2'
      break
  }

  // Ensure tooltip stays within viewport
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  if (left < 8) left = 8
  if (left + tooltipRect.width > viewport.width - 8) {
    left = viewport.width - tooltipRect.width - 8
  }
  if (top < 8) top = 8
  if (top + tooltipRect.height > viewport.height - 8) {
    top = viewport.height - tooltipRect.height - 8
  }

  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`
  }
  arrowClasses.value = arrowClass
}

// Watch tooltip visibility to update position
watch(showTooltip, (show) => {
  if (show) {
    nextTick(() => {
      updateTooltipPosition()
    })
  }
})
</script>