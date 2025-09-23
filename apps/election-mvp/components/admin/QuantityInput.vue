<template>
  <div class="quantity-input-wrapper">
    <!-- Label caché pour lecteurs d'écran -->
    <label :for="inputId" class="sr-only">
      Quantité pour {{ productName }}
    </label>

    <div class="flex items-center space-x-1">
      <!-- Boutons de décrémentation -->
      <div class="flex flex-col space-y-1">
        <button
          type="button"
          :disabled="disabled || internalQuantity <= min"
          :class="decrementButtonClasses"
          :aria-label="`Décrémenter de ${stepLarge} pour ${productName}`"
          @click="decrement(stepLarge)"
        >
          -{{ stepLarge }}
        </button>
        <button
          type="button"
          :disabled="disabled || internalQuantity <= min"
          :class="decrementButtonClasses"
          :aria-label="`Décrémenter de ${stepSmall} pour ${productName}`"
          @click="decrement(stepSmall)"
        >
          -{{ stepSmall }}
        </button>
      </div>

      <!-- Input principal avec formatage amélioré -->
      <div class="flex flex-col">
        <input
          :id="inputId"
          v-model="formattedValue"
          type="text"
          :class="inputClasses"
          :aria-invalid="hasError ? 'true' : null"
          :aria-describedby="ariaDescribedBy"
          :aria-label="`Quantité pour ${productName}`"
          :disabled="disabled"
          @input="handleFormattedInput"
          @wheel.prevent="handleWheel"
          @blur="handleBlur"
          @focus="handleFocus"
        >
      </div>

      <!-- Boutons d'incrémentation -->
      <div class="flex flex-col space-y-1">
        <button
          type="button"
          :disabled="disabled || internalQuantity >= max"
          :class="incrementButtonClasses"
          :aria-label="`Incrémenter de ${stepSmall} pour ${productName}`"
          @click="increment(stepSmall)"
        >
          +{{ stepSmall }}
        </button>
        <button
          type="button"
          :disabled="disabled || internalQuantity >= max"
          :class="incrementButtonClasses"
          :aria-label="`Incrémenter de ${stepLarge} pour ${productName}`"
          @click="increment(stepLarge)"
        >
          +{{ stepLarge }}
        </button>
      </div>
    </div>

    <!-- Presets Quick Fill -->
    <div v-if="presets.length > 0" class="flex items-center space-x-1 mt-2">
      <span class="text-xs text-gray-500">Rapide:</span>
      <button
        v-for="preset in presets"
        :key="preset"
        type="button"
        :disabled="disabled"
        :class="presetButtonClasses"
        :aria-label="`Définir à ${formatNumber(preset)} pour ${productName}`"
        @click="setPreset(preset)"
      >
        {{ formatNumber(preset) }}
      </button>
    </div>

    <!-- Message d'erreur -->
    <div
      v-if="hasError"
      :id="errorId"
      role="alert"
      class="text-red-500 text-xs mt-1"
    >
      {{ errorMessage }}
    </div>

    <!-- Instructions d'aide cachées -->
    <span :id="hintId" class="sr-only">
      Saisissez la quantité pour {{ productName }}. Minimum {{ formatNumber(min) }}, maximum {{ formatNumber(max) }}.
      Utilisez les boutons + et - pour ajuster rapidement.
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  modelValue: number
  min?: number
  max?: number
  productId: string | number
  productName: string
  disabled?: boolean
  stepSmall?: number
  stepLarge?: number
  presets?: number[]
}

interface Emits {
  (e: 'update:modelValue', value: number): void
  (e: 'error', hasError: boolean): void
}

// Props avec valeurs par défaut
const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 999999,
  disabled: false,
  stepSmall: 10,
  stepLarge: 100,
  presets: () => [1000, 5000, 10000]
})

const emit = defineEmits<Emits>()

// État interne
const internalQuantity = ref(props.modelValue)
const errorMessage = ref('')
const hasError = ref(false)
const isFocused = ref(false)
const formattedValue = ref('')

// IDs uniques pour accessibilité
const inputId = computed(() => `quantity-input-${props.productId}`)
const errorId = computed(() => `quantity-error-${props.productId}`)
const hintId = computed(() => `quantity-hint-${props.productId}`)

// Formatage des nombres avec milliers
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

// Classes CSS dynamiques
const inputClasses = computed(() => [
  'w-32 px-3 py-2 border rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors font-mono',
  {
    'border-red-500 focus:ring-red-500': hasError.value,
    'border-gray-300': !hasError.value && !isFocused.value,
    'border-amber-500': !hasError.value && isFocused.value,
    'bg-gray-100 cursor-not-allowed': props.disabled,
    'bg-white': !props.disabled
  }
])

// Classes pour les boutons d'incrémentation
const incrementButtonClasses = computed(() => [
  'px-2 py-1 text-xs font-medium rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500',
  {
    'bg-green-50 border-green-200 text-green-700 hover:bg-green-100': !props.disabled && internalQuantity.value < props.max,
    'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed': props.disabled || internalQuantity.value >= props.max
  }
])

// Classes pour les boutons de décrémentation
const decrementButtonClasses = computed(() => [
  'px-2 py-1 text-xs font-medium rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500',
  {
    'bg-red-50 border-red-200 text-red-700 hover:bg-red-100': !props.disabled && internalQuantity.value > props.min,
    'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed': props.disabled || internalQuantity.value <= props.min
  }
])

// Classes pour les boutons presets
const presetButtonClasses = computed(() => [
  'px-2 py-1 text-xs font-medium rounded border transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500',
  {
    'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100': !props.disabled,
    'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed': props.disabled
  }
])

// Attributs ARIA dynamiques
const ariaDescribedBy = computed(() => {
  const ids = [hintId.value]
  if (hasError.value) {
    ids.push(errorId.value)
  }
  return ids.join(' ')
})

// Validation
const validate = () => {
  if (internalQuantity.value < props.min) {
    hasError.value = true
    errorMessage.value = `La quantité doit être au moins de ${props.min}.`
  } else if (internalQuantity.value > props.max) {
    hasError.value = true
    errorMessage.value = `La quantité ne peut pas dépasser ${props.max}.`
  } else if (isNaN(internalQuantity.value)) {
    hasError.value = true
    errorMessage.value = 'Veuillez saisir un nombre valide.'
  } else {
    hasError.value = false
    errorMessage.value = ''
  }

  emit('error', hasError.value)
}

// Gestionnaires d'événements avec formatage amélioré
const updateFormattedValue = () => {
  formattedValue.value = formatNumber(internalQuantity.value)
}

const handleFormattedInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const rawValue = target.value.replace(/\s/g, '') // Supprimer les espaces de séparation des milliers

  let val = parseInt(rawValue, 10)

  if (isNaN(val) || val < 0) {
    val = props.min
  }

  // Contraindre la valeur dans les limites
  val = Math.max(props.min, Math.min(props.max, val))

  internalQuantity.value = val
  updateFormattedValue()
  validate()
}

const handleWheel = (event: WheelEvent) => {
  // Empêche le scroll de modifier la valeur - critique pour l'UX
  event.preventDefault()
}

const handleFocus = () => {
  isFocused.value = true
  // Au focus, afficher la valeur brute pour faciliter l'édition
  formattedValue.value = internalQuantity.value.toString()
}

const handleBlur = () => {
  isFocused.value = false
  // Au blur, reformater avec les milliers
  updateFormattedValue()
  validate()
}

// Nouvelles méthodes pour les boutons
const increment = (step: number) => {
  const newValue = Math.min(props.max, internalQuantity.value + step)
  internalQuantity.value = newValue
  updateFormattedValue()
  validate()
}

const decrement = (step: number) => {
  const newValue = Math.max(props.min, internalQuantity.value - step)
  internalQuantity.value = newValue
  updateFormattedValue()
  validate()
}

const setPreset = (value: number) => {
  const constrainedValue = Math.max(props.min, Math.min(props.max, value))
  internalQuantity.value = constrainedValue
  updateFormattedValue()
  validate()
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  internalQuantity.value = newValue
  updateFormattedValue()
  validate()
})

watch(internalQuantity, (newValue) => {
  emit('update:modelValue', newValue)
})

// Lifecycle
onMounted(() => {
  updateFormattedValue()
  validate()
})
</script>

<style scoped>
.quantity-input-wrapper {
  @apply flex flex-col;
}

/* Support pour les lecteurs d'écran */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Désactiver les flèches par défaut de type="number" pour éviter la confusion */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>