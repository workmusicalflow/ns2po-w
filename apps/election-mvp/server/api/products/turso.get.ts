import { createClient } from '@libsql/client'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!
})

export default defineEventHandler(async (event) => {
  try {
    const result = await client.execute(`
      SELECT 
        id, name, description, category, subcategory,
        base_price as basePrice, min_quantity as minQuantity, 
        max_quantity as maxQuantity, unit, production_time_days as productionTimeDays,
        customizable, materials, colors, sizes, 
        image_url as image, gallery_urls as galleryUrls,
        specifications, is_active as isActive,
        created_at as createdAt, updated_at as updatedAt
      FROM products 
      WHERE is_active = true 
      ORDER BY category, name
    `)

    const products = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      subcategory: row.subcategory,
      basePrice: row.basePrice,
      minQuantity: row.minQuantity || 1,
      maxQuantity: row.maxQuantity || 1000,
      unit: row.unit || 'piece',
      productionTimeDays: row.productionTimeDays || 7,
      customizable: Boolean(row.customizable),
      materials: row.materials ? JSON.parse(row.materials) : [],
      colors: row.colors ? JSON.parse(row.colors) : [],
      sizes: row.sizes ? JSON.parse(row.sizes) : [],
      image: row.image,
      galleryUrls: row.galleryUrls ? JSON.parse(row.galleryUrls) : [],
      specifications: row.specifications ? JSON.parse(row.specifications) : {},
      isActive: Boolean(row.isActive),
      tags: [], // Dérivé dynamiquement si nécessaire
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }))

    return {
      success: true,
      data: products,
      source: 'turso',
      count: products.length
    }
  } catch (error) {
    console.error('Erreur API /products/turso:', error)
    
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Erreur serveur',
      source: 'turso'
    }
  }
})