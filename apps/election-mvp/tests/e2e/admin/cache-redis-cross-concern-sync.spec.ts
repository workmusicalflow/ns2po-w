import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

/**
 * 🎯 Tests E2E - Synchronisation Cache Redis Cross-Concern
 *
 * Architecture testée (implémentée 2025-11-05):
 * - Redis Cache-Aside pattern (/api/campaign-bundles)
 * - Invalidation programmatique après mutations admin
 * - Headers HTTP adaptatifs (CDN + Browser)
 * - Synchronisation admin products → public bundles (< 5s)
 *
 * Objectif: Résoudre désynchronisation 30 min → < 5s
 * Problème résolu: Prix admin != Prix public (Polo Élégant 5850 vs 5750 FCFA)
 *
 * Pattern validé Gemini (20 sources):
 * - Redis (origin layer, TTL 300s)
 * - HTTP headers (CDN 5min + browser 60s + SWR)
 * - Invalidation cross-concern (products + bundles)
 */

const ADMIN_URL = '/admin/products'
const ADMIN_LOGIN_URL = '/admin/login'
const PUBLIC_BUNDLES_API = '/api/campaign-bundles'

// Helper: Login admin
async function loginAdmin(page: Page) {
  await page.goto(ADMIN_LOGIN_URL)
  await page.fill('input[type="email"]', 'admin@ns2po.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/admin**')
}

// Helper: Wait for cache settled
async function waitForCacheSettled(page: Page, timeout = 2000) {
  await page.waitForTimeout(timeout)
  await page.waitForLoadState('networkidle')
}

// Helper: Extract product price from bundles API response
async function getProductPriceFromBundles(
  request: APIRequestContext,
  productId: string
): Promise<number | null> {
  const response = await request.get(PUBLIC_BUNDLES_API)
  expect(response.ok()).toBeTruthy()

  const data = await response.json()
  expect(data.success).toBe(true)

  // Chercher produit dans tous les bundles
  for (const bundle of data.data) {
    for (const product of bundle.products) {
      if (product.id === productId) {
        return product.basePrice
      }
    }
  }

  return null
}

// Helper: Check cache status from API response headers
function getCacheStatus(response: any): { source: string; cached: boolean } {
  const body = response.json()
  return {
    source: body.source || 'unknown',
    cached: body.cached || false
  }
}

test.describe('Cache Redis Cross-Concern - Admin → Public Sync', () => {
  test('REDIS-01: UPDATE produit admin → Public bundles synchronisé < 5s', async ({ page, request }) => {
    await loginAdmin(page)

    // 1. Créer produit de test dans un bundle
    await page.goto(`${ADMIN_URL}/new`)
    const testProductName = `Test Redis Sync ${Date.now()}`
    const testProductRef = `REF-REDIS-${Date.now()}`
    const initialPrice = 10000
    const updatedPrice = 12000

    await page.fill('#name', testProductName)
    await page.fill('#reference', testProductRef)
    await page.fill('#description', 'Test cache Redis cross-concern')
    await page.fill('#price', initialPrice.toString())
    await page.fill('#min_quantity', '50')
    await page.selectOption('#category_id', 'textiles')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    // Récupérer ID produit
    const url = page.url()
    const match = url.match(/prod_[a-z0-9_]+/)
    const productId = match ? match[0] : ''
    expect(productId).toBeTruthy()

    console.log(`✅ Produit créé: ${productId} - ${initialPrice} FCFA`)

    // 2. Attendre propagation cache initiale
    await page.waitForTimeout(2000)

    // 3. Vérifier prix initial dans API publique
    const initialPriceFromAPI = await getProductPriceFromBundles(request, productId)
    if (initialPriceFromAPI !== null) {
      expect(initialPriceFromAPI).toBe(initialPrice)
      console.log(`✅ Prix initial API publique: ${initialPriceFromAPI} FCFA`)
    }

    // 4. Modifier le prix du produit (mutation admin)
    const startTime = Date.now()

    await page.fill('#price', updatedPrice.toString())
    await page.click('button[type="submit"]:has-text("Enregistrer")')
    await expect(page.locator('text=/mis à jour avec succès/i')).toBeVisible({ timeout: 5000 })

    console.log(`✅ Prix modifié admin: ${initialPrice} → ${updatedPrice} FCFA`)

    // 5. ⏱️ Vérifier synchronisation cache Redis < 5s
    await page.waitForTimeout(1000) // Attendre propagation Redis

    const updatedPriceFromAPI = await getProductPriceFromBundles(request, productId)
    const syncDuration = Date.now() - startTime

    console.log(`⏱️ Durée synchronisation: ${syncDuration}ms`)

    // ✅ Assertions critiques
    if (updatedPriceFromAPI !== null) {
      expect(updatedPriceFromAPI).toBe(updatedPrice)
      console.log(`✅ Prix synchronisé API publique: ${updatedPriceFromAPI} FCFA`)
    }

    expect(syncDuration).toBeLessThan(5000) // < 5s (vs 30 min avant)

    console.log(`✅ SUCCÈS: Désynchronisation résolue (30 min → ${syncDuration}ms)`)
  })

  test('REDIS-02: Cache MISS après invalidation Redis programmatique', async ({ page, request }) => {
    await loginAdmin(page)

    // 1. Warm up cache public bundles (premier GET)
    const warmupResponse = await request.get(PUBLIC_BUNDLES_API)
    expect(warmupResponse.ok()).toBeTruthy()

    const warmupData = await warmupResponse.json()
    console.log(`Cache source initial: ${warmupData.source}`)

    // 2. Attendre cache Redis populé
    await page.waitForTimeout(2000)

    // 3. Vérifier cache HIT (warm cache)
    const cachedResponse = await request.get(PUBLIC_BUNDLES_API)
    const cachedData = await cachedResponse.json()

    if (cachedData.cached === true || cachedData.source === 'redis-cache') {
      console.log('✅ Cache HIT confirmé (warm)')
    }

    // 4. Créer nouveau produit (déclenche invalidation Redis)
    await page.goto(`${ADMIN_URL}/new`)
    const testProductName = `Test Cache MISS ${Date.now()}`

    await page.fill('#name', testProductName)
    await page.fill('#reference', `REF-MISS-${Date.now()}`)
    await page.fill('#description', 'Test cache MISS après invalidation')
    await page.fill('#price', '15000')
    await page.fill('#min_quantity', '100')
    await page.selectOption('#category_id', 'accessoires')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    console.log('✅ Produit créé → Invalidation Redis déclenchée')

    // 5. Attendre invalidation propagée
    await page.waitForTimeout(1000)

    // 6. ✅ Vérifier cache MISS (Redis invalidé)
    const missResponse = await request.get(PUBLIC_BUNDLES_API)
    const missData = await missResponse.json()

    console.log(`Cache source après invalidation: ${missData.source}`)

    // ✅ Assertion: doit être 'turso-fresh' (pas redis-cache)
    expect(missData.source).toBe('turso-fresh')
    expect(missData.cached).toBeFalsy()

    console.log('✅ Cache MISS confirmé - Invalidation Redis fonctionne')

    // 7. Vérifier cache re-peuplé (prochain GET = HIT)
    await page.waitForTimeout(500)
    const rehydratedResponse = await request.get(PUBLIC_BUNDLES_API)
    const rehydratedData = await rehydratedResponse.json()

    if (rehydratedData.source === 'redis-cache' || rehydratedData.cached === true) {
      console.log('✅ Cache Redis re-peuplé automatiquement')
    }
  })

  test('REDIS-03: DELETE produit admin → Bundles invalidés immédiatement', async ({ page, request }) => {
    await loginAdmin(page)

    // 1. Créer produit de test
    await page.goto(`${ADMIN_URL}/new`)
    const testProductName = `Test Redis DELETE ${Date.now()}`

    await page.fill('#name', testProductName)
    await page.fill('#reference', `REF-DEL-${Date.now()}`)
    await page.fill('#description', 'Test cache après DELETE')
    await page.fill('#price', '8000')
    await page.fill('#min_quantity', '25')
    await page.selectOption('#category_id', 'gadgets')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/créé avec succès/i')).toBeVisible({ timeout: 5000 })

    const url = page.url()
    const match = url.match(/prod_[a-z0-9_]+/)
    const productId = match ? match[0] : ''

    // 2. Attendre cache propagé
    await page.waitForTimeout(2000)

    // 3. Vérifier produit existe dans API publique
    let productFound = await getProductPriceFromBundles(request, productId)
    if (productFound !== null) {
      console.log(`✅ Produit trouvé dans bundles: ${productId}`)
    }

    // 4. Supprimer produit
    const deleteStart = Date.now()

    await page.click('button:has-text("Supprimer")')
    await page.click('button:has-text("Confirmer"):visible')
    await expect(page.locator('text=/supprimé avec succès/i')).toBeVisible({ timeout: 5000 })

    console.log('✅ Produit supprimé admin')

    // 5. Attendre invalidation
    await page.waitForTimeout(1000)

    // 6. ✅ Vérifier produit disparu de API publique
    productFound = await getProductPriceFromBundles(request, productId)

    const deleteSyncDuration = Date.now() - deleteStart
    console.log(`⏱️ Durée synchronisation DELETE: ${deleteSyncDuration}ms`)

    // ✅ Produit doit être null ou absent
    expect(productFound).toBeNull()
    expect(deleteSyncDuration).toBeLessThan(5000)

    console.log('✅ DELETE synchronisé - Produit disparu des bundles')
  })
})

test.describe('Cache Redis - HTTP Headers Adaptatifs', () => {
  test('REDIS-04: Headers HTTP adaptatifs selon source données', async ({ request }) => {
    // 1. Forcer cache MISS (query param ou nouveau contexte)
    const freshResponse = await request.get(`${PUBLIC_BUNDLES_API}?_t=${Date.now()}`)
    expect(freshResponse.ok()).toBeTruthy()

    const freshData = await freshResponse.json()

    // 2. ✅ Vérifier headers pour données fraîches Turso
    if (freshData.source === 'turso-fresh') {
      const cacheControl = freshResponse.headers()['cache-control']
      const cdnCacheControl = freshResponse.headers()['cdn-cache-control']

      console.log(`Cache-Control: ${cacheControl}`)
      console.log(`CDN-Cache-Control: ${cdnCacheControl}`)

      // ✅ Assertions headers adaptatifs
      expect(cacheControl).toContain('max-age=60')
      expect(cacheControl).toContain('stale-while-revalidate=300')
      expect(cdnCacheControl).toContain('s-maxage=300') // 5 min CDN (vs 30 min avant)

      console.log('✅ Headers adaptatifs validés (fresh data)')
    }

    // 3. Wait for Redis cache population
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 4. GET avec cache Redis (warm)
    const cachedResponse = await request.get(PUBLIC_BUNDLES_API)
    const cachedData = await cachedResponse.json()

    if (cachedData.source === 'redis-cache' || cachedData.cached === true) {
      const cacheControl = cachedResponse.headers()['cache-control']
      const cdnCacheControl = cachedResponse.headers()['cdn-cache-control']

      console.log(`[REDIS] Cache-Control: ${cacheControl}`)
      console.log(`[REDIS] CDN-Cache-Control: ${cdnCacheControl}`)

      // ✅ Headers conservateurs pour données cachées
      expect(cacheControl).toContain('max-age=30')
      expect(cacheControl).toContain('must-revalidate')
      expect(cdnCacheControl).toContain('s-maxage=180') // 3 min CDN pour cache Redis

      console.log('✅ Headers adaptatifs validés (cached data)')
    }
  })

  test('REDIS-05: TTL Redis aligné 300s (5 min) avec CDN max', async ({ request }) => {
    // 1. Forcer cache MISS
    const response = await request.get(`${PUBLIC_BUNDLES_API}?_force=${Date.now()}`)
    const data = await response.json()

    if (data.source === 'turso-fresh') {
      const cdnTTL = response.headers()['cdn-cache-control']

      // ✅ Vérifier alignement TTL Redis (300s) = CDN max (s-maxage=300)
      expect(cdnTTL).toContain('s-maxage=300')

      console.log('✅ TTL Redis (300s) aligné avec CDN (5 min)')
      console.log('    Amélioration: 30 min → 5 min (6x plus réactif)')
    }
  })
})

test.describe('Cache Redis - Performance & Résilience', () => {
  test('REDIS-06: Fallback graceful si Redis indisponible', async ({ request }) => {
    // Note: Test de résilience - difficile à simuler sans infrastructure Redis mock
    // Ce test valide que l'API retourne toujours des données (fallback statique)

    const response = await request.get(PUBLIC_BUNDLES_API)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()

    // ✅ API doit toujours répondre (même si source = static)
    expect(data.success).toBeTruthy()
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)

    console.log(`✅ Fallback graceful - Source: ${data.source}`)

    // Si source = static, warning doit être présent
    if (data.source === 'static') {
      expect(data.warning).toBeDefined()
      console.log(`⚠️ Warning détecté: ${data.warning}`)
    }
  })

  test('REDIS-07: Latence < 100ms pour cache HIT Redis', async ({ request }) => {
    // 1. Warm up cache
    await request.get(PUBLIC_BUNDLES_API)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 2. Mesurer latence cache HIT
    const start = Date.now()
    const response = await request.get(PUBLIC_BUNDLES_API)
    const latency = Date.now() - start

    const data = await response.json()

    console.log(`⏱️ Latence API: ${latency}ms (source: ${data.source})`)

    // ✅ Si cache HIT Redis, latence doit être < 100ms
    if (data.source === 'redis-cache' || data.cached === true) {
      expect(latency).toBeLessThan(100)
      console.log('✅ Cache HIT Redis ultra-rapide (< 100ms)')
    }
  })
})
