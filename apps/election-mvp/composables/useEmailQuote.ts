// composables/useEmailQuote.ts
import { ref } from 'vue'

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image_url?: string; // Image Cloudinary du produit
  customization?: string; // Personnalisation optionnelle
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
  emailId?: string; // Resend email ID
  pdfSize?: number; // Taille du PDF généré (bytes)
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

  /**
   * Transform form data to match /api/quotes/send schema
   * Format: SendQuoteEmailInput (Zod schema from API)
   */
  const transformQuoteData = (formData: QuoteFormData, selectedMode: 'bundle' | 'custom', cartItems: CartItem[]) => {
    // Générer référence unique au format DEV-YYYY-NNN
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const reference = `DEV-${new Date().getFullYear()}-${randomNum}`;

    // Calculer sous-total, TVA (18%), et total
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const tax = Math.round(subtotal * 0.18); // TVA 18% Côte d'Ivoire
    const total = subtotal + tax;

    // Logo NS2PO Cloudinary optimisé
    const logoUrl = 'https://res.cloudinary.com/dsrvzogof/image/upload/w_200,c_fit,q_auto,f_auto/v1759082596/logo-ns2po-mailing_vzelsq.png';

    // Transformer items au format QuoteItem
    const items = cartItems.map(item => ({
      name: item.name,
      imageUrl: item.image_url || 'https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/default-product.jpg',
      customization: item.customization || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.total / item.quantity),
      totalPrice: item.total
    }));

    return {
      // Client info
      clientName: formData.name.trim(),
      clientEmail: formData.email.trim(),
      clientPhone: formData.phone.trim(),

      // Quote data
      reference,
      items,
      subtotal,
      discount: 0, // Pas de remise pour MVP
      discountPercent: 0,
      tax,
      total,

      // Assets
      logoUrl
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

      // Appel à l'API /api/quotes/send (génération PDF + envoi via Resend)
      const response = await $fetch('/api/quotes/send', {
        method: 'POST',
        body: emailData
      }) as any;

      console.log('✅ Réponse API /api/quotes/send:', response);

      if (response.success) {
        hasSubmitted.value = true;
        submitSuccess.value = true;
        quoteReference.value = response.reference || null;

        // Note: trackingUrl n'est plus utilisé dans /api/quotes/send (MVP scope)
        // Le PDF est envoyé directement par email via Resend
        trackingUrl.value = null;

        console.log('✅ Email envoyé avec succès:', {
          emailId: response.emailId,
          reference: response.reference,
          pdfSize: response.pdfSize,
          totalTime: response.totalTime
        });

        // Analytics: track successful email quote with PDF
        if (process.client && window.gtag) {
          window.gtag('event', 'quote_email_sent', {
            'project_type': selectedMode,
            'cart_items': cartItems.length,
            'total_amount': formData.total,
            'pdf_size_kb': Math.round((response.pdfSize || 0) / 1024),
            'email_id': response.emailId
          });
        }

        return {
          success: true,
          reference: response.reference,
          message: response.message || 'Email envoyé avec succès',
          emailId: response.emailId,
          pdfSize: response.pdfSize
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