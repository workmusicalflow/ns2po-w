import { ref, readonly } from "vue";

/**
 * Composable Google Analytics 4 pour NS2PO Election MVP
 * Interface typée pour le tracking des événements métier
 */

export interface GA4Event {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface RealisationInteractionData {
  realisationId: string;
  realisationTitle: string;
  variant?: string;
  sourceLocation?: string;
  [key: string]: any;
}

export interface InspirationConversionData {
  realisationId: string;
  productIds: string[];
  quoteValue?: number;
  conversionStep?: "view" | "add_to_quote" | "submit_quote";
  [key: string]: any;
}

export interface UserJourneyData {
  step: string;
  context?: Record<string, any>;
  previousStep?: string;
  timeSpent?: number;
  [key: string]: any;
}

export const useGoogleAnalytics = () => {
  const config = useRuntimeConfig();
  const isEnabled = !process.dev && !!config.public.googleAnalyticsId;

  /**
   * Fonction gtag sécurisée avec fallback
   */
  const gtag = (...args: any[]) => {
    if (!isEnabled || typeof window === "undefined" || !window.gtag) {
      console.debug("[GA4] Tracking disabled or not available:", args);
      return;
    }

    try {
      window.gtag(...args);
    } catch (error) {
      console.error("[GA4] Tracking error:", error, args);
    }
  };

  /**
   * Track un événement générique
   */
  const trackEvent = (eventData: GA4Event) => {
    gtag("event", eventData.action, {
      event_category: eventData.category,
      event_label: eventData.label,
      value: eventData.value,
      ...eventData.custom_parameters,
    });
  };

  /**
   * Track les interactions avec les réalisations
   */
  const trackRealisationInteraction = (
    action:
      | "view"
      | "click"
      | "inspire"
      | "gallery_interaction"
      | "inspire_click",
    data: RealisationInteractionData
  ) => {
    gtag("event", "realisation_interaction", {
      event_category: "engagement",
      interaction_type: action,
      realisation_id: data.realisationId,
      realisation_title: data.realisationTitle,
      variant: data.variant,
      source_location: data.sourceLocation,
      timestamp: new Date().toISOString(),
    });

    // Événement spécialisé pour les inspirations (conversion potentielle)
    if (action === "inspire" || action === "inspire_click") {
      gtag("event", "inspiration_initiated", {
        event_category: "conversion",
        realisation_id: data.realisationId,
        realisation_title: data.realisationTitle,
        source_location: data.sourceLocation,
      });
    }
  };

  /**
   * Track les conversions inspiration -> devis
   */
  const trackInspirationConversion = (data: InspirationConversionData) => {
    gtag("event", "inspiration_conversion", {
      event_category: "conversion",
      conversion_step: data.conversionStep || "unknown",
      realisation_id: data.realisationId,
      product_ids: data.productIds.join(","),
      product_count: data.productIds.length,
      quote_value: data.quoteValue,
      currency: "XOF", // Franc CFA
      timestamp: new Date().toISOString(),
    });

    // Événement e-commerce pour GA4
    if (data.quoteValue && data.conversionStep === "submit_quote") {
      gtag("event", "purchase", {
        transaction_id: `quote_${Date.now()}`,
        value: data.quoteValue,
        currency: "XOF",
        items: data.productIds.map((id, index) => ({
          item_id: id,
          item_name: `Product_${id}`,
          item_category: "campaign_product",
          price: data.quoteValue
            ? Math.round(data.quoteValue / data.productIds.length)
            : 0,
          quantity: 1,
        })),
      });
    }
  };

  /**
   * Track du parcours utilisateur
   */
  const trackUserJourney = (data: UserJourneyData) => {
    gtag("event", "user_journey", {
      event_category: "navigation",
      journey_step: data.step,
      previous_step: data.previousStep,
      time_spent: data.timeSpent,
      page_location:
        typeof window !== "undefined" ? window.location.pathname : undefined,
      ...data.context,
    });
  };

  /**
   * Track les pages vues avec contexte métier
   */
  const trackPageView = (
    path?: string,
    title?: string,
    context?: Record<string, any>
  ) => {
    const currentPath =
      path || (typeof window !== "undefined" ? window.location.pathname : "");
    const currentTitle =
      title || (typeof document !== "undefined" ? document.title : "");

    gtag("event", "page_view", {
      page_title: currentTitle,
      page_location: typeof window !== "undefined" ? window.location.href : "",
      page_path: currentPath,
      ...context,
    });
  };

  /**
   * Track les erreurs et performances
   */
  const trackError = (error: Error, context?: Record<string, any>) => {
    gtag("event", "exception", {
      description: error.message,
      fatal: false,
      error_stack: error.stack?.substring(0, 500), // Limiter la taille
      ...context,
    });
  };

  /**
   * Track les performances critiques
   */
  const trackTiming = (
    category: string,
    variable: string,
    time: number,
    label?: string
  ) => {
    gtag("event", "timing_complete", {
      name: variable,
      value: Math.round(time),
      event_category: category,
      event_label: label,
    });
  };

  /**
   * Track les conversions de formulaires
   */
  const trackFormSubmission = (
    formType: "contact" | "quote" | "newsletter" | "custom",
    formData?: Record<string, any>
  ) => {
    gtag("event", "form_submit", {
      event_category: "engagement",
      form_type: formType,
      form_location:
        typeof window !== "undefined" ? window.location.pathname : "",
      ...formData,
    });
  };

  /**
   * Track les téléchargements et interactions médias
   */
  const trackMediaInteraction = (
    action: "view" | "download" | "play" | "pause",
    mediaType: "image" | "video" | "pdf",
    mediaId: string
  ) => {
    gtag("event", "media_interaction", {
      event_category: "media",
      interaction_type: action,
      media_type: mediaType,
      media_id: mediaId,
    });
  };

  return {
    // État
    isEnabled: readonly(ref(isEnabled)),

    // Méthodes de base
    gtag,
    trackEvent,
    trackPageView,
    trackError,
    trackTiming,

    // Méthodes spécialisées métier
    trackRealisationInteraction,
    trackInspirationConversion,
    trackUserJourney,
    trackFormSubmission,
    trackMediaInteraction,
  };
};
