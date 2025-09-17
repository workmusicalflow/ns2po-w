/**
 * Utilitaire de logging système
 */

import { getDatabase } from "./database"

interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  context?: string
  source?: string
  stackTrace?: string
  metadata?: Record<string, any>
}

class SystemLogger {
  private static instance: SystemLogger
  private db: any = null

  private constructor() {
    this.db = getDatabase()
  }

  public static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger()
    }
    return SystemLogger.instance
  }

  private async ensureLogTable() {
    if (!this.db) return

    try {
      await this.db.execute({
        sql: `CREATE TABLE IF NOT EXISTS system_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          context TEXT,
          source TEXT,
          stack_trace TEXT,
          metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        args: []
      })

      // Index pour les performances
      await this.db.execute({
        sql: `CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level)`,
        args: []
      })

      await this.db.execute({
        sql: `CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)`,
        args: []
      })

      await this.db.execute({
        sql: `CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source)`,
        args: []
      })
    } catch (error) {
      console.error('❌ Erreur création table system_logs:', error)
    }
  }

  private async writeLog(entry: LogEntry) {
    if (!this.db) {
      // Fallback vers console si pas de DB
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context ? `(${entry.context})` : '')
      return
    }

    try {
      await this.ensureLogTable()

      await this.db.execute({
        sql: `INSERT INTO system_logs (
          level, message, context, source, stack_trace, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          entry.level,
          entry.message,
          entry.context || null,
          entry.source || 'system',
          entry.stackTrace || null,
          entry.metadata ? JSON.stringify(entry.metadata) : null
        ]
      })
    } catch (error) {
      console.error('❌ Erreur écriture log en base:', error)
      // Fallback vers console
      console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, entry.context ? `(${entry.context})` : '')
    }
  }

  public info(message: string, context?: string, metadata?: Record<string, any>) {
    this.writeLog({
      level: 'info',
      message,
      context,
      source: this.getCallerSource(),
      metadata
    })
  }

  public warn(message: string, context?: string, metadata?: Record<string, any>) {
    this.writeLog({
      level: 'warn',
      message,
      context,
      source: this.getCallerSource(),
      metadata
    })
  }

  public error(message: string, error?: Error, context?: string, metadata?: Record<string, any>) {
    this.writeLog({
      level: 'error',
      message,
      context,
      source: this.getCallerSource(),
      stackTrace: error?.stack,
      metadata: {
        ...metadata,
        errorName: error?.name,
        errorMessage: error?.message
      }
    })
  }

  public debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.writeLog({
      level: 'debug',
      message,
      context,
      source: this.getCallerSource(),
      metadata
    })
  }

  private getCallerSource(): string {
    try {
      const stack = new Error().stack
      if (!stack) return 'unknown'

      const lines = stack.split('\n')
      // Skip les 4 premières lignes (Error, getCallerSource, writeLog, info/warn/error/debug)
      const callerLine = lines[4]

      if (callerLine) {
        // Extraire le nom du fichier depuis le stack trace
        const match = callerLine.match(/\/([^\/]+)\.ts:/)
        if (match) {
          return match[1]
        }
      }

      return 'system'
    } catch {
      return 'system'
    }
  }

  // Méthode utilitaire pour nettoyer les anciens logs
  public async cleanOldLogs(daysToKeep = 30) {
    if (!this.db) return

    try {
      const result = await this.db.execute({
        sql: `DELETE FROM system_logs WHERE created_at < datetime('now', '-${daysToKeep} days')`,
        args: []
      })

      this.info(`Nettoyage logs: ${result.changes} entrées supprimées`, 'logger.cleanOldLogs')
    } catch (error) {
      this.error('Erreur nettoyage logs anciens', error as Error, 'logger.cleanOldLogs')
    }
  }

  // Méthode utilitaire pour obtenir les statistiques des logs
  public async getLogStats() {
    if (!this.db) return null

    try {
      const result = await this.db.execute({
        sql: `SELECT
          level,
          COUNT(*) as count,
          MAX(created_at) as last_occurrence
        FROM system_logs
        WHERE created_at >= datetime('now', '-24 hours')
        GROUP BY level`,
        args: []
      })

      return result.rows.reduce((acc: any, row: any) => {
        acc[row.level] = {
          count: Number(row.count),
          lastOccurrence: row.last_occurrence
        }
        return acc
      }, {})
    } catch (error) {
      console.error('❌ Erreur récupération stats logs:', error)
      return null
    }
  }
}

// Export singleton instance
export const logger = SystemLogger.getInstance()

// Export utilitaires pour les API
export async function logApiRequest(
  method: string,
  path: string,
  duration: number,
  statusCode: number,
  userId?: string
) {
  logger.info(`${method} ${path} - ${statusCode} (${duration}ms)`, 'api', {
    method,
    path,
    duration,
    statusCode,
    userId
  })
}

export async function logApiError(
  method: string,
  path: string,
  error: Error,
  statusCode: number = 500
) {
  logger.error(`${method} ${path} - ${statusCode}`, error, 'api', {
    method,
    path,
    statusCode
  })
}

export async function logSyncOperation(
  operation: string,
  type: string,
  itemsProcessed: number,
  errors: number,
  duration: number
) {
  logger.info(`Sync ${operation} ${type}: ${itemsProcessed} items, ${errors} errors (${duration}ms)`, 'sync', {
    operation,
    type,
    itemsProcessed,
    errors,
    duration
  })
}

export async function logSyncError(
  operation: string,
  type: string,
  error: Error
) {
  logger.error(`Sync error ${operation} ${type}`, error, 'sync', {
    operation,
    type
  })
}

// Hook d'initialisation pour nettoyer les logs au démarrage
export async function initializeLogger() {
  try {
    const logger = SystemLogger.getInstance()
    await logger.cleanOldLogs(30) // Garder 30 jours de logs
    logger.info('Logger initialisé et nettoyage effectué', 'system')
  } catch (error) {
    console.error('❌ Erreur initialisation logger:', error)
  }
}