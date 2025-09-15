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

// Mapping des photos d'équipe vers les public_ids Cloudinary
const teamPhotoMapping = {
  'isaac-allegbe-team-0.jpg': 'isaac-allegbe',
  'konan-team-2.jpg': 'konan',
  'roxane-team-1.jpg': 'roxane'
}

// Chemin vers les photos d'équipe
const teamPhotosPath = join(__dirname, '../../../assets-source/team')

async function uploadTeamPhoto(localFileName, publicId) {
  const localPath = join(teamPhotosPath, localFileName)
  
  if (!existsSync(localPath)) {
    console.log(`❌ Photo d'équipe manquante: ${localFileName}`)
    return false
  }

  try {
    console.log(`🚀 Upload: ${localFileName} → ns2po/team/${publicId}`)
    
    const result = await cloudinary.uploader.upload(localPath, {
      public_id: publicId,
      folder: 'ns2po/team',
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto:good',
      // Optimisations pour photos circulaires
      transformation: [
        {
          width: 200,
          height: 200,
          crop: 'fill',
          gravity: 'face', // Focus sur le visage
          quality: 'auto:good',
          format: 'auto'
        }
      ],
      overwrite: true,
      tags: ['team', 'portrait', 'hero-section']
    })

    console.log(`✅ Success: ${result.public_id}`)
    console.log(`   - Size: ${Math.round(result.bytes / 1024)}KB`)
    console.log(`   - Dimensions: ${result.width}x${result.height}`)
    
    // Génération des URLs optimisées pour différentes tailles
    const urls = {
      desktop: cloudinary.url(result.public_id, { 
        width: 80, height: 80, crop: 'fill', gravity: 'face',
        quality: 'auto:good', format: 'auto'
      }),
      mobile: cloudinary.url(result.public_id, { 
        width: 60, height: 60, crop: 'fill', gravity: 'face',
        quality: 'auto:good', format: 'auto'
      })
    }
    
    console.log(`   - Desktop URL: ${urls.desktop}`)
    console.log(`   - Mobile URL: ${urls.mobile}`)
    
    return { success: true, publicId, urls }
    
  } catch (error) {
    console.log(`❌ Erreur upload ${localFileName}:`, error.message)
    return { success: false }
  }
}

async function main() {
  console.log('📸 Upload des photos d\'équipe vers Cloudinary...\n')
  
  let successCount = 0
  let totalCount = 0
  const uploadedPhotos = []
  
  for (const [localFile, publicId] of Object.entries(teamPhotoMapping)) {
    totalCount++
    const result = await uploadTeamPhoto(localFile, publicId)
    
    if (result.success) {
      successCount++
      uploadedPhotos.push({
        name: publicId,
        desktopUrl: result.urls.desktop,
        mobileUrl: result.urls.mobile
      })
    }
    
    // Délai entre uploads pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('') // Ligne vide pour lisibilité
  }
  
  console.log(`📊 Résultats: ${successCount}/${totalCount} photos d'équipe uploadées avec succès\n`)
  
  if (successCount > 0) {
    console.log('🎯 Photos disponibles pour intégration:')
    uploadedPhotos.forEach(photo => {
      console.log(`   - ${photo.name}`)
      console.log(`     Desktop: ${photo.desktopUrl}`)
      console.log(`     Mobile: ${photo.mobileUrl}`)
    })
    
    console.log('\n💡 Configuration Vue à utiliser:')
    console.log('const teamPhotos = [')
    uploadedPhotos.forEach((photo, index) => {
      console.log(`  {`)
      console.log(`    name: '${photo.name}',`)
      console.log(`    desktop: '${photo.desktopUrl}',`)
      console.log(`    mobile: '${photo.mobileUrl}'`)
      console.log(`  }${index < uploadedPhotos.length - 1 ? ',' : ''}`)
    })
    console.log(']')
  }
}

main().catch(console.error)