/**
 * Product Mapper - Pattern Adapter
 * Transforme les données entre format API et format Formulaire
 *
 * Centralise toute la logique de transformation pour:
 * - Éviter les casts `as unknown as any`
 * - Garantir la cohérence des transformations
 * - Faciliter les tests unitaires
 * - Respecter le SRP (Single Responsibility Principle)
 *
 * @see types/admin/product-form.ts pour les définitions de types
 */

import type {
  ProductFromApi,
  ProductFormData,
  ProductColorFromApi,
  ProductSizeFromApi,
  getDefaultFormData
} from '~/types/admin/product-form'

/**
 * Transforme un produit API vers le format formulaire
 * Appelé quand on charge un produit existant pour édition
 */
export function mapApiToForm(product: ProductFromApi): ProductFormData {
  // Transformer materials: string[] → string (pour textarea)
  const materialsAsString = Array.isArray(product.materials)
    ? product.materials.join('\n')
    : ''

  // Transformer colors: {name, hex?}[] → string[] (noms uniquement)
  const colorsAsStrings = Array.isArray(product.colors)
    ? product.colors.map((c) => (typeof c === 'string' ? c : c.name || ''))
    : ['']

  // Construire le map hex pour préserver les couleurs
  const colorHexMap: Record<string, string> = {}
  if (Array.isArray(product.colors)) {
    product.colors.forEach((c) => {
      if (typeof c === 'object' && c.hex) {
        colorHexMap[c.name] = c.hex
      }
    })
  }

  // Transformer sizes: {name, category?}[] → string[] (noms uniquement)
  const sizesAsStrings = Array.isArray(product.sizes)
    ? product.sizes.map((s) => (typeof s === 'string' ? s : s.name || ''))
    : ['']

  return {
    name: product.name || '',
    description: product.description || '',
    reference: product.reference || '',
    category: product.category || '',
    subcategory: product.subcategory || '',
    basePrice: product.basePrice ?? null,
    minQuantity: product.minQuantity ?? 10,
    maxQuantity: product.maxQuantity ?? 1000,
    imageUrl: product.image_url || '',
    isActive: product.isActive ?? true,
    materials: materialsAsString,
    colors: colorsAsStrings.length > 0 ? colorsAsStrings : [''],
    sizes: sizesAsStrings.length > 0 ? sizesAsStrings : [''],
    colorHexMap
  }
}

/**
 * Transforme les données formulaire vers le format API
 * Appelé lors de la soumission (create/update)
 */
export function mapFormToApi(formData: ProductFormData): {
  name: string
  description: string
  reference: string
  category: string
  subcategory: string
  base_price: number
  min_quantity: number
  max_quantity: number
  image: string
  is_active: boolean
  materials: string[]
  colors: { name: string; hex?: string }[]
  sizes: { name: string }[]
} {
  // Transformer materials: string → string[] (split par lignes)
  const materialsArray = formData.materials
    .split('\n')
    .map((m) => m.trim())
    .filter((m) => m.length > 0)

  // Transformer colors: string[] → {name, hex?}[]
  const colorsArray = formData.colors
    .filter((c) => c.trim().length > 0)
    .map((colorName) => {
      const hex = formData.colorHexMap?.[colorName]
      return hex ? { name: colorName, hex } : { name: colorName }
    })

  // Transformer sizes: string[] → {name}[]
  const sizesArray = formData.sizes
    .filter((s) => s.trim().length > 0)
    .map((sizeName) => ({ name: sizeName }))

  return {
    name: formData.name,
    description: formData.description,
    reference: formData.reference,
    category: formData.category,
    subcategory: formData.subcategory,
    base_price: formData.basePrice ?? 0,
    min_quantity: formData.minQuantity,
    max_quantity: formData.maxQuantity,
    image: formData.imageUrl,
    is_active: formData.isActive,
    materials: materialsArray,
    colors: colorsArray,
    sizes: sizesArray
  }
}

/**
 * Vérifie si un produit API a des données valides pour le mapping
 */
export function isValidProductFromApi(product: unknown): product is ProductFromApi {
  if (!product || typeof product !== 'object') return false

  const p = product as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    typeof p.basePrice === 'number'
  )
}
