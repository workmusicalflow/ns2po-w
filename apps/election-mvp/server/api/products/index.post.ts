/**
 * API Route: POST /api/products
 * Crée un nouveau produit avec stratégie Turso-first
 */

import { getDatabase } from "../../utils/database"
import { z } from "zod"

// Schéma de validation pour création de produit
const createProductSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  reference: z.string()
    .min(3, "La référence doit contenir au moins 3 caractères")
    .max(50, "La référence ne peut pas dépasser 50 caractères")
    .regex(/^[A-Z0-9-_]+$/, "La référence ne peut contenir que des lettres majuscules, des chiffres, des tirets et des underscores"),
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

/**
 * Fonction helper pour exécuter une opération DB avec retry sur inconsistance Turso
 * Solution tri-agent : Claude + Gemini + Perplexity
 */
async function executeWithTursoRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3,
  initialDelayMs: number = 200
): Promise<T> {
  let retries = 0

  while (retries < maxRetries) {
    try {
      return await operation()
    } catch (error: any) {
      console.error(`${operationName} - Tentative ${retries + 1} échouée:`, error.message)

      // Détecter l'erreur spécifique d'inconsistance Turso
      if (error.message && error.message.includes("no such column: reference")) {
        retries++
        if (retries < maxRetries) {
          const delay = initialDelayMs * Math.pow(2, retries - 1) // Backoff exponentiel
          console.warn(`🔄 Inconsistance temporelle Turso détectée. Retry ${retries}/${maxRetries} dans ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        } else {
          // Tous les retries ont échoué
          throw createError({
            statusCode: 500,
            statusMessage: 'Inconsistance de base de données persistante',
            data: {
              code: "TURSO_SCHEMA_MISMATCH_PERSISTENT",
              details: `Schéma désynchronisé après ${maxRetries} tentatives - Réplicas Turso non synchronisés`,
              retries: maxRetries
            }
          })
        }
      } else {
        // Autres erreurs - pas de retry
        throw error
      }
    }
  }

  throw new Error("Should not reach here")
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log('📦 POST /api/products - Création nouveau produit (avec protection Turso consistency)')

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
            code: "VALIDATION_ERROR",
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
        statusMessage: 'Base de données non disponible',
        data: { code: "DATABASE_UNAVAILABLE" }
      })
    }

    // Exécution avec retry pattern pour inconsistances Turso
    const result = await executeWithTursoRetry(async () => {
      // Vérifier l'unicité de la référence avant insertion
      const existingProduct = await db.execute({
        sql: `SELECT id FROM products WHERE reference = ? LIMIT 1`,
        args: [validatedData.reference]
      })

      if (existingProduct.rows.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Référence produit déjà utilisée',
          data: {
            code: "REFERENCE_ALREADY_EXISTS",
            field: 'reference',
            message: `La référence "${validatedData.reference}" est déjà utilisée par un autre produit.`
          }
        })
      }

      // Générer un ID unique pour le produit
      const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Insérer le nouveau produit
      await db.execute({
        sql: `INSERT INTO products (
          id, name, reference, description, category, subcategory,
          base_price, min_quantity, max_quantity, unit, production_time_days,
          customizable, materials, colors, sizes,
          image_url, gallery_urls, specifications, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          productId,
          validatedData.name,
          validatedData.reference,
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
          id, name, reference, description, category, subcategory,
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
        reference: productData.reference,
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

      return {
        success: true,
        data: product,
        message: `Produit "${validatedData.name}" créé avec succès`,
        source: 'turso-with-retry',
        duration: Date.now() - startTime
      }

    }, "Product Creation") // Nom de l'opération pour les logs

    // Cache headers
    setHeader(event, "Cache-Control", "no-cache")

    return result

  } catch (error: any) {
    console.error('❌ Erreur POST /api/products:', error)

    // Les erreurs avec statusCode (createError) sont déjà bien formatées
    if (error.statusCode) {
      throw error
    }

    // Erreur générique non catchée par le retry pattern
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        code: "INTERNAL_SERVER_ERROR",
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
})