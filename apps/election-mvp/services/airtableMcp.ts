/**
 * Service Airtable utilisant MCP pour NS2PO Election MVP
 * Gestion du catalogue de produits via Airtable MCP
 */

import type { 
  Product,
  Category,
  QuoteRequest,
  CustomerInfo
} from '@ns2po/types'

export class AirtableMcpService {
  private readonly baseId = 'apprQLdnVwlbfnioT'
  private readonly tables = {
    products: 'tbldm6u6qQczFxwvC',
    categories: 'tbl6256phyErcfr5d', 
    priceRules: 'tblB1CuG4pE19g1mo',
    quotes: 'tblc4jdvtaibNah1i'
  }

  /**
   * Récupère tous les produits actifs depuis Airtable
   */
  async getProducts(): Promise<Product[]> {
    try {
      // Utilisation du MCP Airtable pour récupérer les records
      const response = await $fetch('/api/airtable/products') as any
      return (response as any).data || []
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
      const response = await $fetch(`/api/airtable/products/${id}`) as any
      return (response as any).data || null
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
      const response = await $fetch('/api/airtable/categories') as any
      return (response as any).data || []
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error)
      throw new Error('Impossible de récupérer les catégories')
    }
  }

  /**
   * Recherche de produits par nom ou tags
   */
  async searchProducts(query: string): Promise<Product[]> {
    try {
      const response = await $fetch('/api/airtable/products/search', {
        query: { q: query }
      }) as any
      return (response as any).data || []
    } catch (error) {
      console.error(`Erreur lors de la recherche de produits avec "${query}":`, error)
      return []
    }
  }

  /**
   * Sauvegarde un devis en Airtable
   */
  async saveQuote(quote: Omit<QuoteRequest, 'id'>): Promise<string | null> {
    try {
      const response = await $fetch('/api/airtable/quotes', {
        method: 'POST',
        body: quote
      }) as any
      return (response as any).id || null
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du devis:', error)
      return null
    }
  }

  /**
   * Transforme un record Airtable en objet Product
   */
  private transformAirtableProduct(record: any): Product {
    const fields = record.fields || {}
    
    return {
      id: record.id,
      name: fields.Name || '',
      category: fields.Category || '',
      basePrice: fields.BasePrice || 0,
      minQuantity: fields.MinQuantity || 1,
      maxQuantity: fields.MaxQuantity || 10000,
      description: fields.Description || '',
      image: fields.Image?.[0]?.url,
      tags: fields.Tags || [],
      isActive: fields.IsActive || false
    }
  }

  /**
   * Transforme un record Airtable en objet Category
   */
  private transformAirtableCategory(record: any): Category {
    const fields = record.fields || {}
    
    return {
      id: record.id,
      name: fields.Name || '',
      description: fields.Description || '',
      slug: fields.Slug || '',
      isActive: fields.IsActive || false
    }
  }
}

// Instance singleton du service
export const airtableMcpService = new AirtableMcpService()