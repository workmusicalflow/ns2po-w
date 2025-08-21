/**
 * Composable pour la gestion des formulaires de contact et pré-commandes
 */

import type {
  ContactFormData,
  PreorderFormData,
  CustomRequestFormData,
  MeetingRequestFormData,
  ContactType,
  FormValidationResult,
  FormFieldError,
  ContactSubmissionResponse,
  PreorderSubmissionResponse
} from '@ns2po/types'

export const useContactForm = () => {
  // État réactif
  const isSubmitting = ref(false)
  const lastSubmission = ref<any>(null)
  const validationErrors = ref<FormFieldError[]>([])

  /**
   * Valide un formulaire de contact
   */
  const validateContactForm = (formData: Partial<ContactFormData>): FormValidationResult => {
    const errors: FormFieldError[] = []

    // Validation des champs obligatoires
    if (!formData.customer?.firstName?.trim()) {
      errors.push({
        field: 'customer.firstName',
        message: 'Le nom est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    }

    if (!formData.customer?.email?.trim()) {
      errors.push({
        field: 'customer.email',
        message: 'L\'email est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    } else if (!isValidEmail(formData.customer.email)) {
      errors.push({
        field: 'customer.email',
        message: 'Format d\'email invalide',
        code: 'INVALID_EMAIL'
      })
    }

    if (!formData.customer?.phone?.trim()) {
      errors.push({
        field: 'customer.phone',
        message: 'Le téléphone est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    }

    if (!formData.subject?.trim()) {
      errors.push({
        field: 'subject',
        message: 'Le sujet est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    }

    if (!formData.message?.trim()) {
      errors.push({
        field: 'message',
        message: 'Le message est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    } else if (formData.message.length < 10) {
      errors.push({
        field: 'message',
        message: 'Le message doit contenir au moins 10 caractères',
        code: 'MIN_LENGTH'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Valide un formulaire de pré-commande
   */
  const validatePreorderForm = (formData: Partial<PreorderFormData>): FormValidationResult => {
    const errors: FormFieldError[] = []

    // Validation client
    const customerValidation = validateCustomerInfo(formData.customer)
    errors.push(...customerValidation.errors)

    // Validation items
    if (!formData.items || formData.items.length === 0) {
      errors.push({
        field: 'items',
        message: 'Au moins un produit doit être sélectionné',
        code: 'REQUIRED_FIELD'
      })
    }

    // Validation montants
    if (!formData.totalAmount || formData.totalAmount <= 0) {
      errors.push({
        field: 'totalAmount',
        message: 'Le montant total doit être positif',
        code: 'INVALID_AMOUNT'
      })
    }

    // Validation adresse de livraison
    if (formData.deliveryInfo?.method === 'delivery') {
      if (!formData.deliveryInfo.address?.street?.trim()) {
        errors.push({
          field: 'deliveryInfo.address.street',
          message: 'L\'adresse de livraison est obligatoire',
          code: 'REQUIRED_FIELD'
        })
      }
      if (!formData.deliveryInfo.address?.city?.trim()) {
        errors.push({
          field: 'deliveryInfo.address.city',
          message: 'La ville de livraison est obligatoire',
          code: 'REQUIRED_FIELD'
        })
      }
    }

    // Validation accord conditions
    if (!formData.agreedToTerms) {
      errors.push({
        field: 'agreedToTerms',
        message: 'Vous devez accepter les conditions générales',
        code: 'TERMS_NOT_ACCEPTED'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Valide les informations client
   */
  const validateCustomerInfo = (customer: any): FormValidationResult => {
    const errors: FormFieldError[] = []

    if (!customer) {
      errors.push({
        field: 'customer',
        message: 'Les informations client sont obligatoires',
        code: 'REQUIRED_FIELD'
      })
      return { isValid: false, errors }
    }

    if (!customer.firstName?.trim()) {
      errors.push({
        field: 'customer.firstName',
        message: 'Le nom est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    }

    if (!customer.email?.trim()) {
      errors.push({
        field: 'customer.email',
        message: 'L\'email est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    }

    if (!customer.phone?.trim()) {
      errors.push({
        field: 'customer.phone',
        message: 'Le téléphone est obligatoire',
        code: 'REQUIRED_FIELD'
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Soumet un formulaire de contact
   */
  const submitContactForm = async (formData: ContactFormData): Promise<ContactSubmissionResponse> => {
    isSubmitting.value = true
    validationErrors.value = []

    try {
      // Validation
      const validation = validateContactForm(formData)
      if (!validation.isValid) {
        validationErrors.value = validation.errors
        throw new Error('Erreurs de validation')
      }

      // Préparation des données
      const payload = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'new' as const
      }

      // Appel API
      const response = await $fetch('/api/contact/submit', {
        method: 'POST',
        body: payload
      }) as any

      lastSubmission.value = response.data

      return {
        success: true,
        contactId: response.data.id,
        message: 'Votre message a été envoyé avec succès!',
        nextSteps: [
          'Nous traiterons votre demande dans les plus brefs délais',
          'Vous recevrez une confirmation par email',
          'Un membre de notre équipe vous contactera sous 24h'
        ],
        estimatedResponseTime: '24 heures'
      }

    } catch (error: any) {
      console.error('Erreur soumission contact:', error)
      throw new Error(error.message || 'Erreur lors de l\'envoi du message')
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Soumet un formulaire de pré-commande
   */
  const submitPreorderForm = async (formData: PreorderFormData): Promise<PreorderSubmissionResponse> => {
    isSubmitting.value = true
    validationErrors.value = []

    try {
      // Validation
      const validation = validatePreorderForm(formData)
      if (!validation.isValid) {
        validationErrors.value = validation.errors
        throw new Error('Erreurs de validation')
      }

      // Calcul des montants
      const depositAmount = Math.round(formData.totalAmount * 0.5) // 50% d'acompte
      const remainingAmount = formData.totalAmount - depositAmount

      // Préparation des données
      const payload = {
        ...formData,
        depositAmount,
        remainingAmount,
        createdAt: new Date().toISOString(),
        status: 'submitted' as const
      }

      // Appel API
      const response = await $fetch('/api/preorder/submit', {
        method: 'POST',
        body: payload
      }) as any

      lastSubmission.value = response.data

      return {
        success: true,
        preorderId: response.data.id,
        trackingReference: response.data.trackingReference,
        trackingUrl: response.data.trackingUrl,
        message: 'Votre pré-commande a été enregistrée avec succès!',
        paymentInstructions: {
          method: formData.paymentMethod,
          amount: depositAmount,
          reference: response.data.paymentReference,
          details: generatePaymentDetails(formData.paymentMethod, depositAmount, response.data.paymentReference),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
        },
        nextSteps: [
          'Effectuez le versement de l\'acompte dans les 7 jours',
          'Nous confirmerons votre commande après réception du paiement',
          'La production démarrera dès confirmation',
          'Vous serez informé(e) des étapes de production'
        ],
        estimatedDelivery: calculateEstimatedDelivery(formData.timeline?.estimatedProduction || 7)
      }

    } catch (error: any) {
      console.error('Erreur soumission pré-commande:', error)
      throw new Error(error.message || 'Erreur lors de l\'enregistrement de la pré-commande')
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Soumet une demande personnalisée
   */
  const submitCustomRequest = async (formData: CustomRequestFormData) => {
    isSubmitting.value = true

    try {
      const payload = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'new' as const
      }

      const response = await $fetch('/api/custom-request/submit', {
        method: 'POST',
        body: payload
      })

      return response
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Soumet une demande de rendez-vous
   */
  const submitMeetingRequest = async (formData: MeetingRequestFormData) => {
    isSubmitting.value = true

    try {
      const payload = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'requested' as const
      }

      const response = await $fetch('/api/meeting/request', {
        method: 'POST',
        body: payload
      })

      return response
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Génère les détails de paiement selon la méthode
   */
  const generatePaymentDetails = (method: string, amount: number, reference: string) => {
    const details = {
      instructions: [] as string[]
    }

    switch (method) {
      case 'bank_transfer':
        details.instructions = [
          'Effectuez un virement bancaire sur notre compte :',
          'Banque: [NOM_BANQUE]',
          'Compte: [NUMERO_COMPTE]',
          'Référence: ' + reference,
          'Montant: ' + formatCurrency(amount)
        ]
        break
      
      case 'mobile_money':
        details.instructions = [
          'Envoyez le montant via Mobile Money :',
          'Numéro: [NUMERO_MOBILE_MONEY]',
          'Montant: ' + formatCurrency(amount),
          'Référence: ' + reference,
          'Conservez le reçu de transaction'
        ]
        break
      
      case 'cash':
        details.instructions = [
          'Apportez le montant en espèces à nos bureaux :',
          'Adresse: [ADRESSE_BUREAU]',
          'Heures d\'ouverture: Lun-Ven 8h-17h',
          'Référence: ' + reference,
          'Montant: ' + formatCurrency(amount)
        ]
        break
    }

    return details
  }

  /**
   * Calcule la date de livraison estimée
   */
  const calculateEstimatedDelivery = (productionDays: number): string => {
    const deliveryBuffer = 3 // 3 jours de buffer
    const totalDays = productionDays + deliveryBuffer
    const deliveryDate = new Date()
    deliveryDate.setDate(deliveryDate.getDate() + totalDays)
    
    return deliveryDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Formate un montant en FCFA
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-CI', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Valide un email
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Valide un numéro de téléphone ivoirien
   */
  const isValidIvorianPhone = (phone: string): boolean => {
    // Format attendu: +225 XX XX XX XX ou 0X XX XX XX XX
    const phoneRegex = /^(\+225|0)[0-9\s]{8,10}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  /**
   * Nettoie les erreurs de validation
   */
  const clearValidationErrors = () => {
    validationErrors.value = []
  }

  /**
   * Obtient les erreurs pour un champ spécifique
   */
  const getFieldErrors = (fieldName: string): FormFieldError[] => {
    return validationErrors.value.filter(error => error.field === fieldName)
  }

  return {
    // État
    isSubmitting: readonly(isSubmitting),
    lastSubmission: readonly(lastSubmission),
    validationErrors: readonly(validationErrors),

    // Méthodes de validation
    validateContactForm,
    validatePreorderForm,
    validateCustomerInfo,

    // Méthodes de soumission
    submitContactForm,
    submitPreorderForm,
    submitCustomRequest,
    submitMeetingRequest,

    // Utilitaires
    isValidEmail,
    isValidIvorianPhone,
    formatCurrency,
    clearValidationErrors,
    getFieldErrors
  }
}