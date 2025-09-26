import { ref, computed, onMounted } from 'vue';
import type { CampaignBundle } from '@ns2po/types';

export const useCampaignBundles = () => {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const bundles = ref<CampaignBundle[]>([]);
  const selectedBundle = ref<CampaignBundle | null>(null);
  const selectedBundleId = ref<string | null>(null);
  const multiSelectionState = ref({
    isActive: false,
    bundles: [] as string[],
    customProducts: [] as any[]
  });

  const currentCart = ref<any[]>([]);
  const currentBundles = ref<CampaignBundle[]>([]);
  const filters = ref({
    category: '',
    priceRange: null as any,
    tags: [] as string[]
  });

  // Computed pour les bundles filtrés
  const filteredBundles = computed(() => {
    let result = bundles.value;

    // Filtrer par catégorie
    if (filters.value.category) {
      result = result.filter(b =>
        (b as any).category === filters.value.category
      );
    }

    return result;
  });

  // Computed pour le résumé de sélection
  const selectionSummary = computed(() => {
    const items = currentCart.value;
    const totalItems = items.length;

    // Calculer le prix total selon le contexte
    let totalPrice = 0;
    let type = 'none';

    if (selectedBundle.value) {
      // Si un bundle est sélectionné, utiliser son prix total
      totalPrice = selectedBundle.value.estimatedTotal || 0;
      type = 'bundle';
    } else if (multiSelectionState.value.customProducts.length > 0) {
      // Si sélection personnalisée, calculer le prix des produits individuels
      totalPrice = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
      type = 'custom';
    }

    return {
      totalItems,
      totalPrice,
      type,
      name: selectedBundle.value?.name || 'Sélection personnalisée',
      bundles: currentBundles.value,
      customProducts: multiSelectionState.value.customProducts,
      // Calcul des économies si bundle sélectionné
      savings: selectedBundle.value?.savings || 0
    };
  });

  // Méthodes
  const selectBundle = (bundleId: string) => {
    const bundle = bundles.value.find(b => b.id === bundleId);
    if (bundle) {
      selectedBundle.value = bundle;
      selectedBundleId.value = bundleId;
      currentBundles.value = [bundle];

      // Ajouter les produits du bundle au panier
      if (bundle.products) {
        currentCart.value = bundle.products.map(p => ({
          ...p,
          bundleId,
          quantity: p.quantity || 1
        }));
      }
    }
  };

  const selectCustom = () => {
    multiSelectionState.value.isActive = true;
    selectedBundle.value = null;
    selectedBundleId.value = null;
    currentBundles.value = [];
  };

  const addToCustomSelection = (product: any) => {
    multiSelectionState.value.customProducts.push(product);
    currentCart.value.push({
      ...product,
      quantity: 1,
      isCustom: true
    });
  };

  const removeFromCustomSelection = (productId: string) => {
    multiSelectionState.value.customProducts =
      multiSelectionState.value.customProducts.filter(p => p.id !== productId);
    currentCart.value = currentCart.value.filter(item => item.id !== productId);
  };

  const reset = () => {
    selectedBundle.value = null;
    selectedBundleId.value = null;
    multiSelectionState.value = {
      isActive: false,
      bundles: [],
      customProducts: []
    };
    currentCart.value = [];
    currentBundles.value = [];
  };

  const setFilters = (newFilters: any) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  // Charger les bundles depuis l'API Turso réelle
  const loadBundles = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Appel API réel vers Turso
      const response = await $fetch('/api/campaign-bundles');

      // Vérifier si l'API retourne un format { success: true, data: Bundle[] }
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          bundles.value = response.data as CampaignBundle[];
        } else if (Array.isArray(response)) {
          bundles.value = response as CampaignBundle[];
        } else {
          throw new Error('Format de réponse API inattendu');
        }
      } else {
        throw new Error('Réponse API invalide');
      }

      console.log('🎯 Bundles chargés depuis Turso:', bundles.value.length, 'bundles');
    } catch (err) {
      error.value = err as Error;
      console.error('❌ Erreur chargement bundles depuis Turso:', err);
      // Fallback vers tableau vide au lieu de mocks
      bundles.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Charger au montage
  onMounted(() => {
    loadBundles();
  });

  return {
    // État
    loading,
    error,
    bundles,
    selectedBundle,
    selectedBundleId,
    multiSelectionState,
    selectionSummary,
    currentCart,
    currentBundles,
    filteredBundles,

    // Méthodes
    selectBundle,
    selectCustom,
    addToCustomSelection,
    removeFromCustomSelection,
    reset,
    setFilters,
    loadBundles
  };
};