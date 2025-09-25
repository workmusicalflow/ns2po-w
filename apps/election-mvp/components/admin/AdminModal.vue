<template>
  <teleport to="body">
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Background overlay -->
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="show"
              class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              @click="handleBackdropClick"
            />
          </transition>

          <!-- Modal panel -->
          <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              v-if="show"
              class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:p-6"
              :class="modalSizeClasses"
            >
              <!-- Header -->
              <div class="flex items-center justify-between mb-6">
                <h3 id="modal-title" class="text-lg font-medium text-gray-900">
                  {{ title }}
                </h3>
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md p-1"
                  aria-label="Fermer la modale"
                  @click="$emit('close')"
                >
                  <Icon name="heroicons:x-mark" class="w-6 h-6" />
                </button>
              </div>

              <!-- Content -->
              <div class="relative">
                <slot />
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="mt-6 pt-4 border-t border-gray-200">
                <slot name="footer" />
              </div>
            </div>
          </transition>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closeOnBackdrop: true
})

const emit = defineEmits<{
  close: []
}>()

// Computed
const modalSizeClasses = computed(() => {
  const sizeMap = {
    sm: 'sm:max-w-sm sm:w-full',
    md: 'sm:max-w-md sm:w-full',
    lg: 'sm:max-w-lg sm:w-full',
    xl: 'sm:max-w-xl sm:w-full',
    '2xl': 'sm:max-w-2xl sm:w-full',
    full: 'sm:max-w-6xl sm:w-full'
  }
  return sizeMap[props.size] || sizeMap.md
})

// Methods
function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}

// Handle ESC key
function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.show) {
    emit('close')
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscapeKey)
})

// Body scroll lock when modal is open
watch(() => props.show, (isShown) => {
  if (process.client) {
    if (isShown) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

// Clean up on unmount
onUnmounted(() => {
  if (process.client) {
    document.body.style.overflow = ''
  }
})
</script>