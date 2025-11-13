// composables/useEmailQuote.ts
import { ref } from 'vue'

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteFormData {
  name: string;
  phone: string;
  email: string;
  channel: 'email' | 'whatsapp';
  items: CartItem[];
  total: number;
  timestamp: string;
}

interface EmailQuoteResponse {
  success: boolean;
  reference?: string;
  message?: string;
  trackingUrl?: string;
}

export function useEmailQuote() {
  const isSubmitting = ref(false);
  const hasSubmitted = ref(false);
  const submitSuccess = ref(false);
  const error = ref<string | null>(null);
  const quoteReference = ref<string | null>(null);
  const trackingUrl = ref<string | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const transformQuoteData = (formData: QuoteFormData, selectedMode: 'bundle' | 'custom', cartItems: CartItem[]) => {
    return {
      type: 'quote',
      customer: {
        firstName: formData.name?.split(' ')[0] || 'Prénom',
        lastName: formData.name?.split(' ').slice(1).join(' ') || 'Nom',
        email: formData.email.trim(),
        phone: formData.phone.trim()
      },
      subject: `Demande de devis électoral - ${formData.name}`,
      message: `Bonjour,

Je souhaite recevoir un devis détaillé pour ma campagne électorale.

Type de projet: ${selectedMode === 'bundle' ? 'Pack Campagne NS2PO' : 'Sélection personnalisée'}
Budget total estimé: ${formatCurrency(formData.total)}

Détails de ma sélection:
${cartItems.map(item => `- ${item.name} (Qté: ${item.quantity}, Prix: ${formatCurrency(item.total)})`).join('\n')}

Merci de me recontacter rapidement pour finaliser cette demande.

Cordialement,
${formData.name}`,
      priority: 'high',
      preferredContactMethod: 'email',
      urgency: 'normal',
      orderDetails: {
        mode: selectedMode,
        items: cartItems.map(item => ({
          productName: item.name,
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice || (item.total / item.quantity),
          total: item.total
        })),
        totalAmount: formData.total,
        currency: 'XOF',
        campaignType: 'electoral'
      }
    };
  };

  const validateEmailData = (formData: QuoteFormData): boolean => {
    if (!formData.email || !formData.email.includes('@')) {
      error.value = 'Adresse email invalide ou manquante';
      return false;
    }

    if (!formData.name?.trim()) {
      error.value = 'Le nom est requis';
      return false;
    }

    if (!formData.phone?.trim()) {
      error.value = 'Le numéro de téléphone est requis';
      return false;
    }

    return true;
  };

  const submitEmailQuote = async (
    formData: QuoteFormData,
    selectedMode: 'bundle' | 'custom',
    cartItems: CartItem[]
  ): Promise<EmailQuoteResponse> => {
    isSubmitting.value = true;
    error.value = null;
    submitSuccess.value = false;

    try {
      console.log('📧 Démarrage soumission email quote:', formData);

      // Validation côté client
      if (!validateEmailData(formData)) {
        throw new Error(error.value || 'Données invalides');
      }

      // Transformation des données
      const emailData = transformQuoteData(formData, selectedMode, cartItems);
      console.log('📧 Données transformées pour email:', emailData);

      // Appel à l'API
      const response = await $fetch('/api/contacts/submit', {
        method: 'POST',
        body: emailData
      }) as any;

      console.log('✅ Réponse API email:', response);

      if (response.success) {
        hasSubmitted.value = true;
        submitSuccess.value = true;
        quoteReference.value = response.reference || null;
        trackingUrl.value = response.trackingUrl || null;

        // Analytics: track successful email quote
        if (process.client && window.gtag) {
          window.gtag('event', 'quote_email_submitted', {
            'project_type': selectedMode,
            'cart_items': cartItems.length,
            'total_amount': formData.total
          });
        }

        return {
          success: true,
          reference: response.reference,
          message: response.message,
          trackingUrl: response.trackingUrl
        };
      } else {
        throw new Error(response.message || 'Erreur lors de l\'envoi du devis');
      }

    } catch (e: unknown) {
      console.error('❌ Erreur soumission email:', e);
      const errorMessage = e instanceof Error ? e.message : 'Une erreur est survenue lors de l\'envoi du devis par email';
      error.value = errorMessage;
      submitSuccess.value = false;

      return {
        success: false,
        message: errorMessage
      };
    } finally {
      isSubmitting.value = false;
    }
  };

  const reset = () => {
    isSubmitting.value = false;
    hasSubmitted.value = false;
    submitSuccess.value = false;
    error.value = null;
    quoteReference.value = null;
    trackingUrl.value = null;
  };

  return {
    // État
    isSubmitting,
    hasSubmitted,
    submitSuccess,
    error,
    quoteReference,
    trackingUrl,

    // Méthodes
    submitEmailQuote,
    validateEmailData,
    transformQuoteData,
    formatCurrency,
    reset
  };
}