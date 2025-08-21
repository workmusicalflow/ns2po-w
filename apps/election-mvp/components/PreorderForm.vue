<template>
  <div class="preorder-form">
    <Card class="preorder-form-card">
      <template #header>
        <div class="form-header">
          <h2 class="form-title">Pré-commande</h2>
          <p class="form-description">
            Finalisez votre commande avec un acompte de 50%
          </p>
        </div>
      </template>

      <form @submit.prevent="handleSubmit" class="preorder-form-content">
        <!-- Résumé de la commande -->
        <div class="form-section">
          <h3 class="section-title">🛒 Résumé de votre commande</h3>
          
          <div class="order-summary">
            <div v-for="item in preorderData.items" :key="item.productId" class="order-item">
              <div class="item-info">
                <h4 class="item-name">{{ item.productName }}</h4>
                <p class="item-details">
                  Quantité: {{ item.quantity }} × {{ formatCurrency(item.unitPrice) }}
                </p>
                <div v-if="item.customizations.length > 0" class="item-customizations">
                  <span class="customization-label">Personnalisations:</span>
                  <ul>
                    <li v-for="custom in item.customizations" :key="custom">{{ custom }}</li>
                  </ul>
                </div>
              </div>
              <div class="item-price">
                {{ formatCurrency(item.totalPrice) }}
              </div>
            </div>
            
            <div class="order-total">
              <div class="total-line">
                <span>Sous-total:</span>
                <span>{{ formatCurrency(preorderData.totalAmount) }}</span>
              </div>
              <div class="total-line deposit">
                <span>Acompte à verser (50%):</span>
                <span class="deposit-amount">{{ formatCurrency(depositAmount) }}</span>
              </div>
              <div class="total-line remaining">
                <span>Solde à la livraison:</span>
                <span>{{ formatCurrency(remainingAmount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Informations client -->
        <div class="form-section">
          <h3 class="section-title">👤 Informations de facturation</h3>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nom complet *</label>
              <input 
                v-model="preorderData.customer.firstName"
                type="text" 
                class="form-input"
                :class="{ 'error': hasFieldError('customer.firstName') }"
                placeholder="Votre nom complet"
                required
              />
              <div v-if="hasFieldError('customer.firstName')" class="field-error">
                {{ getFieldError('customer.firstName') }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email *</label>
              <input 
                v-model="preorderData.customer.email"
                type="email" 
                class="form-input"
                :class="{ 'error': hasFieldError('customer.email') }"
                placeholder="votre@email.com"
                required
              />
              <div v-if="hasFieldError('customer.email')" class="field-error">
                {{ getFieldError('customer.email') }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Téléphone *</label>
              <input 
                v-model="preorderData.customer.phone"
                type="tel" 
                class="form-input"
                :class="{ 'error': hasFieldError('customer.phone') }"
                placeholder="+225 XX XX XX XX"
                required
              />
              <div v-if="hasFieldError('customer.phone')" class="field-error">
                {{ getFieldError('customer.phone') }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Organisation/Parti</label>
              <input 
                v-model="preorderData.customer.company"
                type="text" 
                class="form-input"
                placeholder="Nom de votre organisation"
              />
            </div>
          </div>
        </div>

        <!-- Informations de livraison -->
        <div class="form-section">
          <h3 class="section-title">🚚 Livraison</h3>
          
          <div class="form-group">
            <label class="form-label">Mode de livraison *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="preorderData.deliveryInfo.method" 
                  value="pickup"
                  @change="onDeliveryMethodChange"
                />
                <span class="radio-label">🏢 Retrait en magasin (gratuit)</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="preorderData.deliveryInfo.method" 
                  value="delivery"
                  @change="onDeliveryMethodChange"
                />
                <span class="radio-label">🚛 Livraison à domicile</span>
              </label>
            </div>
          </div>

          <div v-if="preorderData.deliveryInfo.method === 'delivery'" class="delivery-details">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Adresse complète *</label>
                <input 
                  v-model="preorderData.deliveryInfo.address.street"
                  type="text" 
                  class="form-input"
                  :class="{ 'error': hasFieldError('deliveryInfo.address.street') }"
                  placeholder="Rue, numéro, quartier"
                  required
                />
                <div v-if="hasFieldError('deliveryInfo.address.street')" class="field-error">
                  {{ getFieldError('deliveryInfo.address.street') }}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Ville *</label>
                <input 
                  v-model="preorderData.deliveryInfo.address.city"
                  type="text" 
                  class="form-input"
                  :class="{ 'error': hasFieldError('deliveryInfo.address.city') }"
                  placeholder="Abidjan, Bouaké, etc."
                  required
                />
                <div v-if="hasFieldError('deliveryInfo.address.city')" class="field-error">
                  {{ getFieldError('deliveryInfo.address.city') }}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Personne de contact *</label>
                <input 
                  v-model="preorderData.deliveryInfo.contactPerson"
                  type="text" 
                  class="form-input"
                  placeholder="Nom de la personne qui recevra"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label">Téléphone contact *</label>
                <input 
                  v-model="preorderData.deliveryInfo.contactPhone"
                  type="tel" 
                  class="form-input"
                  placeholder="+225 XX XX XX XX"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Instructions de livraison</label>
              <textarea 
                v-model="preorderData.deliveryInfo.deliveryNotes"
                class="form-textarea"
                placeholder="Indications particulières pour la livraison..."
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="form-section">
          <h3 class="section-title">📅 Planning</h3>
          
          <div class="form-group">
            <label class="form-label">Date de livraison souhaitée *</label>
            <input 
              v-model="preorderData.timeline.requestedDelivery"
              type="date" 
              class="form-input"
              :min="minDeliveryDate"
              @change="calculateTimeline"
              required
            />
            <div class="field-hint">
              Délai minimum: {{ minProductionDays }} jours de production
            </div>
          </div>

          <div v-if="timelineCalculated" class="timeline-info">
            <div class="timeline-item">
              <span class="timeline-label">Production estimée:</span>
              <span class="timeline-value">{{ preorderData.timeline.estimatedProduction }} jours</span>
            </div>
            <div class="timeline-item">
              <span class="timeline-label">Livraison estimée:</span>
              <span class="timeline-value">{{ preorderData.timeline.estimatedDelivery }}</span>
            </div>
            <div v-if="preorderData.timeline.isRushOrder" class="rush-order-notice">
              ⚡ Commande urgente - Supplément de {{ formatCurrency(preorderData.timeline.rushOrderFee || 0) }}
            </div>
          </div>
        </div>

        <!-- Méthode de paiement -->
        <div class="form-section">
          <h3 class="section-title">💳 Paiement de l'acompte</h3>
          
          <div class="payment-amount">
            <div class="amount-display">
              <span class="amount-label">Montant à verser maintenant:</span>
              <span class="amount-value">{{ formatCurrency(depositAmount) }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Méthode de paiement *</label>
            <div class="payment-options">
              <label class="payment-option">
                <input type="radio" v-model="preorderData.paymentMethod" value="mobile_money" />
                <div class="payment-card">
                  <div class="payment-icon">📱</div>
                  <div class="payment-details">
                    <div class="payment-name">Mobile Money</div>
                    <div class="payment-description">Orange, MTN, Moov</div>
                  </div>
                </div>
              </label>
              
              <label class="payment-option">
                <input type="radio" v-model="preorderData.paymentMethod" value="bank_transfer" />
                <div class="payment-card">
                  <div class="payment-icon">🏦</div>
                  <div class="payment-details">
                    <div class="payment-name">Virement bancaire</div>
                    <div class="payment-description">Délai 24-48h</div>
                  </div>
                </div>
              </label>
              
              <label class="payment-option">
                <input type="radio" v-model="preorderData.paymentMethod" value="cash" />
                <div class="payment-card">
                  <div class="payment-icon">💵</div>
                  <div class="payment-details">
                    <div class="payment-name">Espèces</div>
                    <div class="payment-description">À nos bureaux</div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Demandes spéciales -->
        <div class="form-section">
          <h3 class="section-title">📝 Demandes spéciales</h3>
          
          <div class="form-group">
            <label class="form-label">Instructions particulières</label>
            <textarea 
              v-model="preorderData.specialRequests"
              class="form-textarea"
              placeholder="Précisions sur la personnalisation, emballage spécial, etc."
              rows="4"
            ></textarea>
          </div>
        </div>

        <!-- Conditions générales -->
        <div class="form-section">
          <h3 class="section-title">📄 Conditions générales</h3>
          
          <div class="terms-content">
            <div class="terms-summary">
              <h4>Résumé des conditions:</h4>
              <ul>
                <li>Acompte de 50% requis pour démarrer la production</li>
                <li>Solde payable à la livraison</li>
                <li>Délai de production: {{ minProductionDays }} jours minimum</li>
                <li>Annulation possible jusqu'à 24h après confirmation</li>
                <li>Garantie qualité sur tous nos produits</li>
              </ul>
            </div>
            
            <div class="form-group">
              <label class="checkbox-option">
                <input 
                  type="checkbox" 
                  v-model="preorderData.agreedToTerms"
                  :class="{ 'error': hasFieldError('agreedToTerms') }"
                  required
                />
                <span class="checkbox-label">
                  J'accepte les <a href="/conditions" target="_blank">conditions générales</a> 
                  et la <a href="/politique-confidentialite" target="_blank">politique de confidentialité</a> *
                </span>
              </label>
              <div v-if="hasFieldError('agreedToTerms')" class="field-error">
                {{ getFieldError('agreedToTerms') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <Button 
            type="button" 
            variant="outline" 
            @click="$emit('cancel')"
            :disabled="isSubmitting"
          >
            Annuler
          </Button>
          
          <Button 
            type="submit" 
            variant="primary"
            :disabled="isSubmitting || !isFormValid"
            :loading="isSubmitting"
            size="large"
          >
            {{ isSubmitting ? 'Traitement...' : `Valider la pré-commande (${formatCurrency(depositAmount)})` }}
          </Button>
        </div>

        <!-- Messages d'erreur -->
        <div v-if="submitError" class="form-error">
          <p>{{ submitError }}</p>
        </div>

        <!-- Message de succès -->
        <div v-if="submitSuccess" class="form-success">
          <div class="success-content">
            <div class="success-icon">🎉</div>
            <div class="success-message">
              <h4>{{ submitSuccess.message }}</h4>
              <p><strong>Référence:</strong> {{ submitSuccess.preorderId }}</p>
              
              <div v-if="submitSuccess.paymentInstructions" class="payment-instructions">
                <h5>Instructions de paiement:</h5>
                <ul>
                  <li v-for="instruction in submitSuccess.paymentInstructions.details.instructions" 
                      :key="instruction">
                    {{ instruction }}
                  </li>
                </ul>
                <p class="due-date">
                  <strong>À effectuer avant le:</strong> 
                  {{ formatDate(submitSuccess.paymentInstructions.dueDate) }}
                </p>
              </div>
              
              <div v-if="submitSuccess.nextSteps" class="next-steps">
                <h5>Prochaines étapes:</h5>
                <ol>
                  <li v-for="step in submitSuccess.nextSteps" :key="step">{{ step }}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button, Card } from '@ns2po/ui'
import type { PreorderFormData, QuoteItem } from '@ns2po/types'

// Composables
const { 
  submitPreorderForm, 
  validatePreorderForm, 
  isSubmitting, 
  validationErrors,
  getFieldErrors,
  clearValidationErrors,
  formatCurrency 
} = useContactForm()

// Props & Events
interface Props {
  quoteId?: string
  items: QuoteItem[]
  totalAmount: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  cancel: []
  success: [preorderId: string]
}>()

// État réactif
const preorderData = ref<PreorderFormData>({
  customer: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerType: '',
    company: '',
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'CI'
    }
  },
  quoteId: props.quoteId,
  items: props.items.map(item => ({
    productId: item.productId,
    productName: item.product?.name || '',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    customizations: item.customizations?.map(c => c.customValue || '') || [],
    totalPrice: item.totalPrice,
    specifications: item.notes
  })),
  totalAmount: props.totalAmount,
  paymentMethod: 'mobile_money',
  deliveryInfo: {
    method: 'pickup',
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'CI'
    },
    contactPerson: '',
    contactPhone: '',
    deliveryNotes: ''
  },
  timeline: {
    requestedDelivery: '',
    estimatedProduction: 7,
    estimatedDelivery: '',
    isRushOrder: false
  },
  agreedToTerms: false,
  depositAmount: 0,
  remainingAmount: 0,
  status: 'draft'
})

const submitError = ref('')
const submitSuccess = ref<any>(null)
const timelineCalculated = ref(false)

// Configuration
const minProductionDays = 7

// Computed
const depositAmount = computed(() => Math.round(props.totalAmount * 0.5))
const remainingAmount = computed(() => props.totalAmount - depositAmount.value)

const minDeliveryDate = computed(() => {
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + minProductionDays)
  return minDate.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return preorderData.value.customer.firstName.trim() &&
         preorderData.value.customer.email.trim() &&
         preorderData.value.customer.phone.trim() &&
         preorderData.value.timeline.requestedDelivery &&
         preorderData.value.paymentMethod &&
         preorderData.value.agreedToTerms &&
         (preorderData.value.deliveryInfo.method === 'pickup' || 
          (preorderData.value.deliveryInfo.address.street.trim() && 
           preorderData.value.deliveryInfo.address.city.trim()))
})

// Méthodes
const hasFieldError = (fieldName: string): boolean => {
  return getFieldErrors(fieldName).length > 0
}

const getFieldError = (fieldName: string): string => {
  const errors = getFieldErrors(fieldName)
  return errors.length > 0 ? errors[0].message : ''
}

const onDeliveryMethodChange = () => {
  if (preorderData.value.deliveryInfo.method === 'pickup') {
    // Reset delivery address when switching to pickup
    preorderData.value.deliveryInfo.address = {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'CI'
    }
  }
}

const calculateTimeline = () => {
  const requestedDate = new Date(preorderData.value.timeline.requestedDelivery)
  const today = new Date()
  const diffTime = requestedDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  let productionDays = minProductionDays
  let isRushOrder = false
  let rushOrderFee = 0
  
  if (diffDays < minProductionDays) {
    // Commande urgente
    isRushOrder = true
    productionDays = Math.max(diffDays - 2, 3) // Minimum 3 jours
    rushOrderFee = Math.round(props.totalAmount * 0.15) // 15% de supplément
  } else if (diffDays < minProductionDays + 3) {
    // Commande express
    isRushOrder = true
    productionDays = diffDays - 2
    rushOrderFee = Math.round(props.totalAmount * 0.08) // 8% de supplément
  }
  
  const estimatedDelivery = new Date(requestedDate)
  estimatedDelivery.setDate(estimatedDelivery.getDate() - 1) // Livraison la veille
  
  preorderData.value.timeline = {
    ...preorderData.value.timeline,
    estimatedProduction: productionDays,
    estimatedDelivery: estimatedDelivery.toLocaleDateString('fr-FR'),
    isRushOrder,
    rushOrderFee: isRushOrder ? rushOrderFee : undefined
  }
  
  timelineCalculated.value = true
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const handleSubmit = async () => {
  try {
    submitError.value = ''
    submitSuccess.value = null
    clearValidationErrors()

    // Mise à jour des montants
    preorderData.value.depositAmount = depositAmount.value
    preorderData.value.remainingAmount = remainingAmount.value

    // Validation côté client
    const validation = validatePreorderForm(preorderData.value)
    if (!validation.isValid) {
      submitError.value = 'Veuillez corriger les erreurs dans le formulaire'
      return
    }

    // Soumission
    const response = await submitPreorderForm(preorderData.value)
    submitSuccess.value = response
    
    if (response.success) {
      emit('success', response.preorderId)
    }

  } catch (error: any) {
    submitError.value = error.message || 'Une erreur est survenue lors de la pré-commande'
  }
}

// Initialisation
onMounted(() => {
  calculateTimeline()
})
</script>

<style scoped>
.preorder-form {
  max-width: 900px;
  margin: 0 auto;
}

.preorder-form-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-header {
  padding: 2rem;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  text-align: center;
}

.form-title {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.form-description {
  font-size: 1.125rem;
  opacity: 0.9;
}

.preorder-form-content {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.order-summary {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.order-item:last-child {
  border-bottom: none;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.item-details {
  color: #6b7280;
  font-size: 0.925rem;
  margin-bottom: 0.5rem;
}

.item-customizations {
  font-size: 0.875rem;
  color: #374151;
}

.customization-label {
  font-weight: 500;
}

.item-customizations ul {
  margin: 0.25rem 0 0 1rem;
  padding: 0;
}

.item-price {
  font-weight: 600;
  color: #059669;
  font-size: 1.125rem;
}

.order-total {
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
}

.total-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.total-line.deposit {
  font-weight: 600;
  color: #059669;
  font-size: 1.125rem;
}

.total-line.remaining {
  color: #6b7280;
  font-style: italic;
}

.deposit-amount {
  background: #d1fae5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
  border-color: #ef4444;
}

.field-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.field-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.radio-option:hover {
  background-color: #f3f4f6;
}

.delivery-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.timeline-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

.timeline-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.timeline-label {
  color: #374151;
}

.timeline-value {
  font-weight: 600;
  color: #1e40af;
}

.rush-order-notice {
  color: #d97706;
  font-weight: 500;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fef3c7;
  border-radius: 4px;
}

.payment-amount {
  margin-bottom: 1.5rem;
}

.amount-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #d1fae5;
  border-radius: 8px;
  border: 2px solid #059669;
}

.amount-label {
  font-weight: 500;
  color: #065f46;
}

.amount-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #059669;
}

.payment-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.payment-option {
  cursor: pointer;
}

.payment-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.payment-option input:checked + .payment-card {
  border-color: #059669;
  background: #f0fdf4;
}

.payment-icon {
  font-size: 2rem;
}

.payment-details {
  flex: 1;
}

.payment-name {
  font-weight: 600;
  color: #1f2937;
}

.payment-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.terms-content {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
}

.terms-summary h4 {
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.terms-summary ul {
  color: #4b5563;
  margin-bottom: 1rem;
}

.checkbox-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label {
  color: #374151;
  line-height: 1.5;
}

.checkbox-label a {
  color: #059669;
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.form-error {
  padding: 1rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  margin-top: 1rem;
}

.form-success {
  padding: 1.5rem;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  margin-top: 1rem;
}

.success-content {
  display: flex;
  gap: 1rem;
}

.success-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.success-message h4 {
  color: #065f46;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.payment-instructions,
.next-steps {
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #d1fae5;
}

.payment-instructions h5,
.next-steps h5 {
  color: #065f46;
  margin-bottom: 0.5rem;
}

.due-date {
  color: #d97706;
  font-weight: 500;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .preorder-form-content {
    padding: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .payment-options {
    grid-template-columns: 1fr;
  }
  
  .order-item {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .amount-display {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>