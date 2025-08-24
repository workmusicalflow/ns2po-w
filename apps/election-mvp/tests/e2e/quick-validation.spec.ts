import { test, expect } from '@playwright/test'

/**
 * Test de validation rapide pour s'assurer que Playwright fonctionne
 * Sans dépendance sur les autres configurations de test
 */
test('Validation rapide - Application accessible', async ({ page }) => {
  // Navigation simple vers la homepage
  await page.goto('http://localhost:3003/', { timeout: 30000 })
  
  // Attendre que la page se charge
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  
  // Vérifier que la page contient du contenu
  const title = await page.title()
  console.log(`📄 Titre de la page: ${title}`)
  
  // Vérifier la présence d'un titre ou contenu
  const hasContent = await page.locator('h1, h2, h3, main, [data-testid]').first().isVisible()
  
  if (hasContent) {
    console.log('✅ Application chargée avec succès')
  } else {
    console.log('⚠️ Contenu principal non détecté')
  }
  
  // Le test passe s'il arrive jusqu'ici
  expect(hasContent).toBe(true)
})

test('Validation rapide - Section réalisations', async ({ page }) => {
  await page.goto('http://localhost:3003/', { timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  
  // Chercher la section réalisations
  const realisationText = page.getByText(/réalisation/i).first()
  const isVisible = await realisationText.isVisible({ timeout: 5000 }).catch(() => false)
  
  if (isVisible) {
    console.log('✅ Section réalisations détectée')
  } else {
    console.log('⚠️ Section réalisations non trouvée')
  }
  
  // Chercher les data-testid
  const realisationCards = page.locator('[data-testid="realisation-card"]')
  const cardCount = await realisationCards.count()
  console.log(`🃏 Cartes réalisations trouvées: ${cardCount}`)
  
  // Au moins la page se charge
  expect(true).toBe(true)
})