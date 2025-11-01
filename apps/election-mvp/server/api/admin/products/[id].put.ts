/**
 * API Route: PUT /api/admin/products/:id
 * Mise à jour d'un produit avec schéma normalisé
 *
 * MIGRATION POST-002:
 * - Utilise updateProductWithRelations() pour materials/colors/sizes
 * - Synchronisation manuelle FTS avec updateProductFTS()
 * - Validation Zod stricte des données entrantes
 */

import { z } from 'zod'
import { getDatabase } from '../../../utils/database'
import {
  getProductWithRelations,
  updateProductWithRelations,
  updateProductFTS
} from '../../../utils/db-queries'

// Schéma de validation pour update produit
const UpdateProductSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  subcategory: z.string().max(100).optional(),
  basePrice: z.number().int().positive().optional(),
  minQuantity: z.number().int().positive().optional(),
  maxQuantity: z.number().int().positive().optional(),
  image: z.string().url().optional(),
  isActive: z.boolean().optional(),

  // Relations normalisées
  materials: z.array(z.string()).optional(),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
  })).optional(),
  sizes: z.array(z.object({
    name: z.string(),
    category: z.enum(['XS-XL', 'numeric', 'custom']).optional()
  })).optional(),
  gallery: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['main', 'variant', 'detail']).optional()
  })).optional(),
  tags: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const productId = getRouterParam(event, 'id')

  if (!productId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID produit requis'
    })
  }

  try {
    const tursoClient = getDatabase()
    if (!tursoClient) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Base de données indisponible'
      })
    }

    // 1. Validation du body
    const body = await readBody(event)
    const validatedData = UpdateProductSchema.parse(body)

    console.log(`📝 Mise à jour produit ${productId}...`)

    // 2. Vérifier existence produit
    const existingProduct = await getProductWithRelations(tursoClient, productId)
    if (!existingProduct) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }

    // 3. Préparer les statements SQL pour mise à jour
    const updateStatements: Array<{ sql: string; args: any[] }> = []

    // Mise à jour champs principaux (si fournis)
    const mainFields = []
    const mainValues = []

    if (validatedData.name !== undefined) {
      mainFields.push('name = ?')
      mainValues.push(validatedData.name)
    }
    if (validatedData.description !== undefined) {
      mainFields.push('description = ?')
      mainValues.push(validatedData.description)
    }
    if (validatedData.category !== undefined) {
      mainFields.push('category = ?')
      mainValues.push(validatedData.category)
    }
    if (validatedData.subcategory !== undefined) {
      mainFields.push('subcategory = ?')
      mainValues.push(validatedData.subcategory)
    }
    if (validatedData.basePrice !== undefined) {
      mainFields.push('base_price = ?')
      mainValues.push(validatedData.basePrice)
    }
    if (validatedData.minQuantity !== undefined) {
      mainFields.push('min_quantity = ?')
      mainValues.push(validatedData.minQuantity)
    }
    if (validatedData.maxQuantity !== undefined) {
      mainFields.push('max_quantity = ?')
      mainValues.push(validatedData.maxQuantity)
    }
    if (validatedData.image !== undefined) {
      mainFields.push('image = ?')
      mainValues.push(validatedData.image)
    }
    if (validatedData.isActive !== undefined) {
      mainFields.push('is_active = ?')
      mainValues.push(validatedData.isActive ? 1 : 0)
    }

    // Ajouter updated_at
    mainFields.push('updated_at = ?')
    mainValues.push(new Date().toISOString())

    // Exécuter update champs principaux si présents
    if (mainFields.length > 1) { // > 1 car updated_at est toujours présent
      updateStatements.push({
        sql: `UPDATE products SET ${mainFields.join(', ')} WHERE id = ?`,
        args: [...mainValues, productId]
      })
    }

    // 4. Mise à jour relations normalisées (si fournies)
    if (validatedData.materials || validatedData.colors || validatedData.sizes) {
      await updateProductWithRelations(tursoClient, productId, {
        materials: validatedData.materials,
        colors: validatedData.colors as Array<{ name: string; hex?: string }> | undefined,
        sizes: validatedData.sizes as Array<{ name: string; category?: string }> | undefined
      })
    }

    // 5. Mise à jour FTS si champs textuels modifiés
    if (validatedData.name || validatedData.description || validatedData.category || validatedData.subcategory) {
      await updateProductFTS(tursoClient, productId, {
        name: validatedData.name || existingProduct.name,
        description: validatedData.description || existingProduct.description || '',
        category: validatedData.category || existingProduct.category,
        subcategory: validatedData.subcategory || existingProduct.subcategory || ''
      })
    }

    // 6. Exécuter mise à jour champs principaux
    if (updateStatements.length > 0) {
      await tursoClient.batch(updateStatements, 'write')
    }

    // 7. Récupérer produit mis à jour
    const updatedProduct = await getProductWithRelations(tursoClient, productId)

    const duration = Date.now() - startTime
    console.log(`✅ Produit ${productId} mis à jour en ${duration}ms`)

    return {
      success: true,
      data: updatedProduct,
      source: 'turso-normalized',
      duration
    }

  } catch (error) {
    console.error(`❌ Erreur mise à jour produit ${productId}:`, error)

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: {
          errors: error.errors,
          duration: Date.now() - startTime
        }
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la mise à jour du produit',
      data: {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: Date.now() - startTime
      }
    })
  }
})
