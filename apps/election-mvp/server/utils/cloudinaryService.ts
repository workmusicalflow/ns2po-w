/**
 * Service Cloudinary Complet - NS2PO Assets Management
 * Gestion centralisée des opérations Cloudinary avec patterns SOLID
 */

import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'
import type { CloudinaryUploadResult } from '../../utils/cloudinary'

// Types pour notre service
export interface CloudinaryConfig {
  cloud_name: string
  api_key: string
  api_secret: string
}

export interface UploadOptions {
  folder?: string
  public_id?: string
  tags?: string[]
  transformation?: any
  context?: Record<string, string>
  overwrite?: boolean
}

export interface ListResourcesOptions {
  type?: 'image' | 'video' | 'raw'
  prefix?: string
  max_results?: number
  next_cursor?: string
  tags?: boolean
  context?: boolean
}

export interface DeleteOptions {
  resource_type?: 'image' | 'video' | 'raw'
  type?: 'upload' | 'private'
  invalidate?: boolean
}

/**
 * Service Cloudinary avec configuration centralisée
 */
class CloudinaryService {
  private static instance: CloudinaryService
  private isConfigured = false

  constructor() {
    this.initializeConfig()
  }

  static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService()
    }
    return CloudinaryService.instance
  }

  /**
   * Initialisation de la configuration Cloudinary
   */
  private initializeConfig() {
    if (this.isConfigured) return

    const config = useRuntimeConfig()

    if (!config.cloudinaryCloudName || !config.cloudinaryApiKey || !config.cloudinaryApiSecret) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Configuration Cloudinary manquante'
      })
    }

    cloudinary.config({
      cloud_name: config.cloudinaryCloudName,
      api_key: config.cloudinaryApiKey,
      api_secret: config.cloudinaryApiSecret
    })

    this.isConfigured = true
  }

  /**
   * Upload d'un fichier vers Cloudinary
   */
  async uploadFile(
    fileData: Buffer | string,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    this.initializeConfig()

    const uploadOptions = {
      folder: options.folder || 'ns2po/products',
      tags: options.tags || ['ns2po', 'product'],
      overwrite: options.overwrite || false,
      unique_filename: true,
      use_filename: false,
      ...options
    }

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error)
            else if (result) resolve(result)
            else reject(new Error('No result from Cloudinary'))
          }
        ).end(fileData)
      })

      // Transformation en format standardisé
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        version: result.version,
        resource_type: result.resource_type,
        thumbnail: this.generateThumbnailUrl(result.public_id),
        preview: this.generatePreviewUrl(result.public_id)
      }
    } catch (error) {
      console.error('❌ Erreur upload Cloudinary:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de l\'upload vers Cloudinary',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  /**
   * Suppression d'un asset Cloudinary
   */
  async deleteAsset(
    publicId: string,
    options: DeleteOptions = {}
  ): Promise<{ success: boolean; result: string }> {
    this.initializeConfig()

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: options.resource_type || 'image',
        type: options.type || 'upload',
        invalidate: options.invalidate || true
      })

      return {
        success: result.result === 'ok',
        result: result.result
      }
    } catch (error) {
      console.error(`❌ Erreur suppression Cloudinary ${publicId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression sur Cloudinary',
        data: { publicId, error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  /**
   * Suppression en batch de plusieurs assets
   */
  async deleteBulkAssets(
    publicIds: string[],
    options: DeleteOptions = {}
  ): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = []
    const failed: string[] = []

    for (const publicId of publicIds) {
      try {
        const result = await this.deleteAsset(publicId, options)
        if (result.success) {
          deleted.push(publicId)
        } else {
          failed.push(publicId)
        }
      } catch (error) {
        failed.push(publicId)
        console.error(`❌ Échec suppression ${publicId}:`, error)
      }
    }

    return { deleted, failed }
  }

  /**
   * Liste des resources Cloudinary
   */
  async listResources(
    options: ListResourcesOptions = {}
  ): Promise<{
    resources: any[]
    next_cursor?: string
    total_count: number
  }> {
    this.initializeConfig()

    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: options.type || 'image',
        prefix: options.prefix,
        max_results: options.max_results || 30,
        next_cursor: options.next_cursor,
        tags: options.tags || false,
        context: options.context || false
      })

      return {
        resources: result.resources || [],
        next_cursor: result.next_cursor,
        total_count: result.total_count || 0
      }
    } catch (error) {
      console.error('❌ Erreur listage Cloudinary:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors du listage des resources Cloudinary'
      })
    }
  }

  /**
   * Recherche d'assets par tags
   */
  async searchByTags(
    tags: string[],
    options: { max_results?: number; next_cursor?: string } = {}
  ): Promise<{
    resources: any[]
    next_cursor?: string
    total_count: number
  }> {
    this.initializeConfig()

    try {
      const result = await cloudinary.search
        .expression(`tags:${tags.join(' AND tags:')}`)
        .max_results(options.max_results || 30)
        .next_cursor(options.next_cursor || undefined)
        .execute()

      return {
        resources: result.resources || [],
        next_cursor: result.next_cursor,
        total_count: result.total_count || 0
      }
    } catch (error) {
      console.error('❌ Erreur recherche Cloudinary:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la recherche Cloudinary'
      })
    }
  }

  /**
   * Mise à jour des métadonnées Cloudinary
   */
  async updateMetadata(
    publicId: string,
    metadata: {
      tags?: string[]
      context?: Record<string, string>
    }
  ): Promise<{ success: boolean }> {
    this.initializeConfig()

    try {
      // Mise à jour des tags si fournis
      if (metadata.tags) {
        await cloudinary.uploader.add_tag(
          metadata.tags.join(','),
          [publicId]
        )
      }

      // Mise à jour du contexte si fourni
      if (metadata.context) {
        await cloudinary.uploader.update_metadata(
          metadata.context,
          [publicId]
        )
      }

      return { success: true }
    } catch (error) {
      console.error(`❌ Erreur mise à jour métadonnées ${publicId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour des métadonnées'
      })
    }
  }

  /**
   * Génération d'URL optimisées
   */
  generateThumbnailUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto',
      format: 'auto'
    })
  }

  generatePreviewUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      width: 800,
      height: 600,
      crop: 'fit',
      quality: 'auto',
      format: 'auto'
    })
  }

  /**
   * Génération d'URL avec transformations personnalisées
   */
  generateOptimizedUrl(publicId: string, transformations: any = {}): string {
    return cloudinary.url(publicId, {
      quality: 'auto',
      format: 'auto',
      ...transformations
    })
  }

  /**
   * Vérification de l'existence d'un asset
   */
  async assetExists(publicId: string): Promise<boolean> {
    this.initializeConfig()

    try {
      await cloudinary.api.resource(publicId)
      return true
    } catch (error: any) {
      if (error.http_code === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Obtenir les informations détaillées d'un asset
   */
  async getAssetInfo(publicId: string): Promise<any> {
    this.initializeConfig()

    try {
      return await cloudinary.api.resource(publicId, {
        colors: true,
        faces: true,
        quality_analysis: true,
        accessibility_analysis: true
      })
    } catch (error) {
      console.error(`❌ Erreur récupération info asset ${publicId}:`, error)
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset non trouvé sur Cloudinary'
      })
    }
  }
}

// Export du singleton
export const cloudinaryService = CloudinaryService.getInstance()

// Export des types pour utilisation externe
export type {
  CloudinaryUploadResult,
  UploadOptions,
  ListResourcesOptions,
  DeleteOptions
}