/**
 * Types pour les bundles (packs) de campagne électorale NS2PO
 */

import type { QuoteItemCatalog } from "./product";

// =====================================
// TYPES BUNDLE PRODUIT
// =====================================

export interface BundleProduct {
  readonly id: string; // ID du produit depuis QuoteItemCatalog
  readonly name: string;
  readonly basePrice: number;
  readonly quantity: number;
  readonly subtotal: number; // quantity * basePrice
}

// =====================================
// TYPES BUNDLE DE CAMPAGNE
// =====================================

export interface CampaignBundle {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly targetAudience: BundleTargetAudience;
  readonly products: readonly BundleProduct[];
  readonly estimatedTotal: number;
  readonly originalTotal?: number; // Si prix de bundle différent de la somme
  readonly savings?: number; // originalTotal - estimatedTotal
  readonly popularity: number; // Score pour le tri/affichage
  readonly isActive: boolean;
  readonly isFeatured?: boolean;
  readonly tags?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

// =====================================
// TYPES SÉLECTION MULTIPLE
// =====================================

export interface ProductSelection {
  readonly productId: string;
  readonly quantity: number;
  readonly addedAt: string;
}

export interface MultiSelectionState {
  readonly selections: Map<string, ProductSelection>;
  readonly totalItems: number;
  readonly totalPrice: number;
  readonly estimatedDeliveryDays?: number;
}

export interface QuoteCart {
  readonly id?: string;
  readonly items: readonly CartItem[];
  readonly subtotal: number;
  readonly taxes?: number;
  readonly total: number;
  readonly currency: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly bundleId?: string; // Si créé à partir d'un bundle
  readonly isCustomized?: boolean; // Si modifié par rapport au bundle original
}

export interface CartItem {
  readonly productId: string;
  readonly name: string;
  readonly basePrice: number;
  readonly quantity: number;
  readonly subtotal: number;
  readonly addedAt: string;
  readonly fromBundle?: string; // ID du bundle d'origine
}

// =====================================
// TYPES CUSTOMISATION DE BUNDLE
// =====================================

export interface BundleCustomization {
  readonly originalBundleId: string;
  readonly modifiedProducts: readonly BundleProduct[];
  readonly addedProducts: readonly BundleProduct[];
  readonly removedProductIds: readonly string[];
  readonly customizationTimestamp: string;
  readonly totalAdjustment: number; // Différence par rapport au bundle original
}

// =====================================
// TYPES MÉTADONNÉES BUNDLE
// =====================================

export interface BundleAnalytics {
  readonly bundleId: string;
  readonly viewCount: number;
  readonly selectionCount: number;
  readonly customizationRate: number; // Pourcentage de customisation
  readonly conversionRate: number; // Taux de conversion en devis
  readonly averageOrderValue: number;
  readonly lastViewedAt: string;
  readonly lastSelectedAt?: string;
}

// =====================================
// ENUMS ET CONSTANTES
// =====================================

export const BundleTargetAudience = {
  LOCAL: "local", // Campagne municipale/locale
  REGIONAL: "regional", // Campagne départementale/régionale
  NATIONAL: "national", // Campagne nationale
  UNIVERSAL: "universal", // Applicable à tous niveaux
} as const;


export const BundleSelectionMode = {
  DIRECT: "direct", // Sélection directe du bundle
  CUSTOMIZE: "customize", // Personnalisation du bundle
  SCRATCH: "scratch", // Construction from scratch
} as const;

export const CartStatus = {
  DRAFT: "draft", // En cours de construction
  READY: "ready", // Prêt pour devis
  QUOTED: "quoted", // Devis généré
  ORDERED: "ordered", // Commande passée
  EXPIRED: "expired", // Session expirée
} as const;

// =====================================
// TYPES UNIONS
// =====================================

export type BundleTargetAudience =
  (typeof BundleTargetAudience)[keyof typeof BundleTargetAudience];


export type BundleSelectionMode =
  (typeof BundleSelectionMode)[keyof typeof BundleSelectionMode];

export type CartStatus = (typeof CartStatus)[keyof typeof CartStatus];

// =====================================
// TYPES UTILITAIRES
// =====================================

export interface BundlePreview {
  readonly id: string;
  readonly name: string;
  readonly estimatedTotal: number;
  readonly productCount: number;
  readonly targetAudience: BundleTargetAudience;
  readonly isFeatured?: boolean;
}

export interface BundleCalculation {
  readonly subtotal: number;
  readonly discountAmount?: number;
  readonly taxAmount?: number;
  readonly total: number;
  readonly savings?: number;
  readonly deliveryEstimate?: number;
}

// =====================================
// TYPES FORMULAIRE DE DEVIS
// =====================================

export interface BundleQuoteRequest {
  readonly id?: string;
  readonly customerInfo: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly organization?: string;
    readonly position?: string;
  };
  readonly items: readonly CartItem[];
  readonly bundleId?: string;
  readonly isCustomized?: boolean;
  readonly totalAmount: number;
  readonly currency: string;
  readonly requestedAt: string;
  readonly urgency?: "standard" | "urgent" | "asap";
  readonly notes?: string;
  readonly status: "pending" | "processing" | "completed" | "expired";
}

