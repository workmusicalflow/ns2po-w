/**
 * Schema TypeScript pour les Assets Cache (Turso)
 * Aligné avec la migration 001-assets-cache.sql
 */

export interface AssetCache {
  id?: number;
  
  // Identifiants et références
  airtable_id: string;
  cloudinary_public_id: string;
  cloudinary_url: string;
  
  // Métadonnées de base
  name: string;
  category: AssetCategory;
  subcategory: string;
  
  // Statut et workflow
  status: AssetStatus;
  
  // Métadonnées business (JSON flexibles)
  business_metadata?: AssetBusinessMetadata;
  
  // Transformations Cloudinary disponibles
  transformations?: CloudinaryTransformation[];
  
  // Métadonnées techniques
  upload_source?: UploadSource;
  uploaded_by?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  last_sync?: string;
  last_cache_invalidation?: string;
  
  // Performance et search
  search_vector?: string;
}

export type AssetCategory = 'products' | 'logos' | 'backgrounds' | 'icons';

export type AssetStatus = 'active' | 'draft' | 'archived' | 'processing';

export type UploadSource = 'freepik' | 'custom' | 'client';

export interface AssetBusinessMetadata {
  // Métadonnées produits
  price_base?: number;
  min_quantity?: number;
  
  // Métadonnées logos
  brand_name?: string;
  usage_rights?: string;
  
  // Métadonnées backgrounds
  theme?: string;
  primary_color?: string;
  
  // Métadonnées icons
  icon_set?: string;
  style?: string;
}

export interface CloudinaryTransformation {
  name: string;
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
  format?: string;
  url: string;
}

export interface SyncLog {
  id?: number;
  
  // Référence asset
  asset_cache_id?: number;
  airtable_id: string;
  
  // Détails de l'opération
  operation: SyncOperation;
  sync_direction: SyncDirection;
  
  // Statut et erreurs
  status: SyncStatus;
  error_message?: string;
  retry_count: number;
  
  // Métadonnées de sync
  sync_data?: Record<string, any>;
  
  // Timestamps
  created_at?: string;
  completed_at?: string;
}

export type SyncOperation = 'create' | 'update' | 'delete' | 'invalidate';
export type SyncDirection = 'airtable_to_turso' | 'turso_to_airtable';
export type SyncStatus = 'success' | 'error' | 'pending' | 'retry';

export interface AssetPerformance {
  id?: number;
  
  // Référence asset
  asset_cache_id: number;
  cloudinary_public_id: string;
  
  // Métriques de performance
  load_time_ms?: number;
  cache_hit_ratio?: number;
  transformation_time_ms?: number;
  
  // Utilisation
  view_count: number;
  download_count: number;
  last_accessed?: string;
  
  // Bande passante
  bandwidth_used_kb: number;
  
  // Période de mesure
  measurement_date?: string;
}

// Interfaces pour les vues (READ-ONLY)
export interface AssetStats {
  category: AssetCategory;
  subcategory: string;
  status: AssetStatus;
  count: number;
  last_update: string;
  avg_price?: number;
}

export interface SyncHealth {
  sync_date: string;
  status: SyncStatus;
  operation: SyncOperation;
  count: number;
  avg_duration_seconds?: number;
}

// Types pour les requêtes et filtres
export interface AssetFilters {
  category?: AssetCategory[];
  subcategory?: string[];
  status?: AssetStatus[];
  upload_source?: UploadSource[];
  created_after?: string;
  created_before?: string;
  has_business_metadata?: boolean;
  search_query?: string;
}

export interface AssetSortOptions {
  field: keyof AssetCache;
  direction: 'asc' | 'desc';
}

// Utilitaires de validation
export const VALID_CATEGORIES: AssetCategory[] = ['products', 'logos', 'backgrounds', 'icons'];
export const VALID_STATUSES: AssetStatus[] = ['active', 'draft', 'archived', 'processing'];
export const VALID_UPLOAD_SOURCES: UploadSource[] = ['freepik', 'custom', 'client'];

export function isValidCategory(category: string): category is AssetCategory {
  return VALID_CATEGORIES.includes(category as AssetCategory);
}

export function isValidStatus(status: string): status is AssetStatus {
  return VALID_STATUSES.includes(status as AssetStatus);
}

export function isValidUploadSource(source: string): source is UploadSource {
  return VALID_UPLOAD_SOURCES.includes(source as UploadSource);
}

// Helpers pour parsing des métadonnées JSON
export function parseBusinessMetadata(jsonString?: string): AssetBusinessMetadata | undefined {
  if (!jsonString) return undefined;
  
  try {
    return JSON.parse(jsonString) as AssetBusinessMetadata;
  } catch {
    return undefined;
  }
}

export function stringifyBusinessMetadata(metadata?: AssetBusinessMetadata): string | undefined {
  if (!metadata) return undefined;
  
  try {
    return JSON.stringify(metadata);
  } catch {
    return undefined;
  }
}

export function parseTransformations(jsonString?: string): CloudinaryTransformation[] {
  if (!jsonString) return [];
  
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function stringifyTransformations(transformations?: CloudinaryTransformation[]): string | undefined {
  if (!transformations || transformations.length === 0) return undefined;
  
  try {
    return JSON.stringify(transformations);
  } catch {
    return undefined;
  }
}