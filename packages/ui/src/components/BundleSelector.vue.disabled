<template>
  <div class="space-y-8">
    <!-- Header Section -->
    <div class="text-center">
      <h2 class="text-2xl font-heading font-bold text-accent mb-3">
        Choisissez votre arsenal de campagne
      </h2>
      <p class="text-text-main/70 max-w-2xl mx-auto">
        Sélectionnez un pack pré-configuré adapté à votre campagne ou
        personnalisez votre sélection
      </p>
    </div>

    <!-- Filter Bar -->
    <div class="flex flex-wrap gap-4 justify-center">
      <button
        v-for="audience in audienceFilters"
        :key="audience.value"
        :class="[
          'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200',
          selectedAudience === audience.value
            ? 'bg-primary text-white shadow-md'
            : 'bg-white border-2 border-gray-200 text-text-main hover:border-primary/50',
        ]"
        @click="filterByAudience(audience.value)"
      >
        {{ audience.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
      />
      <p class="mt-4 text-text-main/60">
        Chargement des packs...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 text-center"
    >
      <p class="font-semibold">
        Erreur de chargement
      </p>
      <p class="text-sm mt-1">
        {{ error }}
      </p>
    </div>

    <!-- Bundles Grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="bundle in filteredBundles"
        :key="bundle.id"
        class="relative group flex"
      >
        <!-- Bundle Card -->
        <div
          :class="[
            'bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 flex flex-col w-full',
            selectedBundleId === bundle.id
              ? 'ring-2 ring-primary ring-offset-2'
              : '',
          ]"
          @click="selectBundle(bundle.id)"
        >
          <!-- Featured Badge -->
          <div
            v-if="bundle.isFeatured"
            class="absolute top-4 right-4 bg-accent text-white text-xs font-bold px-2 py-1 rounded-full z-10"
          >
            ⭐ Populaire
          </div>

          <!-- Bundle Header -->
          <div class="bg-gradient-to-r from-primary/10 to-accent/10 p-6 pb-4">
            <div class="flex items-center justify-between mb-3">
              <div
                :class="[
                  'text-xs font-bold px-2 py-1 rounded-full',
                  getAudienceColor(bundle.targetAudience),
                ]"
              >
                {{ getAudienceLabel(bundle.targetAudience) }}
              </div>
              <div
                :class="[
                  'text-xs font-semibold px-2 py-1 rounded',
                  getBudgetColor(bundle.budgetRange),
                ]"
              >
                {{ getBudgetLabel(bundle.budgetRange) }}
              </div>
            </div>

            <h3 class="text-xl font-heading font-bold text-accent mb-2">
              {{ bundle.name }}
            </h3>
            <p class="text-sm text-text-main/70 line-clamp-2">
              {{ bundle.description }}
            </p>
          </div>

          <!-- Products Preview -->
          <div class="p-6 pt-2 flex-1 flex flex-col">
            <div class="mb-4">
              <h4 class="text-sm font-semibold text-text-main mb-2">
                Produits inclus ({{ bundle.products.length }}) :
              </h4>
              <div class="space-y-1">
                <div
                  v-for="product in bundle.products.slice(0, 3)"
                  :key="product.id"
                  class="flex justify-between text-sm"
                >
                  <span class="text-text-main/80 truncate">
                    {{ product.name }}
                  </span>
                  <span class="text-text-main/60 whitespace-nowrap ml-2">
                    {{ product.quantity }}x
                  </span>
                </div>
                <div
                  v-if="bundle.products.length > 3"
                  class="text-xs text-primary font-medium"
                >
                  + {{ bundle.products.length - 3 }} autres produits
                </div>
              </div>
            </div>

            <!-- Pricing -->
            <div class="border-t pt-4 mt-auto">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-text-main/70">Total estimé :</span>
                <div class="text-right">
                  <div class="text-2xl font-bold text-accent">
                    {{ formatCurrency(bundle.estimatedTotal) }}
                  </div>
                  <div
                    v-if="bundle.savings"
                    class="text-xs text-green-600 font-semibold"
                  >
                    Économie de {{ formatCurrency(bundle.savings) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Selection Indicator -->
            <div
              v-if="selectedBundleId === bundle.id"
              class="absolute top-4 left-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-white"
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
        </div>
      </div>
    </div>

    <!-- Custom Selection Option -->
    <div class="mt-8">
      <div
        class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-dashed border-gray-300 text-center cursor-pointer hover:border-primary transition-colors"
        @click="selectCustom"
      >
        <div class="max-w-md mx-auto">
          <svg
            class="w-12 h-12 text-gray-400 mx-auto mb-4"
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
          <h3 class="text-lg font-semibold text-text-main mb-2">
            Sélection personnalisée
          </h3>
          <p class="text-sm text-text-main/70">
            Créez votre propre combinaison en choisissant vos produits
            individuellement
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type {
  CampaignBundle,
  BundleTargetAudience,
  BundleBudgetRange,
} from "@ns2po/types";

interface Props {
  bundles?: CampaignBundle[];
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  bundles: () => [],
  loading: false,
  error: "",
});

const emit = defineEmits<{
  bundleSelected: [bundleId: string];
  customSelection: [];
}>();

// Local state
const selectedBundleId = ref("");
const selectedAudience = ref<BundleTargetAudience | "all">("all");

// Audience filters
const audienceFilters = [
  { value: "all" as const, label: "Tous" },
  { value: "local" as const, label: "Local" },
  { value: "regional" as const, label: "Régional" },
  { value: "national" as const, label: "National" },
  { value: "universal" as const, label: "Universel" },
];

// Computed properties
const filteredBundles = computed(() => {
  if (selectedAudience.value === "all") {
    return props.bundles.filter((bundle) => bundle.isActive);
  }
  return props.bundles.filter(
    (bundle) =>
      bundle.isActive && bundle.targetAudience === selectedAudience.value,
  );
});

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getAudienceLabel = (audience: BundleTargetAudience): string => {
  const labels = {
    local: "Campagne Locale",
    regional: "Campagne Régionale",
    national: "Campagne Nationale",
    universal: "Tous Niveaux",
  };
  return labels[audience] || audience;
};

const getAudienceColor = (audience: BundleTargetAudience): string => {
  const colors = {
    local: "bg-blue-100 text-blue-800",
    regional: "bg-green-100 text-green-800",
    national: "bg-purple-100 text-purple-800",
    universal: "bg-orange-100 text-orange-800",
  };
  return colors[audience] || "bg-gray-100 text-gray-800";
};

const getBudgetLabel = (budget: BundleBudgetRange): string => {
  const labels = {
    starter: "Starter",
    medium: "Medium",
    premium: "Premium",
    enterprise: "Enterprise",
  };
  return labels[budget] || budget;
};

const getBudgetColor = (budget: BundleBudgetRange): string => {
  const colors = {
    starter: "bg-gray-100 text-gray-700",
    medium: "bg-primary/20 text-primary",
    premium: "bg-accent/20 text-accent",
    enterprise: "bg-purple-100 text-purple-700",
  };
  return colors[budget] || "bg-gray-100 text-gray-700";
};

// Event handlers
const filterByAudience = (audience: BundleTargetAudience | "all") => {
  selectedAudience.value = audience;
};

const selectBundle = (bundleId: string) => {
  selectedBundleId.value = bundleId;
  emit("bundleSelected", bundleId);
};

const selectCustom = () => {
  selectedBundleId.value = "";
  emit("customSelection");
};

// Watch for external bundle selection
watch(
  () => props.bundles,
  (newBundles) => {
    // If bundles are loaded and there's a featured one, could pre-select it
    if (newBundles.length > 0 && !selectedBundleId.value) {
      const featured = newBundles.find((b) => b.isFeatured && b.isActive);
      if (featured) {
        selectBundle(featured.id);
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
