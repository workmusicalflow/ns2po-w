/**
 * Script de test standalone pour la génération PDF
 * Usage: tsx scripts/test-pdf-generation.ts
 */

import { generateQuotePDF, closeBrowser } from '../server/services/pdf-generator'
import type { QuoteData } from '../server/services/pdf-generator'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Données mock réalistes pour devis NS2PO
const mockQuoteData: QuoteData = {
  reference: 'DEV-2025-001-TEST',
  date: new Date().toLocaleDateString('fr-FR'),
  clientName: 'Jean Kouassi',
  clientEmail: 'j.kouassi@example.ci',
  clientPhone: '+225 07 12 34 56 78',
  items: [
    {
      name: 'T-Shirts personnalisés - Coton Premium',
      customization: 'Impression logo recto-verso, tailles variées (S-XXL)',
      quantity: 500,
      unitPrice: 3500,
      totalPrice: 1750000,
      imageUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/tshirt-001.jpg'
    },
    {
      name: 'Casquettes brodées - Qualité Premium',
      customization: 'Logo brodé 3D sur visière, réglable',
      quantity: 300,
      unitPrice: 2500,
      totalPrice: 750000,
      imageUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/casquette-001.jpg'
    },
    {
      name: 'Stylos publicitaires - Métal Premium',
      customization: 'Gravure laser nom candidat + slogan',
      quantity: 1000,
      unitPrice: 850,
      totalPrice: 850000,
      imageUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/v1735994796/ns2po/gallery/creative/stylo-001.jpg'
    }
  ],
  subtotal: 3350000,
  discount: 167500,
  discountPercent: 5,
  tax: 572850, // TVA 18% sur (subtotal - discount)
  total: 3755350,
  logoUrl: 'https://res.cloudinary.com/dsrvzogof/image/upload/w_200,c_fit,q_auto,f_auto/v1759082596/logo-ns2po-mailing_vzelsq.png'
}

async function runPdfTest() {
  console.log('🧪 Démarrage test génération PDF standalone\n')
  console.log('📋 Configuration:')
  console.log(`  - Référence: ${mockQuoteData.reference}`)
  console.log(`  - Client: ${mockQuoteData.clientName}`)
  console.log(`  - Nombre de produits: ${mockQuoteData.items.length}`)
  console.log(`  - Montant total: ${(mockQuoteData.total / 1000).toFixed(0)} k FCFA\n`)

  const startTime = Date.now()

  try {
    // 1️⃣ Génération PDF
    console.log('⏱️  Génération PDF en cours...')
    const result = await generateQuotePDF(mockQuoteData, {
      timeout: 10000,
      format: 'A4'
    })

    const generationTime = Date.now() - startTime

    // 2️⃣ Validation résultats
    if (!result || !result.buffer) {
      throw new Error('PDF génération a échoué - buffer vide')
    }

    console.log('\n✅ Génération réussie!')
    console.log(`\n📊 Métriques:`)
    console.log(`  - Temps génération: ${generationTime}ms (vs ${result.generationTime}ms interne)`)
    console.log(`  - Taille PDF: ${(result.size / 1024).toFixed(2)} KB (${(result.size / 1024 / 1024).toFixed(2)} MB)`)
    console.log(`  - Success: ${result.success}`)
    console.log(`  - Timestamp: ${new Date().toLocaleString('fr-FR')}`)

    // 3️⃣ Validation des seuils de performance
    console.log(`\n🎯 Validation des objectifs:`)

    const timingOk = generationTime < 400
    console.log(`  - ⏱️  Timing < 400ms: ${timingOk ? '✅' : '❌'} (${generationTime}ms)`)

    const sizeOk = result.size < 2 * 1024 * 1024 // 2MB
    console.log(`  - 📦 Taille < 2MB: ${sizeOk ? '✅' : '❌'} (${(result.size / 1024 / 1024).toFixed(2)} MB)`)

    const hasContent = result.buffer.length > 1000
    console.log(`  - 📄 Contenu valide: ${hasContent ? '✅' : '❌'}`)

    // 4️⃣ Sauvegarde PDF pour inspection visuelle
    const outputPath = join(__dirname, '../test-results', `devis-test-${Date.now()}.pdf`)
    writeFileSync(outputPath, result.buffer)
    console.log(`\n💾 PDF sauvegardé: ${outputPath}`)

    // 5️⃣ Résumé final
    console.log(`\n${'='.repeat(60)}`)
    if (timingOk && sizeOk && hasContent) {
      console.log('🎉 TEST RÉUSSI - Tous les critères sont validés!')
    } else {
      console.log('⚠️  TEST PARTIEL - Certains critères ne sont pas satisfaits')
    }
    console.log('='.repeat(60))

    return { success: true, generationTime, size: result.size }

  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`\n❌ ERREUR après ${errorTime}ms:`)
    console.error(error)
    return { success: false, error }

  } finally {
    // 6️⃣ Nettoyage browser instance
    console.log('\n🧹 Fermeture browser...')
    await closeBrowser()
    console.log('✅ Nettoyage terminé\n')
  }
}

// Exécution
runPdfTest()
  .then((result) => {
    if (!result.success) {
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error('💥 Erreur fatale:', err)
    process.exit(1)
  })
