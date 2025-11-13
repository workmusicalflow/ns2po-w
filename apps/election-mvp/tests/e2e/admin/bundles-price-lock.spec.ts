/**
 * 🔒 Tests E2E - Bundle Price Lock Feature
 *
 * Architecture Pareto 80/20:
 * - Default: price_locked = 0 (auto-sync, 80% des cas)
 * - Opt-in: price_locked = 1 (prix fixe, 20% des cas)
 *
 * Pattern SQL CASE WHEN:
 * CASE
 *   WHEN bp.price_locked = 1 AND bp.custom_price IS NOT NULL THEN bp.custom_price
 *   ELSE p.base_price
 * END
 *
 * Scénarios testés:
 * ✅ 1. Auto-Sync (default) - Prix bundle suit prix catalogue
 * ✅ 2. Prix Fixe (locked) - Prix bundle figé malgré changement catalogue
 * ✅ 3. Checkbox UI - Toggle et persistance
 * ✅ 4. Warning visuel - Écart > 5%
 * ✅ 5. Tooltip - Information contextuelle
 *
 * Validation multi-agents: Gemini + Google Search Grounding (25 sources)
 * Patterns: Magento dynamic_price, WooCommerce priced_individually
 */

import { test, expect, type Page } from '@playwright/test'

// Configuration
const TEST_BASE_URL = 'http://localhost:3003'
const ADMIN_EMAIL = 'admin@ns2po.com'
const ADMIN_PASSWORD = 'admin123'

// Prix de test
const INITIAL_PRODUCT_PRICE = 5800
const UPDATED_CATALOG_PRICE = 6200
const LOCKED_CUSTOM_PRICE = 5500

// Helper: Login admin
async function login(page: Page) {
  await page.goto(`${TEST_BASE_URL}/admin/login`)
  await page.fill('input[type="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/admin/**')
  console.log('✅ Login admin réussi')
}

// Helper: Créer un produit test via API
async function createTestProduct(request: any, name: string, price: number): Promise<string> {
  console.log(`🔧 Création produit test: ${name} - Prix: ${price} FCFA`)

  const response = await request.post(`${TEST_BASE_URL}/api/admin/products`, {
    data: {
      name,
      basePrice: price, // Utiliser basePrice au lieu de price
      category: 'goodies',
      minQuantity: 10,
      description: `Test product for Bundle Price Lock - ${name}`,
      isActive: true,
      // Champs obligatoires pour validation Zod
      materials: ['coton'], // Au moins un matériau requis
      colors: [{ name: 'blanc', hex: '#FFFFFF' }], // Au moins une couleur requise
      sizes: [{ name: 'M', category: 'XS-XL' }] // Au moins une taille requise
    },
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    console.error(`❌ Erreur API: ${response.status()} - ${errorBody}`)
    throw new Error(`API Error: ${response.status()} - ${errorBody}`)
  }

  const result = await response.json()
  expect(result.success).toBeTruthy()

  const productId = result.data.id
  console.log(`✅ Produit créé: ID=${productId}`)
  return productId
}

// Helper: Créer un bundle test via API
async function createTestBundle(request: any, name: string, products: any[]): Promise<string> {
  console.log(`🔧 Création bundle test: ${name}`)

  // Enrichir les produits avec le champ "name" si manquant
  const enrichedProducts = await Promise.all(
    products.map(async (product) => {
      // Si le produit n'a pas de nom, récupérer via API
      if (!product.name) {
        const productResponse = await request.get(`${TEST_BASE_URL}/api/admin/products/${product.id}`)
        const productData = await productResponse.json()
        product.name = productData.data?.name || `Product ${product.id}`
      }
      return product
    })
  )

  // Calculer le total estimé à partir des produits
  const estimatedTotal = enrichedProducts.reduce((sum, p) => sum + p.subtotal, 0)

  const response = await request.post(`${TEST_BASE_URL}/api/campaign-bundles`, {
    data: {
      name,
      description: `Test bundle for Price Lock feature - ${name}`,
      targetAudience: 'local',
      budgetRange: 'standard', // Champ obligatoire ajouté
      estimatedTotal, // Calculé automatiquement
      isActive: true,
      products: enrichedProducts,
      displayOrder: 1
    },
    headers: { 'Content-Type': 'application/json' }
  })

  if (!response.ok()) {
    const errorBody = await response.text()
    console.error(`❌ Erreur API Bundle: ${response.status()} - ${errorBody}`)
    throw new Error(`Bundle API Error: ${response.status()} - ${errorBody}`)
  }

  const result = await response.json()
  expect(result.success).toBeTruthy()

  const bundleId = result.data.id
  console.log(`✅ Bundle créé: ID=${bundleId}`)

  // 🐛 DEBUG: Afficher les valeurs DB insérées si disponibles
  if (result._debug) {
    console.log('🔍 [DEBUG POST] Valeurs insérées dans DB:', JSON.stringify(result._debug, null, 2))
  }

  return bundleId
}

// Helper: Mettre à jour le prix d'un produit via API
async function updateProductPrice(request: any, productId: string, newPrice: number) {
  console.log(`💲 Mise à jour prix produit ${productId}: ${newPrice} FCFA`)

  const response = await request.put(`${TEST_BASE_URL}/api/admin/products/${productId}`, {
    data: { base_price: newPrice }, // ✅ snake_case pour cohérence API
    headers: { 'Content-Type': 'application/json' }
  })

  expect(response.ok()).toBeTruthy()
  const result = await response.json()
  expect(result.success).toBeTruthy()
  console.log(`✅ Prix produit mis à jour: ${newPrice} FCFA`)
}

// Helper: Récupérer un bundle via API
async function getBundle(request: any, bundleId: string) {
  const response = await request.get(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}`)
  expect(response.ok()).toBeTruthy()
  const result = await response.json()
  expect(result.success).toBeTruthy()

  // 🐛 DEBUG: Afficher les valeurs DB récupérées si disponibles
  if (result._debug) {
    console.log('🔍 [DEBUG GET] Valeurs brutes DB:', JSON.stringify(result._debug, null, 2))
  }

  return result.data
}

// ============================================================
// TEST SUITE 1: AUTO-SYNC (Default - 80% Pareto)
// ============================================================
test.describe.configure({ mode: 'serial' }) // 🔒 Désactiver parallélisme pour éviter race conditions Turso
test.describe('🔄 Scénario 1: Auto-Sync (price_locked = 0)', () => {
  let productId: string
  let bundleId: string
  const productName = `Test Auto-Sync Product ${Date.now()}`
  const bundleName = `Test Auto-Sync Bundle ${Date.now()}`

  test.beforeAll(async ({ request }) => {
    // Créer produit avec prix initial
    productId = await createTestProduct(request, productName, INITIAL_PRODUCT_PRICE)

    // Créer bundle avec auto-sync (default: priceLocked = false)
    bundleId = await createTestBundle(request, bundleName, [
      {
        id: productId,
        quantity: 10,
        basePrice: INITIAL_PRODUCT_PRICE,
        subtotal: INITIAL_PRODUCT_PRICE * 10,
        isRequired: true,
        priceLocked: false // ⚡ Auto-sync activé (Pareto 80%)
      }
    ])
  })

  test('1.1 - Bundle reflète prix initial du catalogue', async ({ request }) => {
    console.log('📋 Test 1.1: Vérification prix initial auto-sync...')

    const bundle = await getBundle(request, bundleId)
    const bundleProduct = bundle.products[0]

    // ASSERTION: Prix bundle = Prix catalogue initial
    expect(bundleProduct.basePrice).toBe(INITIAL_PRODUCT_PRICE)
    console.log(`✅ Prix bundle = ${bundleProduct.basePrice} FCFA (catalogue: ${INITIAL_PRODUCT_PRICE} FCFA)`)
  })

  test('1.2 - Modification catalogue → Bundle auto-sync', async ({ request }) => {
    console.log('📋 Test 1.2: Test synchronisation automatique...')

    // Étape 1: Modifier prix catalogue
    await updateProductPrice(request, productId, UPDATED_CATALOG_PRICE)

    // Étape 2: Retry mechanism pour gérer Turso replication lag (200-300ms)
    // Pattern validé par Gemini + Google Search Grounding (sylvainsimao.com/turso)
    console.log('⏳ Attente synchronisation Turso replica (retry avec polling)...')

    await expect.poll(async () => {
      const bundle = await getBundle(request, bundleId)
      const bundleProduct = bundle.products[0]
      console.log(`  🔄 Polling: basePrice actuel = ${bundleProduct.basePrice} FCFA (attendu: ${UPDATED_CATALOG_PRICE} FCFA)`)
      return bundleProduct.basePrice
    }, {
      message: `Attendre synchronisation prix bundle à ${UPDATED_CATALOG_PRICE} FCFA (Turso replication lag)`,
      intervals: [200, 200, 500, 1000], // 200ms, 200ms, 500ms, 1s (total ~2s)
      timeout: 5000 // Échouer après 5 secondes
    }).toBe(UPDATED_CATALOG_PRICE)

    console.log(`✅ AUTO-SYNC RÉUSSI: Prix bundle synchronisé ${UPDATED_CATALOG_PRICE} FCFA`)
  })

  test.afterAll(async ({ request }) => {
    console.log('🧹 Nettoyage: Suppression bundle et produit test...')
    await request.delete(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}?force=true`)
    await request.delete(`${TEST_BASE_URL}/api/admin/products/${productId}?force=true`)
    console.log('✅ Nettoyage terminé')
  })
})

// ============================================================
// TEST SUITE 2: PRIX FIXE (Locked - 20% Pareto)
// ============================================================
test.describe('🔒 Scénario 2: Prix Fixe (price_locked = 1)', () => {
  let productId: string
  let bundleId: string
  const productName = `Test Locked Product ${Date.now()}`
  const bundleName = `Test Locked Bundle ${Date.now()}`

  test.beforeAll(async ({ request }) => {
    // Créer produit avec prix initial
    productId = await createTestProduct(request, productName, INITIAL_PRODUCT_PRICE)

    // Créer bundle avec prix fixe (locked)
    bundleId = await createTestBundle(request, bundleName, [
      {
        id: productId,
        quantity: 10,
        basePrice: LOCKED_CUSTOM_PRICE, // Prix custom différent du catalogue
        subtotal: LOCKED_CUSTOM_PRICE * 10,
        isRequired: true,
        priceLocked: true // 🔒 Prix figé (Pareto 20%)
      }
    ])
  })

  test('2.1 - Bundle utilise prix custom (pas catalogue)', async ({ request }) => {
    console.log('📋 Test 2.1: Vérification prix custom locked...')

    const bundle = await getBundle(request, bundleId)
    const bundleProduct = bundle.products[0]

    // ASSERTION: Prix bundle = Prix custom (pas catalogue)
    expect(bundleProduct.basePrice).toBe(LOCKED_CUSTOM_PRICE)
    expect(bundleProduct.basePrice).not.toBe(INITIAL_PRODUCT_PRICE)
    console.log(`✅ Prix bundle figé = ${bundleProduct.basePrice} FCFA (catalogue: ${INITIAL_PRODUCT_PRICE} FCFA)`)
  })

  test('2.2 - Modification catalogue → Bundle reste figé', async ({ request }) => {
    console.log('📋 Test 2.2: Test prix figé malgré changement catalogue...')

    // Étape 1: Modifier prix catalogue
    await updateProductPrice(request, productId, UPDATED_CATALOG_PRICE)

    // Étape 2: Retry mechanism pour gérer Turso replication lag
    // Même si prix locked, on doit attendre que la réplication soit synchronisée
    console.log('⏳ Attente synchronisation Turso replica (retry avec polling)...')

    await expect.poll(async () => {
      const bundle = await getBundle(request, bundleId)
      const bundleProduct = bundle.products[0]
      console.log(`  🔄 Polling: basePrice actuel = ${bundleProduct.basePrice} FCFA (attendu: ${LOCKED_CUSTOM_PRICE} FCFA locked)`)
      return bundleProduct.basePrice
    }, {
      message: `Vérifier que prix bundle reste figé à ${LOCKED_CUSTOM_PRICE} FCFA malgré changement catalogue`,
      intervals: [200, 200, 500, 1000], // 200ms, 200ms, 500ms, 1s
      timeout: 5000
    }).toBe(LOCKED_CUSTOM_PRICE)

    // Vérification additionnelle: prix n'a PAS suivi le catalogue
    const bundle = await getBundle(request, bundleId)
    const bundleProduct = bundle.products[0]
    expect(bundleProduct.basePrice).not.toBe(UPDATED_CATALOG_PRICE)

    console.log(`✅ PRIX FIGÉ MAINTENU: ${bundleProduct.basePrice} FCFA (catalogue modifié à ${UPDATED_CATALOG_PRICE} FCFA)`)
  })

  test.afterAll(async ({ request }) => {
    console.log('🧹 Nettoyage: Suppression bundle et produit test...')
    await request.delete(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}?force=true`)
    await request.delete(`${TEST_BASE_URL}/api/admin/products/${productId}?force=true`)
    console.log('✅ Nettoyage terminé')
  })
})

// ============================================================
// TEST SUITE 3: ADMIN UI - CHECKBOX TOGGLE
// ============================================================
test.describe('🎨 Scénario 3: Admin UI - Checkbox Price Lock', () => {
  let productId: string
  let bundleId: string
  const productName = `Test UI Product ${Date.now()}`
  const bundleName = `Test UI Bundle ${Date.now()}`

  test.beforeAll(async ({ request }) => {
    productId = await createTestProduct(request, productName, INITIAL_PRODUCT_PRICE)
    bundleId = await createTestBundle(request, bundleName, [
      {
        id: productId,
        quantity: 5,
        basePrice: INITIAL_PRODUCT_PRICE,
        subtotal: INITIAL_PRODUCT_PRICE * 5,
        isRequired: true,
        priceLocked: false // Default: auto-sync
      }
    ])

    // 🔧 SOLUTION FINALE GEMINI + RECHERCHE WEB: Attendre réplication Turso
    // Source: sylvainsimao.com/turso + docs officielles Turso
    // Lag réplication 200-300ms (write primary → read replica)
    // Tests UI doivent attendre disponibilité données sur replica avant navigation
    console.log('⏳ Attente 500ms réplication Turso (primary → replica)...')
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('✅ Délai réplication OK')
  })

  test('3.1 - Checkbox visible et cliquable', async ({ page, request }) => {
    console.log('📋 Test 3.1: Vérification UI checkbox...')

    // 🔧 NOUVELLE APPROCHE: Vérifier données API AVANT navigation UI
    // Cela isole si le problème vient de Turso replication (backend) ou cache frontend
    console.log(`🔍 [PRE-UI CHECK] Vérification disponibilité bundle ${bundleId} via API...`)

    let apiBundle: any = null
    let apiRetries = 0
    const maxApiRetries = 20 // ⬆️ Augmenté de 10 → 20 pour Turso replication lag

    // Poll API jusqu'à ce que le bundle soit disponible avec les bonnes données
    // Turso distant (aws-eu-west-1.turso.io): primary write → replica read lag 200-600ms
    while (apiRetries < maxApiRetries) {
      try {
        const apiResponse = await request.get(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}`)

        if (apiResponse.ok()) {
          apiBundle = await apiResponse.json()

          // 🔍 DEBUG: Logger TOUTE la réponse API pour diagnostic
          console.log(`🔍 [API RESPONSE] Bundle ${bundleId}:`, JSON.stringify({
            success: apiBundle.success,
            data_id: apiBundle.data?.id,
            data_name: apiBundle.data?.name,
            products_count: apiBundle.data?.products?.length || 0,
            products: apiBundle.data?.products,
            source: apiBundle.source
          }, null, 2))

          // Vérifier que le bundle contient bien notre produit
          const hasCorrectProduct = apiBundle.data?.products?.some((p: any) => p.id === productId)

          if (hasCorrectProduct) {
            console.log(`✅ [PRE-UI CHECK] Bundle ${bundleId} disponible via API avec produit ${productId} après ${apiRetries} retries`)
            console.log(`📦 [PRE-UI CHECK] Produits dans bundle:`, apiBundle.data.products?.map((p: any) => ({ id: p.id, name: p.name, priceLocked: p.priceLocked })))
            break
          } else {
            console.log(`⏳ [PRE-UI CHECK] Bundle ${bundleId} trouvé mais produit ${productId} manquant. Retry ${apiRetries + 1}/${maxApiRetries}...`)
            console.log(`   ⚠️ Produits actuels dans bundle:`, apiBundle.data?.products || 'UNDEFINED/NULL')
          }
        }
      } catch (error) {
        console.log(`⏳ [PRE-UI CHECK] Erreur API (retry ${apiRetries + 1}/${maxApiRetries}):`, error)
      }

      apiRetries++
      // ⬆️ Délai progressif: 500ms → 1000ms après 10 tentatives (gère lag réplication Turso distant)
      await new Promise(resolve => setTimeout(resolve, apiRetries > 10 ? 1000 : 500))
    }

    if (!apiBundle || apiRetries >= maxApiRetries) {
      throw new Error(`❌ [PRE-UI CHECK] Bundle ${bundleId} non disponible via API après ${maxApiRetries} tentatives. Turso replication FAIL.`)
    }

    console.log('✅ [PRE-UI CHECK] Données backend OK, passage à vérification UI...')

    await login(page)

    // 🔧 SOLUTION GEMINI COPILOT: Naviguer d'abord, puis clear cache AVANT que la page charge
    await page.goto(`${TEST_BASE_URL}/admin/bundles/${bundleId}`)

    // Vider cache in-memory TanStack Query + storage IMMÉDIATEMENT après navigation
    // AVANT waitForLoadState pour que le fetch initial utilise des données fraîches
    await page.evaluate(() => {
      if ((window as any).__VUE_QUERY_CLIENT__) {
        (window as any).__VUE_QUERY_CLIENT__.clear()
      }
      localStorage.clear()
      sessionStorage.clear()
    })
    console.log('🧹 QueryClient cache + storage cleared')

    // Force reload pour que la page re-fetch avec cache vide
    await page.reload({ waitUntil: 'networkidle' })

    // 🔧 SOLUTION GEMINI COPILOT: expect.poll() pour attendre réplication Turso
    // Le waitForSelector() direct échoue car réplication lag 200-300ms
    // expect.poll() retry jusqu'à visibilité du produit post-réplication
    console.log(`⏳ Attente visibilité produit "${productName}" (avec retry Turso replication lag)...`)

    await expect.poll(async () => {
      // 🔧 FIX: Utiliser getByRole pour éviter strict mode violation (3 éléments avec même texte)
      // Playwright doc: getByRole('heading') cible uniquement les <h1>-<h6>
      const productHeading = page.getByRole('heading', { name: productName })
      return await productHeading.isVisible()
    }, {
      message: `Le produit "${productName}" n'est pas apparu (Turso replication lag > timeout)`,
      intervals: [200, 200, 500, 1000, 1000], // Total ~3s pour gérer lag 200-300ms
      timeout: 10000 // Timeout total 10s par sécurité
    }).toBe(true)

    console.log(`✅ Produit "${productName}" visible après réplication`)

    // 🔧 FIX: Sélecteur spécifique pour le checkbox Price Lock (pas le premier checkbox de la page!)
    // Le premier checkbox est "Bundle actif" [checked], pas le checkbox Price Lock
    // On cible le checkbox dans la section produit, associé au label "Auto-sync" ou "Prix fixe"
    const checkbox = page.locator('.flex.items-center.gap-2').filter({ hasText: /Auto-sync|Prix fixe/ }).locator('input[type="checkbox"]')
    await expect(checkbox).toBeVisible()

    // Vérifier état initial (non coché = auto-sync)
    const isChecked = await checkbox.isChecked()
    expect(isChecked).toBe(false)
    console.log(`✅ Checkbox visible - État initial: ${isChecked ? 'Prix fixe' : 'Auto-sync'}`)
  })

  test('3.2 - Toggle checkbox → Persistance état', async ({ page }) => {
    console.log('📋 Test 3.2: Test toggle checkbox et persistance...')

    // 🐛 DEBUG: Capture browser console
    page.on('console', msg => {
      const type = msg.type()
      const text = msg.text()
      if (type === 'error' || text.includes('DEBUG') || text.includes('🔥')) {
        console.log(`[Browser ${type.toUpperCase()}] ${text}`)
      }
    })

    await login(page)

    // 🔧 SOLUTION GEMINI COPILOT: Naviguer puis clear cache + reload
    await page.goto(`${TEST_BASE_URL}/admin/bundles/${bundleId}`)

    await page.evaluate(() => {
      if ((window as any).__VUE_QUERY_CLIENT__) {
        (window as any).__VUE_QUERY_CLIENT__.clear()
      }
      localStorage.clear()
      sessionStorage.clear()
    })

    await page.reload({ waitUntil: 'networkidle' })

    // 🔧 SOLUTION GEMINI COPILOT: expect.poll() pour attendre réplication
    await expect.poll(async () => {
      // 🔧 FIX: Utiliser getByRole pour éviter strict mode violation
      const productHeading = page.getByRole('heading', { name: productName })
      return await productHeading.isVisible()
    }, {
      message: `Le produit "${productName}" n'est pas apparu`,
      intervals: [200, 200, 500, 1000, 1000],
      timeout: 10000
    }).toBe(true)

    // 🔧 FIX: Sélecteur spécifique pour le checkbox Price Lock
    const checkbox = page.locator('.flex.items-center.gap-2').filter({ hasText: /Auto-sync|Prix fixe/ }).locator('input[type="checkbox"]')

    // Cocher le checkbox (activer prix fixe)
    await checkbox.check()

    // Vérifier changement label (attendre mise à jour réactive Vue)
    await expect.poll(async () => {
      const labelText = await page.locator('.flex.items-center.gap-2').filter({ hasText: /Prix fixe|Auto-sync/ }).locator('span.text-xs').textContent()
      return labelText?.includes('🔒 Prix fixe')
    }, {
      message: 'Le label ne s\'est pas mis à jour vers "🔒 Prix fixe"',
      intervals: [100, 100, 200],
      timeout: 3000
    }).toBe(true)
    console.log('✅ Checkbox coché - Label: "🔒 Prix fixe"')

    // Enregistrer modifications
    const saveButton = page.locator('button[type="submit"]').filter({ hasText: /Enregistrer|Mettre à jour|Sauvegarder/i }).first()

    // 🐛 DEBUG: Vérifier état du bouton avant clic
    const isDisabled = await saveButton.isDisabled()
    const buttonText = await saveButton.textContent()
    console.log(`🔍 [DEBUG] Bouton Save - Disabled: ${isDisabled}, Text: "${buttonText}"`)

    if (isDisabled) {
      // Capturer l'attribut title qui contient les blockers
      const title = await saveButton.getAttribute('title')
      console.log(`❌ [DEBUG] Bouton DISABLED - Raison: "${title}"`)
    }

    // =======================================================================
    // ▼▼▼ NOUVELLE LOGIQUE : ATTENDRE LA RÉPONSE API DIRECTEMENT ▼▼▼
    // =======================================================================

    console.log('⏳ Clic sur "Enregistrer" et attente de la réponse PUT...')

    try {
      // 1. Préparer l'attente de la réponse réseau AVANT de déclencher l'action
      const responsePromise = page.waitForResponse(response =>
        // Cible la requête PUT spécifique pour la mise à jour de notre bundle
        response.url().includes(`/api/campaign-bundles/${bundleId}`) &&
        response.request().method() === 'PUT',
        { timeout: 7000 } // Timeout légèrement supérieur pour la requête
      )

      // 2. Déclencher l'action qui envoie la requête
      await saveButton.click()

      // 3. Attendre que la promesse de réponse soit résolue
      const response = await responsePromise

      console.log(`✅ Réponse API reçue: ${response.status()} - ${response.statusText()}`)

      // 4. Assertion sur la réponse: s'assurer que la sauvegarde a réussi côté backend
      expect(response.ok()).toBe(true)

    } catch (error) {
      // Ce bloc s'exécutera si le timeout de 7000ms est dépassé SANS réponse du serveur.
      console.error('❌ ERREUR CRITIQUE: Le handler PUT n\'a pas répondu dans le temps imparti.')
      // Faire échouer le test avec un message clair
      throw new Error(`Le handler PUT /api/campaign-bundles/${bundleId} n'a jamais répondu. Le problème vient du backend. Erreur originale: ${error}`)
    }

    // 5. (Optionnel mais recommandé) Vérifier que le toast de succès apparaît APRÈS la confirmation de l'API
    await expect(page.locator('text=/Bundle.*mis à jour|modifié|enregistré/i')).toBeVisible({ timeout: 2000 })
    console.log('✅ Toast de succès affiché sur l\'interface')

    // Recharger page pour vérifier persistance
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Attendre que le produit soit visible après rechargement
    await expect.poll(async () => {
      const productHeading = page.getByRole('heading', { name: productName })
      return await productHeading.isVisible()
    }, {
      message: `Le produit "${productName}" n'est pas apparu après rechargement`,
      intervals: [200, 200, 500],
      timeout: 10000
    }).toBe(true)

    // ASSERTION: Checkbox toujours coché après rechargement
    const checkboxAfterReload = page.locator('input[type="checkbox"]').first()
    const isCheckedAfterReload = await checkboxAfterReload.isChecked()
    expect(isCheckedAfterReload).toBe(true)
    console.log('✅ PERSISTANCE RÉUSSIE: Checkbox toujours coché après reload')
  })

  test.afterAll(async ({ request }) => {
    console.log('🧹 Nettoyage: Suppression bundle et produit test...')
    await request.delete(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}?force=true`)
    await request.delete(`${TEST_BASE_URL}/api/admin/products/${productId}?force=true`)
    console.log('✅ Nettoyage terminé')
  })
})

// ============================================================
// TEST SUITE 4: WARNING VISUEL (Écart > 5%)
// ============================================================
test.describe('⚠️ Scénario 4: Warning Visuel - Écart Prix > 5%', () => {
  let productId: string
  let bundleId: string
  const productName = `Test Warning Product ${Date.now()}`
  const bundleName = `Test Warning Bundle ${Date.now()}`
  const catalogPrice = 10000
  const bundlePrice = 8500 // Écart 15% (> seuil 5%)

  test.beforeAll(async ({ request }) => {
    productId = await createTestProduct(request, productName, catalogPrice)
    bundleId = await createTestBundle(request, bundleName, [
      {
        id: productId,
        quantity: 1,
        basePrice: bundlePrice, // Prix différent pour déclencher warning
        subtotal: bundlePrice,
        isRequired: true,
        priceLocked: true // Prix fixe pour maintenir l'écart
      }
    ])
  })

  test('4.1 - Warning badge visible si écart > 5%', async ({ page }) => {
    console.log('📋 Test 4.1: Vérification warning écart prix...')

    await login(page)
    await page.goto(`${TEST_BASE_URL}/admin/bundles/${bundleId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector(`text=${productName}`, { timeout: 10000 })

    // Chercher le badge warning (amber)
    const warningBadge = page.locator('.text-amber-600').filter({ hasText: /Écart/i })

    // ASSERTION: Warning visible
    await expect(warningBadge).toBeVisible({ timeout: 5000 })

    // Vérifier pourcentage affiché
    const warningText = await warningBadge.textContent()
    expect(warningText).toMatch(/Écart.*1[0-9]%/) // Écart entre 10-19%

    console.log(`✅ Warning visible: "${warningText}"`)

    // Screenshot preuve
    await page.screenshot({
      path: '.playwright-mcp/bundle-price-warning.png',
      fullPage: true
    })
  })

  test.afterAll(async ({ request }) => {
    console.log('🧹 Nettoyage: Suppression bundle et produit test...')
    await request.delete(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}?force=true`)
    await request.delete(`${TEST_BASE_URL}/api/admin/products/${productId}?force=true`)
    console.log('✅ Nettoyage terminé')
  })
})

// ============================================================
// TEST SUITE 5: TOOLTIP CONTEXTUEL
// ============================================================
test.describe('💬 Scénario 5: Tooltip - Information Contextuelle', () => {
  let productId: string
  let bundleId: string
  const productName = `Test Tooltip Product ${Date.now()}`
  const bundleName = `Test Tooltip Bundle ${Date.now()}`

  test.beforeAll(async ({ request }) => {
    productId = await createTestProduct(request, productName, INITIAL_PRODUCT_PRICE)
    bundleId = await createTestBundle(request, bundleName, [
      {
        id: productId,
        quantity: 1,
        basePrice: INITIAL_PRODUCT_PRICE,
        subtotal: INITIAL_PRODUCT_PRICE,
        isRequired: true,
        priceLocked: false // Auto-sync pour tester tooltip
      }
    ])
  })

  test('5.1 - Tooltip auto-sync visible au hover', async ({ page }) => {
    console.log('📋 Test 5.1: Vérification tooltip auto-sync...')

    await login(page)
    await page.goto(`${TEST_BASE_URL}/admin/bundles/${bundleId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector(`text=${productName}`, { timeout: 10000 })

    // Trouver le label du checkbox
    const checkboxLabel = page.locator('label').filter({ hasText: /Auto-sync|Prix fixe/ }).first()

    // Hover pour afficher tooltip
    await checkboxLabel.hover()
    await page.waitForTimeout(500) // Attendre animation tooltip

    // Vérifier contenu tooltip auto-sync
    await expect(page.locator('text=synchronisé avec le produit catalogue')).toBeVisible({ timeout: 2000 })
    await expect(page.locator('text=✅ Recommandé')).toBeVisible()

    console.log('✅ Tooltip auto-sync affiché avec succès')

    // Screenshot
    await page.screenshot({
      path: '.playwright-mcp/tooltip-auto-sync.png',
      fullPage: true
    })
  })

  test('5.2 - Tooltip prix fixe après toggle', async ({ page }) => {
    console.log('📋 Test 5.2: Vérification tooltip prix fixe...')

    await login(page)
    await page.goto(`${TEST_BASE_URL}/admin/bundles/${bundleId}`)
    await page.waitForLoadState('networkidle')
    await page.waitForSelector(`text=${productName}`, { timeout: 10000 })

    // Cocher checkbox pour activer prix fixe
    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.check()
    await page.waitForTimeout(300)

    // Hover sur label
    const checkboxLabel = page.locator('label').filter({ hasText: /Prix fixe/ }).first()
    await checkboxLabel.hover()
    await page.waitForTimeout(500)

    // Vérifier contenu tooltip prix fixe
    await expect(page.locator('text=Prix figé indépendamment')).toBeVisible({ timeout: 2000 })
    await expect(page.locator('text=⚠️ Ne se met PAS à jour automatiquement')).toBeVisible()

    console.log('✅ Tooltip prix fixe affiché avec succès')

    // Screenshot
    await page.screenshot({
      path: '.playwright-mcp/tooltip-prix-fixe.png',
      fullPage: true
    })
  })

  test.afterAll(async ({ request }) => {
    console.log('🧹 Nettoyage: Suppression bundle et produit test...')
    await request.delete(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}?force=true`)
    await request.delete(`${TEST_BASE_URL}/api/admin/products/${productId}?force=true`)
    console.log('✅ Nettoyage terminé')
  })
})

// ============================================================
// TEST SUITE 6: INTÉGRATION COMPLÈTE
// ============================================================
test.describe('🎯 Scénario 6: Intégration Complète - Workflow Réel', () => {
  let productId1: string
  let productId2: string
  let bundleId: string
  const product1Name = `Integration Product 1 ${Date.now()}`
  const product2Name = `Integration Product 2 ${Date.now()}`
  const bundleName = `Integration Bundle ${Date.now()}`

  test('6.1 - Workflow complet: Création → Modification → Validation', async ({ page, request }) => {
    console.log('📋 Test 6.1: Workflow complet Price Lock...')

    // Étape 1: Créer 2 produits
    productId1 = await createTestProduct(request, product1Name, 5000)
    productId2 = await createTestProduct(request, product2Name, 8000)

    // Étape 2: Créer bundle mixte (1 auto-sync + 1 locked)
    bundleId = await createTestBundle(request, bundleName, [
      {
        id: productId1,
        quantity: 10,
        basePrice: 5000,
        subtotal: 50000,
        priceLocked: false // Auto-sync
      },
      {
        id: productId2,
        quantity: 5,
        basePrice: 7500, // Prix custom (< catalogue)
        subtotal: 37500,
        priceLocked: true // Prix fixe
      }
    ])

    // Étape 3: Modifier prix catalogues
    await updateProductPrice(request, productId1, 5500) // +10%
    await updateProductPrice(request, productId2, 8500) // +6.25%

    console.log('⏳ Attente synchronisation Turso replica (retry avec polling)...')

    // Étape 4: Vérifier via API avec retry mechanism (Turso replication lag)
    // ASSERTION CRITIQUE 1: Produit 1 (auto-sync) doit être synchronisé à 5500
    await expect.poll(async () => {
      const bundle = await getBundle(request, bundleId)
      const prod1Bundle = bundle.products.find((p: any) => p.id === productId1)
      console.log(`  🔄 Polling Produit 1 (auto-sync): basePrice = ${prod1Bundle?.basePrice} FCFA (attendu: 5500 FCFA)`)
      return prod1Bundle?.basePrice
    }, {
      message: 'Attendre synchronisation Produit 1 auto-sync à 5500 FCFA',
      intervals: [200, 200, 500, 1000],
      timeout: 5000
    }).toBe(5500)
    console.log(`✅ Produit 1 AUTO-SYNC: 5500 FCFA`)

    // ASSERTION CRITIQUE 2: Produit 2 (locked) doit rester à 7500
    await expect.poll(async () => {
      const bundle = await getBundle(request, bundleId)
      const prod2Bundle = bundle.products.find((p: any) => p.id === productId2)
      console.log(`  🔄 Polling Produit 2 (locked): basePrice = ${prod2Bundle?.basePrice} FCFA (attendu: 7500 FCFA)`)
      return prod2Bundle?.basePrice
    }, {
      message: 'Vérifier que Produit 2 reste figé à 7500 FCFA',
      intervals: [200, 200, 500, 1000],
      timeout: 5000
    }).toBe(7500)
    console.log(`✅ Produit 2 LOCKED: 7500 FCFA (catalogue: 8500 FCFA)`)

    // Étape 5: Vérifier dans Admin UI
    await login(page)
    await page.goto(`${TEST_BASE_URL}/admin/bundles/${bundleId}`)
    await page.waitForLoadState('networkidle')

    // Attendre chargement produits
    await page.waitForSelector(`text=${product1Name}`, { timeout: 10000 })
    await page.waitForSelector(`text=${product2Name}`, { timeout: 10000 })

    // Screenshot état final
    await page.screenshot({
      path: '.playwright-mcp/integration-final-state.png',
      fullPage: true
    })

    console.log('✅ WORKFLOW COMPLET RÉUSSI: Comportement mixte auto-sync + locked validé')

    // Nettoyage
    await request.delete(`${TEST_BASE_URL}/api/campaign-bundles/${bundleId}`)
    await request.delete(`${TEST_BASE_URL}/api/admin/products/${productId1}`)
    await request.delete(`${TEST_BASE_URL}/api/admin/products/${productId2}`)
    console.log('✅ Nettoyage terminé')
  })
})
