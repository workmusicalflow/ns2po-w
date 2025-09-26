<template>
  <div class="quote-page">
    <!-- Main Content -->
    <div class="main-content">
      <div class="container mx-auto px-4 py-8">
        <!-- Step Content -->
        <div class="step-content">
          <!-- Étape 1: Sélection Bundle/Packs de campagne -->
          <div v-if="currentStep === 1" class="step-panel">

            <!-- Toggle Bundle/Personnalisé (UX Perplexity) -->
            <div class="flex justify-center mb-8">
              <div class="bg-gray-100 rounded-lg p-1 inline-flex">
                <button
                  @click="selectionMode = 'bundle'"
                  :class="[
                    'px-6 py-3 rounded-md text-sm font-medium transition-all duration-200',
                    selectionMode === 'bundle'
                      ? 'bg-white text-accent shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  ]"
                >
                  📦 Packs Prêts-à-Campagne
                </button>
                <button
                  @click="selectionMode = 'custom'"
                  :class="[
                    'px-6 py-3 rounded-md text-sm font-medium transition-all duration-200',
                    selectionMode === 'custom'
                      ? 'bg-white text-accent shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  ]"
                >
                  ⚙️ Sélection Personnalisée
                </button>
              </div>
            </div>

            <!-- Interface Bundle Selector (Mode Bundle) -->
            <div v-if="selectionMode === 'bundle'" class="bundle-mode">

              <!-- Message d'accroche (UX Perplexity) -->
              <div class="text-center mb-6 md:mb-8 px-4 md:px-0">
                <h2 class="text-xl md:text-2xl font-bold text-accent mb-2 md:mb-3 leading-tight">
                  Nos Experts Ont Conçu Ces Packs Pour Maximiser Votre Impact Électoral
                </h2>
                <p class="text-sm md:text-base text-gray-600 max-w-3xl mx-auto">
                  Gagnez du temps avec nos solutions éprouvées, utilisées par nos clients élus
                </p>
              </div>

              <!-- Grille 3 colonnes avec Pack Pro au centre (UX Perplexity) -->
              <div v-if="bundlesLoading" class="text-center py-12">
                <div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-gray-600">Chargement de vos packs optimisés...</p>
              </div>

              <div v-else-if="bundlesError" class="text-center py-12">
                <p class="text-red-600 mb-4">❌ Erreur de chargement des packs</p>
                <p class="text-sm text-gray-500">{{ bundlesError }}</p>
              </div>

              <div v-else-if="orderedBundles.length" class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div
                  v-for="(bundle, index) in orderedBundles"
                  :key="bundle.id"
                  :class="[
                    'bundle-card relative bg-white rounded-xl shadow-lg border-2 p-4 md:p-6 transition-all duration-300 cursor-pointer hover:shadow-xl',
                    selectedBundleId === bundle.id ? 'border-primary ring-2 ring-primary ring-opacity-20' : 'border-gray-200',
                    // Pack Pro au centre avec mise en avant (UX Perplexity)
                    bundle.targetAudience === 'regional' ? 'transform md:scale-105 border-primary' : ''
                  ]"
                  @click="selectBundle(bundle.id)"
                >
                  <!-- Badge "Le plus choisi" pour Pack Pro (UX Perplexity) -->
                  <div v-if="bundle.targetAudience === 'regional'" class="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span class="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                      ⭐ Le Plus Choisi
                    </span>
                  </div>

                  <!-- Header du bundle -->
                  <div class="text-center mb-4">
                    <h3 class="text-lg md:text-xl font-bold text-accent mb-2">{{ bundle.name }}</h3>
                    <div class="text-2xl md:text-3xl font-bold text-primary mb-1">
                      {{ formatPrice(bundle.estimatedTotal) }}
                    </div>
                    <div v-if="bundle.savings > 0" class="text-sm text-green-600 font-medium">
                      Économisez {{ formatPrice(bundle.savings) }}
                    </div>
                  </div>

                  <!-- Description -->
                  <p class="text-gray-600 text-center mb-4">{{ bundle.description }}</p>

                  <!-- Produits avec Progressive Disclosure (UX Perplexity) -->
                  <div class="mb-6">
                    <h4 class="text-sm font-semibold text-gray-700 mb-2">
                      {{ bundle.products.length }} produits inclus :
                    </h4>
                    <ul class="text-sm text-gray-600 space-y-1">
                      <li v-for="product in bundle.products.slice(0, 3)" :key="product.id" class="flex justify-between">
                        <span>{{ product.name }}</span>
                        <span class="font-medium">{{ product.quantity }}x</span>
                      </li>
                      <li v-if="bundle.products.length > 3"
                          class="text-primary font-medium cursor-pointer hover:underline"
                          @click.stop="toggleProductsExpansion(bundle.id)">
                        {{ expandedBundle === bundle.id ? 'Voir moins' : `+ ${bundle.products.length - 3} autres produits` }}
                      </li>
                    </ul>

                    <!-- Produits supplémentaires (Progressive Disclosure) -->
                    <ul v-if="expandedBundle === bundle.id" class="text-sm text-gray-600 space-y-1 mt-2 pt-2 border-t border-gray-200">
                      <li v-for="product in bundle.products.slice(3)" :key="product.id" class="flex justify-between">
                        <span>{{ product.name }}</span>
                        <span class="font-medium">{{ product.quantity }}x</span>
                      </li>
                    </ul>
                  </div>

                  <!-- Tags/Features -->
                  <div class="mb-6">
                    <div class="flex flex-wrap gap-2">
                      <span v-for="tag in (bundle.tags || []).slice(0, 2)" :key="tag"
                            class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <!-- CTA Button -->
                  <button
                    :class="[
                      'w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200',
                      selectedBundleId === bundle.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white'
                    ]"
                    @click.stop="selectBundle(bundle.id)"
                  >
                    {{ selectedBundleId === bundle.id ? '✓ Pack Sélectionné' : 'Choisir ce Pack' }}
                  </button>
                </div>
              </div>

              <div v-else class="text-center py-12">
                <p class="text-gray-500 mb-4">Aucun pack disponible pour le moment</p>
                <button @click="selectionMode = 'custom'"
                        class="text-primary hover:text-primary-dark font-medium">
                  → Créer un devis personnalisé
                </button>
              </div>

              <!-- Sélecteur de bundles (Fallback si l'interface native ne fonctionne pas) -->
              <BundleSelector
                v-if="false"
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
                @click="navigateToConfiguration"
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
// Import explicite du composable
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

// STUB: useQuoteItems pour futurs articles personnalisés
// TODO: À implémenter dans future session pour sélection personnalisée avancée
const availableQuoteItems = ref([]);
const loadingQuoteItems = ref(false);
const quoteItemsError = ref(null);
const loadQuoteItems = () => console.log('🚧 STUB: loadQuoteItems - À implémenter');
const searchQuoteItems = () => console.log('🚧 STUB: searchQuoteItems - À implémenter');
const quoteItemsByCategory = computed(() => ({}));

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
  // STUB: Chargement articles de devis (remplacé par bundles)
  // await loadQuoteItems();

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
  saveQuoteLocally(); // Sauvegarde locale avant navigation
  navigateToConfiguration(); // STUB: Navigation vers configuration avancée
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
// VARIABLES POUR LE NOUVEAU TEMPLATE TOGGLE
// ====================================

// Mode de sélection : bundle ou custom (UX Perplexity)
const selectionMode = ref('bundle');

// Bundle expandé pour progressive disclosure
const expandedBundle = ref<string | null>(null);

// Computed pour ordonner les bundles avec Pack Pro au centre (UX Gemini)
const orderedBundles = computed(() => {
  const bundles = [...filteredBundles.value];
  const proIndex = bundles.findIndex(b => b.name.toLowerCase().includes('pro'));

  if (proIndex !== -1 && bundles.length === 3) {
    // Réorganiser pour mettre Pack Pro au centre
    const proBundleIndex = bundles.findIndex(b => b.name.toLowerCase().includes('pro'));
    if (proBundleIndex !== -1) {
      const proBundle = bundles.splice(proBundleIndex, 1)[0];
      bundles.splice(1, 0, proBundle); // Insérer au milieu
    }
  }
  return bundles;
});

// ====================================
// MÉTHODES POUR LE NOUVEAU TEMPLATE
// ====================================

/**
 * Toggle l'expansion des produits d'un bundle
 */
const toggleProductsExpansion = (bundleId: string) => {
  expandedBundle.value = expandedBundle.value === bundleId ? null : bundleId;
  console.log('🔄 Toggle expansion bundle:', bundleId, expandedBundle.value);
};

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

// ====================================
// STUBS POUR FONCTIONNALITÉS FUTURES
// ====================================

/**
 * STUB: Soumission du devis
 * @description Soumettre le devis final avec informations client
 * @todo Implémenter dans future session - formulaire client, validation, API
 */
const submitQuote = async (customerData: any) => {
  console.log('🚧 STUB: submitQuote - À implémenter', customerData);
  // TODO: Validation formulaire client
  // TODO: Génération PDF devis
  // TODO: Sauvegarde Turso
  // TODO: Envoi email client
  return { success: true, quoteId: `quote_${Date.now()}` };
};

/**
 * STUB: Configuration avancée des produits
 * @description Page de configuration détaillée avec personnalisation
 * @todo Implémenter dans future session - customisation logos, couleurs, quantités
 */
const navigateToConfiguration = () => {
  console.log('🚧 STUB: navigateToConfiguration - À implémenter');
  // TODO: Navigation vers /devis/configuration
  // TODO: Interface personnalisation logos
  // TODO: Choix couleurs et matériaux
  // TODO: Upload images client
};

/**
 * STUB: Sauvegarde locale du devis
 * @description Sauvegarder le devis en cours localement
 * @todo Implémenter dans future session - localStorage, récupération session
 */
const saveQuoteLocally = () => {
  console.log('🚧 STUB: saveQuoteLocally - À implémenter');
  // TODO: LocalStorage avec timestamp
  // TODO: Récupération au reload
  // TODO: Notification "Devis sauvegardé"
};

/**
 * STUB: Partage du devis
 * @description Partager le devis par lien ou email
 * @todo Implémenter dans future session - génération lien, email
 */
const shareQuote = async (method: 'link' | 'email' | 'whatsapp') => {
  console.log('🚧 STUB: shareQuote - À implémenter', method);
  // TODO: Génération lien partageable
  // TODO: Integration WhatsApp Business
  // TODO: Email avec PDF attaché
};

/**
 * STUB: Historique et favoris
 * @description Gérer l'historique des devis et favoris bundles
 * @todo Implémenter dans future session - localStorage, UI historique
 */
const manageQuoteHistory = () => {
  console.log('🚧 STUB: manageQuoteHistory - À implémenter');
  // TODO: Liste devis précédents
  // TODO: Marquer bundles favoris
  // TODO: Statistiques utilisateur
};

/**
 * STUB: Notifications de progression
 * @description Toast notifications pour feedback utilisateur
 * @todo Implémenter dans future session - toast system, animations
 */
const showProgressNotification = (message: string, type: 'success' | 'error' | 'info') => {
  console.log(`🚧 STUB: showProgressNotification [${type}] - À implémenter:`, message);
  // TODO: Toast notification system
  // TODO: Animations d'entrée/sortie
  // TODO: Queue de notifications
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
