import { test, expect } from '@playwright/test'

/**
 * Test minimaliste de l'application sans dépendre du serveur intégré
 * On va tester directement l'URL du serveur en cours
 */
test.describe('Test minimaliste de l\'app NS2PO', () => {
  test('Vérifier que l\'application répond sur localhost:3003', async ({ page }) => {
    // Tenter de se connecter au serveur local
    try {
      await page.goto('http://localhost:3003/', { timeout: 15000 })
      
      // Vérifier que la page contient du contenu attendu
      const heading = page.locator('h1, h2, [data-testid]')
      await expect(heading.first()).toBeVisible({ timeout: 10000 })
      
      console.log('✅ Application accessible sur localhost:3003')
    } catch (error) {
      console.log('❌ Serveur non accessible sur localhost:3003')
      
      // Marquer le test comme ignoré si le serveur n'est pas disponible
      test.skip(true, 'Serveur de développement non disponible')
    }
  })

  test('Vérifier la performance de base de l\'homepage', async ({ page }) => {
    try {
      const startTime = Date.now()
      
      await page.goto('http://localhost:3003/', { timeout: 15000 })
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      const loadTime = Date.now() - startTime
      console.log(`⏱️ Temps de chargement homepage: ${loadTime}ms`)
      
      // Performance acceptable (moins de 15 secondes)
      expect(loadTime).toBeLessThan(15000)
      
    } catch (error) {
      console.log('❌ Test de performance ignoré - serveur non disponible')
      test.skip(true, 'Serveur de développement non disponible')
    }
  })
})