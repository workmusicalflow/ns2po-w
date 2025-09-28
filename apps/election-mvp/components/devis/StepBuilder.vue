<template>
  <div class="step-builder">
    <!-- Header contextuel en mode bundle -->
    <div v-if="mode === 'bundle' && selectedBundleId" class="contextual-header mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h2 class="text-lg font-bold text-primary mb-1">
            Vous modifiez : {{ getSelectedBundleName() }}
          </h2>
          <p class="text-sm text-gray-600">
            Vous ajoutez des compléments à ce pack. Les éléments inclus restent inchangés.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="mode-chip px-3 py-1 bg-primary text-white text-xs font-bold rounded-full">
            Mode édition
          </span>
          <button
            class="cancel-btn p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Annuler les modifications"
            @click="cancelModifications"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs pour Bundle vs Products -->
    <div class="tabs-container mb-6">
      <div class="flex border-b border-gray-200">
        <button
          v-if="mode === 'bundle'"
          :class="[
            'tab-button flex-1 py-3 px-4 text-sm font-medium transition-colors',
            activeTab === 'bundles'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          ]"
          @click="activeTab = 'bundles'"
        >
          Packs Disponibles
        </button>

        <button
          :class="[
            'tab-button flex-1 py-3 px-4 text-sm font-medium transition-colors',
            activeTab === 'products'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          ]"
          @click="activeTab = 'products'"
        >
          {{ mode === 'bundle' ? 'Modifier le pack' : 'Produits' }}
        </button>

        <button
          :class="[
            'tab-button flex-1 py-3 px-4 text-sm font-medium transition-colors relative',
            activeTab === 'cart'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          ]"
          @click="activeTab = 'cart'"
        >
          Panier
          <span
            v-if="cartItemsCount > 0"
            class="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
          >
            {{ cartItemsCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Contenu des tabs -->
    <div class="tab-content">
      <!-- Tab Bundles -->
      <div v-if="activeTab === 'bundles' && mode === 'bundle'" class="bundles-grid">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="bundle in bundles"
            :key="bundle.id"
            :class="[
              'bundle-card p-4 bg-white rounded-lg border-2 cursor-pointer transition-all',
              'hover:shadow-lg hover:border-primary',
              selectedBundleId === bundle.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
            ]"
            @click="selectBundle(bundle)"
          >
            <!-- Badge populaire -->
            <div v-if="bundle.isPopular" class="mb-2">
              <span class="bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                ⭐ Plus Populaire
              </span>
            </div>

            <h3 class="font-bold text-lg mb-2">
              {{ bundle.name }}
            </h3>
            <p class="text-2xl font-bold text-primary mb-3">
              {{ formatPrice(bundle.estimatedTotal) }}
            </p>
            <p class="text-sm text-gray-600 mb-3">
              {{ bundle.description }}
            </p>

            <!-- Quick preview des produits -->
            <ul class="text-sm space-y-1 mb-4">
              <li v-for="(product, idx) in bundle.products.slice(0, 3)" :key="idx" class="flex justify-between">
                <span>{{ product.name }}</span>
                <span class="font-medium">x{{ product.quantity }}</span>
              </li>
              <li v-if="bundle.products.length > 3" class="text-primary">
                +{{ bundle.products.length - 3 }} autres
              </li>
            </ul>

            <button
              :class="[
                'w-full py-2 px-4 rounded font-medium transition-colors',
                selectedBundleId === bundle.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-primary hover:text-white'
              ]"
              @click.stop="selectBundle(bundle)"
            >
              {{ selectedBundleId === bundle.id ? '✓ Sélectionné' : 'Choisir' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Products avec Virtual Scroll -->
      <div v-else-if="activeTab === 'products'" class="products-list">
        <!-- Section Produits inclus dans le pack (en mode bundle) -->
        <div v-if="mode === 'bundle' && selectedBundleId" class="included-products-section mb-6">
          <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-md font-bold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Inclus dans votre pack
              </h3>
              <span class="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {{ getIncludedProductsCount() }} produits
              </span>
            </div>

            <div class="space-y-2">
              <div
                v-for="item in cartItems.slice(0, 3)"
                :key="item.id"
                class="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-100"
              >
                <span class="text-gray-700">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-gray-500">x{{ item.quantity }}</span>
                  <span class="text-green-600 font-medium">✓ Inclus</span>
                </div>
              </div>

              <div v-if="cartItems.length > 3" class="text-sm text-primary font-medium text-center py-1">
                +{{ cartItems.length - 3 }} autres produits inclus
              </div>

              <div v-if="cartItems.length === 0" class="text-sm text-gray-500 text-center py-2 italic">
                Sélectionnez un pack pour voir les produits inclus
              </div>
            </div>
          </div>
        </div>

        <!-- Barre de recherche et filtres -->
        <div class="mb-4 space-y-3">
          <!-- Compteur de produits complémentaires -->
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>{{ filteredProducts.length }} compléments disponibles</span>
            <span v-if="cartItems.length > 0" class="text-green-600">
              {{ cartItems.length }} dans le pack
            </span>
          </div>

          <input
            v-model="searchQuery"
            type="search"
            placeholder="Rechercher un produit..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >

          <!-- Chips catégories scrollables -->
          <div class="overflow-x-auto">
            <div class="flex gap-2 pb-2">
              <button
                v-for="category in availableCategories"
                :key="category"
                :class="[
                  'chip whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
                @click="selectedCategory = selectedCategory === category ? '' : category"
              >
                {{ category }}
              </button>
            </div>
          </div>
        </div>

        <!-- Liste virtualisée des produits avec TanStack Virtual -->
        <div ref="scrollElement" class="products-virtual-list h-[400px] overflow-y-auto">
          <div
            v-if="filteredProducts.length > 0"
            :style="{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }"
          >
            <div
              v-for="virtualRow in virtualizer.getVirtualItems()"
              :key="virtualRow.index"
              :style="{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }"
            >
              <div class="product-row px-2 pb-2">
                <div
                  :class="[
                    'product-card flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200',
                    { 'just-added': justAddedProductId === filteredProducts[virtualRow.index]?.id }
                  ]"
                >
                  <!-- Image produit -->
                  <div class="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                    <NuxtImg
                      v-if="filteredProducts[virtualRow.index]?.image"
                      :src="filteredProducts[virtualRow.index].image"
                      :alt="filteredProducts[virtualRow.index].name"
                      preset="mobile"
                      class="w-full h-full object-cover"
                    />
                  </div>

                  <!-- Info produit -->
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium truncate">
                      {{ filteredProducts[virtualRow.index]?.name }}
                    </h4>
                    <p class="text-sm text-gray-600">
                      {{ formatPrice(filteredProducts[virtualRow.index]?.basePrice || 0) }}
                    </p>
                  </div>

                  <!-- Quick add controls -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button
                      :disabled="!getProductQuantity(filteredProducts[virtualRow.index]?.id)"
                      class="quantity-button w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      @click="decrementQuantity(filteredProducts[virtualRow.index])"
                    >
                      -
                    </button>

                    <span class="w-12 text-center font-medium">
                      {{ getProductQuantity(filteredProducts[virtualRow.index]?.id) || 0 }}
                    </span>

                    <button
                      class="quantity-button w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                      @click="incrementQuantity(filteredProducts[virtualRow.index])"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Message si aucun produit -->
          <div v-else class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8c2.027 0 3.872.76 5.291 2" />
            </svg>
            <h3 class="font-medium mb-2">
              Aucun produit disponible
            </h3>
            <p class="text-sm mb-4">
              Tous les produits correspondants sont déjà dans votre panier
              ou aucun produit ne correspond à vos critères de recherche.
            </p>
            <div class="space-y-2">
              <button
                v-if="searchQuery || selectedCategory"
                class="text-primary hover:underline text-sm"
                @click="searchQuery = ''; selectedCategory = ''"
              >
                Effacer les filtres
              </button>
              <button
                class="block text-primary hover:underline text-sm mx-auto"
                @click="activeTab = 'cart'"
              >
                Voir le panier ({{ cartItems.length }} produits)
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Cart/Récap -->
      <div v-else-if="activeTab === 'cart'" class="cart-summary">
        <div v-if="cartItems.length > 0" class="space-y-3">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div class="flex-1">
                <h4 class="font-medium">
                  {{ item.name }}
                </h4>
                <p class="text-sm text-gray-600">
                  {{ item.quantity }} x {{ formatPrice(item.unitPrice) }}
                </p>
              </div>

              <div class="text-right">
                <p class="font-bold">
                  {{ formatPrice(item.total) }}
                </p>
                <button
                  class="text-red-500 text-sm hover:underline"
                  @click="removeFromCart(item.id)"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="border-t pt-3 mt-4">
            <div class="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span class="text-primary">{{ formatPrice(cartTotal) }}</span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12 text-gray-500">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p>Votre panier est vide</p>
          <button
            class="mt-4 text-primary hover:underline"
            @click="activeTab = mode === 'bundle' ? 'bundles' : 'products'"
          >
            Commencer votre sélection
          </button>
        </div>
      </div>
    </div>

    <!-- Barre de comparaison sticky bottom (en mode bundle avec modifications) -->
    <div
      v-if="mode === 'bundle' && selectedBundleId && hasModifications"
      class="sticky-comparison-bar comparison-bar fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3"
      :style="{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }"
    >
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between gap-4">
          <!-- Comparaison prix avant/après -->
          <div class="flex-1">
            <div class="flex items-center gap-2 text-sm">
              <span class="text-gray-500">Pack de base :</span>
              <span class="font-medium">{{ formatPrice(baseBundlePrice) }}</span>
              <span class="text-gray-400">→</span>
              <span class="font-bold text-primary">{{ formatPrice(totalWithModifications) }}</span>
            </div>
            <div class="flex items-center gap-1 mt-1">
              <span class="text-xs text-gray-500">Modification :</span>
              <span
                :class="[
                  'text-xs font-bold',
                  priceModificationDelta > 0 ? 'text-green-600' : 'text-red-600'
                ]"
              >
                {{ priceModificationDelta > 0 ? '+' : '' }}{{ formatPrice(priceModificationDelta) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              @click="cancelModifications"
            >
              Annuler
            </button>
            <button
              class="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-colors"
              @click="saveModifications"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast de feedback pour ajout de produit -->
    <div v-if="showAddedFeedback" class="added-feedback">
      ✅ Produit ajouté au pack !
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { CampaignBundle, Product } from '~/types/api'

// Types locaux
interface CartItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}

// Props
const props = defineProps<{
  mode: 'bundle' | 'custom'
  bundles?: CampaignBundle[]
  products?: Product[]
}>()

// Emits
const emit = defineEmits<{
  'bundle-selected': [bundle: CampaignBundle]
  'cart-updated': [items: CartItem[]]
  'proceed': []
  'modifications-saved': [data: { bundleId: string | null, modifications: CartItem[], totalPrice: number }]
}>()

// State
const activeTab = ref(props.mode === 'bundle' ? 'bundles' : 'products')
const selectedBundleId = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref('')
const cartItems = ref<CartItem[]>([])
const scrollElement = ref<HTMLElement>()

// État pour micro-interactions
const justAddedProductId = ref<string | null>(null)
const showAddedFeedback = ref(false)

// Extraction dynamique des catégories depuis les vraies données
const availableCategories = computed(() => {
  const allProducts = props.products || []
  const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
  return uniqueCategories.sort()
})

// Virtualizer pour la liste des produits
const virtualizer = useVirtualizer({
  count: computed(() => filteredProducts.value.length),
  getScrollElement: () => scrollElement.value,
  estimateSize: () => 88, // Hauteur estimée par item (p-3 + mb-2 ≈ 88px)
  overscan: 5, // Nombre d'items à pré-rendre
})

// Computed
const filteredProducts = computed(() => {
  let products = props.products || []

  // 🚫 Filtrer les produits déjà dans le panier (éviter doublons)
  const cartProductIds = cartItems.value.map(item => item.id)
  products = products.filter(p => !cartProductIds.includes(p.id))

  // 🔍 Recherche textuelle enrichie (nom + description)
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    products = products.filter(p => {
      const name = (p.name || '').toLowerCase()
      const description = (p.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }

  // 🏷️ Filtrage par catégorie
  if (selectedCategory.value) {
    products = products.filter(p => p.category === selectedCategory.value)
  }

  return products
})

const cartItemsCount = computed(() => cartItems.value.length)

const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.total, 0)
})

// Methods
const selectBundle = (bundle: CampaignBundle) => {
  selectedBundleId.value = bundle.id

  console.log('🎯 StepBuilder - Bundle sélectionné:', bundle)

  // Ajouter les produits du bundle au panier
  const newCartItems = bundle.products.map((p) => {
    const unitPrice = p.basePrice || p.unitPrice || 0
    const quantity = p.quantity || 1
    const total = quantity * unitPrice

    console.log('📦 StepBuilder - Produit traité:', {
      name: p.name,
      unitPrice,
      quantity,
      total
    })

    return {
      id: p.id,
      name: p.name,
      quantity,
      unitPrice,
      total
    }
  })

  cartItems.value = newCartItems

  console.log('🛒 StepBuilder - Panier local mis à jour:', cartItems.value)

  // Émettre les événements vers le parent
  emit('bundle-selected', bundle)
  emit('cart-updated', newCartItems)

  activeTab.value = 'cart'
}

const getProductQuantity = (productId: string) => {
  const item = cartItems.value.find(i => i.id === productId)
  return item ? item.quantity : 0
}

const incrementQuantity = (product: Product) => {
  const existing = cartItems.value.find(i => i.id === product.id)

  if (existing) {
    existing.quantity++
    existing.total = existing.quantity * existing.unitPrice
  } else {
    cartItems.value.push({
      id: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.price,
      total: product.price
    })
  }

  // Micro-interaction : feedback visuel pour l'ajout
  triggerAddedFeedback(product.id)

  emit('cart-updated', cartItems.value)
}

const decrementQuantity = (product: Product) => {
  const existing = cartItems.value.find(i => i.id === product.id)

  if (existing) {
    if (existing.quantity > 1) {
      existing.quantity--
      existing.total = existing.quantity * existing.unitPrice
    } else {
      removeFromCart(product.id)
    }
  }

  emit('cart-updated', cartItems.value)
}

const removeFromCart = (productId: string) => {
  cartItems.value = cartItems.value.filter(i => i.id !== productId)
  emit('cart-updated', cartItems.value)
}

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

// Méthodes pour le header contextuel
const getSelectedBundleName = () => {
  if (!selectedBundleId.value || !props.bundles) return 'Pack sélectionné'

  const bundle = props.bundles.find(b => b.id === selectedBundleId.value)
  return bundle?.name || 'Pack sélectionné'
}

const cancelModifications = () => {
  // Réinitialiser les modifications
  cartItems.value = []
  selectedBundleId.value = null
  activeTab.value = 'bundles'

  // Émettre l'événement de mise à jour
  emit('cart-updated', [])
}

const getIncludedProductsCount = () => {
  return cartItems.value.length
}

// Computed pour la barre de comparaison
const selectedBundle = computed(() => {
  if (!selectedBundleId.value || !props.bundles) return null
  return props.bundles.find(b => b.id === selectedBundleId.value)
})

const baseBundlePrice = computed(() => {
  return selectedBundle.value?.estimatedTotal || 0
})

const totalWithModifications = computed(() => {
  return cartTotal.value
})

const priceModificationDelta = computed(() => {
  return totalWithModifications.value - baseBundlePrice.value
})

const hasModifications = computed(() => {
  return priceModificationDelta.value !== 0
})

const saveModifications = () => {
  // Émettre les modifications au composant parent
  emit('cart-updated', cartItems.value)

  // Basculer vers l'onglet panier pour afficher le résultat final
  activeTab.value = 'cart'

  // Émettre un événement spécifique pour notifier que les modifications sont sauvegardées
  emit('modifications-saved', {
    bundleId: selectedBundleId.value,
    modifications: cartItems.value,
    totalPrice: totalWithModifications.value
  })
}

// Micro-interactions
const triggerAddedFeedback = (productId: string) => {
  justAddedProductId.value = productId
  showAddedFeedback.value = true

  // Reset après animation
  setTimeout(() => {
    justAddedProductId.value = null
    showAddedFeedback.value = false
  }, 1500)
}
</script>

<style scoped>
.tab-button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.products-virtual-list {
  -webkit-overflow-scrolling: touch;
}

.chip {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Micro-interactions et animations */
.product-card {
  transition: all 0.2s ease;
}

.product-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card.just-added {
  animation: addedPulse 0.6s ease-out;
  background-color: #C99A3B10;
  border-color: #C99A3B;
}

@keyframes addedPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(201, 154, 59, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 0 8px rgba(201, 154, 59, 0.1);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(201, 154, 59, 0);
  }
}

.quantity-button {
  transition: all 0.15s ease;
}

.quantity-button:active {
  transform: scale(0.95);
}

.sticky-comparison-bar {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Feedback pour toast léger */
.added-feedback {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #C99A3B;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  animation: toastSlide 1.5s ease-out forwards;
}

@keyframes toastSlide {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  20% {
    transform: translateX(0);
    opacity: 1;
  }
  80% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>