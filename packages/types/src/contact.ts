/**
 * Types pour les formulaires de contact et pré-commandes NS2PO Election MVP
 */

import type { QuoteRequest } from './quote'
import type { CustomerInfo } from './user'

// === TYPES DE CONTACT ===
export type ContactType = 'quote' | 'preorder' | 'custom' | 'support' | 'meeting'

export interface ContactFormData {
  id?: string
  type: ContactType
  customer: CustomerInfo
  subject: string
  message: string
  priority: ContactPriority
  attachments?: ContactAttachment[]
  relatedQuote?: string // ID du devis associé
  preferredContactMethod: ContactMethod
  urgency: UrgencyLevel
  createdAt?: string
  status?: ContactStatus
}

export interface ContactAttachment {
  id: string
  name: string
  url: string
  size: number
  type: string
}

export type ContactPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ContactMethod = 'email' | 'phone' | 'whatsapp'
export type UrgencyLevel = 'normal' | 'urgent' | 'asap'
export type ContactStatus = 'new' | 'pending' | 'in_progress' | 'resolved' | 'closed'

// === PRÉ-COMMANDE ===
export interface PreorderFormData {
  id?: string
  customer: CustomerInfo
  quoteId?: string
  items: PreorderItem[]
  totalAmount: number
  paymentMethod: PaymentMethod
  deliveryInfo: DeliveryInfo
  timeline: Timeline
  specialRequests?: string
  agreedToTerms: boolean
  depositAmount: number
  remainingAmount: number
  status: PreorderStatus
  createdAt?: string
  expectedDelivery?: string
}

export interface PreorderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  customizations: string[]
  totalPrice: number
  specifications?: string
}

export interface DeliveryInfo {
  method: DeliveryMethod
  address: {
    street: string
    city: string
    region: string
    postalCode?: string
    country: string
  }
  contactPerson: string
  contactPhone: string
  deliveryNotes?: string
  preferredTimeSlot?: string
}

export interface Timeline {
  requestedDelivery: string
  deliveryDate?: string // Date de livraison souhaitée
  estimatedProduction: number // en jours
  estimatedDelivery: string
  isRushOrder: boolean
  rushOrderFee?: number
}

export type PaymentMethod = 'bank_transfer' | 'mobile_money' | 'cash' | 'credit_card' | 'check' | 'commercial_contact'
export type DeliveryMethod = 'pickup' | 'delivery' | 'shipping'
export type PreorderStatus = 'draft' | 'submitted' | 'confirmed' | 'in_production' | 'ready' | 'delivered' | 'cancelled' | 'pending_payment' | 'processing'

// === DEMANDES PERSONNALISÉES ===
export interface CustomRequestFormData {
  id?: string
  customer: CustomerInfo
  projectType: CustomProjectType
  description: string
  specifications: CustomSpecification[]
  budget: BudgetRange
  timeline: string
  referenceImages?: string[]
  inspirationLinks?: string[]
  additionalRequirements?: string
  contactPreferences: ContactMethod[]
  status?: CustomRequestStatus
  createdAt?: string
}

export interface CustomSpecification {
  category: string
  requirement: string
  priority: 'must_have' | 'nice_to_have' | 'optional'
  notes?: string
}

export type CustomProjectType = 'merchandise' | 'promotional_items' | 'campaign_materials' | 'custom_design' | 'branding' | 'other'
export type BudgetRange = 'under_100k' | '100k_500k' | '500k_1m' | '1m_5m' | '5m_plus' | 'to_discuss'
export type CustomRequestStatus = 'new' | 'under_review' | 'quote_requested' | 'quote_sent' | 'negotiating' | 'approved' | 'rejected'

// === DEMANDE DE RENDEZ-VOUS ===
export interface MeetingRequestFormData {
  id?: string
  customer: CustomerInfo
  meetingType: MeetingType
  purpose: string
  preferredDates: string[]
  preferredTimes: TimeSlot[]
  duration: MeetingDuration
  location: MeetingLocation
  attendees?: number
  agenda?: string[]
  relatedProject?: string
  preparationNotes?: string
  status?: MeetingStatus
  createdAt?: string
}

export type MeetingType = 'consultation' | 'quote_review' | 'project_planning' | 'follow_up' | 'urgent'
export type TimeSlot = 'morning' | 'afternoon' | 'evening'
export type MeetingDuration = '30min' | '1hour' | '2hours' | 'half_day' | 'full_day'

export interface MeetingLocation {
  type: 'office' | 'client_site' | 'online' | 'phone'
  address?: string
  platform?: string // Pour les meetings en ligne
  notes?: string
}

export type MeetingStatus = 'requested' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'

// === VALIDATION ===
export interface FormValidationRule {
  field: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  customValidator?: (value: any) => boolean
  errorMessage: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: FormFieldError[]
  warnings?: string[]
}

export interface FormFieldError {
  field: string
  message: string
  code: string
}

// === CONFIGURATION ===
export interface ContactFormConfig {
  requiredFields: string[]
  maxAttachmentSize: number
  allowedFileTypes: string[]
  autoResponders: {
    [key in ContactType]?: {
      enabled: boolean
      template: string
      delay?: number
    }
  }
  notificationSettings: {
    email: boolean
    sms: boolean
    webhook?: string
  }
}

// === RÉPONSES API ===
export interface ContactSubmissionResponse {
  success: boolean
  contactId: string
  message: string
  nextSteps?: string[]
  estimatedResponseTime?: string
}

export interface PreorderSubmissionResponse {
  success: boolean
  preorderId: string
  trackingReference: string
  trackingUrl: string
  message: string
  paymentInstructions?: PaymentInstructions
  nextSteps: string[]
  estimatedDelivery: string
}

export interface PaymentInstructions {
  method: PaymentMethod
  amount: number
  reference: string
  details: {
    bankAccount?: string
    mobileMoneyNumber?: string
    instructions: string[]
  }
  dueDate: string
}

// === STATUTS DE PAIEMENT ===
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'processing'