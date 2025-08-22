/**
 * API Route: Upload d'assets vers Cloudinary et synchronisation Airtable
 * POST /api/admin/upload-asset
 */

import { v2 as cloudinary } from 'cloudinary'
import formidable, { type Fields, type Files, type File } from 'formidable'

interface CloudinaryResponse {
  secure_url: string
  public_id: string
  width: number
  height: number
  format: string
  bytes: number
}

interface SyncResult {
  success: boolean
  airtableId?: string
  error?: string
}

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export default defineEventHandler(async (event) => {
  try {
    // Vérifier la méthode
    if (event.node.req.method !== 'POST') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method Not Allowed'
      })
    }

    // Parser le formulaire multipart
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10 MB
      allowEmptyFiles: false,
      multiples: false
    })

    const [fields, files] = await new Promise<[Fields, Files]>((resolve, reject) => {
      form.parse(event.node.req, (err, fields, files) => {
        if (err) reject(err)
        else resolve([fields, files])
      })
    })

    const file = Array.isArray(files.file) ? files.file[0] : files.file as File | undefined
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category as string | undefined
    const originalName = Array.isArray(fields.originalName) ? fields.originalName[0] : fields.originalName as string | undefined

    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun fichier fourni'
      })
    }

    if (!category) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Catégorie manquante'
      })
    }

    // Valider le type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!file.mimetype || !validTypes.includes(file.mimetype)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Type de fichier non supporté'
      })
    }

    // Générer un nom optimisé pour Cloudinary
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const cleanName = (originalName || file.originalFilename || 'unknown')
      .replace(/\.[^/.]+$/, '') // Retirer l'extension
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const publicId = `ns2po-assets/${category.toLowerCase().replace(/\s+/g, '-')}/${cleanName}-${timestamp}`

    console.log('📤 Upload vers Cloudinary:', {
      originalName,
      category,
      publicId,
      size: file.size
    })

    // Upload vers Cloudinary
    const cloudinaryResponse = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        file.filepath,
        {
          public_id: publicId,
          folder: 'ns2po-assets',
          resource_type: 'auto',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' },
            { width: 2000, height: 2000, crop: 'limit' }
          ],
          tags: ['ns2po', 'admin-upload', category.toLowerCase()],
          context: {
            category: category,
            originalName: originalName || file.originalFilename,
            uploadedBy: 'admin-interface',
            uploadDate: new Date().toISOString()
          }
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as CloudinaryResponse)
        }
      )
    })

    console.log('✅ Upload Cloudinary réussi:', {
      url: cloudinaryResponse.secure_url,
      publicId: cloudinaryResponse.public_id,
      size: cloudinaryResponse.bytes
    })

    // Import dynamique pour éviter les problèmes de types
    const { syncAssetToAirtable } = await import('../../../scripts/airtable-integration.mjs')
    
    // Synchroniser avec Airtable
    const syncResult = await syncAssetToAirtable(file.filepath, cloudinaryResponse) as SyncResult
    
    if (!syncResult.success) {
      console.error('⚠️ Erreur sync Airtable (asset uploadé sur Cloudinary):', syncResult.error)
      // On continue même si Airtable échoue
    }

    return {
      success: true,
      data: {
        cloudinary: {
          url: cloudinaryResponse.secure_url,
          publicId: cloudinaryResponse.public_id,
          width: cloudinaryResponse.width,
          height: cloudinaryResponse.height,
          format: cloudinaryResponse.format,
          size: cloudinaryResponse.bytes
        },
        airtable: syncResult.success ? {
          id: syncResult.airtableId,
          synced: true
        } : {
          synced: false,
          error: syncResult.error
        }
      },
      message: 'Asset uploadé avec succès',
      timestamp: new Date().toISOString()
    }

  } catch (error: unknown) {
    console.error('❌ Erreur upload asset:', error)

    // Erreurs spécifiques avec statusCode
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // Erreur générale
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de l\'upload',
      data: {
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    })
  }
})