#!/usr/bin/env node

/**
 * Script de test pour déclencher la synchronisation des assets Cloudinary
 * Lance avec: node scripts/sync-cloudinary-assets.js
 */

import fetch from 'node-fetch'
import 'dotenv/config'

const NUXT_BASE_URL = process.env.NUXT_BASE_URL || 'http://localhost:3001'
const SYNC_ENDPOINT = `${NUXT_BASE_URL}/api/admin/sync-assets`

async function runSyncTest() {
  console.log('🚀 Test de synchronisation Cloudinary vers Turso')
  console.log(`📡 Endpoint: ${SYNC_ENDPOINT}`)
  console.log()

  const startTime = Date.now()

  try {
    console.log('⏳ Envoi de la requête de synchronisation...')

    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })

    const duration = Date.now() - startTime
    console.log(`⏱️  Réponse reçue en ${duration}ms`)

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`❌ Erreur HTTP ${response.status}: ${response.statusText}`)
      console.error('📄 Détails:', errorData)
      process.exit(1)
    }

    const result = await response.json()
    console.log()
    console.log('✅ Synchronisation terminée avec succès!')
    console.log()

    if (result.success) {
      console.log('📊 Résultats:')
      console.log(`   • Total traité: ${result.data.totalProcessed} assets`)
      console.log(`   • Nouveaux: ${result.data.totalSynced} assets`)
      console.log(`   • Mis à jour: ${result.data.totalUpdated} assets`)
      console.log(`   • Erreurs: ${result.data.totalErrors}`)
      console.log(`   • Durée: ${Math.round(result.data.duration / 1000)}s`)
      console.log()
      console.log(`💬 Message: ${result.message}`)
    } else {
      console.log('⚠️  Synchronisation terminée avec des problèmes')
      console.log('📄 Réponse:', JSON.stringify(result, null, 2))
    }

  } catch (error) {
    const duration = Date.now() - startTime
    console.error()
    console.error(`❌ Erreur après ${duration}ms:`, error.message)
    console.error('🔍 Détails:', error)

    if (error.code === 'ECONNREFUSED') {
      console.error()
      console.error('💡 Conseil: Vérifiez que le serveur Nuxt est démarré sur le port 3001')
      console.error('   Commande: pnpm dev')
    }

    process.exit(1)
  }
}

// Vérifications préalables
if (!process.env.TURSO_DATABASE_URL || !process.env.CLOUDINARY_CLOUD_NAME) {
  console.error('❌ Variables d\'environnement manquantes:')
  if (!process.env.TURSO_DATABASE_URL) console.error('   • TURSO_DATABASE_URL')
  if (!process.env.CLOUDINARY_CLOUD_NAME) console.error('   • CLOUDINARY_CLOUD_NAME')
  console.error()
  console.error('💡 Vérifiez votre fichier .env')
  process.exit(1)
}

console.log('🔧 Configuration:')
console.log(`   • Turso: ${process.env.TURSO_DATABASE_URL.split('@')[1] || 'Configuré'}`)
console.log(`   • Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME}`)
console.log()

// Lancer le test
runSyncTest()