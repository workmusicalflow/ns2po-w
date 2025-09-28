// composables/useWhatsAppQuote.ts
import { ref } from 'vue';

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number; // En XOF
  total: number;
}

interface QuoteFormData {
  organization: string;
  projectType: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  cart: CartItem[];
  notes?: string;
}

interface WhatsAppConfig {
  phoneNumber: string; // Numéro du destinataire (équipe NS2PO)
  fallbackEmail: string;
  fallbackPhone: string;
}

export function useWhatsAppQuote(config: WhatsAppConfig) {
  const isSubmitting = ref(false);
  const hasSubmitted = ref(false); // Indique si l'action WhatsApp a été tentée
  const whatsappOpened = ref(false); // Heuristique pour savoir si WhatsApp a probablement été ouvert
  const error = ref<string | null>(null);

  const formatCurrency = (amount: number): string => {
    // Format simplifié pour WhatsApp (évite les problèmes d'encodage)
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return `${formatted} FCFA`;
  };

  const generateWhatsAppMessage = (formData: QuoteFormData): string => {
    const totalAmount = formData.cart.reduce((sum, item) => sum + item.total, 0);

    let message = `*DEMANDE DE DEVIS ELECTORAL NS2PO*\n\n`;
    message += `*Client:* ${formData.organization}\n`;
    message += `*Type de Projet:* ${formData.projectType}\n`;
    message += `*Contact:* ${formData.contactName}\n`;
    message += `*Telephone:* ${formData.contactPhone}\n`;
    message += `*Email:* ${formData.contactEmail}\n\n`;

    message += `--- DETAILS DU PANIER ---\n`;
    formData.cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`;
      message += `   Quantite: ${item.quantity.toLocaleString('fr-FR')}\n`;
      message += `   Prix unitaire: ${formatCurrency(item.unitPrice)}\n`;
      message += `   Sous-total: ${formatCurrency(item.total)}\n\n`;
    });
    message += `------------------------\n`;
    message += `*MONTANT TOTAL ESTIME: ${formatCurrency(totalAmount)}*\n\n`;

    if (formData.notes && formData.notes.trim()) {
      message += `*Notes additionnelles:*\n${formData.notes.trim()}\n\n`;
    }

    message += `*ACTION REQUISE:* Merci de nous recontacter rapidement pour finaliser votre devis personnalise.\n\n`;
    message += `NS2PO - Votre partenaire publicite par l'objet depuis 2011`;

    return message;
  };

  const getWhatsAppLink = (formData: QuoteFormData): string => {
    const cleanPhone = config.phoneNumber.replace(/[\s+]/g, "");
    const message = encodeURIComponent(generateWhatsAppMessage(formData));
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const getWebWhatsAppLink = (formData: QuoteFormData): string => {
    const cleanPhone = config.phoneNumber.replace(/[\s+]/g, "");
    const message = encodeURIComponent(generateWhatsAppMessage(formData));
    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
  };

  const submitQuote = async (formData: QuoteFormData) => {
    isSubmitting.value = true;
    error.value = null;
    whatsappOpened.value = false;

    try {
      // Validation côté client
      if (!formData.organization || !formData.contactName || !formData.contactPhone) {
        throw new Error('Les champs obligatoires doivent être renseignés');
      }

      if (!formData.cart || formData.cart.length === 0) {
        throw new Error('Votre panier ne peut pas être vide');
      }

      const waLink = getWhatsAppLink(formData);

      // Tenter d'ouvrir WhatsApp (mobile priority)
      const newWindow = window.open(waLink, '_blank');

      // Heuristique pour détecter si WhatsApp a été ouvert
      await new Promise(resolve => setTimeout(resolve, 1500)); // Attendre 1.5s

      if (newWindow && !newWindow.closed) {
        // La fenêtre est toujours ouverte, peut signifier échec d'ouverture directe
        whatsappOpened.value = false;
        error.value = null; // Pas une vraie erreur, juste fallback nécessaire
      } else {
        whatsappOpened.value = true; // Probablement ouvert avec succès
      }

      hasSubmitted.value = true;

      // Analytics: track successful quote attempt
      if (process.client && window.gtag) {
        window.gtag('event', 'quote_whatsapp_attempt', {
          'organization': formData.organization,
          'project_type': formData.projectType,
          'cart_items': formData.cart.length,
          'total_amount': formData.cart.reduce((sum, item) => sum + item.total, 0)
        });
      }

    } catch (e: any) {
      console.error('Erreur lors de la soumission WhatsApp:', e);
      error.value = e.message || 'Une erreur est survenue lors de la préparation du devis';
      whatsappOpened.value = false;
    } finally {
      isSubmitting.value = false;
    }
  };

  const reset = () => {
    isSubmitting.value = false;
    hasSubmitted.value = false;
    whatsappOpened.value = false;
    error.value = null;
  };

  return {
    isSubmitting,
    hasSubmitted,
    whatsappOpened,
    error,
    submitQuote,
    getWhatsAppLink,
    getWebWhatsAppLink,
    generateWhatsAppMessage, // Pour prévisualisation
    config,
    reset
  };
}