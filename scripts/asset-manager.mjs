#!/usr/bin/env node

/**
 * Asset Manager NS2PO - Script principal
 * Gestion complète des assets : upload, sync, cache invalidation
 * 
 * Inspiré du workflow Camydia (objectif: sub-20 secondes)
 * 
 * Usage:
 *   pnpm assets:add ./assets-source/products/textiles/textile-tshirt-001.jpg
 *   pnpm assets:remove textile-tshirt-001
 *   pnpm assets:update textile-tshirt-001 ./nouveau-fichier.jpg
 *   pnpm assets:sync
 *   pnpm assets:invalidate textile-tshirt-001
 */

import {
  parseFilename,
  uploadToCloudinary,
  syncToAirtable,
  updateTursoCache,
  invalidateCloudinaryCache,
  getPerformanceStats
} from './lib/asset-utils.js';

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration et validation des variables d'environnement
function validateEnvironment() {
  const required = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET',
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID',
    'TURSO_DATABASE_URL',
    'TURSO_AUTH_TOKEN'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Variables d\\'environnement manquantes:');
    missing.forEach(env => console.error(`   - ${env}`));
    console.error('\\n💡 Vérifiez votre fichier .env');
    process.exit(1);
  }
}

/**
 * Commande: ADD - Ajouter un nouvel asset
 * Workflow complet : Upload → Airtable → Turso
 */
async function addAsset(filePath, options = {}) {
  const totalStartTime = Date.now();
  
  try {
    console.log(`🚀 Ajout asset: ${path.basename(filePath)}`);
    console.log('━'.repeat(50));
    
    // Validation du fichier
    await validateFile(filePath);
    
    // 1. Upload vers Cloudinary (parallèle avec parsing)
    console.log('📤 Phase 1: Upload Cloudinary');
    const cloudinaryResult = await uploadToCloudinary(filePath, {
      quick: options.quick || false,
      ...options.cloudinary
    });
    
    // 2. Sync vers Airtable (avec métadonnées Cloudinary)
    console.log('📝 Phase 2: Sync Airtable');
    const airtableRecord = await syncToAirtable({
      cloudinary_public_id: cloudinaryResult.public_id,
      cloudinary_url: cloudinaryResult.secure_url,
      transformations: cloudinaryResult.transformations,
      metadata: cloudinaryResult.metadata,
      ...options.airtable
    });
    
    // 3. Update cache Turso (en parallèle avec log)
    console.log('🗄️  Phase 3: Cache Turso');
    const tursoResult = await updateTursoCache(airtableRecord, cloudinaryResult);
    
    // Résultats
    const totalTime = Date.now() - totalStartTime;
    
    console.log('━'.repeat(50));
    console.log('✅ Asset ajouté avec succès !');
    console.log(`⏱️  Temps total: ${totalTime}ms`);
    console.log(`🏷️  Public ID: ${cloudinaryResult.public_id}`);
    console.log(`📋 Airtable ID: ${airtableRecord.id}`);
    console.log(`🔗 URL: ${cloudinaryResult.secure_url}`);
    
    // Affichage des transformations disponibles
    if (cloudinaryResult.transformations && cloudinaryResult.transformations.length > 0) {
      console.log('\\n🎨 Transformations générées:');
      cloudinaryResult.transformations.forEach(t => {
        console.log(`   - ${t.name}: ${t.url}`);
      });
    }
    
    return {
      success: true,
      cloudinary: cloudinaryResult,
      airtable: airtableRecord,
      turso: tursoResult,
      total_time_ms: totalTime
    };
    
  } catch (error) {
    const totalTime = Date.now() - totalStartTime;
    console.error('━'.repeat(50));
    console.error(`❌ Erreur ajout asset (${totalTime}ms):`, error.message);
    
    if (error.http_code) {
      console.error(`   Code HTTP: ${error.http_code}`);
    }
    
    throw error;
  }
}

async function validateFile(filePath) {
  try {
    const stats = await fs.stat(filePath);
    
    if (!stats.isFile()) {
      throw new Error(`${filePath} n'est pas un fichier valide`);
    }
    
    // Vérification de la taille (max 10MB pour éviter les timeouts)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      throw new Error(`Fichier trop volumineux (${(stats.size / 1024 / 1024).toFixed(2)}MB > 10MB)`);
    }
    
    // Vérification de l'extension
    const validExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif'];
    const ext = path.extname(filePath).toLowerCase();
    
    if (!validExtensions.includes(ext)) {
      throw new Error(`Extension non supportée: ${ext}. Valides: ${validExtensions.join(', ')}`);
    }
    
    console.log(`✅ Fichier valide: ${(stats.size / 1024).toFixed(2)}KB`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Fichier introuvable: ${filePath}`);
    }
    throw error;
  }
}

/**
 * Commande: REMOVE - Supprimer un asset
 * Suppression cascade : Cloudinary → Airtable → Turso
 */
async function removeAsset(identifier, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log(`🗑️  Suppression asset: ${identifier}`);
    console.log('━'.repeat(50));
    
    // Identifier peut être: public_id Cloudinary, ID Airtable, ou nom de fichier
    const assetInfo = await resolveAssetIdentifier(identifier);
    
    if (!assetInfo) {
      throw new Error(`Asset introuvable: ${identifier}`);
    }
    
    console.log(`📋 Trouvé: ${assetInfo.name} (${assetInfo.cloudinary_public_id})`);
    
    // 1. Supprimer de Cloudinary
    if (assetInfo.cloudinary_public_id && !options.skipCloudinary) {
      console.log('🗑️  Suppression Cloudinary...');
      await cloudinary.uploader.destroy(assetInfo.cloudinary_public_id);
    }
    
    // 2. Supprimer d'Airtable
    if (assetInfo.airtable_id && !options.skipAirtable) {
      console.log('🗑️  Suppression Airtable...');
      await assetsTable.destroy(assetInfo.airtable_id);
    }
    
    // 3. Supprimer du cache Turso
    if (!options.skipTurso) {
      console.log('🗑️  Suppression cache Turso...');
      await turso.execute({
        sql: 'DELETE FROM assets_cache WHERE airtable_id = ?',
        args: [assetInfo.airtable_id]
      });
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('━'.repeat(50));
    console.log('✅ Asset supprimé avec succès !');
    console.log(`⏱️  Temps total: ${totalTime}ms`);
    
    return {
      success: true,
      removed: assetInfo,
      total_time_ms: totalTime
    };
    
  } catch (error) {
    console.error(`❌ Erreur suppression: ${error.message}`);
    throw error;
  }
}

/**
 * Commande: UPDATE - Mettre à jour un asset existant
 */
async function updateAsset(identifier, newFilePath = null, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Mise à jour asset: ${identifier}`);
    console.log('━'.repeat(50));
    
    const assetInfo = await resolveAssetIdentifier(identifier);
    
    if (!assetInfo) {
      throw new Error(`Asset introuvable: ${identifier}`);
    }
    
    let updateData = {};
    
    // Si nouveau fichier fourni, remplacer l'image
    if (newFilePath) {
      await validateFile(newFilePath);
      
      console.log('📤 Upload nouvelle version...');
      const cloudinaryResult = await uploadToCloudinary(newFilePath, {
        public_id: assetInfo.cloudinary_public_id, // Même public_id
        overwrite: true,
        invalidate: true
      });
      
      updateData.cloudinary_url = cloudinaryResult.secure_url;
      updateData.cloudinary_transformations = JSON.stringify(cloudinaryResult.transformations || []);
    }
    
    // Mise à jour des métadonnées (si fournies)
    if (options.metadata) {
      updateData = { ...updateData, ...options.metadata };
    }
    
    // Update Airtable si nécessaire
    if (Object.keys(updateData).length > 0) {
      console.log('📝 Mise à jour Airtable...');
      const updatedRecord = await assetsTable.update(assetInfo.airtable_id, updateData);
      
      console.log('🗄️  Mise à jour cache Turso...');
      await updateTursoCache(updatedRecord);
    }
    
    // Invalidation cache
    if (newFilePath || options.invalidateCache) {
      console.log('🔄 Invalidation cache...');
      await invalidateCloudinaryCache(assetInfo.cloudinary_public_id);
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('━'.repeat(50));
    console.log('✅ Asset mis à jour avec succès !');
    console.log(`⏱️  Temps total: ${totalTime}ms`);
    
    return {
      success: true,
      updated: assetInfo,
      changes: updateData,
      total_time_ms: totalTime
    };
    
  } catch (error) {
    console.error(`❌ Erreur mise à jour: ${error.message}`);
    throw error;
  }
}

/**
 * Commande: SYNC - Synchronisation complète Airtable ↔ Turso
 */
async function syncAll(options = {}) {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Synchronisation complète Airtable ↔ Turso');
    console.log('━'.repeat(50));
    
    // Récupérer tous les records Airtable
    console.log('📋 Récupération données Airtable...');
    const records = await assetsTable.select({
      view: 'Assets Actifs'
    }).all();
    
    console.log(`📊 ${records.length} assets trouvés dans Airtable`);
    
    let synced = 0;
    let errors = 0;
    
    // Sync par batch pour éviter les timeouts
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      console.log(`📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)} (${batch.length} items)`);
      
      await Promise.allSettled(
        batch.map(async (record) => {
          try {
            await updateTursoCache(record);
            synced++;
          } catch (error) {
            console.error(`   ❌ Erreur sync ${record.id}:`, error.message);
            errors++;
          }
        })
      );
    }
    
    const totalTime = Date.now() - startTime;
    
    console.log('━'.repeat(50));
    console.log('✅ Synchronisation terminée !');
    console.log(`📊 Résultats:`);
    console.log(`   - Synchronisés: ${synced}`);
    console.log(`   - Erreurs: ${errors}`);
    console.log(`⏱️  Temps total: ${totalTime}ms`);
    console.log(`📈 Performance: ${((synced / (totalTime / 1000)) * 60).toFixed(1)} assets/min`);
    
    return {
      success: true,
      synced,
      errors,
      total_time_ms: totalTime
    };
    
  } catch (error) {
    console.error(`❌ Erreur synchronisation: ${error.message}`);
    throw error;
  }
}

/**
 * Commande: INVALIDATE - Invalidation cache spécifique
 */
async function invalidateAsset(identifier, options = {}) {
  try {
    console.log(`🔄 Invalidation cache: ${identifier}`);
    
    const assetInfo = await resolveAssetIdentifier(identifier);
    
    if (!assetInfo) {
      throw new Error(`Asset introuvable: ${identifier}`);
    }
    
    const result = await invalidateCloudinaryCache(assetInfo.cloudinary_public_id, options);
    
    console.log(`✅ Cache invalidé pour: ${assetInfo.name}`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Erreur invalidation: ${error.message}`);
    throw error;
  }
}

/**
 * Utilitaire: Résoudre un identifiant vers les infos complètes de l'asset
 */
async function resolveAssetIdentifier(identifier) {
  // Essayer d'abord comme public_id Cloudinary
  if (identifier.includes('/')) {
    const tursoResult = await turso.execute({
      sql: 'SELECT * FROM assets_cache WHERE cloudinary_public_id = ?',
      args: [identifier]
    });
    
    if (tursoResult.rows.length > 0) {
      return tursoResult.rows[0];
    }
  }
  
  // Essayer comme ID Airtable
  if (identifier.startsWith('rec')) {
    const tursoResult = await turso.execute({
      sql: 'SELECT * FROM assets_cache WHERE airtable_id = ?',
      args: [identifier]
    });
    
    if (tursoResult.rows.length > 0) {
      return tursoResult.rows[0];
    }
  }
  
  // Essayer comme nom de fichier (search dans public_id)
  const tursoResult = await turso.execute({
    sql: 'SELECT * FROM assets_cache WHERE cloudinary_public_id LIKE ?',
    args: [`%${identifier}%`]
  });
  
  return tursoResult.rows[0] || null;
}

/**
 * Commande: STATS - Afficher les statistiques de performance
 */
async function showStats() {
  try {
    console.log('📊 Statistiques Asset Management');
    console.log('━'.repeat(50));
    
    const stats = await getPerformanceStats();
    
    // Affichage des stats Turso
    console.log('🗄️  Cache Local (Turso):');
    stats.turso.forEach(row => {
      console.log(`   ${row.category}: ${row.total} total (${row.active} actifs)`);
      console.log(`      Dernière MAJ: ${row.last_update || 'jamais'}`);
    });
    
    // Stats globales
    const totalAssets = stats.turso.reduce((sum, row) => sum + row.total, 0);
    const totalActive = stats.turso.reduce((sum, row) => sum + row.active, 0);
    
    console.log('\\n📈 Résumé Global:');
    console.log(`   Total assets: ${totalAssets}`);
    console.log(`   Assets actifs: ${totalActive}`);
    console.log(`   Taux d'activation: ${((totalActive / totalAssets) * 100).toFixed(1)}%`);
    
    return stats;
    
  } catch (error) {
    console.error(`❌ Erreur stats: ${error.message}`);
    throw error;
  }
}

/**
 * Interface CLI principale
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Validation environnement
  validateEnvironment();
  
  try {
    switch (command) {
      case 'add':
        if (!args[1]) {
          throw new Error('Usage: asset-manager.mjs add <file-path> [options]');
        }
        await addAsset(args[1], parseOptions(args.slice(2)));
        break;
        
      case 'remove':
        if (!args[1]) {
          throw new Error('Usage: asset-manager.mjs remove <identifier> [options]');
        }
        await removeAsset(args[1], parseOptions(args.slice(2)));
        break;
        
      case 'update':
        if (!args[1]) {
          throw new Error('Usage: asset-manager.mjs update <identifier> [new-file-path] [options]');
        }
        await updateAsset(args[1], args[2], parseOptions(args.slice(3)));
        break;
        
      case 'sync':
        await syncAll(parseOptions(args.slice(1)));
        break;
        
      case 'invalidate':
        if (!args[1]) {
          throw new Error('Usage: asset-manager.mjs invalidate <identifier>');
        }
        await invalidateAsset(args[1], parseOptions(args.slice(2)));
        break;
        
      case 'stats':
        await showStats();
        break;
        
      default:
        console.log('🎯 Asset Manager NS2PO');
        console.log('');
        console.log('Commandes disponibles:');
        console.log('  add <file>        Ajouter un nouvel asset');
        console.log('  remove <id>       Supprimer un asset');
        console.log('  update <id> [file] Mettre à jour un asset');
        console.log('  sync              Synchronisation complète');
        console.log('  invalidate <id>   Invalider le cache');
        console.log('  stats             Afficher les statistiques');
        console.log('');
        console.log('Exemples:');
        console.log('  pnpm assets:add ./assets-source/products/textiles/textile-tshirt-001.jpg');
        console.log('  pnpm assets:remove textile-tshirt-001');
        console.log('  pnpm assets:update textile-tshirt-001 ./nouveau-fichier.jpg');
        console.log('  pnpm assets:sync');
        break;
    }
    
  } catch (error) {
    console.error('\\n💥 Erreur:', error.message);
    process.exit(1);
  }
}

function parseOptions(args) {
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--quick') {
      options.quick = true;
    } else if (arg === '--skip-cloudinary') {
      options.skipCloudinary = true;
    } else if (arg === '--skip-airtable') {
      options.skipAirtable = true;
    } else if (arg === '--skip-turso') {
      options.skipTurso = true;
    } else if (arg === '--invalidate-cache') {
      options.invalidateCache = true;
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1]);
      i++; // Skip next arg
    }
  }
  
  return options;
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}