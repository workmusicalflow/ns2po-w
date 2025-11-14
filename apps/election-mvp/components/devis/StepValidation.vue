<template>
  <div class="step-validation">
    <!-- Récapitulatif collapsible (REPOSITIONNÉ EN HAUT) -->
    <div class="summary-section mb-8">
      <button
        class="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        @click="showSummary = !showSummary"
      >
        <div class="flex items-center gap-3">
          <svg
            :class="['w-5 h-5 transition-transform', showSummary ? 'rotate-90' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="font-medium">Récapitulatif du devis</span>
        </div>

        <div class="text-right">
          <p class="text-sm text-gray-600">
            {{ cartItems.length }} produits
          </p>
          <p class="font-bold text-primary">
            {{ formatPrice(total) }}
          </p>
        </div>
      </button>

      <!-- Détails du récap -->
      <div v-if="showSummary" class="mt-4 p-4 bg-white rounded-lg border border-gray-200">
        <div class="space-y-3">
          <div v-for="item in cartItems" :key="item.id" class="flex items-center justify-between text-sm gap-3">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <!-- Thumbnail produit -->
              <img
                v-if="item.image_url"
                :src="getThumbnailUrl(item.image_url)"
                :alt="item.name"
                class="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
              />
              <div v-else class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span class="truncate">{{ item.name }} x{{ item.quantity }}</span>
            </div>
            <span class="font-medium whitespace-nowrap">{{ formatPrice(item.total) }}</span>
          </div>
        </div>
        <div class="border-t mt-4 pt-4">
          <div class="flex justify-between font-bold">
            <span>Total TTC</span>
            <span class="text-primary">{{ formatPrice(total) }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Délai estimé: 5-7 jours ouvrés
          </p>
        </div>
      </div>
    </div>

    <!-- Formulaire minimal (REPOSITIONNÉ APRÈS LE RÉCAP) -->
    <div class="form-section mb-8">
      <h3 class="text-lg font-bold mb-4">
        Vos coordonnées
      </h3>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Nom -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Nom complet *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            placeholder="Ex: Jean Kouassi"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
        </div>

        <!-- Téléphone -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
            Téléphone WhatsApp *
          </label>
          <div class="flex gap-2">
            <span class="px-3 py-3 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-600">
              +225
            </span>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              required
              pattern="[0-9]{10}"
              placeholder="07 00 00 00 00"
              class="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
          </div>
        </div>

        <!-- Email (toujours visible) -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
            Adresse email *
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="exemple@email.com"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
        </div>

        <!-- Phase 3: Confirmation réception email uniquement -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-blue-900">
                Votre devis sera envoyé par email
              </p>
              <p class="text-xs text-blue-700 mt-1">
                Vous recevrez une confirmation dans les prochaines minutes
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Actions -->
    <div class="actions-section">
      <button
        :disabled="!isValid || isSubmitting"
        class="w-full py-4 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
        :aria-busy="isSubmitting"
        :aria-live="isSubmitting ? 'polite' : 'off'"
        @click="handleSubmit"
      >
        <!-- Loading spinner (visible pendant isSubmitting) -->
        <svg
          v-if="isSubmitting"
          class="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="status"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>

        <!-- Texte du bouton (change selon isSubmitting) -->
        <span v-if="isSubmitting" role="status">Envoi en cours...</span>
        <span v-else>Envoyer le devis</span>
      </button>

      <p class="text-xs text-center text-gray-500 mt-3">
        En envoyant ce devis, vous acceptez d'être contacté par notre équipe commerciale
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Composables
const { getThumbnailUrl } = useCloudinary()

// Props
const props = defineProps<{
  cartItems: any[]
  total: number
  isSubmitting?: boolean // État de soumission depuis le parent
}>()

// Emits
const emit = defineEmits<{
  submit: [data: any]
}>()

// State
const form = ref({
  name: '',
  phone: '',
  email: '',
  channel: 'email' as 'email' // Phase 3: Email uniquement
})

const showSummary = ref(true) // Ouvert par défaut (meilleure visibilité en haut)

// Computed
const isValid = computed(() => {
  const hasName = form.value.name.trim().length > 0
  const hasPhone = form.value.phone.length >= 10
  const hasEmail = form.value.email.includes('@')

  return hasName && hasPhone && hasEmail
})

// Methods
const handleSubmit = () => {
  if (!isValid.value) return

  const data = {
    ...form.value,
    phone: '+225' + form.value.phone.replace(/\s/g, ''),
    items: props.cartItems,
    total: props.total,
    timestamp: new Date().toISOString()
  }

  emit('submit', data)
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}
</script>

<style scoped>
input,
button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

input[type="tel"]::-webkit-inner-spin-button,
input[type="tel"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.channel-option {
  touch-action: manipulation;
  user-select: none;
}
</style>