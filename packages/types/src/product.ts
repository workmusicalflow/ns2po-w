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
}

export interface Category {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly slug: string
  readonly isActive: boolean
}

export interface PriceRule {
  readonly id: string
  readonly productId: string
  readonly minQuantity: number
  readonly maxQuantity: number
  readonly pricePerUnit: number
  readonly discount?: number
  readonly isActive: boolean
}

// =====================================
// TYPES CALCUL DE DEVIS
// =====================================

export interface QuoteItem {
  readonly productId: string
  readonly quantity: number
  readonly customization?: ProductCustomization
  readonly unitPrice: number
  readonly totalPrice: number
}

export interface ProductCustomization {
  readonly logoUrl?: string
  readonly text?: string
  readonly colors?: readonly string[]
  readonly position?: CustomizationPosition
}

export interface Quote {
  readonly id: string
  readonly items: readonly QuoteItem[]
  readonly subtotal: number
  readonly tax: number
  readonly total: number
  readonly customerInfo: CustomerInfo
  readonly status: QuoteStatus
  readonly validUntil: Date
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CustomerInfo {
  readonly name: string
  readonly email: string
  readonly phone?: string
  readonly organization?: string
  readonly address?: string
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

export const QuoteStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
} as const

export const ProductCategory = {
  TEXTILE: 'TEXTILE',
  GADGET: 'GADGET',
  EPI: 'EPI',
  ACCESSOIRE: 'ACCESSOIRE'
} as const

// Type unions
export type CustomizationPosition = typeof CustomizationPosition[keyof typeof CustomizationPosition]
export type QuoteStatus = typeof QuoteStatus[keyof typeof QuoteStatus]
export type ProductCategory = typeof ProductCategory[keyof typeof ProductCategory]