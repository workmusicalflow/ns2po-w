/**
 * Case Converter Utilities
 * Anti-corruption layer for camelCase ↔ snake_case transformation
 *
 * ARCHITECTURE DECISION (Gemini Recommendation 2025-12-02):
 * - Frontend uses camelCase (Vue.js convention)
 * - Database/API uses snake_case (SQL convention)
 * - This module provides centralized transformation via z.preprocess()
 *
 * @see https://zod.dev/?id=preprocess
 */

/**
 * Known field mappings for consistent transformation
 * Extend this map when adding new fields that need explicit mapping
 */
const FIELD_MAPPINGS: Record<string, string> = {
  // Product fields (camelCase → snake_case)
  basePrice: 'base_price',
  minQuantity: 'min_quantity',
  maxQuantity: 'max_quantity',
  isActive: 'is_active',
  imageUrl: 'image_url',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  displayOrder: 'display_order',

  // Bundle fields
  estimatedTotal: 'estimated_total',
  originalTotal: 'original_total',
  targetAudience: 'target_audience',
  budgetRange: 'budget_range',
  isFeatured: 'is_featured',
  totalProducts: 'total_products',
  discountPercentage: 'discount_percentage',
  priceLocked: 'price_locked',

  // Category fields
  parentId: 'parent_id',

  // Realisation fields
  cloudinaryPublicIds: 'cloudinary_public_ids'
}

// Reverse mapping (snake_case → camelCase)
const REVERSE_FIELD_MAPPINGS: Record<string, string> = Object.fromEntries(
  Object.entries(FIELD_MAPPINGS).map(([camel, snake]) => [snake, camel])
)

/**
 * Convert a single string from camelCase to snake_case
 */
export function camelToSnake(str: string): string {
  // Check explicit mapping first
  if (FIELD_MAPPINGS[str]) {
    return FIELD_MAPPINGS[str]
  }
  // Generic conversion: insert _ before uppercase letters and lowercase
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Convert a single string from snake_case to camelCase
 */
export function snakeToCamel(str: string): string {
  // Check explicit mapping first
  if (REVERSE_FIELD_MAPPINGS[str]) {
    return REVERSE_FIELD_MAPPINGS[str]
  }
  // Generic conversion: remove _ and uppercase following letter
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Deep transform object keys from camelCase to snake_case
 * Use with z.preprocess() for API input validation
 *
 * @example
 * const InputSchema = z.preprocess(
 *   (data) => toSnakeCase(data),
 *   UpdateProductSchema
 * );
 */
export function toSnakeCase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item)) as T
  }

  if (typeof obj === 'object' && obj !== null) {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnake(key)
      transformed[snakeKey] = toSnakeCase(value)
    }

    return transformed as T
  }

  return obj
}

/**
 * Deep transform object keys from snake_case to camelCase
 * Use for API response transformation
 *
 * @example
 * return {
 *   success: true,
 *   data: toCamelCase(dbResult)
 * }
 */
export function toCamelCase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item)) as T
  }

  if (typeof obj === 'object' && obj !== null) {
    const transformed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      const camelKey = snakeToCamel(key)
      transformed[camelKey] = toCamelCase(value)
    }

    return transformed as T
  }

  return obj
}

/**
 * Create a Zod preprocess function that transforms camelCase input to snake_case
 * before validation
 *
 * @example
 * import { createSnakeCasePreprocess } from '../utils/caseConverter'
 *
 * const UpdateProductSchema = z.preprocess(
 *   createSnakeCasePreprocess(),
 *   z.object({
 *     base_price: z.number().optional(),
 *     min_quantity: z.number().optional(),
 *     // ... snake_case schema
 *   })
 * );
 */
export function createSnakeCasePreprocess() {
  return (data: unknown) => {
    if (typeof data !== 'object' || data === null) {
      return data
    }
    return toSnakeCase(data)
  }
}

/**
 * Utility to check if a key is in camelCase format
 */
export function isCamelCase(str: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(str) && str !== str.toLowerCase()
}

/**
 * Utility to check if a key is in snake_case format
 */
export function isSnakeCase(str: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(str) && str.includes('_')
}
