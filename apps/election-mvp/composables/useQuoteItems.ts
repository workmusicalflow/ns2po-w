/**
 * Composable pour la gestion des articles de devis depuis Airtable
 */

import { ref, computed } from "vue";
import type { QuoteItemCatalog } from "@ns2po/types";

export const useQuoteItems = () => {
  // État réactif
  const quoteItems = ref<QuoteItemCatalog[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Chargement des articles de devis
  const loadQuoteItems = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{
        success: boolean;
        data: QuoteItemCatalog[];
      }>("/api/quote-items");
      quoteItems.value = response.data;
    } catch (err) {
      error.value =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des articles";
      console.error("Erreur chargement articles de devis:", err);
    } finally {
      loading.value = false;
    }
  };

  // Articles actifs uniquement
  const activeQuoteItems = computed(() =>
    quoteItems.value.filter((item) => item.status === "Active")
  );

  // Articles groupés par catégorie
  const quoteItemsByCategory = computed(() => {
    const grouped: Record<string, QuoteItemCatalog[]> = {};

    activeQuoteItems.value.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return grouped;
  });

  // Recherche d'un article par ID
  const findQuoteItem = (id: string): QuoteItemCatalog | undefined => {
    return quoteItems.value.find((item) => item.id === id);
  };

  // Recherche par nom
  const searchQuoteItems = (query: string): QuoteItemCatalog[] => {
    if (!query.trim()) return activeQuoteItems.value;

    const searchTerm = query.toLowerCase();
    return activeQuoteItems.value.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
    );
  };

  return {
    // État
    quoteItems: activeQuoteItems,
    loading,
    error,

    // Actions
    loadQuoteItems,
    findQuoteItem,
    searchQuoteItems,

    // Computed
    quoteItemsByCategory,
  };
};
