/**
 * API Route: PUT /api/products/[id]
 * Met à jour un produit existant avec la stratégie Turso-first
 */

import { getDatabase } from "~/server/utils/database"
import { z } from "zod"

// Schéma de validation pour mise à jour de produit
const updateProductSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères").optional(),
  description: z.string().optional(),
  category: z.string().min(1, "La catégorie est requise").optional(),
  subcategory: z.string().optional(),
  base_price: z.number().min(0, "Le prix doit être positif").optional(),
  min_quantity: z.number().min(1, "La quantité minimale doit être au moins 1").optional(),
  max_quantity: z.number().min(1, "La quantité maximale doit être au moins 1").optional(),
  unit: z.string().optional(),
  production_time_days: z.number().min(1, "Le délai de production doit être au moins 1 jour").optional(),
  customizable: z.boolean().optional(),
  materials: z.string().optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  image_url: z.string().url().optional(),
  gallery_urls: z.array(z.string().url()).optional(),
  specifications: z.string().optional(),
  is_active: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    const productId = getRouterParam(event, 'id')
    console.log(`📦 PUT /api/products/${productId} - Mise à jour produit`)

    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du produit requis'
      })
    }

    // Validation du body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = updateProductSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Données invalides',
          data: {
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        })
      }
      throw error
    }

    // Accès à la base de données
    const db = getDatabase()
    if (!db) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le produit existe
    const existingProduct = await db.execute({
      sql: 'SELECT id, name FROM products WHERE id = ?',
      args: [productId]
    })

    if (existingProduct.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Produit non trouvé'
      })
    }

    try {
      // Construire la requête UPDATE dynamiquement
      const updateFields = []
      const updateArgs = []

      if (validatedData.name !== undefined) {
        updateFields.push('name = ?')
        updateArgs.push(validatedData.name)
      }

      if (validatedData.description !== undefined) {
        updateFields.push('description = ?')
        updateArgs.push(validatedData.description)
      }

      if (validatedData.category !== undefined) {
        updateFields.push('category = ?')
        updateArgs.push(validatedData.category)
      }

      if (validatedData.subcategory !== undefined) {
        updateFields.push('subcategory = ?')
        updateArgs.push(validatedData.subcategory)
      }

      if (validatedData.base_price !== undefined) {
        updateFields.push('base_price = ?')
        updateArgs.push(validatedData.base_price)
      }

      if (validatedData.min_quantity !== undefined) {
        updateFields.push('min_quantity = ?')
        updateArgs.push(validatedData.min_quantity)
      }

      if (validatedData.max_quantity !== undefined) {
        updateFields.push('max_quantity = ?')
        updateArgs.push(validatedData.max_quantity)
      }

      if (validatedData.unit !== undefined) {
        updateFields.push('unit = ?')
        updateArgs.push(validatedData.unit)
      }

      if (validatedData.production_time_days !== undefined) {
        updateFields.push('production_time_days = ?')
        updateArgs.push(validatedData.production_time_days)
      }

      if (validatedData.customizable !== undefined) {
        updateFields.push('customizable = ?')
        updateArgs.push(validatedData.customizable ? 1 : 0)
      }

      if (validatedData.materials !== undefined) {
        updateFields.push('materials = ?')
        updateArgs.push(validatedData.materials)
      }

      if (validatedData.colors !== undefined) {
        updateFields.push('colors = ?')
        updateArgs.push(JSON.stringify(validatedData.colors))
      }

      if (validatedData.sizes !== undefined) {
        updateFields.push('sizes = ?')
        updateArgs.push(JSON.stringify(validatedData.sizes))
      }

      if (validatedData.image_url !== undefined) {
        updateFields.push('image_url = ?')
        updateArgs.push(validatedData.image_url)
      }

      if (validatedData.gallery_urls !== undefined) {
        updateFields.push('gallery_urls = ?')
        updateArgs.push(JSON.stringify(validatedData.gallery_urls))
      }

      if (validatedData.specifications !== undefined) {
        updateFields.push('specifications = ?')
        updateArgs.push(validatedData.specifications)
      }

      if (validatedData.is_active !== undefined) {
        updateFields.push('is_active = ?')
        updateArgs.push(validatedData.is_active ? 1 : 0)
      }

      // Toujours mettre à jour updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP')

      if (updateFields.length > 1) { // Plus que juste updated_at
        updateArgs.push(productId) // Pour la clause WHERE
        const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`

        await db.execute({
          sql,
          args: updateArgs
        })
      }

      console.log(`✅ Produit mis à jour avec succès: ${productId}`)

      // Récupérer le produit mis à jour
      const updatedProductResult = await db.execute({
        sql: `SELECT
          id, name, description, category, subcategory,
          base_price as basePrice, min_quantity as minQuantity,
          max_quantity as maxQuantity, unit, production_time_days,
          customizable, materials, colors, sizes,
          image_url as image, gallery_urls, specifications,
          is_active as isActive, created_at as createdAt, updated_at as updatedAt
        FROM products WHERE id = ?`,
        args: [productId]
      })

      if (updatedProductResult.rows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Produit non trouvé après mise à jour'
        })
      }

      const productData = updatedProductResult.rows[0] as any

      const product = {
        id: productData.id,
        name: productData.name,
        description: productData.description || '',
        category: productData.category,
        subcategory: productData.subcategory,
        basePrice: Number(productData.basePrice),
        minQuantity: Number(productData.minQuantity),
        maxQuantity: Number(productData.maxQuantity),
        unit: productData.unit,
        productionTimeDays: Number(productData.production_time_days),
        customizable: Boolean(productData.customizable),
        materials: productData.materials,
        colors: productData.colors ? JSON.parse(productData.colors) : [],
        sizes: productData.sizes ? JSON.parse(productData.sizes) : [],
        image: productData.image,
        galleryUrls: productData.gallery_urls ? JSON.parse(productData.gallery_urls) : [],
        specifications: productData.specifications,
        tags: [productData.category?.toLowerCase(), productData.subcategory?.toLowerCase()].filter(Boolean),
        isActive: Boolean(productData.isActive),
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt
      }

      const response = {
        success: true,
        data: product,
        message: `Produit "${product.name}" mis à jour avec succès`,
        source: 'turso',
        duration: Date.now() - startTime
      }

      // Cache headers
      setHeader(event, "Cache-Control", "no-cache")

      return response

    } catch (dbError) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour du produit',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error(`❌ Erreur PUT /api/products/${getRouterParam(event, 'id')}:`, error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})