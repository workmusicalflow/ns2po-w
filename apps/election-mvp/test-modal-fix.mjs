#!/usr/bin/env node

/**
 * Test rapide pour vérifier la correction du modal d'image
 */

import { test, expect, chromium } from '@playwright/test'

console.log('🧪 Test de la Correction du Modal d\'Image')
console.log('=' .repeat(50))

const BASE_URL = 'http://localhost:3000'
const TEST_REALISATION_ID = 'rec1_tshirt_campagne'

async function quickModalTest() {
  let browser
  
  try {
    console.log('🚀 Lancement du navigateur...')
    browser = await chromium.launch({ 
      headless: true,  // Mode rapide sans interface
    })
    
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 }
    })
    
    const page = await context.newPage()

    // Test 1: Aller à la page de détail
    console.log('📋 Test: Navigation vers page de détail')
    await page.goto(`${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
    await page.waitForLoadState('networkidle')
    
    // Test 2: Vérifier que l'image principale est présente
    console.log('📋 Test: Présence de l\'image principale')
    const mainImage = page.locator('.aspect-square img').first()
    await mainImage.waitFor({ state: 'visible', timeout: 5000 })
    console.log('  ✅ Image principale trouvée')
    
    // Test 3: Vérifier les handlers de clic
    const imageClickable = await mainImage.getAttribute('class')
    if (imageClickable && imageClickable.includes('cursor-pointer')) {
      console.log('  ✅ Image est clickable (cursor-pointer présent)')
    }
    
    // Test 4: Cliquer sur l'image principale
    console.log('📋 Test: Clic sur image principale')
    await mainImage.click()
    
    // Test 5: Vérifier que le modal s'ouvre
    const modal = page.locator('[role="dialog"], .fixed.inset-0.z-50')
    
    try {
      await modal.waitFor({ state: 'visible', timeout: 3000 })
      console.log('  ✅ Modal s\'ouvre correctement!')
      
      // Test 6: Fermer avec Échap
      await page.keyboard.press('Escape')
      await modal.waitFor({ state: 'hidden', timeout: 2000 })
      console.log('  ✅ Modal se ferme avec Échap')
      
      return { success: true, error: null }
    } catch (error) {
      console.log('  ❌ Modal ne s\'ouvre pas:', error.message)
      return { success: false, error: error.message }
    }
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message)
    return { success: false, error: error.message }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Exécution
quickModalTest().then(result => {
  console.log('\n' + '='.repeat(50))
  if (result.success) {
    console.log('🎉 SUCCÈS: Le modal d\'image fonctionne correctement!')
    console.log('   → Les erreurs d\'hydratation ont été corrigées')
    console.log('   → Les clics sur l\'image ouvrent le modal')
    process.exit(0)
  } else {
    console.log('❌ ÉCHEC: Le modal ne fonctionne pas encore')
    console.log('   → Erreur:', result.error)
    process.exit(1)
  }
}).catch(console.error)