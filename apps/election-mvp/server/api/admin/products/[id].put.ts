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
  base_price: z.number().int().positive().optional(), // ✅ snake_case pour cohérence frontend
  min_quantity: z.number().int().positive().optional(), // ✅ snake_case
  max_quantity: z.number().int().positive().optional(), // ✅ snake_case
  image: z.string().url().optional(),
  is_active: z.boolean().optional(), // ✅ snake_case

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

    // 3. Mise à jour champs principaux (EXÉCUTION IMMÉDIATE)
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
    if (validatedData.base_price !== undefined) {
      mainFields.push('base_price = ?')
      mainValues.push(validatedData.base_price)
      console.log(`🔧 [DEBUG] Updating base_price to:`, validatedData.base_price)
    }
    if (validatedData.min_quantity !== undefined) {
      mainFields.push('min_quantity = ?')
      mainValues.push(validatedData.min_quantity)
    }
    if (validatedData.max_quantity !== undefined) {
      mainFields.push('max_quantity = ?')
      mainValues.push(validatedData.max_quantity)
    }
    if (validatedData.image !== undefined) {
      mainFields.push('image = ?')
      mainValues.push(validatedData.image)
    }
    if (validatedData.is_active !== undefined) {
      mainFields.push('is_active = ?')
      mainValues.push(validatedData.is_active ? 1 : 0)
    }

    // Ajouter updated_at
    mainFields.push('updated_at = ?')
    mainValues.push(new Date().toISOString())

    // 4. EXÉCUTER UPDATE CHAMPS PRINCIPAUX EN PREMIER (FIX CRITIQUE)
    let rowsAffected = 0
    if (mainFields.length > 1) { // > 1 car updated_at est toujours présent
      console.log(`📝 [DEBUG] Executing UPDATE with fields:`, mainFields.join(', '))

      const updateResult = await tursoClient.execute({
        sql: `UPDATE products SET ${mainFields.join(', ')} WHERE id = ?`,
        args: [...mainValues, productId]
      })

      rowsAffected = updateResult.rowsAffected || 0
      console.log(`✅ [DEBUG] UPDATE executed - rowsAffected:`, rowsAffected)

      // Vérification critique recommandée par Perplexity
      if (rowsAffected === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Produit non trouvé ou aucune modification détectée'
        })
      }
    }

    // 5. Mise à jour relations normalisées (APRÈS l'UPDATE principal)
    if (validatedData.materials || validatedData.colors || validatedData.sizes) {
      await updateProductWithRelations(tursoClient, productId, {
        materials: validatedData.materials,
        colors: validatedData.colors as Array<{ name: string; hex?: string }> | undefined,
        sizes: validatedData.sizes as Array<{ name: string; category?: string }> | undefined
      })
    }

    // 6. Récupérer produit mis à jour (APRÈS toutes les écritures)
    const updatedProduct = await getProductWithRelations(tursoClient, productId)

    // 7. Mise à jour FTS (APRÈS lecture du produit complet)
    if (validatedData.name || validatedData.description || validatedData.category || validatedData.subcategory) {
      await updateProductFTS(tursoClient, productId, {
        name: updatedProduct.name,
        description: updatedProduct.description || '',
        category: updatedProduct.category,
        subcategory: updatedProduct.subcategory || ''
      })
    }

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
