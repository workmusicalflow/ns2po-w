/**
 * Utilitaires pour la gestion des assets NS2PO
 * Inspiré du workflow Camydia (18 secondes asset-to-production)
 */

import { v2 as cloudinary } from 'cloudinary';
import Airtable from 'airtable';
import { createClient } from '@libsql/client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dsrvzogof',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configuration Airtable
const airtable = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
});
const base = airtable.base(process.env.AIRTABLE_BASE_ID);
const assetsTable = base('Assets');

// Configuration Turso
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

/**
 * Parse le nom de fichier pour extraire métadonnées automatiques
 * Format: {categorie}-{type}-{numero}.{ext}
 * Ex: textile-tshirt-001.jpg → { category: 'products', subcategory: 'textiles', type: 'tshirt', number: '001' }
 */
export function parseFilename(filePath) {
  const filename = path.basename(filePath, path.extname(filePath));
  const parts = filename.split('-');
  
  if (parts.length < 3) {
    throw new Error(`Invalid filename format. Expected: {category}-{type}-{number}.ext, got: ${filename}`);
  }
  
  const [categoryPrefix, type, number] = parts;
  
  // Mapping automatique des catégories
  const categoryMap = {
    'textile': { category: 'products', subcategory: 'textiles' },
    'gadget': { category: 'products', subcategory: 'gadgets' },
    'epi': { category: 'products', subcategory: 'epi' },
    'logo': { category: 'logos', subcategory: detectLogoSubcategory(filename) },
    'bg': { category: 'backgrounds', subcategory: detectBackgroundSubcategory(filename) },
    'background': { category: 'backgrounds', subcategory: detectBackgroundSubcategory(filename) },
    'icon': { category: 'icons', subcategory: detectIconSubcategory(filename) }
  };
  
  const mapping = categoryMap[categoryPrefix];
  if (!mapping) {
    throw new Error(`Unknown category prefix: ${categoryPrefix}. Valid prefixes: ${Object.keys(categoryMap).join(', ')}`);
  }
  
  return {
    ...mapping,
    type,
    number,
    originalFilename: filename,
    extension: path.extname(filePath).toLowerCase()
  };
}

function detectLogoSubcategory(filename) {
  if (filename.includes('client')) return 'client-samples';
  if (filename.includes('ns2po')) return 'ns2po-branding';
  return 'client-samples'; // default
}

function detectBackgroundSubcategory(filename) {
  if (filename.includes('election') || filename.includes('political')) return 'election-themes';
  return 'corporate-patterns'; // default
}

function detectIconSubcategory(filename) {
  if (filename.includes('social')) return 'social-media';
  return 'ui-elements'; // default
}

/**
 * Upload asset vers Cloudinary avec optimisations automatiques
 * Retourne les métadonnées d'upload et transformations
 */
export async function uploadToCloudinary(filePath, options = {}) {
  const startTime = Date.now();
  
  try {
    const metadata = parseFilename(filePath);
    const publicId = `ns2po/${metadata.category}/${metadata.subcategory}/${metadata.originalFilename}`;
    
    console.log(`📤 Upload vers Cloudinary: ${publicId}`);
    
    // Configuration upload selon le type d'asset
    const uploadConfig = {
      public_id: publicId,
      use_filename: true,
      unique_filename: false,
      invalidate: true, // Cache invalidation automatique
      resource_type: 'auto',
      ...getUploadConfigForCategory(metadata.category),
      ...options
    };
    
    const result = await cloudinary.uploader.upload(filePath, uploadConfig);
    
    // Générer les transformations automatiques
    const transformations = generateTransformationsForCategory(metadata.category, result.public_id);
    
    const uploadTime = Date.now() - startTime;
    console.log(`✅ Upload terminé en ${uploadTime}ms`);
    
    return {
      ...result,
      metadata,
      transformations,
      upload_time_ms: uploadTime
    };
    
  } catch (error) {
    const uploadTime = Date.now() - startTime;
    console.error(`❌ Erreur upload (${uploadTime}ms):`, error.message);
    throw error;
  }
}

function getUploadConfigForCategory(category) {
  const configs = {
    products: {
      quality: 'auto:best',
      format: 'auto',
      fetch_format: 'auto'
    },
    logos: {
      quality: '100',
      format: 'auto',
      flags: 'preserve_transparency'
    },
    backgrounds: {
      quality: 'auto:good',
      format: 'auto'
    },
    icons: {
      quality: '100',
      format: 'auto',
      flags: 'preserve_transparency'
    }
  };
  
  return configs[category] || configs.products;
}

function generateTransformationsForCategory(category, publicId) {
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  const transformationSets = {
    products: [
      { name: 'thumbnail', params: 'c_fill,w_300,h_300,q_auto:good', width: 300, height: 300 },
      { name: 'preview', params: 'c_fit,w_800,h_600,q_auto:best', width: 800, height: 600 },
      { name: 'mobile', params: 'c_fill,w_400,h_400,q_auto:good,f_webp', width: 400, height: 400 }
    ],
    logos: [
      { name: 'standard', params: 'c_fit,w_500,h_300,q_100', width: 500, height: 300 },
      { name: 'small', params: 'c_fit,w_150,h_50,q_100', width: 150, height: 50 },
      { name: 'large', params: 'c_fit,w_1000,h_400,q_100', width: 1000, height: 400 }
    ],
    backgrounds: [
      { name: 'desktop', params: 'c_fill,w_1920,h_1080,q_auto:good', width: 1920, height: 1080 },
      { name: 'mobile', params: 'c_fill,w_768,h_1024,q_auto:good,f_webp', width: 768, height: 1024 },
      { name: 'thumbnail', params: 'c_fill,w_300,h_200,q_auto:eco', width: 300, height: 200 }
    ],
    icons: [
      { name: 'standard', params: 'c_fit,w_64,h_64,q_100', width: 64, height: 64 },
      { name: 'small', params: 'c_fit,w_24,h_24,q_100', width: 24, height: 24 },
      { name: 'large', params: 'c_fit,w_128,h_128,q_100', width: 128, height: 128 }
    ]
  };
  
  const transformations = transformationSets[category] || transformationSets.products;
  
  return transformations.map(t => ({
    ...t,
    url: `${baseUrl}/${t.params}/${publicId}`
  }));
}

/**
 * Créer/Mettre à jour l'enregistrement Airtable
 */
export async function syncToAirtable(assetData, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log(`📝 Sync vers Airtable: ${assetData.name || assetData.cloudinary_public_id}`);
    
    const airtableData = {
      name: assetData.name || generateAssetName(assetData),
      category: assetData.category,
      subcategory: assetData.subcategory,
      cloudinary_public_id: assetData.cloudinary_public_id,
      cloudinary_url: assetData.cloudinary_url,
      status: 'active',
      upload_source: 'freepik',
      uploaded_by: process.env.USER || 'script',
      cloudinary_transformations: JSON.stringify(assetData.transformations || []),
      ...extractBusinessMetadata(assetData),
      ...options
    };
    
    let record;
    
    if (assetData.airtable_id) {
      // Update existing record
      record = await assetsTable.update(assetData.airtable_id, airtableData);
      console.log(`✅ Record Airtable mis à jour: ${record.id}`);
    } else {
      // Create new record  
      record = await assetsTable.create(airtableData);
      console.log(`✅ Record Airtable créé: ${record.id}`);
    }
    
    const syncTime = Date.now() - startTime;
    console.log(`📊 Sync Airtable terminé en ${syncTime}ms`);
    
    return {
      id: record.id,
      fields: record.fields,
      sync_time_ms: syncTime
    };
    
  } catch (error) {
    const syncTime = Date.now() - startTime;
    console.error(`❌ Erreur sync Airtable (${syncTime}ms):`, error.message);
    throw error;
  }
}

function generateAssetName(assetData) {
  const metadata = assetData.metadata;
  const typeFormatted = metadata.type.charAt(0).toUpperCase() + metadata.type.slice(1);
  
  const namePatterns = {
    products: `${typeFormatted} ${metadata.subcategory} ${metadata.number}`,
    logos: `Logo ${metadata.type} ${metadata.number}`,
    backgrounds: `Background ${metadata.type} ${metadata.number}`,
    icons: `Icon ${metadata.type} ${metadata.number}`
  };
  
  return namePatterns[metadata.category] || `Asset ${metadata.originalFilename}`;
}

function extractBusinessMetadata(assetData) {
  const metadata = assetData.metadata;
  
  // Mapping par défaut selon la catégorie et le type
  const defaultPrices = {
    textile: { price_base: 12000, min_quantity: 50 },
    gadget: { price_base: 8000, min_quantity: 100 },
    epi: { price_base: 15000, min_quantity: 25 }
  };
  
  if (metadata.category === 'products') {
    return defaultPrices[metadata.type] || { price_base: 10000, min_quantity: 50 };
  }
  
  return {};
}

/**
 * Mettre à jour le cache Turso
 */
export async function updateTursoCache(airtableRecord, cloudinaryResult = null) {
  const startTime = Date.now();
  
  try {
    console.log(`🗄️  Update cache Turso: ${airtableRecord.id}`);
    
    const cacheData = {
      airtable_id: airtableRecord.id,
      cloudinary_public_id: airtableRecord.fields.cloudinary_public_id,
      cloudinary_url: airtableRecord.fields.cloudinary_url,
      name: airtableRecord.fields.name,
      category: airtableRecord.fields.category,
      subcategory: airtableRecord.fields.subcategory,
      status: airtableRecord.fields.status || 'active',
      business_metadata: JSON.stringify(extractBusinessMetadataFromAirtable(airtableRecord.fields)),
      transformations: airtableRecord.fields.cloudinary_transformations,
      upload_source: airtableRecord.fields.upload_source || 'freepik',
      uploaded_by: airtableRecord.fields.uploaded_by,
      last_sync: new Date().toISOString()
    };
    
    // Upsert dans Turso
    const query = `
      INSERT INTO assets_cache (
        airtable_id, cloudinary_public_id, cloudinary_url, name, category, 
        subcategory, status, business_metadata, transformations, 
        upload_source, uploaded_by, last_sync
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(airtable_id) DO UPDATE SET
        cloudinary_public_id = excluded.cloudinary_public_id,
        cloudinary_url = excluded.cloudinary_url,
        name = excluded.name,
        category = excluded.category,
        subcategory = excluded.subcategory,
        status = excluded.status,
        business_metadata = excluded.business_metadata,
        transformations = excluded.transformations,
        upload_source = excluded.upload_source,
        uploaded_by = excluded.uploaded_by,
        updated_at = CURRENT_TIMESTAMP,
        last_sync = excluded.last_sync
    `;
    
    const result = await turso.execute({
      sql: query,
      args: Object.values(cacheData)
    });
    
    const syncTime = Date.now() - startTime;
    console.log(`✅ Cache Turso mis à jour en ${syncTime}ms`);
    
    return {
      rowsAffected: result.rowsAffected,
      sync_time_ms: syncTime
    };
    
  } catch (error) {
    const syncTime = Date.now() - startTime;
    console.error(`❌ Erreur cache Turso (${syncTime}ms):`, error.message);
    throw error;
  }
}

function extractBusinessMetadataFromAirtable(fields) {
  const metadata = {};
  
  if (fields.price_base) metadata.price_base = fields.price_base;
  if (fields.min_quantity) metadata.min_quantity = fields.min_quantity;
  
  return metadata;
}

/**
 * Invalidation du cache Cloudinary
 */
export async function invalidateCloudinaryCache(publicId, options = {}) {
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Invalidation cache: ${publicId}`);
    
    // Cloudinary cache invalidation via dummy upload
    const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', {
      public_id: `${publicId}_cache_bust`,
      invalidate: true,
      overwrite: true,
      ...options
    });
    
    // Supprimer le fichier temporaire
    await cloudinary.uploader.destroy(`${publicId}_cache_bust`);
    
    const invalidateTime = Date.now() - startTime;
    console.log(`✅ Cache invalidé en ${invalidateTime}ms`);
    
    return {
      invalidated: true,
      invalidate_time_ms: invalidateTime
    };
    
  } catch (error) {
    const invalidateTime = Date.now() - startTime;
    console.error(`❌ Erreur invalidation (${invalidateTime}ms):`, error.message);
    throw error;
  }
}

/**
 * Statistiques de performance globale
 */
export async function getPerformanceStats() {
  try {
    // Stats Turso
    const tursoStats = await turso.execute(`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        MAX(updated_at) as last_update
      FROM assets_cache 
      GROUP BY category
    `);
    
    // Stats Cloudinary (via API si disponible)
    // Note: Nécessiterait l'API Admin Cloudinary pour les stats détaillées
    
    return {
      turso: tursoStats.rows,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Erreur stats:', error.message);
    throw error;
  }
}