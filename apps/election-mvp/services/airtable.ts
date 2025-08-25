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
} from "@ns2po/types";

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
}

// Instance singleton du service
export const airtableService = new AirtableService();
