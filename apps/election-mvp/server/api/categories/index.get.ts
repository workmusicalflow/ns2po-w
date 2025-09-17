/**
 * API Route: GET /api/categories
 * Récupère toutes les catégories avec stratégie Turso-first → Fallback statique
 */

import { getDatabase } from '../../utils/database'

// Fallback statique minimal pour résilience
const STATIC_CATEGORIES_FALLBACK = [
  {
    id: 'textile',
    name: 'TEXTILE',
    slug: 'textile',
    description: 'Vêtements et textiles personnalisables',
    icon: 'shirt',
    color: '#3B82F6',
    isActive: true,
    subcategories: [
      {
        id: 'vetement',
        name: 'VETEMENT',
        slug: 'vetement',
        description: 'Vêtements personnalisables'
      }
    ]
  },
  {
    id: 'accessoire',
    name: 'ACCESSOIRE',
    slug: 'accessoire',
    description: 'Accessoires et objets promotionnels',
    icon: 'cap',
    color: '#10B981',
    isActive: true,
    subcategories: [
      {
        id: 'couvre-chef',
        name: 'COUVRE_CHEF',
        slug: 'couvre-chef',
        description: 'Casquettes et chapeaux'
      }
    ]
  }
]

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  try {
    console.log("📂 GET /api/categories - Début récupération hybride")

    // Récupération des query parameters
    const query = getQuery(event)
    const flat = query.flat === "true"
    const activeOnly = query.active !== "false"

    let categories
    let source = 'unknown'

    // 1. Priorité : Turso Database (performance optimale)
    const tursoClient = getDatabase()
    if (tursoClient) {
      try {
        console.log('🎯 Tentative Turso categories...')

        let sql = `
          SELECT
            c.id, c.name, c.slug, c.description, c.parent_id as parentId,
            c.icon, c.color, c.sort_order as sortOrder, c.is_active as isActive,
            c.created_at as createdAt, c.updated_at as updatedAt,
            p.name as parentName
          FROM categories c
          LEFT JOIN categories p ON c.parent_id = p.id
        `

        const conditions = []
        const args = []

        if (activeOnly) {
          conditions.push("c.is_active = 1")
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ")
        }

        sql += " ORDER BY COALESCE(p.sort_order, c.sort_order), c.sort_order, c.name"

        const result = await tursoClient.execute({ sql, args })

        if (flat) {
          // Mode plat : toutes les catégories au même niveau
          categories = result.rows.map((row: any) => ({
            id: String(row.id),
            name: row.name,
            slug: row.slug,
            description: row.description || '',
            parentId: row.parentId,
            parentName: row.parentName,
            icon: row.icon,
            color: row.color,
            sortOrder: Number(row.sortOrder) || 0,
            isActive: Boolean(row.isActive),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
          }))
        } else {
          // Mode hiérarchique : catégories avec sous-catégories
          const categoryMap = new Map()
          const rootCategories = []

          // Premier passage : créer toutes les catégories
          result.rows.forEach((row: any) => {
            const category = {
              id: String(row.id),
              name: row.name,
              slug: row.slug,
              description: row.description || '',
              parentId: row.parentId,
              icon: row.icon,
              color: row.color,
              sortOrder: Number(row.sortOrder) || 0,
              isActive: Boolean(row.isActive),
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
              subcategories: []
            }

            categoryMap.set(category.id, category)

            if (!category.parentId) {
              rootCategories.push(category)
            }
          })

          // Deuxième passage : associer les sous-catégories
          result.rows.forEach((row: any) => {
            if (row.parentId) {
              const parent = categoryMap.get(row.parentId)
              const child = categoryMap.get(String(row.id))
              if (parent && child) {
                parent.subcategories.push(child)
              }
            }
          })

          categories = rootCategories
        }

        source = 'turso'
        const duration = Date.now() - startTime
        console.log(`✅ Turso OK: ${categories.length} catégories en ${duration}ms`)

      } catch (tursoError) {
        console.warn('⚠️ Turso failed, using static fallback...', tursoError)
      }
    }

    // 2. Fallback final : Données statiques
    if (!categories) {
      categories = [...STATIC_CATEGORIES_FALLBACK]

      if (flat) {
        // Aplatir les catégories statiques
        const flatCategories = []
        categories.forEach(cat => {
          flatCategories.push({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            color: cat.color,
            isActive: cat.isActive
          })
          if (cat.subcategories) {
            cat.subcategories.forEach(sub => {
              flatCategories.push({
                id: sub.id,
                name: sub.name,
                slug: sub.slug,
                description: sub.description,
                parentId: cat.id,
                parentName: cat.name,
                isActive: true
              })
            })
          }
        })
        categories = flatCategories
      }

      source = 'static'
      const duration = Date.now() - startTime
      console.log(`🛡️ Fallback statique: ${categories.length} catégories en ${duration}ms`)
    }

    console.log(`✅ Récupération réussie: ${categories.length} catégories (source: ${source})`)

    // Cache headers pour optimiser les performances
    if (source === 'turso') {
      setHeader(event, "Cache-Control", "public, max-age=1800") // 30 minutes pour Turso
    } else {
      setHeader(event, "Cache-Control", "public, max-age=300") // 5 minutes pour fallback statique
    }

    const response = {
      success: true,
      data: categories,
      count: categories.length,
      source,
      duration: Date.now() - startTime,
      params: {
        flat,
        activeOnly
      }
    }

    if (source === 'static') {
      response.warning = 'Service dégradé - données limitées'
    }

    return response

  } catch (error) {
    console.error("❌ Erreur critique GET /api/categories:", error)

    // Même en cas d'erreur critique, on retourne le fallback
    const fallbackCategories = [...STATIC_CATEGORIES_FALLBACK]

    return {
      success: false,
      data: fallbackCategories,
      count: fallbackCategories.length,
      source: 'static',
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Erreur interne du serveur",
      warning: 'Service en mode dégradé'
    }
  }
})