<template>
  <div class="page-container">
    <div class="max-w-4xl mx-auto px-4 py-6">
      <!-- Header -->
      <header class="text-center mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-accent mb-3">
          Générateur de Devis
        </h1>
        <p class="text-gray-600">
          Créez votre devis personnalisé en quelques étapes simples
        </p>
      </header>

      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex items-center justify-between text-sm text-gray-500 mb-2">
          <span>Étape {{ currentStep }} sur {{ totalSteps }}</span>
          <span>{{ Math.round((currentStep / totalSteps) * 100) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          />
        </div>
      </div>

      <!-- Stepper Content -->
      <div class="stepper-content">
        <!-- Étape 1: Choix du mode -->
        <StepChoixMode
          v-if="currentStep === 1"
          @select-mode="handleModeSelection"
        />

        <!-- Étape 2: Builder (sélection + configuration) -->
        <StepBuilder
          v-else-if="currentStep === 2"
          :mode="selectedMode"
          :bundles="bundles"
          :products="products"
          @bundle-selected="handleBundleSelected"
          @cart-updated="handleCartUpdated"
        />

        <!-- Étape 3: Validation et envoi -->
        <StepValidation
          v-else-if="currentStep === 3"
          :cart-items="cartItems"
          :total="cartTotal"
          @submit="handleSubmit"
        />
      </div>
    </div>

    <!-- Sticky Bottom Bar -->
    <StickyBottomBar
      :total="cartTotal"
      :item-count="cartItems.length"
      :button-label="currentStepLabel"
      :loading="isSubmitting"
      :is-disabled="!canProceed"
      :show-progress="true"
      :current-step="currentStep"
      :total-steps="totalSteps"
      @action="handleNext"
    />

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg p-6 m-4 max-w-md">
        <div class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-bold mb-2">Devis envoyé !</h3>
          <p class="text-gray-600 mb-4">
            Votre demande de devis a été transmise avec succès.
            Notre équipe vous contactera dans les 24h.
          </p>
          <button
            @click="resetForm"
            class="w-full py-3 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark"
          >
            Nouveau devis
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Components
import StepChoixMode from '~/components/devis/StepChoixMode.vue'
import StepBuilder from '~/components/devis/StepBuilder.vue'
import StepValidation from '~/components/devis/StepValidation.vue'
import StickyBottomBar from '~/components/StickyBottomBar.vue'

// SEO
useHead({
  title: 'Générateur de Devis - NS2PO Élections',
  meta: [
    {
      name: 'description',
      content: 'Créez votre devis personnalisé pour vos produits de campagne électorale en 3 étapes simples'
    }
  ]
})

// State
const currentStep = ref(1)
const totalSteps = 3
const selectedMode = ref<'bundle' | 'custom'>('bundle')
const cartItems = ref<any[]>([])
const isSubmitting = ref(false)
const showSuccessModal = ref(false)

// Mock data - à remplacer par des composables réels
const bundles = ref([
  {
    id: 'municipal',
    name: 'Pack Municipal',
    description: 'Idéal pour les élections municipales',
    estimatedTotal: 500000,
    isPopular: false,
    products: [
      { id: '1', name: 'Affiches A2', quantity: 500, basePrice: 200 },
      { id: '2', name: 'T-shirts', quantity: 100, basePrice: 2500 },
      { id: '3', name: 'Casquettes', quantity: 50, basePrice: 3000 }
    ]
  },
  {
    id: 'regional',
    name: 'Pack Régional',
    description: 'Solution complète pour campagne régionale',
    estimatedTotal: 1500000,
    isPopular: true,
    products: [
      { id: '1', name: 'Affiches A2', quantity: 2000, basePrice: 200 },
      { id: '2', name: 'T-shirts', quantity: 500, basePrice: 2500 },
      { id: '3', name: 'Casquettes', quantity: 200, basePrice: 3000 },
      { id: '4', name: 'Banderoles', quantity: 20, basePrice: 15000 }
    ]
  },
  {
    id: 'national',
    name: 'Pack National',
    description: 'Pour les grandes campagnes nationales',
    estimatedTotal: 5000000,
    isPopular: false,
    products: [
      { id: '1', name: 'Affiches A2', quantity: 10000, basePrice: 200 },
      { id: '2', name: 'T-shirts', quantity: 2000, basePrice: 2500 },
      { id: '3', name: 'Casquettes', quantity: 1000, basePrice: 3000 },
      { id: '4', name: 'Banderoles', quantity: 100, basePrice: 15000 }
    ]
  }
])

const products = ref([
  { id: '1', name: 'Affiches A2', category: 'Affiches', basePrice: 200, image: null },
  { id: '2', name: 'Affiches A3', category: 'Affiches', basePrice: 150, image: null },
  { id: '3', name: 'T-shirts', category: 'Textile', basePrice: 2500, image: null },
  { id: '4', name: 'Polo', category: 'Textile', basePrice: 3500, image: null },
  { id: '5', name: 'Casquettes', category: 'Accessoires', basePrice: 3000, image: null },
  { id: '6', name: 'Banderoles', category: 'Signalétique', basePrice: 15000, image: null },
  { id: '7', name: 'Flyers A5', category: 'Affiches', basePrice: 50, image: null }
])

// Computed
const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.total, 0)
})

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return selectedMode.value !== null
    case 2:
      return cartItems.value.length > 0
    case 3:
      return cartItems.value.length > 0 && cartTotal.value > 0
    default:
      return false
  }
})

const currentStepLabel = computed(() => {
  switch (currentStep.value) {
    case 1:
      return 'Continuer'
    case 2:
      return 'Valider la sélection'
    case 3:
      return 'Envoyer le devis'
    default:
      return 'Suivant'
  }
})

// Methods
const handleModeSelection = (mode: 'bundle' | 'custom') => {
  selectedMode.value = mode
  nextTick(() => {
    if (canProceed.value) {
      handleNext()
    }
  })
}

const handleBundleSelected = (bundle: any) => {
  // Auto-populate cart with bundle products
  cartItems.value = bundle.products.map((p: any) => ({
    id: p.id,
    name: p.name,
    quantity: p.quantity,
    unitPrice: p.basePrice,
    total: p.quantity * p.basePrice
  }))
}

const handleCartUpdated = (items: any[]) => {
  cartItems.value = items
}

const handleNext = () => {
  if (!canProceed.value) return

  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const handleSubmit = async (formData: any) => {
  isSubmitting.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Show success modal
    showSuccessModal.value = true
  } catch (error) {
    console.error('Erreur envoi devis:', error)
    // Handle error (show toast, etc.)
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  currentStep.value = 1
  selectedMode.value = 'bundle'
  cartItems.value = []
  showSuccessModal.value = false
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  padding-bottom: 120px; /* Space for sticky bottom bar */
}

.stepper-content {
  min-height: 400px;
}

/* Smooth scrolling on mobile */
@media (max-width: 768px) {
  .page-container {
    padding-bottom: 140px; /* More space on mobile */
  }
}
</style>