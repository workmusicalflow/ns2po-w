<template>
  <div class="quote-page">
    <!-- Main Content -->
    <div class="main-content">
      <div class="container mx-auto px-4 py-8">
        <!-- Step Content -->
        <div class="step-content">
          <!-- Étape 1: Sélection Bundle/Packs de campagne -->
          <div v-if="currentStep === 1" class="step-panel">
            <!-- Interface Bundle Selector -->
            <div class="bundle-selector-interface">
              <!-- Sélecteur de bundles -->
              <BundleSelector
                :bundles="filteredBundles"
                :loading="bundlesLoading"
                :error="bundlesError"
                :featured-first="true"
                :show-filters="true"
                :compact="false"
                @bundle-selected="(bundleId) => onBundleSelected(bundleId)"
                @custom-selection="onCustomSelection"
                @filter-changed="onFilterChanged"
              />

              <!-- Customizer de panier rapide (affiché si sélection active) -->
              <div
                v-if="
                  bundleSelectionSummary &&
                    bundleSelectionSummary.totalItems > 0
                "
                class="mt-8"
              >
                <QuickCartCustomizer
                  :show-suggestions="true"
                  :max-suggestions="4"
                  :compact="false"
                  @quote-requested="proceedToConfiguration"
                  @selection-cleared="onSelectionCleared"
                  @product-added="onProductAdded"
                  @product-removed="onProductRemoved"
                  @quantity-changed="onQuantityChanged"
                />
              </div>

              <!-- Message d'encouragement si aucune sélection -->
              <div v-else class="text-center py-12 bg-gray-50 rounded-lg mt-8">
                <div class="max-w-md mx-auto">
                  <div
                    class="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <svg
                      class="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <h3
                    class="text-lg font-heading font-semibold text-gray-900 mb-2"
                  >
                    Prêt à conquérir votre électorat ?
                  </h3>
                  <p class="text-gray-600">
                    Choisissez un pack adapté à votre campagne ou créez votre
                    sélection sur-mesure. Nos experts ont préparé des
                    combinaisons gagnantes pour chaque niveau d'élection.
                  </p>
                </div>
              </div>
            </div>

            <div class="step-actions justify-center">
              <Button
                variant="primary"
                size="large"
                :disabled="
                  !bundleSelectionSummary ||
                    bundleSelectionSummary.totalItems === 0
                "
                @click="nextStep"
              >
                Configurer la sélection ({{
                  bundleSelectionSummary?.totalItems || 0
                }})
              </Button>
            </div>
          </div>

          <!-- Étape 2: Configuration et calcul -->
          <div v-else-if="currentStep === 2" class="step-panel">
            <h2 class="step-title">
              Configuration et devis
            </h2>
            <p class="step-description">
              Configurez vos produits et obtenez votre devis détaillé
            </p>

            <QuoteCalculator
              ref="calculatorRef"
              :initial-items="quoteItems"
              :customer-type="customerInfo.customerType"
              :auto-calculate="true"
              @add-product="goToStep(1)"
              @quote-updated="onQuoteUpdated"
              @download-quote="downloadQuote"
              @send-quote="sendQuote"
              @save-quote="saveQuote"
            />

            <div class="step-actions">
              <Button variant="outline" @click="previousStep">
                Retour aux produits
              </Button>
              <Button
                variant="primary"
                :disabled="!currentCalculation"
                @click="nextStep"
              >
                Finaliser le devis
              </Button>
            </div>
          </div>

          <!-- Étape 3: Finalisation -->
          <div v-else-if="currentStep === 3" class="step-panel">
            <h2 class="step-title">
              Finalisation du devis
            </h2>
            <p class="step-description">
              Votre devis est prêt ! Choisissez comment procéder.
            </p>

            <div v-if="currentCalculation" class="quote-summary-final">
              <!-- Résumé client -->
              <div class="summary-section">
                <h3 class="summary-title">
                  Informations client
                </h3>
                <div class="customer-summary">
                  <p><strong>Nom:</strong> {{ customerInfo.firstName }}</p>
                  <p><strong>Email:</strong> {{ customerInfo.email }}</p>
                  <p>
                    <strong>Type:</strong>
                    {{ getCustomerTypeLabel(customerInfo.customerType) }}
                  </p>
                  <p v-if="customerInfo.company">
                    <strong>Organisation:</strong> {{ customerInfo.company }}
                  </p>
                </div>
              </div>

              <!-- Résumé produits -->
              <div class="summary-section">
                <h3 class="summary-title">
                  Produits commandés
                </h3>
                <div class="products-summary">
                  <div
                    v-for="item in quoteItems"
                    :key="item.id"
                    class="product-summary-item"
                  >
                    <span class="product-summary-name">{{
                      item.product?.name
                    }}</span>
                    <span class="product-summary-qty">{{ item.quantity }} unités</span>
                    <span class="product-summary-price">{{
                      formatCurrency(getItemTotal(item))
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Total final -->
              <div class="summary-section">
                <div class="final-total">
                  <div class="total-breakdown">
                    <div class="total-line">
                      <span>Sous-total:</span>
                      <span>{{
                        formatCurrency(currentCalculation.subtotal)
                      }}</span>
                    </div>
                    <div
                      v-if="currentCalculation.discountAmount > 0"
                      class="total-line discount"
                    >
                      <span>Remises:</span>
                      <span>-{{
                        formatCurrency(currentCalculation.discountAmount)
                      }}</span>
                    </div>
                    <div class="total-line">
                      <span>TVA:</span>
                      <span>{{
                        formatCurrency(currentCalculation.taxAmount)
                      }}</span>
                    </div>
                    <div class="total-line final">
                      <span>Total TTC:</span>
                      <span class="final-amount">{{
                        formatCurrency(currentCalculation.totalAmount)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions finales -->
              <div class="final-actions">
                <div class="action-grid">
                  <Button
                    variant="primary"
                    class="action-btn"
                    @click="downloadPDF"
                  >
                    📄 Télécharger le devis PDF
                  </Button>

                  <Button
                    variant="secondary"
                    class="action-btn"
                    @click="sendByEmail"
                  >
                    ✉️ Envoyer par email
                  </Button>

                  <Button
                    variant="outline"
                    class="action-btn"
                    @click="startPreorder"
                  >
                    🛒 Passer la pré-commande
                  </Button>

                  <Button
                    variant="outline"
                    class="action-btn"
                    @click="requestMeeting"
                  >
                    📞 Demander un rendez-vous
                  </Button>
                </div>
              </div>

              <!-- Informations légales -->
              <div class="legal-info">
                <h4>Conditions du devis</h4>
                <ul>
                  <li>Devis valable 30 jours à compter de ce jour</li>
                  <li>Prix indicatifs susceptibles de variations</li>
                  <li>Livraison estimée: 7-15 jours selon quantité</li>
                  <li>Acompte de 50% à la commande</li>
                </ul>
              </div>
            </div>

            <div class="step-actions">
              <Button variant="outline" @click="previousStep">
                Modifier le devis
              </Button>
              <Button variant="secondary" @click="startNewQuote">
                Nouveau devis
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, provide } from "vue";
import {
  Button,
  BundleSelector,
  QuickCartCustomizer,
  PersistentSummary,
} from "@ns2po/ui";
import type {
  CustomerInfo,
  QuoteItem,
  QuoteCalculation,
  Category,
  CampaignBundle,
} from "@ns2po/types";
import { useQuoteItems } from "~/composables/useQuoteItems";
import { useCampaignBundles } from "~/composables/useCampaignBundles";

// Import du composant QuoteCalculator (sera créé si nécessaire)
// import QuoteCalculator from '~/components/QuoteCalculator.vue'

useHead({
  title: "Devis - NS2PO Élections",
  meta: [
    {
      name: "description",
      content:
        "Générez votre devis personnalisé pour vos gadgets de campagne électorale",
    },
  ],
});

// Variables d'état pour les étapes
const currentStep = ref(1); // Commencer directement avec Bundle Selector

const steps = [
  { id: "products", label: "Arsenal de Campagne" },
  { id: "calculate", label: "Configuration" },
  { id: "finalize", label: "Finalisation" },
];

// État réactif
const customerInfo = ref<Partial<CustomerInfo>>({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  customerType: undefined,
  address: {
    street: "",
    city: "",
    region: "",
    country: "CI",
  },
});

// Utilisation du composable useQuoteItems pour récupérer les articles depuis Airtable
const {
  quoteItems: availableQuoteItems,
  loading: loadingQuoteItems,
  error: quoteItemsError,
  loadQuoteItems,
  searchQuoteItems,
  quoteItemsByCategory,
} = useQuoteItems();

// Bundle Selector System - Intégration du nouveau système de packs de campagne
const {
  loading: bundlesLoading,
  error: bundlesError,
  selectedBundle,
  selectedBundleId,
  multiSelectionState,
  selectionSummary: bundleSelectionSummary,
  currentCart,
  currentBundles,
  filteredBundles,
  selectBundle,
  selectCustom,
  // updateBundleProductQuantity,
  // removeBundleProduct,
  // updateCustomProductQuantity,
  removeFromCustomSelection,
  addToCustomSelection,
  reset: resetBundleSelection,
  setFilters,
} = useCampaignBundles();

// Fonctions locales pour remplacer les fonctions manquantes du composable
const updateBundleProductQuantity = (productId: string, quantity: number) => {
  console.log("🔢 Update bundle product quantity (local):", productId, quantity);
  // TODO: Implement local logic
};

const removeBundleProduct = (productId: string) => {
  console.log("➖ Remove bundle product (local):", productId);
  // TODO: Implement local logic
};

const updateCustomProductQuantity = (productId: string, quantity: number) => {
  console.log("🔢 Update custom product quantity (local):", productId, quantity);
  // TODO: Implement local logic
};

// État local pour les filtres et la sélection
const selectedCategory = ref("");
const searchQuery = ref("");
const currentPage = ref(1);
const totalPages = ref(1);

// État des articles sélectionnés pour le devis
const selectedQuoteItems = ref<QuoteItem[]>([]);
const currentCalculation = ref<QuoteCalculation | null>(null);

// Catégories disponibles (computed depuis les articles de devis)
const categories = computed(() => {
  const categorySet = new Set<string>();
  availableQuoteItems.value.forEach((item) => {
    categorySet.add(item.category);
  });
  return Array.from(categorySet).map((cat) => ({
    id: cat,
    name: cat,
    description: "",
    slug: cat.toLowerCase().replace(/\s+/g, "-"),
    isActive: true,
  }));
});

// Articles filtrés selon les critères de recherche et catégorie
const filteredProducts = computed(() => {
  let filtered = availableQuoteItems.value;

  // Filtrage par catégorie
  if (selectedCategory.value) {
    filtered = filtered.filter(
      (item) => item.category === selectedCategory.value
    );
  }

  // Filtrage par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }

  // Transformer les QuoteItems en Product pour compatibilité avec le template existant
  return filtered.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    basePrice: item.basePrice,
    minQuantity: item.minQuantity,
    maxQuantity: 10000, // Valeur par défaut
    description: `Article de devis: ${item.name}`,
    image: undefined,
    tags: [],
    isActive: item.status === "Active",
  }));
});

// Refs pour composants
const calculatorRef = ref(null);

// Gestion du contexte d'inspiration
const route = useRoute();
const inspirationContext = ref<{ realisationId: string; realisationTitle: string } | null>(null);

// Initialisation du contexte d'inspiration et chargement des articles
onMounted(async () => {
  // Charger les articles de devis depuis Airtable
  await loadQuoteItems();

  const inspiredBy = route.query.inspiredBy as string;
  const productId = route.query.productId as string;

  if (inspiredBy) {
    try {
      const { getRealisationById } = useRealisations();
      const realisation = await getRealisationById(inspiredBy);
      if (realisation) {
        inspirationContext.value = {
          realisationId: realisation.id,
          realisationTitle: realisation.title,
        };
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement du contexte d'inspiration:",
        error
      );
    }
  }

  // Si un produit spécifique est fourni, le pré-sélectionner
  if (productId) {
    try {
      const storedProduct = sessionStorage.getItem("selectedProduct");
      if (storedProduct) {
        const productData = JSON.parse(storedProduct);
        // Passer directement à l'étape de configuration si un produit est pré-sélectionné
        if (productData.id === productId) {
          currentStep.value = 2;
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du produit pré-sélectionné:",
        error
      );
    }
  }
});

// Méthodes de navigation
const goToStep = (step: number) => {
  if (step >= 1 && step <= steps.length) {
    currentStep.value = step;
  }
};

const nextStep = () => {
  if (currentStep.value < steps.length) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Méthodes de filtrage produits
const filterProducts = () => {
  // Filter products based on category and search query
  // Implementation would go here when backend filtering is available
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Méthodes de gestion des produits
const addProductToQuote = (product: any) => {
  // Trouver l'article de devis correspondant
  const quoteItem = availableQuoteItems.value.find(
    (item) => item.id === product.id
  );
  if (!quoteItem) return;

  const newItem: QuoteItem = {
    id: `item-${Date.now()}`,
    productId: product.id,
    product: product,
    quantity: quoteItem.minQuantity,
    unitPrice: quoteItem.basePrice,
    customizations: [],
    totalPrice: quoteItem.basePrice * quoteItem.minQuantity,
  };
  selectedQuoteItems.value.push(newItem);
};

const isProductInQuote = (productId: string): boolean => {
  return selectedQuoteItems.value.some((item) => item.productId === productId);
};

// Computed pour renommer selectedQuoteItems en quoteItems (compatibilité template)
const quoteItems = computed(() => selectedQuoteItems.value);

const getItemTotal = (item: QuoteItem): number => {
  return item.totalPrice;
};

// Méthodes de calcul
const onQuoteUpdated = (calculation: QuoteCalculation) => {
  currentCalculation.value = calculation;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getCustomerTypeLabel = (type?: string): string => {
  const labels: Record<string, string> = {
    individual: "Particulier",
    party: "Parti politique",
    candidate: "Candidat",
    organization: "Organisation",
  };
  return labels[type || ""] || type || "Non spécifié";
};

// Actions finales
const downloadQuote = () => {
  // TODO: Implement quote download functionality
};

const sendQuote = () => {
  // TODO: Implement quote email sending
};

const saveQuote = () => {
  // TODO: Implement quote saving to database
};

const downloadPDF = () => {
  // TODO: Implement PDF generation and download
};

const sendByEmail = () => {
  // TODO: Implement email sending functionality
};

const startPreorder = () => {
  navigateTo("/precommande");
};

const requestMeeting = () => {
  // TODO: Implement meeting request functionality
  navigateTo("/contact?type=meeting");
};

const startNewQuote = () => {
  // Réinitialiser le formulaire
  currentStep.value = 1;
  customerInfo.value = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    customerType: undefined,
    address: {
      street: "",
      city: "",
      region: "",
      country: "CI",
    },
  };
  selectedQuoteItems.value = [];
  currentCalculation.value = null;
  resetBundleSelection();
};

// ====================================
// BUNDLE SELECTOR EVENT HANDLERS
// ====================================

/**
 * Gestionnaire de sélection de bundle
 */
const onBundleSelected = (bundleId: string) => {
  console.log("🎯 Bundle sélectionné:", bundleId);
  selectBundle(bundleId);

  // Convertir les produits du bundle en articles de devis
  syncBundleToQuoteItems();
};

/**
 * Gestionnaire de sélection personnalisée
 */
const onCustomSelection = () => {
  console.log("🎨 Mode sélection personnalisée activé");
  selectCustom();
  // L'utilisateur peut maintenant sélectionner des produits individuellement
};

/**
 * Gestionnaire de changement de filtre
 */
const onFilterChanged = (filters: any) => {
  console.log("🔍 Filtres de bundle mis à jour:", filters);
  setFilters(filters);
};

/**
 * Gestionnaire de demande de devis depuis le customizer
 */
const proceedToConfiguration = () => {
  console.log("📊 Procédure vers configuration de devis");
  nextStep(); // Aller à l'étape de configuration
};

/**
 * Gestionnaire de vidage de sélection
 */
const onSelectionCleared = () => {
  console.log("🗑️ Sélection vidée");
  selectCustom();
  selectedQuoteItems.value = [];
};

/**
 * Gestionnaire d'ajout de produit
 */
const onProductAdded = (productId: string) => {
  console.log("➕ Produit ajouté:", productId);
  // TODO: Implémenter l'ajout de produit via le catalogue
};

/**
 * Gestionnaire de suppression de produit
 */
const onProductRemoved = (productId: string) => {
  console.log("➖ Produit supprimé:", productId);
  removeFromCustomSelection(productId);
  syncBundleToQuoteItems();
};

/**
 * Gestionnaire de changement de quantité
 */
const onQuantityChanged = (productId: string, quantity: number) => {
  console.log("🔢 Quantité modifiée:", productId, quantity);
  updateBundleProductQuantity(productId, quantity);
  syncBundleToQuoteItems();
};

/**
 * Synchronise la sélection bundle avec les articles de devis
 */
const syncBundleToQuoteItems = () => {
  // Vider les articles existants
  selectedQuoteItems.value = [];

  if (selectedBundle.value) {
    // Si un bundle est sélectionné, convertir ses produits
    selectedBundle.value.products.forEach((bundleProduct) => {
      const quoteItem: QuoteItem = {
        id: `bundle-${bundleProduct.id}-${Date.now()}`,
        productId: bundleProduct.id,
        product: {
          id: bundleProduct.id,
          name: bundleProduct.name,
          basePrice: bundleProduct.basePrice,
          category: "Bundle",
          minQuantity: 1,
          maxQuantity: 10000,
          description: `Produit du pack: ${selectedBundle.value.name}`,
          image: undefined,
          tags: [],
          isActive: true,
        },
        quantity: bundleProduct.quantity,
        unitPrice: bundleProduct.basePrice,
        customizations: [],
        totalPrice: bundleProduct.subtotal,
      };
      selectedQuoteItems.value.push(quoteItem);
    });
  } else if (multiSelectionState.value.selections.size > 0) {
    // Si des produits individuels sont sélectionnés
    multiSelectionState.value.selections.forEach((selection) => {
      // Trouver le produit dans le catalogue
      const product = availableQuoteItems.value.find(
        (item) => item.id === selection.productId
      );
      if (product) {
        const quoteItem: QuoteItem = {
          id: `custom-${selection.productId}-${Date.now()}`,
          productId: selection.productId,
          product: {
            id: product.id,
            name: product.name,
            basePrice: product.basePrice,
            category: product.category,
            minQuantity: product.minQuantity,
            maxQuantity: 10000,
            description: `Sélection personnalisée: ${product.name}`,
            image: undefined,
            tags: [],
            isActive: true,
          },
          quantity: selection.quantity,
          unitPrice: product.basePrice,
          customizations: [],
          totalPrice: product.basePrice * selection.quantity,
        };
        selectedQuoteItems.value.push(quoteItem);
      }
    });
  }

  console.log(
    "🔄 Articles de devis synchronisés:",
    selectedQuoteItems.value.length
  );
};

// ====================================
// DEPENDENCY INJECTION POUR COMPOSANTS ENFANTS
// ====================================

// Fournir l'état bundle aux composants enfants
provide("selectedBundle", selectedBundle);
provide("selectedBundleId", selectedBundleId);
provide("multiSelectionState", multiSelectionState);
provide("selectionSummary", bundleSelectionSummary);
provide("currentCart", currentCart);

// Fournir les méthodes bundle aux composants enfants
provide("updateBundleProductQuantity", updateBundleProductQuantity);
provide("removeBundleProduct", removeBundleProduct);
provide("updateCustomProductQuantity", updateCustomProductQuantity);
provide("removeFromCustomSelection", removeFromCustomSelection);
provide("reset", resetBundleSelection);
</script>
