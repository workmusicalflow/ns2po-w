/**
 * Service Airtable pour NS2PO Election MVP
 * Gestion du catalogue de produits via Airtable API
 */

import Airtable from 'airtable'
import type { 
  AirtableProduct, 
  AirtableCategory, 
  AirtablePriceRule,
  Product,
  Category,
  PriceRule
} from '@ns2po/types'

export class AirtableService {
  private base: Airtable.Base
  
  constructor() {
    // Configuration Airtable depuis les variables d'environnement
    Airtable.configure({
      apiKey: process.env.AIRTABLE_API_KEY
    })
    
    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_BASE_ID is required')
    }
    
    this.base = Airtable.base(process.env.AIRTABLE_BASE_ID)
  }

  /**
   * Récupère tous les produits actifs depuis Airtable
   */
  async getProducts(): Promise<Product[]> {
    try {
      const records = await this.base('Products')
        .select({
          filterByFormula: '{IsActive} = TRUE()',
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all()

      return records.map(record => this.transformAirtableProduct(record as any))
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error)
      throw new Error('Impossible de récupérer les produits')
    }
  }

  /**
   * Récupère un produit spécifique par ID
   */
  async getProduct(id: string): Promise<Product | null> {
    try {
      const record = await this.base('Products').find(id)
      return this.transformAirtableProduct(record as any)
    } catch (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error)
      return null
    }
  }

  /**
   * Récupère toutes les catégories actives
   */
  async getCategories(): Promise<Category[]> {
    try {
      const records = await this.base('Categories')
        .select({
          filterByFormula: '{IsActive} = TRUE()',
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all()

      return records.map(record => this.transformAirtableCategory(record as any))
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
      throw new Error('Impossible de récupérer les catégories')
    }
  }

  /**
   * Récupère les règles de prix pour un produit
   */
  async getPriceRules(productId: string): Promise<PriceRule[]> {
    try {
      const records = await this.base('PriceRules')
        .select({
          filterByFormula: `AND(FIND("${productId}", {ProductId}), {IsActive} = TRUE())`,
          sort: [{ field: 'MinQuantity', direction: 'asc' }]
        })
        .all()

      return records.map(record => this.transformAirtablePriceRule(record as any))
    } catch (error) {
      console.error(`Erreur lors de la récupération des règles de prix pour ${productId}:`, error)
      return []
    }
  }

  /**
   * Récupère les produits par catégorie
   */
  async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    try {
      const records = await this.base('Products')
        .select({
          filterByFormula: `AND({Category} = "${categorySlug}", {IsActive} = TRUE())`,
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all()

      return records.map(record => this.transformAirtableProduct(record as any))
    } catch (error) {
      console.error(`Erreur lors de la récupération des produits pour la catégorie ${categorySlug}:`, error)
      return []
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
      )`

      const records = await this.base('Products')
        .select({
          filterByFormula: searchFormula,
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all()

      return records.map(record => this.transformAirtableProduct(record as any))
    } catch (error) {
      console.error(`Erreur lors de la recherche de produits avec "${query}":`, error)
      return []
    }
  }

  /**
   * Transforme un enregistrement Airtable Product en objet Product
   */
  private transformAirtableProduct(record: AirtableProduct): Product {
    const fields = record.fields
    
    return {
      id: record.id,
      name: fields.name || '',
      category: fields.category || '',
      basePrice: fields.basePrice || 0,
      minQuantity: fields.minQuantity || 1,
      maxQuantity: fields.maxQuantity || 10000,
      description: fields.description || '',
      image: fields.image?.[0]?.url,
      tags: fields.tags || [],
      isActive: fields.isActive || false
    }
  }

  /**
   * Transforme un enregistrement Airtable Category en objet Category
   */
  private transformAirtableCategory(record: AirtableCategory): Category {
    const fields = record.fields
    
    return {
      id: record.id,
      name: fields.name || '',
      description: fields.description || '',
      slug: fields.slug || '',
      isActive: fields.isActive || false
    }
  }

  /**
   * Transforme un enregistrement Airtable PriceRule en objet PriceRule
   */
  private transformAirtablePriceRule(record: AirtablePriceRule): PriceRule {
    const fields = record.fields
    
    return {
      id: record.id,
      productId: fields.productId?.[0] || '',
      minQuantity: fields.minQuantity || 0,
      maxQuantity: fields.maxQuantity || 0,
      pricePerUnit: fields.pricePerUnit || 0,
      discount: fields.discount,
      isActive: fields.isActive || false
    }
  }
}

// Instance singleton du service
export const airtableService = new AirtableService()