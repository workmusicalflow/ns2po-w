<template>
  <div class="input-wrapper">
    <label v-if="label" :for="inputId" class="input-label">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="input-container">
      <input
        :id="inputId"
        v-model="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="inputClasses"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      
      <div v-if="$slots.suffix" class="input-suffix">
        <slot name="suffix" />
      </div>
    </div>
    
    <div v-if="error || hint" class="input-message">
      <span v-if="error" class="text-red-600 text-sm">{{ error }}</span>
      <span v-else-if="hint" class="text-gray-500 text-sm">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InputProps } from '@ns2po/types'
import { InputType } from '@ns2po/types'

interface Props extends InputProps {
  modelValue?: string
  label?: string
  error?: string
  hint?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text' as InputType,
  disabled: false,
  readonly: false,
  required: false
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const inputId = computed(() => 
  props.id || `input-${Math.random().toString(36).substr(2, 9)}`
)

const inputClasses = computed(() => [
  'input',
  {
    'input--error': props.error,
    'input--disabled': props.disabled,
    'input--readonly': props.readonly
  },
  props.class
])
</script>

<style scoped>
.input-wrapper {
  @apply space-y-1;
}

.input-label {
  @apply block text-sm font-medium text-gray-700;
}

.input-container {
  @apply relative;
}

.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500;
}

.input--error {
  @apply border-red-300 focus:ring-red-500 focus:border-red-500;
}

.input--disabled {
  @apply bg-gray-100 cursor-not-allowed;
}

.input--readonly {
  @apply bg-gray-50;
}

.input-suffix {
  @apply absolute inset-y-0 right-0 flex items-center pr-3;
}

.input-message {
  @apply mt-1;
}
</style>