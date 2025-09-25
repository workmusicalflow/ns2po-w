import { v2 as cloudinary } from 'cloudinary'
import formidable from 'formidable'

export default defineEventHandler(async (event) => {
  try {
    // Configuration Cloudinary
    const config = useRuntimeConfig()
    cloudinary.config({
      cloud_name: config.cloudinaryCloudName,
      api_key: config.cloudinaryApiKey,
      api_secret: config.cloudinaryApiSecret,
    })

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(event.node.req)
    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Aucun fichier fourni'
      })
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.mimetype || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WEBP.'
      })
    }

    // Upload vers Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.filepath, {
      folder: 'ns2po/products',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' },
        { format: 'auto' }
      ]
    })

    return {
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes
    }
  } catch (error) {
    console.error('🔴 Upload error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Erreur lors de l\'upload de l\'image'
    })
  }
})