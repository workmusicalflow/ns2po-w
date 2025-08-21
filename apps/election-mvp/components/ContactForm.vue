<template>
  <div class="contact-form">
    <Card class="contact-form-card">
      <template #header>
        <div class="form-header">
          <h2 class="form-title">{{ getFormTitle() }}</h2>
          <p class="form-description">{{ getFormDescription() }}</p>
        </div>
      </template>

      <form @submit.prevent="handleSubmit" class="contact-form-content">
        <!-- Type de contact -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Type de demande *</label>
            <select v-model="formData.type" @change="onTypeChange" class="form-select" required>
              <option value="">Sélectionner</option>
              <option value="quote">Demande de devis</option>
              <option value="preorder">Pré-commande</option>
              <option value="custom">Projet personnalisé</option>
              <option value="support">Support/Question</option>
              <option value="meeting">Demande de rendez-vous</option>
            </select>
          </div>
        </div>

        <!-- Informations client -->
        <div class="form-section">
          <h3 class="section-title">Vos informations</h3>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Prénom *</label>
              <input 
                v-model="formData.customer.firstName"
                type="text" 
                class="form-input"
                :class="{ 'error': hasFieldError('customer.firstName') }"
                placeholder="Votre prénom"
                required
              />
              <div v-if="hasFieldError('customer.firstName')" class="field-error">
                {{ getFieldError('customer.firstName') }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nom *</label>
              <input 
                v-model="formData.customer.lastName"
                type="text" 
                class="form-input"
                :class="{ 'error': hasFieldError('customer.lastName') }"
                placeholder="Votre nom"
                required
              />
              <div v-if="hasFieldError('customer.lastName')" class="field-error">
                {{ getFieldError('customer.lastName') }}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Email *</label>
              <input 
                v-model="formData.customer.email"
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
                v-model="formData.customer.phone"
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
              <label class="form-label">Type de client</label>
              <select v-model="formData.customer.customerType" class="form-select">
                <option value="">Sélectionner</option>
                <option value="individual">Particulier</option>
                <option value="party">Parti politique</option>
                <option value="organization">Organisation</option>
              </select>
            </div>

            <div class="form-group" v-if="formData.customer.customerType !== 'individual'">
              <label class="form-label">Organisation/Parti</label>
              <input 
                v-model="formData.customer.company"
                type="text" 
                class="form-input"
                placeholder="Nom de votre organisation"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Ville</label>
              <input 
                v-model="formData.customer.address.city"
                type="text" 
                class="form-input"
                placeholder="Abidjan, Bouaké, etc."
              />
            </div>
          </div>
        </div>

        <!-- Détails de la demande -->
        <div class="form-section">
          <h3 class="section-title">Détails de votre demande</h3>
          
          <div class="form-group">
            <label class="form-label">Sujet *</label>
            <input 
              v-model="formData.subject"
              type="text" 
              class="form-input"
              :class="{ 'error': hasFieldError('subject') }"
              :placeholder="getSubjectPlaceholder()"
              required
            />
            <div v-if="hasFieldError('subject')" class="field-error">
              {{ getFieldError('subject') }}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Message détaillé *</label>
            <textarea 
              v-model="formData.message"
              class="form-textarea"
              :class="{ 'error': hasFieldError('message') }"
              :placeholder="getMessagePlaceholder()"
              rows="6"
              required
            ></textarea>
            <div v-if="hasFieldError('message')" class="field-error">
              {{ getFieldError('message') }}
            </div>
            <div class="field-hint">
              Minimum 10 caractères ({{ formData.message.length }}/10)
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Priorité</label>
            <select v-model="formData.priority" class="form-select">
              <option value="normal">Normale</option>
              <option value="high">Élevée</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Méthode de contact préférée</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="formData.preferredContactMethod" value="email" />
                <span class="radio-label">📧 Email</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="formData.preferredContactMethod" value="phone" />
                <span class="radio-label">📞 Téléphone</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="formData.preferredContactMethod" value="whatsapp" />
                <span class="radio-label">💬 WhatsApp</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Champs spécifiques selon le type -->
        <div v-if="formData.type === 'quote'" class="form-section">
          <h3 class="section-title">Informations devis</h3>
          <div class="form-group">
            <label class="form-label">Quantité estimée</label>
            <input 
              v-model.number="additionalData.estimatedQuantity"
              type="number" 
              class="form-input"
              placeholder="Nombre d'articles souhaités"
              min="1"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Budget approximatif</label>
            <select v-model="additionalData.budgetRange" class="form-select">
              <option value="">À discuter</option>
              <option value="under_100k">Moins de 100,000 FCFA</option>
              <option value="100k_500k">100,000 - 500,000 FCFA</option>
              <option value="500k_1m">500,000 - 1,000,000 FCFA</option>
              <option value="1m_plus">Plus de 1,000,000 FCFA</option>
            </select>
          </div>
        </div>

        <div v-if="formData.type === 'meeting'" class="form-section">
          <h3 class="section-title">Préférences de rendez-vous</h3>
          <div class="form-group">
            <label class="form-label">Date souhaitée 1 *</label>
            <input 
              v-model="additionalData.preferredDate1"
              type="date" 
              class="form-input"
              :min="minDate"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">Date alternative (optionnel)</label>
            <input 
              v-model="additionalData.preferredDate2"
              type="date" 
              class="form-input"
              :min="minDate"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Créneau horaire préféré</label>
            <select v-model="additionalData.preferredTimeSlot" class="form-select">
              <option value="morning">Matinée (8h-12h)</option>
              <option value="afternoon">Après-midi (14h-17h)</option>
              <option value="evening">Soirée (17h-19h)</option>
            </select>
          </div>
        </div>

        <!-- Pièces jointes -->
        <div class="form-section">
          <h3 class="section-title">Pièces jointes (optionnel)</h3>
          <CloudinaryUpload
            v-if="formData.type === 'custom'"
            @upload-success="onFileUploaded"
            @upload-error="onUploadError"
            :multiple="true"
            :max-files="5"
            accept="image/*,.pdf,.doc,.docx"
            class="file-upload"
          />
          <div v-else class="upload-placeholder">
            <p>Les pièces jointes seront disponibles pour les projets personnalisés</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <Button 
            type="button" 
            variant="outline" 
            @click="resetForm"
            :disabled="isSubmitting"
          >
            Réinitialiser
          </Button>
          
          <Button 
            type="submit" 
            variant="primary"
            :disabled="isSubmitting || !isFormValid"
            :loading="isSubmitting"
          >
            {{ isSubmitting ? 'Envoi en cours...' : getSubmitButtonText() }}
          </Button>
        </div>

        <!-- Messages d'erreur global -->
        <div v-if="submitError" class="form-error">
          <p>{{ submitError }}</p>
        </div>

        <!-- Message de succès -->
        <div v-if="submitSuccess" class="form-success">
          <div class="success-content">
            <div class="success-icon">✅</div>
            <div class="success-message">
              <h4>{{ submitSuccess.message }}</h4>
              <ul v-if="submitSuccess.nextSteps">
                <li v-for="step in submitSuccess.nextSteps" :key="step">{{ step }}</li>
              </ul>
              <p v-if="submitSuccess.estimatedResponseTime" class="response-time">
                <strong>Délai de réponse estimé:</strong> {{ submitSuccess.estimatedResponseTime }}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Button, Card } from '@ns2po/ui'
import type { ContactFormData, ContactType } from '@ns2po/types'
import CloudinaryUpload from './CloudinaryUpload.vue'

// Composables
const { 
  submitContactForm, 
  validateContactForm, 
  isSubmitting, 
  validationErrors,
  getFieldErrors,
  clearValidationErrors 
} = useContactForm()

// Props
interface Props {
  initialType?: ContactType
  relatedQuoteId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialType: undefined,
  relatedQuoteId: undefined
})

// État réactif
const formData = ref<ContactFormData>({
  type: props.initialType || 'quote',
  customer: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    customerType: '',
    company: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'CI'
    }
  },
  subject: '',
  message: '',
  priority: 'normal',
  preferredContactMethod: 'email',
  urgency: 'normal',
  relatedQuote: props.relatedQuoteId
})

const additionalData = ref({
  estimatedQuantity: null,
  budgetRange: '',
  preferredDate1: '',
  preferredDate2: '',
  preferredTimeSlot: 'morning'
})

const submitError = ref('')
const submitSuccess = ref<any>(null)

// Computed
const minDate = computed(() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return formData.value.customer.firstName.trim() &&
         formData.value.customer.lastName.trim() &&
         formData.value.customer.email.trim() &&
         formData.value.customer.phone.trim() &&
         formData.value.subject.trim() &&
         formData.value.message.trim().length >= 10
})

// Méthodes
const onTypeChange = () => {
  clearValidationErrors()
  submitError.value = ''
  submitSuccess.value = null
}

const getFormTitle = () => {
  const titles = {
    quote: 'Demande de devis',
    preorder: 'Pré-commande',
    custom: 'Projet personnalisé',
    support: 'Support & Questions',
    meeting: 'Demande de rendez-vous'
  }
  return titles[formData.value.type] || 'Contactez-nous'
}

const getFormDescription = () => {
  const descriptions = {
    quote: 'Obtenez un devis personnalisé pour vos gadgets électoraux',
    preorder: 'Passez votre pré-commande en toute simplicité',
    custom: 'Décrivez votre projet sur-mesure, nous le réaliserons',
    support: 'Posez-nous vos questions, nous sommes là pour vous aider',
    meeting: 'Planifions un rendez-vous pour discuter de votre projet'
  }
  return descriptions[formData.value.type] || 'Remplissez le formulaire ci-dessous'
}

const getSubjectPlaceholder = () => {
  const placeholders = {
    quote: 'Ex: Devis pour 500 t-shirts personnalisés',
    preorder: 'Ex: Pré-commande casquettes campagne présidentielle',
    custom: 'Ex: Création logo et merchandise pour parti politique',
    support: 'Ex: Question sur les délais de livraison',
    meeting: 'Ex: RDV pour présentation catalogue 2024'
  }
  return placeholders[formData.value.type] || 'Résumez votre demande en quelques mots'
}

const getMessagePlaceholder = () => {
  const placeholders = {
    quote: 'Décrivez précisément vos besoins : type de produits, quantités, personnalisations souhaitées, délais, budget approximatif...',
    preorder: 'Détaillez votre commande : produits sélectionnés, quantités, personnalisations, date de livraison souhaitée...',
    custom: 'Décrivez votre projet : objectifs, style souhaité, public cible, budget, contraintes techniques...',
    support: 'Expliquez votre question ou problème en détail pour que nous puissions vous aider au mieux...',
    meeting: 'Précisez l\'objet du rendez-vous, les points à aborder, le nombre de participants...'
  }
  return placeholders[formData.value.type] || 'Décrivez votre demande en détail...'
}

const getSubmitButtonText = () => {
  const texts = {
    quote: 'Demander un devis',
    preorder: 'Valider la pré-commande',
    custom: 'Soumettre le projet',
    support: 'Envoyer la question',
    meeting: 'Demander le rendez-vous'
  }
  return texts[formData.value.type] || 'Envoyer'
}

const hasFieldError = (fieldName: string): boolean => {
  return getFieldErrors(fieldName).length > 0
}

const getFieldError = (fieldName: string): string => {
  const errors = getFieldErrors(fieldName)
  return errors.length > 0 ? errors[0].message : ''
}

const onFileUploaded = (file: any) => {
  if (!formData.value.attachments) {
    formData.value.attachments = []
  }
  formData.value.attachments.push({
    id: file.public_id,
    name: file.original_filename,
    url: file.secure_url,
    size: file.bytes,
    type: file.resource_type
  })
}

const onUploadError = (error: any) => {
  console.error('Erreur upload:', error)
}

const handleSubmit = async () => {
  try {
    submitError.value = ''
    submitSuccess.value = null
    clearValidationErrors()

    // Validation côté client
    const validation = validateContactForm(formData.value)
    if (!validation.isValid) {
      submitError.value = 'Veuillez corriger les erreurs dans le formulaire'
      return
    }

    // Soumission
    const response = await submitContactForm(formData.value)
    submitSuccess.value = response
    
    // Reset du formulaire après succès
    if (response.success) {
      setTimeout(() => {
        resetForm()
      }, 5000)
    }

  } catch (error: any) {
    submitError.value = error.message || 'Une erreur est survenue lors de l\'envoi'
  }
}

const resetForm = () => {
  formData.value = {
    type: props.initialType || 'quote',
    customer: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      customerType: '',
      company: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        region: '',
        postalCode: '',
        country: 'CI'
      }
    },
    subject: '',
    message: '',
    priority: 'normal',
    preferredContactMethod: 'email',
    urgency: 'normal'
  }
  
  additionalData.value = {
    estimatedQuantity: null,
    budgetRange: '',
    preferredDate1: '',
    preferredDate2: '',
    preferredTimeSlot: 'morning'
  }
  
  submitError.value = ''
  submitSuccess.value = null
  clearValidationErrors()
}

// Auto-focus sur le premier champ
onMounted(() => {
  const firstInput = document.querySelector('.form-input') as HTMLInputElement
  if (firstInput) {
    firstInput.focus()
  }
})
</script>

<style scoped>
.contact-form {
  max-width: 800px;
  margin: 0 auto;
}

.contact-form-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-header {
  padding: 2rem;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
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

.contact-form-content {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
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

.radio-label {
  font-size: 0.925rem;
  color: #374151;
}

.upload-placeholder {
  padding: 2rem;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  text-align: center;
  color: #6b7280;
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
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
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
  color: #0369a1;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.success-message ul {
  color: #0369a1;
  margin: 0.5rem 0;
  padding-left: 1.25rem;
}

.success-message li {
  margin-bottom: 0.25rem;
}

.response-time {
  color: #0369a1;
  font-size: 0.925rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .contact-form-content {
    padding: 1rem;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>