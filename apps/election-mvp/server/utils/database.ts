/**
 * Database utility for Turso (SQLite) integration
 */

/* global useRuntimeConfig */

import { createClient } from '@libsql/client'

let dbClient: ReturnType<typeof createClient> | null = null

/**
 * Get or create database client
 */
export function getDatabase() {
  if (!dbClient) {
    const config = useRuntimeConfig()
    
    // Access the turso config properly
    const tursoConfig = (config as any).turso
    
    if (!tursoConfig?.databaseUrl || !tursoConfig?.authToken) {
      console.warn('⚠️ Turso database not configured - using in-memory fallback')
      // Return null to indicate database is not available
      return null
    }

    try {
      dbClient = createClient({
        url: tursoConfig.databaseUrl as string,
        authToken: tursoConfig.authToken as string,
      })
      console.log('✅ Connected to Turso database')
    } catch (error) {
      console.error('❌ Failed to connect to Turso database:', error)
      return null
    }
  }
  
  return dbClient
}

/**
 * Initialize database tables
 */
export async function initDatabase() {
  const db = getDatabase()
  if (!db) return

  try {
    // Create contacts table for all types of submissions
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        type TEXT CHECK(type IN ('quote', 'preorder', 'custom', 'meeting')),
        customer_data TEXT NOT NULL,
        request_data TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('✅ Database tables initialized')
  } catch (error) {
    console.error('❌ Failed to initialize database tables:', error)
  }
}

/**
 * Save a custom request to database
 */
export async function saveCustomRequest(data: {
  id: string
  customer: any
  projectType?: string
  budget?: string
  deadline?: string
  description: string
  attachments?: any[]
}) {
  const db = getDatabase()
  if (!db) {
    console.warn('⚠️ Database not available - skipping save')
    return null
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO contacts (id, type, customer_data, request_data, status) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        data.id,
        'custom',
        JSON.stringify(data.customer),
        JSON.stringify({
          projectType: data.projectType,
          budget: data.budget,
          deadline: data.deadline,
          description: data.description,
          attachments: data.attachments
        }),
        'new'
      ]
    })

    console.log('✅ Custom request saved to database:', data.id)
    return result
  } catch (error) {
    console.error('❌ Failed to save custom request:', error)
    throw error
  }
}

/**
 * Save a meeting request to database
 */
export async function saveMeetingRequest(data: {
  id: string
  customer: any
  meetingType: string
  preferredDate?: string
  preferredTime?: string
  message?: string
  participants?: number
}) {
  const db = getDatabase()
  if (!db) {
    console.warn('⚠️ Database not available - skipping save')
    return null
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO contacts (id, type, customer_data, request_data, status) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        data.id,
        'meeting',
        JSON.stringify(data.customer),
        JSON.stringify({
          meetingType: data.meetingType,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          message: data.message,
          participants: data.participants
        }),
        'new'
      ]
    })

    console.log('✅ Meeting request saved to database:', data.id)
    return result
  } catch (error) {
    console.error('❌ Failed to save meeting request:', error)
    throw error
  }
}

/**
 * Get request by ID
 */
export async function getRequestById(id: string) {
  const db = getDatabase()
  if (!db) return null

  try {
    const result = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [id]
    })

    if (result.rows.length > 0) {
      const row = result.rows[0]
      return {
        id: row.id,
        type: row.type,
        customerData: JSON.parse(row.customer_data as string),
        requestData: JSON.parse(row.request_data as string),
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    }

    return null
  } catch (error) {
    console.error('❌ Failed to get request:', error)
    return null
  }
}

/**
 * Update request status
 */
export async function updateRequestStatus(id: string, status: string) {
  const db = getDatabase()
  if (!db) return null

  try {
    const result = await db.execute({
      sql: 'UPDATE contacts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [status, id]
    })

    console.log('✅ Request status updated:', id, status)
    return result
  } catch (error) {
    console.error('❌ Failed to update request status:', error)
    throw error
  }
}