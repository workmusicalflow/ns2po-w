<template>
  <div class="step-validation">
    <!-- Formulaire minimal -->
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

        <!-- Canal de réception -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Comment souhaitez-vous recevoir votre devis ?
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              :class="[
                'channel-option p-3 rounded-lg border-2 transition-all',
                form.channel === 'whatsapp'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="form.channel = 'whatsapp'"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.188 8.188 0 01-1.26-4.38c.01-4.54 3.7-8.23 8.25-8.23M8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1 2.56.12.17 1.76 2.67 4.25 3.73.59.27 1.05.43 1.41.55.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18s-.22-.16-.47-.28-.72-.35-1.48-.71c-.75-.35-.87-.42-1.05-.14-.17.28-.68.85-.84 1.03-.16.18-.33.2-.61.06-.28-.13-1.19-.44-2.26-1.4-.84-.74-1.4-1.67-1.57-1.95-.17-.28-.02-.42.12-.56.27-.25.38-.41.57-.68.2-.27.13-.5.06-.71-.06-.2-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.43-.14-.01-.3-.02-.46-.02z" />
                </svg>
                <span class="font-medium">WhatsApp</span>
              </div>
            </button>

            <button
              type="button"
              :class="[
                'channel-option p-3 rounded-lg border-2 transition-all',
                form.channel === 'email'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="form.channel = 'email'"
            >
              <div class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span class="font-medium">Email</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Email (si sélectionné) -->
        <div v-if="form.channel === 'email'">
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
      </form>
    </div>

    <!-- Récapitulatif collapsible -->
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
        <div class="space-y-2">
          <div v-for="item in cartItems" :key="item.id" class="flex justify-between text-sm">
            <span>{{ item.name }} x{{ item.quantity }}</span>
            <span class="font-medium">{{ formatPrice(item.total) }}</span>
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

    <!-- Actions -->
    <div class="actions-section">
      <button
        :disabled="!isValid"
        class="w-full py-4 px-6 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handleSubmit"
      >
        Envoyer le devis
      </button>

      <p class="text-xs text-center text-gray-500 mt-3">
        En envoyant ce devis, vous acceptez d'être contacté par notre équipe commerciale
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
const props = defineProps<{
  cartItems: any[]
  total: number
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
  channel: 'whatsapp' as 'whatsapp' | 'email'
})

const showSummary = ref(false)

// Computed
const isValid = computed(() => {
  const hasName = form.value.name.trim().length > 0
  const hasPhone = form.value.phone.length >= 10
  const hasEmail = form.value.channel === 'email' ? form.value.email.includes('@') : true

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