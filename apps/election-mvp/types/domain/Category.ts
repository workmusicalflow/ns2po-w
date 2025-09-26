/**
 * Domain Types for Category Entity
 * SOLID Architecture - Domain Layer
 */

// Core Category Interface (Immutable)
export interface Category {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly description?: string
  readonly isActive: boolean
  readonly displayOrder: number
  readonly createdAt: string
  readonly updatedAt: string
}

// Category Tree for hierarchical categories
export interface CategoryNode extends Category {
  readonly children: CategoryNode[]
  readonly parent?: string
  readonly level: number
}

// Category with product count
export interface CategoryWithStats extends Category {
  readonly productCount: number
  readonly bundleCount?: number
}

// Category Enums
export type CategoryStatus = 'active' | 'inactive' | 'draft' | 'archived'

// Category Filters
export interface CategoryFilters {
  readonly search?: string
  readonly status?: CategoryStatus
  readonly parentId?: string
  readonly level?: number
}

export interface CategorySortOptions {
  readonly field: keyof Category
  readonly direction: 'asc' | 'desc'
}

// Type Guards
export function isValidCategory(obj: unknown): obj is Category {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'slug' in obj &&
    typeof (obj as Category).id === 'string' &&
    typeof (obj as Category).name === 'string' &&
    typeof (obj as Category).slug === 'string'
  )
}

// Category Business Logic Helpers
export const CategoryHelpers = {
  generateSlug: (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  },

  validateDisplayOrder: (order: number): boolean => {
    return Number.isInteger(order) && order >= 0
  }
} as const