/**
 * Types centralisés pour les réponses API
 * Résout les erreurs TypeScript liées aux types manquants et désynchronisés
 */

// =====================================
// TYPES DE BASE API
// =====================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  source?: 'turso' | 'static' | 'cache' | 'airtable';
  duration?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode?: number;
}

// =====================================
// TYPES SPÉCIFIQUES PAR DOMAINE
// =====================================

// Bundle API
export interface BundleApiResponse extends ApiResponse<CampaignBundle[]> {
  pagination: PaginationInfo;
  warning?: string;
}

export interface SingleBundleApiResponse extends ApiResponse<CampaignBundle> {
  warning?: string;
}

// Product API
export interface ProductApiResponse extends ApiResponse<Product[]> {
  pagination?: PaginationInfo;
  source?: 'turso' | 'static';
}

export interface SingleProductApiResponse extends ApiResponse<Product> {
  source?: 'turso' | 'static';
}

// Category API
export interface CategoryApiResponse extends ApiResponse<Category[]> {
  pagination?: PaginationInfo;
}

export interface SingleCategoryApiResponse extends ApiResponse<Category> {}

// Realisation API
export interface RealisationApiResponse extends ApiResponse<Realisation[]> {
  pagination?: PaginationInfo;
}

export interface SingleRealisationApiResponse extends ApiResponse<Realisation> {}

// Health Check API
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    turso: ServiceHealth;
    cloudinary?: ServiceHealth;
    smtp?: ServiceHealth;
  };
  metrics?: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
  lastCheck?: string;
}

// Sync API
export interface SyncApiResponse extends ApiResponse<SyncResult> {
  duration: number;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsFailed: number;
  errors?: string[];
  timestamp: string;
}

// =====================================
// TYPES PRODUITS CORRIGÉS
// =====================================

/**
 * Interface Product unifiée
 * Résout le conflit price vs basePrice
 */
export interface Product {
  id: string;
  name: string;
  reference?: string; // Ajout de la propriété manquante
  category_id?: string; // Pour compatibilité avec la DB
  category?: string; // Nom de la catégorie
  price: number; // Unifié : on utilise price partout
  minQuantity: number;
  maxQuantity: number;
  description?: string;
  image_url?: string; // Ajout de la propriété manquante
  image?: string; // Alias pour compatibilité
  tags?: string[];
  status: 'active' | 'inactive' | 'draft';
  isActive?: boolean; // Alias pour compatibilité
  customizationOptions?: CustomizationOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: "color" | "text" | "logo" | "position";
  values?: string[];
  price?: number;
  required?: boolean;
  options?: string[];
  priceModifier?: number;
}

// =====================================
// TYPES BUNDLES CORRIGÉS
// =====================================

export interface CampaignBundle {
  id: string;
  name: string;
  description: string;
  targetAudience: BundleTargetAudience;
  budgetRange: BundleBudgetRange;
  products: BundleProduct[];
  estimatedTotal: number;
  originalTotal?: number;
  savings?: number;
  popularity: number;
  isActive: boolean;
  isFeatured?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  version?: number;
  icon?: string; // Propriétés manquantes ajoutées
  color?: string;
  displayOrder?: number;
}

export interface BundleProduct {
  id: string;
  name: string;
  basePrice: number;
  price?: number; // Alias pour compatibilité
  quantity: number;
  subtotal: number;
  image_url?: string;
  isRequired?: boolean;
}

export type BundleTargetAudience = 'local' | 'regional' | 'national' | 'universal';
export type BundleBudgetRange = 'starter' | 'medium' | 'standard' | 'premium' | 'enterprise';

// =====================================
// TYPES CATEGORIES
// =====================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  display_order?: number;
  icon?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================
// TYPES REALISATIONS
// =====================================

export interface Realisation {
  id: string;
  title: string;
  description?: string;
  cloudinaryPublicIds: string[];
  cloudinaryUrls?: string[]; // Propriété manquante ajoutée
  productIds: string[];
  categoryIds: string[];
  customizationOptionIds?: string[];
  tags: string[];
  isFeatured: boolean;
  order?: number;
  isActive: boolean;
  source?: 'airtable' | 'cloudinary-auto-discovery' | 'turso';
  products?: Product[]; // Relations enrichies
  categories?: Category[];
  customizationOptions?: CustomizationOption[];
  createdAt?: string;
  updatedAt?: string;
}

// =====================================
// TYPES FORMULAIRES
// =====================================

export interface FormValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormSubmitResponse<T = any> extends ApiResponse<T> {
  validationErrors?: FormValidationError[];
}

// =====================================
// TYPES UTILITAIRES
// =====================================

/**
 * Type helper pour les refs Vue typés
 * Usage: const items = ref<RefArray<Product>>([])
 */
export type RefArray<T> = T[];

/**
 * Type pour les événements DOM typés
 */
export type InputEvent = Event & {
  target: HTMLInputElement;
};

export type SelectEvent = Event & {
  target: HTMLSelectElement;
};

export type FormEvent = Event & {
  target: HTMLFormElement;
};

// =====================================
// EXPORTS DE COMPATIBILITÉ
// =====================================

// Re-export des types depuis packages/types si nécessaire
export type {
  CustomerInfo,
  QuoteRequest,
  QuoteItem,
  ContactFormData,
  PreorderFormData
} from '@ns2po/types';