/**
 * API Route: POST /api/cloudinary/upload
 * Upload d'images vers Cloudinary avec signature sécurisée
 */

import { v2 as cloudinary } from 'cloudinary'
import type { CloudinaryUploadResult } from '../../../utils/cloudinary'
import { buildCloudinaryUrl } from '../../../utils/cloudinary'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Configuration Cloudinary
    cloudinary.config({
      cloud_name: config.cloudinaryCloudName,
      api_key: config.cloudinaryApiKey,
      api_secret: config.cloudinaryApiSecret
    })

    // Récupération du fichier depuis le form data
    const form = await readMultipartFormData(event)
    
    if (!form || !form.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun fichier fourni'
      })
    }

    const fileData = form.find(field => field.name === 'file')
    const folder = form.find(field => field.name === 'folder')?.data?.toString() || 'ns2po-election'
    const preset = form.find(field => field.name === 'preset')?.data?.toString() || 'default'

    if (!fileData || !fileData.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Fichier invalide'
      })
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (fileData.type && !allowedTypes.includes(fileData.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Type de fichier non supporté. Formats autorisés: JPEG, PNG, WebP, SVG'
      })
    }

    // Options d'upload selon le preset
    const uploadOptions = getUploadOptionsForPreset(preset, folder)

    console.log('📤 Upload vers Cloudinary...')

    // Upload vers Cloudinary avec timeout
    const result = await Promise.race([
      new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('❌ Erreur upload Cloudinary:', error)
              reject(error)
            } else if (result) {
              console.log('✅ Upload Cloudinary réussi:', result.public_id)
              resolve(result as CloudinaryUploadResult)
            } else {
              console.error('❌ Résultat upload vide')
              reject(new Error('Résultat upload vide'))
            }
          }
        ).end(fileData.data)
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('⏰ Timeout upload Cloudinary (30s)')
          reject(new Error('Timeout - Upload vers Cloudinary trop long (30s)'))
        }, 30000)
      })
    ])

    return {
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        version: result.version,
        // URLs transformées courantes
        thumbnail: buildCloudinaryUrl(result.public_id, { 
          width: 300, 
          height: 300, 
          crop: 'fill',
          quality: 'auto',
          format: 'auto'
        }),
        preview: buildCloudinaryUrl(result.public_id, {
          width: 800,
          height: 600,
          crop: 'fit',
          quality: 'auto',
          format: 'auto'
        })
      }
    }

  } catch (error: unknown) {
    console.error('Erreur API /cloudinary/upload:', error)
    
    throw createError({
      statusCode: (error as { statusCode?: number })?.statusCode || 500,
      statusMessage: (error as { message?: string })?.message || 'Erreur lors de l\'upload'
    })
  }
})

/**
 * Options d'upload selon le preset choisi
 */
function getUploadOptionsForPreset(preset: string, folder: string) {
  const baseOptions = {
    folder,
    resource_type: 'image' as const,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    max_file_size: 10000000, // 10MB
    use_filename: true,
    unique_filename: true,
    overwrite: false
  }

  switch (preset) {
    case 'logo':
      return {
        ...baseOptions,
        folder: `${folder}/logos`,
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto', format: 'auto' }
        ]
      }

    case 'product':
      return {
        ...baseOptions,
        folder: `${folder}/products`,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', format: 'auto' }
        ]
      }

    case 'gallery':
      return {
        ...baseOptions,
        folder: `${folder}/gallery`,
        transformation: [
          { width: 1600, height: 1200, crop: 'limit' },
          { quality: 'auto', format: 'auto' }
        ]
      }

    case 'avatar':
      return {
        ...baseOptions,
        folder: `${folder}/avatars`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', format: 'auto' }
        ]
      }

    default:
      return {
        ...baseOptions,
        transformation: [
          { quality: 'auto', format: 'auto' }
        ]
      }
  }
}