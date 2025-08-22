/**
 * Client de base de données Turso pour NS2PO Election MVP
 */

import { createClient } from '@libsql/client'
import type { Client, ResultSet, Transaction } from '@libsql/client'

export interface TursoConfig {
  url: string
  authToken?: string
}

export class TursoClient {
  private readonly client: Client
  private static instance: TursoClient | null = null

  constructor(config: TursoConfig) {
    this.client = createClient({
      url: config.url,
      authToken: config.authToken
    })
  }

  /**
   * Instance singleton pour réutiliser la connexion
   */
  static getInstance(config?: TursoConfig): TursoClient {
    if (!this.instance) {
      if (!config) {
        throw new Error('TursoClient config required for first initialization')
      }
      this.instance = new TursoClient(config)
    }
    return this.instance
  }

  /**
   * Exécute une requête SQL
   */
  async execute(sql: string, params?: any[]): Promise<ResultSet> {
    try {
      return await this.client.execute({
        sql,
        args: params || []
      })
    } catch (error) {
      console.error('Database query error:', { sql, params, error })
      throw error
    }
  }

  /**
   * Exécute une transaction
   */
  async transaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    const transaction = await this.client.transaction()
    try {
      const result = await callback(transaction)
      await transaction.commit()
      return result
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Ferme la connexion
   */
  async close(): Promise<void> {
    this.client.close()
    TursoClient.instance = null
  }

  /**
   * Test de connectivité
   */
  async ping(): Promise<boolean> {
    try {
      await this.execute('SELECT 1')
      return true
    } catch {
      return false
    }
  }

  /**
   * Obtient le client natif pour des opérations avancées
   */
  getNativeClient(): Client {
    return this.client
  }
}

/**
 * Fonction utilitaire pour initialiser le client depuis les variables d'environnement
 */
export function createTursoClient(): TursoClient {
  const url = process.env.TURSO_DATABASE_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (!url) {
    throw new Error('TURSO_DATABASE_URL environment variable is required')
  }

  return TursoClient.getInstance({
    url,
    authToken
  })
}

/**
 * Helper pour générer des IDs uniques
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return prefix ? `${prefix}_${timestamp}_${random}`.toUpperCase() : `${timestamp}_${random}`
}

/**
 * Helper pour formater les dates en ISO string pour SQLite
 */
export function formatDateForDB(date: Date = new Date()): string {
  return date.toISOString()
}

/**
 * Helper pour parser les champs JSON de la DB
 */
export function parseDBJson<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

/**
 * Helper pour sérialiser en JSON pour la DB
 */
export function stringifyForDB(data: any): string {
  return JSON.stringify(data)
}

/**
 * Types pour les requêtes courantes
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

export interface QueryOptions extends PaginationOptions {
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  filters?: Record<string, any>
}

/**
 * Helper pour construire des clauses WHERE
 */
export function buildWhereClause(
  filters: Record<string, any>, 
  paramOffset: number = 0
): { clause: string; params: any[] } {
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = paramOffset

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = ?`)
      params.push(value)
      paramIndex++
    }
  })

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  }
}

/**
 * Helper pour construire des clauses ORDER BY et LIMIT
 */
export function buildQuerySuffix(options: QueryOptions): string {
  const parts: string[] = []

  if (options.orderBy) {
    const direction = options.orderDirection || 'ASC'
    parts.push(`ORDER BY ${options.orderBy} ${direction}`)
  }

  if (options.limit) {
    const offset = options.offset || ((options.page || 1) - 1) * options.limit
    parts.push(`LIMIT ${options.limit} OFFSET ${offset}`)
  }

  return parts.join(' ')
}