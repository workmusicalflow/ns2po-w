<template>
  <div class="space-y-2">
    <!-- Label -->
    <label
      v-if="label"
      :for="id"
      class="block text-sm font-medium text-gray-700"
      :class="{ 'text-red-700': error }"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Input Field -->
    <div class="relative">
      <!-- Text Input -->
      <input
        v-if="type === 'text' || type === 'email' || type === 'password' || type === 'number'"
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-amber-500',
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />

      <!-- Textarea -->
      <textarea
        v-else-if="type === 'textarea'"
        :id="id"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :rows="rows || 3"
        :class="[
          'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-y',
          error
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-amber-500',
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
        ]"
        @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />

      <!-- Select -->
      <select
        v-else-if="type === 'select'"
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :class="[
          'block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
          error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-amber-500',
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
        ]"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Checkbox -->
      <div v-else-if="type === 'checkbox'" class="flex items-center">
        <input
          :id="id"
          type="checkbox"
          :checked="modelValue"
          :disabled="disabled"
          :required="required"
          class="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
        />
        <label v-if="checkboxLabel" :for="id" class="ml-2 text-sm text-gray-700">
          {{ checkboxLabel }}
        </label>
      </div>

      <!-- Error Icon -->
      <div v-if="error" class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <Icon name="heroicons:exclamation-circle" class="h-5 w-5 text-red-500" />
      </div>
    </div>

    <!-- Help Text -->
    <p v-if="helpText && !error" class="text-sm text-gray-500">
      {{ helpText }}
    </p>

    <!-- Error Message -->
    <p v-if="error" class="text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Option {
  value: string | number
  label: string
}

interface Props {
  id: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox'
  modelValue: string | number | boolean
  label?: string
  placeholder?: string
  helpText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  options?: Option[]
  checkboxLabel?: string
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: string | number | boolean]
}>()
</script>