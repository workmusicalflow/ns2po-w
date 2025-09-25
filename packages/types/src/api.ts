/**
 * Types centralisés pour les réponses API NS2PO
 */

import type { CampaignBundle } from './bundle'
import type { Product } from './product'
import type { Category } from './product'
import type { Realisation } from './product'

// =====================================
// TYPES DE BASE API
// =====================================

export interface PaginationInfo {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly hasMore: boolean
}

export interface ApiResponse<T = any> {
  readonly success: boolean
  readonly data: T
  readonly error?: string
  readonly message?: string
  readonly source?: 'turso' | 'static' | 'cache' | 'airtable'
  readonly duration?: number
}

// =====================================
// TYPES SPÉCIFIQUES API
// =====================================

export interface BundleApiResponse extends ApiResponse<readonly CampaignBundle[]> {
  readonly pagination: PaginationInfo
  readonly warning?: string
}

export interface SingleBundleApiResponse extends ApiResponse<CampaignBundle> {
  readonly warning?: string
}

export interface ProductApiResponse extends ApiResponse<readonly Product[]> {
  readonly pagination?: PaginationInfo
}

export interface CategoryApiResponse extends ApiResponse<readonly Category[]> {
  readonly pagination?: PaginationInfo
}

export interface RealisationApiResponse extends ApiResponse<readonly Realisation[]> {
  readonly pagination?: PaginationInfo
}

// =====================================
// TYPES SANTÉ ET MONITORING
// =====================================

export interface HealthCheckResponse {
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly timestamp: string
  readonly services: {
    readonly turso: ServiceHealth
    readonly cloudinary?: ServiceHealth
    readonly smtp?: ServiceHealth
  }
  readonly metrics?: {
    readonly responseTime: number
    readonly memoryUsage: number
    readonly cpuUsage?: number
  }
}

export interface ServiceHealth {
  readonly status: 'up' | 'down' | 'degraded'
  readonly responseTime?: number
  readonly error?: string
  readonly lastCheck?: string
}