import { test, expect } from '@playwright/test'

test.describe('Debug Homepage', () => {
  test('Check if realisation cards are loaded', async ({ page }) => {
    // Aller à la homepage
    await page.goto('http://localhost:3003/')
    
    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle')
    
    // Prendre une capture d'écran pour debug
    await page.screenshot({ path: 'test-results/homepage-debug.png' })
    
    // Vérifier si les réalisations sont chargées en regardant le contenu de la page
    const pageContent = await page.content()
    console.log('Page content length:', pageContent.length)
    
    // Rechercher les éléments data-testid="realisation-card"
    const realisationCards = await page.locator('[data-testid="realisation-card"]').count()
    console.log('Number of realisation cards found:', realisationCards)
    
    // Vérifier le texte "Nos Réalisations Phares" 
    const heroSection = await page.locator('text=Nos Réalisations Phares').isVisible()
    console.log('Hero section visible:', heroSection)
    
    // Vérifier si le loader est visible
    const loader = await page.locator('.animate-spin').isVisible()
    console.log('Loading spinner visible:', loader)
    
    // Vérifier le contenu de la section réalisations
    const realisationsSection = await page.locator('h2:has-text("Nos Réalisations Phares")').locator('..').locator('..')
    const sectionContent = await realisationsSection.textContent()
    console.log('Realisations section content:', sectionContent)
    
    // Attendre un peu plus pour laisser le temps aux données de se charger
    await page.waitForTimeout(5000)
    
    // Vérifier à nouveau après délai
    const finalCards = await page.locator('[data-testid="realisation-card"]').count()
    console.log('Number of realisation cards after 5s delay:', finalCards)
    
    // Vérifier si il y a des erreurs de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text())
      }
    })
    
    // Au minimum, on devrait avoir la section titre visible
    expect(heroSection).toBe(true)
  })
})