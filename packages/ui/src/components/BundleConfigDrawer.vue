<!--
  BundleConfigDrawer.vue
  Drawer de configuration de bundle pour l'interface Master-Detail
  Permet la personnalisation avancée des produits du bundle sélectionné
-->

<template>
  <div>
    <!-- Overlay -->
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
      @click="closeDrawer"
    ></div>

    <!-- Drawer -->
    <div
      :class="[
        'fixed right-0 top-0 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50',
        'w-full md:w-96 lg:w-[480px]',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <!-- Header -->
      <div class="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xl font-heading font-bold text-accent">
              Configuration du Pack
            </h3>
            <p v-if="bundle" class="text-sm text-gray-600 mt-1">
              {{ bundle.name }}
            </p>
          </div>

          <button
            @click="closeDrawer"
            class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading State -->
        <div v-if="loading" class="p-6 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-gray-600">Chargement de la configuration...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="p-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p class="font-semibold">Erreur de chargement</p>
            <p class="text-sm mt-1">{{ error }}</p>
          </div>
        </div>

        <!-- Configuration Content -->
        <div v-else-if="bundle" class="p-6 space-y-6">
          <!-- Bundle Summary -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="font-semibold text-gray-900 mb-2">Résumé du pack</h4>
            <div class="text-sm text-gray-600 space-y-1">
              <div class="flex justify-between">
                <span>Audience cible:</span>
                <span class="font-medium">{{ getAudienceLabel(bundle.targetAudience) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Niveau budgétaire:</span>
                <span class="font-medium">{{ getBudgetLabel(bundle.budgetRange) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Produits inclus:</span>
                <span class="font-medium">{{ bundle.products.length }}</span>
              </div>
            </div>
          </div>

          <!-- Products Configuration -->
          <div>
            <h4 class="font-semibold text-gray-900 mb-4">Configuration des produits</h4>
            <div class="space-y-3">
              <ProductConfigLine
                v-for="(product, index) in configuredProducts"
                :key="`${product.id}-${index}`"
                :product="product"
                :quantity="product.quantity"
                :unit-price="product.unitPrice"
                :min-quantity="product.minQuantity || 1"
                :max-quantity="product.maxQuantity || 10000"
                :bundle-mode="true"
                :savings="product.savings || 0"
                :removable="bundle.products.length > 1"
                @quantity-change="updateProductQuantity(product.id, $event)"
                @remove="removeProduct(product.id)"
                @show-details="showProductDetails(product)"
              />
            </div>
          </div>

          <!-- Add Products Section -->
          <div class="border-t pt-6">
            <h4 class="font-semibold text-gray-900 mb-4">Ajouter des produits</h4>
            <button
              @click="$emit('add-products')"
              class="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
            >
              <svg class="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span class="text-sm font-medium">Ajouter des produits</span>
            </button>
          </div>

          <!-- Pricing Summary -->
          <div class="border-t pt-6">
            <h4 class="font-semibold text-gray-900 mb-4">Résumé des prix</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Sous-total produits:</span>
                <span class="font-medium">{{ formatPrice(subtotal) }}</span>
              </div>
              <div v-if="totalSavings > 0" class="flex justify-between text-green-600">
                <span>Économies bundle:</span>
                <span class="font-medium">-{{ formatPrice(totalSavings) }}</span>
              </div>
              <div class="border-t pt-2 flex justify-between text-lg font-bold text-primary">
                <span>Total estimé:</span>
                <span>{{ formatPrice(totalPrice) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="p-6 text-center text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="font-medium">Aucun pack sélectionné</p>
          <p class="text-sm mt-1">Sélectionnez un pack pour le configurer</p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div v-if="bundle && !loading && !error" class="border-t p-6 bg-gray-50">
        <div class="flex gap-3">
          <button
            @click="resetConfiguration"
            class="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Réinitialiser
          </button>
          <button
            @click="saveConfiguration"
            class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { CampaignBundle, BundleTargetAudience, BundleBudgetRange } from '@ns2po/types';
import ProductConfigLine from './ProductConfigLine.vue';

// =====================================
// PROPS & EMITS
// =====================================

interface ConfiguredProduct {
  id: string;
  name: string;
  description?: string;
  image?: string;
  tags?: string[];
  basePrice: number;
  unitPrice: number;
  quantity: number;
  minQuantity?: number;
  maxQuantity?: number;
  savings?: number;
}

interface Props {
  isOpen: boolean;
  bundle?: CampaignBundle | null;
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  bundle: null,
  loading: false,
  error: '',
});

const emit = defineEmits<{
  'close': [];
  'save': [products: ConfiguredProduct[]];
  'reset': [];
  'add-products': [];
  'product-details': [product: ConfiguredProduct];
}>();

// =====================================
// LOCAL STATE
// =====================================

const configuredProducts = ref<ConfiguredProduct[]>([]);

// =====================================
// COMPUTED PROPERTIES
// =====================================

const subtotal = computed(() => {
  return configuredProducts.value.reduce((sum, product) => {
    return sum + (product.unitPrice * product.quantity);
  }, 0);
});

const totalSavings = computed(() => {
  return configuredProducts.value.reduce((sum, product) => {
    return sum + (product.savings || 0);
  }, 0);
});

const totalPrice = computed(() => {
  return subtotal.value - totalSavings.value;
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
 * Labels d'audience
 */
const getAudienceLabel = (audience: BundleTargetAudience): string => {
  const labels = {
    local: 'Campagne Locale',
    regional: 'Campagne Régionale',
    national: 'Campagne Nationale',
    universal: 'Tous Niveaux',
  };
  return labels[audience] || audience;
};

/**
 * Labels de budget
 */
const getBudgetLabel = (budget: BundleBudgetRange): string => {
  const labels = {
    starter: 'Starter',
    standard: 'Standard',
    medium: 'Medium',
    premium: 'Premium',
    enterprise: 'Enterprise',
  };
  return labels[budget] || budget;
};

/**
 * Initialiser les produits configurés depuis le bundle
 */
const initializeProducts = () => {
  if (!props.bundle) {
    configuredProducts.value = [];
    return;
  }

  configuredProducts.value = props.bundle.products.map(product => ({
    id: product.id,
    name: product.name,
    description: undefined, // BundleProduct n'a pas de description
    image: undefined, // BundleProduct n'a pas d'image
    tags: undefined, // BundleProduct n'a pas de tags
    basePrice: product.basePrice || 0,
    unitPrice: product.basePrice || 0, // BundleProduct n'a pas de unitPrice
    quantity: product.quantity,
    minQuantity: 1, // BundleProduct n'a pas de minQuantity
    maxQuantity: 10000, // BundleProduct n'a pas de maxQuantity
    savings: 0, // BundleProduct n'a pas de savings
  }));
};

/**
 * Mettre à jour la quantité d'un produit
 */
const updateProductQuantity = (productId: string, newQuantity: number) => {
  const product = configuredProducts.value.find(p => p.id === productId);
  if (product) {
    product.quantity = newQuantity;
  }
};

/**
 * Supprimer un produit
 */
const removeProduct = (productId: string) => {
  configuredProducts.value = configuredProducts.value.filter(p => p.id !== productId);
};

/**
 * Afficher les détails d'un produit
 */
const showProductDetails = (product: ConfiguredProduct) => {
  emit('product-details', product);
};

/**
 * Fermer le drawer
 */
const closeDrawer = () => {
  emit('close');
};

/**
 * Sauvegarder la configuration
 */
const saveConfiguration = () => {
  emit('save', configuredProducts.value);
};

/**
 * Réinitialiser la configuration
 */
const resetConfiguration = () => {
  initializeProducts();
  emit('reset');
};

// =====================================
// WATCHERS
// =====================================

// Initialiser les produits quand le bundle change
watch(
  () => props.bundle,
  () => {
    initializeProducts();
  },
  { immediate: true }
);

// Réinitialiser quand le drawer s'ouvre
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      initializeProducts();
    }
  }
);
</script>

<style scoped>
/* Transitions fluides pour le drawer */
.transform {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scroll personnalisé */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E0 #F7FAFC;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #F7FAFC;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #CBD5E0;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #A0AEC0;
}
</style>