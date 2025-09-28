<template>
  <!-- Name Field -->
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
      Nom de la catégorie *
    </label>
    <input
      id="name"
      v-model="formName"
      type="text"
      required
      :disabled="isLoading"
      class="block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base sm:text-sm touch-manipulation transition-colors duration-200 placeholder:text-gray-400"
      :class="{
        'border-red-300 focus:ring-red-500 focus:border-red-500': errors.name || realTimeErrors.name,
        'border-gray-300 hover:border-gray-400': !errors.name && !realTimeErrors.name
      }"
      placeholder="Ex: TEXTILE, ACCESSOIRE..."
    >
    <p v-if="errors.name || realTimeErrors.name" class="mt-2 text-sm text-red-600">
      {{ errors.name || realTimeErrors.name }}
    </p>
  </div>

  <!-- Slug Field -->
  <div>
    <label for="slug" class="block text-sm font-medium text-gray-700 mb-2">
      Slug (identifiant URL) *
    </label>
    <input
      id="slug"
      v-model="formSlug"
      type="text"
      required
      :disabled="isLoading"
      class="block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base sm:text-sm touch-manipulation transition-colors duration-200 placeholder:text-gray-400"
      :class="{
        'border-red-300 focus:ring-red-500 focus:border-red-500': errors.slug || realTimeErrors.slug,
        'border-gray-300 hover:border-gray-400': !errors.slug && !realTimeErrors.slug
      }"
      placeholder="Ex: textile, accessoire..."
    >
    <p v-if="errors.slug || realTimeErrors.slug" class="mt-2 text-sm text-red-600">
      {{ errors.slug || realTimeErrors.slug }}
    </p>
    <p class="mt-2 text-sm text-gray-500">
      Le slug sera généré automatiquement à partir du nom si laissé vide
    </p>
  </div>

  <!-- Description Field -->
  <div>
    <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
      Description
    </label>
    <textarea
      id="description"
      v-model="formDescription"
      rows="3"
      :disabled="isLoading"
      class="block w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-base sm:text-sm touch-manipulation transition-colors duration-200 placeholder:text-gray-400 resize-none"
      :class="{
        'border-red-300 focus:ring-red-500 focus:border-red-500': errors.description || realTimeErrors.description,
        'border-gray-300 hover:border-gray-400': !errors.description && !realTimeErrors.description
      }"
      placeholder="Description optionnelle de la catégorie..."
    />
    <p v-if="errors.description || realTimeErrors.description" class="mt-2 text-sm text-red-600">
      {{ errors.description || realTimeErrors.description }}
    </p>
  </div>

  <!-- Status Toggle -->
  <div class="flex items-center justify-between py-2">
    <div>
      <label for="isActive" class="text-sm font-medium text-gray-700">
        Statut actif
      </label>
      <p class="text-sm text-gray-500 mt-1">
        La catégorie sera visible et utilisable
      </p>
    </div>
    <div class="relative">
      <input
        id="isActive"
        v-model="formIsActive"
        type="checkbox"
        :disabled="isLoading"
        class="sr-only"
      >
      <button
        type="button"
        :disabled="isLoading"
        :class="[
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 touch-manipulation',
          formIsActive ? 'bg-amber-600' : 'bg-gray-200',
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        ]"
        @click="formIsActive = !formIsActive"
      >
        <span
          :class="[
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            formIsActive ? 'translate-x-5' : 'translate-x-0'
          ]"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  form: {
    name: string
    slug: string
    description: string
    isActive: boolean
  }
  errors: Record<string, string>
  realTimeErrors: Record<string, string>
  isLoading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:form': [form: Props['form']]
  'update:errors': [errors: Props['errors']]
}>()

// Computed properties to handle form updates via emits
const formName = computed({
  get: () => props.form.name,
  set: (value: string) => emit('update:form', { ...props.form, name: value })
})

const formSlug = computed({
  get: () => props.form.slug,
  set: (value: string) => emit('update:form', { ...props.form, slug: value })
})

const formDescription = computed({
  get: () => props.form.description,
  set: (value: string) => emit('update:form', { ...props.form, description: value })
})

const formIsActive = computed({
  get: () => props.form.isActive,
  set: (value: boolean) => emit('update:form', { ...props.form, isActive: value })
})
</script>