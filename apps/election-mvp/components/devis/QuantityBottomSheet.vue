<template>
  <Teleport to="body">
    <!-- Overlay -->
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 overflow-hidden"
      @click="handleOverlayClick"
    >
      <!-- Background blur -->
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" />

      <!-- Bottom Sheet Container -->
      <div class="absolute bottom-0 left-0 right-0 flex justify-center">
        <div
          :class="[
            'w-full max-w-lg bg-white rounded-t-xl shadow-2xl transform transition-transform duration-300 ease-out',
            isVisible ? 'translate-y-0' : 'translate-y-full'
          ]"
          @click.stop
        >
          <!-- Handle indicator -->
          <div class="flex justify-center pt-3 pb-2">
            <div class="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          <!-- Header -->
          <div class="px-6 pb-4 border-b border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  Choisir la quantité
                </h3>
                <p class="text-sm text-gray-600 mt-1">
                  {{ product?.name || 'Produit sélectionné' }}
                </p>
              </div>
              <button
                type="button"
                class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                @click="handleCancel"
              >
                <Icon name="heroicons:x-mark" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6 space-y-6">
            <!-- Quick Presets -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">
                Quantités suggérées
              </h4>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="preset in presets"
                  :key="preset"
                  type="button"
                  :class="[
                    'p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200',
                    selectedQuantity === preset
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-primary/5'
                  ]"
                  @click="setQuantity(preset)"
                >
                  {{ formatNumber(preset) }}
                </button>
              </div>
            </div>

            <!-- Custom Input Section -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-3">
                Quantité personnalisée
              </h4>

              <!-- Main input with controls -->
              <div class="flex items-center justify-center space-x-4">
                <!-- Decrement buttons -->
                <div class="flex flex-col space-y-2">
                  <button
                    type="button"
                    :disabled="selectedQuantity <= min"
                    :class="decrementButtonClasses"
                    @click="decrement(stepLarge)"
                  >
                    -{{ stepLarge }}
                  </button>
                  <button
                    type="button"
                    :disabled="selectedQuantity <= min"
                    :class="decrementButtonClasses"
                    @click="decrement(stepSmall)"
                  >
                    -{{ stepSmall }}
                  </button>
                </div>

                <!-- Central input -->
                <div class="flex-1 max-w-xs">
                  <input
                    v-model="formattedValue"
                    type="text"
                    :class="inputClasses"
                    placeholder="0"
                    @input="handleInput"
                    @focus="handleFocus"
                    @blur="handleBlur"
                  >
                </div>

                <!-- Increment buttons -->
                <div class="flex flex-col space-y-2">
                  <button
                    type="button"
                    :disabled="selectedQuantity >= max"
                    :class="incrementButtonClasses"
                    @click="increment(stepSmall)"
                  >
                    +{{ stepSmall }}
                  </button>
                  <button
                    type="button"
                    :disabled="selectedQuantity >= max"
                    :class="incrementButtonClasses"
                    @click="increment(stepLarge)"
                  >
                    +{{ stepLarge }}
                  </button>
                </div>
              </div>

              <!-- Error message -->
              <div v-if="hasError" class="mt-2 text-sm text-red-600 text-center">
                {{ errorMessage }}
              </div>
            </div>

            <!-- Price calculation -->
            <div v-if="product?.basePrice" class="bg-gray-50 rounded-lg p-4">
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Prix unitaire:</span>
                  <span class="font-medium">{{ formatPrice(product.basePrice) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Quantité:</span>
                  <span class="font-medium">{{ formatNumber(selectedQuantity) }} unités</span>
                </div>
                <div class="border-t border-gray-200 pt-2">
                  <div class="flex justify-between text-base font-semibold">
                    <span class="text-gray-900">Total:</span>
                    <span class="text-primary">{{ formatPrice(totalPrice) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Range indicator -->
            <div class="text-xs text-gray-500 text-center">
              Quantité entre {{ formatNumber(min) }} et {{ formatNumber(max) }} unités
            </div>
          </div>

          <!-- Footer actions -->
          <div class="px-6 py-4 border-t border-gray-100 space-y-3">
            <button
              type="button"
              :disabled="hasError || selectedQuantity < min"
              :class="[
                'w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200',
                hasError || selectedQuantity < min
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark active:scale-95'
              ]"
              @click="handleConfirm"
            >
              Ajouter {{ formatNumber(selectedQuantity) }} unités
            </button>
            <button
              type="button"
              class="w-full py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
              @click="handleCancel"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

interface Product {
  id: string | number
  name: string
  basePrice?: number
  image_url?: string
}

interface Props {
  show: boolean
  product?: Product
  initialQuantity?: number
  min?: number
  max?: number
  stepSmall?: number
  stepLarge?: number
  presets?: number[]
}

interface Emits {
  (e: 'confirm', data: { product: Product; quantity: number; total: number }): void
  (e: 'cancel'): void
  (e: 'close'): void
}

// Props avec valeurs par défaut
const props = withDefaults(defineProps<Props>(), {
  initialQuantity: 50,
  min: 50,
  max: 10000,
  stepSmall: 10,
  stepLarge: 100,
  presets: () => [50, 100, 500, 1000, 5000]
})

const emit = defineEmits<Emits>()

// État interne
const isVisible = ref(false)
const selectedQuantity = ref(props.initialQuantity)
const formattedValue = ref('')
const hasError = ref(false)
const errorMessage = ref('')
const isFocused = ref(false)

// Formatage des nombres
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price)
}

// Prix total calculé
const totalPrice = computed(() => {
  if (!props.product?.basePrice) return 0
  return props.product.basePrice * selectedQuantity.value
})

// Classes CSS dynamiques
const inputClasses = computed(() => [
  'w-full px-4 py-3 text-center text-lg font-mono border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all',
  {
    'border-red-500 focus:ring-red-500': hasError.value,
    'border-gray-200 focus:border-primary': !hasError.value
  }
])

const incrementButtonClasses = computed(() => [
  'px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all active:scale-95',
  {
    'border-green-200 bg-green-50 text-green-700 hover:bg-green-100': selectedQuantity.value < props.max,
    'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed': selectedQuantity.value >= props.max
  }
])

const decrementButtonClasses = computed(() => [
  'px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all active:scale-95',
  {
    'border-red-200 bg-red-50 text-red-700 hover:bg-red-100': selectedQuantity.value > props.min,
    'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed': selectedQuantity.value <= props.min
  }
])

// Méthodes de validation
const validate = () => {
  if (selectedQuantity.value < props.min) {
    hasError.value = true
    errorMessage.value = `Minimum ${formatNumber(props.min)} unités`
  } else if (selectedQuantity.value > props.max) {
    hasError.value = true
    errorMessage.value = `Maximum ${formatNumber(props.max)} unités`
  } else if (isNaN(selectedQuantity.value)) {
    hasError.value = true
    errorMessage.value = 'Quantité invalide'
  } else {
    hasError.value = false
    errorMessage.value = ''
  }
}

// Méthodes de manipulation de quantité
const setQuantity = (quantity: number) => {
  selectedQuantity.value = Math.max(props.min, Math.min(props.max, quantity))
  updateFormattedValue()
  validate()
}

const increment = (step: number) => {
  setQuantity(selectedQuantity.value + step)
}

const decrement = (step: number) => {
  setQuantity(selectedQuantity.value - step)
}

const updateFormattedValue = () => {
  formattedValue.value = formatNumber(selectedQuantity.value)
}

// Gestionnaires d'événements
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const rawValue = target.value.replace(/\s/g, '')
  const numValue = parseInt(rawValue, 10)

  if (!isNaN(numValue) && numValue >= 0) {
    selectedQuantity.value = numValue
    validate()
  }
}

const handleFocus = () => {
  isFocused.value = true
  formattedValue.value = selectedQuantity.value.toString()
}

const handleBlur = () => {
  isFocused.value = false
  updateFormattedValue()
  validate()
}

const handleOverlayClick = () => {
  handleCancel()
}

const handleConfirm = () => {
  if (!hasError.value && props.product && selectedQuantity.value >= props.min) {
    emit('confirm', {
      product: props.product,
      quantity: selectedQuantity.value,
      total: totalPrice.value
    })
    close()
  }
}

const handleCancel = () => {
  emit('cancel')
  close()
}

const close = () => {
  isVisible.value = false
  setTimeout(() => {
    emit('close')
  }, 300)
}

// Animation d'ouverture/fermeture
const showBottomSheet = async () => {
  isVisible.value = true
  await nextTick()
  // Trigger reflow pour l'animation
  document.body.offsetHeight
}

const hide = () => {
  isVisible.value = false
}

// Watchers
watch(() => props.show, async (newShow) => {
  if (newShow) {
    await showBottomSheet()
  } else {
    hide()
  }
})

watch(() => props.initialQuantity, (newQuantity) => {
  selectedQuantity.value = newQuantity
  updateFormattedValue()
  validate()
})

// Initialisation
watch(selectedQuantity, () => {
  updateFormattedValue()
})

// Au montage
if (props.show) {
  nextTick(() => {
    showBottomSheet()
  })
}

updateFormattedValue()
validate()

// Exposition des méthodes pour contrôle externe
defineExpose({
  show: showBottomSheet,
  hide
})
</script>

<style scoped>
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

/* Animation douce pour les boutons */
button {
  touch-action: manipulation;
}

/* Scroll lock pour le body quand la modal est ouverte */
.modal-open {
  overflow: hidden;
}
</style>