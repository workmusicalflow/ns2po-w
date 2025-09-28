<template>
  <div class="step-builder">
    <!-- Tabs pour Bundle vs Products -->
    <div class="tabs-container mb-6">
      <div class="flex border-b border-gray-200">
        <button
          v-if="mode === 'bundle'"
          @click="activeTab = 'bundles'"
          :class="[
            'tab-button flex-1 py-3 px-4 text-sm font-medium transition-colors',
            activeTab === 'bundles'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          Packs Disponibles
        </button>

        <button
          @click="activeTab = 'products'"
          :class="[
            'tab-button flex-1 py-3 px-4 text-sm font-medium transition-colors',
            activeTab === 'products'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          ]"
        >
          {{ mode === 'bundle' ? 'Personnaliser' : 'Produits' }}
        </button>

        <button
          @click="activeTab = 'cart'"
          :class="[
            'tab-button flex-1 py-3 px-4 text-sm font-medium transition-colors relative',
            activeTab === 'cart'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-600 hover:text-gray-900'
          ]"
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
            @click="selectBundle(bundle)"
            :class="[
              'bundle-card p-4 bg-white rounded-lg border-2 cursor-pointer transition-all',
              'hover:shadow-lg hover:border-primary',
              selectedBundleId === bundle.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
            ]"
          >
            <!-- Badge populaire -->
            <div v-if="bundle.isPopular" class="mb-2">
              <span class="bg-accent text-white text-xs font-bold px-2 py-1 rounded">
                ⭐ Plus Populaire
              </span>
            </div>

            <h3 class="font-bold text-lg mb-2">{{ bundle.name }}</h3>
            <p class="text-2xl font-bold text-primary mb-3">
              {{ formatPrice(bundle.estimatedTotal) }}
            </p>
            <p class="text-sm text-gray-600 mb-3">{{ bundle.description }}</p>

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
              @click.stop="selectBundle(bundle)"
              :class="[
                'w-full py-2 px-4 rounded font-medium transition-colors',
                selectedBundleId === bundle.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-primary hover:text-white'
              ]"
            >
              {{ selectedBundleId === bundle.id ? '✓ Sélectionné' : 'Choisir' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Products avec Virtual Scroll -->
      <div v-else-if="activeTab === 'products'" class="products-list">
        <!-- Barre de recherche et filtres -->
        <div class="mb-4 space-y-3">
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
                v-for="category in categories"
                :key="category"
                @click="selectedCategory = selectedCategory === category ? '' : category"
                :class="[
                  'chip whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ category }}
              </button>
            </div>
          </div>
        </div>

        <!-- Liste virtualisée des produits avec TanStack Virtual -->
        <div class="products-virtual-list h-[400px] overflow-y-auto" ref="scrollElement">
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
                <div class="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200">
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
                    <h4 class="font-medium truncate">{{ filteredProducts[virtualRow.index]?.name }}</h4>
                    <p class="text-sm text-gray-600">{{ formatPrice(filteredProducts[virtualRow.index]?.basePrice || 0) }}</p>
                  </div>

                  <!-- Quick add controls -->
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <button
                      @click="decrementQuantity(filteredProducts[virtualRow.index])"
                      :disabled="!getProductQuantity(filteredProducts[virtualRow.index]?.id)"
                      class="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      -
                    </button>

                    <span class="w-12 text-center font-medium">
                      {{ getProductQuantity(filteredProducts[virtualRow.index]?.id) || 0 }}
                    </span>

                    <button
                      @click="incrementQuantity(filteredProducts[virtualRow.index])"
                      class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8c2.027 0 3.872.76 5.291 2"/>
            </svg>
            <p>Aucun produit trouvé</p>
          </div>
        </div>
      </div>

      <!-- Tab Cart/Récap -->
      <div v-else-if="activeTab === 'cart'" class="cart-summary">
        <div v-if="cartItems.length > 0" class="space-y-3">
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              <div class="flex-1">
                <h4 class="font-medium">{{ item.name }}</h4>
                <p class="text-sm text-gray-600">
                  {{ item.quantity }} x {{ formatPrice(item.unitPrice) }}
                </p>
              </div>

              <div class="text-right">
                <p class="font-bold">{{ formatPrice(item.total) }}</p>
                <button
                  @click="removeFromCart(item.id)"
                  class="text-red-500 text-sm hover:underline"
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
            @click="activeTab = mode === 'bundle' ? 'bundles' : 'products'"
            class="mt-4 text-primary hover:underline"
          >
            Commencer votre sélection
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

// Props
const props = defineProps<{
  mode: 'bundle' | 'custom'
  bundles?: any[]
  products?: any[]
}>()

// Emits
const emit = defineEmits<{
  'bundle-selected': [bundle: any]
  'cart-updated': [items: any[]]
  'proceed': []
}>()

// State
const activeTab = ref(props.mode === 'bundle' ? 'bundles' : 'products')
const selectedBundleId = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref('')
const cartItems = ref<any[]>([])
const scrollElement = ref<HTMLElement>()

// Mock data (à remplacer par les vraies données)
const categories = ['Affiches', 'T-shirts', 'Casquettes', 'Banderoles', 'Flyers']

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

  if (searchQuery.value) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

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
const selectBundle = (bundle: any) => {
  selectedBundleId.value = bundle.id
  // Ajouter les produits du bundle au panier
  cartItems.value = bundle.products.map((p: any) => ({
    id: p.id,
    name: p.name,
    quantity: p.quantity,
    unitPrice: p.basePrice,
    total: p.quantity * p.basePrice
  }))
  emit('bundle-selected', bundle)
  activeTab.value = 'cart'
}

const getProductQuantity = (productId: string) => {
  const item = cartItems.value.find(i => i.id === productId)
  return item ? item.quantity : 0
}

const incrementQuantity = (product: any) => {
  const existing = cartItems.value.find(i => i.id === product.id)

  if (existing) {
    existing.quantity++
    existing.total = existing.quantity * existing.unitPrice
  } else {
    cartItems.value.push({
      id: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.basePrice,
      total: product.basePrice
    })
  }

  emit('cart-updated', cartItems.value)
}

const decrementQuantity = (product: any) => {
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
</style>