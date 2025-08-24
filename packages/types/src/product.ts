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
  readonly required?: boolean
  readonly options?: readonly string[]
  readonly priceModifier?: number
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

export interface LogoCustomization {
  readonly id: string
  readonly url: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly rotation?: number
  readonly opacity?: number
}

export interface ProductCustomization {
  readonly logos?: readonly LogoCustomization[]
  readonly text?: string
  readonly colors?: readonly string[]
  readonly position?: CustomizationPosition
}

// =====================================
// TYPES RÉALISATIONS
// =====================================

export interface AirtableRealisation {
  readonly id: string
  readonly fields: {
    readonly title?: string
    readonly description?: string
    readonly cloudinaryPublicIds?: readonly string[]
    readonly products?: readonly string[] // IDs des produits liés
    readonly categories?: readonly string[] // IDs des catégories liées
    readonly customizationOptions?: readonly string[] // IDs des options de personnalisation utilisées
    readonly tags?: readonly string[]
    readonly isFeatured?: boolean
    readonly order?: number
    readonly isActive?: boolean
  }
}

export interface Realisation {
  readonly id: string
  readonly title: string
  readonly description?: string
  readonly cloudinaryPublicIds: readonly string[]
  readonly productIds: readonly string[]
  readonly categoryIds: readonly string[]
  readonly customizationOptionIds: readonly string[]
  readonly tags: readonly string[]
  readonly isFeatured: boolean
  readonly order?: number
  readonly isActive: boolean
  // Relations enrichies par l'API (optionnelles pour éviter les requêtes en cascade côté client)
  readonly products?: readonly Product[]
  readonly categories?: readonly Category[]
  readonly customizationOptions?: readonly CustomizationOption[]
}

// Interface pour les vues simplifiées (cartes, listes)
export interface RealisationPreview {
  readonly id: string
  readonly title: string
  readonly cloudinaryPublicId: string // Première image seulement
  readonly productIds: readonly string[]
  readonly tags: readonly string[]
  readonly isFeatured: boolean
}

// Interface pour le contexte d'inspiration dans le parcours utilisateur
export interface InspirationContext {
  readonly realisationId: string
  readonly realisationTitle: string
  readonly productId: string
  readonly timestamp: string
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