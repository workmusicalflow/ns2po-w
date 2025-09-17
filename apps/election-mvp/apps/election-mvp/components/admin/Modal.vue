<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="closeModal" class="relative z-50">
      <!-- Backdrop -->
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <!-- Modal Content -->
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              :class="[
                'w-full transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all',
                sizeClasses[size]
              ]"
            >
              <!-- Header -->
              <div v-if="title || $slots.header" class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div v-if="$slots.header">
                    <slot name="header" />
                  </div>
                  <div v-else>
                    <DialogTitle
                      as="h3"
                      class="text-lg font-medium leading-6 text-gray-900"
                    >
                      {{ title }}
                    </DialogTitle>
                    <p v-if="description" class="mt-1 text-sm text-gray-500">
                      {{ description }}
                    </p>
                  </div>
                  <button
                    v-if="closable"
                    @click="closeModal"
                    class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                  >
                    <span class="sr-only">Fermer</span>
                    <Icon name="heroicons:x-mark" class="h-6 w-6" />
                  </button>
                </div>
              </div>

              <!-- Body -->
              <div class="px-6 py-4">
                <slot />
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer || showDefaultActions" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div v-if="$slots.footer">
                  <slot name="footer" />
                </div>
                <div v-else-if="showDefaultActions" class="flex justify-end space-x-3">
                  <button
                    v-if="showCancel"
                    @click="closeModal"
                    :disabled="loading"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ cancelText }}
                  </button>
                  <button
                    v-if="showConfirm"
                    @click="$emit('confirm')"
                    :disabled="loading"
                    :class="[
                      'px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                      confirmButtonClasses[variant]
                    ]"
                  >
                    <Icon v-if="loading" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                    {{ loading ? loadingText : confirmText }}
                  </button>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'

interface Props {
  isOpen: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'primary' | 'danger' | 'success' | 'warning'
  closable?: boolean
  showDefaultActions?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  cancelText?: string
  confirmText?: string
  loadingText?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'primary',
  closable: true,
  showDefaultActions: false,
  showCancel: true,
  showConfirm: true,
  cancelText: 'Annuler',
  confirmText: 'Confirmer',
  loadingText: 'En cours...',
  loading: false
})

const emit = defineEmits<{
  close: []
  confirm: []
}>()

// Size classes mapping
const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl'
}

// Button variant classes
const confirmButtonClasses = {
  primary: 'text-white bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  danger: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
  success: 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500',
  warning: 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
}

function closeModal() {
  emit('close')
}
</script>