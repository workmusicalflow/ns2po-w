<template>
  <Menu as="div" class="relative inline-block text-left">
    <div>
      <MenuButton :class="buttonClasses">
        <slot name="trigger" :open="open">
          <span>Options</span>
          <ChevronDownIcon 
            class="ml-2 -mr-1 h-5 w-5 transition-transform ui-open:rotate-180" 
            aria-hidden="true" 
          />
        </slot>
      </MenuButton>
    </div>

    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <MenuItems :class="menuClasses">
        <div class="py-1">
          <slot :close="close" />
        </div>
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/20/solid'

type MenuPosition = 'left' | 'right' | 'center'

interface Props {
  position?: MenuPosition
  class?: string
  buttonClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  position: 'left',
  class: '',
  buttonClass: ''
})

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-text-main shadow-sm ring-1 ring-text-main/20 hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  props.buttonClass
])

const menuClasses = computed(() => [
  'absolute z-10 mt-2 w-56 origin-top-right divide-y divide-text-main/10 rounded-md bg-white shadow-lg ring-1 ring-text-main/20 focus:outline-none',
  {
    'right-0': props.position === 'right',
    'left-0': props.position === 'left',
    'left-1/2 transform -translate-x-1/2': props.position === 'center',
  },
  props.class
])
</script>