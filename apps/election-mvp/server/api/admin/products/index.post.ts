/**
 * API Route: POST /api/admin/products
 * Création d'un nouveau produit avec schéma normalisé
 *
 * MIGRATION POST-002:
 * - INSERT dans table products
 * - INSERT dans tables normalisées (materials/colors/sizes/gallery/tags)
 * - Synchronisation FTS automatique via updateProductFTS()
 * - Validation Zod stricte
 */

import { z } from 'zod'
import { getDatabase } from '../../../utils/database'
import {
  getProductWithRelations,
  updateProductWithRelations,
  updateProductFTS
} from '../../../utils/db-queries'

// Schéma de validation pour création produit
const CreateProductSchema = z.object({
  // Champs obligatoires
  name: z.string().min(3, 'Nom requis (min 3 caractères)').max(255),
  category: z.string().min(2, 'Catégorie requise').max(100),
  basePrice: z.number().int().positive('Prix doit être positif'),
  minQuantity: z.number().int().positive('Quantité min doit être positive'),

  // Champs optionnels
  description: z.string().max(2000).optional(),
  subcategory: z.string().max(100).optional(),
  maxQuantity: z.number().int().positive().optional(),
  image: z.string().url('URL image invalide').optional(),
  isActive: z.boolean().default(true),

  // Relations normalisées
  materials: z.array(z.string()).min(1, 'Au moins un matériau requis'),
  colors: z.array(z.object({
    name: z.string(),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format hex invalide').optional()
  })).min(1, 'Au moins une couleur requise'),
  sizes: z.array(z.object({
    name: z.string(),
    category: z.enum(['XS-XL', 'numeric', 'custom']).optional()
  })).min(1, 'Au moins une taille requise'),
  gallery: z.array(z.object({
    url: z.string().url(),
    type: z.enum(['main', 'variant', 'detail']).optional()
  })).optional(),
  tags: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  console.log(`➡️ [API POST] Début du handler pour créer un nouveau produit`)

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
    const validatedData = CreateProductSchema.parse(body)

    // 2. Générer ID produit
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const now = new Date().toISOString()

    console.log(`➡️ [API POST] Tentative de création produit ${productId} - ${validatedData.name}...`)

    // 3. Préparer statements pour insertion batch
    const insertStatements: Array<{ sql: string; args: any[] }> = []

    // INSERT produit principal
    insertStatements.push({
      sql: `INSERT INTO products (
        id, name, description, category, subcategory,
        base_price, min_quantity, max_quantity,
        image, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        productId,
        validatedData.name,
        validatedData.description || '',
        validatedData.category,
        validatedData.subcategory || '',
        validatedData.basePrice,
        validatedData.minQuantity,
        validatedData.maxQuantity || validatedData.minQuantity * 10,
        validatedData.image || null,
        validatedData.isActive ? 1 : 0,
        now,
        now
      ]
    })

    // 4. Exécuter insertion produit principal
    await tursoClient.batch(insertStatements, 'write')

    // 5. Insérer relations normalisées
    await updateProductWithRelations(tursoClient, productId, {
      materials: validatedData.materials,
      colors: validatedData.colors as Array<{ name: string; hex?: string }>,
      sizes: validatedData.sizes as Array<{ name: string; category?: string }>
    })

    // 6. Insérer gallery si fournie
    if (validatedData.gallery && validatedData.gallery.length > 0) {
      const galleryStatements = validatedData.gallery.map((item, index) => ({
        sql: `INSERT INTO product_gallery (id, product_id, image_url, image_type, display_order)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          `gal_${Date.now()}_${index}`,
          productId,
          item.url,
          item.type || 'variant',
          index
        ]
      }))
      await tursoClient.batch(galleryStatements, 'write')
    }

    // 7. Insérer tags si fournis
    if (validatedData.tags && validatedData.tags.length > 0) {
      const tagStatements = validatedData.tags.map((tag, index) => ({
        sql: `INSERT INTO product_tags (id, product_id, tag_name, tag_type)
              VALUES (?, ?, ?, ?)`,
        args: [
          `tag_${Date.now()}_${index}`,
          productId,
          tag,
          'category' // type par défaut
        ]
      }))
      await tursoClient.batch(tagStatements, 'write')
    }

    // 8. Synchronisation FTS
    await updateProductFTS(tursoClient, productId, {
      name: validatedData.name,
      description: validatedData.description || '',
      category: validatedData.category,
      subcategory: validatedData.subcategory || ''
    })

    // 9. Récupérer produit complet créé
    const createdProduct = await getProductWithRelations(tursoClient, productId)

    const duration = Date.now() - startTime
    console.log(`✅ [API POST] Création BDD réussie. Produit ${productId} créé en ${duration}ms`, {
      createdProduct: createdProduct.id,
      name: createdProduct.name
    })

    // ⭐ INVALIDATION CACHE NITRO: Force le refetch de la liste produits
    try {
      console.log(`➡️ [API POST] Tentative d'invalidation du cache Nitro...`)
      await useStorage('cache').removeItem('products:list:active')
      console.log('🗑️ [API POST] Cache Nitro invalidé après CREATE produit')
    } catch (cacheError) {
      console.warn('⚠️ [API POST] Échec invalidation cache (non-bloquant):', cacheError)
    }

    console.log(`✅ [API POST] Fin du handler, renvoi de la réponse pour produit ${productId}`)

    return {
      success: true,
      data: createdProduct,
      source: 'turso-normalized',
      duration
    }

  } catch (error) {
    console.error('❌ [API POST] Erreur fatale dans le handler POST:', error)

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      console.error(`❌ [API POST] Erreur de validation Zod:`, error.errors)
      throw createError({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: {
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          })),
          duration: Date.now() - startTime
        }
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création du produit',
      data: {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        duration: Date.now() - startTime
      }
    })
  }
})
