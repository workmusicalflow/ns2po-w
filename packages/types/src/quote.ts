/**
 * Types pour le système de devis NS2PO Election MVP
 */

import type { Product, ProductCategory } from './product'
import type { CustomerInfo } from './user'

// === DEVIS ===
export interface QuoteRequest {
  id?: string
  customer: CustomerInfo
  items: QuoteItem[]
  customizations: Customization[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  validUntil: string
  notes?: string
  status: QuoteStatus
  createdAt: string
  updatedAt?: string
}

export interface QuoteItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  customizations: ItemCustomization[]
  totalPrice: number
  notes?: string
}

export interface ItemCustomization {
  optionId: string
  choiceId: string
  customValue?: string
  priceModifier: number
}

export interface Customization {
  type: 'logo' | 'text' | 'color'
  value: string
  position?: string
  size?: string
  priceModifier: number
}

export type QuoteStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'expired'

// === CALCULATEUR ===
export interface QuoteCalculation {
  items: CalculatedItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discounts: AppliedDiscount[]
  discountAmount: number
  totalAmount: number
  breakdown: PriceBreakdown[]
}

export interface CalculatedItem {
  id: string
  productId: string
  quantity: number
  basePrice: number
  customizationsCost: number
  appliedRules: AppliedRule[]
  unitPrice: number
  totalPrice: number
}

export interface AppliedRule {
  ruleId: string
  ruleName: string
  modifier: number
  reason: string
}

export interface AppliedDiscount {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  amount: number
  reason: string
}

export interface PriceBreakdown {
  label: string
  amount: number
  type: 'item' | 'customization' | 'tax' | 'discount' | 'shipping'
  details?: string
}

// === RÈGLES DE PRIX ===
export interface PriceRule {
  id: string
  name: string
  type: 'quantity' | 'customization' | 'urgency' | 'discount'
  conditions: PriceCondition[]
  priceModifier: number // En pourcentage ou montant fixe
  priority: number
}

export interface PriceCondition {
  field: string
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in'
  value: any
}

// === CONFIGURATION ===
export interface TaxConfiguration {
  defaultRate: number
  regions: TaxRegion[]
}

export interface TaxRegion {
  code: string
  name: string
  rate: number
}

export interface DiscountConfiguration {
  volumeDiscounts: VolumeDiscount[]
  seasonalDiscounts: SeasonalDiscount[]
  customerTypeDiscounts: CustomerTypeDiscount[]
}

export interface VolumeDiscount {
  minQuantity: number
  maxQuantity?: number
  discountPercentage: number
}

export interface SeasonalDiscount {
  name: string
  startDate: string
  endDate: string
  discountPercentage: number
  applicableCategories?: string[]
}

export interface CustomerTypeDiscount {
  customerType: string
  discountPercentage: number
}

// === PARAMÈTRES DE CALCUL ===
export interface QuoteCalculatorOptions {
  taxRate?: number
  discountRules?: DiscountConfiguration
  currency: string
  locale: string
  roundingPrecision: number
}

export interface QuoteCalculatorResult {
  calculation: QuoteCalculation
  validationErrors: ValidationError[]
  warnings: string[]
  metadata: {
    calculatedAt: string
    version: string
    processingTime: number
  }
}

export interface ValidationError {
  field: string
  message: string
  code: string
  severity: 'error' | 'warning'
}