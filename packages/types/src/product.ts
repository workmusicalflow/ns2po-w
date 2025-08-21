/**
 * Types pour le catalogue de produits NS2PO
 */

// =====================================
// TYPES AIRTABLE
// =====================================

export interface AirtableProduct {
  readonly id: string
  readonly fields: {
    readonly name?: string
    readonly category?: string
    readonly basePrice?: number
    readonly minQuantity?: number
    readonly maxQuantity?: number
    readonly description?: string
    readonly image?: readonly AirtableAttachment[]
    readonly isActive?: boolean
    readonly tags?: readonly string[]
  }
}

export interface AirtableAttachment {
  readonly id: string
  readonly url: string
  readonly filename: string
  readonly size: number
  readonly type: string
  readonly width?: number
  readonly height?: number
}

export interface AirtableCategory {
  readonly id: string
  readonly fields: {
    readonly name?: string
    readonly description?: string
    readonly slug?: string
    readonly isActive?: boolean
  }
}

export interface AirtablePriceRule {
  readonly id: string
  readonly fields: {
    readonly productId?: readonly string[]
    readonly minQuantity?: number
    readonly maxQuantity?: number
    readonly pricePerUnit?: number
    readonly discount?: number
    readonly isActive?: boolean
  }
}

// =====================================
// TYPES PRODUITS TRANSFORMÉS
// =====================================

export interface Product {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly basePrice: number
  readonly minQuantity: number
  readonly maxQuantity: number
  readonly description: string
  readonly image?: string
  readonly tags: readonly string[]
  readonly isActive: boolean
  readonly customizationOptions?: readonly CustomizationOption[]
}

export interface CustomizationOption {
  readonly id: string
  readonly name: string
  readonly type: 'color' | 'text' | 'logo' | 'position'
  readonly values?: readonly string[]
  readonly price?: number
}

export interface Category {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly slug: string
  readonly isActive: boolean
}

export interface ProductPriceRule {
  readonly id: string
  readonly productId: string
  readonly minQuantity: number
  readonly maxQuantity: number
  readonly pricePerUnit: number
  readonly discount?: number
  readonly isActive: boolean
}

// =====================================
// TYPES PERSONNALISATION
// =====================================

export interface ProductCustomization {
  readonly logoUrl?: string
  readonly text?: string
  readonly colors?: readonly string[]
  readonly position?: CustomizationPosition
}

// =====================================
// ENUMS
// =====================================

export const CustomizationPosition = {
  FRONT: 'FRONT',
  BACK: 'BACK',
  SLEEVE: 'SLEEVE',
  CHEST: 'CHEST'
} as const

// QuoteStatus est maintenant défini dans quote.ts

export const ProductCategory = {
  TEXTILE: 'TEXTILE',
  GADGET: 'GADGET',
  EPI: 'EPI',
  ACCESSOIRE: 'ACCESSOIRE'
} as const

// Type unions
export type CustomizationPosition = typeof CustomizationPosition[keyof typeof CustomizationPosition]
export type ProductCategory = typeof ProductCategory[keyof typeof ProductCategory]