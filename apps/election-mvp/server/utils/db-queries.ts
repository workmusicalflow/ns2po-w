/**
 * Helper Utilities pour Requêtes SQL Optimisées
 * Schéma Normalisé (Post-Migration 002)
 *
 * Fonctions réutilisables pour requêter les tables normalisées:
 * - product_materials, product_colors, product_sizes
 * - product_gallery, product_tags, products_search_fts
 */

import type { Client } from '@libsql/client'

// ========================================
// TYPES
// ========================================

export interface Product {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  categoryDetails: CategoryDetails | null
  basePrice: number
  price?: number
  minQuantity: number
  maxQuantity: number
  unit: string
  productionTimeDays: number
  customizable: boolean
  materials: string[] // Depuis table normalisée
  colors: string[] // Depuis table normalisée
  sizes: string[] // Depuis table normalisée
  image: string
  galleryUrls: string[] // Depuis table normalisée
  specifications: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryDetails {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
}

export interface ProductMaterial {
  id: string
  productId: string
  materialName: string
  isPrimary: boolean
  displayOrder: number
}

export interface ProductColor {
  id: string
  productId: string
  colorName: string
  colorHex: string | null
  isAvailable: boolean
  displayOrder: number
}

export interface ProductSize {
  id: string
  productId: string
  sizeName: string
  sizeCategory: string | null
  isAvailable: boolean
  displayOrder: number
}

// ========================================
// HELPER: Récupération Produit avec Relations
// ========================================

/**
 * Récupère un produit avec toutes ses relations depuis les tables normalisées
 *
 * @param db Client Turso
 * @param productId ID du produit
 * @returns Product complet avec materials, colors, sizes depuis tables normalisées
 */
export async function getProductWithRelations(
  db: Client,
  productId: string
): Promise<Product | null> {
  // 1. Récupérer produit principal
  const productResult = await db.execute({
    sql: `
      SELECT
        p.id, p.name, p.description, p.category, p.subcategory,
        p.base_price as basePrice, p.min_quantity as minQuantity,
        p.max_quantity as maxQuantity, p.unit, p.production_time_days as productionTimeDays,
        p.customizable, p.image_url as image, p.specifications,
        p.is_active as isActive, p.created_at as createdAt, p.updated_at as updatedAt,
        c.id as categoryId, c.name as categoryName, c.slug as categorySlug,
        c.description as categoryDescription, c.icon as categoryIcon, c.color as categoryColor
      FROM products p
      LEFT JOIN categories c ON p.category = c.id
      WHERE p.id = ? AND p.is_active = true
    `,
    args: [productId]
  })

  if (productResult.rows.length === 0) {
    return null
  }

  const row = productResult.rows[0] as any

  // 2. Récupérer matériaux (triés par display_order)
  const materialsResult = await db.execute({
    sql: `
      SELECT material_name
      FROM product_materials
      WHERE product_id = ?
      ORDER BY is_primary DESC, display_order ASC
    `,
    args: [productId]
  })

  const materials = materialsResult.rows.map((r: any) => r.material_name)

  // 3. Récupérer couleurs disponibles (triées par display_order)
  const colorsResult = await db.execute({
    sql: `
      SELECT color_name
      FROM product_colors
      WHERE product_id = ? AND is_available = true
      ORDER BY display_order ASC
    `,
    args: [productId]
  })

  const colors = colorsResult.rows.map((r: any) => r.color_name)

  // 4. Récupérer tailles disponibles (triées par display_order)
  const sizesResult = await db.execute({
    sql: `
      SELECT size_name
      FROM product_sizes
      WHERE product_id = ? AND is_available = true
      ORDER BY display_order ASC
    `,
    args: [productId]
  })

  const sizes = sizesResult.rows.map((r: any) => r.size_name)

  // 5. Récupérer images gallery actives (triées par display_order)
  const galleryResult = await db.execute({
    sql: `
      SELECT image_url
      FROM product_gallery
      WHERE product_id = ? AND is_active = true
      ORDER BY display_order ASC
    `,
    args: [productId]
  })

  const galleryUrls = galleryResult.rows.map((r: any) => r.image_url)

  // 6. Construire objet Product complet
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    category: row.category,
    subcategory: row.subcategory,
    categoryDetails: row.categoryId ? {
      id: row.categoryId,
      name: row.categoryName,
      slug: row.categorySlug,
      description: row.categoryDescription,
      icon: row.categoryIcon,
      color: row.categoryColor
    } : null,
    basePrice: Number(row.basePrice) || 0,
    price: Number(row.basePrice) || 0,
    minQuantity: Number(row.minQuantity) || 1,
    maxQuantity: Number(row.maxQuantity) || 1000,
    unit: row.unit || 'pièce',
    productionTimeDays: Number(row.productionTimeDays) || 7,
    customizable: Boolean(row.customizable),
    materials, // Depuis table normalisée
    colors, // Depuis table normalisée
    sizes, // Depuis table normalisée
    image: row.image,
    galleryUrls, // Depuis table normalisée
    specifications: row.specifications,
    tags: [row.category?.toLowerCase(), row.subcategory?.toLowerCase()].filter(Boolean),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

// ========================================
// HELPER: Liste Produits avec Relations (Optimisé)
// ========================================

/**
 * Récupère tous les produits avec relations via GROUP_CONCAT (1 seule requête)
 * Alternative optimisée pour éviter N+1 queries
 *
 * @param db Client Turso
 * @param filters Filtres optionnels (category, isActive, etc.)
 * @returns Liste de produits avec relations agrégées
 */
export async function getProductsListOptimized(
  db: Client,
  filters?: {
    category?: string
    isActive?: boolean
    limit?: number
  }
): Promise<Product[]> {
  let sql = `
    SELECT
      p.id, p.name, p.description, p.category, p.subcategory,
      p.base_price as basePrice, p.min_quantity as minQuantity,
      p.max_quantity as maxQuantity, p.unit, p.production_time_days as productionTimeDays,
      p.customizable, p.image_url as image, p.specifications,
      p.is_active as isActive, p.created_at as createdAt, p.updated_at as updatedAt,
      c.id as categoryId, c.name as categoryName, c.slug as categorySlug,
      GROUP_CONCAT(pm.material_name, '|||') as materials_list,
      GROUP_CONCAT(pc.color_name, '|||') as colors_list,
      GROUP_CONCAT(ps.size_name, '|||') as sizes_list,
      GROUP_CONCAT(pg.image_url, '|||') as gallery_list
    FROM products p
    LEFT JOIN categories c ON p.category = c.id
    LEFT JOIN product_materials pm ON p.id = pm.product_id
    LEFT JOIN product_colors pc ON p.id = pc.product_id AND pc.is_available = true
    LEFT JOIN product_sizes ps ON p.id = ps.product_id AND ps.is_available = true
    LEFT JOIN product_gallery pg ON p.id = pg.product_id AND pg.is_active = true
    WHERE 1=1
  `

  const args: any[] = []

  if (filters?.category) {
    sql += ` AND p.category = ?`
    args.push(filters.category)
  }

  if (filters?.isActive !== undefined) {
    sql += ` AND p.is_active = ?`
    args.push(filters.isActive ? 1 : 0)
  }

  sql += ` GROUP BY p.id ORDER BY p.created_at DESC`

  if (filters?.limit) {
    sql += ` LIMIT ?`
    args.push(filters.limit)
  }

  const result = await db.execute({ sql, args })

  return result.rows.map((row: any) => ({
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    category: row.category,
    subcategory: row.subcategory,
    categoryDetails: row.categoryId ? {
      id: row.categoryId,
      name: row.categoryName,
      slug: row.categorySlug,
      description: null,
      icon: null,
      color: null
    } : null,
    basePrice: Number(row.basePrice) || 0,
    price: Number(row.basePrice) || 0,
    minQuantity: Number(row.minQuantity) || 1,
    maxQuantity: Number(row.maxQuantity) || 1000,
    unit: row.unit || 'pièce',
    productionTimeDays: Number(row.productionTimeDays) || 7,
    customizable: Boolean(row.customizable),
    materials: row.materials_list ? [...new Set(row.materials_list.split('|||').filter(Boolean))] : [],
    colors: row.colors_list ? [...new Set(row.colors_list.split('|||').filter(Boolean))] : [],
    sizes: row.sizes_list ? [...new Set(row.sizes_list.split('|||').filter(Boolean))] : [],
    image: row.image,
    galleryUrls: row.gallery_list ? [...new Set(row.gallery_list.split('|||').filter(Boolean))] : [],
    specifications: row.specifications,
    tags: [row.category?.toLowerCase(), row.subcategory?.toLowerCase()].filter(Boolean),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }))
}

// ========================================
// HELPER: Recherche Full-Text Search (FTS5)
// ========================================

/**
 * Recherche produits via FTS5 (Full-Text Search)
 *
 * @param db Client Turso
 * @param searchQuery Termes de recherche (ex: "shirt coton")
 * @returns Liste de product IDs correspondants
 */
export async function searchProductsFTS(
  db: Client,
  searchQuery: string
): Promise<string[]> {
  const result = await db.execute({
    sql: `
      SELECT product_id
      FROM products_search_fts
      WHERE products_search_fts MATCH ?
      ORDER BY rank
    `,
    args: [searchQuery]
  })

  return result.rows.map((r: any) => r.product_id)
}

// ========================================
// HELPER: Filtres par Matériau/Couleur
// ========================================

/**
 * Filtre produits par matériau
 *
 * @param db Client Turso
 * @param materialName Nom du matériau (ex: "Coton")
 * @returns Liste de product IDs
 */
export async function searchProductsByMaterial(
  db: Client,
  materialName: string
): Promise<string[]> {
  const result = await db.execute({
    sql: `
      SELECT DISTINCT product_id
      FROM product_materials
      WHERE material_name LIKE ?
    `,
    args: [`%${materialName}%`]
  })

  return result.rows.map((r: any) => r.product_id)
}

/**
 * Filtre produits par couleur
 *
 * @param db Client Turso
 * @param colorName Nom de la couleur (ex: "Noir")
 * @returns Liste de product IDs
 */
export async function searchProductsByColor(
  db: Client,
  colorName: string
): Promise<string[]> {
  const result = await db.execute({
    sql: `
      SELECT DISTINCT product_id
      FROM product_colors
      WHERE color_name LIKE ? AND is_available = true
    `,
    args: [`%${colorName}%`]
  })

  return result.rows.map((r: any) => r.product_id)
}

// ========================================
// HELPER: Mise à Jour Produit avec Relations
// ========================================

/**
 * Met à jour un produit et ses relations (transaction safe)
 * Pattern: DELETE existant + INSERT nouvelles valeurs
 *
 * @param db Client Turso
 * @param productId ID du produit
 * @param data Données mises à jour
 */
export async function updateProductWithRelations(
  db: Client,
  productId: string,
  data: {
    materials?: string[]
    colors?: Array<{ name: string; hex?: string }>
    sizes?: Array<{ name: string; category?: string }>
  }
): Promise<void> {
  // NOTE: Turso ne supporte pas BEGIN/COMMIT natifs via libSQL
  // Utiliser batch() pour transactions

  const statements: Array<{ sql: string; args: any[] }> = []

  // 1. Supprimer anciennes relations
  if (data.materials) {
    statements.push({
      sql: `DELETE FROM product_materials WHERE product_id = ?`,
      args: [productId]
    })

    // Insérer nouvelles materials
    data.materials.forEach((material, index) => {
      statements.push({
        sql: `INSERT INTO product_materials (id, product_id, material_name, is_primary, display_order)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          `mat_${Date.now()}_${index}`,
          productId,
          material,
          index === 0 ? 1 : 0,
          index
        ]
      })
    })
  }

  if (data.colors) {
    statements.push({
      sql: `DELETE FROM product_colors WHERE product_id = ?`,
      args: [productId]
    })

    data.colors.forEach((color, index) => {
      statements.push({
        sql: `INSERT INTO product_colors (id, product_id, color_name, color_hex, is_available, display_order)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          `col_${Date.now()}_${index}`,
          productId,
          color.name,
          color.hex || null,
          1,
          index
        ]
      })
    })
  }

  if (data.sizes) {
    statements.push({
      sql: `DELETE FROM product_sizes WHERE product_id = ?`,
      args: [productId]
    })

    data.sizes.forEach((size, index) => {
      statements.push({
        sql: `INSERT INTO product_sizes (id, product_id, size_name, size_category, is_available, display_order)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          `size_${Date.now()}_${index}`,
          productId,
          size.name,
          size.category || 'custom',
          1,
          index
        ]
      })
    })
  }

  // 2. Exécuter en batch (transaction-like)
  await db.batch(statements, 'write')
}

// ========================================
// HELPER: Mise à Jour FTS après Modification Produit
// ========================================

/**
 * Met à jour l'index FTS5 pour un produit
 * À appeler après création/modification d'un produit
 *
 * @param db Client Turso
 * @param productId ID du produit
 * @param data Données à indexer
 */
export async function updateProductFTS(
  db: Client,
  productId: string,
  data: {
    name: string
    description: string
    category: string
    subcategory: string
  }
): Promise<void> {
  // Supprimer ancienne entrée FTS
  await db.execute({
    sql: `DELETE FROM products_search_fts WHERE product_id = ?`,
    args: [productId]
  })

  // Insérer nouvelle entrée FTS
  await db.execute({
    sql: `INSERT INTO products_search_fts (product_id, name, description, category, subcategory)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      productId,
      data.name,
      data.description || '',
      data.category || '',
      data.subcategory || ''
    ]
  })
}
