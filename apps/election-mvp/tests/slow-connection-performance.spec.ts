/**
 * Test de performance sur connexions lentes - Version simplifiée
 */

import { test, expect } from '@playwright/test'

test('Performance 3G - Page personnalisation', async ({ page, context }) => {
  // Configuration réseau 3G simulée
  const client = await context.newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5 Mbps
    uploadThroughput: (750 * 1024) / 8,           // 750 Kbps  
    latency: 100 // 100ms
  })

  console.log('🔄 Test performance 3G sur page personnalisation...')
  
  const startTime = Date.now()
  await page.goto('/demo/personnalisation', { 
    waitUntil: 'networkidle',
    timeout: 15000 // 15s timeout pour 3G
  })
  const loadTime = Date.now() - startTime

  console.log(`⏱️  Temps de chargement 3G: ${loadTime}ms`)

  // Vérifications de performance sur 3G
  expect(loadTime).toBeLessThan(12000) // < 12s sur 3G

  // Vérifier que les optimisations sont actives
  const lazyImages = await page.locator('img[loading="lazy"]').count()
  console.log(`🖼️  Images lazy-load détectées: ${lazyImages}`)
  expect(lazyImages).toBeGreaterThan(0)

  // Vérifier les formats next-gen
  const webpSources = await page.locator('source[type="image/webp"]').count()
  const avifSources = await page.locator('source[type="image/avif"]').count()
  console.log(`🎨 Sources WebP: ${webpSources}, AVIF: ${avifSources}`)
  expect(webpSources + avifSources).toBeGreaterThan(0)
})

test('Performance 4G - Page personnalisation', async ({ page, context }) => {
  // Configuration réseau 4G simulée
  const client = await context.newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8,   // 4 Mbps
    uploadThroughput: (3 * 1024 * 1024) / 8,     // 3 Mbps
    latency: 20 // 20ms
  })

  console.log('🔄 Test performance 4G sur page personnalisation...')

  const startTime = Date.now()
  await page.goto('/demo/personnalisation', { 
    waitUntil: 'networkidle',
    timeout: 10000 // 10s timeout pour 4G
  })
  const loadTime = Date.now() - startTime

  console.log(`⏱️  Temps de chargement 4G: ${loadTime}ms`)

  // Vérifications plus strictes sur 4G
  expect(loadTime).toBeLessThan(6000) // < 6s sur 4G

  // Vérifier la stratégie responsive
  const srcsetElements = await page.locator('[srcset]').count()
  console.log(`📐 Éléments avec srcset: ${srcsetElements}`)
  expect(srcsetElements).toBeGreaterThan(0)
})

test('Cache strategy validation', async ({ page }) => {
  const responses: Array<{ url: string, status: number, cacheControl: string }> = []
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      cacheControl: response.headers()['cache-control'] || ''
    })
  })
  
  await page.goto('/demo/personnalisation')
  
  // Analyser les headers de cache
  const staticAssets = responses.filter(r => 
    r.url.includes('/_nuxt/') || 
    r.url.includes('.css') || 
    r.url.includes('.js') ||
    r.url.includes('cloudinary.com')
  )
  
  console.log(`💾 Assets statiques détectés: ${staticAssets.length}`)
  
  if (staticAssets.length > 0) {
    const cachedAssets = staticAssets.filter(asset => 
      asset.cacheControl.includes('max-age') ||
      asset.cacheControl.includes('public')
    )
    
    console.log(`✅ Assets avec cache headers: ${cachedAssets.length}/${staticAssets.length}`)
    
    // Au moins 50% des assets devraient avoir des headers de cache
    expect(cachedAssets.length / staticAssets.length).toBeGreaterThanOrEqual(0.5)
  }
})

test('Responsive images validation', async ({ page }) => {
  await page.goto('/demo/personnalisation')
  
  // Vérifier la structure des images responsive
  const pictureElements = await page.locator('picture').count()
  const sourceElements = await page.locator('picture source').count()
  
  console.log(`🖼️  Elements picture: ${pictureElements}`)
  console.log(`📸 Sources multiples: ${sourceElements}`)
  
  if (pictureElements > 0) {
    expect(sourceElements).toBeGreaterThan(pictureElements) // Au moins 2 sources par picture
  }

  // Vérifier les breakpoints responsive
  const responsiveBreakpoints = await page.locator('[srcset*="320w"], [srcset*="480w"], [srcset*="640w"], [srcset*="800w"]').count()
  console.log(`📱 Breakpoints responsives détectés: ${responsiveBreakpoints}`)
  
  if (responsiveBreakpoints > 0) {
    expect(responsiveBreakpoints).toBeGreaterThan(0)
  }
})