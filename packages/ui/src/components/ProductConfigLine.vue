<!--
  ProductConfigLine.vue
  Composant de ligne de configuration produit individuel dans l'interface Master-Detail
  Permet d'ajuster quantité, voir détails et supprimer un produit du bundle
-->

<template>
  <div
    class="product-config-line"
    :class="[
      'bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200',
      isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-gray-300',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    ]"
    @click="!disabled && $emit('select')"
  >
    <!-- Header avec image et infos produit -->
    <div class="flex items-start gap-4">
      <!-- Image produit -->
      <div class="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <img
          v-if="product.image"
          :src="product.image"
          :alt="product.name"
          class="w-full h-full object-cover rounded-lg"
        />
        <svg
          v-else
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

      <!-- Informations produit -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 truncate">
              {{ product.name }}
            </h4>
            <p v-if="product.description" class="text-sm text-gray-600 mt-1 line-clamp-2">
              {{ product.description }}
            </p>

            <!-- Tags -->
            <div v-if="product.tags && product.tags.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="tag in product.tags.slice(0, 3)"
                :key="tag"
                class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {{ tag }}
              </span>
              <span
                v-if="product.tags.length > 3"
                class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                +{{ product.tags.length - 3 }}
              </span>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="flex items-center gap-2 ml-4">
            <!-- Bouton détails -->
            <button
              v-if="showDetails"
              @click.stop="$emit('show-details')"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Voir les détails"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <!-- Bouton supprimer -->
            <button
              v-if="removable"
              @click.stop="$emit('remove')"
              class="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Configuration quantité et prix -->
    <div class="mt-4 pt-4 border-t border-gray-100">
      <div class="flex items-center justify-between">
        <!-- Contrôles de quantité -->
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-gray-700">Quantité:</label>
          <div class="flex items-center border border-gray-300 rounded-lg">
            <button
              @click.stop="decrementQuantity"
              :disabled="quantity <= minQuantity || disabled"
              class="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>

            <input
              :value="quantity"
              @input="updateQuantity(($event.target as HTMLInputElement)?.value || '')"
              @click.stop
              :min="minQuantity"
              :max="maxQuantity"
              :disabled="disabled"
              type="number"
              class="w-16 px-2 py-2 text-center border-none focus:ring-0 disabled:bg-gray-50"
            />

            <button
              @click.stop="incrementQuantity"
              :disabled="quantity >= maxQuantity || disabled"
              class="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <!-- Contraintes quantité -->
          <span class="text-xs text-gray-500">
            ({{ minQuantity }}-{{ maxQuantity }})
          </span>
        </div>

        <!-- Prix -->
        <div class="text-right">
          <div class="text-sm text-gray-600">
            {{ formatPrice(unitPrice) }} × {{ quantity }}
          </div>
          <div class="font-semibold text-primary">
            {{ formatPrice(totalPrice) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Mode bundle - Indicateur économies -->
    <div v-if="bundleMode && savings > 0" class="mt-3 pt-3 border-t border-green-100">
      <div class="flex items-center gap-2 text-green-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
        <span class="text-sm font-medium">
          Économie: {{ formatPrice(savings) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// =====================================
// PROPS & EMITS
// =====================================

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  tags?: string[];
  basePrice: number;
  minQuantity?: number;
  maxQuantity?: number;
}

interface Customization {
  id: string;
  name: string;
  price: number;
}

interface Props {
  // Produit
  product: Product;
  quantity: number;
  unitPrice: number;
  customizations?: Customization[];

  // Contraintes
  minQuantity?: number;
  maxQuantity?: number;

  // État
  isSelected?: boolean;
  disabled?: boolean;
  bundleMode?: boolean;

  // Affichage
  showDetails?: boolean;
  showCustomizations?: boolean;
  removable?: boolean;

  // Prix
  savings?: number;
}

const props = withDefaults(defineProps<Props>(), {
  customizations: () => [],
  minQuantity: 1,
  maxQuantity: 10000,
  isSelected: false,
  disabled: false,
  bundleMode: false,
  showDetails: true,
  showCustomizations: true,
  removable: true,
  savings: 0,
});

const emit = defineEmits<{
  'quantity-change': [quantity: number];
  'select': [];
  'remove': [];
  'show-details': [];
}>();

// =====================================
// COMPUTED PROPERTIES
// =====================================

const totalPrice = computed(() => {
  const baseTotal = props.unitPrice * props.quantity;
  const customizationsTotal = props.customizations.reduce((sum, custom) => sum + custom.price, 0);
  return baseTotal + customizationsTotal;
});

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

/**
 * Incrémenter la quantité
 */
const incrementQuantity = () => {
  if (props.quantity < props.maxQuantity) {
    emit('quantity-change', props.quantity + 1);
  }
};

/**
 * Décrémenter la quantité
 */
const decrementQuantity = () => {
  if (props.quantity > props.minQuantity) {
    emit('quantity-change', props.quantity - 1);
  }
};

/**
 * Mettre à jour la quantité via input
 */
const updateQuantity = (value: string) => {
  const numValue = parseInt(value, 10);
  if (isNaN(numValue)) return;

  const clampedValue = Math.max(props.minQuantity, Math.min(props.maxQuantity, numValue));
  emit('quantity-change', clampedValue);
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Transition pour le mode sélectionné */
.product-config-line {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animation au survol */
.product-config-line:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Suppression du spinner des input number */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
