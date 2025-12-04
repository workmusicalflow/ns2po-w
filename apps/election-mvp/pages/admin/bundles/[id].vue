<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center space-x-4">
        <NuxtLink
          to="/admin/bundles"
          class="flex items-center text-gray-500 hover:text-gray-700"
        >
          <Icon name="heroicons:arrow-left" class="w-5 h-5 mr-1" />
          Retour
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isNew ? 'Nouveau Bundle' : 'Modifier le Bundle' }}
          </h1>
          <p class="text-gray-600">
            {{ isNew ? 'Créez un nouveau pack de campagne' : `Modification de ${form.name || 'ce bundle'}` }}
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form class="space-y-8" @submit.prevent="handleSubmit()">
      <!-- Basic Information -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-6">
          Informations générales
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Bundle Name -->
          <AdminFormField
            id="name"
            v-model="form.name"
            type="text"
            label="Nom du bundle"
            placeholder="Ex: Pack Campagne Municipale"
            :error="errors.name"
            required
          />

          <!-- Target Audience -->
          <AdminFormField
            id="targetAudience"
            v-model="form.targetAudience"
            type="select"
            label="Audience Cible"
            :options="audienceOptions"
            :error="errors.targetAudience"
            required
          />


          <!-- Popularity Score -->
          <AdminFormField
            id="popularity"
            v-model="form.popularity"
            type="number"
            label="Score de Popularité"
            placeholder="0-100"
            :error="errors.popularity"
            help-text="Score de 0 à 100 pour le classement"
          />

          <!-- Estimated Total -->
          <AdminFormField
            id="estimatedTotal"
            v-model="form.estimatedTotal"
            type="number"
            label="Prix Total Estimé (XOF)"
            placeholder="0"
            :error="errors.estimatedTotal"
            help-text="Prix total du bundle"
            required
          />

          <!-- Original Total -->
          <AdminFormField
            id="originalTotal"
            v-model="form.originalTotal"
            type="number"
            label="Prix Original (XOF)"
            placeholder="0"
            :error="errors.originalTotal"
            help-text="Prix avant remise (optionnel)"
          />
        </div>

        <!-- Description -->
        <div class="mt-6">
          <AdminFormField
            id="description"
            v-model="form.description"
            type="textarea"
            label="Description"
            placeholder="Décrivez ce pack de campagne..."
            :rows="4"
            :error="errors.description"
            required
          />
        </div>

        <!-- Toggles -->
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label class="flex items-center">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              >
              <span class="ml-2 text-sm text-gray-700">Bundle actif</span>
            </label>
          </div>
          <div>
            <label class="flex items-center">
              <input
                v-model="form.isFeatured"
                type="checkbox"
                class="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
              >
              <span class="ml-2 text-sm text-gray-700">Bundle vedette</span>
            </label>
          </div>
        </div>

        <!-- Tags -->
        <div class="mt-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tags (séparés par des virgules)
          </label>
          <input
            v-model="tagsInput"
            type="text"
            placeholder="municipale, affichage, flyers"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
          <p class="mt-1 text-xs text-gray-500">
            Utilisez des virgules pour séparer les tags
          </p>
        </div>
      </div>

      <!-- Product Selection -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-medium text-gray-900">
            Produits du Bundle
          </h2>
          <button
            type="button"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            @click="showProductSelector = true"
          >
            <Icon name="heroicons:plus" class="w-4 h-4 mr-1" />
            Ajouter Produit
          </button>
        </div>

        <!-- Products List -->
        <div v-if="selectedProducts.length > 0" class="space-y-4">
          <div
            v-for="(product, index) in selectedProducts"
            :key="product.id"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="w-12 h-12 rounded-lg object-cover"
              >
              <div
                v-else
                class="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center"
              >
                <Icon name="heroicons:cube" class="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-900">
                  {{ product.name }}
                </h3>
                <p class="text-sm" :class="product.basePrice && product.basePrice > 0 ? 'text-gray-500' : 'text-red-500'">
                  {{ product.basePrice && product.basePrice > 0 ? formatPrice(product.basePrice) : 'Prix non défini' }}
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <!-- Nouveau composant QuantityInput avec UX améliorée -->
              <QuantityInput
                v-model="product.quantity"
                :product-id="product.id"
                :product-name="product.name"
                :min="1"
                :max="50000"
                :step-small="10"
                :step-large="100"
                :presets="[100, 250, 500, 1000]"
                @update:model-value="(newQuantity) => updateProductTotal(index, newQuantity)"
                @error="handleQuantityError(index, $event)"
              />

              <!-- 💰 Input Prix Unitaire (Custom Price) - Permet de modifier le prix sans affecter le catalogue -->
              <div class="flex flex-col items-center gap-1">
                <label class="text-xs text-gray-500">Prix unitaire</label>
                <div class="relative">
                  <input
                    :value="getEffectivePrice(product)"
                    type="number"
                    min="0"
                    step="1"
                    class="w-24 px-2 py-1 text-sm text-right border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    :class="{
                      'border-amber-400 bg-amber-50': product.customPrice && product.customPrice !== product.basePrice,
                      'border-gray-300': !product.customPrice || product.customPrice === product.basePrice
                    }"
                    :title="product.customPrice && product.customPrice !== product.basePrice
                      ? `Prix custom (catalogue: ${formatPrice(product.basePrice)})`
                      : 'Prix catalogue'"
                    @change="updateProductPrice(index, Number(($event.target as HTMLInputElement).value))"
                  >
                  <!-- Indicateur prix modifié -->
                  <div
                    v-if="product.customPrice && product.customPrice !== product.basePrice"
                    class="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center"
                    title="Prix personnalisé actif"
                  >
                    <span class="text-white text-[8px] font-bold">✎</span>
                  </div>
                </div>
                <!-- Bouton reset vers prix catalogue -->
                <button
                  v-if="product.customPrice && product.customPrice !== product.basePrice"
                  type="button"
                  class="text-xs text-amber-600 hover:text-amber-800 underline"
                  :title="`Remettre au prix catalogue: ${formatPrice(product.basePrice)}`"
                  @click="resetToBasePrice(index)"
                >
                  ↩ Reset
                </button>
              </div>

              <!-- Price Lock Checkbox (Pareto 80/20) - Phase 3.3: Tooltip enrichi -->
              <div class="flex items-center gap-2 min-w-[140px]">
                <label class="flex items-center gap-2 cursor-pointer group relative">
                  <input
                    v-model="product.priceLocked"
                    type="checkbox"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  >
                  <span class="text-xs text-gray-600">
                    {{ product.priceLocked ? '🔒 Prix fixe' : '🔄 Auto-sync' }}
                  </span>

                  <!-- Tooltip enrichi (Phase 3.3) -->
                  <div class="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50">
                    <div class="font-semibold mb-2">{{ product.priceLocked ? '🔒 Prix Fixe' : '🔄 Auto-Sync' }}</div>
                    <div v-if="product.priceLocked" class="space-y-1">
                      <p>• Prix figé indépendamment du catalogue</p>
                      <p>• Idéal pour promotions/tarifs négociés</p>
                      <p>• ⚠️ Ne se met PAS à jour automatiquement</p>
                    </div>
                    <div v-else class="space-y-1">
                      <p>• Prix synchronisé avec le produit catalogue</p>
                      <p>• Mise à jour automatique si prix modifié</p>
                      <p>• ✅ Recommandé (80% des cas)</p>
                    </div>
                    <!-- Flèche du tooltip -->
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                </label>
              </div>

              <div class="flex flex-col items-end gap-1">
                <div class="text-sm font-medium text-gray-900">
                  {{ formatPrice(product.subtotal) }}
                </div>

                <!-- 🔔 Price Warning (Phase 3.2): Alerte si désynchronisation prix catalogue -->
                <div v-if="getPriceWarning(product)" class="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  <Icon name="heroicons:exclamation-triangle" class="w-3 h-3" />
                  <span :title="getPriceWarning(product)?.message">
                    Écart {{ getPriceWarning(product)?.percentage }}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="text-red-600 hover:text-red-700"
                title="Supprimer ce produit du bundle"
                @click="removeProduct(index)"
              >
                <Icon name="heroicons:trash" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          <Icon name="heroicons:cube" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun produit sélectionné</p>
          <p class="text-sm">
            Cliquez sur "Ajouter Produit" pour commencer
          </p>
        </div>

        <!-- Totalisateur amélioré avec feedback UX temps réel -->
        <div v-if="selectedProducts.length > 0" class="mt-6">
          <BundleTotalizer
            :total-quantity="bundleValidationState.quantity || 0"
            :total-price="calculatedTotal"
            :original-price="form.originalTotal"
            :minimum-quantity="1"
            :show-progress-bar="true"
          />
        </div>

        <!-- Message d'aide si aucun produit -->
        <div v-else class="mt-6">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center space-x-2">
              <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-500" />
              <span class="text-sm text-blue-700">
                Ajoutez des produits pour voir le totalisateur et valider votre bundle.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-200">
        <div class="flex items-center space-x-4">
          <NuxtLink
            to="/admin/bundles"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Annuler
          </NuxtLink>

          <!-- Bouton de synchronisation manuelle avec feedback UX avancé -->
          <button
            v-if="!isNew"
            type="button"
            :disabled="isSyncing"
            :class="[
              'inline-flex items-center px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200',
              isSyncing
                ? 'text-amber-700 bg-amber-50 border border-amber-200 cursor-not-allowed'
                : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 focus:ring-green-500'
            ]"
            @click="manualSync"
          >
            <Icon
              name="heroicons:arrow-path"
              :class="['w-4 h-4 mr-2', isSyncing ? 'animate-spin' : '']"
            />
            {{ isSyncing ? 'Synchronisation...' : 'Synchroniser' }}
          </button>

          <button
            v-if="!isNew"
            type="button"
            class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            @click="duplicateBundle"
          >
            Dupliquer
          </button>
        </div>

        <div class="flex items-center space-x-4">
          <button
            v-if="!isNew"
            type="button"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            @click="deleteBundle"
          >
            Supprimer
          </button>

          <button
            type="submit"
            :disabled="isSubmitting || !bundleValidationState.canSave"
            :title="!bundleValidationState.canSave ? bundleValidationState.blockers.join(', ') : ''"
            class="px-6 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon v-if="isSubmitting" name="heroicons:arrow-path" class="w-4 h-4 mr-2 animate-spin" />
            {{ !bundleValidationState.canSave ? 'Corriger pour sauvegarder' : (isNew ? 'Créer le bundle' : 'Sauvegarder') }}
          </button>
        </div>
      </div>
    </form>

    <!-- Product Selector Modal -->
    <AdminModal
      :show="showProductSelector"
      title="Sélectionner des Produits"
      size="xl"
      @close="showProductSelector = false"
    >
      <div class="space-y-4">
        <!-- Diagnostic Counter with Tooltip -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">
              {{ filteredAvailableProducts.length }} produits disponibles sur {{ productSelectorValidation.validationStats.value.total }} totaux
            </span>
            <HeadlessMenu as="div" class="relative inline-block">
              <HeadlessMenuButton class="flex items-center">
                <Icon name="heroicons:information-circle" class="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </HeadlessMenuButton>
              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <HeadlessMenuItems
                  class="absolute z-10 mt-2 w-64 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-3"
                >
                  <div class="text-xs space-y-1">
                    <p v-if="productSelectorValidation.validationStats.value.alreadySelected > 0" class="flex items-center gap-2">
                      <span class="w-2 h-2 bg-blue-500 rounded-full" />
                      {{ productSelectorValidation.validationStats.value.alreadySelected }} déjà dans le bundle
                    </p>
                    <p v-if="productSelectorValidation.validationStats.value.inactive > 0" class="flex items-center gap-2">
                      <span class="w-2 h-2 bg-gray-500 rounded-full" />
                      {{ productSelectorValidation.validationStats.value.inactive }} produits inactifs
                    </p>
                    <p v-if="productSelectorValidation.validationStats.value.invalidPrice > 0" class="flex items-center gap-2">
                      <span class="w-2 h-2 bg-red-500 rounded-full" />
                      {{ productSelectorValidation.validationStats.value.invalidPrice }} sans prix valide
                    </p>
                  </div>
                </HeadlessMenuItems>
              </transition>
            </HeadlessMenu>
          </div>

          <!-- Toggle to show/hide excluded products -->
          <div class="flex items-center gap-2">
            <input
              id="show-excluded"
              v-model="showExcludedProducts"
              type="checkbox"
              class="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            >
            <label for="show-excluded" class="text-sm text-gray-700 cursor-pointer">
              Afficher les produits non disponibles
            </label>
          </div>
        </div>

        <!-- Feedback Message for Filtered Products -->
        <div
          v-if="productSelectorValidation.validationStats.value.filtered > 0 && !showExcludedProducts"
          class="bg-amber-50 border-l-4 border-amber-400 p-3 rounded"
        >
          <div class="flex">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div class="ml-3 text-sm">
              <p class="font-medium text-amber-800">
                {{ productSelectorValidation.validationStats.value.filtered }} produits masqués
              </p>
              <p class="text-amber-700 mt-1">
                Certains produits ne sont pas disponibles car ils sont déjà dans le bundle, inactifs ou sans prix défini.
              </p>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="relative">
          <input
            v-model="productSearch"
            type="text"
            placeholder="Rechercher des produits..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
          <Icon name="heroicons:magnifying-glass" class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          <!-- Available products -->
          <template v-if="!showExcludedProducts">
            <div
              v-for="product in filteredAvailableProducts"
              :key="product.id"
              :class="[
                'border border-gray-200 rounded-lg p-4',
                product.basePrice && product.basePrice > 0
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : 'bg-gray-50 cursor-not-allowed opacity-60'
              ]"
              @click="product.basePrice && product.basePrice > 0 ? addProduct(product) : null"
            >
              <div class="flex items-center space-x-3">
                <img
                  v-if="product.image_url || (product as any).image"
                  :src="product.image_url || (product as any).image || ''"
                  :alt="product.name"
                  class="w-10 h-10 rounded object-cover"
                >
                <div
                  v-else
                  class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center"
                >
                  <Icon name="heroicons:cube" class="w-5 h-5 text-gray-400" />
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900">
                    {{ product.name }}
                  </h3>
                  <p class="text-sm" :class="product.basePrice && product.basePrice > 0 ? 'text-gray-500' : 'text-red-500'">
                    {{ product.basePrice && product.basePrice > 0 ? formatPrice(product.basePrice) : 'Prix non défini' }}
                  </p>
                </div>
                <button
                  class="text-amber-600 hover:text-amber-700"
                >
                  <Icon name="heroicons:plus" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </template>

          <!-- All products including excluded ones -->
          <template v-else>
            <div
              v-for="product in getDisplayProducts()"
              :key="product.id"
              :class="[
                'border rounded-lg p-4 relative',
                getProductStatus(product).canAdd
                  ? 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                  : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              ]"
              @click="getProductStatus(product).canAdd ? addProduct(product) : null"
            >
              <!-- Status Badge -->
              <div v-if="!getProductStatus(product).canAdd" class="absolute top-2 right-2">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-1 text-xs font-medium rounded',
                    getProductStatus(product).reason === 'Déjà dans le bundle'
                      ? 'bg-blue-100 text-blue-800'
                      : getProductStatus(product).reason === 'Produit inactif'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ getProductStatus(product).reason }}
                </span>
              </div>

              <div class="flex items-center space-x-3">
                <img
                  v-if="product.image_url || (product as any).image"
                  :src="product.image_url || (product as any).image || ''"
                  :alt="product.name"
                  class="w-10 h-10 rounded object-cover"
                >
                <div
                  v-else
                  class="w-10 h-10 rounded bg-gray-200 flex items-center justify-center"
                >
                  <Icon name="heroicons:cube" class="w-5 h-5 text-gray-400" />
                </div>
                <div class="flex-1">
                  <h3 class="text-sm font-medium text-gray-900">
                    {{ product.name }}
                  </h3>
                  <p class="text-sm" :class="product.basePrice && product.basePrice > 0 || product.price > 0 ? 'text-gray-500' : 'text-red-500'">
                    {{ product.basePrice && product.basePrice > 0 ? formatPrice(product.basePrice) : product.price && product.price > 0 ? formatPrice(product.price) : 'Prix non défini' }}
                  </p>
                </div>
                <button
                  v-if="getProductStatus(product).canAdd"
                  class="text-amber-600 hover:text-amber-700"
                >
                  <Icon name="heroicons:plus" class="w-5 h-5" />
                </button>
                <div v-else class="w-5 h-5" />
              </div>
            </div>
          </template>
        </div>

        <div v-if="filteredAvailableProducts.length === 0" class="text-center py-8 text-gray-500">
          <Icon name="heroicons:cube" class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Aucun produit trouvé</p>
        </div>
      </div>
    </AdminModal>

    <!-- Validation Consequences Modal - CORE 20% FIX -->
    <ValidationConsequencesModal
      :show="showValidationModal"
      :product-name="validationModalData.productName"
      :violations="validationModalData.violations"
      :before-state="validationModalData.beforeState"
      :after-state="validationModalData.afterState"
      @close="showValidationModal = false"
      @cancel="handleValidationModalCancel"
      @confirm="handleValidationModalConfirm"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Admin Bundle Edit/Create Page - SOLID Architecture
 * Uses VueQuery + Pinia for optimal state management and caching
 * Synchronized with Product store for cross-interface consistency
 */

// Vue 3 imports
import { toRaw } from 'vue'

// SOLID Architecture imports
import { useBundleQuery, useCreateBundleMutation, useUpdateBundleMutation, useDeleteBundleMutation, bundleQueryKeys } from '../../../composables/useBundlesQuery'
import { useQueryClient } from '@tanstack/vue-query'
import { bundleService } from '../../../services/BundleService'
import { useProductsQuery } from '../../../composables/useProductsQuery'
import { useBundleCalculations } from '../../../composables/useBundleCalculations'
import { useProductReferenceValidation, useBundleProductsValidation, useProductSelectorValidation } from '../../../composables/useProductReferenceValidation'
import { globalNotifications } from '../../../composables/useNotifications'
import { refDebounced } from '@vueuse/core'
import type { Bundle, BundleProduct, BundleAggregate, BundleTargetAudience } from '../../../types/domain/Bundle'
import type { Product } from '../../../types/domain/Product'
import { validateBundleBusinessRules } from '../../../schemas/bundle'
import ValidationConsequencesModal from '../../../components/admin/ValidationConsequencesModal.vue'
import QuantityInput from '../../../components/admin/QuantityInput.vue'
import BundleTotalizer from '../../../components/admin/BundleTotalizer.vue'
import { Menu as HeadlessMenu, MenuButton as HeadlessMenuButton, MenuItems as HeadlessMenuItems } from '@headlessui/vue'

// Layout admin
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

// Route params
const route = useRoute()
const router = useRouter()
const bundleId = computed(() => route.params.id as string)
const isNew = computed(() => bundleId.value === 'new')

// Head
useHead({
  title: computed(() => isNew.value ? 'Nouveau Bundle | Admin' : 'Modifier Bundle | Admin')
})

// Initialize global event bus and notifications ONLY on client
let crudSuccess: typeof globalNotifications.crudSuccess | undefined
let crudError: typeof globalNotifications.crudError | undefined
let info: typeof globalNotifications.info | undefined
let warning: typeof globalNotifications.warning | undefined

// Client-only initialization
if (import.meta.client) {
  const notifications = globalNotifications
  crudSuccess = notifications.crudSuccess
  crudError = notifications.crudError
  info = notifications.info
  warning = notifications.warning
}

// ===== REACTIVE STATE =====
const showProductSelector = ref(false)
const showExcludedProducts = ref(false)
const productSearch = ref('')
const tagsInput = ref('')
const isSyncing = ref(false) // État pour la synchronisation manuelle
const debouncedProductSearch = refDebounced(productSearch, 300)

// Modal de conséquences de validation - CORE 20% FIX
const showValidationModal = ref(false)
const validationModalData = ref<{
  productName: string
  violations: Array<{ type: string; label: string; message: string }>
  beforeState: { total: number; quantity: number }
  afterState: { total: number; quantity: number }
  productIndex: number
}>({
  productName: '',
  violations: [],
  beforeState: { total: 0, quantity: 0 },
  afterState: { total: 0, quantity: 0 },
  productIndex: -1
})

// Form data
const form = reactive({
  name: '',
  description: '',
  targetAudience: 'local',
  estimatedTotal: 0,
  originalTotal: 0,
  popularity: 5,
  isActive: true,
  isFeatured: false
})

// Form errors
const errors = reactive<Record<string, string>>({
  name: '',
  description: '',
  targetAudience: '',
  estimatedTotal: '',
  originalTotal: '',
  popularity: ''
})

// Bundle calculations composable - centralized logic
const selectedProducts = ref<BundleProduct[]>([])
const bundleCalculations = useBundleCalculations(selectedProducts)

// 🔔 Système de notifications dédupliquées (fix duplications)
const lastNotification = ref<{ type: string; productId: string; timestamp: number } | null>(null)
const NOTIFICATION_DEBOUNCE_MS = 500

// 🛡️ Garde pour éviter re-initialisation multiple (fix cascades reactives)
const isFormInitialized = ref(false)

function emitDebouncedNotification(type: 'price' | 'quantity' | 'sync', productId: string, title: string, message: string) {
  const now = Date.now()
  const last = lastNotification.value

  // Skip si même type + même produit + moins de 500ms
  if (last && last.type === type && last.productId === productId && (now - last.timestamp) < NOTIFICATION_DEBOUNCE_MS) {
    return
  }

  lastNotification.value = { type, productId, timestamp: now }
  info?.(title, message)
}

// Options
const audienceOptions = [
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Régional' },
  { value: 'national', label: 'National' },
  { value: 'universal', label: 'Universel' }
]


// ===== VUE QUERY INTEGRATION =====
// Bundle query (for editing existing bundles)
const {
  data: bundleData,
  isLoading: bundleLoading,
  refetch: refetchBundle
} = useBundleQuery(bundleId, true)

// Products query for selection
const {
  data: availableProducts,
  isLoading: productsLoading
} = useProductsQuery()

// 🔒 PRODUCT REFERENCE VALIDATION
// Bundle products validation for referential integrity
const bundleValidation = useBundleProductsValidation(bundleId, selectedProducts)

// Product selector validation for safe additions
const productSelectorValidation = useProductSelectorValidation(
  computed(() => availableProducts.value || []),
  selectedProducts
)

// Bundle mutations
const createBundleMutation = useCreateBundleMutation({
  onSuccess: (bundle) => {
    crudSuccess?.created(bundle.name, 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError?.created('bundle', error.message)
  }
})

// Initialize queryClient in setup context
const queryClient = useQueryClient()

const updateBundleMutation = useUpdateBundleMutation({
  onSuccess: async (bundle) => {
    crudSuccess?.updated(bundle.name, 'bundle')

    // Pre-load bundles list before navigation for instant UX (recommended by Gemini Copilot)
    await queryClient.prefetchQuery({
      queryKey: bundleQueryKeys.list(),
      queryFn: () => bundleService.getBundles()
    })

    await router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError?.updated('bundle', error.message)
  }
})

const deleteBundleMutation = useDeleteBundleMutation({
  onSuccess: () => {
    crudSuccess?.deleted('Bundle', 'bundle')
    router.push('/admin/bundles')
  },
  onError: (error) => {
    crudError?.deleted('bundle', error.message)
  }
})

// ===== COMPUTED PROPERTIES =====
// Use centralized calculations from composable
const calculatedTotal = bundleCalculations.estimatedTotal

const filteredAvailableProducts = computed(() => {
  // 🔒 Use validated products only - ensures referential integrity
  const validProducts = productSelectorValidation.validProducts.value

  if (!validProducts || validProducts.length === 0) return []

  let products = [...validProducts]

  // Apply search filter
  if (debouncedProductSearch.value) {
    const search = debouncedProductSearch.value.toLowerCase()
    products = products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      product.reference?.toLowerCase().includes(search)
    )
  }

  return products
})

// Helper function to get all products for display when showing excluded ones
const getDisplayProducts = (): Product[] => {
  let products = availableProducts.value || []

  // Apply search filter
  if (debouncedProductSearch.value) {
    const search = debouncedProductSearch.value.toLowerCase()
    products = products.filter(product =>
      product.name.toLowerCase().includes(search) ||
      product.reference?.toLowerCase().includes(search)
    )
  }

  return products
}

// Helper function to get product status
const getProductStatus = (product: Product): { canAdd: boolean; reason?: string } => {
  if (!product.isActive) {
    return { canAdd: false, reason: 'Produit inactif' }
  }

  const productPrice = product.price || product.basePrice || 0
  if (productPrice <= 0) {
    return { canAdd: false, reason: 'Prix non défini' }
  }

  const alreadySelected = selectedProducts.value.some(sp => sp.productId === product.id)
  if (alreadySelected) {
    return { canAdd: false, reason: 'Déjà dans le bundle' }
  }

  return { canAdd: true }
}

const isSubmitting = computed(() =>
  createBundleMutation.isPending.value || updateBundleMutation.isPending.value
)

// CORE 20% FIX - Computed property pour l'état de validation temps réel
const bundleValidationState = computed(() => {
  // Pas de validation si bundle en création
  if (isNew.value) {
    return {
      isValid: true,
      blockers: [],
      canSave: true,
      warnings: []
    }
  }

  // Validation uniquement des produits sélectionnés
  if (!selectedProducts.value || selectedProducts.value.length === 0) {
    return {
      isValid: false,
      blockers: ['Bundle vide - aucun produit sélectionné'],
      canSave: false,
      warnings: []
    }
  }

  // Calculer les totaux actuels
  const total = selectedProducts.value.reduce((sum, p) => sum + (p.basePrice || 0) * p.quantity, 0)
  const quantity = selectedProducts.value.reduce((sum, p) => sum + (p.quantity || 1), 0)

  // Préparer l'état du bundle pour validation
  const bundleState = {
    name: form.name,
    targetAudience: form.targetAudience,
    estimatedTotal: total,
    products: selectedProducts.value,
    popularity: form.popularity,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    originalTotal: form.originalTotal,
    savings: form.originalTotal > total ? form.originalTotal - total : 0
  }

  // Utiliser la fonction de validation des règles business
  const validationErrors = validateBundleBusinessRules(bundleState)

  return {
    isValid: validationErrors.length === 0,
    blockers: validationErrors,
    canSave: validationErrors.length === 0,
    warnings: [],
    total,
    quantity
  }
})

// Removed unused computed properties for cleaner code

// ===== METHODS =====
function initializeFormFromBundle(bundle: Bundle | BundleAggregate) {
  // Copy form fields directly
  Object.assign(form, {
    name: bundle.name,
    description: bundle.description,
    targetAudience: bundle.targetAudience,
    estimatedTotal: bundle.estimatedTotal,
    originalTotal: bundle.originalTotal,
    popularity: bundle.popularity,
    isActive: bundle.isActive,
    isFeatured: bundle.isFeatured
  })

  // Use centralized bundle calculations for products (only if BundleAggregate)
  if ('products' in bundle && bundle.products && bundle.products.length > 0) {
    // 🔧 FIX TEST 3.2: Transform TanStack Query products into reactive objects
    // TanStack Query returns data in shallowRef, so nested objects aren't reactive
    // We need to make each product reactive BEFORE passing to bundleCalculations
    const reactiveProducts = bundle.products.map(p => reactive({ ...p }))
    bundleCalculations.updateProducts(reactiveProducts)
  }

  // Set tags
  tagsInput.value = bundle.tags?.join(', ') || ''
}

// 🔄 SYNCHRONISATION MANUELLE - Fonction avec feedback UX avancé
async function manualSync() {
  if (isSyncing.value) return // Éviter double-clic

  isSyncing.value = true
  const startTime = Date.now()

  try {
    console.log('🔄 Synchronisation manuelle initiée...')

    // Étape 1: Vérifier si on a des produits à synchroniser
    if (!selectedProducts.value || selectedProducts.value.length === 0) {
      if (info) {
        info('Aucun produit à synchroniser', 'Ce bundle ne contient pas de produits')
      }
      return
    }

    const productCount = selectedProducts.value.length
    console.log(`📦 Synchronisation de ${productCount} produits...`)

    // Étape 2: Afficher notification de début
    if (info) {
      info('Synchronisation en cours...', `Mise à jour de ${productCount} produit(s)`)
    }

    // Étape 3: Synchroniser chaque produit avec gestion d'erreur individuelle
    const syncResults = await Promise.allSettled(
      selectedProducts.value.map(async (bundleProduct, index) => {
        try {
          console.log(`🔍 Sync produit ${index + 1}/${productCount}: ${bundleProduct.name}`)

          // Récupérer les données fraîches du produit
          const latestProduct = await $fetch(`/api/products/${bundleProduct.id}`)

          if (latestProduct) {
            // Détecter les changements significatifs
            const priceChanged = (latestProduct.base_price || latestProduct.price) !== bundleProduct.basePrice
            const nameChanged = latestProduct.name !== bundleProduct.name
            const imageChanged = latestProduct.image_url !== bundleProduct.image_url

            // 🖼️ SYNCHRONISATION CLOUDINARY AVANCÉE - Enrichir avec métadonnées
            let enrichedImages = latestProduct.images || bundleProduct.images || []
            let cloudinarySync = false

            // Si le produit a des images, synchroniser avec Cloudinary
            if (latestProduct.images && latestProduct.images.length > 0) {
              try {
                // Utiliser le composable de métadonnées Cloudinary
                const { fetchImageMetadata, getContextualTransformations } = useCloudinaryMetadata()

                // Enrichir chaque image avec ses métadonnées Cloudinary
                const enrichedImagePromises = latestProduct.images.map(async (imagePublicId: string) => {
                  try {
                    const imageInfo = await fetchImageMetadata(imagePublicId)
                    if (imageInfo) {
                      return {
                        publicId: imagePublicId,
                        url: getContextualTransformations(imagePublicId, 'product_card'),
                        metadata: imageInfo.metadata,
                        width: imageInfo.width,
                        height: imageInfo.height,
                        format: imageInfo.format
                      }
                    }
                    return { publicId: imagePublicId, url: null }
                  } catch (error) {
                    console.warn(`⚠️ Cloudinary metadata sync failed for ${imagePublicId}:`, error)
                    return { publicId: imagePublicId, url: null }
                  }
                })

                enrichedImages = await Promise.all(enrichedImagePromises)
                cloudinarySync = true
                console.log(`🎨 Métadonnées Cloudinary synchronisées pour "${latestProduct.name}"`)
              } catch (error) {
                console.warn(`⚠️ Cloudinary sync partielle pour "${latestProduct.name}":`, error)
              }
            }

            // Mettre à jour le produit avec synchronisation Cloudinary
            const catalogPrice = latestProduct.base_price || latestProduct.price || bundleProduct.basePrice
            // 💰 Prix effectif: customPrice si priceLocked, sinon prix catalogue
            const effectivePrice = (bundleProduct.priceLocked && bundleProduct.customPrice)
              ? bundleProduct.customPrice
              : catalogPrice
            // 🔧 FIX: Utiliser reactive() pour que v-model fonctionne correctement
            const updatedBundleProduct = reactive({
              ...bundleProduct,
              name: latestProduct.name || bundleProduct.name,
              basePrice: catalogPrice,
              image_url: latestProduct.image_url || bundleProduct.image_url,
              images: enrichedImages,
              subtotal: bundleProduct.quantity * effectivePrice,
              // Ajouter métadonnées de synchronisation
              lastSynced: new Date().toISOString(),
              cloudinarySync,
              // Price Lock: préserve le flag lors de la sync manuelle
              priceLocked: bundleProduct.priceLocked ?? false,
              // 💰 Préserver customPrice lors de la sync
              customPrice: bundleProduct.customPrice,
              // Price Warning: stocke le prix catalogue pour calcul d'écart (Phase 3.2)
              catalogPrice: catalogPrice
            })

            // Log des changements détectés
            const changes = []
            if (priceChanged) changes.push(`prix: ${bundleProduct.basePrice}€ → ${updatedBundleProduct.basePrice}€`)
            if (nameChanged) changes.push(`nom: "${bundleProduct.name}" → "${updatedBundleProduct.name}"`)
            if (imageChanged) changes.push('image mise à jour')
            if (cloudinarySync) changes.push('métadonnées Cloudinary synchronisées')

            if (changes.length > 0) {
              console.log(`✨ Changements détectés pour "${latestProduct.name}": ${changes.join(', ')}`)
            }

            return { success: true, product: updatedBundleProduct, changes, cloudinarySync }
          }

          return { success: true, product: bundleProduct, changes: [] }
        } catch (error) {
          console.error(`❌ Erreur sync produit ${bundleProduct.id}:`, error)
          return { success: false, product: bundleProduct, error }
        }
      })
    )

    // Étape 4: Traiter les résultats et mettre à jour l'interface
    const successful = syncResults.filter(result => result.status === 'fulfilled' && result.value.success)
    const failed = syncResults.filter(result => result.status === 'rejected' || !result.value.success)

    // Mettre à jour les produits sélectionnés
    selectedProducts.value = syncResults.map(result => {
      if (result.status === 'fulfilled') {
        return result.value.product
      }
      return selectedProducts.value.find(p => p.id === result.value?.product?.id) || result.value?.product
    }).filter(Boolean)

    // Calculer les statistiques de synchronisation
    const duration = Date.now() - startTime
    const changesDetected = successful.reduce((count, result) =>
      count + (result.value.changes?.length || 0), 0
    )
    const cloudinarySynced = successful.reduce((count, result) =>
      count + (result.value.cloudinarySync ? 1 : 0), 0
    )

    console.log(`✅ Synchronisation terminée: ${successful.length}/${productCount} réussies en ${duration}ms`)

    // Étape 5: Afficher les résultats avec notifications appropriées
    if (failed.length === 0) {
      // Succès complet
      if (crudSuccess) {
        const details = []
        if (changesDetected > 0) details.push(`${changesDetected} changement(s) détecté(s)`)
        if (cloudinarySynced > 0) details.push(`${cloudinarySynced} produit(s) avec métadonnées Cloudinary`)

        crudSuccess.updated(
          `Bundle synchronisé avec succès`,
          `${successful.length} produit(s) synchronisé(s)${details.length > 0 ? ` - ${details.join(', ')}` : ''}`
        )
      }
    } else {
      // Succès partiel
      if (warning) {
        warning(
          'Synchronisation partielle',
          `${successful.length}/${productCount} produits synchronisés. ${failed.length} erreur(s).${cloudinarySynced > 0 ? ` ${cloudinarySynced} avec Cloudinary.` : ''}`
        )
      }
    }

  } catch (error) {
    console.error('❌ Erreur globale de synchronisation:', error)
    if (crudError) {
      crudError.validation('Erreur de synchronisation', 'Impossible de synchroniser le bundle. Veuillez réessayer.')
    }
  } finally {
    // Délai minimum pour UX (éviter le flash)
    const minDelay = 800
    const elapsed = Date.now() - startTime
    if (elapsed < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - elapsed))
    }

    isSyncing.value = false
  }
}

function addProduct(product: Product) {
  // 🔒 STRICT VALIDATION - Check if product can be safely added
  const canAdd = productSelectorValidation.canAddProduct(product)

  if (!canAdd.canAdd) {
    crudError?.validation(`Impossible d'ajouter le produit: ${canAdd.reason}`)
    return
  }

  // Additional validation: ensure product exists in /admin/products interface
  if (!product.isActive) {
    crudError?.validation(`Le produit "${product.name}" n'est pas actif et ne peut être ajouté au bundle`)
    return
  }

  if (!product.price || product.price <= 0) {
    crudError?.validation(`Le produit "${product.name}" n'a pas de prix valide`)
    return
  }

  // Use centralized bundle calculations
  bundleCalculations.addProduct({
    productId: product.id,
    name: product.name,
    basePrice: product.price || 0,
    quantity: 1,
    subtotal: (product.price || 0) * 1,
    productReference: product.reference,
    categoryId: product.category_id,
    image_url: product.image_url
  })

  // Close product selector modal
  showProductSelector.value = false

  // Show success notification
  crudSuccess?.created(product.name, 'produit ajouté au bundle')
}

function removeProduct(index: number) {
  const product = selectedProducts.value[index]
  const productName = product.name

  // CORE 20% FIX - Validation préventive avant suppression
  // Calculer l'impact de la suppression AVANT de l'effectuer
  const productsAfterRemoval = selectedProducts.value.filter((_, i) => i !== index)

  // Calculer les totaux après suppression
  const newTotal = productsAfterRemoval.reduce((sum, p) => sum + (p.basePrice || 0) * p.quantity, 0)
  const newQuantity = productsAfterRemoval.reduce((sum, p) => sum + (p.quantity || 1), 0)

  // Préparer l'état du bundle après suppression pour validation
  const bundleStateAfterRemoval = {
    name: form.name,
    targetAudience: form.targetAudience,
    estimatedTotal: newTotal,
    products: productsAfterRemoval,
    popularity: form.popularity,
    isActive: form.isActive,
    isFeatured: form.isFeatured
  }

  // Valider l'état futur avec les règles business
  const validationErrors = validateBundleBusinessRules(bundleStateAfterRemoval)

  // Si la suppression créerait des violations, afficher modal de conséquences
  if (validationErrors.length > 0) {
    // Construire la liste des violations pour la modal
    const violations = []

    if (newQuantity < 1) {
      violations.push({
        type: 'quantity',
        label: 'Quantité insuffisante',
        message: `Le bundle doit contenir au moins 1 article`
      })
    }

    // Calculer l'état actuel
    const currentTotal = selectedProducts.value.reduce((sum, p) => sum + (p.basePrice || 0) * p.quantity, 0)
    const currentQuantity = selectedProducts.value.reduce((sum, p) => sum + (p.quantity || 1), 0)

    // Préparer les données de la modal
    validationModalData.value = {
      productName,
      violations,
      beforeState: { total: currentTotal, quantity: currentQuantity },
      afterState: { total: newTotal, quantity: newQuantity },
      productIndex: index
    }

    // Afficher la modal sophistiquée
    showValidationModal.value = true
    return

  } else {
    // Suppression sûre - aucune violation
    bundleCalculations.removeProduct(product.id)

    // Show success notification car suppression valide
    crudSuccess?.deleted(productName, 'produit retiré du bundle')
  }
}

// Gestionnaire d'erreur de quantité pour QuantityInput
function handleQuantityError(index: number, hasError: boolean) {
  // Marquer les erreurs de quantité individuelles si nécessaire
  const product = selectedProducts.value[index]
  if (product && hasError) {
    console.warn(`Erreur de quantité pour le produit ${product.name}`)
  }
}

// Fonctions de gestion de la modal de validation - CORE 20% FIX
function handleValidationModalCancel() {
  showValidationModal.value = false
  const productName = validationModalData.value.productName
  warning?.('Suppression annulée', `Le produit "${productName}" n'a pas été supprimé pour maintenir la validité du bundle`)
}

function handleValidationModalConfirm(forceDelete: boolean) {
  showValidationModal.value = false

  if (forceDelete) {
    const { productIndex, productName } = validationModalData.value
    const product = selectedProducts.value[productIndex]

    // Procéder avec la suppression malgré les violations
    bundleCalculations.removeProduct(product.id)

    // Notification WARNING au lieu de SUCCESS
    warning?.(`${productName} supprimé avec violations`, `Bundle non-publiable: corrections requises`)

    // Afficher info sur les violations actuelles après un délai
    setTimeout(() => {
      info?.('Action requise', 'Corrigez les violations pour pouvoir sauvegarder le bundle')
    }, 1500)
  }
}

// 💰 Obtenir le prix effectif d'un produit (customPrice ou basePrice)
function getEffectivePrice(product: BundleProduct): number {
  return product.customPrice ?? product.basePrice ?? 0
}

// 💰 Mettre à jour le prix unitaire d'un produit dans le bundle
function updateProductPrice(index: number, newPrice: number) {
  const product = selectedProducts.value[index]
  const validPrice = newPrice > 0 ? Math.round(newPrice) : product.basePrice

  // Déterminer si le prix est custom (différent du basePrice)
  const isCustomPrice = validPrice !== product.basePrice

  // Mettre à jour le produit avec le nouveau prix
  selectedProducts.value[index] = {
    ...product,
    customPrice: isCustomPrice ? validPrice : undefined,
    priceLocked: isCustomPrice ? true : product.priceLocked, // Auto-lock si prix custom
    subtotal: validPrice * product.quantity
  }

  // Recalculer les totaux
  recalculateBundleTotals()

  // Notification dédupliquée (fix duplications)
  if (isCustomPrice) {
    emitDebouncedNotification('price', product.id, 'Prix personnalisé',
      `${product.name} - Prix: ${formatPrice(validPrice)} (catalogue: ${formatPrice(product.basePrice)})`)
  } else {
    emitDebouncedNotification('price', product.id, 'Prix catalogue',
      `${product.name} - Prix remis au catalogue: ${formatPrice(validPrice)}`)
  }
}

// 💰 Remettre le prix au prix catalogue (basePrice)
function resetToBasePrice(index: number) {
  const product = selectedProducts.value[index]

  selectedProducts.value[index] = {
    ...product,
    customPrice: undefined,
    priceLocked: false, // Réactiver auto-sync
    subtotal: product.basePrice * product.quantity
  }

  // Recalculer les totaux
  recalculateBundleTotals()

  // Notification dédupliquée (fix duplications)
  emitDebouncedNotification('price', product.id, 'Prix réinitialisé',
    `${product.name} - Prix remis au catalogue: ${formatPrice(product.basePrice)}`)
}

// 🔄 Recalculer les totaux du bundle après modification prix/quantité
function recalculateBundleTotals() {
  // Calculer originalTotal depuis les prix catalogue (basePrice)
  const newOriginalTotal = selectedProducts.value.reduce((sum, p) => sum + (p.basePrice || 0) * p.quantity, 0)
  form.originalTotal = newOriginalTotal

  // Le estimatedTotal sera calculé automatiquement par le composable bundleCalculations
}

function updateProductTotal(index: number, newQuantity?: number) {
  const product = selectedProducts.value[index]
  // Use the new quantity passed from the event, or fallback to product.quantity
  const validQuantity = newQuantity !== undefined ? newQuantity : (product.quantity && !isNaN(product.quantity) ? product.quantity : 1)

  // 💰 Utiliser le prix effectif (customPrice ou basePrice)
  const effectivePrice = getEffectivePrice(product)

  // Update the product quantity in the local state if a new value was provided
  if (newQuantity !== undefined) {
    // Update the reactive object with the new quantity
    selectedProducts.value[index] = {
      ...product,
      quantity: validQuantity,
      subtotal: effectivePrice * validQuantity
    }
  }

  // Use centralized bundle calculations
  bundleCalculations.updateProductQuantity(product.id, validQuantity)

  // 🎯 SOLUTION HYBRIDE - Synchronize originalTotal with current product state
  // Calculate originalTotal from current product configuration to maintain validation consistency
  const newOriginalTotal = selectedProducts.value.reduce((sum, p) => sum + (p.basePrice || 0) * p.quantity, 0)

  // Update form originalTotal to reflect current product state
  // This ensures originalTotal >= estimatedTotal validation consistency
  form.originalTotal = newOriginalTotal

  // Notification dédupliquée (fix duplications) - utilise la vraie quantité mise à jour
  emitDebouncedNotification('quantity', product.id, 'Quantité mise à jour',
    `${product.name} - Quantité: ${validQuantity}`)
}

// Removed: updateCalculatedTotal() - now handled reactively by bundleCalculations composable

function clearErrors() {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
}

function validateForm(): boolean {
  clearErrors()
  let isValid = true

  // 🐛 DEBUG: Log form state before validation
  console.log('🔍 [DEBUG validateForm] Début validation:', {
    name: form.name,
    description: form.description?.substring(0, 50),
    targetAudience: form.targetAudience,
    estimatedTotal: form.estimatedTotal,
    popularity: form.popularity
  })

  if (!form.name.trim()) {
    errors.name = 'Le nom est requis'
    isValid = false
    console.log('❌ [DEBUG validateForm] Échec: name vide')
  }

  if (!form.description.trim()) {
    errors.description = 'La description est requise'
    isValid = false
    console.log('❌ [DEBUG validateForm] Échec: description vide')
  }

  if (!form.targetAudience) {
    errors.targetAudience = 'L\'audience cible est requise'
    isValid = false
    console.log('❌ [DEBUG validateForm] Échec: targetAudience manquant')
  }

  if (form.estimatedTotal <= 0) {
    errors.estimatedTotal = 'Le prix total doit être supérieur à 0'
    isValid = false
    console.log('❌ [DEBUG validateForm] Échec: estimatedTotal <=', form.estimatedTotal)
  }

  if (form.popularity < 0 || form.popularity > 100) {
    errors.popularity = 'La popularité doit être entre 0 et 100'
    isValid = false
    console.log('❌ [DEBUG validateForm] Échec: popularity hors limites', form.popularity)
  }

  console.log(`🔍 [DEBUG validateForm] Résultat final: isValid = ${isValid}`)
  return isValid
}

async function handleSubmit() {
  if (!validateForm()) return

  // 🔧 FIX TEST 3.2: Extract plain objects from Vue Proxies before API submission
  // Both form and selectedProducts are reactive() objects that need toRaw()
  const rawForm = toRaw(form)

  // 🔧 FIX: Préparer les produits avec subtotals recalculés AVANT le bundleData
  const preparedProducts = selectedProducts.value.map(p => {
    const rawProduct = toRaw(p)
    // Recalculer subtotal avec effectivePrice (customPrice ?? basePrice)
    // Évite erreur validation backend "Sous-total incorrect"
    const effectivePrice = rawProduct.customPrice ?? rawProduct.basePrice
    const calculatedSubtotal = effectivePrice * rawProduct.quantity
    return {
      id: rawProduct.id,
      name: rawProduct.name,
      basePrice: rawProduct.basePrice,
      quantity: rawProduct.quantity,
      subtotal: calculatedSubtotal,
      priceLocked: rawProduct.priceLocked ?? false,
      customPrice: rawProduct.customPrice
    }
  })

  // Recalculer les totaux de manière cohérente
  const calculatedEstimatedTotal = preparedProducts.reduce((sum, p) => sum + p.subtotal, 0)
  const calculatedOriginalTotal = preparedProducts.reduce((sum, p) => sum + (p.basePrice * p.quantity), 0)
  const calculatedSavings = Math.max(0, calculatedOriginalTotal - calculatedEstimatedTotal)

  // Prepare bundle data with proper type casting
  const bundleData = {
    ...rawForm,
    targetAudience: rawForm.targetAudience as BundleTargetAudience,
    products: preparedProducts,
    estimatedTotal: calculatedEstimatedTotal,
    originalTotal: calculatedOriginalTotal,
    savings: calculatedSavings,
    tags: tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean)
  }

  // 🐛 DEBUG: Log payload before API submission
  console.log('🔍 [DEBUG handleSubmit] bundleData:', JSON.stringify(bundleData, null, 2))

  if (isNew.value) {
    createBundleMutation.mutate(bundleData)
  } else {
    updateBundleMutation.mutate({
      id: bundleId.value,
      updates: bundleData
    })
  }
}

function duplicateBundle() {
  router.push({
    path: '/admin/bundles/new',
    query: { duplicate: bundleId.value }
  })
}

async function deleteBundle() {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le bundle "${form.name}" ?`)) return

  deleteBundleMutation.mutate(bundleId.value)
}

function formatPrice(price: number | undefined | null): string {
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A'
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price)
}

// 🔔 PRICE WARNING HELPER (Phase 3.2)
// Détecte les écarts de synchronisation entre prix bundle et prix catalogue
// NOTE: Ce warning concerne la SYNCHRONISATION, pas la politique de remise
// Un bundle peut avoir 0% de remise, mais si le prix du produit a changé
// dans le catalogue sans synchronisation, l'admin doit être alerté
function getPriceWarning(product: any): { hasWarning: boolean; percentage: number; message: string } | null {
  if (!product.catalogPrice || !product.basePrice) {
    return null
  }

  const catalog = product.catalogPrice
  const bundle = product.basePrice

  // Calcul de l'écart en pourcentage (|catalog - bundle| / catalog * 100)
  const diff = Math.abs(catalog - bundle)
  const percentage = Math.round((diff / catalog) * 100)

  // Warning si écart > 5% entre prix bundle et catalogue (indicateur de désynchronisation)
  if (percentage > 5) {
    const direction = bundle > catalog ? 'supérieur' : 'inférieur'
    return {
      hasWarning: true,
      percentage,
      message: `⚠️ Désync: Prix bundle ${direction} de ${percentage}% au catalogue (${formatPrice(catalog)}). Synchronisez si nécessaire.`
    }
  }

  return null
}

// ===== LIFECYCLE & WATCHERS =====
// Initialize form when bundle data is loaded (with guard to prevent cascades)
watchEffect(() => {
  if (bundleData.value && !isNew.value && !isFormInitialized.value) {
    initializeFormFromBundle(bundleData.value)
    isFormInitialized.value = true
  }
}, { flush: 'post' }) // flush: 'post' évite les cascades pre-render

// Watch calculated total to update form - using centralized calculations
watch(() => bundleCalculations.estimatedTotal.value, (newTotal) => {
  // Always update form total, including when it's 0 (no products)
  form.estimatedTotal = newTotal
})

// Handle real-time updates from other interfaces
onMounted(async () => {

  // 🔄 AUTO-SYNCHRONISATION AU CHARGEMENT - Synchroniser immédiatement les données
  console.log('🚀 Auto-synchronisation du bundle au chargement...')

  try {
    // Synchroniser les prix et métadonnées des produits sélectionnés
    if (selectedProducts.value && selectedProducts.value.length > 0) {
      console.log(`📦 Synchronisation de ${selectedProducts.value.length} produits...`)

      const syncPromises = selectedProducts.value.map(async (bundleProduct) => {
        try {
          // Récupérer les données les plus récentes du produit
          const response = await $fetch(`/api/products/${bundleProduct.id}`)
          // 🔧 FIX: L'API retourne { success, data, source } - extraire data
          const latestProduct = response?.data || response

          if (latestProduct) {
            // Mettre à jour les données du produit dans le bundle
            const catalogPrice = latestProduct.base_price || latestProduct.price || bundleProduct.basePrice
            // 💰 Prix effectif: customPrice si priceLocked, sinon prix catalogue
            const effectivePrice = (bundleProduct.priceLocked && bundleProduct.customPrice)
              ? bundleProduct.customPrice
              : catalogPrice
            // 🔧 FIX: Utiliser reactive() pour que v-model fonctionne correctement
            const updatedBundleProduct = reactive({
              ...bundleProduct,
              name: latestProduct.name || bundleProduct.name,
              basePrice: catalogPrice,
              image_url: latestProduct.image_url || bundleProduct.image_url,
              images: latestProduct.images || bundleProduct.images || [],
              subtotal: bundleProduct.quantity * effectivePrice,
              // Price Lock: préserve le flag lors de la sync automatique
              priceLocked: bundleProduct.priceLocked ?? false,
              // 💰 Préserver customPrice lors de la sync
              customPrice: bundleProduct.customPrice,
              // Price Warning: stocke le prix catalogue pour calcul d'écart (Phase 3.2)
              catalogPrice: catalogPrice
            })

            console.log(`✅ Produit "${latestProduct.name}" synchronisé`)
            return updatedBundleProduct
          }

          return bundleProduct
        } catch (error) {
          console.warn(`⚠️ Erreur sync produit ${bundleProduct.id}:`, error)
          return bundleProduct // Garder les données existantes en cas d'erreur
        }
      })

      // Attendre toutes les synchronisations
      const syncedProducts = await Promise.all(syncPromises)
      selectedProducts.value = syncedProducts

      console.log('✅ Auto-synchronisation terminée avec succès')

      // Afficher notification de synchronisation
      if (info) {
        info('Bundle synchronisé', `${syncedProducts.length} produits mis à jour`)
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'auto-synchronisation:', error)
    if (warning) {
      warning('Synchronisation partielle', 'Certaines données peuvent ne pas être à jour')
    }
  }

  // ✅ Event Bus supprimé - TanStack Query gère l'invalidation cache automatiquement
})
</script>