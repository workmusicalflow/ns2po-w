<template>
  <NSCard 
    :class="[
      'group transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
      themeClasses.card,
      { 'ring-2 ring-primary': featured }
    ]"
    :style="themeStyles"
  >
    <!-- Badge de promotion -->
    <div 
      v-if="featured"
      class="absolute -top-3 -right-3 z-10"
    >
      <div class="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
        {{ isElectionTheme ? '🏛️ Campagne' : '⭐ Vedette' }}
      </div>
    </div>

    <!-- Image du produit -->
    <div class="relative overflow-hidden rounded-t-md">
      <div 
        class="w-full h-48 bg-gradient-to-br"
        :class="getProductGradient"
        :style="{ 
          backgroundImage: product.image ? `url(${product.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }"
      >
        <!-- Overlay pour simulation de logo -->
        <div 
          v-if="!product.image"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div class="text-center text-white/80">
            <svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm font-medium">
              {{ product.category }}
            </p>
          </div>
        </div>

        <!-- Badge de catégorie -->
        <div class="absolute top-3 left-3">
          <span 
            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
            :class="getCategoryBadgeClasses"
          >
            {{ getCategoryIcon }} {{ product.category }}
          </span>
        </div>
      </div>
    </div>

    <!-- Contenu de la carte -->
    <div class="p-6">
      <!-- Titre et description -->
      <div class="mb-4">
        <h3 :class="[themeClasses.text.primary, 'text-xl font-heading font-semibold mb-2']">
          {{ product.name }}
        </h3>
        <p :class="[themeClasses.text.secondary, 'text-sm line-clamp-2']">
          {{ product.description }}
        </p>
      </div>

      <!-- Quantités et prix -->
      <div class="space-y-3 mb-6">
        <div class="flex justify-between items-center">
          <span :class="themeClasses.text.secondary">Quantité minimum :</span>
          <span :class="[themeClasses.text.primary, 'font-semibold']">
            {{ product.minQuantity }} pièces
          </span>
        </div>
        
        <div class="flex justify-between items-center">
          <span :class="themeClasses.text.secondary">Prix unitaire :</span>
          <span :class="[themeClasses.text.accent, 'text-lg font-bold']">
            {{ formatPrice(product.unitPrice) }} FCFA
          </span>
        </div>

        <!-- Barre de remise volume -->
        <div v-if="product.volumeDiscount" class="relative">
          <div :class="['h-2 rounded-full', getDiscountBarColor]">
            <div 
              class="h-full bg-success rounded-full transition-all duration-500"
              :style="{ width: `${Math.min((selectedQuantity / product.volumeDiscount.threshold) * 100, 100)}%` }"
            />
          </div>
          <p class="text-xs mt-1" :class="themeClasses.text.secondary">
            Remise de {{ product.volumeDiscount.percentage }}% dès {{ product.volumeDiscount.threshold }} pièces
          </p>
        </div>
      </div>

      <!-- Sélecteur de quantité -->
      <div class="mb-6">
        <label :class="[themeClasses.text.primary, 'block text-sm font-medium mb-2']">
          Quantité désirée
        </label>
        <div class="flex items-center gap-3">
          <NSButton 
            size="sm" 
            variant="outline"
            :disabled="selectedQuantity <= product.minQuantity"
            @click="decreaseQuantity"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
          </NSButton>
          
          <input 
            v-model.number="selectedQuantity"
            type="number"
            :min="product.minQuantity"
            :class="[
              'w-20 text-center border rounded-md px-2 py-1 text-sm transition-colors',
              themeClasses.text.primary,
              isDarkTheme ? 'bg-surface border-text-main/30' : 'bg-background border-text-main/20'
            ]"
          >
          
          <NSButton 
            size="sm" 
            variant="outline"
            @click="increaseQuantity"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
            </svg>
          </NSButton>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <NSButton 
          :variant="isElectionTheme ? 'accent' : 'primary'"
          size="sm"
          class="flex-1"
          @click="$emit('add-to-quote', { product, quantity: selectedQuantity })"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter au devis
        </NSButton>
        
        <NSButton 
          variant="ghost" 
          size="sm"
          :title="'Prévisualiser ' + product.name"
          @click="$emit('preview', product)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </NSButton>
      </div>

      <!-- Prix total calculé -->
      <div 
        v-if="totalPrice > 0"
        class="mt-4 p-3 rounded-md"
        :class="getCalculationBackground"
      >
        <div class="flex justify-between items-center">
          <span :class="themeClasses.text.primary">Total estimé :</span>
          <div class="text-right">
            <span :class="[themeClasses.text.accent, 'text-xl font-bold']">
              {{ formatPrice(totalPrice) }} FCFA
            </span>
            <p v-if="savings > 0" class="text-xs text-success">
              Économie : {{ formatPrice(savings) }} FCFA
            </p>
          </div>
        </div>
      </div>
    </div>
  </NSCard>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
// Auto-imported via Nuxt 3: useThemeAware

interface Product {
  id: string
  name: string
  description: string
  category: string
  unitPrice: number
  minQuantity: number
  image?: string
  volumeDiscount?: {
    threshold: number
    percentage: number
  }
}

interface Props {
  product: Product
  featured?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  featured: false
})

const emit = defineEmits<{
  'add-to-quote': [{ product: Product; quantity: number }]
  preview: [product: Product]
}>()

// Theme awareness
const { 
  themeClasses, 
  themeStyles, 
  isElectionTheme, 
  isDarkTheme,
  contextualColors 
} = useThemeAware()

// État local
const selectedQuantity = ref(props.product.minQuantity)

// Calculs
const totalPrice = computed(() => {
  let price = selectedQuantity.value * props.product.unitPrice
  
  // Application de la remise volume
  if (props.product.volumeDiscount && selectedQuantity.value >= props.product.volumeDiscount.threshold) {
    const discount = price * (props.product.volumeDiscount.percentage / 100)
    price -= discount
  }
  
  return price
})

const savings = computed(() => {
  if (!props.product.volumeDiscount || selectedQuantity.value < props.product.volumeDiscount.threshold) {
    return 0
  }
  
  const originalPrice = selectedQuantity.value * props.product.unitPrice
  return originalPrice - totalPrice.value
})

// Actions
const increaseQuantity = () => {
  selectedQuantity.value += 50 // Incréments par 50
}

const decreaseQuantity = () => {
  if (selectedQuantity.value > props.product.minQuantity) {
    selectedQuantity.value = Math.max(selectedQuantity.value - 50, props.product.minQuantity)
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(price))
}

// Styles adaptatifs selon le thème
const getProductGradient = computed(() => {
  if (isElectionTheme.value) {
    return 'from-primary/20 to-accent/30'
  }
  return 'from-primary/10 to-accent/20'
})

const getCategoryIcon = computed(() => {
  const icons = {
    'Textile': '👕',
    'Gadget': '🎁',
    'EPI': '🦺',
    'Électoral': '🗳️',
    'Promotionnel': '📢'
  }
  return icons[props.product.category as keyof typeof icons] || '📦'
})

const getCategoryBadgeClasses = computed(() => {
  if (isElectionTheme.value) {
    return 'bg-white/90 text-accent border border-accent/20'
  }
  return 'bg-white/80 text-text-main'
})

const getDiscountBarColor = computed(() => {
  return isDarkTheme.value ? 'bg-text-main/20' : 'bg-text-main/10'
})

const getCalculationBackground = computed(() => {
  if (isDarkTheme.value) {
    return 'bg-primary/10 border border-primary/20'
  }
  return 'bg-primary/5 border border-primary/10'
})
</script>