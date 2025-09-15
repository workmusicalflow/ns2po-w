#!/usr/bin/env node

/**
 * Test rapide pour vérifier que le modal d'image fonctionne après la correction
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:3003'
const TEST_REALISATION_ID = 'rec7aGJHxgzzw1WYk'

console.log('🔧 Test de vérification du modal d\'image après correction')
console.log('=' .repeat(60))

async function testModalFunctionality() {
  let browser
  
  try {
    console.log('🚀 Lancement du navigateur...')
    browser = await chromium.launch({ 
      headless: false,  // Mode visible pour observer
    })
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    })
    
    const page = await context.newPage()

    // Écouter les erreurs console
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(`ERROR: ${msg.text()}`)
      } else if (msg.type() === 'warning' && msg.text().includes('hydration')) {
        consoleErrors.push(`HYDRATION: ${msg.text()}`)
      }
    })

    // Test 1: Navigation vers la page
    console.log('📋 Test: Navigation vers page de détail')
    await page.goto(`${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    const pageTitle = await page.title()
    console.log(`  → Titre: ${pageTitle}`)
    
    if (pageTitle.includes('404')) {
      throw new Error('Page non trouvée - vérifier l\'ID de réalisation')
    }
    
    // Test 2: Vérifier la présence d'images
    console.log('📋 Test: Recherche des images')
    
    // Attendre que les images se chargent
    await page.waitForTimeout(2000)
    
    const imageSelectors = [
      '.aspect-square img',
      'img[alt*="Ensemble"]',
      'img',
      'nuxt-img img'
    ]
    
    let foundImages = false
    let mainImageSelector = null
    
    for (const selector of imageSelectors) {
      const imageCount = await page.locator(selector).count()
      console.log(`  → "${selector}": ${imageCount} image(s)`)
      
      if (imageCount > 0 && !foundImages) {
        foundImages = true
        mainImageSelector = selector
        
        // Vérifier les attributs de la première image
        const firstImage = page.locator(selector).first()
        const src = await firstImage.getAttribute('src')
        const alt = await firstImage.getAttribute('alt')
        console.log(`    → Première image src: ${src}`)
        console.log(`    → Première image alt: ${alt}`)
      }
    }
    
    if (!foundImages) {
      throw new Error('Aucune image trouvée sur la page')
    }
    
    // Test 3: Tester le clic sur l'image principale
    console.log('📋 Test: Clic sur image principale')
    const mainImage = page.locator(mainImageSelector).first()
    
    // Vérifier que l'image est visible et clickable
    await mainImage.waitFor({ state: 'visible' })
    console.log('  ✅ Image principale visible')
    
    // Cliquer sur l'image
    await mainImage.click()
    console.log('  ✅ Clic effectué sur l\'image')
    
    // Test 4: Vérifier l'ouverture du modal
    console.log('📋 Test: Ouverture du modal')
    
    // Chercher le modal avec différents sélecteurs
    const modalSelectors = [
      '[role="dialog"]',
      '.fixed.inset-0.z-50',
      '[data-modal="image"]',
      '.modal-overlay'
    ]
    
    let modalFound = false
    for (const selector of modalSelectors) {
      try {
        const modal = page.locator(selector)
        await modal.waitFor({ state: 'visible', timeout: 3000 })
        modalFound = true
        console.log(`  ✅ Modal trouvé avec sélecteur: ${selector}`)
        
        // Test fermeture avec Échap
        await page.keyboard.press('Escape')
        await modal.waitFor({ state: 'hidden', timeout: 2000 })
        console.log('  ✅ Modal se ferme avec Échap')
        break
      } catch (e) {
        // Continuer avec le prochain sélecteur
      }
    }
    
    if (!modalFound) {
      console.log('  ❌ Modal non trouvé - vérifier l\'implémentation')
    }
    
    // Test 5: Vérifier les erreurs console
    console.log('📋 Test: Vérification des erreurs console')
    
    await page.waitForTimeout(1000)
    
    if (consoleErrors.length > 0) {
      console.log('  ⚠️ Erreurs détectées:')
      consoleErrors.forEach(error => console.log(`    → ${error}`))
    } else {
      console.log('  ✅ Aucune erreur d\'hydratation ou console détectée')
    }
    
    // Garder le navigateur ouvert pour inspection manuelle
    console.log('\n🎯 Navigateur ouvert pour inspection manuelle')
    console.log('   → Testez manuellement les clics sur les images')
    console.log('   → Vérifiez que le modal s\'ouvre correctement')
    console.log('   → Appuyez sur Entrée ici pour fermer...')
    
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve())
    })
    
    return {
      success: modalFound && consoleErrors.length === 0,
      foundImages,
      modalFound,
      consoleErrors: consoleErrors.length,
      pageTitle
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message)
    return {
      success: false,
      error: error.message
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Exécution
testModalFunctionality().then(result => {
  console.log('\n' + '='.repeat(60))
  if (result.success) {
    console.log('🎉 SUCCÈS: Le modal d\'image fonctionne correctement!')
    console.log('   → Les erreurs d\'hydratation ont été corrigées')
    console.log('   → Les clics sur les images ouvrent le modal')
    console.log('   → Aucune erreur console détectée')
  } else {
    console.log('❌ PROBLÈME DÉTECTÉ:')
    if (result.error) {
      console.log('   → Erreur:', result.error)
    }
    if (result.consoleErrors > 0) {
      console.log('   → Erreurs console:', result.consoleErrors)
    }
    if (!result.modalFound) {
      console.log('   → Modal ne s\'ouvre pas correctement')
    }
  }
  
  console.log('\n📊 Résultats détaillés:', {
    foundImages: result.foundImages,
    modalFound: result.modalFound,
    consoleErrors: result.consoleErrors,
    pageTitle: result.pageTitle
  })
}).catch(console.error)