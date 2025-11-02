# 🎯 Sprint 0 - Stratégie Tests E2E Baseline Anti-Régression

**Date**: 2025-11-02
**Projet**: NS2PO Election MVP - Migration TanStack Query Pure
**Sprint**: Sprint 0 - Préparation & Sécurisation (Recommandation Gemini)

---

## 📋 Contexte & Objectif

### Mission
Créer une **baseline anti-régression robuste** avec tests E2E Playwright AVANT migration Pinia → TanStack Query pur.

### Stack Technique
- **Frontend**: Nuxt 3.15+, Vue 3 Composition API, TypeScript strict
- **State Management**: Pinia (legacy à migrer) + TanStack Query v5 (déjà opérationnel)
- **Database**: Turso (libSQL/SQLite Edge)
- **Testing**: Playwright E2E + Vitest Unit
- **Déploiement**: Railway Runtime V2

### État Actuel Architecture

**Composables TanStack Query (déjà fonctionnels)**:
- `useProductsQuery.ts`: 9 queries (liste, détail, recherche, filtres)
- `useProductMutations.ts`: 4 mutations (Create, Update, Delete, BulkUpdate)

**Composables Pinia (legacy)**:
- `useProducts.ts`: Store Pinia utilisé historiquement (à supprimer)

**Problème à résoudre**: Couplage résiduel Pinia malgré TanStack Query fonctionnel.

---

## 🔍 Analyse Experts (Gemini + Web Search)

### Recommandations Gemini (Expert Senior Architecture Frontend)

#### ✅ Verdict Global
> "Stratégie solide et proactive. Les 21 tests CRUD sont une excellente base fonctionnelle. Le risque principal de la migration réside dans la déconnexion de Pinia et l'assurance que TanStack Query gère tous les aspects du state management sans régression."

#### 🎯 Core 20% - Tests Critiques Must-Have

1. **Tests d'Invalidation de Cache TanStack Query** (ABSOLUMENT CRITIQUE)
   - **Pourquoi**: Mécanisme fondamental de TanStack Query pour fraîcheur des données
   - **Scénarios**:
     - Création produit → vérifier apparition immédiate dans liste
     - Modification produit → vérifier update visible dans liste + détail
     - Suppression produit → vérifier disparition de la liste
   - **Piège**: Oublier de tester invalidations sur *toutes* les vues impactées (liste, détail, recherche)

2. **Tests d'Optimistic Updates** (FORTEMENT RECOMMANDÉ)
   - **Pourquoi**: Fonctionnalité clé TanStack Query pour UX réactive
   - **Scénarios**:
     - **Succès**: Mutation → UI update immédiate → réponse API → état final correct
     - **Échec**: Mutation → UI update → API erreur → **rollback** → message erreur
   - **Piège**: Tester uniquement le succès, oublier le rollback = UI incohérente

3. **Stratégie DB Seeding** (CRITIQUE FIABILITÉ)
   - **Recommandation**: Utiliser vraie DB Turso (locale ou instance test dédiée)
   - **Implémentation**:
     - Script seeding/reset de DB via Nuxt Server API (`/api/test/seed-db`, `/api/test/reset-db`)
     - Nettoyer + insérer jeu de données connu avant chaque suite de tests
     - Garantir état propre et prévisible
   - **Anti-pattern**: Mocker Turso = perte de validation de la chaîne complète

4. **Traces Playwright** (DÉBOGAGE CRITIQUE)
   - **Pourquoi**: Mine d'or pour débogage (actions, réseau, console, screenshots)
   - **Configuration**: `trace: 'on-first-retry'` ou `'on'` dans `playwright.config.ts`
   - **Coût**: Minime à l'exécution, gain énorme en cas de problème

5. **Screenshots sur Échec** (RÉGRESSION VISUELLE)
   - **Configuration**: `screenshot: 'only-on-failure'` dans Playwright
   - **Usage**: Comparaison manuelle avant/après migration
   - **Non recommandé pour Sprint 0**: Percy/Chromatic (over-engineering)

#### ❌ Enhancement 80% - À Éviter pour Sprint 0

- **Synchronisation Pinia ↔ TanStack Query**: Tester la transition = pas l'objectif du Sprint 0
- **data-testid partout**: Ajouter uniquement pour éléments critiques difficiles à sélectionner
- **Régression visuelle automatisée**: Percy/Chromatic = investissement trop lourd pour baseline

### Recommandations Web Search (Best Practices 2025)

#### TanStack Query + Nuxt 3

- **Source**: [TanStack Query v5 Docs - Does this replace Pinia?](https://tanstack.com/query/v5/docs/vue/guides/does-this-replace-client-state)
- **Synthèse**:
  > "TanStack Query remplace le boilerplate de cache data dans votre client-state par quelques lignes de code. Pour la majorité des applications, le client state vraiment global restant après migration vers TanStack Query est minuscule."
  - TanStack Query ≠ remplacement state local (UI, formulaires)
  - TanStack Query = remplacement state serveur (cache, fetch, mutations)
  - Coexistence Pinia (local) + TanStack Query (serveur) possible mais déconseillée si redondante

#### Playwright + Nuxt 3 + Database Seeding

- **Source**: [Markus Oberlehner - Contract Tests](https://markus.oberlehner.net/blog/no-more-mocking-write-better-tests-for-microservices-powered-server-side-rendered-applications-with-contract-tests)
- **Synthèse**:
  - **Monolithic SSR**: Spin up mock databases + migrations + seeding
  - **Commande**: `pnpm run seed:test` avant Playwright
  - **Locators Priority**: `getByRole` (sémantique) > `getByText` (non-sémantique) > `data-testid` (last resort)
  - **Config**: `await page.close()` après tests (éviter memory leaks)

---

## 📊 Suite de Tests E2E Créée

### Fichier: `tests/e2e/admin/products-crud-complete.spec.ts`

#### Couverture Actuelle (21 tests)

1. **Création (4 tests)**
   - C-01: Créer produit complet valide
   - C-02: Validation champs manquants
   - C-03: Validation prix minimum 0 FCFA
   - C-04: Validation référence unique (détection doublons)

2. **Lecture/Liste (5 tests)**
   - R-01: Afficher liste complète
   - R-02: Recherche fuzzy (tolérance fautes)
   - R-03: Filtrage par catégorie
   - R-04: Pagination navigation
   - R-05: Détails produit affichage complet

3. **Modification (3 tests)**
   - U-01: Modifier nom + prix
   - U-02: Validation prix non vide
   - U-03: Annuler modifications (reset formulaire)

4. **Suppression (3 tests)**
   - D-01: Supprimer avec confirmation
   - D-02: Annuler suppression
   - D-03: Suppression en masse (bulk delete)

5. **Performance (3 tests)**
   - P-01: Page load < 3s mobile 3G
   - P-02: API calls < 500ms (Turso Edge)
   - P-03: Recherche fuzzy latency < 50ms

6. **Gestion Erreurs (3 tests)**
   - E-01: Message erreur si API échoue
   - E-02: Retry automatique échec temporaire
   - E-03: État "Pas de résultats" recherche vide

---

## 🎯 Améliorations Critiques à Implémenter (Core 20%)

### 1. Tests Invalidation Cache TanStack Query

**Fichier**: `tests/e2e/admin/products-cache-invalidation.spec.ts` (nouveau)

```typescript
test('IC-01: Création produit → Invalidation liste immédiate', async ({ page }) => {
  // 1. Capturer état liste initiale
  await page.goto('/admin/products')
  const initialCount = await page.locator('[data-testid="product-card"]').count()

  // 2. Créer nouveau produit
  await page.goto('/admin/products/new')
  await fillProductForm(page, TEST_PRODUCT)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=/créé avec succès/i')).toBeVisible()

  // 3. Retourner à la liste (navigation, pas reload)
  await page.goto('/admin/products')

  // 4. Vérifier invalidation cache = nouveau produit visible immédiatement
  const newCount = await page.locator('[data-testid="product-card"]').count()
  expect(newCount).toBe(initialCount + 1)
  await expect(page.locator(`text=${TEST_PRODUCT.name}`)).toBeVisible()
})

test('IC-02: Modification produit → Invalidation détail + liste', async ({ page }) => {
  // 1. Créer produit initial
  const productId = await createTestProduct(page, TEST_PRODUCT)

  // 2. Modifier le produit
  await page.goto(`/admin/products/${productId}`)
  await page.fill('input[name="name"]', UPDATED_PRODUCT.name)
  await page.click('button[type="submit"]')
  await expect(page.locator('text=/mis à jour/i')).toBeVisible()

  // 3. Vérifier invalidation vue liste (sans reload)
  await page.goto('/admin/products')
  await expect(page.locator(`text=${UPDATED_PRODUCT.name}`)).toBeVisible()
  await expect(page.locator(`text=${TEST_PRODUCT.name}`)).not.toBeVisible()

  // 4. Vérifier invalidation vue détail (naviguer vers détail différent puis retour)
  await page.goto('/admin/products/autre-produit')
  await page.goto(`/admin/products/${productId}`)
  await expect(page.locator(`input[name="name"]`)).toHaveValue(UPDATED_PRODUCT.name)
})

test('IC-03: Suppression produit → Invalidation liste immédiate', async ({ page }) => {
  // 1. Créer produit à supprimer
  const productId = await createTestProduct(page, TEST_PRODUCT)

  // 2. Supprimer
  await page.goto(`/admin/products/${productId}`)
  await page.click('button:has-text("Supprimer")')
  await page.click('button:has-text("Confirmer")')
  await expect(page.locator('text=/supprimé/i')).toBeVisible()

  // 3. Vérifier invalidation liste (redirection automatique)
  await page.waitForURL('/admin/products')
  await expect(page.locator(`text=${TEST_PRODUCT.name}`)).not.toBeVisible()
})
```

### 2. Tests Optimistic Updates + Rollback

**Fichier**: `tests/e2e/admin/products-optimistic-updates.spec.ts` (nouveau)

```typescript
test('OU-01: Création optimiste → Update UI immédiate AVANT réponse API', async ({ page }) => {
  await page.goto('/admin/products/new')

  // Intercepter appel API pour mesurer timing
  let apiResponseTime = 0
  page.on('response', async (response) => {
    if (response.url().includes('/api/products') && response.request().method() === 'POST') {
      apiResponseTime = Date.now()
    }
  })

  // Remplir + soumettre
  const submitTime = Date.now()
  await fillProductForm(page, TEST_PRODUCT)
  await page.click('button[type="submit"]')

  // Vérifier UI update immédiate (< 100ms = optimiste, pas attente API)
  await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 200 })
  const uiUpdateTime = Date.now()

  // Vérifier que UI update a eu lieu AVANT réponse API (optimistic)
  expect(uiUpdateTime - submitTime).toBeLessThan(200)

  // Attendre réponse API finale et vérifier cohérence
  await page.waitForResponse(resp => resp.url().includes('/api/products') && resp.request().method() === 'POST')
  await expect(page.locator(`text=${TEST_PRODUCT.name}`)).toBeVisible()
})

test('OU-02: Modification optimiste → Rollback en cas d\'échec API', async ({ page }) => {
  // 1. Créer produit initial
  const productId = await createTestProduct(page, TEST_PRODUCT)
  await page.goto(`/admin/products/${productId}`)

  const originalName = await page.inputValue('input[name="name"]')

  // 2. Simuler échec API (mock 500)
  await page.route(`**/api/products/${productId}`, (route) => {
    if (route.request().method() === 'PUT') {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    } else {
      route.continue()
    }
  })

  // 3. Tenter modification
  await page.fill('input[name="name"]', UPDATED_PRODUCT.name)
  await page.click('button[type="submit"]')

  // 4. Vérifier affichage erreur
  await expect(page.locator('text=/erreur.*mise à jour/i')).toBeVisible({ timeout: 3000 })

  // 5. Vérifier ROLLBACK = UI revient à l'état original
  await expect(page.locator(`input[name="name"]`)).toHaveValue(originalName)
  await expect(page.locator(`input[name="name"]`)).not.toHaveValue(UPDATED_PRODUCT.name)
})

test('OU-03: Suppression optimiste → Rollback + restauration liste si échec', async ({ page }) => {
  const productId = await createTestProduct(page, TEST_PRODUCT)
  await page.goto('/admin/products')

  // Capturer count initial
  const initialCount = await page.locator('[data-testid="product-card"]').count()

  // Mock échec suppression
  await page.route(`**/api/products/${productId}`, (route) => {
    if (route.request().method() === 'DELETE') {
      route.fulfill({ status: 500 })
    } else {
      route.continue()
    }
  })

  // Tenter suppression depuis liste (action rapide)
  await page.click(`[data-testid="product-${productId}"] button[aria-label="Supprimer"]`)
  await page.click('button:has-text("Confirmer")')

  // Attendre erreur
  await expect(page.locator('text=/erreur.*suppression/i')).toBeVisible({ timeout: 3000 })

  // Vérifier rollback = produit TOUJOURS visible
  const finalCount = await page.locator('[data-testid="product-card"]').count()
  expect(finalCount).toBe(initialCount) // Pas de changement
  await expect(page.locator(`text=${TEST_PRODUCT.name}`)).toBeVisible()
})
```

### 3. DB Seeding/Reset pour Tests E2E

**Fichier**: `server/api/test/seed-db.post.ts` (nouveau)

```typescript
/**
 * API Seeding Database pour Tests E2E Playwright
 * ⚠️ UNIQUEMENT accessible en environnement development/test
 */
export default defineEventHandler(async (event) => {
  // Protection: Bloquer en production
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      message: 'Seed DB forbidden in production',
    })
  }

  const db = await useDatabase()

  try {
    // 1. Nettoyer tables
    await db.execute('DELETE FROM products')
    await db.execute('DELETE FROM categories')
    await db.execute('DELETE FROM bundles')

    // 2. Seeder catégories
    const categories = [
      { id: 'textiles', name: 'Textiles', slug: 'textiles' },
      { id: 'accessoires', name: 'Accessoires', slug: 'accessoires' },
      { id: 'communication', name: 'Communication', slug: 'communication' },
    ]

    for (const cat of categories) {
      await db.execute({
        sql: 'INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)',
        args: [cat.id, cat.name, cat.slug],
      })
    }

    // 3. Seeder produits de test
    const testProducts = [
      {
        id: 'test-product-1',
        name: 'T-Shirt Test Baseline',
        reference: 'REF-TEST-001',
        price: 15000,
        category_id: 'textiles',
        status: 'active',
      },
      {
        id: 'test-product-2',
        name: 'Casquette Test Baseline',
        reference: 'REF-TEST-002',
        price: 8000,
        category_id: 'accessoires',
        status: 'active',
      },
      // ... Ajouter 10-20 produits pour pagination tests
    ]

    for (const product of testProducts) {
      await db.execute({
        sql: `INSERT INTO products (id, name, reference, price, category_id, status)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          product.id,
          product.name,
          product.reference,
          product.price,
          product.category_id,
          product.status,
        ],
      })
    }

    return {
      success: true,
      seeded: {
        categories: categories.length,
        products: testProducts.length,
      },
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Seeding failed: ${error.message}`,
    })
  }
})
```

**Fichier**: `server/api/test/reset-db.post.ts` (nouveau)

```typescript
/**
 * API Reset Database pour Tests E2E Playwright
 * ⚠️ UNIQUEMENT accessible en environnement development/test
 */
export default defineEventHandler(async (event) => {
  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 403,
      message: 'Reset DB forbidden in production',
    })
  }

  const db = await useDatabase()

  try {
    // Nettoyer TOUTES les tables
    await db.execute('DELETE FROM products')
    await db.execute('DELETE FROM categories')
    await db.execute('DELETE FROM bundles')
    await db.execute('DELETE FROM product_bundles')

    return { success: true, message: 'Database reset successful' }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Reset failed: ${error.message}`,
    })
  }
})
```

**Intégration Playwright**:

```typescript
// tests/e2e/helpers/database.ts
import { Page } from '@playwright/test'

export async function seedDatabase(page: Page) {
  const response = await page.request.post('http://localhost:3003/api/test/seed-db')
  if (!response.ok()) {
    throw new Error('Database seeding failed')
  }
  return response.json()
}

export async function resetDatabase(page: Page) {
  const response = await page.request.post('http://localhost:3003/api/test/reset-db')
  if (!response.ok()) {
    throw new Error('Database reset failed')
  }
  return response.json()
}

// Usage dans tests
test.beforeEach(async ({ page }) => {
  await resetDatabase(page)
  await seedDatabase(page)
  await login(page)
})
```

### 4. Configuration Traces Playwright + Screenshots

**Fichier**: `playwright.config.ts` (mise à jour)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'], // Console output détaillé
  ],

  outputDir: 'test-results/',

  use: {
    baseURL: 'http://localhost:3003',

    // ✅ GEMINI RECOMMENDATION: Traces activées pour debugging
    trace: 'on-first-retry', // 'on' pour capturer toutes les traces (plus lourd)

    // ✅ GEMINI RECOMMENDATION: Screenshots sur échec
    screenshot: 'only-on-failure',

    // Video pour debug complexe (optionnel)
    video: 'retain-on-failure',

    // Timeout assertions
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Projets multi-browser
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        // Émuler 3G pour tests performance
        launchOptions: {
          slowMo: 200, // Ralentir pour émuler latence réseau
        },
      },
    },
  ],

  // ✅ WEB SEARCH RECOMMENDATION: Server local auto-start
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes startup
  },

  expect: {
    timeout: 10000,
  },

  timeout: 60000, // 1 minute par test
})
```

---

## 📚 Checklist Sprint 0 - Tests E2E

### Phase 1: Baseline Fonctionnelle (Actuel)
- [x] Tests CRUD création (4 tests)
- [x] Tests CRUD lecture/liste (5 tests)
- [x] Tests CRUD modification (3 tests)
- [x] Tests CRUD suppression (3 tests)
- [x] Tests performance baseline (3 tests)
- [x] Tests gestion erreurs (3 tests)
- **Total**: 21 tests

### Phase 2: Améliorations Critiques Core 20% (À Faire)
- [ ] Tests invalidation cache TanStack Query (3 tests nouveaux)
- [ ] Tests optimistic updates + rollback (3 tests nouveaux)
- [ ] DB seeding/reset API endpoints (2 fichiers)
- [ ] Helpers database pour Playwright (1 fichier)
- [ ] Configuration traces + screenshots (mise à jour config)
- **Total**: +6 tests, +3 fichiers infra

### Phase 3: Exécution & Validation
- [ ] Exécuter suite complète en local (27 tests)
- [ ] Valider temps exécution < 5 minutes
- [ ] Capturer screenshots baseline (avant migration)
- [ ] Documenter résultats dans rapport Sprint 0
- [ ] Commit baseline + push branche `feat/sprint-0-baseline-tests`

---

## 🎯 Métriques de Succès Sprint 0

### Couverture Tests
- **Fonctionnelle**: 100% CRUD produits (Create, Read, Update, Delete)
- **Cache**: 100% invalidations critiques TanStack Query
- **UX**: 100% optimistic updates + rollbacks
- **Performance**: 3 métriques baseline (page load, API, recherche)
- **Erreurs**: 3 scénarios gestion erreurs

### Performance Baseline
- Page load < 3s sur mobile 3G
- API calls < 500ms (Turso Edge)
- Recherche fuzzy < 50ms (client-side)

### Fiabilité Infrastructure
- DB seeding reproductible 100% tests
- Traces Playwright activées
- Screenshots baseline capturés
- Zéro flaky tests (idempotence garantie)

---

## 📖 Ressources & Références

### Documentation Officielle
- [TanStack Query v5 - Nuxt 3](https://tanstack.com/query/v5/docs/framework/vue/examples/nuxt3)
- [TanStack Query - Does this replace Pinia?](https://tanstack.com/query/v5/docs/vue/guides/does-this-replace-client-state)
- [Playwright - Best Practices](https://playwright.dev/docs/best-practices)
- [Nuxt Test Utils - Playwright Integration](https://nuxt.com/docs/getting-started/testing#playwright-integration)

### Articles Experts
- [Markus Oberlehner - Contract Tests Nuxt](https://markus.oberlehner.net/blog/no-more-mocking-write-better-tests-for-microservices-powered-server-side-rendered-applications-with-contract-tests)
- [DeviQA - Playwright Guide 2025](https://www.deviqa.com/blog/guide-to-playwright-end-to-end-testing-in-2025/)

### Consultation Experts
- **Gemini (Session du 2025-11-02)**: Analyse architecture, priorisation Core 20%, identification pièges
- **Web Search (2025-11-02)**: Best practices Playwright + Nuxt 3, DB seeding, locators

---

**Prochaine étape**: Implémenter améliorations critiques Core 20% listées ci-dessus. 🚀
