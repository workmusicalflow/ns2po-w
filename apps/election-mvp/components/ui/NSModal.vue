<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="handleClose" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel :class="modalClasses">
              <!-- Header -->
              <div v-if="$slots.header || title" class="flex items-center justify-between p-6 border-b border-text-main/10">
                <DialogTitle v-if="title" as="h3" class="text-lg font-heading font-semibold text-text-main">
                  {{ title }}
                </DialogTitle>
                <slot v-else name="header" />
                
                <button
                  v-if="closable"
                  @click="handleClose"
                  class="ml-4 text-text-main/60 hover:text-text-main transition-colors"
                >
                  <span class="sr-only">Fermer</span>
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Body -->
              <div :class="bodyClasses">
                <slot />
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="px-6 py-4 border-t border-text-main/10 bg-background/50">
                <slot name="footer" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface Props {
  isOpen: boolean
  title?: string
  size?: ModalSize
  closable?: boolean
  closeOnOverlay?: boolean
  class?: string
  bodyClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  closeOnOverlay: true,
  class: '',
  bodyClass: ''
})

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => {
  if (props.closable) {
    emit('close')
  }
}

const modalClasses = computed(() => [
  'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all',
  {
    'max-w-sm': props.size === 'sm',
    'max-w-md': props.size === 'md',
    'max-w-lg': props.size === 'lg', 
    'max-w-4xl': props.size === 'xl',
    'max-w-none w-full h-full': props.size === 'full',
  },
  props.class
])

const bodyClasses = computed(() => [
  'p-6',
  props.bodyClass
])
</script>