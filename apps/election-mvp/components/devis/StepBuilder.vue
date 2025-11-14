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
        <!-- Message si pas de bundles -->
        <div v-if="!bundles || bundles.length === 0" class="text-center py-8">
          <div class="mb-4">
            <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">Aucun pack disponible</h3>
          <p class="text-gray-600">Les packs de campagne sont en cours de chargement...</p>
          <button
            @click="activeTab = 'products'"
            class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Voir les produits individuels
          </button>
        </div>

        <!-- Grille de bundles -->
        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <!-- Header contextuel de recherche -->
          <div class="search-feedback mb-3">
            <!-- État de recherche active -->
            <div v-if="searchState.isSearching" class="search-active-header bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span class="text-sm font-medium text-blue-800">
                    Recherche : "{{ searchState.searchTerm }}"
                  </span>
                </div>
                <button
                  class="clear-search text-blue-600 hover:text-blue-800 text-sm underline"
                  @click="searchQuery = ''; debouncedSearchQuery = ''"
                >
                  Effacer ✕
                </button>
              </div>

              <!-- Résultats trouvés -->
              <div v-if="searchState.hasResults" class="mt-2 text-sm text-blue-700">
                ✅ {{ searchState.resultCount }} résultat{{ searchState.resultCount > 1 ? 's' : '' }}
                trouvé{{ searchState.resultCount > 1 ? 's' : '' }} dans les compléments disponibles
              </div>

              <!-- Aucun résultat -->
              <div v-else class="mt-2 text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded">
                ❌ Aucun résultat pour "{{ searchState.searchTerm }}"
                <br>
                <span class="text-xs">Essayez un autre terme ou effacez la recherche</span>
              </div>
            </div>

            <!-- État normal sans recherche -->
            <div v-else class="flex items-center justify-between text-sm text-gray-600">
              <span>{{ searchResults.length }} complément{{ searchResults.length > 1 ? 's' : '' }} disponible{{ searchResults.length > 1 ? 's' : '' }}</span>
              <span v-if="cartItems.length > 0" class="text-green-600">
                {{ cartItems.length }} dans le pack
              </span>
            </div>

            <!-- Filtre par catégorie actif -->
            <div v-if="selectedCategory && !searchState.isSearching" class="mt-2">
              <span class="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                🏷️ Catégorie: {{ selectedCategory }}
                <button
                  class="ml-1 text-gray-500 hover:text-gray-700"
                  @click="selectedCategory = ''"
                >
                  ✕
                </button>
              </span>
            </div>
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
            v-if="searchResults.length > 0"
            :style="{
              height: `${virtualizer.value.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }"
          >
            <div
              v-for="virtualRow in virtualizer.value.getVirtualItems()"
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
                    { 'just-added': justAddedProductId === searchResults[virtualRow.index]?.product?.id }
                  ]"
                >
                  <!-- Image produit optimisée Cloudinary -->
                  <div class="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                    <img
                      v-if="getProductImageUrl(searchResults[virtualRow.index]?.product)"
                      :src="getProductImageUrl(searchResults[virtualRow.index]?.product)"
                      :alt="searchResults[virtualRow.index].product.name"
                      loading="lazy"
                      class="w-full h-full object-cover"
                      @error="handleImageError(virtualRow.index)"
                    />
                    <!-- Fallback si pas d'image -->
                    <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <!-- Info produit enrichie -->
                  <div class="flex-1 min-w-0">
                    <!-- Nom du produit avec highlight -->
                    <div class="flex items-center gap-2 mb-1">
                      <h4
                        class="font-medium truncate"
                        v-html="searchState.isSearching ? searchResults[virtualRow.index]?.highlightedName : searchResults[virtualRow.index]?.product?.name"
                      />

                      <!-- Chip de correspondance -->
                      <span
                        v-if="searchState.isSearching && searchResults[virtualRow.index]"
                        :class="[
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          {
                            'bg-green-100 text-green-800': searchResults[virtualRow.index].matchType === 'exact',
                            'bg-blue-100 text-blue-800': searchResults[virtualRow.index].matchType === 'synonym',
                            'bg-orange-100 text-orange-800': searchResults[virtualRow.index].matchType === 'fuzzy'
                          }
                        ]"
                      >
                        {{ searchResults[virtualRow.index].reason }}
                      </span>
                    </div>

                    <!-- Prix et score de pertinence -->
                    <div class="flex items-center gap-2">
                      <p class="text-sm text-gray-600">
                        {{ formatPrice(searchResults[virtualRow.index]?.product?.basePrice || 0) }}
                      </p>

                      <!-- Score de pertinence visuel -->
                      <div
                        v-if="searchState.isSearching && searchResults[virtualRow.index]"
                        class="flex items-center gap-1"
                        :title="`Score: ${searchResults[virtualRow.index].score}/100`"
                      >
                        <span v-for="n in Math.min(3, Math.ceil(searchResults[virtualRow.index].score / 33))" :key="n" class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <span v-for="n in (3 - Math.min(3, Math.ceil(searchResults[virtualRow.index].score / 33)))" :key="`empty-${n}`" class="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                      </div>
                    </div>
                  </div>

                  <!-- Simplified quantity controls -->
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <!-- Quantité cliquable pour ouvrir le bottom sheet -->
                    <button
                      class="quantity-display px-3 py-1 text-sm font-medium bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors min-w-[3rem] text-center"
                      @click="openQuantitySheet(searchResults[virtualRow.index]?.product)"
                      :title="getProductQuantity(searchResults[virtualRow.index]?.product?.id) ? 'Modifier la quantité' : 'Ajouter une quantité'"
                    >
                      {{ getProductQuantity(searchResults[virtualRow.index]?.product?.id) || 0 }}
                    </button>

                    <!-- Bouton principal pour ouvrir le bottom sheet -->
                    <button
                      class="quantity-button w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors relative"
                      @click="openQuantitySheet(searchResults[virtualRow.index]?.product)"
                      :title="getProductQuantity(searchResults[virtualRow.index]?.product?.id) ? 'Modifier la quantité' : 'Choisir une quantité'"
                    >
                      +
                      <!-- Indicateur d'options avancées -->
                      <span class="absolute -top-1 -right-1 w-3 h-3 text-[8px] bg-accent text-white rounded-full flex items-center justify-center font-bold">
                        •••
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- États vides intelligents -->
          <div v-else class="empty-state py-8 px-4 text-center">
            <!-- État de recherche sans résultats -->
            <div v-if="searchState.isSearching && !searchState.hasResults" class="search-no-results">
              <div class="mb-6">
                <svg class="w-16 h-16 mx-auto mb-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 class="text-lg font-bold text-gray-800 mb-2">
                  Aucun résultat pour "{{ searchState.searchTerm }}"
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                  Nous n'avons trouvé aucun produit correspondant à votre recherche.
                </p>
              </div>

              <!-- Suggestions intelligentes -->
              <div class="smart-suggestions space-y-4 mb-6">
                <!-- Suggestions orthographiques -->
                <div v-if="getSpellingSuggestions().length > 0" class="suggestion-group">
                  <p class="text-sm font-medium text-gray-700 mb-2">Voulez-vous dire :</p>
                  <div class="flex flex-wrap justify-center gap-2">
                    <button
                      v-for="suggestion in getSpellingSuggestions().slice(0, 3)"
                      :key="suggestion"
                      class="suggestion-chip px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors"
                      @click="applySuggestion(suggestion)"
                    >
                      {{ suggestion }}
                    </button>
                  </div>
                </div>

                <!-- Suggestions de catégories -->
                <div v-if="availableCategories.length > 0" class="suggestion-group">
                  <p class="text-sm font-medium text-gray-700 mb-2">Ou explorez par catégorie :</p>
                  <div class="flex flex-wrap justify-center gap-2">
                    <button
                      v-for="category in availableCategories.slice(0, 4)"
                      :key="category"
                      class="category-chip px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      @click="selectCategoryAndClearSearch(category)"
                    >
                      🏷️ {{ category }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Actions rapides -->
              <div class="quick-actions space-y-2">
                <button
                  class="text-primary hover:underline text-sm font-medium"
                  @click="clearSearchAndFilters"
                >
                  ✕ Effacer la recherche
                </button>
                <br>
                <button
                  v-if="cartItems.length > 0"
                  class="text-green-600 hover:underline text-sm"
                  @click="activeTab = 'cart'"
                >
                  Voir le panier ({{ cartItems.length }} produit{{ cartItems.length > 1 ? 's' : '' }})
                </button>
              </div>
            </div>

            <!-- État normal : tous produits dans le panier -->
            <div v-else-if="!searchState.isSearching" class="all-in-cart">
              <div class="mb-6">
                <svg class="w-16 h-16 mx-auto mb-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-lg font-bold text-gray-800 mb-2">
                  Tous les compléments sont ajoutés !
                </h3>
                <p class="text-sm text-gray-600 mb-4">
                  Parfait ! Vous avez sélectionné tous les produits disponibles pour votre pack.
                </p>
              </div>

              <!-- Action principale -->
              <div class="primary-action">
                <button
                  class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                  @click="activeTab = 'cart'"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  Finaliser le panier ({{ cartItems.length }} produits)
                </button>
              </div>
            </div>

            <!-- État: recherche trop courte -->
            <div v-else-if="searchState.searchTerm.length < 2" class="search-too-short">
              <div class="mb-4">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p class="text-sm text-gray-600">
                  ✏️ Tapez au moins 2 caractères pour lancer la recherche
                </p>
              </div>
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

    <!-- Quantity Bottom Sheet -->
    <QuantityBottomSheet
      :show="showQuantitySheet"
      :product="selectedProductForQuantity"
      :initial-quantity="getProductQuantity(selectedProductForQuantity?.id) || 50"
      :min="50"
      :max="10000"
      :step-small="10"
      :step-large="100"
      :presets="[50, 100, 500, 1000, 5000]"
      @confirm="handleQuantityConfirm"
      @cancel="handleQuantityCancel"
      @close="handleQuantityCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { CampaignBundle, Product } from '~/types/api'
import QuantityBottomSheet from './QuantityBottomSheet.vue'

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

// Debug logs pour vérifier l'état initial
console.log('🔍 StepBuilder initialized:', {
  mode: props.mode,
  bundlesCount: props.bundles?.length || 0,
  productsCount: props.products?.length || 0,
  activeTab: activeTab.value
})

// État pour micro-interactions
const justAddedProductId = ref<string | null>(null)
const showAddedFeedback = ref(false)

// État pour QuantityBottomSheet
const showQuantitySheet = ref(false)
const selectedProductForQuantity = ref<Product | null>(null)

// Debounced search query pour performance (recommandation Gemini)
const debouncedSearchQuery = ref('')
let debounceTimer: NodeJS.Timeout | null = null

// Watch pour debounce de la recherche (150ms)
watch(searchQuery, (newQuery) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = newQuery
  }, 150)
}, { immediate: true })

// Types pour les résultats de recherche enrichis
interface SearchResult {
  product: Product
  score: number
  matchType: 'exact' | 'synonym' | 'fuzzy'
  highlightedName: string
  reason: string
}

// État de recherche pour debugging et UX
const searchState = ref({
  isSearching: false,
  hasResults: false,
  resultCount: 0,
  searchTerm: ''
})

// Extraction dynamique des catégories depuis les vraies données
const availableCategories = computed(() => {
  const allProducts = props.products || []
  const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))]
  return uniqueCategories.sort()
})

// Computed pour résultats de recherche enrichis
const searchResults = computed<SearchResult[]>(() => {
  let products = props.products || []

  // 🚫 Filtrer les produits déjà dans le panier (éviter doublons)
  const cartProductIds = cartItems.value.map(item => item.id)
  products = products.filter(p => !cartProductIds.includes(p.id))

  // Mise à jour de l'état de recherche
  const hasQuery = debouncedSearchQuery.value && debouncedSearchQuery.value.trim()
  searchState.value.searchTerm = debouncedSearchQuery.value || ''
  searchState.value.isSearching = hasQuery

  // 🔍 Recherche fuzzy améliorée si requête (avec debounce)
  if (hasQuery) {
    const query = debouncedSearchQuery.value.toLowerCase().trim()

    // Préprocess query : suppression accents et normalisation
    const normalizeText = (text: string) =>
      text.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()

    const normalizedQuery = normalizeText(query)

    // Synonymes et abréviations locaux (Côte d'Ivoire)
    const synonyms: Record<string, string[]> = {
      'flyer': ['tract', 'depliant', 'prospectus'],
      'tshirt': ['t-shirt', 'tee-shirt', 'maillot'],
      'casquette': ['cap', 'chapeau'],
      'bache': ['banderole', 'panneau'],
      'kakemono': ['kakémono', 'oriflamme', 'voile'],
      'affiche': ['affiches', 'poster', 'affichage']
    }

    // Fonction de calcul de distance Levenshtein optimisée
    const levenshteinDistance = (str1: string, str2: string): number => {
      if (str1.length === 0) return str2.length
      if (str2.length === 0) return str1.length

      const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,     // deletion
            matrix[j - 1][i] + 1,     // insertion
            matrix[j - 1][i - 1] + indicator // substitution
          )
        }
      }

      return matrix[str2.length][str1.length]
    }

    // Calcul du score de pertinence
    const calculateRelevanceScore = (product: Product): number => {
      const name = normalizeText(product.name || '')
      const description = normalizeText(product.description || '')
      let maxScore = 0

      // 1. Correspondance exacte (score max)
      if (name.includes(normalizedQuery) || description.includes(normalizedQuery)) {
        maxScore = Math.max(maxScore, name.includes(normalizedQuery) ? 100 : 70)
      }

      // 2. Correspondance par mots
      const queryWords = normalizedQuery.split(' ')
      const nameWords = name.split(' ')
      const descWords = description.split(' ')

      for (const queryWord of queryWords) {
        if (queryWord.length < 2) continue

        // Correspondance exacte de mot
        for (const nameWord of nameWords) {
          if (nameWord === queryWord) maxScore = Math.max(maxScore, 90)
          else if (nameWord.includes(queryWord)) maxScore = Math.max(maxScore, 80)
        }

        for (const descWord of descWords) {
          if (descWord === queryWord) maxScore = Math.max(maxScore, 60)
          else if (descWord.includes(queryWord)) maxScore = Math.max(maxScore, 50)
        }

        // 3. Correspondance fuzzy (Levenshtein)
        for (const nameWord of nameWords) {
          if (nameWord.length >= 3) {
            const distance = levenshteinDistance(queryWord, nameWord)
            const tolerance = Math.max(1, Math.floor(queryWord.length / 3))
            if (distance <= tolerance) {
              const fuzzyScore = Math.max(0, 75 - (distance * 15))
              maxScore = Math.max(maxScore, fuzzyScore)
            }
          }
        }

        // 4. Correspondance synonymes
        for (const [key, values] of Object.entries(synonyms)) {
          if (key.includes(queryWord) || values.some(v => v.includes(queryWord))) {
            if (name.includes(key) || values.some(v => name.includes(v))) {
              maxScore = Math.max(maxScore, 85)
            }
          }
        }
      }

      return maxScore
    }

    // Fonction pour surligner les termes trouvés
    const highlightText = (text: string, query: string): string => {
      if (!text || !query) return text

      const normalizedText = normalizeText(text)
      const normalizedQuery = normalizeText(query)

      // Surlignage simple pour les correspondances exactes
      const regex = new RegExp(`(${normalizedQuery.split(' ').join('|')})`, 'gi')
      return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
    }

    // Fonction pour générer la raison du match
    const getMatchReason = (product: Product, matchType: string, score: number): string => {
      const name = normalizeText(product.name || '')

      if (matchType === 'exact' && name.includes(normalizedQuery)) return 'Nom exact'
      if (matchType === 'exact') return 'Description'
      if (matchType === 'synonym') return 'Synonyme'
      if (score > 70) return 'Très proche'
      if (score > 50) return 'Proche'
      return 'Similaire'
    }

    // Filtrage et scoring avec métadonnées enrichies
    const scoredProducts = products
      .map(product => {
        const score = calculateRelevanceScore(product)
        const name = normalizeText(product.name || '')
        const description = normalizeText(product.description || '')

        let matchType: 'exact' | 'synonym' | 'fuzzy' = 'fuzzy'

        if (name.includes(normalizedQuery) || description.includes(normalizedQuery)) {
          matchType = 'exact'
        } else {
          const queryWords = normalizedQuery.split(' ')
          for (const word of queryWords) {
            for (const [key, values] of Object.entries(synonyms)) {
              if (key.includes(word) && (name.includes(key) || values.some(v => name.includes(v)))) {
                matchType = 'synonym'
                break
              }
            }
            if (matchType === 'synonym') break
          }
        }

        return {
          product,
          score,
          matchType,
          highlightedName: highlightText(product.name || '', query),
          reason: getMatchReason(product, matchType, score)
        } as SearchResult
      })
      .filter(({ score }) => score > 30) // Seuil minimum de pertinence
      .sort((a, b) => b.score - a.score) // Tri par pertinence décroissante

    // Mise à jour de l'état de recherche
    searchState.value.hasResults = scoredProducts.length > 0
    searchState.value.resultCount = scoredProducts.length

    console.log('🔍 Recherche fuzzy enrichie:', {
      query: normalizedQuery,
      resultCount: scoredProducts.length,
      topResults: scoredProducts.slice(0, 3).map(({ product, score, matchType, reason }) => ({
        name: product.name,
        score,
        matchType,
        reason
      }))
    })

    return scoredProducts
  }

  // Mode normal sans recherche - créer des SearchResult basiques
  const basicResults = products.map(product => ({
    product,
    score: 100,
    matchType: 'exact' as const,
    highlightedName: product.name || '',
    reason: 'Produit disponible'
  } as SearchResult))

  // 🏷️ Filtrage par catégorie
  if (selectedCategory.value) {
    const filteredResults = basicResults.filter(result =>
      result.product.category === selectedCategory.value
    )

    searchState.value.hasResults = filteredResults.length > 0
    searchState.value.resultCount = filteredResults.length
    return filteredResults
  }

  searchState.value.hasResults = basicResults.length > 0
  searchState.value.resultCount = basicResults.length

  console.log('📦 Produits sans recherche:', {
    total: basicResults.length,
    categorie: selectedCategory.value
  })

  return basicResults
})

// Clé réactive pour forcer la mise à jour du virtualizer
const virtualizerKey = computed(() =>
  `${searchResults.value.length}-${debouncedSearchQuery.value}-${selectedCategory.value}`
)

// Virtualizer pour la liste des produits
const virtualizer = computed(() => useVirtualizer({
  count: searchResults.value.length,
  getScrollElement: () => scrollElement.value || null,
  estimateSize: () => 88,
  overscan: 5
}))

// Computed pour compatibilité avec le code existant
const filteredProducts = computed(() => {
  return searchResults.value.map(result => result.product)
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
    const unitPrice = p.basePrice || p.price || 0
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
      total,
      image_url: p.image_url || undefined
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


const removeFromCart = (productId: string) => {
  cartItems.value = cartItems.value.filter(i => i.id !== productId)
  emit('cart-updated', cartItems.value)
}

// Nouvelle fonction pour ouvrir le bottom sheet
const openQuantitySheet = (product: Product) => {
  selectedProductForQuantity.value = product
  showQuantitySheet.value = true
}

// Gestionnaire de confirmation du bottom sheet
const handleQuantityConfirm = (data: { product: Product; quantity: number; total: number }) => {
  const existing = cartItems.value.find(i => i.id === data.product.id)

  if (existing) {
    existing.quantity = data.quantity
    existing.total = data.total
  } else {
    cartItems.value.push({
      id: data.product.id,
      name: data.product.name,
      quantity: data.quantity,
      unitPrice: data.product.basePrice || data.product.price || 0,
      total: data.total,
      image_url: data.product.image || data.product.image_url || undefined
    })
  }

  // Micro-interaction : feedback visuel pour l'ajout
  triggerAddedFeedback(data.product.id)

  emit('cart-updated', cartItems.value)
  showQuantitySheet.value = false
}

// Gestionnaire d'annulation du bottom sheet
const handleQuantityCancel = () => {
  showQuantitySheet.value = false
  selectedProductForQuantity.value = null
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

// Méthodes pour suggestions intelligentes
const getSpellingSuggestions = (): string[] => {
  if (!searchState.value.searchTerm || searchState.value.searchTerm.length < 2) return []

  const query = searchState.value.searchTerm.toLowerCase()
  const suggestions: string[] = []

  // Dictionnaire de termes courants avec leurs corrections
  const commonTerms = [
    'drapeau', 'affiche', 'affiches', 'kakémono', 'kakemono', 'oriflamme',
    'flyer', 'tract', 'depliant', 'prospectus', 'brochure',
    'tshirt', 't-shirt', 'tee-shirt', 'maillot', 'polo',
    'casquette', 'cap', 'chapeau', 'bonnet',
    'bache', 'banderole', 'panneau', 'enseigne',
    'stylo', 'crayon', 'marqueur', 'surligneur',
    'badge', 'pin', 'broche', 'autocollant', 'sticker'
  ]

  // Recherche de termes similaires par distance de Levenshtein
  for (const term of commonTerms) {
    const distance = levenshteinSimple(query, term)
    if (distance <= 2 && distance > 0 && term !== query) {
      suggestions.push(term)
    }
  }

  // Suggestions basées sur les produits existants
  if (props.products) {
    for (const product of props.products) {
      const name = product.name?.toLowerCase() || ''
      if (name.includes(query) && name !== query) {
        const words = name.split(' ')
        for (const word of words) {
          if (word.length > 2 && !suggestions.includes(word) && word !== query) {
            const distance = levenshteinSimple(query, word)
            if (distance <= 2 && distance > 0) {
              suggestions.push(word)
            }
          }
        }
      }
    }
  }

  return suggestions.slice(0, 3) // Max 3 suggestions
}

// Fonction helper pour distance Levenshtein simple
const levenshteinSimple = (str1: string, str2: string): number => {
  if (str1.length === 0) return str2.length
  if (str2.length === 0) return str1.length

  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[str2.length][str1.length]
}

const applySuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  console.log('💡 Suggestion appliquée:', suggestion)
}

const selectCategoryAndClearSearch = (category: string) => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  selectedCategory.value = category
  console.log('🏷️ Catégorie sélectionnée:', category)
}

const clearSearchAndFilters = () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  selectedCategory.value = ''
  console.log('🧹 Recherche et filtres effacés')
}

// Fonction pour obtenir l'URL optimisée Cloudinary (réutilisée depuis admin)
const getProductImageUrl = (product?: Product): string | null => {
  if (!product?.image_url) return null

  // Extraire le public_id depuis l'URL complète Cloudinary
  const match = product.image_url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
  if (!match) return product.image_url // Fallback sur l'URL originale

  const publicId = match[1]
  // Optimisation pour vignettes 64x64 avec fill et qualité 80
  return `https://res.cloudinary.com/dsrvzogof/image/upload/w_64,h_64,c_fill,q_80,f_auto/${publicId}`
}

// Fonction pour gérer les erreurs d'image
const handleImageError = (index: number) => {
  console.log('❌ Erreur chargement image pour:', searchResults.value[index]?.product?.name)
  // On pourrait mettre à jour l'état pour afficher le fallback
}

// Fonction pour obtenir l'icône de catégorie
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'TEXTILE': '👕',
    'ACCESSOIRE': '🎯',
    'IMPRESSION': '🖨️',
    'SIGNALÉTIQUE': '🪧',
    'GADGET': '🎁',
    'COMMUNICATION': '📣'
  }
  return icons[category?.toUpperCase()] || '📦'
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
  position: relative;
  overflow: visible;
}

.quantity-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(201, 154, 59, 0.3);
}

.quantity-button:active {
  transform: scale(0.95);
}

/* Affordance indicator animation */
.quantity-button .absolute {
  animation: pulse-dots 2s infinite;
  font-size: 6px;
  line-height: 1;
}

@keyframes pulse-dots {
  0%, 100% {
    opacity: 0.7;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.quantity-button:hover .absolute {
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
}

.quantity-button:focus {
  outline: 2px solid rgba(201, 154, 59, 0.5);
  outline-offset: 2px;
}

/* Haptic feedback simulation for mobile */
@media (hover: none) and (pointer: coarse) {
  .quantity-button:active {
    background-color: rgba(201, 154, 59, 0.9);
    transform: scale(0.95);
    transition: all 0.1s ease;
  }
}

/* Styles pour la quantité cliquable */
.quantity-display {
  transition: all 0.2s ease;
  cursor: pointer;
}

.quantity-display:hover {
  background-color: rgba(201, 154, 59, 0.1);
  border-color: rgba(201, 154, 59, 0.3);
  transform: translateY(-1px);
}

.quantity-display:active {
  transform: scale(0.95);
}

.quantity-display:focus {
  outline: 2px solid rgba(201, 154, 59, 0.5);
  outline-offset: 2px;
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

/* Styles pour quantity-display cliquable */
.quantity-display {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.quantity-display:hover {
  background-color: #f3f4f6 !important;
  border-color: #C99A3B !important;
  color: #C99A3B !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(201, 154, 59, 0.1);
}

.quantity-display:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(201, 154, 59, 0.1);
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