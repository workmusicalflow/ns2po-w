<template>
  <div class="min-h-screen bg-background py-12 px-4">
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-3xl font-heading font-bold text-accent mb-3">
          Obtenez votre devis en 30 secondes
        </h1>
        <p class="text-text-main/70">
          Sélectionnez votre produit et recevez une estimation instantanée
        </p>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
          />
          <p class="mt-4 text-text-main/60">
            Chargement des produits...
          </p>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
        >
          <p class="font-semibold">
            Erreur de chargement
          </p>
          <p class="text-sm mt-1">
            {{ error }}
          </p>
        </div>

        <!-- Main Form -->
        <div v-else class="space-y-6">
          <!-- Product Selection -->
          <div>
            <h2 class="text-lg font-semibold text-text-main mb-6">
              1. Choisissez votre produit
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="item in quoteItems"
                :key="item.id"
                class="relative bg-white border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
                :class="{
                  'border-primary bg-primary/5': selectedProductId === item.id,
                  'border-gray-200 hover:border-gray-300':
                    selectedProductId !== item.id,
                }"
                @click="selectProduct(item.id)"
              >
                <!-- Product Image -->
                <div
                  class="relative h-32 bg-gray-50 rounded-lg overflow-hidden mb-3"
                >
                  <img
                    v-if="getProductImage(item.name)"
                    :src="getProductImage(item.name)"
                    :alt="item.name"
                    class="w-full h-full object-cover"
                    @error="handleCardImageError"
                  >
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-gray-400"
                  >
                    <svg
                      class="w-12 h-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7 3"
                      />
                    </svg>
                  </div>
                  <!-- Selected Indicator -->
                  <div
                    v-if="selectedProductId === item.id"
                    class="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <!-- Product Info -->
                <div class="text-center">
                  <h3 class="font-semibold text-text-main text-sm mb-1">
                    {{ item.name }}
                  </h3>
                  <p class="text-primary font-bold text-lg">
                    {{ formatCurrency(item.basePrice) }}/unité
                  </p>
                  <p class="text-xs text-text-main/60 mt-1">
                    Min: {{ item.minQuantity }} unités
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Preview (if selected) -->
          <Transition name="fade">
            <div v-if="selectedProduct" class="space-y-6">
              <!-- Product Image -->
              <div
                v-if="productImageUrl"
                class="relative rounded-lg overflow-hidden bg-gray-50"
              >
                <img
                  :src="productImageUrl"
                  :alt="selectedProduct.name"
                  class="w-full h-48 object-cover"
                  @error="handleImageError"
                >
                <div
                  class="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
                >
                  Exemple de réalisation
                </div>
              </div>

              <!-- Quantity Input -->
              <div>
                <label
                  for="quantity"
                  class="block text-sm font-semibold text-text-main mb-2"
                >
                  2. Quantité souhaitée
                </label>
                <div class="flex items-center space-x-4">
                  <input
                    id="quantity"
                    v-model.number="quantity"
                    type="number"
                    :min="selectedProduct.minQuantity"
                    class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors text-lg font-semibold"
                    @input="validateQuantity"
                  >
                  <span class="text-sm text-text-main/60">
                    Min: {{ selectedProduct.minQuantity }} unités
                  </span>
                </div>
                <p v-if="quantityError" class="mt-2 text-sm text-red-600">
                  {{ quantityError }}
                </p>
              </div>

              <!-- Price Calculation -->
              <div
                class="bg-primary/10 rounded-xl p-6 border-2 border-primary/20"
              >
                <h3 class="text-lg font-semibold text-accent mb-4">
                  Estimation de votre devis
                </h3>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span>Prix unitaire :</span>
                    <span class="font-semibold">{{
                      formatCurrency(selectedProduct.basePrice)
                    }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span>Quantité :</span>
                    <span class="font-semibold">{{ quantity }} unités</span>
                  </div>
                  <div class="border-t pt-2 mt-2">
                    <div
                      class="flex justify-between text-xl font-bold text-accent"
                    >
                      <span>Total HT :</span>
                      <span>{{ formatCurrency(totalPrice) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Buttons -->
              <div class="grid grid-cols-2 gap-4">
                <button
                  class="px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                  @click="requestQuote"
                >
                  Demander ce devis
                </button>
                <button
                  class="px-6 py-3 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent/5 transition-colors"
                  @click="contactUs"
                >
                  Nous contacter
                </button>
              </div>
            </div>
          </Transition>

          <!-- Legal Notice -->
          <div class="mt-8 pt-6 border-t border-gray-200">
            <p class="text-xs text-text-main/50 italic text-center">
              * Selon les spécifications finales de vos articles à
              personnaliser, le coût final peut subir des variations ou
              modifications avant la phase de production.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
// Auto-imported via Nuxt 3: useQuoteItems
import type { QuoteItemCatalog } from "@ns2po/types";

// Page metadata
useHead({
  title: "Devis Express - NS2PO Élections",
  meta: [
    {
      name: "description",
      content:
        "Obtenez votre devis personnalisé en 30 secondes pour vos gadgets de campagne électorale",
    },
  ],
});

// Data from Airtable
const { quoteItems, loading, error, loadQuoteItems } = useQuoteItems();

// Local state
const selectedProductId = ref("");
const quantity = ref(1);
const quantityError = ref("");
const productImageUrl = ref("");

// Image mapping for products (simplified for MVP)
const productImageMap: Record<string, string> = {
  casquette:
    "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/casquette-001.jpg",
  "t-shirt":
    "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/tshirt-001.jpg",
  stylo:
    "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/stylo-001.jpg",
  parapluie:
    "https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/parapluie-001.jpg",
};

// Computed properties
const selectedProduct = computed(() => {
  if (!selectedProductId.value) return null;
  return quoteItems.value.find((item) => item.id === selectedProductId.value);
});

const totalPrice = computed(() => {
  if (!selectedProduct.value) return 0;
  return selectedProduct.value.basePrice * quantity.value;
});

// Load products on mount
onMounted(async () => {
  await loadQuoteItems();
});

// Get product image based on name matching
const getProductImage = (productName: string): string => {
  const name = productName.toLowerCase();

  // Simple keyword matching
  for (const [keyword, url] of Object.entries(productImageMap)) {
    if (name.includes(keyword)) {
      return url;
    }
  }

  return "";
};

// Select product and update state
const selectProduct = (productId: string) => {
  selectedProductId.value = productId;
  onProductChange();
};

// Watch for product changes
const onProductChange = () => {
  if (selectedProduct.value) {
    // Reset quantity to minimum
    quantity.value = selectedProduct.value.minQuantity;
    quantityError.value = "";

    // Update product image for the preview section
    const productName = selectedProduct.value.name.toLowerCase();
    for (const [keyword, url] of Object.entries(productImageMap)) {
      if (productName.includes(keyword)) {
        productImageUrl.value = url;
        return;
      }
    }

    // No match found
    productImageUrl.value = "";
  }
};

// Validate quantity
const validateQuantity = () => {
  if (!selectedProduct.value) return;

  if (quantity.value < selectedProduct.value.minQuantity) {
    quantityError.value = `La quantité minimum est de ${selectedProduct.value.minQuantity} unités`;
  } else {
    quantityError.value = "";
  }
};

// Handle image load error
const handleImageError = () => {
  productImageUrl.value = "";
};

// Handle image load error for product cards
const handleCardImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  if (target && target.parentElement) {
    target.style.display = "none";
  }
};

// Format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Actions
const requestQuote = () => {
  // Store quote data in session
  const quoteData = {
    product: selectedProduct.value,
    quantity: quantity.value,
    totalPrice: totalPrice.value,
    timestamp: new Date().toISOString(),
  };

  sessionStorage.setItem("quoteRequest", JSON.stringify(quoteData));

  // Navigate to contact form with quote context
  navigateTo("/contact?type=quote");
};

const contactUs = () => {
  navigateTo("/contact");
};
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
