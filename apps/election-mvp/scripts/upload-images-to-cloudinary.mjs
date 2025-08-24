#!/usr/bin/env node

import { v2 as cloudinary } from 'cloudinary'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration Cloudinary
cloudinary.config({
  cloud_name: 'dsrvzogof',
  api_key: '775318993136791',
  api_secret: 'ywTgN-mioXQXW1lOWmq2xNAIK7U'
})

// Mapping des images locales vers les noms Cloudinary
const imageMapping = {
  'tee-shirt-imprime-big.jpg': 'tee-shirt-001',
  'polo-big.jpg': 'polo-001', 
  'gobelet-d\'eau-minerale-personalise-big.jpg': 'gobelet-001',
  'casquette-big.jpg': 'casquette-001',
  'sac-bandouliere-big.jpg': 'sac-001',
  'affiche-60x40-big.jpg': 'affiche-001',
  'bracelet-silicone-big.jpg': 'bracelet-001',
  'banderole-6x1,5m-big.jpg': 'banderole-001',
  'parapluie-big.jpg': 'parapluie-001'
}

// Chemin vers les images locales
const assetsPath = join(__dirname, '../../../assets-source/products/models-products')

async function uploadImage(localFileName, cloudinaryId) {
  const localPath = join(assetsPath, localFileName)
  
  if (!existsSync(localPath)) {
    console.log(`❌ Image locale manquante: ${localFileName}`)
    return false
  }

  try {
    console.log(`🚀 Upload: ${localFileName} → ns2po/gallery/creative/${cloudinaryId}`)
    
    const result = await cloudinary.uploader.upload(localPath, {
      public_id: cloudinaryId,
      folder: 'ns2po/gallery/creative',
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto:good',
      overwrite: true
    })

    console.log(`✅ Success: ${result.public_id} (${result.bytes} bytes)`)
    return true
    
  } catch (error) {
    console.log(`❌ Erreur upload ${localFileName}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🎯 Upload des images vers Cloudinary...\n')
  
  let successCount = 0
  let totalCount = 0
  
  for (const [localFile, cloudinaryId] of Object.entries(imageMapping)) {
    totalCount++
    const success = await uploadImage(localFile, cloudinaryId)
    if (success) successCount++
    
    // Délai entre uploads pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n📊 Résultats: ${successCount}/${totalCount} images uploadées avec succès`)
  
  // Test d'une URL générée
  const testUrl = 'https://res.cloudinary.com/dsrvzogof/image/upload/f_auto,q_auto,w_800,h_600,c_fill/ns2po/gallery/creative/tee-shirt-001.jpg'
  console.log(`\n🧪 Test URL: ${testUrl}`)
}

main().catch(console.error)