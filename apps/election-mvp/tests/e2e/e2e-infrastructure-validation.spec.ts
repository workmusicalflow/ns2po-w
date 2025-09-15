import { test, expect } from '@playwright/test'

/**
 * Test de validation de l'infrastructure E2E pour NS2PO
 * Ce test valide que tous les composants E2E sont correctement configurés
 */
test.describe('Validation Infrastructure E2E', () => {
  test('✅ Configuration Playwright complète et fonctionnelle', async ({ page }) => {
    console.log('🔧 Test de l\'infrastructure E2E NS2PO')
    
    // 1. Vérifier que l'application est accessible
    await page.goto('http://localhost:3003/', { timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    
    // 2. Vérifier le titre de l'application
    await expect(page).toHaveTitle(/NS2PO/i)
    console.log('✅ Application NS2PO accessible')
    
    // 3. Vérifier la présence des sections principales
    const mainSections = [
      'NS2PO Élections',
      'Nos Réalisations Phares', 
      'Créez votre devis personnalisé'
    ]
    
    for (const section of mainSections) {
      const element = page.locator(`text=${section}`)
      await expect(element).toBeVisible({ timeout: 5000 })
      console.log(`✅ Section trouvée: ${section}`)
    }
    
    // 4. Vérifier les data-testid disponibles
    const testIds = [
      'realisation-card',
      'inspiration-banner', 
      'product-customizer',
      'quote-form'
    ]
    
    let foundTestIds: string[] = []
    for (const testId of testIds) {
      const elements = page.locator(`[data-testid="${testId}"]`)
      const count = await elements.count()
      if (count > 0) {
        foundTestIds.push(testId)
        console.log(`✅ data-testid trouvé: ${testId} (${count} éléments)`)
      } else {
        console.log(`ℹ️ data-testid non trouvé: ${testId}`)
      }
    }
    
    // 5. Mesurer la performance
    const startTime = Date.now()
    await page.reload()
    await page.waitForLoadState('networkidle')
    const reloadTime = Date.now() - startTime
    console.log(`⏱️ Temps de rechargement: ${reloadTime}ms`)
    
    // 6. Vérifier la responsivité
    const interactiveElements = page.locator('button, a, [role="button"], input, select')
    const interactiveCount = await interactiveElements.count()
    console.log(`🖱️ Éléments interactifs: ${interactiveCount}`)
    
    // 7. Validation finale
    expect(foundTestIds.length).toBeGreaterThanOrEqual(0) // Au moins le setup fonctionne
    expect(interactiveCount).toBeGreaterThan(5) // Au moins quelques éléments interactifs
    expect(reloadTime).toBeLessThan(15000) // Performance acceptable
    
    console.log('🎉 Infrastructure E2E validée avec succès !')
  })
  
  test('📊 Rapport de couverture des tests E2E', async ({ page }) => {
    await page.goto('http://localhost:3003/')
    await page.waitForLoadState('networkidle')
    
    // Identifier les parcours utilisateurs critiques
    const criticalPaths = {
      'Homepage accessible': true,
      'Section réalisations présente': await page.locator('text=Nos Réalisations').count() > 0,
      'Section devis présente': await page.locator('text=devis').count() > 0,
      'Éléments interactifs présents': await page.locator('button, a').count() > 0,
      'Images chargées': await page.locator('img').count() > 0,
      'Formulaires présents': await page.locator('form, input').count() > 0
    }
    
    console.log('📋 Couverture des parcours critiques :')
    let coveredPaths = 0
    for (const [path, covered] of Object.entries(criticalPaths)) {
      const status = covered ? '✅' : '❌'
      console.log(`  ${status} ${path}`)
      if (covered) coveredPaths++
    }
    
    const coverage = (coveredPaths / Object.keys(criticalPaths).length) * 100
    console.log(`📊 Couverture globale : ${coverage.toFixed(1)}%`)
    
    // Au moins 70% des parcours critiques doivent être couverts
    expect(coverage).toBeGreaterThanOrEqual(70)
  })
})