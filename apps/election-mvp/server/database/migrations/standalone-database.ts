/**
 * Standalone database utility pour scripts de migration
 * Utilise directement les variables d'environnement (pas useRuntimeConfig)
 */

import { createClient } from '@libsql/client'

let dbClient: ReturnType<typeof createClient> | null = null

/**
 * Get or create database client for migration scripts
 */
export function getDatabase() {
  if (!dbClient) {
    const databaseUrl = process.env.TURSO_DATABASE_URL
    const authToken = process.env.TURSO_AUTH_TOKEN

    if (!databaseUrl || !authToken) {
      console.warn('⚠️ Variables d\'environnement Turso manquantes:')
      console.warn('  - TURSO_DATABASE_URL:', databaseUrl ? '✅ Set' : '❌ Missing')
      console.warn('  - TURSO_AUTH_TOKEN:', authToken ? '✅ Set' : '❌ Missing')
      return null
    }

    try {
      dbClient = createClient({
        url: databaseUrl,
        authToken: authToken,
      })
      console.log('✅ Connexion Turso établie')
    } catch (error) {
      console.error('❌ Échec connexion Turso:', error)
      return null
    }
  }

  return dbClient
}

/**
 * Test simple de connectivité
 */
export async function testConnection() {
  const db = getDatabase()
  if (!db) return false

  try {
    const result = await db.execute("SELECT 1 as test")
    return result.rows[0]?.test === 1
  } catch (error) {
    console.error('❌ Test connectivité échoué:', error)
    return false
  }
}

/**
 * Fermer la connexion (pour cleanup)
 */
export function closeDatabase() {
  if (dbClient) {
    dbClient = null
    console.log('🔌 Connexion Turso fermée')
  }
}