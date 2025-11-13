/**
 * E2E Test: Loading Spinner Visibility - Email Quote Submission
 *
 * Tests critiques pour garantir que le spinner de soumission est toujours visible
 * pendant l'envoi du devis par email. Prévention régression UX.
 *
 * @see .claude-task-master/SPINNER_REGRESSION_TEST_CHECKLIST.md
 */

import { test, expect } from '@playwright/test'

test.describe('Loading Spinner Visibility - Email Quote Submission', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers page devis
    await page.goto('/devis-new')
    await page.waitForLoadState('networkidle')
  })

  test('Spinner should be visible during email submission and button disabled', async ({ page }) => {
    // 1. Sélectionner mode Sur Mesure
    await page.click('button:has-text("Sur Mesure")')

    // 2. Ajouter un produit (T-shirt)
    const addButton = page.locator('button:has-text("T-shirt")').first()
    await addButton.click()

    // 3. Aller à l'étape validation (cliquer Suivant 2x)
    await page.click('button:has-text("Suivant")')
    await page.click('button:has-text("Suivant")')

    // 4. Remplir formulaire
    await page.fill('#name', 'Test Spinner Visibility')
    await page.fill('#phone', '0712345678')
    await page.fill('#email', 'test-spinner@ns2po.ci')

    // 5. Sélectionner canal Email (important !)
    await page.click('button:has-text("Email")')

    // 6. AVANT CLICK: Vérifier état initial
    const spinner = page.locator('svg.animate-spin')
    const submitButton = page.locator('button:has-text("Envoyer le devis")')

    await expect(spinner).toBeHidden()
    await expect(submitButton).toBeEnabled()
    await expect(page.locator('button span:has-text("Envoyer le devis")')).toBeVisible()

    // 7. Click submit (déclenchement soumission)
    await submitButton.click()

    // 8. ✅ CRITIQUE: Spinner DOIT apparaître dans les 100ms
    await expect(spinner).toBeVisible({ timeout: 100 })

    // 9. ✅ Texte bouton change
    await expect(page.locator('button span:has-text("Envoi en cours")')).toBeVisible({ timeout: 100 })

    // 10. ✅ Bouton désactivé
    const buttonDuringSubmit = page.locator('button:has-text("Envoi en cours")')
    await expect(buttonDuringSubmit).toBeDisabled()

    // 11. ✅ Spinner reste visible pendant appel API
    // Attendre 500ms et vérifier que spinner est toujours là
    await page.waitForTimeout(500)
    await expect(spinner).toBeVisible()

    // 12. Attendre fin de soumission (modal ou erreur)
    await page.waitForSelector('.modal-overlay, [role="alert"]', {
      timeout: 10000,
      state: 'visible'
    })

    // 13. ✅ Spinner disparaît après fin de soumission
    await expect(spinner).toBeHidden({ timeout: 1000 })
  })

  test('Spinner should prevent double-submit', async ({ page }) => {
    // Setup: Aller à validation
    await page.click('button:has-text("Sur Mesure")')
    await page.locator('button:has-text("T-shirt")').first().click()
    await page.click('button:has-text("Suivant")')
    await page.click('button:has-text("Suivant")')

    // Remplir formulaire
    await page.fill('#name', 'Test Double Submit')
    await page.fill('#phone', '0712345678')
    await page.fill('#email', 'test-double@ns2po.ci')
    await page.click('button:has-text("Email")')

    // Écouter les requêtes API
    let apiCallCount = 0
    page.on('request', (request) => {
      if (request.url().includes('/api/quotes/send')) {
        apiCallCount++
      }
    })

    const submitButton = page.locator('button:has-text("Envoyer le devis")')

    // Click multiple fois rapidement
    await submitButton.click()
    await submitButton.click() // 2ème click (devrait être ignoré)
    await submitButton.click() // 3ème click (devrait être ignoré)

    // Attendre fin
    await page.waitForSelector('.modal-overlay', { timeout: 10000 })

    // ✅ VALIDATION: Un seul appel API doit avoir été fait
    expect(apiCallCount).toBe(1)
  })

  test('Spinner visibility with slow 3G network', async ({ page, context }) => {
    // Simuler réseau 3G lent (throttling)
    await context.route('**/*', async (route) => {
      // Ajouter 1000ms de latence artificielle
      await page.waitForTimeout(1000)
      await route.continue()
    })

    // Setup
    await page.goto('/devis-new')
    await page.click('button:has-text("Sur Mesure")')
    await page.locator('button:has-text("T-shirt")').first().click()
    await page.click('button:has-text("Suivant")')
    await page.click('button:has-text("Suivant")')

    await page.fill('#name', 'Test 3G Network')
    await page.fill('#phone', '0712345678')
    await page.fill('#email', 'test-3g@ns2po.ci')
    await page.click('button:has-text("Email")')

    const spinner = page.locator('svg.animate-spin')
    const submitButton = page.locator('button:has-text("Envoyer le devis")')

    await submitButton.click()

    // ✅ Sur réseau lent, spinner doit rester visible plus longtemps
    await expect(spinner).toBeVisible()

    // Vérifier que spinner reste visible pendant au moins 2 secondes
    await page.waitForTimeout(2000)
    await expect(spinner).toBeVisible()

    // Attendre fin
    await page.waitForSelector('.modal-overlay', { timeout: 15000 })
    await expect(spinner).toBeHidden()
  })

  test('Spinner should reset after error', async ({ page, context }) => {
    // Forcer une erreur API (bloquer requête)
    await context.route('**/api/quotes/send', (route) => {
      route.abort('failed')
    })

    // Setup
    await page.goto('/devis-new')
    await page.click('button:has-text("Sur Mesure")')
    await page.locator('button:has-text("T-shirt")').first().click()
    await page.click('button:has-text("Suivant")')
    await page.click('button:has-text("Suivant")')

    await page.fill('#name', 'Test Error Handling')
    await page.fill('#phone', '0712345678')
    await page.fill('#email', 'test-error@ns2po.ci')
    await page.click('button:has-text("Email")')

    const spinner = page.locator('svg.animate-spin')
    const submitButton = page.locator('button:has-text("Envoyer le devis")')

    await submitButton.click()

    // Spinner visible pendant tentative
    await expect(spinner).toBeVisible({ timeout: 100 })

    // Attendre modal (fallback WhatsApp)
    await page.waitForSelector('.modal-overlay', { timeout: 10000 })

    // ✅ Spinner doit disparaître même en cas d'erreur
    await expect(spinner).toBeHidden({ timeout: 1000 })

    // ✅ Bouton re-enabled après erreur
    // (fermer modal et vérifier)
    await page.click('button:has-text("Fermer")')
    await expect(submitButton).toBeEnabled()
  })
})

test.describe('Console Logs Validation', () => {
  test('Should log correct sequence during submission', async ({ page }) => {
    const consoleMessages: string[] = []

    // Capturer logs console
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text())
      }
    })

    // Setup et submit
    await page.goto('/devis-new')
    await page.click('button:has-text("Sur Mesure")')
    await page.locator('button:has-text("T-shirt")').first().click()
    await page.click('button:has-text("Suivant")')
    await page.click('button:has-text("Suivant")')

    await page.fill('#name', 'Test Logs')
    await page.fill('#phone', '0712345678')
    await page.fill('#email', 'test-logs@ns2po.ci')
    await page.click('button:has-text("Email")')

    await page.click('button:has-text("Envoyer le devis")')

    // Attendre fin
    await page.waitForSelector('.modal-overlay', { timeout: 10000 })

    // ✅ Vérifier séquence de logs attendue
    const logsString = consoleMessages.join('\n')

    expect(logsString).toContain('📧 Traitement soumission Email')
    expect(logsString).toContain('📧 Démarrage soumission email quote')
    expect(logsString).toContain('📧 Données transformées pour email')

    // Vérifier ordre (Traitement avant Démarrage)
    const traitementIndex = logsString.indexOf('📧 Traitement soumission Email')
    const demarrageIndex = logsString.indexOf('📧 Démarrage soumission email quote')
    expect(traitementIndex).toBeLessThan(demarrageIndex)
  })
})
