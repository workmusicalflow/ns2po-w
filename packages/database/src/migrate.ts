/**
 * Script de migration pour la base de données NS2PO
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createTursoClient } from './client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface Migration {
  id: string
  filename: string
  executed_at?: string
}

async function runMigrations() {
  console.log('🚀 Démarrage des migrations de base de données...')
  
  try {
    const db = createTursoClient()
    
    // Créer la table de suivi des migrations si elle n'existe pas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Récupérer les migrations déjà exécutées
    const executedResult = await db.execute('SELECT id FROM migrations ORDER BY executed_at')
    const executedMigrations = new Set(executedResult.rows.map(row => row.id))
    
    // Liste des fichiers de migration dans l'ordre
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_simplify_payment_system.sql'
    ]
    
    console.log(`📊 ${executedMigrations.size} migrations déjà exécutées`)
    console.log(`📁 ${migrationFiles.length} fichiers de migration trouvés`)
    
    for (const filename of migrationFiles) {
      const migrationId = filename.replace('.sql', '')
      
      if (executedMigrations.has(migrationId)) {
        console.log(`⏭️  Migration ${migrationId} déjà exécutée, passage`)
        continue
      }
      
      console.log(`🔄 Exécution de la migration ${migrationId}...`)
      
      try {
        // Lire le fichier de migration
        const migrationPath = join(__dirname, '..', 'migrations', filename)
        const migrationSQL = readFileSync(migrationPath, 'utf8')
        
        // Diviser les requêtes SQL (séparées par des lignes vides ou des commentaires)
        const queries = migrationSQL
          .split(';')
          .map(query => query.trim())
          .filter(query => query.length > 0 && !query.startsWith('--'))
        
        console.log(`   📝 ${queries.length} requêtes à exécuter`)
        
        // Exécuter chaque requête
        for (let i = 0; i < queries.length; i++) {
          const query = queries[i]
          if (query) {
            await db.execute(query)
            process.stdout.write(`   ✓ Requête ${i + 1}/${queries.length}\r`)
          }
        }
        
        console.log(`   ✅ Toutes les requêtes exécutées`)
        
        // Marquer la migration comme exécutée
        await db.execute(
          'INSERT INTO migrations (id, filename) VALUES (?, ?)',
          [migrationId, filename]
        )
        
        console.log(`✅ Migration ${migrationId} terminée avec succès`)
        
      } catch (error) {
        console.error(`❌ Erreur lors de la migration ${migrationId}:`, error)
        throw error
      }
    }
    
    // Test de connectivité final
    const pingResult = await db.ping()
    if (pingResult) {
      console.log('✅ Test de connectivité final réussi')
    } else {
      console.log('⚠️  Test de connectivité final échoué')
    }
    
    console.log('🎉 Toutes les migrations ont été exécutées avec succès!')
    
    await db.close()
    
  } catch (error) {
    console.error('💥 Erreur lors des migrations:', error)
    process.exit(1)
  }
}

// Exécution si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
}

export { runMigrations }