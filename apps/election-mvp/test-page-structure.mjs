#!/usr/bin/env node

/**
 * Test pour inspecter la structure de la page de réalisation
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'
const TEST_REALISATION_ID = 'rec1_tshirt_campagne'

async function inspectPageStructure() {
  let browser
  
  try {
    browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({ viewport: { width: 1200, height: 800 } })
    const page = await context.newPage()

    console.log('🔍 Navigation vers:', `${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
    await page.goto(`${BASE_URL}/realisations/${TEST_REALISATION_ID}`)
    await page.waitForLoadState('networkidle')
    
    // Attendre 2 secondes pour laisser la page se charger complètement
    await page.waitForTimeout(2000)
    
    console.log('📄 Titre de la page:', await page.title())
    
    // Chercher différents sélecteurs possibles pour les images
    const selectors = [
      '.aspect-square img',
      'img[alt*="tshirt"]',
      'img[alt*="Ensemble"]',
      'nuxt-img img',
      '[class*="aspect-square"] img',
      'img'
    ]
    
    for (const selector of selectors) {
      const elements = await page.locator(selector).count()
      console.log(`📸 Sélecteur "${selector}": ${elements} élément(s) trouvé(s)`)
      
      if (elements > 0) {
        const first = page.locator(selector).first()
        try {
          const src = await first.getAttribute('src')
          const alt = await first.getAttribute('alt')
          const classes = await first.getAttribute('class')
          console.log(`   → src: ${src}`)
          console.log(`   → alt: ${alt}`)  
          console.log(`   → classes: ${classes}`)
          console.log('')
        } catch (e) {
          console.log(`   → Erreur lors de l'inspection: ${e.message}`)
        }
      }
    }
    
    // Vérifier la présence d'erreurs dans la console
    const logs = []
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        logs.push(`${msg.type().toUpperCase()}: ${msg.text()}`)
      }
    })
    
    await page.waitForTimeout(1000)
    
    if (logs.length > 0) {
      console.log('⚠️ Logs de la console:')
      logs.forEach(log => console.log('   ' + log))
    } else {
      console.log('✅ Aucune erreur dans la console')
    }
    
    console.log('\n🎯 Appuyez sur Entrée pour fermer le navigateur...')
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve())
    })
    
  } catch (error) {
    console.log('❌ Erreur:', error.message)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

inspectPageStructure().catch(console.error)