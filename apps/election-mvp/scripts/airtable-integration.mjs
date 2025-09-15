#!/usr/bin/env node

/**
 * NS2PO Airtable Integration - Synchronisation des assets avec Airtable
 * Permet la synchronisation bidirectionnelle entre le système d'assets et Airtable
 */

import { parseFilename, extractAssetMetadata } from './lib/asset-utils.js';
import { v2 as cloudinary } from 'cloudinary';
import Airtable from 'airtable';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Airtable
const AIRTABLE_CONFIG = {
  baseId: 'apprQLdnVwlbfnioT',
  assetsTableId: 'tbla8baaBOSTBRtEM',
  apiKey: process.env.AIRTABLE_API_KEY
};

// Initialisation client Airtable
const airtable = new Airtable({ apiKey: AIRTABLE_CONFIG.apiKey });
const base = airtable.base(AIRTABLE_CONFIG.baseId);
const assetsTable = base(AIRTABLE_CONFIG.assetsTableId);

/**
 * Synchronise un asset avec Airtable après upload Cloudinary
 * @param {string} filePath - Chemin vers le fichier original
 * @param {Object} cloudinaryResponse - Réponse de l'upload Cloudinary
 * @returns {Promise<Object>} Résultat de la synchronisation
 */
export async function syncAssetToAirtable(filePath, cloudinaryResponse) {
  try {
    const assetInfo = parseFilename(filePath);
    const metadata = extractAssetMetadata(filePath, cloudinaryResponse);
    
    // Mapper les données pour Airtable
    const airtableData = {
      AssetName: assetInfo.originalName.replace(/\.[^/.]+$/, ''), // Sans extension
      OriginalFilename: assetInfo.originalName,
      Category: mapCategoryToAirtable(assetInfo.category, assetInfo.subcategory),
      Subcategory: assetInfo.subcategory,
      CloudinaryURL: cloudinaryResponse.secure_url,
      CloudinaryPublicID: cloudinaryResponse.public_id,
      FileSize: metadata.size,
      Dimensions: cloudinaryResponse.width && cloudinaryResponse.height 
        ? `${cloudinaryResponse.width} x ${cloudinaryResponse.height}` 
        : null,
      Format: cloudinaryResponse.format.toUpperCase(),
      Status: '✅ Active',
      Tags: generateTagsFromAsset(assetInfo),
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      IsActive: true,
      Usage: inferUsageFromCategory(assetInfo.category),
      Notes: `Asset ajouté automatiquement via le système de gestion - ${assetInfo.category}/${assetInfo.subcategory}`
    };

    console.log('📊 Données Airtable à synchroniser:', JSON.stringify(airtableData, null, 2));
    
    // Créer l'enregistrement dans Airtable
    const records = await assetsTable.create([{
      fields: airtableData
    }]);
    
    const createdRecord = records[0];
    
    return {
      success: true,
      airtableId: createdRecord.getId(),
      data: airtableData,
      message: 'Asset synchronisé avec Airtable'
    };

  } catch (error) {
    console.error('❌ Erreur synchronisation Airtable:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Mappe les catégories internes vers les catégories Airtable
 */
function mapCategoryToAirtable(category, subcategory) {
  const mappings = {
    'products/textiles': 'Produits - Textiles',
    'products/gadgets': 'Produits - Gadgets', 
    'products/epi': 'Produits - EPI',
    'logos/client-samples': 'Logos - Clients',
    'logos/brand': 'Logos - Marque NS2PO',
    'backgrounds/election-themes': 'Backgrounds - Élections',
    'team/profiles': 'Équipe - Profils',
    'gallery/events': 'Galerie - Événements',
    'gallery/creative': 'Galerie - Créatif',
    'hero/banners': 'Hero - Banners'
  };
  
  const key = `${category}/${subcategory}`;
  return mappings[key] || 'Produits - Textiles'; // Fallback
}

/**
 * Génère des tags automatiques basés sur l'asset
 */
function generateTagsFromAsset(assetInfo) {
  const tags = [];
  
  // Tags basés sur la catégorie
  if (assetInfo.category === 'products' && assetInfo.subcategory === 'textiles') {
    tags.push('👔 Textile');
  }
  if (assetInfo.category === 'products' && assetInfo.subcategory === 'gadgets') {
    tags.push('🎁 Gadget');
  }
  if (assetInfo.category === 'logos') {
    tags.push('🗳️ Politique');
  }
  if (assetInfo.category === 'backgrounds') {
    tags.push('🖼️ Background', '🎨 Design');
  }
  
  // Tags génériques pour élections
  tags.push('🎯 Campagne');
  
  return tags;
}

/**
 * Infère l'usage probable basé sur la catégorie
 */
function inferUsageFromCategory(category) {
  const usageMappings = {
    'products': ['Site Web', 'Catalogue', 'Impression'],
    'logos': ['Site Web', 'Impression', 'Email'],
    'backgrounds': ['Site Web', 'Réseaux sociaux'],
    'team': ['Site Web', 'Email'],
    'gallery': ['Site Web', 'Réseaux sociaux'],
    'hero': ['Site Web']
  };
  
  return usageMappings[category] || ['Site Web'];
}

/**
 * Récupère les assets depuis Airtable pour synchronisation inverse
 * @returns {Promise<Array>} Liste des assets Airtable
 */
export async function getAssetsFromAirtable() {
  try {
    const records = [];
    
    await assetsTable.select({
      filterByFormula: `{IsActive} = 1`,
      sort: [{ field: 'UpdatedAt', direction: 'desc' }]
    }).eachPage((pageRecords, fetchNextPage) => {
      records.push(...pageRecords.map(record => ({
        id: record.getId(),
        fields: record.fields
      })));
      fetchNextPage();
    });
    
    console.log(`📊 ${records.length} assets récupérés depuis Airtable`);
    return records;

  } catch (error) {
    console.error('❌ Erreur récupération Airtable:', error.message);
    return [];
  }
}

/**
 * Met à jour le statut d'un asset dans Airtable
 * @param {string} airtableId - ID de l'enregistrement Airtable
 * @param {string} status - Nouveau statut
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
export async function updateAssetStatus(airtableId, status) {
  try {
    console.log(`📝 Mise à jour statut asset ${airtableId}: ${status}`);
    
    await assetsTable.update([{
      id: airtableId,
      fields: {
        Status: status,
        UpdatedAt: new Date().toISOString()
      }
    }]);
    
    return {
      success: true,
      airtableId,
      updatedStatus: status,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Synchronise les assets supprimés
 * @param {string} publicId - Public ID Cloudinary de l'asset supprimé
 * @returns {Promise<Object>} Résultat de la synchronisation
 */
export async function markAssetAsDeleted(publicId) {
  try {
    console.log(`🗑️ Marquage asset comme supprimé: ${publicId}`);
    
    // Trouver l'asset dans Airtable par CloudinaryPublicID
    const records = [];
    await assetsTable.select({
      filterByFormula: `{CloudinaryPublicID} = '${publicId}'`
    }).eachPage((pageRecords, fetchNextPage) => {
      records.push(...pageRecords);
      fetchNextPage();
    });
    
    if (records.length === 0) {
      return {
        success: false,
        error: `Asset non trouvé: ${publicId}`
      };
    }
    
    // Marquer comme supprimé
    const record = records[0];
    await assetsTable.update([{
      id: record.getId(),
      fields: {
        Status: '🗄 Archived',
        IsActive: false,
        UpdatedAt: new Date().toISOString(),
        Notes: `Asset supprimé automatiquement le ${new Date().toLocaleDateString()}`
      }
    }]);
    
    return {
      success: true,
      publicId,
      airtableId: record.getId(),
      status: '🗄 Archived',
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Erreur marquage suppression:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Génère un rapport de synchronisation
 * @returns {Promise<Object>} Rapport détaillé
 */
export async function generateSyncReport() {
  try {
    const airtableAssets = await getAssetsFromAirtable();
    
    return {
      timestamp: new Date().toISOString(),
      airtable: {
        totalAssets: airtableAssets.length,
        activeAssets: airtableAssets.filter(a => a.fields.Status === '✅ Active').length,
        categories: [...new Set(airtableAssets.map(a => a.fields.Category))]
      },
      recommendations: [
        'Vérifier la cohérence des statuts assets',
        'Optimiser les tags pour améliorer la recherche',
        'Mettre à jour les notes descriptives'
      ]
    };

  } catch (error) {
    console.error('❌ Erreur génération rapport:', error.message);
    return {
      error: error.message
    };
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'sync':
      console.log('🔄 Synchronisation avec Airtable...');
      // Exemple d'utilisation
      break;
      
    case 'report': {
      const report = await generateSyncReport();
      console.log('📊 Rapport de synchronisation:', JSON.stringify(report, null, 2));
      break;
    }
      
    default:
      console.log(`
📋 NS2PO Airtable Integration

Usage: node airtable-integration.mjs [command]

Commands:
  sync      Synchronise les assets avec Airtable
  report    Génère un rapport de synchronisation

Examples:
  node airtable-integration.mjs sync
  node airtable-integration.mjs report
      `);
  }
}