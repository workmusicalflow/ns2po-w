/**
 * API Route: POST /api/products
 * Crée un nouveau produit avec stratégie Turso-first
 */

import { getDatabase } from "~/server/utils/database"
import { z } from "zod"

// Schéma de validation pour création de produit
const createProductSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  description: z.string().optional(),
  category: z.string().min(1, "La catégorie est requise"),
  subcategory: z.string().optional(),
  base_price: z.number().min(0, "Le prix doit être positif"),
  min_quantity: z.number().min(1, "La quantité minimale doit être au moins 1").default(1),
  max_quantity: z.number().min(1, "La quantité maximale doit être au moins 1").default(1000),
  unit: z.string().default("pièce"),
  production_time_days: z.number().min(1, "Le délai de production doit être au moins 1 jour").default(7),
  customizable: z.boolean().default(false),
  materials: z.string().optional(),
  colors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  image_url: z.string().url().optional(),
  gallery_urls: z.array(z.string().url()).default([]),
  specifications: z.string().optional(),
  is_active: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('📦 POST /api/products - Création nouveau produit')

    // Validation du body
    const body = await readBody(event)

    let validatedData
    try {
      validatedData = createProductSchema.parse(body)
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

    try {
      // Générer un ID unique pour le produit
      const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Insérer le nouveau produit
      await db.execute({
        sql: `INSERT INTO products (
          id, name, description, category, subcategory,
          base_price, min_quantity, max_quantity, unit, production_time_days,
          customizable, materials, colors, sizes,
          image_url, gallery_urls, specifications, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          productId,
          validatedData.name,
          validatedData.description || null,
          validatedData.category,
          validatedData.subcategory || null,
          validatedData.base_price,
          validatedData.min_quantity,
          validatedData.max_quantity,
          validatedData.unit,
          validatedData.production_time_days,
          validatedData.customizable ? 1 : 0,
          validatedData.materials || null,
          JSON.stringify(validatedData.colors),
          JSON.stringify(validatedData.sizes),
          validatedData.image_url || null,
          JSON.stringify(validatedData.gallery_urls),
          validatedData.specifications || null,
          validatedData.is_active ? 1 : 0
        ]
      })

      console.log(`✅ Produit créé avec succès: ${productId}`)

      // Récupérer le produit créé
      const createdProductResult = await db.execute({
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

      if (createdProductResult.rows.length === 0) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Erreur lors de la récupération du produit créé'
        })
      }

      const productData = createdProductResult.rows[0] as any

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
        message: `Produit "${validatedData.name}" créé avec succès`,
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
        statusMessage: 'Erreur lors de la création du produit',
        data: { error: dbError.message }
      })
    }

  } catch (error) {
    console.error('❌ Erreur POST /api/products:', error)

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