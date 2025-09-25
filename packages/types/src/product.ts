/**
 * Types pour le catalogue de produits NS2PO
 */

// =====================================
// TYPES AIRTABLE
// =====================================

export interface AirtableProduct {
  readonly id: string;
  readonly fields: {
    readonly name?: string;
    readonly category?: string;
    readonly basePrice?: number;
    readonly minQuantity?: number;
    readonly maxQuantity?: number;
    readonly description?: string;
    readonly image?: readonly AirtableAttachment[];
    readonly isActive?: boolean;
    readonly tags?: readonly string[];
  };
}

export interface AirtableAttachment {
  readonly id: string;
  readonly url: string;
  readonly filename: string;
  readonly size: number;
  readonly type: string;
  readonly width?: number;
  readonly height?: number;
}

export interface AirtableCategory {
  readonly id: string;
  readonly fields: {
    readonly name?: string;
    readonly description?: string;
    readonly slug?: string;
    readonly isActive?: boolean;
  };
}

export interface AirtablePriceRule {
  readonly id: string;
  readonly fields: {
    readonly productId?: readonly string[];
    readonly minQuantity?: number;
    readonly maxQuantity?: number;
    readonly pricePerUnit?: number;
    readonly discount?: number;
    readonly isActive?: boolean;
  };
}

export interface AirtableQuoteItemCatalog {
  readonly id: string;
  readonly fields: {
    readonly name?: string;
    readonly category?: string;
    readonly base_price?: number;
    readonly min_quantity?: number;
    readonly status?: string;
  };
}

// =====================================
// TYPES PRODUITS TRANSFORMÉS
// =====================================

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly reference?: string; // Propriété ajoutée pour les formulaires admin
  readonly category: string;
  readonly category_id?: string; // Propriété ajoutée pour la DB
  readonly basePrice: number;
  readonly price?: number; // Alias pour unifier avec l'usage dans l'app
  readonly minQuantity: number;
  readonly maxQuantity: number;
  readonly description: string;
  readonly image?: string;
  readonly image_url?: string; // Propriété ajoutée pour Cloudinary
  readonly tags: readonly string[];
  readonly isActive: boolean;
  readonly status?: 'active' | 'inactive' | 'draft'; // Propriété ajoutée pour les formulaires
  readonly customizationOptions?: readonly CustomizationOption[];
}

export interface CustomizationOption {
  readonly id: string;
  readonly name: string;
  readonly type: "color" | "text" | "logo" | "position";
  readonly values?: readonly string[];
  readonly price?: number;
  readonly required?: boolean;
  readonly options?: readonly string[];
  readonly priceModifier?: number;
}

export interface Category {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly slug: string;
  readonly isActive: boolean;
}

export interface ProductPriceRule {
  readonly id: string;
  readonly productId: string;
  readonly minQuantity: number;
  readonly maxQuantity: number;
  readonly pricePerUnit: number;
  readonly discount?: number;
  readonly isActive: boolean;
}

export interface QuoteItemCatalog {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly basePrice: number;
  readonly minQuantity: number;
  readonly status: "Active" | "Inactive";
}

// =====================================
// TYPES PERSONNALISATION
// =====================================

export interface LogoCustomization {
  readonly id: string;
  readonly url: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation?: number;
  readonly opacity?: number;
}

export interface ProductCustomization {
  readonly logos?: readonly LogoCustomization[];
  readonly text?: string;
  readonly colors?: readonly string[];
  readonly position?: CustomizationPosition;
}

// =====================================
// TYPES RÉALISATIONS
// =====================================

export interface AirtableRealisation {
  readonly id: string;
  readonly fields: {
    readonly title?: string;
    readonly description?: string;
    readonly cloudinaryPublicIds?: readonly string[];
    readonly products?: readonly string[]; // IDs des produits liés
    readonly categories?: readonly string[]; // IDs des catégories liées
    readonly customizationOptions?: readonly string[]; // IDs des options de personnalisation utilisées
    readonly tags?: readonly string[];
    readonly isFeatured?: boolean;
    readonly order?: number;
    readonly isActive?: boolean;
  };
}

export interface Realisation {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly cloudinaryPublicIds: readonly string[];
  readonly productIds: readonly string[];
  readonly categoryIds: readonly string[];
  readonly customizationOptionIds: readonly string[];
  readonly tags: readonly string[];
  readonly isFeatured: boolean;
  readonly order?: number;
  readonly isActive: boolean;
  // Relations enrichies par l'API (optionnelles pour éviter les requêtes en cascade côté client)
  readonly products?: readonly Product[];
  readonly categories?: readonly Category[];
  readonly customizationOptions?: readonly CustomizationOption[];
}

// Interface hybride pour la solution auto-discovery + Airtable
export interface HybridRealisation extends Realisation {
  readonly source: "airtable" | "cloudinary-auto-discovery";
  readonly cloudinaryUrls?: readonly string[];
  readonly cloudinaryMetadata?: {
    readonly publicId: string;
    readonly format: string;
    readonly width: number;
    readonly height: number;
    readonly bytes: number;
    readonly createdAt: string;
    readonly url: string;
  };
}

// Interface pour les vues simplifiées (cartes, listes)
export interface RealisationPreview {
  readonly id: string;
  readonly title: string;
  readonly cloudinaryPublicId: string; // Première image seulement
  readonly productIds: readonly string[];
  readonly tags: readonly string[];
  readonly isFeatured: boolean;
}

// Interface pour le contexte d'inspiration dans le parcours utilisateur
export interface InspirationContext {
  readonly realisationId: string;
  readonly realisationTitle: string;
  readonly productId: string;
  readonly timestamp: string;
}

// =====================================
// ENUMS
// =====================================

export const CustomizationPosition = {
  FRONT: "FRONT",
  BACK: "BACK",
  SLEEVE: "SLEEVE",
  CHEST: "CHEST",
} as const;

// QuoteStatus est maintenant défini dans quote.ts

export const ProductCategory = {
  TEXTILE: "TEXTILE",
  GADGET: "GADGET",
  EPI: "EPI",
  ACCESSOIRE: "ACCESSOIRE",
} as const;

// =====================================
// TYPES CONTACTS COMMERCIAUX
// =====================================

export interface CommercialContact {
  readonly id: string;
  readonly name: string;
  readonly role: "sales" | "manager" | "support";
  readonly mobilePhone: string;
  readonly fixedPhone?: string;
  readonly email?: string;
  readonly specialties: readonly string[];
  readonly availabilityHours: {
    readonly lundi_vendredi?: string;
    readonly samedi?: string;
    readonly dimanche?: string;
    readonly weekend?: string;
    readonly urgences?: string;
  };
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// Interface pour les données brutes de la DB Turso
export interface TursoCommercialContact {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly mobile_phone: string;
  readonly fixed_phone?: string;
  readonly email?: string;
  readonly specialties: string; // JSON string
  readonly availability_hours: string; // JSON string
  readonly is_active: number; // SQLite boolean as integer
  readonly created_at: string;
  readonly updated_at: string;
}

// =====================================
// ENUMS CONTACTS
// =====================================

export const ContactRole = {
  SALES: "sales",
  MANAGER: "manager",
  SUPPORT: "support",
} as const;

// Type unions
export type CustomizationPosition =
  (typeof CustomizationPosition)[keyof typeof CustomizationPosition];
export type ProductCategory =
  (typeof ProductCategory)[keyof typeof ProductCategory];
export type ContactRole = (typeof ContactRole)[keyof typeof ContactRole];
