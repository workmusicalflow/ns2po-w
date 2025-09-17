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
// Importation des fonctions utilitaires statiques pour fallback
import {
  campaignBundles as staticCampaignBundles,
  getBundleById as getStaticBundleById,
} from "~/../../packages/types/src/campaign-bundles-data";

export const useCampaignBundles = () => {
  // =====================================
  // STATE MANAGEMENT
  // =====================================

  const loading = ref(false);
  const error = ref("");
  const lastFetch = ref<Date | null>(null);

  // =============================================
  // STUB FUNCTIONS FOR DEVIS.VUE COMPATIBILITY
  // =============================================

  function updateBundleProductQuantity(productId: string, quantity: number) {
    console.warn("updateBundleProductQuantity: stub implementation");
  }

  function removeBundleProduct(productId: string) {
    console.warn("removeBundleProduct: stub implementation");
  }

  function updateCustomProductQuantity(productId: string, quantity: number) {
    console.warn("updateCustomProductQuantity: stub implementation");
  }

  function syncBundleToQuoteItems() {
    console.warn("syncBundleToQuoteItems: stub implementation");
  }

  const useStaticFallback = ref(false);

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

  // API data cache
  const apiCampaignBundles = ref<CampaignBundle[]>([]);

  // =====================================
  // COMPUTED PROPERTIES
  // =====================================

  // Source de données - API ou statique selon la disponibilité
  const currentBundles = computed(() => {
    return useStaticFallback.value ? staticCampaignBundles : apiCampaignBundles.value;
  });

  // Filtered bundles based on current filters
  const filteredBundles = computed(() => {
    let result = [...currentBundles.value];

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
      currentBundles.value
        .filter((bundle) => bundle.isActive)
        .map((bundle) => bundle.targetAudience)
    );
    return Array.from(audiences);
  });

  // Available budgets from current bundles
  const availableBudgets = computed(() => {
    const budgets = new Set(
      currentBundles.value
        .filter((bundle) => bundle.isActive)
        .map((bundle) => bundle.budgetRange)
    );
    return Array.from(budgets);
  });

  // Featured bundles
  const featuredBundles = computed(() =>
    currentBundles.value.filter(bundle => bundle.isFeatured && bundle.isActive)
  );

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
   * Load bundles data from API with fallback to static data
   */
  const loadBundles = async (forceRefresh: boolean = false) => {
    try {
      loading.value = true;
      error.value = "";

      // Vérifier si on a besoin de rafraîchir les données
      const now = new Date();
      const shouldRefresh = forceRefresh ||
        !lastFetch.value ||
        (now.getTime() - lastFetch.value.getTime()) > 15 * 60 * 1000; // 15 minutes

      if (!shouldRefresh && apiCampaignBundles.value.length > 0) {
        console.log("📦 Utilisation du cache local");
        return;
      }

      console.log("🌐 Chargement des bundles depuis l'API...");

      // Tentative de récupération depuis l'API
      try {
        const response = await $fetch<{
          success: boolean;
          data?: CampaignBundle[];
          error?: string;
        }>("/api/campaign-bundles", {
          query: {
            featured: false, // Récupérer tous les bundles
          },
        });

        if (response.success && response.data) {
          apiCampaignBundles.value = response.data;
          useStaticFallback.value = false;
          lastFetch.value = now;
          console.log(`✅ ${response.data.length} bundles chargés depuis l'API`);

          // Vérifier si les bundles ont des produits
          const bundlesWithProducts = response.data.filter(bundle => bundle.products && bundle.products.length > 0);
          if (bundlesWithProducts.length === 0) {
            console.warn("⚠️ Bundles API sans produits, basculement vers données statiques");
            throw new Error("Bundles sans produits - utilisation des données statiques");
          }
        } else {
          throw new Error(response.error || "Réponse API invalide");
        }
      } catch (apiError) {
        console.warn("⚠️ Erreur API, utilisation des données statiques:", apiError);

        // Fallback vers les données statiques
        apiCampaignBundles.value = staticCampaignBundles;
        useStaticFallback.value = true;
        error.value = null; // Nettoyer l'erreur car le fallback a réussi

        console.log(`📦 ${staticCampaignBundles.length} bundles chargés en mode statique`);
      }
    } catch (err) {
      console.error("❌ Erreur critique lors du chargement:", err);

      // Fallback d'urgence
      apiCampaignBundles.value = staticCampaignBundles;
      useStaticFallback.value = true;
      error.value = null; // Nettoyer l'erreur car le fallback d'urgence a réussi
    } finally {
      loading.value = false;
    }
  };

  /**
   * Récupère un bundle par ID depuis l'API ou le cache local
   */
  const fetchBundleById = async (bundleId: string): Promise<CampaignBundle | null> => {
    try {
      // D'abord vérifier dans le cache local
      const cachedBundle = currentBundles.value.find(bundle => bundle.id === bundleId);
      if (cachedBundle) {
        console.log(`📦 Bundle trouvé dans le cache: ${cachedBundle.name}`);
        return cachedBundle;
      }

      // Si pas en cache et qu'on utilise l'API, essayer de récupérer depuis l'API
      if (!useStaticFallback.value) {
        console.log(`🌐 Récupération du bundle depuis l'API: ${bundleId}`);

        const response = await $fetch<{
          success: boolean;
          data?: CampaignBundle;
          error?: string;
        }>(`/api/campaign-bundles/${bundleId}`);

        if (response.success && response.data) {
          console.log(`✅ Bundle récupéré depuis l'API: ${response.data.name}`);
          return response.data;
        }
      }

      // Fallback vers les données statiques
      const staticBundle = getStaticBundleById(bundleId);
      if (staticBundle) {
        console.log(`📦 Bundle trouvé en mode statique: ${staticBundle.name}`);
        return staticBundle;
      }

      return null;
    } catch (error) {
      console.error(`❌ Erreur récupération bundle ${bundleId}:`, error);

      // Fallback vers les données statiques en cas d'erreur
      const staticBundle = getStaticBundleById(bundleId);
      if (staticBundle) {
        console.log(`📦 Fallback statique pour bundle: ${staticBundle.name}`);
        return staticBundle;
      }

      return null;
    }
  };

  /**
   * Select a bundle
   */
  const selectBundle = async (bundleId: string) => {
    try {
      loading.value = true;

      const bundle = await fetchBundleById(bundleId);
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
      } else {
        error.value = `Bundle non trouvé: ${bundleId}`;
        console.error("❌ Bundle non trouvé:", bundleId);
      }
    } catch (err) {
      error.value = "Erreur lors de la sélection du bundle";
      console.error("❌ Erreur sélection bundle:", err);
    } finally {
      loading.value = false;
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
   * Set filters
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
   * Get bundles by audience from current data source
   */
  const getBundlesByAudience = (audience: BundleTargetAudience) => {
    return currentBundles.value.filter(
      (bundle) => bundle.targetAudience === audience && bundle.isActive
    );
  };

  /**
   * Get bundles by budget from current data source
   */
  const getBundlesByBudget = (budget: BundleBudgetRange) => {
    return currentBundles.value.filter(
      (bundle) => bundle.budgetRange === budget && bundle.isActive
    );
  };

  /**
   * Get bundle by ID from current data source
   */
  const getBundleById = (bundleId: string): CampaignBundle | null => {
    return currentBundles.value.find((bundle) => bundle.id === bundleId) || null;
  };

  /**
   * Refresh data from API
   */
  const refreshBundles = async () => {
    await loadBundles(true);
  };

  /**
   * Get recommendation based on target audience and budget
   */
  const getRecommendation = (
    audience: BundleTargetAudience,
    maxBudget?: number
  ): CampaignBundle | null => {
    let candidates = getBundlesByAudience(audience);

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
  watch(selectedBundleId, async (newId) => {
    if (newId && !selectedBundle.value) {
      const bundle = await fetchBundleById(newId);
      if (bundle) {
        selectedBundle.value = bundle;
      }
    }
  });

  // Watch for API data changes to trigger re-computation
  watch(
    () => [apiCampaignBundles.value.length, useStaticFallback.value],
    () => {
      console.log(`📊 Données mises à jour: ${currentBundles.value.length} bundles disponibles`);
    }
  );

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
    lastFetch: readonly(lastFetch),
    useStaticFallback: readonly(useStaticFallback),
    selectedBundleId: readonly(selectedBundleId),
    selectedBundle: readonly(selectedBundle),
    isCustomSelection: readonly(isCustomSelection),
    multiSelectionState: readonly(multiSelectionState),
    currentCart: readonly(currentCart),
    bundleCustomization: readonly(bundleCustomization),

    // Computed
    currentBundles,
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
    refreshBundles,
    fetchBundleById,
    selectBundle,
    selectCustom,
    addToCustomSelection,
    removeFromCustomSelection,
    updateBundleProductQuantity,
    removeBundleProduct,
    updateCustomProductQuantity,
    syncBundleToQuoteItems,
    customizeBundle,
    setFilters,
    clearFilters,
    reset,
    getRecommendation,

    // Data access methods
    getBundleById,
    getBundlesByAudience,
    getBundlesByBudget,

    // Legacy static access (for backward compatibility)
    allBundles: computed(() => currentBundles.value),
  };
};
