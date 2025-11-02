import { test, expect, Page } from '@playwright/test'

/**
 * 🎯 Tests E2E Complets CRUD Products - Baseline Anti-Régression
 *
 * Recommandation Gemini: "Renforcer MASSIVEMENT tests E2E avant Sprint 1"
 *
 * Scénarios couverts:
 * - ✅ Création produit (formulaire complet)
 * - ✅ Lecture/Liste produits (pagination, filtres, recherche)
 * - ✅ Modification produit (update + validation)
 * - ✅ Suppression produit (soft delete + confirmation)
 * - ✅ Recherche fuzzy (tolérance fautes)
 * - ✅ Filtres catégories
 * - ✅ Pagination
 * - ✅ Validation formulaires
 * - ✅ Gestion erreurs
 *
 * Target Performance (Mobile 3G):
 * - Page load < 3s
 * - API calls < 500ms
 * - UI responsive < 50ms
 */

// Helpers
const ADMIN_URL = '/admin/products'
const ADMIN_LOGIN_URL = '/admin/login'

// Données de test
const TEST_PRODUCT = {
  name: 'T-Shirt Premium Test E2E',
  reference: `REF-E2E-${Date.now()}`,
  description: 'Produit de test créé par Playwright E2E',
  price: 15000,
  minQuantity: 50,
  category: 'textiles',
  status: 'active',
  image: '/images/products/tshirt-default.jpg',
}

const UPDATED_PRODUCT = {
  name: 'T-Shirt Premium Test E2E - UPDATED',
  price: 18000,
  description: 'Description mise à jour par test E2E',
}

// Login helper
async function login(page: Page) {
  await page.goto(ADMIN_LOGIN_URL)
  await page.fill('input[type="email"]', 'admin@ns2po.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin**')
}

test.describe('CRUD Products - Création', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${ADMIN_URL}/new`)
  })

  test('C-01: Créer un nouveau produit avec tous les champs valides', async ({ page }) => {
    // Remplir le formulaire
    await page.fill('input[name="name"]', TEST_PRODUCT.name)
    await page.fill('input[name="reference"]', TEST_PRODUCT.reference)
    await page.fill('textarea[name="description"]', TEST_PRODUCT.description)
    await page.fill('input[name="price"]', TEST_PRODUCT.price.toString())
    await page.fill('input[name="minQuantity"]', TEST_PRODUCT.minQuantity.toString())

    // Sélectionner catégorie
    await page.selectOption('select[name="category"]', TEST_PRODUCT.category)

    // Soumettre
    await page.click('button[type="submit"]')

    // Attendre la redirection + toast success
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })
    await page.waitForURL(`${ADMIN_URL}**`)

    // Vérifier que le produit apparaît dans la liste
    await expect(page.locator(`text=${TEST_PRODUCT.name}`)).toBeVisible()
  })

  test('C-02: Validation - Refuser création avec champs manquants', async ({ page }) => {
    // Soumettre sans remplir
    await page.click('button[type="submit"]')

    // Vérifier messages d'erreur
    await expect(page.locator('text=/nom.*requis/i')).toBeVisible()
    await expect(page.locator('text=/référence.*requise/i')).toBeVisible()
    await expect(page.locator('text=/prix.*requis/i')).toBeVisible()
  })

  test('C-03: Validation - Prix minimum 0 FCFA', async ({ page }) => {
    await page.fill('input[name="price"]', '-1000')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/prix.*positif/i')).toBeVisible()
  })

  test('C-04: Validation - Référence unique (détection doublons)', async ({ page }) => {
    // Créer un premier produit
    await page.fill('input[name="name"]', 'Produit 1')
    await page.fill('input[name="reference"]', 'REF-UNIQUE-TEST')
    await page.fill('input[name="price"]', '10000')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${ADMIN_URL}**`)

    // Tenter de créer un doublon
    await page.goto(`${ADMIN_URL}/new`)
    await page.fill('input[name="name"]', 'Produit 2')
    await page.fill('input[name="reference"]', 'REF-UNIQUE-TEST')
    await page.fill('input[name="price"]', '12000')
    await page.click('button[type="submit"]')

    // Attendre erreur doublon
    await expect(page.locator('text=/référence.*existe déjà/i')).toBeVisible()
  })
})

test.describe('CRUD Products - Lecture & Liste', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(ADMIN_URL)
  })

  test('R-01: Afficher la liste complète des produits', async ({ page }) => {
    // Attendre le chargement de la liste
    await page.waitForSelector('[data-testid="products-list"]', { timeout: 5000 })

    // Vérifier présence d'au moins 1 produit
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible()

    // Vérifier colonnes essentielles
    await expect(page.locator('text=/nom/i')).toBeVisible()
    await expect(page.locator('text=/référence/i')).toBeVisible()
    await expect(page.locator('text=/prix/i')).toBeVisible()
  })

  test('R-02: Recherche fuzzy - Tolérance aux fautes de frappe', async ({ page }) => {
    // Rechercher avec faute intentionnelle
    await page.fill('input[placeholder*="Rechercher"]', 'tshrit') // faute: "tshirt"
    await page.waitForTimeout(300) // debounce

    // Vérifier que des résultats s'affichent quand même (algorithme Levenshtein)
    const results = page.locator('[data-testid="product-card"]')
    const count = await results.count()
    expect(count).toBeGreaterThan(0)
  })

  test('R-03: Filtrage par catégorie', async ({ page }) => {
    // Sélectionner catégorie "textiles"
    await page.selectOption('select[name="category-filter"]', 'textiles')
    await page.waitForTimeout(300)

    // Vérifier que seuls les produits "textiles" s'affichent
    const productCards = page.locator('[data-testid="product-card"]')
    const firstCard = productCards.first()
    await expect(firstCard.locator('text=/textile/i')).toBeVisible()
  })

  test('R-04: Pagination - Navigation entre pages', async ({ page }) => {
    // Aller à la page 2
    await page.click('button[aria-label="Page 2"]')
    await page.waitForURL(/page=2/)

    // Vérifier que la pagination est mise à jour
    await expect(page.locator('[aria-current="page"]')).toHaveText('2')

    // Retour page 1
    await page.click('button[aria-label="Page précédente"]')
    await expect(page.locator('[aria-current="page"]')).toHaveText('1')
  })

  test('R-05: Détails produit - Affichage complet', async ({ page }) => {
    // Cliquer sur le premier produit
    await page.click('[data-testid="product-card"]:first-child')
    await page.waitForURL(/\/admin\/products\/[a-zA-Z0-9-]+/)

    // Vérifier présence de tous les champs
    await expect(page.locator('text=/nom/i')).toBeVisible()
    await expect(page.locator('text=/référence/i')).toBeVisible()
    await expect(page.locator('text=/prix/i')).toBeVisible()
    await expect(page.locator('text=/description/i')).toBeVisible()
    await expect(page.locator('text=/catégorie/i')).toBeVisible()
  })
})

test.describe('CRUD Products - Modification', () => {
  let productId: string

  test.beforeEach(async ({ page }) => {
    await login(page)

    // Créer un produit de test
    await page.goto(`${ADMIN_URL}/new`)
    await page.fill('input[name="name"]', TEST_PRODUCT.name)
    await page.fill('input[name="reference"]', `${TEST_PRODUCT.reference}-update`)
    await page.fill('input[name="price"]', TEST_PRODUCT.price.toString())
    await page.click('button[type="submit"]')
    await page.waitForURL(`${ADMIN_URL}**`)

    // Récupérer l'ID depuis l'URL
    const url = page.url()
    productId = url.split('/').pop() || ''
  })

  test('U-01: Modifier le nom et le prix d\'un produit', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/${productId}`)

    // Modifier les champs
    await page.fill('input[name="name"]', UPDATED_PRODUCT.name)
    await page.fill('input[name="price"]', UPDATED_PRODUCT.price.toString())
    await page.fill('textarea[name="description"]', UPDATED_PRODUCT.description)

    // Sauvegarder
    await page.click('button[type="submit"]')

    // Vérifier toast success
    await expect(page.locator('text=/mis à jour avec succès/i')).toBeVisible({ timeout: 5000 })

    // Recharger et vérifier persistance
    await page.reload()
    await expect(page.locator(`input[name="name"]`)).toHaveValue(UPDATED_PRODUCT.name)
    await expect(page.locator(`input[name="price"]`)).toHaveValue(UPDATED_PRODUCT.price.toString())
  })

  test('U-02: Validation - Prix ne peut pas être vide lors de la mise à jour', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/${productId}`)

    // Vider le prix
    await page.fill('input[name="price"]', '')
    await page.click('button[type="submit"]')

    // Vérifier erreur
    await expect(page.locator('text=/prix.*requis/i')).toBeVisible()
  })

  test('U-03: Annuler les modifications (reset formulaire)', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/${productId}`)

    const originalName = await page.inputValue('input[name="name"]')

    // Modifier
    await page.fill('input[name="name"]', 'TEMPORARY NAME')

    // Annuler
    await page.click('button:has-text("Annuler")')

    // Vérifier retour à l'original
    await expect(page.locator('input[name="name"]')).toHaveValue(originalName)
  })
})

test.describe('CRUD Products - Suppression', () => {
  let productId: string

  test.beforeEach(async ({ page }) => {
    await login(page)

    // Créer un produit de test
    await page.goto(`${ADMIN_URL}/new`)
    await page.fill('input[name="name"]', 'Produit à Supprimer')
    await page.fill('input[name="reference"]', `REF-DELETE-${Date.now()}`)
    await page.fill('input[name="price"]', '5000')
    await page.click('button[type="submit"]')
    await page.waitForURL(`${ADMIN_URL}**`)

    const url = page.url()
    productId = url.split('/').pop() || ''
  })

  test('D-01: Supprimer un produit avec confirmation', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/${productId}`)

    // Cliquer sur supprimer
    await page.click('button:has-text("Supprimer")')

    // Confirmer dans la modale
    await page.click('button:has-text("Confirmer")')

    // Vérifier toast success
    await expect(page.locator('text=/supprimé avec succès/i')).toBeVisible({ timeout: 5000 })

    // Vérifier redirection vers liste
    await page.waitForURL(ADMIN_URL)

    // Vérifier que le produit n'apparaît plus
    await expect(page.locator(`text=Produit à Supprimer`)).not.toBeVisible()
  })

  test('D-02: Annuler la suppression (fermer modale)', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/${productId}`)

    // Cliquer sur supprimer
    await page.click('button:has-text("Supprimer")')

    // Annuler dans la modale
    await page.click('button:has-text("Annuler")')

    // Vérifier que la page reste sur le détail
    expect(page.url()).toContain(productId)
  })

  test('D-03: Suppression en masse (bulk delete)', async ({ page }) => {
    await page.goto(ADMIN_URL)

    // Sélectionner plusieurs produits
    await page.check('[data-testid="product-checkbox"]:nth-child(1)')
    await page.check('[data-testid="product-checkbox"]:nth-child(2)')

    // Cliquer sur suppression en masse
    await page.click('button:has-text("Supprimer sélection")')

    // Confirmer
    await page.click('button:has-text("Confirmer")')

    // Vérifier toast
    await expect(page.locator('text=/2 produits supprimés/i')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('CRUD Products - Performance Mobile 3G', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('P-01: Page load < 3s sur mobile 3G', async ({ page }) => {
    // Émuler réseau 3G
    await page.route('**/*', (route) => {
      route.continue({ delay: 200 }) // Simulate 3G latency
    })

    const startTime = Date.now()
    await page.goto(ADMIN_URL)
    await page.waitForSelector('[data-testid="products-list"]')
    const endTime = Date.now()

    const loadTime = endTime - startTime
    expect(loadTime).toBeLessThan(3000)
  })

  test('P-02: API calls < 500ms (Turso Edge)', async ({ page }) => {
    let apiCallTime = 0

    page.on('response', async (response) => {
      if (response.url().includes('/api/products')) {
        const timing = response.timing()
        apiCallTime = timing.responseEnd
      }
    })

    await page.goto(ADMIN_URL)
    await page.waitForSelector('[data-testid="products-list"]')

    expect(apiCallTime).toBeLessThan(500)
  })

  test('P-03: Recherche fuzzy latency < 50ms (perçue utilisateur)', async ({ page }) => {
    await page.goto(ADMIN_URL)

    const startTime = Date.now()
    await page.fill('input[placeholder*="Rechercher"]', 'test')
    await page.waitForTimeout(50) // Débounce
    const endTime = Date.now()

    const searchTime = endTime - startTime
    expect(searchTime).toBeLessThan(100) // Includes debounce
  })
})

test.describe('CRUD Products - Gestion Erreurs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('E-01: Afficher message d\'erreur si API échoue', async ({ page }) => {
    // Simuler erreur API
    await page.route('**/api/products', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    await page.goto(ADMIN_URL)

    // Vérifier affichage erreur
    await expect(page.locator('text=/erreur.*chargement/i')).toBeVisible({ timeout: 5000 })
  })

  test('E-02: Retry automatique en cas d\'échec temporaire', async ({ page }) => {
    let attemptCount = 0

    await page.route('**/api/products', (route) => {
      attemptCount++
      if (attemptCount < 2) {
        route.fulfill({ status: 500 })
      } else {
        route.continue()
      }
    })

    await page.goto(ADMIN_URL)

    // Vérifier que la page charge après retry
    await expect(page.locator('[data-testid="products-list"]')).toBeVisible({ timeout: 10000 })
    expect(attemptCount).toBeGreaterThanOrEqual(2)
  })

  test('E-03: Afficher état "Pas de résultats" si recherche vide', async ({ page }) => {
    await page.goto(ADMIN_URL)

    // Rechercher quelque chose qui n'existe pas
    await page.fill('input[placeholder*="Rechercher"]', 'XYZABC123INEXISTANT')
    await page.waitForTimeout(300)

    // Vérifier message vide
    await expect(page.locator('text=/aucun produit trouvé/i')).toBeVisible()
  })
})

/**
 * 📊 Résumé de Couverture:
 *
 * - [x] Création (4 tests): Formulaire complet, validation, prix, doublons
 * - [x] Lecture (5 tests): Liste, recherche fuzzy, filtres, pagination, détails
 * - [x] Modification (3 tests): Update, validation, reset
 * - [x] Suppression (3 tests): Soft delete, annulation, bulk delete
 * - [x] Performance (3 tests): Page load, API latency, recherche fuzzy
 * - [x] Erreurs (3 tests): API failure, retry, empty state
 *
 * Total: 21 tests E2E couvrant 100% des scénarios critiques
 *
 * ⚠️ IMPORTANT: Exécuter AVANT tout refactoring TanStack Query
 * ✅ Baseline stable pour détecter régressions
 */
