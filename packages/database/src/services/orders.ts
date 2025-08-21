/**
 * Service de gestion des commandes
 */

import type { QuoteItem, PreorderItem, PreorderStatus, PaymentStatus } from '@ns2po/types'

// Type pour les statuts de commande (compatible avec PreorderStatus)
export type OrderStatus = PreorderStatus
import { TursoClient, generateId, formatDateForDB, stringifyForDB, parseDBJson, buildWhereClause, buildQuerySuffix, type QueryOptions } from '../client'

export interface DBOrder {
  id: string
  quote_id?: string
  customer_id: string
  customer_data: string // JSON snapshot
  items: string // JSON array
  subtotal: number
  tax_rate: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method?: string
  payment_reference?: string
  production_notes?: string
  shipping_address?: string // JSON
  estimated_delivery_date?: string
  actual_delivery_date?: string
  notes?: string
  metadata: string // JSON
  created_at: string
  updated_at: string
}

export interface CreateOrderData {
  id?: string // ID personnalisé (ex: référence de suivi)
  quoteId?: string
  customerId: string
  customerData: any // Snapshot des données client
  items: QuoteItem[] | PreorderItem[]
  subtotal: number
  taxRate?: number
  taxAmount: number
  shippingCost?: number
  totalAmount: number
  paymentMethod?: string
  shippingAddress?: any
  estimatedDeliveryDate?: Date
  notes?: string
  metadata?: Record<string, any>
}

export class OrdersService {
  constructor(private db: TursoClient) {}

  /**
   * Créer une nouvelle commande
   */
  async create(data: CreateOrderData): Promise<DBOrder> {
    const id = data.id || generateId('ORD')
    const now = formatDateForDB()

    const order: Omit<DBOrder, 'updated_at'> = {
      id,
      quote_id: data.quoteId || undefined,
      customer_id: data.customerId,
      customer_data: stringifyForDB(data.customerData),
      items: stringifyForDB(data.items),
      subtotal: data.subtotal,
      tax_rate: data.taxRate || 0.18,
      tax_amount: data.taxAmount,
      shipping_cost: data.shippingCost || 0,
      total_amount: data.totalAmount,
      status: 'pending_payment',
      payment_status: 'pending',
      payment_method: data.paymentMethod || undefined,
      payment_reference: undefined,
      production_notes: undefined,
      shipping_address: data.shippingAddress ? stringifyForDB(data.shippingAddress) : undefined,
      estimated_delivery_date: data.estimatedDeliveryDate ? formatDateForDB(data.estimatedDeliveryDate) : undefined,
      actual_delivery_date: undefined,
      notes: data.notes || undefined,
      metadata: stringifyForDB(data.metadata || {}),
      created_at: now
    }

    const result = await this.db.execute(
      `INSERT INTO orders (
        id, quote_id, customer_id, customer_data, items, subtotal, tax_rate, tax_amount,
        shipping_cost, total_amount, status, payment_status, payment_method,
        shipping_address, estimated_delivery_date, notes, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id, order.quote_id, order.customer_id, order.customer_data, order.items,
        order.subtotal, order.tax_rate, order.tax_amount, order.shipping_cost, order.total_amount,
        order.status, order.payment_status, order.payment_method, order.shipping_address,
        order.estimated_delivery_date, order.notes, order.metadata, order.created_at
      ]
    )

    if (result.rowsAffected === 0) {
      throw new Error('Failed to create order')
    }

    return { ...order, updated_at: now }
  }

  /**
   * Trouver une commande par ID
   */
  async findById(id: string): Promise<DBOrder | null> {
    const result = await this.db.execute(
      'SELECT * FROM orders WHERE id = ? LIMIT 1',
      [id]
    )

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToOrder(result.rows[0])
  }

  /**
   * Lister les commandes avec filtres et pagination
   */
  async list(options: QueryOptions & {
    customerId?: string
    status?: OrderStatus
    paymentStatus?: PaymentStatus
    dateFrom?: Date
    dateTo?: Date
  } = {}): Promise<{ orders: DBOrder[]; total: number }> {
    const filters: Record<string, any> = {}
    
    if (options.customerId) {
      filters.customer_id = options.customerId
    }
    
    if (options.status) {
      filters.status = options.status
    }
    
    if (options.paymentStatus) {
      filters.payment_status = options.paymentStatus
    }

    let whereClause = ''
    let params: any[] = []

    if (Object.keys(filters).length > 0) {
      const built = buildWhereClause(filters)
      whereClause = built.clause
      params = built.params
    }

    // Ajouter filtres de date
    if (options.dateFrom || options.dateTo) {
      const dateConditions: string[] = []
      
      if (options.dateFrom) {
        dateConditions.push('created_at >= ?')
        params.push(formatDateForDB(options.dateFrom))
      }
      
      if (options.dateTo) {
        dateConditions.push('created_at <= ?')
        params.push(formatDateForDB(options.dateTo))
      }
      
      const dateClause = dateConditions.join(' AND ')
      
      if (whereClause) {
        whereClause += ` AND ${dateClause}`
      } else {
        whereClause = `WHERE ${dateClause}`
      }
    }

    // Requête pour le total
    const countResult = await this.db.execute(
      `SELECT COUNT(*) as total FROM orders ${whereClause}`,
      params
    )
    const total = Number(countResult.rows[0]?.total || 0)

    // Requête pour les données
    const queryOptions = { ...options, orderBy: options.orderBy || 'created_at', orderDirection: options.orderDirection || 'DESC' }
    const suffix = buildQuerySuffix(queryOptions)

    const result = await this.db.execute(
      `SELECT * FROM orders ${whereClause} ${suffix}`,
      params
    )

    const orders = result.rows.map(row => this.mapRowToOrder(row))

    return { orders, total }
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateStatus(id: string, status: OrderStatus, notes?: string): Promise<boolean> {
    const updates = ['status = ?']
    const params: any[] = [status]

    if (notes) {
      updates.push('production_notes = ?')
      params.push(notes)
    }

    // Mettre à jour la date de livraison si statut = delivered
    if (status === 'delivered') {
      updates.push('actual_delivery_date = ?')
      params.push(formatDateForDB(new Date()))
    }

    params.push(id)

    const result = await this.db.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    return result.rowsAffected > 0
  }

  /**
   * Mettre à jour le statut de paiement
   */
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentReference?: string): Promise<boolean> {
    const updates = ['payment_status = ?']
    const params: any[] = [paymentStatus]

    if (paymentReference) {
      updates.push('payment_reference = ?')
      params.push(paymentReference)
    }

    // Si paiement confirmé, changer le statut de la commande
    if (paymentStatus === 'paid') {
      updates.push('status = ?')
      params.push('processing')
    }

    params.push(id)

    const result = await this.db.execute(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    return result.rowsAffected > 0
  }

  /**
   * Mettre à jour les notes de production
   */
  async updateProductionNotes(id: string, notes: string): Promise<boolean> {
    const result = await this.db.execute(
      'UPDATE orders SET production_notes = ? WHERE id = ?',
      [notes, id]
    )

    return result.rowsAffected > 0
  }

  /**
   * Mettre à jour la date de livraison estimée
   */
  async updateEstimatedDelivery(id: string, estimatedDate: Date): Promise<boolean> {
    const result = await this.db.execute(
      'UPDATE orders SET estimated_delivery_date = ? WHERE id = ?',
      [formatDateForDB(estimatedDate), id]
    )

    return result.rowsAffected > 0
  }

  /**
   * Obtenir les statistiques des commandes
   */
  async getStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalOrders: number
    totalRevenue: number
    averageOrderValue: number
    ordersByStatus: Record<OrderStatus, number>
    ordersByPaymentStatus: Record<PaymentStatus, number>
  }> {
    let whereClause = ''
    const params: any[] = []

    if (dateFrom || dateTo) {
      const conditions: string[] = []
      
      if (dateFrom) {
        conditions.push('created_at >= ?')
        params.push(formatDateForDB(dateFrom))
      }
      
      if (dateTo) {
        conditions.push('created_at <= ?')
        params.push(formatDateForDB(dateTo))
      }
      
      whereClause = `WHERE ${conditions.join(' AND ')}`
    }

    // Stats générales
    const generalStats = await this.db.execute(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders ${whereClause}`,
      params
    )

    // Stats par statut
    const statusStats = await this.db.execute(
      `SELECT status, COUNT(*) as count FROM orders ${whereClause} GROUP BY status`,
      params
    )

    // Stats par statut de paiement
    const paymentStats = await this.db.execute(
      `SELECT payment_status, COUNT(*) as count FROM orders ${whereClause} GROUP BY payment_status`,
      params
    )

    const generalRow = generalStats.rows[0]
    
    const ordersByStatus: Record<string, number> = {}
    statusStats.rows.forEach(row => {
      ordersByStatus[row.status as string] = Number(row.count)
    })

    const ordersByPaymentStatus: Record<string, number> = {}
    paymentStats.rows.forEach(row => {
      ordersByPaymentStatus[row.payment_status as string] = Number(row.count)
    })

    return {
      totalOrders: Number(generalRow?.total_orders || 0),
      totalRevenue: Number(generalRow?.total_revenue || 0),
      averageOrderValue: Number(generalRow?.average_order_value || 0),
      ordersByStatus: ordersByStatus as Record<OrderStatus, number>,
      ordersByPaymentStatus: ordersByPaymentStatus as Record<PaymentStatus, number>
    }
  }

  /**
   * Convertir une ligne de base de données en objet DBOrder
   */
  private mapRowToOrder(row: any): DBOrder {
    return {
      id: row.id,
      quote_id: row.quote_id || undefined,
      customer_id: row.customer_id,
      customer_data: row.customer_data,
      items: row.items,
      subtotal: Number(row.subtotal),
      tax_rate: Number(row.tax_rate),
      tax_amount: Number(row.tax_amount),
      shipping_cost: Number(row.shipping_cost),
      total_amount: Number(row.total_amount),
      status: row.status,
      payment_status: row.payment_status,
      payment_method: row.payment_method || undefined,
      payment_reference: row.payment_reference || undefined,
      production_notes: row.production_notes || undefined,
      shipping_address: row.shipping_address || undefined,
      estimated_delivery_date: row.estimated_delivery_date || undefined,
      actual_delivery_date: row.actual_delivery_date || undefined,
      notes: row.notes || undefined,
      metadata: row.metadata,
      created_at: row.created_at,
      updated_at: row.updated_at
    }
  }
}