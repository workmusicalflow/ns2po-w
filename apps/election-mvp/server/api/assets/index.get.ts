/**
 * API GET /api/assets - Récupération des assets avec filtres et pagination
 */

import { assetService } from '../../services/assetService'
import type { AssetFilters, PaginationOptions } from '../../services/assetService'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)

    // Construction des filtres depuis les query params
    const filters: AssetFilters = {}
    const pagination: PaginationOptions = {}

    // Filtres
    if (query.format && typeof query.format === 'string') {
      filters.format = query.format
    }

    if (query.folder && typeof query.folder === 'string') {
      filters.folder = query.folder
    }

    if (query.search && typeof query.search === 'string') {
      filters.search = query.search
    }

    if (query.tags && typeof query.tags === 'string') {
      filters.tags = query.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    }

    // Pagination
    if (query.page && typeof query.page === 'string') {
      const page = parseInt(query.page, 10)
      if (!isNaN(page) && page > 0) {
        pagination.page = page
      }
    }

    if (query.limit && typeof query.limit === 'string') {
      const limit = parseInt(query.limit, 10)
      if (!isNaN(limit) && limit > 0 && limit <= 100) {
        pagination.limit = limit
      }
    }

    if (query.sortBy && typeof query.sortBy === 'string') {
      const validSortFields = ['created_at', 'updated_at', 'bytes'] as const
      if (validSortFields.includes(query.sortBy as any)) {
        pagination.sortBy = query.sortBy as any
      }
    }

    if (query.sortOrder && typeof query.sortOrder === 'string') {
      const validSortOrders = ['asc', 'desc'] as const
      if (validSortOrders.includes(query.sortOrder as any)) {
        pagination.sortOrder = query.sortOrder as any
      }
    }

    const result = await assetService.getAssets(filters, pagination)

    return {
      success: true,
      data: result,
      message: `${result.assets.length} assets récupérés (page ${result.page}/${result.totalPages})`
    }

  } catch (error: any) {
    console.error('❌ Erreur API GET /api/assets:', error)

    // Si c'est une erreur avec statusCode, la retourner telle quelle
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la récupération des assets',
      data: { error: error.message }
    })
  }
})