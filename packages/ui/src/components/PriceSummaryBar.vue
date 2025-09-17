<!--
  PriceSummaryBar.vue
  Barre de résumé de prix persistante pour l'interface Master-Detail
  Affiche le total, économies et actions principales
-->

<template>
  <div
    class="price-summary-bar"
    :class="[
      'bg-white border-t border-gray-200 p-4 shadow-lg',
      'sticky bottom-0 left-0 right-0 z-40',
      'transition-all duration-300 ease-in-out'
    ]"
  >
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between gap-4">
        <!-- Résumé rapide produits -->
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-600">
            <span class="font-medium">{{ totalItems }}</span>
            {{ totalItems > 1 ? 'produits' : 'produit' }}
          </div>

          <!-- Indicateur économies -->
          <div
            v-if="totalSavings > 0"
            class="flex items-center gap-1 text-green-600"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span class="text-xs font-semibold">
              -{{ formatPrice(totalSavings) }}
            </span>
          </div>
        </div>

        <!-- Prix total -->
        <div class="flex items-center gap-6">
          <!-- Détail prix -->
          <div class="text-right">
            <div class="text-sm text-gray-600">
              Total estimé
            </div>
            <div class="text-2xl font-bold text-primary">
              {{ formatPrice(totalPrice) }}
            </div>
          </div>

          <!-- Actions principales -->
          <div class="flex gap-3">
            <!-- Bouton personnaliser (si mode bundle) -->
            <button
              v-if="bundleMode && !customizing"
              @click="$emit('customize')"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Personnaliser
            </button>

            <!-- Bouton retour bundle (si mode custom) -->
            <button
              v-if="customizing"
              @click="$emit('back-to-bundle')"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Retour au pack
            </button>

            <!-- Bouton principal CTA -->
            <button
              @click="$emit('generate-quote')"
              :disabled="totalItems === 0 || loading"
              class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <span v-if="loading" class="flex items-center gap-2">
                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Génération...
              </span>
              <span v-else>
                Générer le devis
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Barre de progression (optionnelle) -->
      <div
        v-if="showProgress && maxBudget > 0"
        class="mt-3 pt-3 border-t border-gray-100"
      >
        <div class="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>Budget utilisé</span>
          <span>{{ Math.round((totalPrice / maxBudget) * 100) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="bg-primary rounded-full h-2 transition-all duration-300"
            :class="{
              'bg-yellow-500': (totalPrice / maxBudget) > 0.8,
              'bg-red-500': (totalPrice / maxBudget) > 1
            }"
            :style="{ width: `${Math.min((totalPrice / maxBudget) * 100, 100)}%` }"
          ></div>
        </div>
      </div>

      <!-- Mode compact mobile -->
      <div
        v-if="compact"
        class="md:hidden mt-3 pt-3 border-t border-gray-100"
      >
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600">{{ totalItems }} produit(s)</span>
          <span class="font-bold text-primary">{{ formatPrice(totalPrice) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// =====================================
// PROPS & EMITS
// =====================================

interface Props {
  // Prix et totaux
  totalPrice: number;
  totalItems: number;
  totalSavings?: number;

  // Configuration
  bundleMode?: boolean;
  customizing?: boolean;
  loading?: boolean;

  // Affichage
  compact?: boolean;
  showProgress?: boolean;
  maxBudget?: number;

  // États
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  totalSavings: 0,
  bundleMode: false,
  customizing: false,
  loading: false,
  compact: false,
  showProgress: false,
  maxBudget: 0,
  disabled: false,
});

const emit = defineEmits<{
  'customize': [];
  'back-to-bundle': [];
  'generate-quote': [];
}>();

// =====================================
// COMPUTED PROPERTIES
// =====================================

// Pas de computed properties nécessaires pour le moment

// =====================================
// METHODS
// =====================================

/**
 * Formatage du prix en XOF
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};
</script>

<style scoped>
/* Animation d'entrée */
.price-summary-bar {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive breakpoints personnalisés */
@media (max-width: 640px) {
  .price-summary-bar {
    padding: 1rem;
  }
}

/* Animation de pulsation pour le CTA */
.price-summary-bar button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 154, 59, 0.3);
}
</style>
