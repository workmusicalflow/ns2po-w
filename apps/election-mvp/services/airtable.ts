/**
 * Service Airtable pour NS2PO Election MVP
 * Gestion du catalogue de produits via Airtable API
 */

import Airtable from "airtable";
import type {
  AirtableProduct,
  AirtableCategory,
  AirtablePriceRule,
  AirtableQuoteItemCatalog,
  Product,
  Category,
  ProductPriceRule,
  QuoteItemCatalog,
  CampaignBundle,
  BundleProduct,
} from "@ns2po/types";

// =====================================
// TYPES AIRTABLE CAMPAIGN BUNDLES
// =====================================

interface AirtableCampaignBundle {
  id: string;
  fields: {
    name?: string;
    bundle_id?: string;
    description?: string;
    target_audience?: string;
    budget_range?: string;
    estimated_total?: number;
    original_total?: number;
    savings?: number;
    popularity?: number;
    is_active?: boolean;
    is_featured?: boolean;
    tags?: string[];
    bundle_products?: string[]; // IDs des BundleProducts liés
    created_time?: string;
    last_modified?: string;
    sync_status?: string;
  };
}

interface AirtableBundleProduct {
  id: string;
  fields: {
    product_name?: string;
    product_id?: string;
    base_price?: number;
    quantity?: number;
    subtotal?: number;
    campaign_bundle?: string[]; // IDs des CampaignBundles liés
    linked_product?: string[]; // IDs des Products liés
    display_order?: number;
    created_time?: string;
    last_modified?: string;
  };
}

export class AirtableService {
  private base: Airtable.Base;

  constructor() {
    // Configuration Airtable depuis les variables d'environnement
    Airtable.configure({
      apiKey: process.env.AIRTABLE_API_KEY,
    });

    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error("AIRTABLE_BASE_ID is required");
    }

    this.base = Airtable.base(process.env.AIRTABLE_BASE_ID);
  }

  /**
   * Récupère tous les produits actifs depuis Airtable
   */
  async getProducts(): Promise<Product[]> {
    try {
      const records = await this.base("Products")
        .select({
          filterByFormula: "{IsActive} = TRUE()",
          sort: [{ field: "Name", direction: "asc" }],
        })
        .all();

      return records.map((record) =>
        this.transformAirtableProduct(record as any)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des produits:", error);
      throw new Error("Impossible de récupérer les produits");
    }
  }

  /**
   * Récupère un produit spécifique par ID
   */
  async getProduct(id: string): Promise<Product | null> {
    try {
      const record = await this.base("Products").find(id);
      return this.transformAirtableProduct(record as any);
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      return null;
    }
  }

  /**
   * Récupère toutes les catégories actives
   */
  async getCategories(): Promise<Category[]> {
    try {
      const records = await this.base("Categories")
        .select({
          filterByFormula: "{IsActive} = TRUE()",
          sort: [{ field: "Name", direction: "asc" }],
        })
        .all();

      return records.map((record) =>
        this.transformAirtableCategory(record as any)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories:", error);
      throw new Error("Impossible de récupérer les catégories");
    }
  }

  /**
   * Récupère les règles de prix pour un produit
   */
  async getPriceRules(productId: string): Promise<ProductPriceRule[]> {
    try {
      const records = await this.base("PriceRules")
        .select({
          filterByFormula: `AND(FIND("${productId}", {ProductId}), {IsActive} = TRUE())`,
          sort: [{ field: "MinQuantity", direction: "asc" }],
        })
        .all();

      return records.map((record) =>
        this.transformAirtablePriceRule(record as any)
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des règles de prix pour ${productId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Récupère les produits par catégorie
   */
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    try {
      const records = await this.base("Products")
        .select({
          filterByFormula: `AND({Category} = "${categorySlug}", {IsActive} = TRUE())`,
          sort: [{ field: "Name", direction: "asc" }],
        })
        .all();

      return records.map((record) =>
        this.transformAirtableProduct(record as any)
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération des produits pour la catégorie ${categorySlug}:`,
        error
      );
      return [];
    }
  }

  /**
   * Recherche de produits par nom ou tags
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const searchFormula = `AND(
        OR(
          FIND(UPPER("${query}"), UPPER({Name})),
          FIND(UPPER("${query}"), UPPER({Description})),
          FIND(UPPER("${query}"), UPPER(ARRAYJOIN({Tags}, ",")))
        ),
        {IsActive} = TRUE()
      )`;

      const records = await this.base("Products")
        .select({
          filterByFormula: searchFormula,
          sort: [{ field: "Name", direction: "asc" }],
        })
        .all();

      return records.map((record) =>
        this.transformAirtableProduct(record as any)
      );
    } catch (error) {
      console.error(
        `Erreur lors de la recherche de produits avec "${query}":`,
        error
      );
      return [];
    }
  }

  /**
   * Récupère tous les items de devis actifs depuis Airtable (utilise la table Products)
   */
  async getQuoteItems(): Promise<QuoteItemCatalog[]> {
    try {
      const records = await this.base("Products")
        .select({
          filterByFormula: "{IsActive} = TRUE()",
          sort: [{ field: "Name", direction: "asc" }],
        })
        .all();

      return records.map((record) =>
        this.transformProductToQuoteItem(record as any)
      );
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des items de devis:",
        error
      );
      throw new Error("Impossible de récupérer les items de devis");
    }
  }

  // =====================================
  // MÉTHODES CAMPAIGN BUNDLES
  // =====================================

  /**
   * Récupère tous les campaign bundles actifs depuis Airtable
   */
  async getCampaignBundles(): Promise<CampaignBundle[]> {
    try {
      const records = await this.base("CampaignBundles")
        .select({
          filterByFormula: "{is_active} = TRUE()",
          sort: [
            { field: "is_featured", direction: "desc" },
            { field: "popularity", direction: "desc" }
          ],
        })
        .all();

      const bundles: CampaignBundle[] = [];

      for (const record of records) {
        const bundle = await this.transformAirtableCampaignBundle(record as any);
        if (bundle) {
          bundles.push(bundle);
        }
      }

      return bundles;
    } catch (error) {
      console.error("Erreur lors de la récupération des campaign bundles:", error);
      throw new Error("Impossible de récupérer les campaign bundles");
    }
  }

  /**
   * Récupère un campaign bundle spécifique par ID
   */
  async getCampaignBundle(id: string): Promise<CampaignBundle | null> {
    try {
      const record = await this.base("CampaignBundles").find(id);
      return await this.transformAirtableCampaignBundle(record as any);
    } catch (error) {
      console.error(`Erreur lors de la récupération du campaign bundle ${id}:`, error);
      return null;
    }
  }

  /**
   * Récupère un campaign bundle par bundle_id
   */
  async getCampaignBundleByBundleId(bundleId: string): Promise<CampaignBundle | null> {
    try {
      const records = await this.base("CampaignBundles")
        .select({
          filterByFormula: `{bundle_id} = "${bundleId}"`,
          maxRecords: 1,
        })
        .all();

      if (records.length === 0) return null;

      return await this.transformAirtableCampaignBundle(records[0] as any);
    } catch (error) {
      console.error(`Erreur lors de la récupération du bundle ${bundleId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les campaign bundles par target audience
   */
  async getCampaignBundlesByAudience(audience: string): Promise<CampaignBundle[]> {
    try {
      const records = await this.base("CampaignBundles")
        .select({
          filterByFormula: `AND({target_audience} = "${audience}", {is_active} = TRUE())`,
          sort: [
            { field: "is_featured", direction: "desc" },
            { field: "popularity", direction: "desc" }
          ],
        })
        .all();

      const bundles: CampaignBundle[] = [];

      for (const record of records) {
        const bundle = await this.transformAirtableCampaignBundle(record as any);
        if (bundle) {
          bundles.push(bundle);
        }
      }

      return bundles;
    } catch (error) {
      console.error(`Erreur lors de la récupération des bundles pour ${audience}:`, error);
      return [];
    }
  }

  /**
   * Récupère les produits d'un bundle spécifique
   */
  async getBundleProducts(bundleId: string): Promise<BundleProduct[]> {
    try {
      const records = await this.base("BundleProducts")
        .select({
          filterByFormula: `FIND("${bundleId}", ARRAYJOIN({campaign_bundle}, ","))`,
          sort: [{ field: "display_order", direction: "asc" }],
        })
        .all();

      return records.map((record) =>
        this.transformAirtableBundleProduct(record as any)
      );
    } catch (error) {
      console.error(`Erreur lors de la récupération des produits du bundle ${bundleId}:`, error);
      return [];
    }
  }

  /**
   * Invalide le cache d'un bundle spécifique
   */
  async invalidateBundleCache(bundleId: string): Promise<void> {
    try {
      await this.base("CampaignBundles").update(bundleId, {
        last_cache_invalidation: new Date().toISOString(),
        sync_status: "pending",
      });
    } catch (error) {
      console.error(`Erreur lors de l'invalidation du cache pour ${bundleId}:`, error);
      throw new Error("Impossible d'invalider le cache du bundle");
    }
  }

  /**
   * Met à jour le statut de synchronisation d'un bundle
   */
  async updateBundleSyncStatus(bundleId: string, status: "synced" | "pending" | "error"): Promise<void> {
    try {
      await this.base("CampaignBundles").update(bundleId, {
        sync_status: status,
        ...(status === "synced" && { last_cache_invalidation: new Date().toISOString() }),
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut sync pour ${bundleId}:`, error);
      throw new Error("Impossible de mettre à jour le statut de synchronisation");
    }
  }

  /**
   * Transforme un enregistrement Airtable Product en objet Product
   */
  private transformAirtableProduct(record: AirtableProduct): Product {
    const fields = record.fields;

    return {
      id: record.id,
      name: fields.name || "",
      category: fields.category || "",
      basePrice: fields.basePrice || 0,
      minQuantity: fields.minQuantity || 1,
      maxQuantity: fields.maxQuantity || 10000,
      description: fields.description || "",
      image: fields.image?.[0]?.url,
      tags: fields.tags || [],
      isActive: fields.isActive || false,
    };
  }

  /**
   * Transforme un enregistrement Airtable Category en objet Category
   */
  private transformAirtableCategory(record: AirtableCategory): Category {
    const fields = record.fields;

    return {
      id: record.id,
      name: fields.name || "",
      description: fields.description || "",
      slug: fields.slug || "",
      isActive: fields.isActive || false,
    };
  }

  /**
   * Transforme un enregistrement Airtable PriceRule en objet ProductPriceRule
   */
  private transformAirtablePriceRule(
    record: AirtablePriceRule
  ): ProductPriceRule {
    const fields = record.fields;

    return {
      id: record.id,
      productId: fields.productId?.[0] || "",
      minQuantity: fields.minQuantity || 0,
      maxQuantity: fields.maxQuantity || 0,
      pricePerUnit: fields.pricePerUnit || 0,
      discount: fields.discount,
      isActive: fields.isActive || false,
    };
  }

  /**
   * Transforme un enregistrement Airtable Product en objet QuoteItemCatalog
   */
  private transformProductToQuoteItem(
    record: AirtableProduct
  ): QuoteItemCatalog {
    const fields = record.fields as any; // Cast to access actual field names

    return {
      id: record.id,
      name: fields.Name || "",
      category: fields.Category || "",
      basePrice: fields.BasePrice || 0,
      minQuantity: fields.MinQuantity || 1,
      status: fields.IsActive ? "Active" : "Inactive",
    };
  }

  /**
   * Transforme un enregistrement Airtable QuoteItem en objet QuoteItemCatalog
   */
  private transformAirtableQuoteItem(
    record: AirtableQuoteItemCatalog
  ): QuoteItemCatalog {
    const fields = record.fields;

    return {
      id: record.id,
      name: fields.name || "",
      category: fields.category || "",
      basePrice: fields.base_price || 0,
      minQuantity: fields.min_quantity || 1,
      status: (fields.status as "Active" | "Inactive") || "Active",
    };
  }

  // =====================================
  // MÉTHODES DE TRANSFORMATION CAMPAIGN BUNDLES
  // =====================================

  /**
   * Transforme un enregistrement Airtable CampaignBundle en objet CampaignBundle
   */
  private async transformAirtableCampaignBundle(
    record: AirtableCampaignBundle
  ): Promise<CampaignBundle | null> {
    try {
      const fields = record.fields;

      // Récupération des produits du bundle
      const products = await this.getBundleProducts(record.id);

      return {
        id: fields.bundle_id || record.id,
        name: fields.name || "",
        description: fields.description || "",
        targetAudience: (fields.target_audience as any) || "local",
        budgetRange: (fields.budget_range as any) || "starter",
        products,
        estimatedTotal: fields.estimated_total || 0,
        originalTotal: fields.original_total,
        savings: fields.savings,
        popularity: fields.popularity || 0,
        isActive: fields.is_active || false,
        isFeatured: fields.is_featured || false,
        tags: fields.tags || [],
        createdAt: fields.created_time || new Date().toISOString(),
        updatedAt: fields.last_modified || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Erreur transformation CampaignBundle:", error);
      return null;
    }
  }

  /**
   * Transforme un enregistrement Airtable BundleProduct en objet BundleProduct
   */
  private transformAirtableBundleProduct(
    record: AirtableBundleProduct
  ): BundleProduct {
    const fields = record.fields;

    return {
      id: fields.product_id || record.id,
      name: fields.product_name || "",
      basePrice: fields.base_price || 0,
      quantity: fields.quantity || 1,
      subtotal: fields.subtotal || (fields.base_price || 0) * (fields.quantity || 1),
    };
  }
}

// Instance singleton du service
export const airtableService = new AirtableService();
