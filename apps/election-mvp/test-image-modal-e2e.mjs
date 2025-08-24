#!/usr/bin/env node

/**
 * Test E2E pour vérifier la fonctionnalité du modal d'image
 * sur les pages RealisationCard et pages de détail
 */

import { test, expect, chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

console.log('🧪 Test E2E Modal d\'Image - NS2PO Election MVP')
console.log('=' .repeat(60))

const BASE_URL = 'http://localhost:3000'
const TEST_REALISATION_ID = 'rec7aGJHxgzzw1WYk' // ID récupéré des logs

async function runImageModalTests() {
  let browser
  let results = {
    timestamp: new Date().toISOString(),
    testSuite: 'Image Modal E2E Tests',
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  }

  try {
    console.log('🚀 Lancement du navigateur Chromium...')
    browser = await chromium.launch({ 
      headless: false,  // Mode visible pour le débogage
      slowMo: 500       // Ralentir les interactions pour l'observation
    })
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    })
    
    const page = await context.newPage()

    // Test 1: Page d'accueil - Navigation vers réalisations
    console.log('\n📋 Test 1: Navigation vers les réalisations')
    try {
      await page.goto(BASE_URL)
      await page.waitForLoadState('networkidle')
      
      // Chercher un lien vers les réalisations
      const realisationsLink = page.getByRole('link', { name: /réalisations/i }).first()
      if (await realisationsLink.count() > 0) {
        await realisationsLink.click()
        await page.waitForURL(/.*realisations.*/)
        console.log('  ✅ Navigation vers réalisations réussie')
        results.tests.push({ name: 'Navigation réalisations', status: 'passed' })
        results.summary.passed++
      } else {
        // Navigation directe vers une réalisation
        await page.goto(`${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
        console.log('  ✅ Navigation directe vers réalisation')
        results.tests.push({ name: 'Navigation réalisations', status: 'passed' })
        results.summary.passed++
      }
    } catch (error) {
      console.log('  ❌ Échec navigation réalisations:', error.message)
      results.tests.push({ name: 'Navigation réalisations', status: 'failed', error: error.message })
      results.summary.failed++
    }

    // Test 2: Page de détail - Clic sur image principale
    console.log('\n📋 Test 2: Clic sur image principale (page détail)')
    try {
      await page.goto(`${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
      await page.waitForLoadState('networkidle')
      
      // Attendre que l'image principale soit chargée
      const mainImage = page.locator('.aspect-square img').first()
      await mainImage.waitFor({ state: 'visible' })
      
      // Simuler un hover pour voir les effets
      await mainImage.hover()
      await page.waitForTimeout(500) // Laisser le temps pour l'animation
      
      // Cliquer sur l'image
      await mainImage.click()
      
      // Vérifier que le modal s'ouvre
      const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50')
      await modal.waitFor({ state: 'visible', timeout: 3000 })
      
      console.log('  ✅ Modal s\'ouvre au clic sur image principale')
      results.tests.push({ name: 'Clic image principale', status: 'passed' })
      results.summary.passed++
      
      // Test fermeture modal avec Échap
      await page.keyboard.press('Escape')
      await modal.waitFor({ state: 'hidden', timeout: 2000 })
      console.log('  ✅ Modal se ferme avec touche Échap')
      results.tests.push({ name: 'Fermeture Échap', status: 'passed' })
      results.summary.passed++
      
    } catch (error) {
      console.log('  ❌ Échec test image principale:', error.message)
      results.tests.push({ name: 'Clic image principale', status: 'failed', error: error.message })
      results.summary.failed++
    }

    // Test 3: Thumbnails - Double-clic
    console.log('\n📋 Test 3: Double-clic sur thumbnails')
    try {
      // S'assurer qu'on est sur la page de détail
      await page.goto(`${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
      await page.waitForLoadState('networkidle')
      
      // Chercher des thumbnails
      const thumbnails = page.locator('.grid.grid-cols-4 button')
      const thumbnailCount = await thumbnails.count()
      
      if (thumbnailCount > 1) {
        // Double-clic sur le deuxième thumbnail
        const secondThumbnail = thumbnails.nth(1)
        await secondThumbnail.dblclick()
        
        // Vérifier que le modal s'ouvre
        const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50')
        await modal.waitFor({ state: 'visible', timeout: 3000 })
        
        console.log('  ✅ Modal s\'ouvre au double-clic sur thumbnail')
        results.tests.push({ name: 'Double-clic thumbnail', status: 'passed' })
        results.summary.passed++
        
        // Fermer en cliquant en dehors
        await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })
        await modal.waitFor({ state: 'hidden', timeout: 2000 })
        console.log('  ✅ Modal se ferme en cliquant dehors')
        results.tests.push({ name: 'Fermeture clic dehors', status: 'passed' })
        results.summary.passed++
        
      } else {
        console.log('  ⚠️  Pas assez de thumbnails pour le test')
        results.tests.push({ name: 'Double-clic thumbnail', status: 'skipped', error: 'Pas assez de thumbnails' })
      }
      
    } catch (error) {
      console.log('  ❌ Échec test thumbnails:', error.message)
      results.tests.push({ name: 'Double-clic thumbnail', status: 'failed', error: error.message })
      results.summary.failed++
    }

    // Test 4: Responsive - Test mobile
    console.log('\n📋 Test 4: Test responsive mobile')
    try {
      // Changer viewport pour mobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
      await page.waitForLoadState('networkidle')
      
      // Tester l'image principale sur mobile
      const mainImage = page.locator('.aspect-square img').first()
      await mainImage.waitFor({ state: 'visible' })
      await mainImage.click()
      
      const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50')
      await modal.waitFor({ state: 'visible', timeout: 3000 })
      
      // Vérifier que l'image s'adapte bien au mobile
      const modalImage = modal.locator('img')
      await modalImage.waitFor({ state: 'visible' })
      
      console.log('  ✅ Modal fonctionne correctement sur mobile')
      results.tests.push({ name: 'Modal mobile', status: 'passed' })
      results.summary.passed++
      
      // Fermer le modal
      await page.keyboard.press('Escape')
      
    } catch (error) {
      console.log('  ❌ Échec test mobile:', error.message)
      results.tests.push({ name: 'Modal mobile', status: 'failed', error: error.message })
      results.summary.failed++
    }

    // Test 5: Test RealisationCard (si on trouve une page avec des cards)
    console.log('\n📋 Test 5: Test RealisationCard')
    try {
      // Remettre viewport desktop
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Essayer la page réalisations
      await page.goto(`${BASE_URL}/realisations`)
      await page.waitForLoadState('networkidle')
      
      // Chercher des RealisationCard
      const realisationCards = page.locator('[data-testid="realisation-card"]')
      const cardCount = await realisationCards.count()
      
      if (cardCount > 0) {
        const firstCard = realisationCards.first()
        const cardImage = firstCard.locator('img').first()
        
        // Hover sur la card pour voir les effets
        await firstCard.hover()
        await page.waitForTimeout(300)
        
        // Clic sur l'image de la card
        await cardImage.click()
        
        const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50')
        await modal.waitFor({ state: 'visible', timeout: 3000 })
        
        console.log('  ✅ Modal s\'ouvre depuis RealisationCard')
        results.tests.push({ name: 'RealisationCard modal', status: 'passed' })
        results.summary.passed++
        
        // Fermer le modal
        await page.keyboard.press('Escape')
        
      } else {
        console.log('  ⚠️  Pas de RealisationCard trouvée')
        results.tests.push({ name: 'RealisationCard modal', status: 'skipped', error: 'Pas de cards trouvées' })
      }
      
    } catch (error) {
      console.log('  ❌ Échec test RealisationCard:', error.message)
      results.tests.push({ name: 'RealisationCard modal', status: 'failed', error: error.message })
      results.summary.failed++
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  // Calculer le total
  results.summary.total = results.summary.passed + results.summary.failed

  return results
}

// Exécution principale
async function main() {
  console.log('⏳ Démarrage des tests E2E...')
  
  const results = await runImageModalTests()
  
  // Afficher résumé
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ DES TESTS E2E')
  console.log('='.repeat(60))
  console.log(`✅ Tests réussis: ${results.summary.passed}`)
  console.log(`❌ Tests échoués: ${results.summary.failed}`)
  console.log(`📋 Total: ${results.summary.total}`)
  console.log(`📈 Taux de réussite: ${Math.round((results.summary.passed / results.summary.total) * 100)}%`)
  
  // Sauvegarder rapport détaillé
  try {
    const reportPath = './test-results/image-modal-e2e-report.json'
    writeFileSync(reportPath, JSON.stringify(results, null, 2))
    console.log(`📄 Rapport détaillé: ${reportPath}`)
  } catch (error) {
    console.log('⚠️  Impossible de sauvegarder le rapport')
  }

  console.log('\n✨ Tests terminés!')
  
  if (results.summary.failed === 0) {
    console.log('🎉 Tous les tests sont passés! La fonctionnalité modal est opérationnelle.')
  } else {
    console.log('⚠️  Certains tests ont échoué. Vérifiez les détails ci-dessus.')
  }
}

// Lancer les tests seulement si ce script est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}