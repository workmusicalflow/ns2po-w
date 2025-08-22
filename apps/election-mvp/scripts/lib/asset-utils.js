/**
 * Utilitaires pour le parsing et la gestion des assets
 * Basé sur les conventions de nommage NS2PO
 */

import path from 'path';

/**
 * Parse le nom d'un fichier d'asset selon les conventions NS2PO
 * @param {string} filePath - Chemin complet vers le fichier
 * @returns {Object} Informations parsées du fichier
 */
export function parseFilename(filePath) {
  // Validation des paramètres d'entrée
  if (typeof filePath === 'string' && filePath.trim() === '') {
    throw new Error('Nom de fichier vide');
  }
  
  if (!filePath) {
    throw new Error('Nom de fichier requis');
  }

  const filename = path.basename(filePath, path.extname(filePath));
  const extension = path.extname(filePath).toLowerCase();
  const originalName = path.basename(filePath);

  // Règles de parsing pour différents types d'assets
  const patterns = {
    // Produits textiles: textile-tshirt-001.jpg → products/textiles
    textile: /^textile-(\w+)-(\d+)$/,
    // Gadgets: gadget-keychain-001.jpg → products/gadgets  
    gadget: /^gadget-(\w+)-(\d+)$/,
    // EPI: epi-casque-001.jpg → products/epi
    epi: /^epi-(\w+)-(\d+)$/,
    // Logos clients: logo-client-acme-corp.svg → logos/client-samples
    logo_client: /^logo-client-([\w-]+)$/,
    // Logos NS2PO: logo-ns2po-001.svg → logos/brand
    logo_brand: /^logo-ns2po-(\w+)$/,
    // Backgrounds élections: background-election-orange.png → backgrounds/election-themes
    background: /^background-(\w+)-(\w+)$/,
    // Équipe: team-marie-001.jpg → team/profiles
    team: /^team-(\w+)-(\d+)$/,
    // Événements: event-corporate-001.jpg → gallery/events
    event: /^event-(\w+)-(\d+)$/,
    // Créatif: creative-artwork-001.jpg → gallery/creative
    creative: /^creative-(\w+)-(\d+)$/,
    // Hero: hero-banner-001.jpg → hero/banners
    hero: /^hero-(\w+)-(\d+)$/
  };

  // Tenter de matcher avec chaque pattern
  for (const [type, pattern] of Object.entries(patterns)) {
    const match = filename.match(pattern);
    if (match) {
      return buildAssetInfo(type, match, originalName, extension);
    }
  }

  // Si aucun pattern ne correspond, c'est un format invalide
  throw new Error('Format de nom de fichier invalide');
}

/**
 * Construit les informations d'asset basées sur le type et le match
 */
function buildAssetInfo(type, match, originalName, extension) {
  const mappings = {
    textile: {
      category: 'products',
      subcategory: 'textiles',
      type: match[1], // tshirt, polo, etc.
      number: match[2]
    },
    gadget: {
      category: 'products', 
      subcategory: 'gadgets',
      type: match[1], // keychain, mug, etc.
      number: match[2]
    },
    epi: {
      category: 'products',
      subcategory: 'epi',
      type: match[1], // casque, gilet, etc.
      number: match[2]
    },
    logo_client: {
      category: 'logos',
      subcategory: 'client-samples', 
      type: 'logo',
      number: match[1] // nom du client
    },
    logo_brand: {
      category: 'logos',
      subcategory: 'brand',
      type: 'logo',
      number: match[1] // variant
    },
    background: {
      category: 'backgrounds',
      subcategory: 'election-themes',
      type: match[1], // election
      number: match[2] // orange
    },
    team: {
      category: 'team',
      subcategory: 'profiles',
      type: match[1], // prénom
      number: match[2]
    },
    event: {
      category: 'gallery',
      subcategory: 'events',
      type: match[1], // corporate, political, etc.
      number: match[2]
    },
    creative: {
      category: 'gallery',
      subcategory: 'creative',
      type: match[1], // artwork, design, etc.
      number: match[2]
    },
    hero: {
      category: 'hero',
      subcategory: 'banners',
      type: match[1], // banner, video, etc.
      number: match[2]
    }
  };

  const info = mappings[type];
  return {
    ...info,
    originalName,
    extension,
    cloudinaryFolder: `ns2po/${info.category}/${info.subcategory}`,
    isRecognized: true
  };
}

/**
 * Génère les transformations Cloudinary appropriées selon le type d'asset
 * @param {Object} assetInfo - Informations parsées de l'asset
 * @returns {Object} Configuration des transformations
 */
export function generateCloudinaryTransformations(assetInfo) {
  const baseTransforms = {
    fetch_format: 'auto',
    quality: 'auto'
  };

  const categoryTransforms = {
    products: {
      ...baseTransforms,
      width: 800,
      height: 800,
      crop: 'fill',
      gravity: 'center'
    },
    logos: {
      ...baseTransforms,
      width: 400,
      height: 400,
      crop: 'fit',
      background: 'transparent'
    },
    team: {
      ...baseTransforms,
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'face'
    },
    gallery: {
      ...baseTransforms,
      width: 1200,
      height: 800,
      crop: 'fill'
    },
    hero: {
      ...baseTransforms,
      width: 1920,
      height: 1080,
      crop: 'fill'
    },
    misc: {
      ...baseTransforms,
      width: 800,
      height: 600,
      crop: 'fit'
    }
  };

  return categoryTransforms[assetInfo.category] || categoryTransforms.misc;
}

/**
 * Valide si un fichier peut être traité comme asset
 * @param {string} filePath - Chemin vers le fichier
 * @returns {boolean} True si le fichier est valide
 */
export function validateAssetFile(filePath) {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg', '.gif', '.webp'];
  const extension = path.extname(filePath).toLowerCase();
  
  return allowedExtensions.includes(extension);
}

/**
 * Génère un nom de fichier optimisé pour Cloudinary
 * @param {Object} assetInfo - Informations parsées de l'asset
 * @returns {string} Nom de fichier optimisé
 */
export function generateOptimizedFilename(assetInfo) {
  const { category, subcategory, type, number } = assetInfo;
  return `${category}-${subcategory}-${type}-${number}`;
}

/**
 * Extrait les métadonnées d'un asset
 * @param {string} filePath - Chemin vers le fichier
 * @param {Object} cloudinaryResponse - Réponse de Cloudinary après upload
 * @returns {Object} Métadonnées extraites
 */
export function extractAssetMetadata(filePath, cloudinaryResponse = {}) {
  const stats = require('fs').statSync(filePath);
  const assetInfo = parseFilename(filePath);
  
  return {
    filename: path.basename(filePath),
    size: stats.size,
    created_at: stats.birthtime.toISOString(),
    modified_at: stats.mtime.toISOString(),
    cloudinary_url: cloudinaryResponse.secure_url || null,
    cloudinary_public_id: cloudinaryResponse.public_id || null,
    format: cloudinaryResponse.format || path.extname(filePath).slice(1),
    dimensions: {
      width: cloudinaryResponse.width || null,
      height: cloudinaryResponse.height || null
    },
    category: assetInfo.category,
    subcategory: assetInfo.subcategory,
    type: assetInfo.type,
    is_recognized: assetInfo.isRecognized
  };
}