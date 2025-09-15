import { test, expect } from '@playwright/test'

/**
 * Test de connectivité basique pour valider la configuration Playwright
 */
test.describe('Test de connectivité basique', () => {
  test('Vérifier que Playwright peut naviguer vers une page externe', async ({ page }) => {
    // Test basique avec une page externe rapide
    await page.goto('https://httpbin.org/status/200')
    
    // Vérifier que la page se charge
    await expect(page).toHaveURL(/httpbin\.org/)
    
    console.log('✅ Playwright fonctionne correctement')
  })

  test('Vérifier la configuration des timeouts', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('https://httpbin.org/delay/1')
    
    const loadTime = Date.now() - startTime
    console.log(`⏱️ Temps de chargement avec délai: ${loadTime}ms`)
    
    // Vérifier que le timeout est respecté (moins de 10 secondes)
    expect(loadTime).toBeLessThan(10000)
  })
})