<!--
  QuickCartItem.vue
  Composant pour afficher et modifier un produit individuel dans le panier rapide
  Utilisé par QuickCartCustomizer pour les lignes d'articles
-->

<template>
  <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
    <div class="flex items-start gap-4">
      <!-- Image du produit (placeholder) -->
      <div
        class="w-16 h-16 bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center flex-shrink-0"
      >
        <svg
          class="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>

      <!-- Informations du produit -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 truncate">
              {{ displayName }}
            </h4>
            <p class="text-sm text-gray-600 mt-1">
              {{ formatPrice(unitPrice) }} × {{ currentQuantity }}
            </p>

            <!-- Badge bundle si applicable -->
            <div v-if="bundleMode && fromBundle" class="mt-2">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
              >
                Pack inclus
              </span>
            </div>
          </div>

          <!-- Prix total -->
          <div class="text-right">
            <div class="font-semibold text-gray-900">
              {{ formatPrice(totalPrice) }}
            </div>
            <div v-if="hasDiscount" class="text-xs text-gray-500 line-through">
              {{ formatPrice(originalPrice) }}
            </div>
          </div>
        </div>

        <!-- Contrôles de quantité -->
        <div class="flex items-center justify-between mt-4">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">Quantité:</label>
            <div class="flex items-center border border-gray-300 rounded-lg">
              <button
                @click="decreaseQuantity"
                :disabled="currentQuantity <= 1"
                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <input
                :value="currentQuantity"
                @input="updateQuantityFromInput"
                @blur="validateQuantity"
                type="number"
                min="1"
                max="10000"
                class="w-16 h-8 text-center text-sm border-0 focus:ring-0 focus:outline-none bg-transparent"
              />

              <button
                @click="increaseQuantity"
                :disabled="currentQuantity >= maxQuantity"
                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Bouton de suppression -->
          <button
            @click="removeItem"
            class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <!-- Alerte quantité minimale si bundle -->
        <div
          v-if="bundleMode && showMinQuantityWarning"
          class="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <div class="flex items-center gap-2 text-sm text-amber-800">
            <svg
              class="w-4 h-4 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span
              >Quantité recommandée pour ce pack:
              {{ recommendedQuantity }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { BundleProduct, ProductSelection } from "@ns2po/types";

// =====================================
// PROPS & EMITS
// =====================================

interface Props {
  // Mode bundle ou produit individuel
  bundleMode: boolean;

  // Props pour mode bundle
  product?: BundleProduct;
  fromBundle?: string;

  // Props pour mode sélection personnalisée
  selection?: ProductSelection;

  // Props communes
  maxQuantity?: number;
  showRecommendedQuantity?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxQuantity: 10000,
  showRecommendedQuantity: true,
});

const emit = defineEmits<{
  "quantity-change": [quantity: number];
  remove: [];
}>();

// =====================================
// REACTIVE DATA
// =====================================

const isEditing = ref(false);

// =====================================
// COMPUTED PROPERTIES
// =====================================

// Nom d'affichage selon le mode
const displayName = computed(() => {
  if (props.bundleMode && props.product) {
    return props.product.name;
  }
  if (!props.bundleMode && props.selection) {
    return `Produit ${props.selection.productId}`; // TODO: récupérer le vrai nom via un store
  }
  return "Produit inconnu";
});

// Quantité actuelle
const currentQuantity = computed(() => {
  if (props.bundleMode && props.product) {
    return props.product.quantity;
  }
  if (!props.bundleMode && props.selection) {
    return props.selection.quantity;
  }
  return 1;
});

// Prix unitaire
const unitPrice = computed(() => {
  if (props.bundleMode && props.product) {
    return props.product.basePrice;
  }
  // Pour la sélection personnalisée, on devrait récupérer le prix via un store/API
  return 2500; // Prix par défaut temporaire
});

// Prix total de la ligne
const totalPrice = computed(() => {
  return unitPrice.value * currentQuantity.value;
});

// Prix original (sans remise bundle)
const originalPrice = computed(() => {
  if (props.bundleMode && props.product) {
    // Dans un bundle, on pourrait avoir une remise
    return unitPrice.value * currentQuantity.value * 1.1; // Simulation 10% de remise
  }
  return totalPrice.value;
});

// Y a-t-il une remise ?
const hasDiscount = computed(() => {
  return props.bundleMode && originalPrice.value > totalPrice.value;
});

// Quantité recommandée (pour bundles)
const recommendedQuantity = computed(() => {
  if (props.bundleMode && props.product) {
    return props.product.quantity; // La quantité du bundle original
  }
  return currentQuantity.value;
});

// Afficher l'alerte de quantité minimale
const showMinQuantityWarning = computed(() => {
  return (
    props.bundleMode &&
    props.showRecommendedQuantity &&
    currentQuantity.value < recommendedQuantity.value
  );
});

// =====================================
// METHODS
// =====================================

/**
 * Formatage du prix en XOF
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Augmente la quantité
 */
const increaseQuantity = () => {
  const newQuantity = Math.min(currentQuantity.value + 1, props.maxQuantity);
  emit("quantity-change", newQuantity);
};

/**
 * Diminue la quantité
 */
const decreaseQuantity = () => {
  const newQuantity = Math.max(currentQuantity.value - 1, 1);
  emit("quantity-change", newQuantity);
};

/**
 * Met à jour la quantité depuis l'input
 */
const updateQuantityFromInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newQuantity = parseInt(target.value) || 1;
  validateAndEmitQuantity(newQuantity);
};

/**
 * Valide et force la quantité dans les limites
 */
const validateQuantity = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const quantity = parseInt(target.value) || 1;
  const validQuantity = Math.min(Math.max(quantity, 1), props.maxQuantity);

  // Force la valeur dans l'input si elle a été corrigée
  if (validQuantity !== quantity) {
    target.value = validQuantity.toString();
  }

  validateAndEmitQuantity(validQuantity);
};

/**
 * Valide et émet le changement de quantité
 */
const validateAndEmitQuantity = (quantity: number) => {
  const validQuantity = Math.min(Math.max(quantity, 1), props.maxQuantity);
  emit("quantity-change", validQuantity);
};

/**
 * Supprime l'article
 */
const removeItem = () => {
  emit("remove");
};
</script>

<style scoped>
/* Styles personnalisés pour l'item du panier */

/* Animation pour les changements de quantité */
.quantity-change-enter-active,
.quantity-change-leave-active {
  transition: all 0.2s ease;
}

.quantity-change-enter-from,
.quantity-change-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Style pour les inputs de quantité */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Hover effect pour les boutons */
.hover-grow:hover {
  transform: scale(1.05);
}

/* Style pour l'état disabled */
.disabled-state {
  opacity: 0.6;
  pointer-events: none;
}
</style>
