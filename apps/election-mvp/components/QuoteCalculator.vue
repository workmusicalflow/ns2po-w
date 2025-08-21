<template>
  <div class="quote-calculator">
    <!-- En-tête du calculateur -->
    <div class="calculator-header">
      <h2 class="calculator-title">Calculateur de devis</h2>
      <p class="calculator-subtitle">
        Configurez vos produits et obtenez un devis instantané
      </p>
    </div>

    <!-- Liste des produits sélectionnés -->
    <div class="calculator-content">
      <div class="products-section">
        <h3 class="section-title">Produits sélectionnés</h3>
        
        <div v-if="items.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" class="w-12 h-12">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M9 9l6 6m0-6l-6 6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <p class="empty-text">Aucun produit sélectionné</p>
          <Button @click="$emit('add-product')" variant="primary">
            Ajouter un produit
          </Button>
        </div>

        <div v-else class="products-list">
          <div 
            v-for="(item, index) in items" 
            :key="item.id"
            class="product-item"
          >
            <!-- Produit header -->
            <div class="product-header">
              <div class="product-info">
                <h4 class="product-name">{{ item.product?.name || 'Produit inconnu' }}</h4>
                <p class="product-category">{{ item.product?.category || '' }}</p>
              </div>
              
              <Button 
                @click="removeItem(index)"
                variant="danger"
                size="small"
              >
                Supprimer
              </Button>
            </div>

            <!-- Configuration du produit -->
            <div class="product-config">
              <!-- Quantité -->
              <div class="config-row">
                <label class="config-label">Quantité</label>
                <div class="quantity-control">
                  <button 
                    @click="updateQuantity(index, item.quantity - 1)"
                    :disabled="item.quantity <= 1"
                    class="quantity-btn"
                  >
                    -
                  </button>
                  <input 
                    v-model.number="item.quantity"
                    @input="updateQuantity(index, item.quantity)"
                    type="number"
                    min="1"
                    class="quantity-input"
                  />
                  <button 
                    @click="updateQuantity(index, item.quantity + 1)"
                    class="quantity-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Personnalisations -->
              <div v-if="item.product?.customizationOptions?.length" class="config-row">
                <label class="config-label">Personnalisations</label>
                <div class="customizations">
                  <div 
                    v-for="option in item.product.customizationOptions"
                    :key="option.id"
                    class="customization-option"
                  >
                    <label class="option-label">
                      {{ option.name }}
                      <span v-if="option.required" class="required">*</span>
                    </label>
                    
                    <!-- Type couleur -->
                    <select 
                      v-if="option.type === 'color'"
                      @change="updateCustomization(index, option.id, $event)"
                      class="option-select"
                    >
                      <option value="">Choisir une couleur</option>
                      <option 
                        v-for="choice in option.options"
                        :key="choice"
                        :value="choice"
                      >
                        {{ choice }}
                        <span v-if="option.priceModifier !== undefined && option.priceModifier !== 0">
                          ({{ option.priceModifier > 0 ? '+' : '' }}{{ formatCurrency(option.priceModifier) }})
                        </span>
                      </option>
                    </select>

                    <!-- Type texte -->
                    <input 
                      v-else-if="option.type === 'text'"
                      @input="updateCustomizationText(index, option.id, $event)"
                      type="text"
                      :placeholder="`Votre ${option.name.toLowerCase()}`"
                      class="option-input"
                    />

                    <!-- Type logo -->
                    <div v-else-if="option.type === 'logo'" class="logo-upload">
                      <CloudinaryUpload
                        preset="logo"
                        :show-preview="false"
                        @upload:success="(result) => updateCustomizationLogo(index, option.id, result)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Prix calculé pour cet item -->
              <div class="item-price">
                <div class="price-breakdown">
                  <div class="price-line">
                    <span>Prix unitaire de base:</span>
                    <span>{{ formatCurrency(item.product?.basePrice || 0) }}</span>
                  </div>
                  
                  <div v-if="getItemCalculation(item).customizationsCost > 0" class="price-line">
                    <span>Personnalisations:</span>
                    <span>+{{ formatCurrency(getItemCalculation(item).customizationsCost) }}</span>
                  </div>
                  
                  <div 
                    v-for="rule in getItemCalculation(item).appliedRules"
                    :key="rule.ruleId"
                    class="price-line rule"
                  >
                    <span>{{ rule.ruleName }}:</span>
                    <span :class="rule.modifier >= 0 ? 'text-red-600' : 'text-green-600'">
                      {{ rule.modifier >= 0 ? '+' : '' }}{{ formatCurrency(rule.modifier) }}
                    </span>
                  </div>
                  
                  <div class="price-line total">
                    <span>Prix unitaire final:</span>
                    <span class="font-bold">{{ formatCurrency(getItemCalculation(item).unitPrice) }}</span>
                  </div>
                  
                  <div class="price-line total">
                    <span>Total ({{ item.quantity }} × {{ formatCurrency(getItemCalculation(item).unitPrice) }}):</span>
                    <span class="font-bold text-lg">{{ formatCurrency(getItemCalculation(item).totalPrice) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bouton ajouter produit -->
          <div class="add-product-section">
            <Button @click="$emit('add-product')" variant="outline">
              + Ajouter un autre produit
            </Button>
          </div>
        </div>
      </div>

      <!-- Résumé du devis -->
      <div v-if="items.length > 0" class="quote-summary">
        <h3 class="section-title">Résumé du devis</h3>
        
        <div class="summary-content">
          <!-- Calcul en cours -->
          <div v-if="isCalculating" class="calculating">
            <div class="spinner"></div>
            <p>Calcul en cours...</p>
          </div>

          <!-- Résultats -->
          <div v-else-if="calculation" class="calculation-result">
            <!-- Breakdown détaillé -->
            <div class="breakdown">
              <div 
                v-for="line in calculation.breakdown"
                :key="line.label"
                class="breakdown-line"
                :class="[`breakdown-${line.type}`]"
              >
                <span class="breakdown-label">
                  {{ line.label }}
                  <small v-if="line.details" class="breakdown-details">{{ line.details }}</small>
                </span>
                <span class="breakdown-amount">
                  {{ formatCurrency(line.amount) }}
                </span>
              </div>
            </div>

            <!-- Totaux -->
            <div class="totals">
              <div class="total-line">
                <span>Sous-total:</span>
                <span>{{ formatCurrency(calculation.subtotal) }}</span>
              </div>
              
              <div v-if="calculation.discountAmount > 0" class="total-line discount">
                <span>Remises:</span>
                <span>-{{ formatCurrency(calculation.discountAmount) }}</span>
              </div>
              
              <div class="total-line">
                <span>TVA ({{ (calculation.taxRate * 100).toFixed(0) }}%):</span>
                <span>{{ formatCurrency(calculation.taxAmount) }}</span>
              </div>
              
              <div class="total-line final">
                <span>Total TTC:</span>
                <span class="final-amount">{{ formatCurrency(calculation.totalAmount) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="quote-actions">
              <Button @click="downloadQuote" variant="primary">
                Télécharger le devis
              </Button>
              <Button @click="sendQuote" variant="secondary">
                Envoyer par email
              </Button>
              <Button @click="saveQuote" variant="outline">
                Sauvegarder
              </Button>
            </div>

            <!-- Informations complémentaires -->
            <div class="quote-info">
              <p class="validity">
                <strong>Validité:</strong> 30 jours à compter de ce jour
              </p>
              <p class="conditions">
                Prix susceptibles de variations selon disponibilité des matières premières
              </p>
            </div>
          </div>

          <!-- Erreurs -->
          <div v-if="validationErrors.length > 0" class="validation-errors">
            <h4>Erreurs de validation:</h4>
            <ul>
              <li v-for="error in validationErrors" :key="error.field">
                {{ error.message }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { Button } from '@ns2po/ui'
import type { 
  QuoteItem, 
  QuoteCalculation, 
  ValidationError,
  ItemCustomization,
  CloudinaryUploadResult 
} from '@ns2po/types'

interface Props {
  initialItems?: QuoteItem[]
  customerType?: 'individual' | 'party' | 'candidate' | 'organization'
  autoCalculate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialItems: () => [],
  autoCalculate: true
})

const emit = defineEmits<{
  'add-product': []
  'quote-updated': [calculation: QuoteCalculation]
  'download-quote': [calculation: QuoteCalculation]
  'send-quote': [calculation: QuoteCalculation]
  'save-quote': [calculation: QuoteCalculation]
}>()

// État local
const items = ref<QuoteItem[]>([...props.initialItems])

// Composable calculateur
const { 
  calculateQuote,
  calculateProductPrice,
  formatCurrency,
  isCalculating,
  lastCalculation,
  validationErrors 
} = useQuoteCalculator()

// État réactif pour le calcul
const calculation = ref<QuoteCalculation | null>(null)

// Watchers pour recalcul automatique
watch(items, () => {
  if (props.autoCalculate && items.value.length > 0) {
    debouncedCalculate()
  }
}, { deep: true })

// Debounced calculation pour éviter trop d'appels
const debouncedCalculate = useDebounceFn(async () => {
  try {
    const result = await calculateQuote({
      items: items.value,
      customer: { customerType: props.customerType } as any
    })
    
    calculation.value = result.calculation
    emit('quote-updated', result.calculation)
  } catch (error) {
    console.error('Erreur calcul devis:', error)
  }
}, 500)

// Méthodes de gestion des items
const removeItem = (index: number) => {
  items.value.splice(index, 1)
}

const updateQuantity = (index: number, newQuantity: number) => {
  if (newQuantity >= 1 && items.value[index]) {
    items.value[index].quantity = newQuantity
  }
}

const updateCustomization = (itemIndex: number, optionId: string, event: Event) => {
  const target = event.target as HTMLSelectElement
  const choiceId = target.value
  
  const item = items.value[itemIndex]
  if (!item) return
  
  if (!item.customizations) {
    item.customizations = []
  }

  // Remplacer ou ajouter la personnalisation
  const existingIndex = item.customizations.findIndex(c => c.optionId === optionId)
  
  if (choiceId) {
    const customization: ItemCustomization = {
      optionId,
      choiceId,
      priceModifier: getCustomizationPrice(itemIndex, optionId, choiceId)
    }

    if (existingIndex >= 0) {
      item.customizations[existingIndex] = customization
    } else {
      item.customizations.push(customization)
    }
  } else if (existingIndex >= 0) {
    item.customizations.splice(existingIndex, 1)
  }
}

const updateCustomizationText = (itemIndex: number, optionId: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  const item = items.value[itemIndex]
  if (!item) return
  
  if (!item.customizations) {
    item.customizations = []
  }

  const existingIndex = item.customizations.findIndex(c => c.optionId === optionId)
  
  if (value.trim()) {
    const customization: ItemCustomization = {
      optionId,
      choiceId: 'text',
      customValue: value,
      priceModifier: getCustomizationPrice(itemIndex, optionId, 'text')
    }

    if (existingIndex >= 0) {
      item.customizations[existingIndex] = customization
    } else {
      item.customizations.push(customization)
    }
  } else if (existingIndex >= 0) {
    item.customizations.splice(existingIndex, 1)
  }
}

const updateCustomizationLogo = (itemIndex: number, optionId: string, result: CloudinaryUploadResult) => {
  const item = items.value[itemIndex]
  if (!item) return
  
  if (!item.customizations) {
    item.customizations = []
  }

  const existingIndex = item.customizations.findIndex(c => c.optionId === optionId)
  
  const customization: ItemCustomization = {
    optionId,
    choiceId: 'logo',
    customValue: result.secure_url,
    priceModifier: getCustomizationPrice(itemIndex, optionId, 'logo')
  }

  if (existingIndex >= 0) {
    item.customizations[existingIndex] = customization
  } else {
    item.customizations.push(customization)
  }
}

const getCustomizationPrice = (itemIndex: number, optionId: string, choiceId: string): number => {
  const item = items.value[itemIndex]
  if (!item) return 0
  
  const option = item.product?.customizationOptions?.find(o => o.id === optionId)
  
  if (!option) return 0

  if (option.type === 'text' || option.type === 'logo') {
    return option.priceModifier || 0
  }

  // Pour les options avec values, utiliser le prix base de l'option
  return option.price || 0
}

// Calcul en temps réel pour un item
const getItemCalculation = (item: QuoteItem) => {
  if (!item.product) {
    return { unitPrice: 0, totalPrice: 0, customizationsCost: 0, appliedRules: [] }
  }

  const customizations = item.customizations || []
  return calculateProductPrice(item.product.basePrice, item.quantity, customizations)
}

// Actions
const downloadQuote = () => {
  if (calculation.value) {
    emit('download-quote', calculation.value)
  }
}

const sendQuote = () => {
  if (calculation.value) {
    emit('send-quote', calculation.value)
  }
}

const saveQuote = () => {
  if (calculation.value) {
    emit('save-quote', calculation.value)
  }
}

// Méthodes exposées
defineExpose({
  addItem: (item: QuoteItem) => {
    items.value.push(item)
  },
  clearItems: () => {
    items.value = []
    calculation.value = null
  },
  getCalculation: () => calculation.value
})

// Calcul initial si des items sont fournis
onMounted(() => {
  if (items.value.length > 0 && props.autoCalculate) {
    debouncedCalculate()
  }
})
</script>

<style scoped>
.quote-calculator {
  @apply max-w-6xl mx-auto p-6;
}

.calculator-header {
  @apply text-center mb-8;
}

.calculator-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.calculator-subtitle {
  @apply text-lg text-gray-600;
}

.calculator-content {
  @apply grid lg:grid-cols-2 gap-8;
}

.section-title {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

.empty-state {
  @apply text-center py-12 border-2 border-dashed border-gray-300 rounded-lg;
}

.empty-icon {
  @apply text-gray-400 mb-4;
}

.empty-text {
  @apply text-gray-500 mb-4;
}

.products-list {
  @apply space-y-6;
}

.product-item {
  @apply bg-white border border-gray-200 rounded-lg p-6;
}

.product-header {
  @apply flex justify-between items-start mb-4;
}

.product-name {
  @apply text-lg font-semibold text-gray-900;
}

.product-category {
  @apply text-sm text-gray-500;
}

.product-config {
  @apply space-y-4;
}

.config-row {
  @apply space-y-2;
}

.config-label {
  @apply block text-sm font-medium text-gray-700;
}

.quantity-control {
  @apply flex items-center space-x-2;
}

.quantity-btn {
  @apply w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50;
}

.quantity-input {
  @apply w-20 px-3 py-2 border border-gray-300 rounded-md text-center;
}

.customizations {
  @apply space-y-3;
}

.customization-option {
  @apply space-y-2;
}

.option-label {
  @apply block text-sm font-medium text-gray-700;
}

.required {
  @apply text-red-500;
}

.option-select,
.option-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500;
}

.logo-upload {
  @apply max-w-sm;
}

.item-price {
  @apply mt-6 pt-4 border-t border-gray-200;
}

.price-breakdown {
  @apply space-y-2;
}

.price-line {
  @apply flex justify-between text-sm;
}

.price-line.rule {
  @apply text-xs;
}

.price-line.total {
  @apply text-base border-t pt-2 mt-2;
}

.add-product-section {
  @apply text-center py-4;
}

.quote-summary {
  @apply bg-gray-50 rounded-lg p-6;
}

.calculating {
  @apply flex items-center justify-center space-x-2 py-8;
}

.spinner {
  @apply w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin;
}

.breakdown {
  @apply space-y-2 mb-6;
}

.breakdown-line {
  @apply flex justify-between text-sm;
}

.breakdown-discount {
  @apply text-green-600;
}

.breakdown-label {
  @apply flex-1;
}

.breakdown-details {
  @apply block text-xs text-gray-500;
}

.breakdown-amount {
  @apply font-medium;
}

.totals {
  @apply space-y-2 border-t pt-4;
}

.total-line {
  @apply flex justify-between;
}

.total-line.discount {
  @apply text-green-600;
}

.total-line.final {
  @apply text-lg font-bold border-t pt-2 mt-2;
}

.final-amount {
  @apply text-2xl font-bold text-blue-600;
}

.quote-actions {
  @apply flex flex-wrap gap-2 mt-6;
}

.quote-info {
  @apply mt-6 pt-4 border-t text-sm text-gray-600;
}

.validation-errors {
  @apply mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700;
}
</style>