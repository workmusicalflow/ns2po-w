/**
 * Service de gestion des clients
 */

import type { CustomerInfo, CustomerType } from '@ns2po/types'
import { TursoClient, generateId, formatDateForDB, stringifyForDB, parseDBJson, buildWhereClause, buildQuerySuffix, type QueryOptions } from '../client'

export interface DBCustomer {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  company?: string
  address_line1?: string
  address_line2?: string
  city?: string
  postal_code?: string
  country: string
  customer_type: CustomerType
  tax_number?: string
  is_verified: boolean
  metadata: string // JSON
  created_at: string
  updated_at: string
}

export interface CreateCustomerData {
  email: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postalCode?: string
  country?: string
  customerType?: CustomerType
  taxNumber?: string
  metadata?: Record<string, any>
}

export class CustomersService {
  constructor(private db: TursoClient) {}

  /**
   * Créer un nouveau client
   */
  async create(data: CreateCustomerData): Promise<DBCustomer> {
    const id = generateId('CUST')
    const now = formatDateForDB()

    const customer: Omit<DBCustomer, 'updated_at'> = {
      id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || undefined,
      company: data.company || undefined,
      address_line1: data.addressLine1 || undefined,
      address_line2: data.addressLine2 || undefined,
      city: data.city || undefined,
      postal_code: data.postalCode || undefined,
      country: data.country || 'CI',
      customer_type: data.customerType || 'individual',
      tax_number: data.taxNumber || undefined,
      is_verified: false,
      metadata: stringifyForDB(data.metadata || {}),
      created_at: now
    }

    const result = await this.db.execute(
      `INSERT INTO customers (
        id, email, first_name, last_name, phone, company,
        address_line1, address_line2, city, postal_code, country,
        customer_type, tax_number, is_verified, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.id, customer.email, customer.first_name, customer.last_name,
        customer.phone, customer.company, customer.address_line1, customer.address_line2,
        customer.city, customer.postal_code, customer.country, customer.customer_type,
        customer.tax_number, customer.is_verified, customer.metadata, customer.created_at
      ]
    )

    if (result.rowsAffected === 0) {
      throw new Error('Failed to create customer')
    }

    // Le trigger met à jour updated_at automatiquement
    return { ...customer, updated_at: now }
  }

  /**
   * Trouver un client par email
   */
  async findByEmail(email: string): Promise<DBCustomer | null> {
    const result = await this.db.execute(
      'SELECT * FROM customers WHERE email = ? LIMIT 1',
      [email]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToCustomer(result.rows[0])
  }

  /**
   * Trouver un client par ID
   */
  async findById(id: string): Promise<DBCustomer | null> {
    const result = await this.db.execute(
      'SELECT * FROM customers WHERE id = ? LIMIT 1',
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToCustomer(result.rows[0])
  }

  /**
   * Lister les clients avec options de filtrage et pagination
   */
  async list(options: QueryOptions & {
    customerType?: CustomerType
    isVerified?: boolean
    search?: string
  } = {}): Promise<{ customers: DBCustomer[]; total: number }> {
    const filters: Record<string, any> = {}

    if (options.customerType) {
      filters.customer_type = options.customerType
    }

    if (typeof options.isVerified === 'boolean') {
      filters.is_verified = options.isVerified
    }

    let whereClause = ''
    let params: any[] = []

    if (Object.keys(filters).length > 0) {
      const built = buildWhereClause(filters)
      whereClause = built.clause
      params = built.params
    }

    // Ajouter recherche textuelle si spécifiée
    if (options.search) {
      const searchCondition = `(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)`
      const searchParam = `%${options.search}%`
      
      if (whereClause) {
        whereClause += ` AND ${searchCondition}`
      } else {
        whereClause = `WHERE ${searchCondition}`
      }
      
      params.push(searchParam, searchParam, searchParam, searchParam)
    }

    // Requête pour le total
    const countResult = await this.db.execute(
      `SELECT COUNT(*) as total FROM customers ${whereClause}`,
      params
    )
    const total = Number(countResult.rows[0]?.total || 0)

    // Requête pour les données
    const queryOptions = { ...options, orderBy: options.orderBy || 'created_at', orderDirection: options.orderDirection || 'DESC' }
    const suffix = buildQuerySuffix(queryOptions)

    const result = await this.db.execute(
      `SELECT * FROM customers ${whereClause} ${suffix}`,
      params
    )

    const customers = result.rows.map(row => this.mapRowToCustomer(row))

    return { customers, total }
  }

  /**
   * Mettre à jour un client
   */
  async update(id: string, data: Partial<CreateCustomerData>): Promise<DBCustomer | null> {
    const existing = await this.findById(id)
    if (!existing) {
      return null
    }

    const updates: string[] = []
    const params: any[] = []

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        switch (key) {
          case 'firstName':
            updates.push('first_name = ?')
            params.push(value)
            break
          case 'lastName':
            updates.push('last_name = ?')
            params.push(value)
            break
          case 'customerType':
            updates.push('customer_type = ?')
            params.push(value)
            break
          case 'addressLine1':
            updates.push('address_line1 = ?')
            params.push(value)
            break
          case 'addressLine2':
            updates.push('address_line2 = ?')
            params.push(value)
            break
          case 'postalCode':
            updates.push('postal_code = ?')
            params.push(value)
            break
          case 'taxNumber':
            updates.push('tax_number = ?')
            params.push(value)
            break
          case 'metadata':
            updates.push('metadata = ?')
            params.push(stringifyForDB(value))
            break
          default:
            if (['email', 'phone', 'company', 'city', 'country'].includes(key)) {
              updates.push(`${key} = ?`)
              params.push(value)
            }
        }
      }
    })

    if (updates.length === 0) {
      return existing
    }

    params.push(id)

    await this.db.execute(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    return await this.findById(id)
  }

  /**
   * Marquer un client comme vérifié
   */
  async verify(id: string): Promise<boolean> {
    const result = await this.db.execute(
      'UPDATE customers SET is_verified = TRUE WHERE id = ?',
      [id]
    )

    return result.rowsAffected > 0
  }

  /**
   * Supprimer un client (soft delete via metadata)
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) {
      return false
    }

    const metadata = parseDBJson(existing.metadata, {}) as any
    metadata.deleted_at = formatDateForDB(new Date())

    const result = await this.db.execute(
      'UPDATE customers SET metadata = ? WHERE id = ?',
      [stringifyForDB(metadata), id]
    )

    return result.rowsAffected > 0
  }

  /**
   * Convertir une ligne de base de données en objet DBCustomer
   */
  private mapRowToCustomer(row: any): DBCustomer {
    return {
      id: row.id,
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone || undefined,
      company: row.company || undefined,
      address_line1: row.address_line1 || undefined,
      address_line2: row.address_line2 || undefined,
      city: row.city || undefined,
      postal_code: row.postal_code || undefined,
      country: row.country,
      customer_type: row.customer_type,
      tax_number: row.tax_number || undefined,
      is_verified: Boolean(row.is_verified),
      metadata: row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }

  /**
   * Convertir un DBCustomer en CustomerInfo pour l'API
   */
  static toCustomerInfo(dbCustomer: DBCustomer): CustomerInfo {
    const metadata = parseDBJson(dbCustomer.metadata, {})
    
    return {
      firstName: dbCustomer.first_name,
      lastName: dbCustomer.last_name,
      email: dbCustomer.email,
      phone: dbCustomer.phone || '',
      company: dbCustomer.company || '',
      address: {
        street: dbCustomer.address_line1 || '',
        line2: dbCustomer.address_line2 || '',
        city: dbCustomer.city || '',
        region: '', // Région non stockée dans la DB actuelle
        postalCode: dbCustomer.postal_code || '',
        country: dbCustomer.country
      },
      customerType: dbCustomer.customer_type,
      taxNumber: dbCustomer.tax_number || '',
      ...metadata
    }
  }
}