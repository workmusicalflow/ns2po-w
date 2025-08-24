import { test, expect, type Page } from "@playwright/test";
import {
  TestSelectors,
  FormFields,
  NetworkConditions,
  TestTimeouts,
  TestData,
  waitForClickableElement,
  fillFormSafely,
  getDebugLogs,
  setNetworkConditions,
} from "../helpers/test-data-attributes";

/**
 * Tests E2E pour le parcours complet inspiration → conversion
 * NS2PO Election MVP - Scénarios critiques de conversion
 */

test.describe("Parcours Inspiration → Conversion", () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Attendre que l'app soit complètement chargée
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Parcours complet : Homepage → Réalisation → Inspiration → Produit → Devis", async () => {
    // 1. Sur la homepage, cliquer sur une réalisation en vedette
    await test.step("Cliquer sur une réalisation depuis la homepage", async () => {
      // Attendre que les réalisations soient chargées
      const realisationCard = await waitForClickableElement(
        page,
        TestSelectors.REALISATION_CARD,
        TestTimeouts.NETWORK_LOAD
      );

      // Cliquer sur le bouton "S'inspirer"
      const inspireButton = realisationCard.locator(
        TestSelectors.REALISATION_INSPIRE_BUTTON
      );
      await expect(inspireButton).toBeVisible();
      await inspireButton.click();
    });

    // 2. Vérifier que nous sommes redirigés vers la page produit avec le contexte d'inspiration
    await test.step("Vérifier la redirection vers la page produit avec contexte", async () => {
      // Attendre la navigation
      await page.waitForLoadState("networkidle");

      // Vérifier que l'URL contient le paramètre inspiredBy
      const currentUrl = page.url();
      expect(currentUrl).toContain("inspiredBy=");

      // Vérifier que nous sommes sur une page produit
      expect(currentUrl).toContain("/produit/");

      // Vérifier la présence du bandeau d'inspiration
      const inspirationBanner = page.locator(
        '[data-testid="inspiration-banner"]'
      );
      await expect(inspirationBanner).toBeVisible();
      await expect(inspirationBanner).toContainText("Inspiré par");
    });

    // 3. Personnaliser le produit (ajout de logo)
    await test.step("Personnaliser le produit avec un logo", async () => {
      // Vérifier que l'outil de personnalisation est disponible
      const customizationTool = page.locator(
        '[data-testid="product-customizer"]'
      );
      await expect(customizationTool).toBeVisible();

      // Simuler l'upload d'un logo (si possible)
      const logoUpload = page.locator('input[type="file"][accept*="image"]');
      if ((await logoUpload.count()) > 0) {
        // Créer un fichier de test
        const testImage = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
          "base64"
        );
        await logoUpload.setInputFiles({
          name: "test-logo.png",
          mimeType: "image/png",
          buffer: testImage,
        });

        // Attendre que la prévisualisation se charge
        await page.waitForSelector('[data-testid="preview-canvas"]', {
          timeout: 15000,
        });
      }
    });

    // 4. Modifier la quantité et vérifier le calcul du prix
    await test.step("Modifier la quantité et vérifier le prix", async () => {
      // Localiser le sélecteur de quantité
      const quantityInput = page.locator(
        'input[data-testid="quantity-input"], select[data-testid="quantity-select"]'
      );
      await expect(quantityInput).toBeVisible();

      // Changer la quantité à 100
      if ((await quantityInput.getAttribute("type")) === "number") {
        await quantityInput.fill("100");
      } else {
        await quantityInput.selectOption("100");
      }

      // Vérifier que le prix total se met à jour
      const totalPrice = page.locator('[data-testid="total-price"]');
      await expect(totalPrice).toBeVisible();

      // Attendre que le prix se recalcule
      await page.waitForFunction(() => {
        const priceElement = document.querySelector(
          '[data-testid="total-price"]'
        );
        return (
          priceElement &&
          priceElement.textContent &&
          priceElement.textContent !== "0"
        );
      });
    });

    // 5. Ajouter au devis
    await test.step("Ajouter le produit au devis", async () => {
      const addToQuoteButton = page.locator(
        'button:has-text("Ajouter au devis"), button[data-testid="add-to-quote"]'
      );
      await expect(addToQuoteButton).toBeVisible();
      await addToQuoteButton.click();

      // Vérifier le feedback utilisateur (notification, badge panier, etc.)
      const successMessage = page.locator(
        '.notification, [data-testid="success-message"], .toast'
      );
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });

    // 6. Accéder au panier/devis
    await test.step("Accéder au panier de devis", async () => {
      const cartButton = page.locator(
        'button:has-text("Panier"), button:has-text("Devis"), [data-testid="cart-button"]'
      );
      await expect(cartButton).toBeVisible();
      await cartButton.click();

      // Attendre la navigation vers la page de devis
      await page.waitForLoadState("networkidle");
    });

    // 7. Remplir le formulaire de devis
    await test.step("Remplir le formulaire de demande de devis", async () => {
      // Vérifier que nous sommes sur la page de devis
      const quoteForm = page.locator(
        'form[data-testid="quote-form"], form:has(input[name="customerName"])'
      );
      await expect(quoteForm).toBeVisible();

      // Remplir les informations client
      await page.fill(
        'input[name="customerName"], input[placeholder*="nom"]',
        "Jean Kouassi"
      );
      await page.fill(
        'input[name="email"], input[type="email"]',
        "jean.kouassi@example.com"
      );
      await page.fill(
        'input[name="phone"], input[type="tel"]',
        "+225 01 02 03 04 05"
      );

      // Sélectionner le contexte électoral
      const contextSelect = page.locator(
        'select[name="context"], select:has(option:text-matches("électoral", "i"))'
      );
      if ((await contextSelect.count()) > 0) {
        await contextSelect.selectOption({ label: /électoral/i });
      }

      // Ajouter un message (optionnel)
      const messageField = page.locator(
        'textarea[name="message"], textarea[placeholder*="message"]'
      );
      if ((await messageField.count()) > 0) {
        await messageField.fill(
          "Devis pour campagne électorale municipale. Besoin urgent."
        );
      }
    });

    // 8. Soumettre le devis et vérifier la conversion
    await test.step("Soumettre le devis et vérifier la conversion", async () => {
      const submitButton = page.locator(
        'button[type="submit"]:has-text("Envoyer"), button:has-text("Demander un devis")'
      );
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();

      await submitButton.click();

      // Vérifier la page de confirmation ou message de succès
      await expect(async () => {
        const confirmationMessage = page.locator(
          ':text("devis envoyé"), :text("demande reçue"), :text("merci"), [data-testid="success-confirmation"]'
        );
        await expect(confirmationMessage).toBeVisible();
      }).toPass({ timeout: 10000 });

      // Vérifier que l'URL a changé vers une page de confirmation
      const finalUrl = page.url();
      expect(finalUrl).toMatch(/(confirmation|success|merci|devis)/);
    });
  });

  test("Parcours inspiration avec produit indisponible", async () => {
    await test.step("Simuler un produit temporairement indisponible", async () => {
      // Intercepter les appels API pour simuler un produit indisponible
      await page.route("**/api/products/**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...route.request().postDataJSON(),
            stock: 0,
            available: false,
            message: "Produit temporairement indisponible",
          }),
        });
      });

      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Cliquer sur une réalisation
      const realisationCard = page
        .locator('[data-testid="realisation-card"]')
        .first();
      await realisationCard
        .locator('[title="S\'inspirer de cette réalisation"]')
        .click();

      // Vérifier que l'interface gère correctement l'indisponibilité
      const unavailableMessage = page.locator(
        ':text("indisponible"), [data-testid="product-unavailable"]'
      );
      await expect(unavailableMessage).toBeVisible();

      // Vérifier qu'un produit alternatif est proposé
      const alternativeProduct = page.locator(
        '[data-testid="alternative-product"], :text("produit similaire")'
      );
      await expect(alternativeProduct).toBeVisible();
    });
  });

  test("Performance du parcours inspiration sur connexion lente", async ({
    page,
    browserName,
  }) => {
    // Simuler une connexion 3G
    const client = await page.context().newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
      uploadThroughput: (750 * 1024) / 8, // 750 kbps
      latency: 40, // 40ms
    });

    await test.step("Mesurer les performances du parcours complet", async () => {
      const startTime = Date.now();

      // Parcours rapide : Homepage → Inspiration → Produit → Ajout devis
      await page.goto("/");
      await page.waitForSelector('[data-testid="realisation-card"]', {
        timeout: 15000,
      });

      const loadTime = Date.now() - startTime;
      console.log(`Temps de chargement homepage: ${loadTime}ms`);

      // Cliquer sur inspiration
      const inspirationStart = Date.now();
      await page
        .locator('[data-testid="realisation-card"]')
        .first()
        .locator('[title="S\'inspirer de cette réalisation"]')
        .click();

      await page.waitForLoadState("networkidle");
      const inspirationTime = Date.now() - inspirationStart;
      console.log(`Temps navigation inspiration: ${inspirationTime}ms`);

      // Vérifier que le parcours reste utilisable (< 5 secondes par étape)
      expect(loadTime).toBeLessThan(8000); // 8s max pour homepage
      expect(inspirationTime).toBeLessThan(5000); // 5s max pour navigation

      // Vérifier que les images se chargent progressivement
      const images = page.locator('img[loading="lazy"]');
      const imageCount = await images.count();
      expect(imageCount).toBeGreaterThan(0); // Au moins une image avec lazy loading
    });
  });

  test("Tracking GA4 du parcours inspiration-conversion", async () => {
    // Intercepter les appels GA4 pour vérifier le tracking
    const gaEvents: any[] = [];

    await page.route("https://www.google-analytics.com/g/collect*", (route) => {
      const url = new URL(route.request().url());
      const params = Object.fromEntries(url.searchParams.entries());
      gaEvents.push(params);
      route.fulfill({ status: 200, body: "OK" });
    });

    await test.step("Vérifier le tracking des événements GA4", async () => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Interaction avec une réalisation
      const realisationCard = page
        .locator('[data-testid="realisation-card"]')
        .first();
      await realisationCard
        .locator('[title="S\'inspirer de cette réalisation"]')
        .click();

      await page.waitForLoadState("networkidle");

      // Vérifier qu'au moins un événement GA4 a été déclenché
      await page.waitForTimeout(2000); // Laisser le temps aux événements GA4

      // En mode développement, GA4 est désactivé, mais on peut vérifier les logs de debug
      const debugLogs = await page.evaluate(() => {
        return (window as any).__NS2PO_DEBUG__ || [];
      });

      expect(debugLogs.length).toBeGreaterThan(0);

      // Vérifier qu'il y a des logs liés aux interactions réalisations
      const realisationLogs = debugLogs.filter(
        (log: any) =>
          log.module === "RealisationTracking" ||
          log.module === "ConversionTracking"
      );
      expect(realisationLogs.length).toBeGreaterThan(0);
    });
  });

  test("Gestion d'erreur lors de la soumission de devis", async () => {
    await test.step("Simuler une erreur de soumission de devis", async () => {
      // Intercepter l'API de soumission pour simuler une erreur serveur
      await page.route("**/api/contacts", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Erreur serveur temporaire" }),
        });
      });

      // Parcours rapide jusqu'au formulaire de devis
      await page.goto("/");
      await page.waitForSelector('[data-testid="realisation-card"]', {
        timeout: 10000,
      });

      const realisationCard = page
        .locator('[data-testid="realisation-card"]')
        .first();
      await realisationCard
        .locator('[title="S\'inspirer de cette réalisation"]')
        .click();

      // Aller directement au devis (raccourci pour le test)
      const addToQuoteButton = page.locator(
        'button:has-text("Ajouter au devis"), button[data-testid="add-to-quote"]'
      );
      if (await addToQuoteButton.isVisible()) {
        await addToQuoteButton.click();
      }

      // Accéder au formulaire de devis
      const cartButton = page.locator(
        'button:has-text("Panier"), button:has-text("Devis"), [data-testid="cart-button"]'
      );
      if (await cartButton.isVisible()) {
        await cartButton.click();
        await page.waitForLoadState("networkidle");
      }

      // Remplir et soumettre le formulaire
      await page.fill(
        'input[name="customerName"], input[placeholder*="nom"]',
        "Test User"
      );
      await page.fill(
        'input[name="email"], input[type="email"]',
        "test@example.com"
      );

      const submitButton = page.locator(
        'button[type="submit"]:has-text("Envoyer"), button:has-text("Demander un devis")'
      );
      await submitButton.click();

      // Vérifier que l'erreur est bien gérée côté interface
      const errorMessage = page.locator(
        '.error, [data-testid="error-message"], .notification-error'
      );
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
      await expect(errorMessage).toContainText(/erreur|problème|réessayer/i);

      // Vérifier que le formulaire reste accessible pour un nouvel essai
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
    });
  });
});
