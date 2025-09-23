<template>
  <div class="bundle-totalizer bg-white border border-gray-200 rounded-lg p-4">
    <!-- Total des articles avec feedback visuel -->
    <div
      class="flex items-center justify-between mb-3"
      :aria-live="ariaLiveMode"
      :aria-atomic="true"
    >
      <div class="flex items-center space-x-2">
        <Icon
          :name="statusIcon"
          :class="statusIconClasses"
          class="w-5 h-5"
        />
        <span class="text-sm font-medium text-gray-700">
          Total des articles :
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <span
          :class="totalQuantityClasses"
          class="text-lg font-bold"
        >
          {{ formatNumber(totalQuantity) }} articles
        </span>
      </div>
    </div>

    <!-- Message de statut avec feedback détaillé -->
    <div
      :class="statusMessageClasses"
      class="p-3 rounded-md text-sm"
    >
      <div class="flex items-start space-x-2">
        <Icon
          :name="statusIcon"
          :class="statusIconClasses"
          class="w-4 h-4 mt-0.5 flex-shrink-0"
        />
        <div class="flex-1">
          <p class="font-medium">{{ statusTitle }}</p>
          <p class="mt-1">{{ statusMessage }}</p>

          <!-- Articles restants à ajouter -->
          <div v-if="articlesRemaining > 0" class="mt-2 text-xs opacity-90">
            <strong>{{ formatNumber(articlesRemaining) }} articles</strong> restants pour atteindre le minimum
          </div>
        </div>
      </div>
    </div>

    <!-- Détails du total (prix) si disponible -->
    <div v-if="totalPrice > 0" class="mt-3 pt-3 border-t border-gray-200">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600">Total estimé :</span>
        <span class="font-medium text-gray-900">{{ formatPrice(totalPrice) }}</span>
      </div>
      <div v-if="originalPrice && originalPrice > totalPrice" class="flex items-center justify-between text-sm mt-1">
        <span class="text-gray-600">Économies :</span>
        <span class="font-medium text-green-600">{{ formatPrice(originalPrice - totalPrice) }}</span>
      </div>
    </div>

    <!-- Barre de progression visuelle -->
    <div v-if="showProgressBar" class="mt-3">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Progression vers 1000 articles</span>
        <span>{{ Math.min(100, progressPercentage) }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          :class="progressBarClasses"
          class="h-2 rounded-full transition-all duration-300 ease-in-out"
          :style="{ width: `${Math.min(100, progressPercentage)}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalQuantity: number
  totalPrice?: number
  originalPrice?: number
  minimumQuantity?: number
  showProgressBar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalPrice: 0,
  originalPrice: 0,
  minimumQuantity: 1000,
  showProgressBar: true
})

// Calculs dérivés
const isValid = computed(() => props.totalQuantity >= props.minimumQuantity)
const articlesRemaining = computed(() =>
  Math.max(0, props.minimumQuantity - props.totalQuantity)
)
const progressPercentage = computed(() =>
  (props.totalQuantity / props.minimumQuantity) * 100
)

// Modes ARIA Live pour annonces lecteurs d'écran
const ariaLiveMode = computed(() => {
  // Annonce "polite" quand on passe de valide à invalide ou vice versa
  return isValid.value ? 'polite' : 'assertive'
})

// Classes CSS dynamiques pour le total
const totalQuantityClasses = computed(() => ({
  'text-green-600': isValid.value,
  'text-red-600': !isValid.value
}))

// Icône et classes de statut
const statusIcon = computed(() =>
  isValid.value ? 'heroicons:check-circle' : 'heroicons:exclamation-triangle'
)

const statusIconClasses = computed(() => ({
  'text-green-500': isValid.value,
  'text-red-500': !isValid.value
}))

// Message de statut
const statusTitle = computed(() =>
  isValid.value ? 'Bundle valide' : 'Bundle invalide'
)

const statusMessage = computed(() => {
  if (isValid.value) {
    return 'Le bundle contient suffisamment d\'articles et peut être sauvegardé.'
  } else if (props.totalQuantity === 0) {
    return 'Aucun produit ajouté. Commencez par ajouter des produits au bundle.'
  } else {
    return `Quantité insuffisante. Un minimum de ${formatNumber(props.minimumQuantity)} articles est requis.`
  }
})

// Classes pour le message de statut
const statusMessageClasses = computed(() => ({
  'bg-green-50 border border-green-200 text-green-800': isValid.value,
  'bg-red-50 border border-red-200 text-red-800': !isValid.value
}))

// Classes pour la barre de progression
const progressBarClasses = computed(() => ({
  'bg-green-500': isValid.value,
  'bg-red-500': !isValid.value && props.totalQuantity > 0,
  'bg-gray-400': props.totalQuantity === 0
}))

// Fonctions de formatage
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(price)
}
</script>

<style scoped>
.bundle-totalizer {
  /* Styles additionnels si nécessaire */
}

/* Animation pour les changements de statut */
.bundle-totalizer [aria-live] {
  transition: all 0.3s ease-in-out;
}
</style>