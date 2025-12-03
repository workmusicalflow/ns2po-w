/**
 * API Route: PUT /api/admin/products/:id
 * Mise à jour d'un produit avec schéma normalisé
 *
 * MIGRATION POST-002:
 * - Utilise updateProductWithRelations() pour materials/colors/sizes
 * - Synchronisation manuelle FTS avec updateProductFTS()
 * - Validation Zod stricte des données entrantes
 *
 * ANTI-CORRUPTION LAYER (2025-12-02):
 * - Accepte camelCase OU snake_case grâce à z.preprocess()
 * - Transformation automatique vers snake_case avant validation
 * - Frontend peut utiliser sa convention Vue.js (camelCase)
 */

import { z } from 'zod'
import { getDatabase } from '../../../utils/database'
import {
  getProductWithRelations,
  updateProductWithRelations,
  updateProductFTS
} from '../../../utils/db-queries'
import { invalidateProductRelatedCaches } from '../../../utils/cache-invalidation'
import { createSnakeCasePreprocess } from '../../../utils/caseConverter'

// Schéma de validation interne (snake_case - convention BDD)
const ProductSchemaInternal = z.object({
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
  // ⭐ FIX: Accept BOTH strings (legacy) and objects (new format)
  colors: z.array(z.union([
    z.string(), // Legacy format: "Rouge"
    z.object({   // New format: {name: "Rouge", hex: "#FF0000"}
      name: z.string(),
      hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
    })
  ])).optional(),
  sizes: z.array(z.union([
    z.string(), // Legacy format: "M"
    z.object({   // New format: {name: "M", category: "XS-XL"}
      name: z.string(),
      category: z.enum(['XS-XL', 'numeric', 'custom']).optional()
    })
  ])).optional(),
  gallery: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['main', 'variant', 'detail']).optional()
  })).optional(),
  tags: z.array(z.string()).optional()
})

// 🔄 ANTI-CORRUPTION LAYER: Accepte camelCase (frontend Vue.js) → snake_case (BDD)
// Le frontend peut envoyer basePrice, minQuantity, etc. → transformé en base_price, min_quantity
const UpdateProductSchema = z.preprocess(
  createSnakeCasePreprocess(),
  ProductSchemaInternal
)

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const productId = getRouterParam(event, 'id')

  console.log(`➡️ [API PUT] Début du handler pour produit ID: ${productId}`)

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

    console.log(`➡️ [API PUT] Tentative de mise à jour en BDD pour ID: ${productId}`, validatedData)

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
      mainFields.push('image_url = ?')  // ✅ FIX: Colonne BDD = image_url, pas image
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
      // ⭐ NORMALISATION: Convertir strings → objects pour updateProductWithRelations()
      const normalizedColors = validatedData.colors?.map(color =>
        typeof color === 'string' ? { name: color } : color
      )
      const normalizedSizes = validatedData.sizes?.map(size =>
        typeof size === 'string' ? { name: size } : size
      )

      await updateProductWithRelations(tursoClient, productId, {
        materials: validatedData.materials,
        colors: normalizedColors,
        sizes: normalizedSizes
      })
    }

    // 5b. Mise à jour gallery (stratégie delete-then-insert pour éviter duplications)
    if (validatedData.gallery !== undefined) {
      // Supprimer TOUTES les anciennes images de gallery pour ce produit
      await tursoClient.execute({
        sql: 'DELETE FROM product_gallery WHERE product_id = ?',
        args: [productId]
      })
      console.log(`🗑️ [API PUT] Anciennes images gallery supprimées pour ${productId}`)

      // Insérer les nouvelles images de gallery (si présentes)
      if (validatedData.gallery.length > 0) {
        const galleryStatements = validatedData.gallery.map((item, index) => ({
          sql: `INSERT INTO product_gallery (id, product_id, image_url, image_type, display_order, is_active)
                VALUES (?, ?, ?, ?, ?, 1)`,
          args: [
            `gal_${Date.now()}_${index}`,
            productId,
            item.url,
            item.type || 'variant',
            index
          ]
        }))
        await tursoClient.batch(galleryStatements, 'write')
        console.log(`✅ [API PUT] ${validatedData.gallery.length} images gallery insérées pour ${productId}`)
      }
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
    console.log(`✅ [API PUT] Mise à jour BDD réussie. Produit ${productId} mis à jour en ${duration}ms`, {
      updatedProduct: updatedProduct.id,
      basePrice: updatedProduct.basePrice
    })

    // ⭐ INVALIDATION CACHE REDIS + BUNDLES (architecture unifiée)
    try {
      await invalidateProductRelatedCaches(`PUT /api/admin/products/${productId}`)
    } catch (cacheError) {
      console.error(`❌ [PUT PRODUCT] ÉCHEC CRITIQUE invalidation cache:`, cacheError)
      console.error('❌ [PUT PRODUCT] WARNING: Désynchronisation admin/public possible!')
      // Ne pas bloquer la requête PUT, mais alerter fortement
    }

    console.log(`✅ [API PUT] Fin du handler, renvoi de la réponse pour produit ${productId}`)

    return {
      success: true,
      data: updatedProduct,
      source: 'turso-normalized',
      duration
    }

  } catch (error) {
    console.error(`❌ [API PUT] Erreur fatale dans le handler PUT pour produit ${productId}:`, error)

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      console.error(`❌ [API PUT] Erreur de validation Zod:`, error.errors)
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
