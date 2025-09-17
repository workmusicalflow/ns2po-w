/**
 * Service de synchronisation bidirectionnelle Airtable ↔ Turso
 * Centralise la logique de sync pour éviter la duplication
 */

import type { Client } from '@libsql/client'
import { airtableService } from '../../services/airtable'
import { getDatabase } from '../utils/database'

export interface SyncOptions {
  direction: 'airtable_to_turso' | 'turso_to_airtable'
  tables?: string[]
  dryRun?: boolean
  batchSize?: number
}

export interface SyncResult {
  success: boolean
  records: {
    created: number
    updated: number
    skipped: number
    errors: number
  }
  duration: number
  errors: string[]
}

export class AirtableTursoSync {
  private tursoClient: Client | null

  constructor() {
    this.tursoClient = getDatabase()
  }

  /**
   * Synchronise les données depuis Airtable vers Turso
   */
  async syncFromAirtable(options: SyncOptions = { direction: 'airtable_to_turso' }): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: false,
      records: { created: 0, updated: 0, skipped: 0, errors: 0 },
      duration: 0,
      errors: []
    }

    if (!this.tursoClient) {
      result.errors.push('Turso client not available')
      return result
    }

    try {
      console.log('🔄 Début synchronisation Airtable → Turso...')

      // Tables à synchroniser (par défaut toutes)
      const tablesToSync = options.tables || ['Products', 'Categories', 'CampaignBundles']

      for (const table of tablesToSync) {
        try {
          console.log(`📋 Synchronisation table: ${table}`)
          const tableResult = await this.syncTableFromAirtable(table, options)

          result.records.created += tableResult.records.created
          result.records.updated += tableResult.records.updated
          result.records.skipped += tableResult.records.skipped
          result.records.errors += tableResult.records.errors

          if (tableResult.errors.length > 0) {
            result.errors.push(...tableResult.errors)
          }
        } catch (error) {
          const errorMsg = `Erreur table ${table}: ${error}`
          console.error('❌', errorMsg)
          result.errors.push(errorMsg)
          result.records.errors++
        }
      }

      result.success = result.errors.length === 0
      result.duration = Date.now() - startTime

      console.log('✅ Synchronisation terminée:', {
        duration: `${result.duration}ms`,
        records: result.records,
        errors: result.errors.length
      })

      return result
    } catch (error) {
      result.errors.push(`Erreur générale: ${error}`)
      result.duration = Date.now() - startTime
      return result
    }
  }

  /**
   * Synchronise une table spécifique depuis Airtable
   */
  private async syncTableFromAirtable(tableName: string, options: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      records: { created: 0, updated: 0, skipped: 0, errors: 0 },
      duration: 0,
      errors: []
    }

    try {
      switch (tableName) {
        case 'Products':
          const products = await airtableService.getProducts()
          console.log(`📦 ${products.length} produits récupérés depuis Airtable`)

          for (const product of products) {
            try {
              if (options.dryRun) {
                console.log(`🔍 [DRY RUN] Produit: ${product.name}`)
                result.records.skipped++
                continue
              }

              const existingProduct = await this.tursoClient!.execute({
                sql: 'SELECT id FROM products WHERE airtable_id = ?',
                args: [product.id]
              })

              if (existingProduct.rows.length > 0) {
                // Mise à jour
                await this.tursoClient!.execute({
                  sql: `UPDATE products SET
                    name = ?, category = ?, base_price = ?, min_quantity = ?,
                    max_quantity = ?, description = ?, image = ?, tags = ?,
                    is_active = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE airtable_id = ?`,
                  args: [
                    product.name, product.category, product.basePrice, product.minQuantity,
                    product.maxQuantity, product.description, product.image,
                    JSON.stringify(product.tags), product.isActive, product.id
                  ]
                })
                result.records.updated++
              } else {
                // Création
                await this.tursoClient!.execute({
                  sql: `INSERT INTO products (
                    airtable_id, name, category, base_price, min_quantity,
                    max_quantity, description, image, tags, is_active,
                    created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                  args: [
                    product.id, product.name, product.category, product.basePrice,
                    product.minQuantity, product.maxQuantity, product.description,
                    product.image, JSON.stringify(product.tags), product.isActive
                  ]
                })
                result.records.created++
              }
            } catch (error) {
              result.errors.push(`Produit ${product.name}: ${error}`)
              result.records.errors++
            }
          }
          break

        case 'Categories':
          const categories = await airtableService.getCategories()
          console.log(`📂 ${categories.length} catégories récupérées depuis Airtable`)

          for (const category of categories) {
            try {
              if (options.dryRun) {
                console.log(`🔍 [DRY RUN] Catégorie: ${category.name}`)
                result.records.skipped++
                continue
              }

              const existingCategory = await this.tursoClient!.execute({
                sql: 'SELECT id FROM categories WHERE airtable_id = ?',
                args: [category.id]
              })

              if (existingCategory.rows.length > 0) {
                await this.tursoClient!.execute({
                  sql: `UPDATE categories SET
                    name = ?, description = ?, slug = ?, is_active = ?,
                    updated_at = CURRENT_TIMESTAMP WHERE airtable_id = ?`,
                  args: [category.name, category.description, category.slug, category.isActive, category.id]
                })
                result.records.updated++
              } else {
                await this.tursoClient!.execute({
                  sql: `INSERT INTO categories (
                    airtable_id, name, description, slug, is_active,
                    created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                  args: [category.id, category.name, category.description, category.slug, category.isActive]
                })
                result.records.created++
              }
            } catch (error) {
              result.errors.push(`Catégorie ${category.name}: ${error}`)
              result.records.errors++
            }
          }
          break

        case 'CampaignBundles':
          const bundles = await airtableService.getCampaignBundles()
          console.log(`📦 ${bundles.length} bundles récupérés depuis Airtable`)

          for (const bundle of bundles) {
            try {
              if (options.dryRun) {
                console.log(`🔍 [DRY RUN] Bundle: ${bundle.name}`)
                result.records.skipped++
                continue
              }

              const existingBundle = await this.tursoClient!.execute({
                sql: 'SELECT id FROM campaign_bundles WHERE airtable_id = ?',
                args: [bundle.id]
              })

              if (existingBundle.rows.length > 0) {
                await this.tursoClient!.execute({
                  sql: `UPDATE campaign_bundles SET
                    name = ?, description = ?, target_audience = ?, budget_range = ?,
                    estimated_total = ?, original_total = ?, savings = ?, popularity = ?,
                    is_active = ?, is_featured = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE airtable_id = ?`,
                  args: [
                    bundle.name, bundle.description, bundle.targetAudience, bundle.budgetRange,
                    bundle.estimatedTotal, bundle.originalTotal, bundle.savings, bundle.popularity,
                    bundle.isActive, bundle.isFeatured, JSON.stringify(bundle.tags), bundle.id
                  ]
                })
                result.records.updated++
              } else {
                await this.tursoClient!.execute({
                  sql: `INSERT INTO campaign_bundles (
                    airtable_id, name, description, target_audience, budget_range,
                    estimated_total, original_total, savings, popularity, is_active,
                    is_featured, tags, created_at, updated_at
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                  args: [
                    bundle.id, bundle.name, bundle.description, bundle.targetAudience,
                    bundle.budgetRange, bundle.estimatedTotal, bundle.originalTotal,
                    bundle.savings, bundle.popularity, bundle.isActive, bundle.isFeatured,
                    JSON.stringify(bundle.tags)
                  ]
                })
                result.records.created++
              }
            } catch (error) {
              result.errors.push(`Bundle ${bundle.name}: ${error}`)
              result.records.errors++
            }
          }
          break

        default:
          result.errors.push(`Table non supportée: ${tableName}`)
      }

      result.success = result.errors.length === 0
      return result
    } catch (error) {
      result.errors.push(`Erreur table ${tableName}: ${error}`)
      return result
    }
  }

  /**
   * Vérifie la santé de la connexion Turso
   */
  async healthCheck(): Promise<{ turso: boolean, airtable: boolean }> {
    const health = { turso: false, airtable: false }

    try {
      if (this.tursoClient) {
        await this.tursoClient.execute('SELECT 1')
        health.turso = true
      }
    } catch (error) {
      console.error('❌ Turso health check failed:', error)
    }

    try {
      await airtableService.getProducts()
      health.airtable = true
    } catch (error) {
      console.error('❌ Airtable health check failed:', error)
    }

    return health
  }
}

// Instance singleton
export const airtableTursoSync = new AirtableTursoSync()