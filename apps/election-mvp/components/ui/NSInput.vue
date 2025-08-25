<template>
  <div class="space-y-1">
    <label 
      v-if="label" 
      :for="inputId"
      :class="labelClasses"
    >
      {{ label }}
      <span v-if="required" class="text-error ml-1">*</span>
    </label>
    
    <div class="relative">
      <!-- Icon prefix -->
      <div v-if="prefixIcon && typeof prefixIcon !== 'undefined'" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <component 
          :is="prefixIcon" 
          v-if="prefixIcon && typeof prefixIcon !== 'undefined'" 
          :class="iconClasses"
          aria-hidden="true" 
        />
      </div>
      
      <input
        :id="inputId"
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      >
      
      <!-- Icon suffix -->
      <div v-if="suffixIcon && typeof suffixIcon !== 'undefined'" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <component 
          :is="suffixIcon" 
          v-if="suffixIcon && typeof suffixIcon !== 'undefined'" 
          :class="iconClasses"
          aria-hidden="true" 
        />
      </div>
    </div>
    
    <!-- Helper text or error -->
    <p v-if="helperText || errorMessage" :class="helperClasses">
      {{ errorMessage || helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'

type InputSize = 'sm' | 'md' | 'lg'
type InputVariant = 'default' | 'error' | 'success'

interface Props {
  modelValue?: string | number
  type?: string
  label?: string
  placeholder?: string
  helperText?: string
  errorMessage?: string
  size?: InputSize
  variant?: InputVariant
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  prefixIcon?: Component | string
  suffixIcon?: Component | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  size: 'md',
  variant: 'default',
  disabled: false,
  readonly: false,
  required: false,
  class: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`)
const isFocused = ref(false)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const labelClasses = computed(() => [
  'block text-sm font-medium font-body',
  {
    'text-text-main': props.variant === 'default',
    'text-error': props.variant === 'error',
    'text-success': props.variant === 'success',
  }
])

const inputClasses = computed(() => [
  // Base styles
  'block w-full rounded-md border-0 py-1.5 font-body text-text-main shadow-sm ring-1 ring-inset transition-all duration-200 placeholder:text-text-main/40 focus:ring-2 focus:ring-inset',
  
  // Size variants
  {
    'px-2.5 py-1.5 text-sm': props.size === 'sm',
    'px-3 py-2 text-base': props.size === 'md',
    'px-4 py-3 text-lg': props.size === 'lg',
  },
  
  // Icon padding adjustments
  {
    'pl-10': props.prefixIcon && props.size === 'md',
    'pl-9': props.prefixIcon && props.size === 'sm',
    'pl-12': props.prefixIcon && props.size === 'lg',
    'pr-10': props.suffixIcon && props.size === 'md',
    'pr-9': props.suffixIcon && props.size === 'sm', 
    'pr-12': props.suffixIcon && props.size === 'lg',
  },
  
  // Variant styles
  {
    'ring-text-main/20 focus:ring-primary': props.variant === 'default' && !props.errorMessage,
    'ring-error focus:ring-error': props.variant === 'error' || props.errorMessage,
    'ring-success focus:ring-success': props.variant === 'success',
  },
  
  // States
  {
    'opacity-50 cursor-not-allowed': props.disabled,
    'bg-background/50': props.readonly,
  },
  
  props.class
])

const iconClasses = computed(() => [
  'h-5 w-5',
  {
    'text-text-main/60': props.variant === 'default',
    'text-error': props.variant === 'error' || props.errorMessage,
    'text-success': props.variant === 'success',
  }
])

const helperClasses = computed(() => [
  'text-sm font-body',
  {
    'text-text-main/60': !props.errorMessage,
    'text-error': props.errorMessage,
  }
])
</script>