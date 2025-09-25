<template>
  <div class="admin-form-field">
    <label v-if="label" :for="fieldId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- Input Field -->
    <input
      v-if="type !== 'textarea' && type !== 'select'"
      :id="fieldId"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :min="min"
      :max="max"
      :step="step"
      :rows="undefined"
      :class="inputClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    >

    <!-- Textarea Field -->
    <textarea
      v-else-if="type === 'textarea'"
      :id="fieldId"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :rows="rows || 3"
      :class="inputClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />

    <!-- Select Field -->
    <select
      v-else-if="type === 'select'"
      :id="fieldId"
      :value="modelValue"
      :disabled="disabled"
      :class="inputClasses"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    >
      <slot />
    </select>

    <!-- Error Message -->
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>

    <!-- Help Text -->
    <p v-else-if="helpText" class="mt-1 text-sm text-gray-500">
      {{ helpText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'tel' | 'url'
  label?: string
  placeholder?: string
  modelValue?: string | number
  error?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  rows?: number
  min?: string | number
  max?: string | number
  step?: string | number
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  disabled: false,
  readonly: false,
  rows: 3
})

defineEmits<{
  'update:modelValue': [value: string | number]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

const fieldId = computed(() =>
  props.id || `admin-field-${Math.random().toString(36).substr(2, 9)}`
)

const inputClasses = computed(() => [
  'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500',
  {
    'border-red-300 focus:ring-red-500 focus:border-red-500': props.error,
    'border-gray-300': !props.error,
    'bg-gray-100 cursor-not-allowed': props.disabled,
    'bg-gray-50': props.readonly && !props.disabled
  },
  props.class
])
</script>