/**
 * Types pour le système et les APIs
 */

export interface ApiResponse<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: ApiError
  readonly meta?: ApiMeta
}

export interface ApiError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

export interface ApiMeta {
  readonly page?: number
  readonly limit?: number
  readonly total?: number
  readonly hasNext?: boolean
  readonly hasPrev?: boolean
}

export interface PaginationParams {
  readonly page?: number
  readonly pageSize?: number
  readonly limit?: number
  readonly total?: number
  readonly sortBy?: string
  readonly sortOrder?: SortOrder
}

export interface FilterParams {
  readonly search?: string
  readonly status?: string
  readonly dateFrom?: Date
  readonly dateTo?: Date
  readonly [key: string]: unknown
}

export interface AuditLog {
  readonly id: string
  readonly utilisateurId: string
  readonly action: ActionAudit
  readonly ressource: string
  readonly ressourceId: string
  readonly anciennesValeurs?: Record<string, unknown>
  readonly nouvellesValeurs?: Record<string, unknown>
  readonly dateAction: Date
  readonly adresseIp: string
}

export interface ConfigurationSysteme {
  readonly id: string
  readonly cle: string
  readonly valeur: string
  readonly description: string
  readonly type: TypeConfiguration
  readonly modifiable: boolean
  readonly dateModification: Date
}

// Enums
export const SortOrder = {
  asc: 'asc',
  desc: 'desc'
} as const

export const ActionAudit = {
  CREATION: 'CREATION',
  MODIFICATION: 'MODIFICATION',
  SUPPRESSION: 'SUPPRESSION',
  CONSULTATION: 'CONSULTATION',
  CONNEXION: 'CONNEXION',
  DECONNEXION: 'DECONNEXION'
} as const

export const TypeConfiguration = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON'
} as const

export const StatutSysteme = {
  OPERATIONNEL: 'OPERATIONNEL',
  MAINTENANCE: 'MAINTENANCE',
  ERREUR: 'ERREUR'
} as const

// Type unions
export type SortOrder = typeof SortOrder[keyof typeof SortOrder]
export type ActionAudit = typeof ActionAudit[keyof typeof ActionAudit]
export type TypeConfiguration = typeof TypeConfiguration[keyof typeof TypeConfiguration]
export type StatutSysteme = typeof StatutSysteme[keyof typeof StatutSysteme]

// Utility types
export type CreateInput<T> = Omit<T, 'id' | 'dateCreation' | 'dateModification'>
export type UpdateInput<T> = Partial<Omit<T, 'id' | 'dateCreation'>>
export type ID = string