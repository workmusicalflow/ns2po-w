<template>
  <div class="quote-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container mx-auto px-4">
        <div class="hero-content">
          <h1 class="hero-title">
            Calculateur de devis personnalisé
          </h1>
          <p class="hero-subtitle">
            Créez votre devis en quelques clics pour vos gadgets électoraux personnalisés
          </p>
          <div class="hero-features">
            <div class="feature">
              <span class="feature-icon">⚡</span>
              <span>Calcul en temps réel</span>
            </div>
            <div class="feature">
              <span class="feature-icon">💰</span>
              <span>Remises automatiques</span>
            </div>
            <div class="feature">
              <span class="feature-icon">📊</span>
              <span>Devis détaillé</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container mx-auto px-4">
        <!-- Navigation Steps -->
        <div class="steps-nav">
          <div class="steps-container">
            <div 
              v-for="(step, index) in steps"
              :key="step.id"
              :class="[
                'step',
                {
                  'step--active': currentStep === index,
                  'step--completed': index < currentStep,
                  'step--disabled': index > currentStep
                }
              ]"
              @click="goToStep(index)"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>
        </div>

        <!-- Step Content -->
        <div class="step-content">
          <!-- Étape 1: Informations client -->
          <div v-if="currentStep === 0" class="step-panel">
            <h2 class="step-title">Informations client</h2>
            <p class="step-description">
              Renseignez vos informations pour personnaliser votre devis
            </p>

            <form @submit.prevent="nextStep" class="customer-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Type de client *</label>
                  <select v-model="customerInfo.customerType" class="form-select" required>
                    <option value="">Sélectionner</option>
                    <option value="individual">Particulier</option>
                    <option value="party">Parti politique</option>
                    <option value="candidate">Candidat</option>
                    <option value="organization">Organisation</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Nom complet *</label>
                  <input 
                    v-model="customerInfo.firstName"
                    type="text" 
                    class="form-input" 
                    placeholder="Votre nom complet"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input 
                    v-model="customerInfo.email"
                    type="email" 
                    class="form-input" 
                    placeholder="votre@email.com"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Téléphone *</label>
                  <input 
                    v-model="customerInfo.phone"
                    type="tel" 
                    class="form-input" 
                    placeholder="+225 XX XX XX XX"
                    required
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Organisation/Parti</label>
                  <input 
                    v-model="customerInfo.company"
                    type="text" 
                    class="form-input" 
                    placeholder="Nom de votre organisation"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Ville</label>
                  <input 
                    v-model="customerInfo.address!.city"
                    type="text" 
                    class="form-input" 
                    placeholder="Abidjan, Bouaké, etc."
                  />
                </div>
              </div>

              <div class="form-actions">
                <Button type="submit" variant="primary">
                  Continuer vers les produits
                </Button>
              </div>
            </form>
          </div>

          <!-- Étape 2: Sélection produits -->
          <div v-else-if="currentStep === 1" class="step-panel">
            <h2 class="step-title">Sélection des produits</h2>
            <p class="step-description">
              Choisissez vos produits dans notre catalogue
            </p>

            <!-- Catalogue de produits -->
            <div class="product-catalog">
              <!-- Filtres -->
              <div class="catalog-filters">
                <div class="filter-group">
                  <label class="filter-label">Catégorie</label>
                  <select v-model="selectedCategory" @change="filterProducts" class="filter-select">
                    <option value="">Toutes les catégories</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                </div>

                <div class="filter-group">
                  <label class="filter-label">Recherche</label>
                  <input 
                    v-model="searchQuery"
                    @input="filterProducts"
                    type="text" 
                    class="filter-input" 
                    placeholder="Rechercher un produit..."
                  />
                </div>
              </div>

              <!-- Liste des produits -->
              <div class="products-grid">
                <div 
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="product-card"
                >
                  <div class="product-image">
                    <img 
                      :src="product.image || '/placeholder-product.jpg'"
                      :alt="product.name"
                      class="product-img"
                    />
                  </div>
                  
                  <div class="product-info">
                    <h3 class="product-name">{{ product.name }}</h3>
                    <p class="product-category">{{ product.category }}</p>
                    <p class="product-price">
                      À partir de {{ formatCurrency(product.basePrice) }}
                    </p>
                    <p class="product-min-qty">
                      Quantité minimum: {{ product.minQuantity }}
                    </p>
                  </div>

                  <div class="product-actions">
                    <Button 
                      @click="addProductToQuote(product)"
                      variant="primary"
                      size="small"
                      :disabled="isProductInQuote(product.id)"
                    >
                      {{ isProductInQuote(product.id) ? 'Déjà ajouté' : 'Ajouter' }}
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div v-if="totalPages > 1" class="pagination">
                <Button 
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  variant="outline"
                  size="small"
                >
                  Précédent
                </Button>
                
                <span class="pagination-info">
                  Page {{ currentPage }} sur {{ totalPages }}
                </span>
                
                <Button 
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  variant="outline"
                  size="small"
                >
                  Suivant
                </Button>
              </div>
            </div>

            <div class="step-actions">
              <Button @click="previousStep" variant="outline">
                Retour
              </Button>
              <Button 
                @click="nextStep" 
                variant="primary"
                :disabled="quoteItems.length === 0"
              >
                Configurer les produits ({{ quoteItems.length }})
              </Button>
            </div>
          </div>

          <!-- Étape 3: Configuration et calcul -->
          <div v-else-if="currentStep === 2" class="step-panel">
            <h2 class="step-title">Configuration et devis</h2>
            <p class="step-description">
              Configurez vos produits et obtenez votre devis détaillé
            </p>

            <QuoteCalculator
              :initial-items="quoteItems"
              :customer-type="customerInfo.customerType"
              :auto-calculate="true"
              @add-product="goToStep(1)"
              @quote-updated="onQuoteUpdated"
              @download-quote="downloadQuote"
              @send-quote="sendQuote"
              @save-quote="saveQuote"
              ref="calculatorRef"
            />

            <div class="step-actions">
              <Button @click="previousStep" variant="outline">
                Retour aux produits
              </Button>
              <Button 
                @click="nextStep" 
                variant="primary"
                :disabled="!currentCalculation"
              >
                Finaliser le devis
              </Button>
            </div>
          </div>

          <!-- Étape 4: Finalisation -->
          <div v-else-if="currentStep === 3" class="step-panel">
            <h2 class="step-title">Finalisation du devis</h2>
            <p class="step-description">
              Votre devis est prêt ! Choisissez comment procéder.
            </p>

            <div v-if="currentCalculation" class="quote-summary-final">
              <!-- Résumé client -->
              <div class="summary-section">
                <h3 class="summary-title">Informations client</h3>
                <div class="customer-summary">
                  <p><strong>Nom:</strong> {{ customerInfo.firstName }}</p>
                  <p><strong>Email:</strong> {{ customerInfo.email }}</p>
                  <p><strong>Type:</strong> {{ getCustomerTypeLabel(customerInfo.customerType) }}</p>
                  <p v-if="customerInfo.company"><strong>Organisation:</strong> {{ customerInfo.company }}</p>
                </div>
              </div>

              <!-- Résumé produits -->
              <div class="summary-section">
                <h3 class="summary-title">Produits commandés</h3>
                <div class="products-summary">
                  <div 
                    v-for="item in quoteItems"
                    :key="item.id"
                    class="product-summary-item"
                  >
                    <span class="product-summary-name">{{ item.product?.name }}</span>
                    <span class="product-summary-qty">{{ item.quantity }} unités</span>
                    <span class="product-summary-price">{{ formatCurrency(getItemTotal(item)) }}</span>
                  </div>
                </div>
              </div>

              <!-- Total final -->
              <div class="summary-section">
                <div class="final-total">
                  <div class="total-breakdown">
                    <div class="total-line">
                      <span>Sous-total:</span>
                      <span>{{ formatCurrency(currentCalculation.subtotal) }}</span>
                    </div>
                    <div v-if="currentCalculation.discountAmount > 0" class="total-line discount">
                      <span>Remises:</span>
                      <span>-{{ formatCurrency(currentCalculation.discountAmount) }}</span>
                    </div>
                    <div class="total-line">
                      <span>TVA:</span>
                      <span>{{ formatCurrency(currentCalculation.taxAmount) }}</span>
                    </div>
                    <div class="total-line final">
                      <span>Total TTC:</span>
                      <span class="final-amount">{{ formatCurrency(currentCalculation.totalAmount) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions finales -->
              <div class="final-actions">
                <div class="action-grid">
                  <Button @click="downloadPDF" variant="primary" class="action-btn">
                    📄 Télécharger le devis PDF
                  </Button>
                  
                  <Button @click="sendByEmail" variant="secondary" class="action-btn">
                    ✉️ Envoyer par email
                  </Button>
                  
                  <Button @click="startPreorder" variant="outline" class="action-btn">
                    🛒 Passer la pré-commande
                  </Button>
                  
                  <Button @click="requestMeeting" variant="outline" class="action-btn">
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
              <Button @click="previousStep" variant="outline">
                Modifier le devis
              </Button>
              <Button @click="startNewQuote" variant="secondary">
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
import { Button, Card, Input } from '@ns2po/ui'
import type { CustomerInfo, Product, QuoteItem, QuoteCalculation } from '@ns2po/types'

// Import du composant QuoteCalculator (sera créé si nécessaire)
// import QuoteCalculator from '~/components/QuoteCalculator.vue'

useHead({
  title: 'Devis - NS2PO Élections',
  meta: [
    {
      name: 'description',
      content: 'Générez votre devis personnalisé pour vos gadgets de campagne électorale'
    }
  ]
})

// Variables d'état pour les étapes
const currentStep = ref(0)

const steps = [
  { id: 'customer', label: 'Informations' },
  { id: 'products', label: 'Produits' },
  { id: 'calculate', label: 'Configuration' },
  { id: 'finalize', label: 'Finalisation' }
]

// État réactif
const customerInfo = ref<Partial<CustomerInfo>>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  customerType: undefined,
  address: {
    street: '',
    city: '',
    region: '',
    country: 'CI'
  }
})

// État des produits
const categories = ref<any[]>([])
const filteredProducts = ref<Product[]>([])
const selectedCategory = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const quoteItems = ref<QuoteItem[]>([])
const currentCalculation = ref<QuoteCalculation | null>(null)

// Refs pour composants
const calculatorRef = ref(null)

// Méthodes de navigation
const goToStep = (step: number) => {
  if (step >= 0 && step < steps.length) {
    currentStep.value = step
  }
}

const nextStep = () => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// Méthodes de filtrage produits
const filterProducts = () => {
  // Simulation du filtrage des produits
  console.log('Filtrage des produits:', { selectedCategory: selectedCategory.value, searchQuery: searchQuery.value })
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Méthodes de gestion des produits
const addProductToQuote = (product: Product) => {
  const newItem: QuoteItem = {
    id: `item-${Date.now()}`,
    productId: product.id,
    product: product,
    quantity: product.minQuantity,
    unitPrice: product.basePrice,
    customizations: [],
    totalPrice: product.basePrice * product.minQuantity
  }
  quoteItems.value.push(newItem)
}

const isProductInQuote = (productId: string): boolean => {
  return quoteItems.value.some(item => item.productId === productId)
}

const getItemTotal = (item: QuoteItem): number => {
  return item.totalPrice
}

// Méthodes de calcul
const onQuoteUpdated = (calculation: QuoteCalculation) => {
  currentCalculation.value = calculation
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount)
}

const getCustomerTypeLabel = (type?: string): string => {
  const labels: Record<string, string> = {
    individual: 'Particulier',
    party: 'Parti politique',
    candidate: 'Candidat',
    organization: 'Organisation'
  }
  return labels[type || ''] || type || 'Non spécifié'
}

// Actions finales
const downloadQuote = () => {
  console.log('Téléchargement du devis')
}

const sendQuote = () => {
  console.log('Envoi du devis par email')
}

const saveQuote = () => {
  console.log('Sauvegarde du devis')
}

const downloadPDF = () => {
  console.log('Téléchargement PDF')
}

const sendByEmail = () => {
  console.log('Envoi par email')
}

const startPreorder = () => {
  navigateTo('/precommande')
}

const requestMeeting = () => {
  console.log('Demande de rendez-vous')
}

const startNewQuote = () => {
  // Réinitialiser le formulaire
  currentStep.value = 0
  customerInfo.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    customerType: undefined,
    address: {
      street: '',
      city: '',
      region: '',
      country: 'CI'
    }
  }
  quoteItems.value = []
  currentCalculation.value = null
}
</script>