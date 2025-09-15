/**
 * Fonctions utilitaires pour la base de données
 */

import { nanoid } from 'nanoid'

/**
 * Génère un ID unique
 */
export function generateId(prefix?: string): string {
  const id = nanoid(12)
  return prefix ? `${prefix}_${id}` : id
}

/**
 * Formate une date pour la base de données
 */
export function formatDateForDB(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString()
}

/**
 * Convertit un objet en JSON pour la DB
 */
export function stringifyForDB(data: any): string {
  return JSON.stringify(data)
}

/**
 * Parse le JSON depuis la DB
 */
export function parseDBJson<T>(json: string | null): T | null {
  if (!json) return null
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * Construit une clause WHERE
 */
export function buildWhereClause(conditions: Record<string, any>): string {
  const clauses = Object.entries(conditions)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (value === null) return `${key} IS NULL`
      if (typeof value === 'boolean') return `${key} = ${value ? 1 : 0}`
      if (typeof value === 'number') return `${key} = ${value}`
      return `${key} = '${value}'`
    })
  
  return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
}

/**
 * Options pour les requêtes
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  order?: 'ASC' | 'DESC'
}

/**
 * Construit le suffixe de requête (ORDER BY, LIMIT, OFFSET)
 */
export function buildQuerySuffix(options?: QueryOptions): string {
  if (!options) return ''
  
  const parts: string[] = []
  
  if (options.orderBy) {
    parts.push(`ORDER BY ${options.orderBy} ${options.order || 'ASC'}`)
  }
  
  if (options.limit) {
    parts.push(`LIMIT ${options.limit}`)
  }
  
  if (options.offset) {
    parts.push(`OFFSET ${options.offset}`)
  }
  
  return parts.join(' ')
}