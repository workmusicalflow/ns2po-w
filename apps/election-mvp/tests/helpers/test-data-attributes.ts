/**
 * Helpers pour les attributs de test E2E
 * NS2PO Election MVP - Data attributes standardisés
 */

export const TestSelectors = {
  // Réalisations
  REALISATION_CARD: '[data-testid="realisation-card"]',
  REALISATION_INSPIRE_BUTTON: '[title="S\'inspirer de cette réalisation"]',
  INSPIRATION_BANNER: '[data-testid="inspiration-banner"]',

  // Produits
  PRODUCT_CUSTOMIZER: '[data-testid="product-customizer"]',
  PREVIEW_CANVAS: '[data-testid="preview-canvas"]',
  QUANTITY_INPUT:
    'input[data-testid="quantity-input"], select[data-testid="quantity-select"]',
  TOTAL_PRICE: '[data-testid="total-price"]',
  ADD_TO_QUOTE_BUTTON:
    'button[data-testid="add-to-quote"], button:has-text("Ajouter au devis")',

  // Panier / Devis
  CART_BUTTON:
    '[data-testid="cart-button"], button:has-text("Panier"), button:has-text("Devis")',
  QUOTE_FORM:
    'form[data-testid="quote-form"], form:has(input[name="customerName"])',

  // Messages et feedback
  SUCCESS_MESSAGE: '[data-testid="success-message"], .notification, .toast',
  ERROR_MESSAGE: '[data-testid="error-message"], .error, .notification-error',
  SUCCESS_CONFIRMATION:
    '[data-testid="success-confirmation"], :text("devis envoyé"), :text("demande reçue"), :text("merci")',

  // Produits indisponibles
  PRODUCT_UNAVAILABLE:
    '[data-testid="product-unavailable"], :text("indisponible")',
  ALTERNATIVE_PRODUCT:
    '[data-testid="alternative-product"], :text("produit similaire")',
} as const;

export const FormFields = {
  CUSTOMER_NAME: 'input[name="customerName"], input[placeholder*="nom"]',
  EMAIL: 'input[name="email"], input[type="email"]',
  PHONE: 'input[name="phone"], input[type="tel"]',
  CONTEXT:
    'select[name="context"], select:has(option:text-matches("électoral", "i"))',
  MESSAGE: 'textarea[name="message"], textarea[placeholder*="message"]',
  SUBMIT:
    'button[type="submit"]:has-text("Envoyer"), button:has-text("Demander un devis")',
} as const;

export const NetworkConditions = {
  SLOW_3G: {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 kbps
    latency: 40, // 40ms
  },
  FAST_3G: {
    offline: false,
    downloadThroughput: (3 * 1024 * 1024) / 8, // 3 Mbps
    uploadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    latency: 20, // 20ms
  },
} as const;

export const TestTimeouts = {
  DEFAULT_ASSERTION: 10000, // 10 secondes
  NETWORK_LOAD: 10000, // 10 secondes pour les chargements réseau
  FORM_SUBMISSION: 10000, // 10 secondes pour soumission formulaire
  GA4_EVENTS: 2000, // 2 secondes pour les événements GA4
} as const;

export const TestData = {
  CUSTOMER: {
    name: "Jean Kouassi",
    email: "jean.kouassi@example.com",
    phone: "+225 01 02 03 04 05",
    context: "électoral",
    message: "Devis pour campagne électorale municipale. Besoin urgent.",
  },
  TEST_IMAGE: {
    name: "test-logo.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64"
    ),
  },
} as const;

/**
 * Helper pour attendre qu'un élément soit visible et cliquable
 */
export async function waitForClickableElement(
  page: any,
  selector: string,
  timeout = TestTimeouts.DEFAULT_ASSERTION
) {
  const element = page.locator(selector);
  await element.waitFor({ state: "visible", timeout });
  await element.waitFor({ state: "attached", timeout });
  return element;
}

/**
 * Helper pour remplir un formulaire avec validation
 */
export async function fillFormSafely(
  page: any,
  formData: Record<string, string>
) {
  for (const [field, value] of Object.entries(formData)) {
    const selector = FormFields[field as keyof typeof FormFields];
    if (selector) {
      const element = await waitForClickableElement(page, selector);
      await element.fill(value);

      // Vérifier que la valeur a été saisie
      const currentValue = await element.inputValue();
      if (currentValue !== value) {
        throw new Error(
          `Failed to fill field ${field}. Expected: ${value}, Got: ${currentValue}`
        );
      }
    }
  }
}

/**
 * Helper pour vérifier les événements de debug NS2PO
 */
export async function getDebugLogs(page: any, filterModule?: string) {
  const allLogs = await page.evaluate(() => {
    return (window as any).__NS2PO_DEBUG__ || [];
  });

  if (filterModule) {
    return allLogs.filter((log: any) => log.module === filterModule);
  }

  return allLogs;
}

/**
 * Helper pour simuler des conditions réseau
 */
export async function setNetworkConditions(
  page: any,
  conditions: (typeof NetworkConditions)[keyof typeof NetworkConditions]
) {
  const client = await page.context().newCDPSession(page);
  await client.send("Network.emulateNetworkConditions", conditions);
}
