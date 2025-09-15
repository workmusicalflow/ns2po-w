/**
 * Package de base de données NS2PO
 * Client Turso avec services métier
 */

export * from './client'
export * from './services/customers'
export * from './services/orders'
export * from './services/payment-instructions'
export { runMigrations } from './migrate'

// Utility functions
export { generateId, formatDateForDB, stringifyForDB } from './utils/helpers'
export { 
  generateTrackingReference, 
  parseTrackingReference, 
  isValidTrackingReference,
  generateTrackingUrl,
  formatReferenceForDisplay,
  type TrackingReference 
} from './utils/references'

// Types utilitaires pour la base de données
export interface DatabaseConfig {
  url: string
  authToken?: string
}

export interface QueryResult<T = any> {
  rows: T[]
  rowsAffected: number
  lastInsertRowid?: number
}

// Réexporter les types des services
export type { 
  DBCustomer, 
  CreateCustomerData 
} from './services/customers'

export type { 
  DBOrder, 
  CreateOrderData 
} from './services/orders'

export type { 
  DBPaymentInstruction, 
  DBCommercialContact,
  PaymentInstructionData 
} from './services/payment-instructions'