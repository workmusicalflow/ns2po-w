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

      <!-- Loading State -->
      <div v-if="isDataLoading" class="stepper-content">
        <div class="flex flex-col items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p class="text-gray-600">
            Chargement des données Turso...
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasDataError" class="stepper-content">
        <div class="flex flex-col items-center justify-center py-12">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-bold mb-2 text-red-800">
            Erreur de connexion
          </h3>
          <p class="text-gray-600 text-center mb-4">
            Impossible de charger les données depuis Turso.
          </p>
          <button
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            @click="$router.go(0)"
          >
            Réessayer
          </button>
        </div>
      </div>

      <!-- Normal Stepper Content -->
      <div v-else class="stepper-content">
        <!-- Étape 1: Choix du mode -->
        <StepChoixMode
          v-if="currentStep === 1"
          @select-mode="handleModeSelection"
        />

        <!-- Étape 2: Builder (sélection + configuration) -->
        <StepBuilder
          v-else-if="currentStep === 2"
          :mode="selectedMode"
          :bundles="transformedBundles"
          :products="transformedProducts"
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

    <!-- WhatsApp Quote Confirmation Modal -->
    <QuoteConfirmationModal
      :show="showSuccessModal"
      :whatsappOpened="whatsappOpened"
      :error="whatsappError"
      :fallbackEmail="whatsappConfig.fallbackEmail"
      :fallbackPhone="whatsappConfig.fallbackPhone"
      :whatsappLink="modalWhatsAppLink"
      :webWhatsappLink="modalWebWhatsAppLink"
      :rawMessage="modalRawMessage"
      @close="resetForm"
    />

    <!-- Email Confirmation Modal -->
    <EmailConfirmationModal
      :show="showEmailModal"
      :reference="emailQuoteReference"
      :trackingUrl="emailTrackingUrl"
      @close="showEmailModal = false"
      @new-quote="resetForm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// Components
import StepChoixMode from '~/components/devis/StepChoixMode.vue'
import StepBuilder from '~/components/devis/StepBuilder.vue'
import StepValidation from '~/components/devis/StepValidation.vue'
import StickyBottomBar from '~/components/StickyBottomBar.vue'
import QuoteConfirmationModal from '~/components/devis/QuoteConfirmationModal.vue'
import EmailConfirmationModal from '~/components/devis/EmailConfirmationModal.vue'

// Composables Turso
import { useCampaignBundles } from '~/composables/useCampaignBundles'
import { useProductsQuery } from '~/composables/useProductsQuery'

// WhatsApp Integration
import { useWhatsAppQuote } from '~/composables/useWhatsAppQuote'

// Email Integration
import { useEmailQuote } from '~/composables/useEmailQuote'

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
const showSuccessModal = ref(false)
const showEmailModal = ref(false)

// WhatsApp Configuration
const whatsappConfig = {
  phoneNumber: '2250777104936', // Numéro NS2PO réel utilisé dans les tests
  fallbackEmail: 'info@ns2po.com',
  fallbackPhone: '07 77 10 49 36'
}

// WhatsApp Quote Integration
const {
  isSubmitting,
  hasSubmitted,
  whatsappOpened,
  error: whatsappError,
  submitQuote,
  getWhatsAppLink,
  getWebWhatsAppLink,
  generateWhatsAppMessage,
  reset: resetWhatsApp
} = useWhatsAppQuote(whatsappConfig)

// Email Quote Integration
const {
  isSubmitting: isEmailSubmitting,
  hasSubmitted: hasEmailSubmitted,
  submitSuccess: emailSubmitSuccess,
  error: emailError,
  quoteReference: emailQuoteReference,
  trackingUrl: emailTrackingUrl,
  submitEmailQuote,
  reset: resetEmail
} = useEmailQuote()

// Turso Data Integration
const {
  bundles,
  loading: bundlesLoading,
  error: bundlesError
} = useCampaignBundles()

// Temporary: Use useFetch directly for debugging
const {
  data: productsResponse,
  pending: productsLoading,
  error: productsError
} = await useFetch('/api/products')

// Extract products from response
const products = computed(() => {
  console.log('🔍 Products Response:', productsResponse.value)
  if (productsResponse.value && productsResponse.value.success) {
    return productsResponse.value.data || []
  }
  return []
})

// Loading et Error States
const isDataLoading = computed(() => bundlesLoading.value || productsLoading.value)
const hasDataError = computed(() => bundlesError.value || productsError.value)

// Transform bundles to handle isPopular vs popularity difference
const transformedBundles = computed(() => {
  return (bundles.value || []).map(bundle => ({
    ...bundle,
    isPopular: bundle.popularity > 7, // Transform popularity number to boolean
    products: bundle.products?.map(p => ({
      ...p,
      // Preserve basePrice if it exists, otherwise map from other fields
      basePrice: p.basePrice || p.unitPrice || p.price || 0
    })) || []
  }))
})

// Transform products to match expected format
const transformedProducts = computed(() => {
  console.log('📦 Products from API:', products.value)
  return (products.value || []).map(product => ({
    ...product,
    basePrice: product.price || 0, // Map price to basePrice
    image_url: product.image || product.image_url || null // Unify image field mapping
  }))
})

// Logs pour debug
watch([bundles, products], ([newBundles, newProducts]) => {
  console.log('🔍 devis-new Data Updated:', {
    bundlesCount: newBundles?.length || 0,
    productsCount: newProducts?.length || 0,
    currentStep: currentStep.value
  })
}, { immediate: true })

// Computed
const cartTotal = computed(() => {
  const total = cartItems.value.reduce((sum, item) => sum + item.total, 0)
  console.log('💰 Calcul total panier:', {
    items: cartItems.value,
    total
  })
  return total
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
  console.log('🛒 Bundle sélectionné:', bundle)
  // Auto-populate cart with bundle products
  cartItems.value = bundle.products.map((p: any) => {
    const unitPrice = p.basePrice || p.unitPrice || 0
    const quantity = p.quantity || 1
    const total = quantity * unitPrice

    console.log('📦 Produit ajouté:', {
      name: p.name,
      unitPrice,
      quantity,
      total
    })

    return {
      id: p.id,
      name: p.name,
      quantity,
      unitPrice,
      total
    }
  })

  console.log('🛒 Panier final:', cartItems.value)
  console.log('💰 Total calculé:', cartTotal.value)
}

const handleCartUpdated = (items: any[]) => {
  cartItems.value = items
}

const handleNext = () => {
  if (!canProceed.value) return

  console.log('🚀 Passage à l\'étape suivante:', {
    etapeActuelle: currentStep.value,
    prochainEtape: currentStep.value + 1,
    panierActuel: cartItems.value,
    totalActuel: cartTotal.value
  })

  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const handleSubmit = async (formData: any) => {
  console.log('🚀 Démarrage soumission devis:', formData)
  console.log('📋 Canal sélectionné:', formData.channel)

  // Analyser les données reçues du formulaire StepValidation
  console.log('🔍 Structure formData reçue:', Object.keys(formData))
  console.log('📋 Contenu formData:', formData)

  // Router selon le canal choisi par l'utilisateur
  if (formData.channel === 'email') {
    await handleEmailSubmission(formData)
  } else {
    await handleWhatsAppSubmission(formData)
  }
}

const handleWhatsAppSubmission = async (formData: any) => {
  console.log('📱 Traitement soumission WhatsApp')

  // StepValidation envoie: { organization, name, phone, email, channel, items, total, timestamp }
  // Transformer les données pour le format WhatsApp
  const whatsappData = {
    organization: formData.organization?.trim() || 'Organisation à préciser',
    projectType: selectedMode.value === 'bundle'
      ? 'Campagne Électorale (Pack NS2PO)'
      : 'Campagne Électorale (Sélection Personnalisée)',
    contactName: formData.name?.trim() || 'Contact à préciser',
    contactPhone: formData.phone?.trim() || 'Téléphone à préciser',
    contactEmail: formData.email?.trim() || 'Contact via WhatsApp',
    cart: cartItems.value.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.total / item.quantity),
      total: item.total
    })),
    notes: 'Demande envoyée via le générateur de devis NS2PO - Canal préféré: WhatsApp'
  }

  console.log('📋 Données transformées pour WhatsApp:', whatsappData)

  try {
    await submitQuote(whatsappData)
    showSuccessModal.value = true

    console.log('✅ Soumission WhatsApp terminée:', {
      hasSubmitted: hasSubmitted.value,
      whatsappOpened: whatsappOpened.value,
      error: whatsappError.value
    })
  } catch (error) {
    console.error('❌ Erreur soumission WhatsApp:', error)
    showSuccessModal.value = true // Montrer la modal même en cas d'erreur pour les fallbacks
  }
}

const handleEmailSubmission = async (formData: any) => {
  console.log('📧 Traitement soumission Email')

  try {
    const result = await submitEmailQuote(formData, selectedMode.value, cartItems.value)

    if (result.success) {
      console.log('✅ Soumission Email réussie:', result)
      // Afficher la modal de confirmation email
      showEmailModal.value = true
    } else {
      console.error('❌ Échec soumission Email:', result.message)
      // En cas d'erreur, on peut fallback vers la modal WhatsApp ou afficher une erreur
      showSuccessModal.value = true
    }
  } catch (error) {
    console.error('❌ Erreur soumission Email:', error)
    // En cas d'erreur technique, fallback vers WhatsApp
    showSuccessModal.value = true
  }
}

const resetForm = () => {
  currentStep.value = 1
  selectedMode.value = 'bundle'
  cartItems.value = []
  showSuccessModal.value = false
  showEmailModal.value = false
  resetWhatsApp()
  resetEmail()
}

// Computed pour les données de la modal
const modalWhatsAppLink = computed(() => {
  if (!hasSubmitted.value || cartItems.value.length === 0) return '#'

  const mockData = {
    organization: 'Votre Organisation',
    projectType: 'Projet Électoral',
    contactName: 'Votre Nom',
    contactPhone: 'Votre Téléphone',
    contactEmail: 'votre@email.com',
    cart: cartItems.value.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.total / item.quantity),
      total: item.total
    })),
    notes: ''
  }

  return getWhatsAppLink(mockData)
})

const modalWebWhatsAppLink = computed(() => {
  if (!hasSubmitted.value || cartItems.value.length === 0) return '#'

  const mockData = {
    organization: 'Votre Organisation',
    projectType: 'Projet Électoral',
    contactName: 'Votre Nom',
    contactPhone: 'Votre Téléphone',
    contactEmail: 'votre@email.com',
    cart: cartItems.value.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.total / item.quantity),
      total: item.total
    })),
    notes: ''
  }

  return getWebWhatsAppLink(mockData)
})

const modalRawMessage = computed(() => {
  if (!hasSubmitted.value || cartItems.value.length === 0) return ''

  const mockData = {
    organization: 'Votre Organisation',
    projectType: 'Projet Électoral',
    contactName: 'Votre Nom',
    contactPhone: 'Votre Téléphone',
    contactEmail: 'votre@email.com',
    cart: cartItems.value.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.total / item.quantity),
      total: item.total
    })),
    notes: ''
  }

  return generateWhatsAppMessage(mockData)
})
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