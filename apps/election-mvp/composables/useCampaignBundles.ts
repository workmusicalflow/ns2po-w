/**
 * Composable pour la gestion des bundles de campagne NS2PO
 * Gère la sélection, filtrage, et état des packs pré-configurés
 */

import { ref, computed, watch, onMounted, readonly } from "vue";
import type {
  CampaignBundle,
  BundleTargetAudience,
  BundleBudgetRange,
  MultiSelectionState,
  ProductSelection,
  QuoteCart,
  CartItem,
  BundleCustomization,
} from "@ns2po/types";
import {
  campaignBundles,
  getBundlesByAudience,
  getBundlesByBudget,
  getFeaturedBundles,
  getBundleById,
} from "~/../../packages/types/src/campaign-bundles-data";

export const useCampaignBundles = () => {
  // =====================================
  // STATE MANAGEMENT
  // =====================================

  const loading = ref(false);
  const error = ref("");

  // Bundle selection
  const selectedBundleId = ref("");
  const selectedBundle = ref<CampaignBundle | null>(null);
  const isCustomSelection = ref(false);

  // Filters
  const audienceFilter = ref<BundleTargetAudience | "all">("all");
  const budgetFilter = ref<BundleBudgetRange | "all">("all");
  const searchQuery = ref("");

  // Multi-selection state (for custom bundle building)
  const multiSelectionState = ref<MultiSelectionState>({
    selections: new Map<string, ProductSelection>(),
    totalItems: 0,
    totalPrice: 0,
  });

  // Cart state
  const currentCart = ref<QuoteCart | null>(null);

  // Bundle customization state
  const bundleCustomization = ref<BundleCustomization | null>(null);

  // =====================================
  // COMPUTED PROPERTIES
  // =====================================

  // Filtered bundles based on current filters
  const filteredBundles = computed(() => {
    let result = [...campaignBundles];

    // Filter by audience
    if (audienceFilter.value !== "all") {
      result = result.filter(
        (bundle) => bundle.targetAudience === audienceFilter.value
      );
    }

    // Filter by budget
    if (budgetFilter.value !== "all") {
      result = result.filter(
        (bundle) => bundle.budgetRange === budgetFilter.value
      );
    }

    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(
        (bundle) =>
          bundle.name.toLowerCase().includes(query) ||
          bundle.description.toLowerCase().includes(query) ||
          bundle.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Only show active bundles
    result = result.filter((bundle) => bundle.isActive);

    // Sort by popularity (featured first, then by popularity score)
    return result.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.popularity - a.popularity;
    });
  });

  // Available audiences from current bundles
  const availableAudiences = computed(() => {
    const audiences = new Set(
      campaignBundles
        .filter((bundle) => bundle.isActive)
        .map((bundle) => bundle.targetAudience)
    );
    return Array.from(audiences);
  });

  // Available budgets from current bundles
  const availableBudgets = computed(() => {
    const budgets = new Set(
      campaignBundles
        .filter((bundle) => bundle.isActive)
        .map((bundle) => bundle.budgetRange)
    );
    return Array.from(budgets);
  });

  // Featured bundles
  const featuredBundles = computed(() => getFeaturedBundles());

  // Current selection summary
  const selectionSummary = computed(() => {
    if (selectedBundle.value) {
      return {
        type: "bundle" as const,
        name: selectedBundle.value.name,
        totalItems: selectedBundle.value.products.length,
        totalPrice: selectedBundle.value.estimatedTotal,
        savings: selectedBundle.value.savings || 0,
        products: selectedBundle.value.products,
      };
    }

    if (isCustomSelection.value) {
      const selections = Array.from(
        multiSelectionState.value.selections.values()
      );
      return {
        type: "custom" as const,
        name: "Sélection personnalisée",
        totalItems: multiSelectionState.value.totalItems,
        totalPrice: multiSelectionState.value.totalPrice,
        savings: 0,
        products: selections,
      };
    }

    return null;
  });

  // =====================================
  // METHODS
  // =====================================

  /**
   * Load bundles data (simulate API call)
   */
  const loadBundles = async () => {
    try {
      loading.value = true;
      error.value = "";

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Data is already imported statically, but we could
      // fetch from API here in the future
      console.log("📦 Bundles loaded successfully:", campaignBundles.length);
    } catch (err) {
      error.value = "Erreur lors du chargement des packs de campagne";
      console.error("Bundle loading error:", err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Select a bundle
   */
  const selectBundle = (bundleId: string) => {
    const bundle = getBundleById(bundleId);
    if (bundle) {
      selectedBundleId.value = bundleId;
      selectedBundle.value = bundle;
      isCustomSelection.value = false;
      bundleCustomization.value = null;

      // Clear multi-selection state
      multiSelectionState.value = {
        selections: new Map(),
        totalItems: 0,
        totalPrice: 0,
      };

      // Create cart from bundle
      createCartFromBundle(bundle);

      console.log("🎯 Bundle selected:", bundle.name);
    }
  };

  /**
   * Switch to custom selection mode
   */
  const selectCustom = () => {
    selectedBundleId.value = "";
    selectedBundle.value = null;
    isCustomSelection.value = true;
    bundleCustomization.value = null;

    console.log("🛠️ Switched to custom selection mode");
  };

  /**
   * Add product to custom selection
   */
  const addToCustomSelection = (
    productId: string,
    name: string,
    basePrice: number,
    quantity: number = 1
  ) => {
    if (!isCustomSelection.value) return;

    const selection: ProductSelection = {
      productId,
      quantity,
      addedAt: new Date().toISOString(),
    };

    const newSelections = new Map(multiSelectionState.value.selections);
    newSelections.set(productId, selection);

    // Recalculate totals
    let totalItems = 0;
    let totalPrice = 0;

    newSelections.forEach((sel) => {
      totalItems += sel.quantity;
      totalPrice += basePrice * sel.quantity; // This should come from product lookup
    });

    multiSelectionState.value = {
      selections: newSelections,
      totalItems,
      totalPrice,
    };

    console.log("➕ Added to custom selection:", name, "x", quantity);
  };

  /**
   * Remove product from custom selection
   */
  const removeFromCustomSelection = (productId: string) => {
    if (!isCustomSelection.value) return;

    const newSelections = new Map(multiSelectionState.value.selections);
    newSelections.delete(productId);

    // Recalculate totals
    let totalItems = 0;
    let totalPrice = 0;

    newSelections.forEach((sel) => {
      totalItems += sel.quantity;
      // totalPrice += basePrice * sel.quantity; // Need product lookup
    });

    multiSelectionState.value = {
      selections: newSelections,
      totalItems,
      totalPrice,
    };

    console.log("➖ Removed from custom selection:", productId);
  };

  /**
   * Create cart from selected bundle
   */
  const createCartFromBundle = (bundle: CampaignBundle) => {
    const cartItems: CartItem[] = bundle.products.map((product) => ({
      productId: product.id,
      name: product.name,
      basePrice: product.basePrice,
      quantity: product.quantity,
      subtotal: product.subtotal,
      addedAt: new Date().toISOString(),
      fromBundle: bundle.id,
    }));

    currentCart.value = {
      items: cartItems,
      subtotal: bundle.estimatedTotal,
      total: bundle.estimatedTotal,
      currency: "XOF",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bundleId: bundle.id,
      isCustomized: false,
    };
  };

  /**
   * Customize bundle (add/remove/modify products)
   */
  const customizeBundle = (modifications: Partial<BundleCustomization>) => {
    if (!selectedBundle.value) return;

    bundleCustomization.value = {
      originalBundleId: selectedBundle.value.id,
      modifiedProducts: modifications.modifiedProducts || [],
      addedProducts: modifications.addedProducts || [],
      removedProductIds: modifications.removedProductIds || [],
      customizationTimestamp: new Date().toISOString(),
      totalAdjustment: modifications.totalAdjustment || 0,
    };

    // Recalculate cart with customizations
    if (currentCart.value) {
      currentCart.value = {
        ...currentCart.value,
        isCustomized: true,
        updatedAt: new Date().toISOString(),
      };
    }

    console.log("🔧 Bundle customized:", bundleCustomization.value);
  };

  /**
   * Apply filters
   */
  const setFilters = (
    audience: BundleTargetAudience | "all" = "all",
    budget: BundleBudgetRange | "all" = "all",
    search: string = ""
  ) => {
    audienceFilter.value = audience;
    budgetFilter.value = budget;
    searchQuery.value = search;
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    audienceFilter.value = "all";
    budgetFilter.value = "all";
    searchQuery.value = "";
  };

  /**
   * Reset all state
   */
  const reset = () => {
    selectedBundleId.value = "";
    selectedBundle.value = null;
    isCustomSelection.value = false;
    bundleCustomization.value = null;
    currentCart.value = null;
    multiSelectionState.value = {
      selections: new Map(),
      totalItems: 0,
      totalPrice: 0,
    };
    clearFilters();
  };

  /**
   * Get recommendation based on target audience and budget
   */
  const getRecommendation = (
    audience: BundleTargetAudience,
    maxBudget?: number
  ): CampaignBundle | null => {
    let candidates = getBundlesByAudience(audience).filter(
      (bundle) => bundle.isActive
    );

    if (maxBudget) {
      candidates = candidates.filter(
        (bundle) => bundle.estimatedTotal <= maxBudget
      );
    }

    // Return the most popular bundle in the criteria
    return candidates.sort((a, b) => b.popularity - a.popularity)[0] || null;
  };

  // =====================================
  // WATCHERS
  // =====================================

  // Watch for bundle selection changes
  watch(selectedBundleId, (newId) => {
    if (newId) {
      const bundle = getBundleById(newId);
      if (bundle) {
        selectedBundle.value = bundle;
      }
    }
  });

  // =====================================
  // INITIALIZATION
  // =====================================

  // Auto-load on composable creation
  onMounted(() => {
    loadBundles();
  });

  // =====================================
  // RETURN API
  // =====================================

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    selectedBundleId: readonly(selectedBundleId),
    selectedBundle: readonly(selectedBundle),
    isCustomSelection: readonly(isCustomSelection),
    multiSelectionState: readonly(multiSelectionState),
    currentCart: readonly(currentCart),
    bundleCustomization: readonly(bundleCustomization),

    // Computed
    filteredBundles,
    availableAudiences,
    availableBudgets,
    featuredBundles,
    selectionSummary,

    // Filters
    audienceFilter: readonly(audienceFilter),
    budgetFilter: readonly(budgetFilter),
    searchQuery: readonly(searchQuery),

    // Methods
    loadBundles,
    selectBundle,
    selectCustom,
    addToCustomSelection,
    removeFromCustomSelection,
    customizeBundle,
    setFilters,
    clearFilters,
    reset,
    getRecommendation,

    // Static data access
    allBundles: campaignBundles,
    getBundleById,
    getBundlesByAudience,
    getBundlesByBudget,
  };
};
