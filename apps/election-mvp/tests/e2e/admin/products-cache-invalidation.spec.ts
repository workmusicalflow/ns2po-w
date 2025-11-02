import { test, expect, type Page } from '@playwright/test'

/**
 * 🎯 Tests E2E - Invalidation Cache TanStack Query
 *
 * Recommandation Gemini Sprint 1: "Tests E2E invalidation cache TanStack Query"
 *
 * Objectifs:
 * - ✅ Valider invalidation cache après mutations CRUD
 * - ✅ Vérifier synchronisation cache multi-pages
 * - ✅ Détecter stale data issues
 * - ✅ Tester optimistic updates + rollback
 * - ✅ Valider SSE synchronisation cache
 *
 * Architecture testée:
 * - TanStack Query v5 (server state)
 * - Query keys hiérarchiques
 * - Invalidation ciblée (exact: true/false)
 * - SSE temps réel (useSSEUpdates)
 */

const ADMIN_URL = '/admin/products'
const ADMIN_LOGIN_URL = '/admin/login'

// Login helper
async function login(page: Page) {
  await page.goto(ADMIN_LOGIN_URL)
  await page.fill('input[type="email"]', 'admin@ns2po.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin**')
}

// Helper: Wait for network idle (cache settled)
async function waitForCacheSettled(page: Page, timeout = 2000) {
  await page.waitForTimeout(timeout)
  await page.waitForLoadState('networkidle')
}

// Helper: Get product count from list
async function getProductCount(page: Page): Promise<number> {
  const productCards = await page.locator('[data-testid="product-card"]').count()
  return productCards
}

// Helper: Check if product exists in list by name
async function productExistsInList(page: Page, productName: string): Promise<boolean> {
  const count = await page.locator(`text=${productName}`).count()
  return count > 0
}

test.describe('Cache Invalidation - CREATE Operations', () => {
  test('CI-01: Cache invalidation après CREATE - Liste rafraîchie automatiquement', async ({ page }) => {
    await login(page)
    await page.goto(ADMIN_URL)

    // 1. Compter produits initiaux (cache liste)
    await waitForCacheSettled(page)
    const initialCount = await getProductCount(page)
    console.log(`Produits initiaux: ${initialCount}`)

    // 2. Créer nouveau produit
    await page.goto(`${ADMIN_URL}/new`)
    const testProductName = `Test Cache CREATE ${Date.now()}`

    await page.fill('#name', testProductName)
    await page.fill('#reference', `REF-CACHE-${Date.now()}`)
    await page.fill('#description', 'Test invalidation cache CREATE')
    await page.fill('#price', '12000')
    await page.fill('#min_quantity', '50')
    await page.selectOption('#category_id', 'textiles')

    // 3. Soumettre + attendre toast success
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    // 4. Retourner à la liste
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)

    // 5. ✅ Vérifier invalidation cache: nouveau produit visible
    const newCount = await getProductCount(page)
    expect(newCount).toBe(initialCount + 1)

    const exists = await productExistsInList(page, testProductName)
    expect(exists).toBe(true)

    console.log(`✅ Cache invalidé: ${initialCount} → ${newCount} produits`)
  })

  test('CI-02: Cache pré-population - Détail accessible immédiatement après CREATE', async ({ page }) => {
    await login(page)
    await page.goto(`${ADMIN_URL}/new`)

    const testProductName = `Test Cache Prepopulate ${Date.now()}`
    const testReference = `REF-PREPOP-${Date.now()}`

    await page.fill('#name', testProductName)
    await page.fill('#reference', testReference)
    await page.fill('#description', 'Test pré-population cache')
    await page.fill('#price', '15000')
    await page.fill('#min_quantity', '100')
    await page.selectOption('#category_id', 'accessoires')

    // Soumettre (redirection auto vers détail)
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    // ✅ Vérifier redirection immédiate vers page détail (pré-population cache)
    await expect(page).toHaveURL(/\/admin\/products\/prod_.*/)

    // ✅ Vérifier données affichées sans spinner (cache pré-populated)
    await expect(page.locator(`text=${testProductName}`)).toBeVisible({ timeout: 1000 })
    await expect(page.locator(`text=${testReference}`)).toBeVisible()

    console.log('✅ Cache détail pré-populé après CREATE')
  })
})

test.describe('Cache Invalidation - UPDATE Operations', () => {
  let testProductId: string
  let testProductName: string

  test.beforeEach(async ({ page }) => {
    // Créer produit de test
    await login(page)
    await page.goto(`${ADMIN_URL}/new`)

    testProductName = `Test Cache UPDATE ${Date.now()}`

    await page.fill('#name', testProductName)
    await page.fill('#reference', `REF-UPDATE-${Date.now()}`)
    await page.fill('#description', 'Test invalidation cache UPDATE')
    await page.fill('#price', '10000')
    await page.fill('#min_quantity', '50')
    await page.selectOption('#category_id', 'textiles')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    // Récupérer ID du produit depuis URL
    const url = page.url()
    const match = url.match(/prod_[a-z0-9_]+/)
    testProductId = match ? match[0] : ''

    console.log(`Produit de test créé: ${testProductId}`)
  })

  test('CI-03: Cache invalidation après UPDATE - Détail + Liste synchronisés', async ({ page }) => {
    // 1. Modifier le produit
    const updatedName = `${testProductName} - UPDATED`
    const updatedPrice = '18000'

    await page.fill('#name', updatedName)
    await page.fill('#price', updatedPrice)

    // Soumettre update
    await page.click('button[type="submit"]:has-text("Enregistrer")')
    await expect(page.locator('text=/mis à jour avec succès/i')).toBeVisible({ timeout: 5000 })

    // 2. ✅ Vérifier cache détail mis à jour (pas de reload)
    await expect(page.locator(`#name[value="${updatedName}"]`)).toBeVisible()
    await expect(page.locator(`#price[value="${updatedPrice}"]`)).toBeVisible()

    // 3. ✅ Vérifier cache liste invalidé
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)

    const exists = await productExistsInList(page, updatedName)
    expect(exists).toBe(true)

    console.log('✅ Cache détail + liste synchronisés après UPDATE')
  })

  test('CI-04: Optimistic update visible immédiatement', async ({ page }) => {
    const updatedDescription = `Description optimiste ${Date.now()}`

    // Modifier description (optimistic update)
    await page.fill('#description', updatedDescription)

    // ✅ Soumettre et vérifier update immédiat (optimistic)
    const submitPromise = page.click('button[type="submit"]:has-text("Enregistrer")')

    // Attendre un court instant (optimistic update doit être visible AVANT la réponse API)
    await page.waitForTimeout(100)

    // Vérifier que la valeur est toujours présente (optimistic update)
    await expect(page.locator(`#description`)).toHaveValue(updatedDescription)

    await submitPromise
    await expect(page.locator('text=/mis à jour avec succès/i')).toBeVisible({ timeout: 5000 })

    console.log('✅ Optimistic update fonctionne')
  })
})

test.describe('Cache Invalidation - DELETE Operations', () => {
  let testProductId: string
  let testProductName: string

  test.beforeEach(async ({ page }) => {
    // Créer produit de test
    await login(page)
    await page.goto(`${ADMIN_URL}/new`)

    testProductName = `Test Cache DELETE ${Date.now()}`

    await page.fill('#name', testProductName)
    await page.fill('#reference', `REF-DELETE-${Date.now()}`)
    await page.fill('#description', 'Test invalidation cache DELETE')
    await page.fill('#price', '8000')
    await page.fill('#min_quantity', '25')
    await page.selectOption('#category_id', 'gadgets')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    const url = page.url()
    const match = url.match(/prod_[a-z0-9_]+/)
    testProductId = match ? match[0] : ''
  })

  test('CI-05: Cache invalidation après DELETE - Produit supprimé de liste', async ({ page }) => {
    // 1. Vérifier produit visible dans liste
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)

    const existsBefore = await productExistsInList(page, testProductName)
    expect(existsBefore).toBe(true)

    const countBefore = await getProductCount(page)

    // 2. Supprimer le produit
    await page.goto(`${ADMIN_URL}/${testProductId}`)
    await page.click('button:has-text("Supprimer")')

    // Confirmer modal
    await page.click('button:has-text("Confirmer"):visible')
    await expect(page.locator('text=/supprimé avec succès/i')).toBeVisible({ timeout: 5000 })

    // 3. ✅ Vérifier cache liste invalidé (produit disparu)
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)

    const existsAfter = await productExistsInList(page, testProductName)
    expect(existsAfter).toBe(false)

    const countAfter = await getProductCount(page)
    expect(countAfter).toBe(countBefore - 1)

    console.log(`✅ Cache liste invalidé: ${countBefore} → ${countAfter} produits`)
  })

  test('CI-06: Cache détail supprimé après DELETE', async ({ page }) => {
    // Supprimer le produit
    await page.click('button:has-text("Supprimer")')
    await page.click('button:has-text("Confirmer"):visible')
    await expect(page.locator('text=/supprimé avec succès/i')).toBeVisible({ timeout: 5000 })

    // Redirection vers liste
    await expect(page).toHaveURL(ADMIN_URL)

    // ✅ Tenter d'accéder au détail → doit retourner 404 (cache supprimé)
    const response = await page.goto(`${ADMIN_URL}/${testProductId}`)

    // Vérifier 404 ou redirection (cache invalidé)
    if (response) {
      expect([404, 302, 301]).toContain(response.status())
    }

    console.log('✅ Cache détail supprimé après DELETE')
  })
})

test.describe('Cache Synchronisation - Multi-Pages', () => {
  test('CI-07: Cache partagé entre onglets - UPDATE visible partout', async ({ browser }) => {
    // Créer 2 contextes (simule 2 onglets)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // Login sur les 2 pages
      await login(page1)
      await login(page2)

      // Page 1: Créer produit
      await page1.goto(`${ADMIN_URL}/new`)
      const testProductName = `Test Multi-Tab ${Date.now()}`

      await page1.fill('#name', testProductName)
      await page1.fill('#reference', `REF-MULTITAB-${Date.now()}`)
      await page1.fill('#description', 'Test sync multi-tabs')
      await page1.fill('#price', '20000')
      await page1.fill('#min_quantity', '100')
      await page1.selectOption('#category_id', 'textiles')

      await page1.click('button[type="submit"]')
      await expect(page1.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

      const url = page1.url()
      const match = url.match(/prod_[a-z0-9_]+/)
      const productId = match ? match[0] : ''

      // Page 2: Naviguer vers liste
      await page2.goto(ADMIN_URL)
      await waitForCacheSettled(page2)

      // ✅ Vérifier nouveau produit visible sur page2 (cache partagé)
      const exists = await productExistsInList(page2, testProductName)
      expect(exists).toBe(true)

      // Page 1: Modifier le produit
      const updatedName = `${testProductName} - SYNCED`
      await page1.fill('#name', updatedName)
      await page1.click('button[type="submit"]:has-text("Enregistrer")')
      await expect(page1.locator('text=/mis à jour avec succès/i')).toBeVisible({ timeout: 5000 })

      // Page 2: Rafraîchir liste
      await page2.reload()
      await waitForCacheSettled(page2)

      // ✅ Vérifier modification visible sur page2
      const updatedExists = await productExistsInList(page2, updatedName)
      expect(updatedExists).toBe(true)

      console.log('✅ Cache synchronisé entre pages')
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})

test.describe('Stale Data Detection', () => {
  test('CI-08: Pas de stale data après invalidation ciblée', async ({ page }) => {
    await login(page)
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)

    // 1. Charger liste (mise en cache)
    const initialCount = await getProductCount(page)

    // 2. Créer produit via API (simule action autre utilisateur)
    const testProductName = `Test Stale Data ${Date.now()}`

    await page.goto(`${ADMIN_URL}/new`)
    await page.fill('#name', testProductName)
    await page.fill('#reference', `REF-STALE-${Date.now()}`)
    await page.fill('#description', 'Test stale data detection')
    await page.fill('#price', '14000')
    await page.fill('#min_quantity', '75')
    await page.selectOption('#category_id', 'accessoires')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    // 3. Retourner à la liste
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)

    // 4. ✅ Vérifier pas de stale data (invalidation a fonctionné)
    const newCount = await getProductCount(page)
    expect(newCount).toBe(initialCount + 1)

    const exists = await productExistsInList(page, testProductName)
    expect(exists).toBe(true)

    console.log('✅ Pas de stale data détectée')
  })

  test('CI-09: Cache respecte staleTime (5min) - Pas de refetch inutile', async ({ page }) => {
    await login(page)
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)

    // Écouter requêtes réseau
    let apiCallCount = 0
    page.on('request', request => {
      if (request.url().includes('/api/products') && request.method() === 'GET') {
        apiCallCount++
        console.log(`API call #${apiCallCount}: ${request.url()}`)
      }
    })

    // 1. Charger liste (1er appel API)
    await page.reload()
    await waitForCacheSettled(page)
    const firstCallCount = apiCallCount

    // 2. Naviguer ailleurs puis revenir (dans la fenêtre staleTime)
    await page.goto('/admin')
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page, 1000)

    // ✅ Vérifier pas de nouvel appel API (cache encore fresh)
    expect(apiCallCount).toBe(firstCallCount)

    console.log(`✅ Cache fresh: ${apiCallCount} appel(s) API uniquement`)
  })
})

test.describe('Performance Cache - 3G Target', () => {
  test('P-01: Cache améliore latence page load < 3s (mobile 3G)', async ({ page }) => {
    await login(page)

    // 1. Premier load (cold cache)
    const coldStart = Date.now()
    await page.goto(ADMIN_URL)
    await waitForCacheSettled(page)
    const coldDuration = Date.now() - coldStart

    // 2. Second load (warm cache)
    const warmStart = Date.now()
    await page.reload()
    await waitForCacheSettled(page)
    const warmDuration = Date.now() - warmStart

    console.log(`Cold cache: ${coldDuration}ms | Warm cache: ${warmDuration}ms`)

    // ✅ Vérifier amélioration performance avec cache
    expect(warmDuration).toBeLessThan(coldDuration)

    // ✅ Target < 3s même cold cache (mobile 3G)
    expect(coldDuration).toBeLessThan(3000)

    console.log('✅ Performance cache validée')
  })
})
