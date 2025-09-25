/**
 * Asset Service - Logique métier pour la gestion des assets NS2PO
 * Architecture SOLID avec séparation des responsabilités
 */

import { getDatabase } from '../utils/database'
import { cloudinaryService } from '../utils/cloudinaryService'
import { createError } from 'h3'
import type { CloudinaryUploadResult } from '../../utils/cloudinary'

// Types pour notre service Asset
export interface Asset {
  id: string
  public_id: string
  secure_url: string
  url?: string
  format: string
  resource_type: string
  bytes: number
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  tags?: string[]
  folder: string
  created_at: string
  updated_at: string
  is_deleted: boolean
}

export interface CreateAssetData {
  public_id: string
  secure_url: string
  url?: string
  format: string
  resource_type?: string
  bytes: number
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  tags?: string[]
  folder?: string
}

export interface UpdateAssetData {
  alt_text?: string
  caption?: string
  tags?: string[]
}

export interface AssetFilters {
  format?: string
  folder?: string
  tags?: string[]
  search?: string
}

export interface AssetUsage {
  id: string
  asset_id: string
  entity_type: string
  entity_id: string
  field_name: string
  created_at: string
  updated_at: string
  // Informations détaillées sur l'entité (récupérées via jointure)
  entity_name?: string
  entity_url?: string
}

export interface AssetUsageDetail {
  totalUsages: number
  usages: AssetUsage[]
  canDelete: boolean
  deleteWarnings: string[]
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'updated_at' | 'bytes'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Service Asset avec gestion complète des assets en base de données
 */
class AssetService {
  private static instance: AssetService

  static getInstance(): AssetService {
    if (!AssetService.instance) {
      AssetService.instance = new AssetService()
    }
    return AssetService.instance
  }

  /**
   * Génération d'un ID unique pour les assets
   */
  private generateAssetId(): string {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 11)
    return `asset_${timestamp}_${randomStr}`
  }

  /**
   * Création d'un nouvel asset en base après upload Cloudinary
   */
  async createAsset(cloudinaryResult: CloudinaryUploadResult, metadata: Partial<UpdateAssetData> = {}): Promise<Asset> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    const assetId = this.generateAssetId()
    const now = new Date().toISOString()

    try {
      const assetData = {
        id: assetId,
        public_id: cloudinaryResult.public_id,
        secure_url: cloudinaryResult.secure_url,
        url: cloudinaryResult.url || cloudinaryResult.secure_url,
        format: cloudinaryResult.format,
        resource_type: cloudinaryResult.resource_type || 'image',
        bytes: cloudinaryResult.bytes,
        width: cloudinaryResult.width || null,
        height: cloudinaryResult.height || null,
        alt_text: metadata.alt_text || null,
        caption: metadata.caption || null,
        tags: metadata.tags ? JSON.stringify(metadata.tags) : JSON.stringify([]),
        folder: 'ns2po/products',
        created_at: now,
        updated_at: now,
        is_deleted: 0
      }

      await db.execute({
        sql: `INSERT INTO assets (
          id, public_id, secure_url, url, format, resource_type, bytes,
          width, height, alt_text, caption, tags, folder,
          created_at, updated_at, is_deleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          assetData.id, assetData.public_id, assetData.secure_url, assetData.url,
          assetData.format, assetData.resource_type, assetData.bytes,
          assetData.width, assetData.height, assetData.alt_text, assetData.caption,
          assetData.tags, assetData.folder, assetData.created_at, assetData.updated_at,
          assetData.is_deleted
        ]
      })

      const createdAsset = await this.getAssetById(assetId)
      if (!createdAsset) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de la création de l\'asset'
        })
      }

      console.log(`✅ Asset créé: ${assetId} (${cloudinaryResult.public_id})`)
      return createdAsset
    } catch (error) {
      console.error('❌ Erreur création asset:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de l\'enregistrement de l\'asset',
        data: { assetId, error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  /**
   * Récupération d'un asset par son ID
   */
  async getAssetById(id: string): Promise<Asset | null> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      const result = await db.execute({
        sql: 'SELECT * FROM assets WHERE id = ? AND is_deleted = 0',
        args: [id]
      })

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return this.mapRowToAsset(row)
    } catch (error) {
      console.error(`❌ Erreur récupération asset ${id}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération de l\'asset'
      })
    }
  }

  /**
   * Récupération d'un asset par son public_id Cloudinary
   */
  async getAssetByPublicId(publicId: string): Promise<Asset | null> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      const result = await db.execute({
        sql: 'SELECT * FROM assets WHERE public_id = ? AND is_deleted = 0',
        args: [publicId]
      })

      if (result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return this.mapRowToAsset(row)
    } catch (error) {
      console.error(`❌ Erreur récupération asset par public_id ${publicId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération de l\'asset'
      })
    }
  }

  /**
   * Upsert d'un asset depuis les données Cloudinary (pour la synchronisation)
   */
  async upsertAssetFromCloudinary(cloudinaryResource: any): Promise<Asset> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      // Vérifier si l'asset existe déjà par public_id
      const existingAsset = await this.getAssetByPublicId(cloudinaryResource.public_id)

      // Extraire le dossier du public_id
      const folder = cloudinaryResource.public_id.includes('/') 
        ? cloudinaryResource.public_id.substring(0, cloudinaryResource.public_id.lastIndexOf('/'))
        : 'ns2po/products'

      // Données de l'asset à partir de Cloudinary
      const assetData = {
        public_id: cloudinaryResource.public_id,
        secure_url: cloudinaryResource.secure_url,
        url: cloudinaryResource.url || cloudinaryResource.secure_url,
        format: cloudinaryResource.format,
        resource_type: cloudinaryResource.resource_type || 'image',
        bytes: cloudinaryResource.bytes,
        width: cloudinaryResource.width || null,
        height: cloudinaryResource.height || null,
        alt_text: cloudinaryResource.context?.alt || null,
        caption: cloudinaryResource.context?.caption || null,
        tags: cloudinaryResource.tags ? JSON.stringify(cloudinaryResource.tags) : JSON.stringify([]),
        folder: folder,
        updated_at: new Date().toISOString()
      }

      if (existingAsset) {
        // Mettre à jour l'asset existant
        await db.execute({
          sql: `UPDATE assets SET 
                secure_url = ?, url = ?, format = ?, resource_type = ?, bytes = ?,
                width = ?, height = ?, tags = ?, folder = ?, updated_at = ?
                WHERE public_id = ?`,
          args: [
            assetData.secure_url, assetData.url, assetData.format, assetData.resource_type,
            assetData.bytes, assetData.width, assetData.height, assetData.tags,
            assetData.folder, assetData.updated_at, assetData.public_id
          ]
        })

        console.log(`✅ Asset mis à jour depuis Cloudinary: ${existingAsset.id} (${cloudinaryResource.public_id})`)
        
        // Retourner l'asset mis à jour
        const updatedAsset = await this.getAssetByPublicId(cloudinaryResource.public_id)
        return updatedAsset!
      } else {
        // Créer un nouvel asset
        const assetId = this.generateAssetId()
        const now = new Date().toISOString()

        await db.execute({
          sql: `INSERT INTO assets (
            id, public_id, secure_url, url, format, resource_type, bytes,
            width, height, alt_text, caption, tags, folder,
            created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            assetId, assetData.public_id, assetData.secure_url, assetData.url,
            assetData.format, assetData.resource_type, assetData.bytes,
            assetData.width, assetData.height, assetData.alt_text, assetData.caption,
            assetData.tags, assetData.folder, now, assetData.updated_at, 0
          ]
        })

        console.log(`✅ Nouvel asset créé depuis Cloudinary: ${assetId} (${cloudinaryResource.public_id})`)
        
        // Retourner le nouvel asset
        const newAsset = await this.getAssetById(assetId)
        return newAsset!
      }
    } catch (error) {
      console.error(`❌ Erreur upsert asset Cloudinary ${cloudinaryResource.public_id}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la synchronisation de l\'asset',
        data: { 
          publicId: cloudinaryResource.public_id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      })
    }
  }

  /**
   * Liste des assets avec filtres et pagination
   */
  async getAssets(
    filters: AssetFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{
    assets: Asset[]
    total: number
    page: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    const page = Math.max(1, pagination.page || 1)
    const limit = Math.min(100, Math.max(1, pagination.limit || 30))
    const offset = (page - 1) * limit
    const sortBy = pagination.sortBy || 'created_at'
    const sortOrder = pagination.sortOrder || 'desc'

    try {
      // Construction des conditions WHERE
      const conditions: string[] = ['is_deleted = 0']
      const params: any[] = []

      if (filters.format) {
        conditions.push('format = ?')
        params.push(filters.format)
      }

      if (filters.folder) {
        conditions.push('folder = ?')
        params.push(filters.folder)
      }

      if (filters.search) {
        conditions.push('(alt_text LIKE ? OR caption LIKE ? OR public_id LIKE ?)')
        const searchPattern = `%${filters.search}%`
        params.push(searchPattern, searchPattern, searchPattern)
      }

      if (filters.tags && filters.tags.length > 0) {
        const tagConditions = filters.tags.map(() => 'tags LIKE ?').join(' OR ')
        conditions.push(`(${tagConditions})`)
        filters.tags.forEach(tag => {
          params.push(`%"${tag}"%`)
        })
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // Récupération du total
      const countResult = await db.execute({
        sql: `SELECT COUNT(*) as count FROM assets ${whereClause}`,
        args: params
      })
      const total = Number(countResult.rows[0].count)

      // Récupération des assets avec pagination et comptage des usages
      const assetsResult = await db.execute({
        sql: `SELECT a.*,
              COALESCE(usage_count.count, 0) as usage_count
              FROM assets a
              LEFT JOIN (
                SELECT asset_id, COUNT(*) as count
                FROM asset_usages
                GROUP BY asset_id
              ) usage_count ON a.id = usage_count.asset_id
              ${whereClause}
              ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
              LIMIT ? OFFSET ?`,
        args: [...params, limit, offset]
      })

      const assets = assetsResult.rows.map(row => ({
        ...this.mapRowToAsset(row as any),
        usage_count: Number(row.usage_count || 0)
      }))
      const totalPages = Math.ceil(total / limit)

      return {
        assets,
        total,
        page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    } catch (error) {
      console.error('❌ Erreur récupération assets:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des assets'
      })
    }
  }

  /**
   * Mise à jour d'un asset
   */
  async updateAsset(id: string, updates: UpdateAssetData): Promise<Asset | null> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que l'asset existe
    const existingAsset = await this.getAssetById(id)
    if (!existingAsset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset non trouvé'
      })
    }

    try {
      const updateFields: string[] = []
      const updateValues: any[] = []

      if (updates.alt_text !== undefined) {
        updateFields.push('alt_text = ?')
        updateValues.push(updates.alt_text)
      }

      if (updates.caption !== undefined) {
        updateFields.push('caption = ?')
        updateValues.push(updates.caption)
      }

      if (updates.tags !== undefined) {
        updateFields.push('tags = ?')
        updateValues.push(JSON.stringify(updates.tags))
      }

      if (updateFields.length === 0) {
        return existingAsset // Rien à mettre à jour
      }

      updateFields.push('updated_at = ?')
      updateValues.push(new Date().toISOString())
      updateValues.push(id)

      await db.execute({
        sql: `UPDATE assets SET ${updateFields.join(', ')} WHERE id = ?`,
        args: updateValues
      })

      // Mettre à jour les métadonnées Cloudinary si nécessaire
      if (updates.tags) {
        try {
          await cloudinaryService.updateMetadata(existingAsset.public_id, {
            tags: updates.tags
          })
        } catch (error) {
          console.warn(`⚠️ Erreur mise à jour tags Cloudinary pour ${existingAsset.public_id}:`, error)
        }
      }

      const updatedAsset = await this.getAssetById(id)
      console.log(`✅ Asset mis à jour: ${id}`)
      return updatedAsset
    } catch (error) {
      console.error(`❌ Erreur mise à jour asset ${id}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour de l\'asset'
      })
    }
  }

  /**
   * Suppression d'un asset (base de données ET Cloudinary)
   */
  async deleteAsset(id: string): Promise<{ success: boolean; asset: Asset | null }> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Récupérer l'asset avant suppression
    const asset = await this.getAssetById(id)
    if (!asset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset non trouvé'
      })
    }

    try {
      // Vérifier si l'asset est utilisé dans des produits
      const usageCheck = await db.execute({
        sql: `SELECT COUNT(*) as count FROM products
              WHERE main_image_asset_id = ?
              OR gallery_asset_ids LIKE ?`,
        args: [id, `%"${id}"%`]
      })

      const usageCount = Number(usageCheck.rows[0].count)
      if (usageCount > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Impossible de supprimer l'asset. Il est utilisé dans ${usageCount} produit(s).`,
          data: {
            reason: 'asset_in_use',
            usageCount
          }
        })
      }

      // Suppression de Cloudinary
      const cloudinaryResult = await cloudinaryService.deleteAsset(asset.public_id)
      if (!cloudinaryResult.success) {
        console.warn(`⚠️ Échec suppression Cloudinary pour ${asset.public_id}`)
      }

      // Suppression de la base de données (soft delete)
      await db.execute({
        sql: 'UPDATE assets SET is_deleted = 1, updated_at = ? WHERE id = ?',
        args: [new Date().toISOString(), id]
      })

      console.log(`✅ Asset supprimé: ${id} (${asset.public_id})`)
      return { success: true, asset }
    } catch (error: any) {
      // Si c'est une erreur avec statusCode, la renvoyer telle quelle
      if (error.statusCode) {
        throw error
      }

      console.error(`❌ Erreur suppression asset ${id}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression de l\'asset',
        data: { assetId: id, error: error.message }
      })
    }
  }

  /**
   * Récupération des assets liés à un produit
   */
  async getAssetsByProduct(productId: string): Promise<{
    mainImage: Asset | null
    galleryImages: Asset[]
  }> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      const productResult = await db.execute({
        sql: 'SELECT main_image_asset_id, gallery_asset_ids FROM products WHERE id = ?',
        args: [productId]
      })

      if (productResult.rows.length === 0) {
        return { mainImage: null, galleryImages: [] }
      }

      const product = productResult.rows[0] as any
      const mainImageId = product.main_image_asset_id
      const galleryIds = product.gallery_asset_ids ?
        JSON.parse(product.gallery_asset_ids) : []

      let mainImage: Asset | null = null
      if (mainImageId) {
        mainImage = await this.getAssetById(mainImageId)
      }

      const galleryImages: Asset[] = []
      for (const galleryId of galleryIds) {
        const asset = await this.getAssetById(galleryId)
        if (asset) {
          galleryImages.push(asset)
        }
      }

      return { mainImage, galleryImages }
    } catch (error) {
      console.error(`❌ Erreur récupération assets produit ${productId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des assets du produit'
      })
    }
  }

  /**
   * Récupération détaillée des usages d'un asset
   */
  async getAssetUsage(assetId: string): Promise<AssetUsageDetail> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      // Vérifier que l'asset existe
      const asset = await this.getAssetById(assetId)
      if (!asset) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Asset non trouvé'
        })
      }

      // Récupérer tous les usages avec détails des entités
      const usagesResult = await db.execute({
        sql: `SELECT au.*, p.name as entity_name
              FROM asset_usages au
              LEFT JOIN products p ON au.entity_type = 'product' AND au.entity_id = p.id
              WHERE au.asset_id = ?
              ORDER BY au.created_at DESC`,
        args: [assetId]
      })

      const usages: AssetUsage[] = usagesResult.rows.map(row => ({
        id: row.id as string,
        asset_id: row.asset_id as string,
        entity_type: row.entity_type as string,
        entity_id: row.entity_id as string,
        field_name: row.field_name as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        entity_name: row.entity_name as string || `${row.entity_type} #${row.entity_id}`,
        entity_url: row.entity_type === 'product' ? `/admin/products/${row.entity_id}` : undefined
      }))

      const totalUsages = usages.length
      const canDelete = totalUsages === 0
      const deleteWarnings: string[] = []

      if (totalUsages > 0) {
        deleteWarnings.push(`Cet asset est utilisé dans ${totalUsages} élément(s)`)

        const productUsages = usages.filter(u => u.entity_type === 'product')
        if (productUsages.length > 0) {
          deleteWarnings.push(`Produits affectés: ${productUsages.map(u => u.entity_name).join(', ')}`)
        }
      }

      return {
        totalUsages,
        usages,
        canDelete,
        deleteWarnings
      }
    } catch (error: any) {
      if (error.statusCode) {
        throw error
      }

      console.error(`❌ Erreur récupération usage asset ${assetId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la récupération des usages de l\'asset'
      })
    }
  }

  /**
   * Suppression d'un asset avec validation avancée des usages
   */
  async deleteAssetWithValidation(assetId: string, forceDelete: boolean = false): Promise<{ success: boolean; asset: Asset | null }> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Récupérer l'asset avant suppression
    const asset = await this.getAssetById(assetId)
    if (!asset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset non trouvé'
      })
    }

    try {
      // Vérifier les usages avec notre nouvelle méthode
      const usageDetails = await this.getAssetUsage(assetId)

      if (!usageDetails.canDelete && !forceDelete) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Impossible de supprimer l\'asset car il est utilisé',
          data: {
            reason: 'asset_in_use',
            usageCount: usageDetails.totalUsages,
            usages: usageDetails.usages,
            warnings: usageDetails.deleteWarnings
          }
        })
      }

      // Transaction pour suppression atomique
      await db.execute({
        sql: 'BEGIN TRANSACTION',
        args: []
      })

      try {
        // Supprimer toutes les références dans asset_usages
        await db.execute({
          sql: 'DELETE FROM asset_usages WHERE asset_id = ?',
          args: [assetId]
        })

        // Si forceDelete, nettoyer les références dans les entités
        if (forceDelete && usageDetails.totalUsages > 0) {
          for (const usage of usageDetails.usages) {
            if (usage.entity_type === 'product') {
              if (usage.field_name === 'main_image') {
                await db.execute({
                  sql: 'UPDATE products SET main_image_asset_id = NULL WHERE id = ?',
                  args: [usage.entity_id]
                })
              } else if (usage.field_name === 'gallery_image') {
                // Récupérer et nettoyer le tableau des images de galerie
                const productResult = await db.execute({
                  sql: 'SELECT gallery_asset_ids FROM products WHERE id = ?',
                  args: [usage.entity_id]
                })

                if (productResult.rows.length > 0) {
                  const product = productResult.rows[0] as any
                  let galleryIds = product.gallery_asset_ids ? JSON.parse(product.gallery_asset_ids) : []
                  galleryIds = galleryIds.filter((id: string) => id !== assetId)

                  await db.execute({
                    sql: 'UPDATE products SET gallery_asset_ids = ? WHERE id = ?',
                    args: [JSON.stringify(galleryIds), usage.entity_id]
                  })
                }
              }
            }
          }
        }

        // Suppression de Cloudinary
        const cloudinaryResult = await cloudinaryService.deleteAsset(asset.public_id)
        if (!cloudinaryResult.success) {
          console.warn(`⚠️ Échec suppression Cloudinary pour ${asset.public_id}`)
        }

        // Suppression de la base de données (soft delete)
        await db.execute({
          sql: 'UPDATE assets SET is_deleted = 1, updated_at = ? WHERE id = ?',
          args: [new Date().toISOString(), assetId]
        })

        // Commit de la transaction
        await db.execute({
          sql: 'COMMIT',
          args: []
        })

        console.log(`✅ Asset supprimé avec validation: ${assetId} (${asset.public_id}) - Force: ${forceDelete}`)
        return { success: true, asset }
      } catch (error) {
        // Rollback en cas d'erreur
        await db.execute({
          sql: 'ROLLBACK',
          args: []
        })
        throw error
      }
    } catch (error: any) {
      if (error.statusCode) {
        throw error
      }

      console.error(`❌ Erreur suppression asset avec validation ${assetId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression de l\'asset',
        data: { assetId, error: error.message }
      })
    }
  }

  /**
   * Remplacement d'un asset par un autre avec préservation des références
   */
  async replaceAsset(
    oldAssetId: string,
    newAssetId?: string,
    newAssetFile?: any,
    deleteOldAsset: boolean = false
  ): Promise<{ success: boolean; oldAsset: Asset; newAsset: Asset }> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que l'ancien asset existe
    const oldAsset = await this.getAssetById(oldAssetId)
    if (!oldAsset) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Asset à remplacer non trouvé'
      })
    }

    let replacementAssetId = newAssetId

    try {
      // Si un nouveau fichier est fourni, l'uploader d'abord
      if (newAssetFile && !newAssetId) {
        const uploadResult = await cloudinaryService.uploadAsset(
          newAssetFile.path || newAssetFile,
          {
            folder: oldAsset.folder,
            public_id: `${oldAsset.public_id}_replacement_${Date.now()}`
          }
        )

        const newAsset = await this.createAsset(uploadResult, {
          alt_text: oldAsset.alt_text,
          caption: oldAsset.caption,
          tags: oldAsset.tags
        })

        replacementAssetId = newAsset.id
      }

      if (!replacementAssetId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Aucun asset de remplacement fourni'
        })
      }

      // Vérifier que l'asset de remplacement existe
      const newAsset = await this.getAssetById(replacementAssetId)
      if (!newAsset) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Asset de remplacement non trouvé'
        })
      }

      // Récupérer tous les usages de l'ancien asset
      const usageDetails = await this.getAssetUsage(oldAssetId)

      // Transaction pour remplacement atomique
      await db.execute({
        sql: 'BEGIN TRANSACTION',
        args: []
      })

      try {
        // Mettre à jour toutes les références dans les entités
        for (const usage of usageDetails.usages) {
          if (usage.entity_type === 'product') {
            if (usage.field_name === 'main_image') {
              await db.execute({
                sql: 'UPDATE products SET main_image_asset_id = ? WHERE id = ?',
                args: [replacementAssetId, usage.entity_id]
              })
            } else if (usage.field_name === 'gallery_image') {
              // Récupérer et modifier le tableau des images de galerie
              const productResult = await db.execute({
                sql: 'SELECT gallery_asset_ids FROM products WHERE id = ?',
                args: [usage.entity_id]
              })

              if (productResult.rows.length > 0) {
                const product = productResult.rows[0] as any
                let galleryIds = product.gallery_asset_ids ? JSON.parse(product.gallery_asset_ids) : []
                galleryIds = galleryIds.map((id: string) => id === oldAssetId ? replacementAssetId : id)

                await db.execute({
                  sql: 'UPDATE products SET gallery_asset_ids = ? WHERE id = ?',
                  args: [JSON.stringify(galleryIds), usage.entity_id]
                })
              }
            }
          }
        }

        // Mettre à jour la table asset_usages
        await db.execute({
          sql: 'UPDATE asset_usages SET asset_id = ? WHERE asset_id = ?',
          args: [replacementAssetId, oldAssetId]
        })

        // Si demandé, supprimer l'ancien asset
        if (deleteOldAsset) {
          // Vérifier qu'il n'est plus utilisé ailleurs
          const remainingUsages = await this.getAssetUsage(oldAssetId)
          if (remainingUsages.totalUsages === 0) {
            await cloudinaryService.deleteAsset(oldAsset.public_id)
            await db.execute({
              sql: 'UPDATE assets SET is_deleted = 1, updated_at = ? WHERE id = ?',
              args: [new Date().toISOString(), oldAssetId]
            })
          }
        }

        // Commit de la transaction
        await db.execute({
          sql: 'COMMIT',
          args: []
        })

        console.log(`✅ Asset remplacé: ${oldAssetId} → ${replacementAssetId} (${usageDetails.totalUsages} références mises à jour)`)
        return { success: true, oldAsset, newAsset }
      } catch (error) {
        // Rollback en cas d'erreur
        await db.execute({
          sql: 'ROLLBACK',
          args: []
        })
        throw error
      }
    } catch (error: any) {
      if (error.statusCode) {
        throw error
      }

      console.error(`❌ Erreur remplacement asset ${oldAssetId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors du remplacement de l\'asset',
        data: { oldAssetId, newAssetId: replacementAssetId, error: error.message }
      })
    }
  }

  /**
   * Utilitaire pour générer un ID d'usage unique
   */
  private generateUsageId(): string {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 11)
    return `usage_${timestamp}_${randomStr}`
  }

  /**
   * Mise à jour des usages d'assets pour une entité (appelé lors des CRUD)
   */
  async updateAssetUsage(
    entityType: string,
    entityId: string,
    assetMappings: { field_name: string; asset_ids: string[] }[]
  ): Promise<void> {
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      // Transaction pour cohérence
      await db.execute({
        sql: 'BEGIN TRANSACTION',
        args: []
      })

      try {
        // Supprimer tous les usages existants pour cette entité
        await db.execute({
          sql: 'DELETE FROM asset_usages WHERE entity_type = ? AND entity_id = ?',
          args: [entityType, entityId]
        })

        // Créer les nouveaux usages
        for (const mapping of assetMappings) {
          for (const assetId of mapping.asset_ids) {
            if (assetId) { // Vérifier que l'assetId n'est pas null/undefined
              await db.execute({
                sql: `INSERT INTO asset_usages (id, asset_id, entity_type, entity_id, field_name, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [
                  this.generateUsageId(),
                  assetId,
                  entityType,
                  entityId,
                  mapping.field_name,
                  new Date().toISOString(),
                  new Date().toISOString()
                ]
              })
            }
          }
        }

        // Commit de la transaction
        await db.execute({
          sql: 'COMMIT',
          args: []
        })

        console.log(`✅ Usages d'assets mis à jour pour ${entityType} ${entityId}`)
      } catch (error) {
        // Rollback en cas d'erreur
        await db.execute({
          sql: 'ROLLBACK',
          args: []
        })
        throw error
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour usage assets pour ${entityType} ${entityId}:`, error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour des usages d\'assets'
      })
    }
  }

  /**
   * Mapping d'une row de base de données vers un objet Asset
   */
  private mapRowToAsset(row: any): Asset {
    return {
      id: row.id,
      public_id: row.public_id,
      secure_url: row.secure_url,
      url: row.url,
      format: row.format,
      resource_type: row.resource_type,
      bytes: Number(row.bytes),
      width: row.width ? Number(row.width) : undefined,
      height: row.height ? Number(row.height) : undefined,
      alt_text: row.alt_text,
      caption: row.caption,
      tags: row.tags ? JSON.parse(row.tags) : [],
      folder: row.folder,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_deleted: Boolean(row.is_deleted)
    }
  }
}

// Export du singleton
// Domain interfaces for realisation deletion strategies
interface IRealisationDeletionStrategy {
  delete(realisationId: string): Promise<void>
  canHandle(source: string): boolean
}

// =====================================================
// CLOUDINARY DELETION STRATEGY PATTERN (Extension SOLID)
// =====================================================

/**
 * Interface pour les stratégies de suppression Cloudinary
 * Responsabilité unique : gestion de la suppression des assets Cloudinary
 */
interface ICloudinaryDeletionStrategy {
  delete(publicIds: string[], options?: CloudinaryDeletionOptions): Promise<CloudinaryDeletionResult>
  canHandle(source: string): boolean
}

interface CloudinaryDeletionOptions {
  invalidate?: boolean
  resource_type?: 'image' | 'video' | 'raw'
  type?: 'upload' | 'private'
  skipOnError?: boolean
}

interface CloudinaryDeletionResult {
  totalAssets: number
  successCount: number
  failureCount: number
  invalidationRequested: boolean
  failures: Array<{publicId: string, error: string}>
  duration: number
}

/**
 * Stratégie de suppression réelle depuis Cloudinary
 * Utilisée pour les réalisations que l'on souhaite supprimer définitivement
 */
class CloudinaryRealDeletionStrategy implements ICloudinaryDeletionStrategy {
  
  async delete(publicIds: string[], options: CloudinaryDeletionOptions = {}): Promise<CloudinaryDeletionResult> {
    const startTime = Date.now()
    const invalidationRequested = options.invalidate !== false // true par défaut
    
    if (publicIds.length === 0) {
      console.log('⚠️ Aucun publicId Cloudinary à supprimer')
      return {
        totalAssets: 0,
        successCount: 0,
        failureCount: 0,
        invalidationRequested,
        failures: [],
        duration: Date.now() - startTime
      }
    }

    console.log(`🗑️ Début suppression Cloudinary: ${publicIds.length} assets (invalidate: ${invalidationRequested})`)
    
    const results: Array<{publicId: string, success: boolean, error?: string}> = []
    
    // Suppression séquentielle pour éviter la surcharge de l'API Cloudinary
    for (const publicId of publicIds) {
      try {
        const result = await cloudinaryService.deleteAsset(publicId, {
          invalidate: invalidationRequested,
          resource_type: options.resource_type || 'image',
          type: options.type || 'upload'
        })
        
        results.push({
          publicId,
          success: result.success
        })
        
        if (result.success) {
          console.log(`✅ Asset Cloudinary supprimé: ${publicId}`)
        } else {
          console.warn(`⚠️ Échec suppression Cloudinary: ${publicId} - ${result.result}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          publicId,
          success: false,
          error: errorMessage
        })
        console.error(`❌ Erreur suppression Cloudinary: ${publicId}`, error)
        
        // Si skipOnError est false, on peut décider d'arrêter le processus
        if (!options.skipOnError) {
          // Pour l'instant, on continue même en cas d'erreur pour éviter de bloquer
          // la suppression des autres assets
        }
      }
    }

    // Calcul des métriques finales
    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount
    const failures = results
      .filter(r => !r.success)
      .map(r => ({ publicId: r.publicId, error: r.error || 'unknown' }))
    
    const duration = Date.now() - startTime
    
    // Logging des résultats avec métriques détaillées
    if (failureCount > 0) {
      const failureDetails = failures.map(f => `${f.publicId}: ${f.error}`).join(', ')
      console.warn(`⚠️ Suppression Cloudinary terminée: ${successCount}/${publicIds.length} réussies, ${failureCount} échecs`)
      console.warn(`📊 Détails des échecs: ${failureDetails}`)
    } else {
      console.log(`✅ Suppression Cloudinary terminée: ${successCount}/${publicIds.length} assets supprimés avec succès`)
    }
    
    console.log(`⏱️ Durée suppression Cloudinary: ${duration}ms`)
    
    if (invalidationRequested && successCount > 0) {
      console.log(`🔄 Invalidation CDN demandée pour ${successCount} assets - propagation en cours...`)
    }

    return {
      totalAssets: publicIds.length,
      successCount,
      failureCount,
      invalidationRequested,
      failures,
      duration
    }
  }

  canHandle(source: string): boolean {
    // Cette stratégie peut gérer toutes les sources
    return true
  }
}

/**
 * Stratégie no-op pour Cloudinary
 * Utilisée quand on ne souhaite pas supprimer depuis Cloudinary
 */
class CloudinaryNoOpStrategy implements ICloudinaryDeletionStrategy {
  
  async delete(publicIds: string[], options: CloudinaryDeletionOptions = {}): Promise<CloudinaryDeletionResult> {
    const startTime = Date.now()
    console.log(`ℹ️ Suppression Cloudinary ignorée pour ${publicIds.length} assets (stratégie no-op)`)
    
    return {
      totalAssets: publicIds.length,
      successCount: 0,
      failureCount: 0,
      invalidationRequested: options.invalidate !== false,
      failures: [],
      duration: Date.now() - startTime
    }
  }

  canHandle(source: string): boolean {
    // Cette stratégie peut tout gérer en mode no-op
    return true
  }
}

/**
 * Factory pour les stratégies de suppression Cloudinary
 * Responsabilité unique : création des stratégies selon les besoins
 */
class CloudinaryDeletionStrategyFactory {
  
  getStrategy(deleteFromCloudinary: boolean): ICloudinaryDeletionStrategy {
    if (deleteFromCloudinary) {
      return new CloudinaryRealDeletionStrategy()
    }
    return new CloudinaryNoOpStrategy()
  }
}

class SoftDeleteRealisationStrategy implements IRealisationDeletionStrategy {
  constructor(private db: any) {}

  canHandle(source: string): boolean {
    return source === 'cloudinary-auto-discovery'
  }

  async delete(realisationId: string): Promise<void> {
    await this.db.execute({
      sql: 'UPDATE realisations SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [realisationId]
    })
  }
}

class HardDeleteRealisationStrategy implements IRealisationDeletionStrategy {
  constructor(private db: any) {}

  canHandle(source: string): boolean {
    return source !== 'cloudinary-auto-discovery'
  }

  async delete(realisationId: string): Promise<void> {
    await this.db.execute({
      sql: 'DELETE FROM realisations WHERE id = ?',
      args: [realisationId]
    })
  }
}

class RealisationDeletionStrategyFactory {
  private strategies: IRealisationDeletionStrategy[] = []

  constructor(db: any) {
    this.strategies.push(
      new SoftDeleteRealisationStrategy(db),
      new HardDeleteRealisationStrategy(db)
    )
  }

  getStrategy(source: string): IRealisationDeletionStrategy {
    const strategy = this.strategies.find(s => s.canHandle(source))
    if (!strategy) {
      throw new Error(`No deletion strategy found for source: ${source}`)
    }
    return strategy
  }
}

class RealisationService {
  private deletionFactory: RealisationDeletionStrategyFactory
  private cloudinaryFactory: CloudinaryDeletionStrategyFactory

  constructor(private db: any) {
    this.deletionFactory = new RealisationDeletionStrategyFactory(db)
    this.cloudinaryFactory = new CloudinaryDeletionStrategyFactory()
  }

  /**
   * Suppression orchestrée d'une réalisation (DB + Cloudinary optionnel)
   * Architecture SOLID : séparation des responsabilités via Strategy Pattern
   */
  async deleteRealisation(
    realisationId: string,
    source: string,
    options: {
      deleteFromCloudinary?: boolean
      publicIds?: string[]
      invalidate?: boolean
    } = {}
  ): Promise<void> {
    const { deleteFromCloudinary = false, publicIds = [], invalidate = true } = options

    console.log(`🎨 Suppression réalisation ${realisationId} (source: ${source}, cloudinary: ${deleteFromCloudinary})`)

    // ========================================
    // PHASE 1: Suppression Cloudinary (avant DB pour récupération des publicIds)
    // ========================================
    if (deleteFromCloudinary && publicIds.length > 0) {
      console.log(`☁️ Phase 1: Suppression Cloudinary de ${publicIds.length} assets`)
      
      try {
        const cloudinaryStrategy = this.cloudinaryFactory.getStrategy(deleteFromCloudinary)
        const result = await cloudinaryStrategy.delete(publicIds, {
          invalidate,
          resource_type: 'image',
          skipOnError: false
        })
        
        console.log(`✅ Phase 1 terminée: Suppression Cloudinary`)
        console.log(`📊 Métriques Cloudinary: ${result.successCount}/${result.totalAssets} réussies, durée: ${result.duration}ms`)
        
        if (result.invalidationRequested) {
          console.log(`🔄 Invalidation CDN activée pour ${result.successCount} assets`)
        }
        
        if (result.failureCount > 0) {
          console.warn(`⚠️ ${result.failureCount} échecs Cloudinary:`, result.failures)
        }
        
      } catch (cloudinaryError) {
        console.error('❌ Erreur Phase 1 (Cloudinary):', cloudinaryError)
        
        // On continue avec la suppression DB même si Cloudinary échoue
        // Les assets orphelins pourront être nettoyés manuellement
        console.warn('⚠️ Poursuite de la suppression DB malgré l\'échec Cloudinary')
      }
    }

    // ========================================
    // PHASE 2: Suppression/Désactivation base de données
    // ========================================
    console.log(`💾 Phase 2: Traitement base de données (source: ${source})`)

    // Pour les réalisations auto-discovery, ajouter à la blacklist au lieu de supprimer de la DB
    if (source === 'cloudinary-auto-discovery') {
      console.log(`ℹ️ Réalisation auto-discovery: ${realisationId} - Ajout à la blacklist`)
      
      try {
        // Récupérer le public_id depuis realisationId pour auto-discovery
        const publicId = realisationId.startsWith('auto-') ? realisationId.substring(5) : realisationId
        
        // Ajouter à la blacklist pour éviter la re-découverte
        await this.addToBlacklist(
          publicId,
          `Auto-discovery supprimée: ${publicId}`,
          'user_deleted_auto_discovery',
          'admin'
        )
        
        console.log(`🚫 Ajouté à la blacklist: ${publicId}`)
      } catch (blacklistError) {
        console.error('❌ Erreur ajout blacklist:', blacklistError)
        throw blacklistError
      }
      
      if (deleteFromCloudinary) {
        console.log(`✅ Suppression complète de la réalisation auto-discovery: ${realisationId}`)
      } else {
        console.log(`✅ Réalisation auto-discovery blacklistée: ${realisationId}`)
      }
      return
    }

    // Pour les réalisations Turso, appliquer la stratégie DB appropriée
    try {
      const dbStrategy = this.deletionFactory.getStrategy(source)
      await dbStrategy.delete(realisationId)
      console.log(`✅ Phase 2 terminée: Suppression DB`)
    } catch (dbError) {
      console.error('❌ Erreur Phase 2 (DB):', dbError)
      throw dbError // On throw l'erreur DB car c'est critique
    }

    console.log(`🎉 Suppression orchestrée terminée: ${realisationId}`)
  }

  /**
   * Obtenir la liste des éléments blacklistés
   */
  /**
   * Ajouter une réalisation à la blacklist pour éviter sa re-découverte automatique
   * Utilisé principalement pour les réalisations auto-discovery supprimées
   */
  async addToBlacklist(
    publicId: string,
    originalTitle?: string,
    reason: string = 'user_deleted',
    blacklistedBy: string = 'admin'
  ): Promise<void> {
    try {
      console.log(`🚫 Ajout à la blacklist: ${publicId}`)
      
      await this.db.execute(`
        INSERT OR REPLACE INTO realisation_blacklist 
        (public_id, original_title, reason, blacklisted_by, blacklisted_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [publicId, originalTitle, reason, blacklistedBy])
      
      console.log(`✅ Blacklist mise à jour: ${publicId}`)
    } catch (error) {
      console.error('❌ Erreur ajout blacklist:', error)
      throw error
    }
  }

  /**
   * Retirer une réalisation de la blacklist
   */
  async removeFromBlacklist(publicId: string): Promise<void> {
    try {
      console.log(`🔓 Retrait de la blacklist: ${publicId}`)
      
      const result = await this.db.execute(
        'DELETE FROM realisation_blacklist WHERE public_id = ?',
        [publicId]
      )
      
      if (result.rowsAffected > 0) {
        console.log(`✅ Retiré de la blacklist: ${publicId}`)
      } else {
        console.log(`ℹ️ Non trouvé dans la blacklist: ${publicId}`)
      }
    } catch (error) {
      console.error('❌ Erreur retrait blacklist:', error)
      throw error
    }
  }

  async getBlacklistedItems(): Promise<any[]> {
    try {
      const result = await this.db.execute(`
        SELECT public_id, original_title, reason, blacklisted_at, blacklisted_by
        FROM realisation_blacklist
        ORDER BY blacklisted_at DESC
      `)
      
      return result.rows || []
    } catch (error) {
      console.error('❌ Erreur récupération blacklist:', error)
      throw error
    }
  }
}

// Export du service de réalisation SOLID
export { RealisationService }
export const assetService = AssetService.getInstance()

// Export des types pour utilisation externe
export type {
  Asset,
  CreateAssetData,
  UpdateAssetData,
  AssetFilters,
  PaginationOptions,
  AssetUsage,
  AssetUsageDetail
}