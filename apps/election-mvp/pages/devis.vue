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
                    v-model="customerInfo.address.city"
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
                      :src="product.images[0]?.url || '/placeholder-product.jpg'"
                      :alt="product.name"
                      class="product-img"
                    />
                  </div>
                  
                  <div class="product-info">
                    <h3 class="product-name">{{ product.name }}</h3>
                    <p class="product-category">{{ product.category?.name }}</p>
                    <p class="product-price">
                      À partir de {{ formatCurrency(product.basePrice) }}
                    </p>
                    <p class="product-min-qty">
                      Quantité minimum: {{ product.minimumQuantity }}
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

useHead({
  title: 'Devis - NS2PO Élections',
  meta: [
    {
      name: 'description',
      content: 'Générez votre devis personnalisé pour vos gadgets de campagne électorale'
    }
  ]
})

// État réactif
const clientInfo = ref({
  name: '',
  email: '',
  phone: '',
  organization: ''
})

const selectedProducts = ref([
  // Produits d'exemple
  {
    id: 'prod-1',
    name: 'T-shirt personnalisé',
    category: 'Textile',
    basePrice: 12,
    quantity: 100,
    minQuantity: 50,
    maxQuantity: 5000,
    total: 1200
  }
])

const customization = ref({
  message: '',
  logo: null,
  primaryColor: '#1e40af',
  secondaryColor: '#ffffff'
})

// Computed values
const subtotal = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + item.total, 0)
})

const customizationCost = computed(() => {
  // Coût de personnalisation basé sur le nombre de produits
  const baseCustomizationCost = 50 // Coût de base pour la personnalisation
  const perItemCost = 1 // Coût par article
  const totalItems = selectedProducts.value.reduce((sum, item) => sum + item.quantity, 0)
  
  return baseCustomizationCost + (totalItems * perItemCost)
})

const vatAmount = computed(() => {
  return (subtotal.value + customizationCost.value) * 0.18
})

const totalAmount = computed(() => {
  return subtotal.value + customizationCost.value + vatAmount.value
})

const canGenerateQuote = computed(() => {
  return clientInfo.value.name && 
         clientInfo.value.email && 
         selectedProducts.value.length > 0
})

// Méthodes
const updateQuantity = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const quantity = parseInt(target.value) || 0
  const product = selectedProducts.value[index]
  
  if (quantity >= product.minQuantity && quantity <= product.maxQuantity) {
    product.quantity = quantity
    product.total = quantity * product.basePrice
  }
}

const removeProduct = (index: number) => {
  selectedProducts.value.splice(index, 1)
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price)
}

const generateQuote = async () => {
  try {
    // TODO: Générer PDF avec jsPDF ou appel API
    console.log('Génération du devis PDF...')
    
    // Simulation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Ici on déclencherait le téléchargement du PDF
    alert('Devis généré avec succès!')
  } catch (error) {
    console.error('Erreur lors de la génération du devis:', error)
  }
}

const submitPreOrder = async () => {
  try {
    // TODO: Soumettre la pré-commande via API
    console.log('Soumission de la pré-commande...')
    
    const orderData = {
      client: clientInfo.value,
      products: selectedProducts.value,
      customization: customization.value,
      totals: {
        subtotal: subtotal.value,
        customization: customizationCost.value,
        vat: vatAmount.value,
        total: totalAmount.value
      }
    }
    
    // Simulation d'appel API
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    alert('Pré-commande soumise avec succès! Nous vous contacterons sous 24h.')
    
    // Redirection vers page de confirmation
    navigateTo('/confirmation')
  } catch (error) {
    console.error('Erreur lors de la soumission:', error)
  }
}
</script>