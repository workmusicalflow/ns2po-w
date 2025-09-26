<!--
  QuickCartCustomizer.vue
  Interface rapide pour personnaliser le panier/bundle sélectionné
  Permet d'ajuster quantités, ajouter/supprimer produits avec mise à jour temps réel
-->

<template>
  <div
    class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
  >
    <!-- En-tête du customizer -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-heading font-semibold text-accent">
          {{
            selectionSummary?.type === "bundle"
              ? "Personnaliser le pack"
              : "Votre sélection"
          }}
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ selectionSummary?.name || "Aucune sélection" }}
        </p>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold text-primary">
          {{ formatPrice(selectionSummary?.totalPrice || 0) }}
        </div>
        <div
          v-if="selectionSummary?.savings && selectionSummary.savings > 0"
          class="text-sm text-green-600 font-medium"
        >
          Économie: {{ formatPrice(selectionSummary.savings) }}
        </div>
      </div>
    </div>

    <!-- Message si aucune sélection -->
    <div
      v-if="!selectionSummary || selectionSummary.totalItems === 0"
      class="text-center py-8 text-gray-500"
    >
      <div
        class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
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
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      </div>
      <p class="font-medium">Aucun produit sélectionné</p>
      <p class="text-sm mt-1">
        Choisissez un pack ou créez votre sélection personnalisée
      </p>
    </div>

    <!-- Liste des produits -->
    <div v-else class="space-y-4">
      <div
        class="flex items-center justify-between text-sm text-gray-600 pb-2 border-b"
      >
        <span>{{ selectionSummary.totalItems }} article(s)</span>
        <button
          v-if="selectionSummary.type === 'bundle'"
          @click="resetToOriginal"
          class="text-accent hover:text-accent/80 font-medium transition-colors"
        >
          Réinitialiser le pack
        </button>
      </div>

      <!-- Produits de bundle -->
      <div
        v-if="selectionSummary.type === 'bundle' && selectedBundle"
        class="space-y-3"
      >
        <QuickCartItem
          v-for="product in selectedBundle.products"
          :key="product.id"
          :product="product"
          :bundle-mode="true"
          @quantity-change="updateBundleProductQuantity(product.id, $event)"
          @remove="removeBundleProduct(product.id)"
        />
      </div>

      <!-- Produits de sélection personnalisée -->
      <div v-else-if="selectionSummary.type === 'custom'" class="space-y-3">
        <QuickCartItem
          v-for="selection in Array.from(
            multiSelectionState.selections.values(),
          )"
          :key="selection.productId"
          :selection="selection"
          :bundle-mode="false"
          @quantity-change="
            updateCustomProductQuantity(selection.productId, $event)
          "
          @remove="removeFromCustomSelection(selection.productId)"
        />
      </div>
    </div>

    <!-- Actions rapides -->
    <div
      v-if="selectionSummary && selectionSummary.totalItems > 0"
      class="pt-4 border-t space-y-3"
    >
      <!-- Suggestions d'ajout (si bundle) -->
      <div v-if="selectionSummary.type === 'bundle'" class="space-y-3">
        <h4 class="text-sm font-medium text-gray-700">Suggestions d'ajout</h4>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="suggestion in productSuggestions"
            :key="suggestion.id"
            @click="addSuggestedProduct(suggestion)"
            class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div class="font-medium text-sm">{{ suggestion.name }}</div>
            <div class="text-primary font-semibold text-sm mt-1">
              {{ formatPrice(suggestion.basePrice) }}
            </div>
          </button>
        </div>
      </div>

      <!-- Contrôles d'action -->
      <div class="flex items-center gap-3">
        <button
          @click="clearSelection"
          class="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Vider la sélection
        </button>
        <button
          @click="proceedToQuote"
          class="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
        >
          Demander un devis
        </button>
      </div>
    </div>

    <!-- Résumé des économies -->
    <div
      v-if="selectionSummary?.type === 'bundle' && selectionSummary.savings"
      class="bg-green-50 rounded-lg p-4"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center"
        >
          <svg
            class="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        </div>
        <div>
          <div class="font-medium text-green-800">
            Vous économisez {{ formatPrice(selectionSummary.savings) }}
          </div>
          <div class="text-sm text-green-600">
            par rapport à l'achat individuel des produits
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import type { Ref, ComputedRef } from "vue";
import type {
  CampaignBundle,
  BundleProduct,
  MultiSelectionState,
  ProductSelection,
} from "@ns2po/types";
import QuickCartItem from "./QuickCartItem.vue";

// =====================================
// PROPS & EMITS
// =====================================

interface Props {
  // Props passées par le composant parent pour l'intégration
  showSuggestions?: boolean;
  maxSuggestions?: number;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showSuggestions: true,
  maxSuggestions: 4,
  compact: false,
});

const emit = defineEmits<{
  "quote-requested": [];
  "selection-cleared": [];
  "product-added": [productId: string];
  "product-removed": [productId: string];
  "quantity-changed": [productId: string, quantity: number];
}>();

// =====================================
// COMPOSABLE INJECTION (depuis le parent)
// =====================================

// On injecte le composable depuis le composant parent qui l'utilise
const selectedBundle = inject<Ref<CampaignBundle | null>>("selectedBundle");
const multiSelectionState = inject<Ref<MultiSelectionState>>(
  "multiSelectionState",
);
const selectionSummary = inject<ComputedRef<any>>("selectionSummary");

// Méthodes injectées du composable parent
const updateBundleProductQuantity = inject<(id: string, qty: number) => void>(
  "updateBundleProductQuantity",
);
const removeBundleProduct = inject<(id: string) => void>("removeBundleProduct");
const updateCustomProductQuantity = inject<(id: string, qty: number) => void>(
  "updateCustomProductQuantity",
);
const removeFromCustomSelection = inject<(id: string) => void>(
  "removeFromCustomSelection",
);
const reset = inject<() => void>("reset");

// =====================================
// COMPUTED PROPERTIES
// =====================================

// Suggestions de produits complémentaires (simulé)
const productSuggestions = computed(() => {
  if (!props.showSuggestions || !selectedBundle?.value) return [];

  // Simulations de suggestions basées sur le pack sélectionné
  const suggestions = [
    {
      id: "suggestion-001",
      name: "Stylos publicitaires",
      basePrice: 300,
      category: "accessoires",
    },
    {
      id: "suggestion-002",
      name: "Porte-clés personnalisés",
      basePrice: 500,
      category: "accessoires",
    },
    {
      id: "suggestion-003",
      name: "Calendriers de poche",
      basePrice: 800,
      category: "papeterie",
    },
    {
      id: "suggestion-004",
      name: "Parapluies promotionnels",
      basePrice: 4500,
      category: "textile",
    },
  ];

  return suggestions.slice(0, props.maxSuggestions);
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
 * Réinitialise la sélection au pack original
 */
const resetToOriginal = () => {
  // Cette méthode sera implémentée par le composable parent
  console.log("🔄 Réinitialisation au pack original");
  // TODO: Implémenter la réinitialisation du bundle
};

/**
 * Ajoute un produit suggéré
 */
const addSuggestedProduct = (suggestion: any) => {
  emit("product-added", suggestion.id);
  console.log("➕ Produit suggéré ajouté:", suggestion.name);
};

/**
 * Vide la sélection complète
 */
const clearSelection = () => {
  reset?.();
  emit("selection-cleared");
  console.log("🗑️ Sélection vidée");
};

/**
 * Procède à la demande de devis
 */
const proceedToQuote = () => {
  emit("quote-requested");
  console.log("📋 Demande de devis initiée");
};
</script>

<style scoped>
/* Styles personnalisés pour le customizer */
.quick-cart-customizer {
  /* Variables CSS pour la cohérence */
  --border-radius: 8px;
  --primary-color: theme("colors.primary");
  --accent-color: theme("colors.accent");
  --success-color: theme("colors.green.600");
}

/* Animation pour les changements de prix */
.price-update {
  animation: priceFlash 0.3s ease-in-out;
}

@keyframes priceFlash {
  0% {
    color: theme("colors.primary");
  }
  50% {
    color: theme("colors.green.600");
  }
  100% {
    color: theme("colors.primary");
  }
}

/* Style pour les suggestions de produits */
.suggestion-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
