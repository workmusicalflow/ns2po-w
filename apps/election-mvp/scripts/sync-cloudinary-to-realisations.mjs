#!/usr/bin/env node

/**
 * Script de synchronisation Cloudinary Creative → Airtable Realisations
 * 
 * Scanne le dossier Cloudinary ns2po/gallery/creative/ et ajoute
 * toutes les images manquantes dans la table Airtable "Realisations"
 */

import { v2 as cloudinary } from 'cloudinary';
import Airtable from 'airtable';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Charger le fichier .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

try {
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.error('⚠️  Erreur lors du chargement du .env:', error.message);
}

// Configuration Cloudinary
console.log('🔧 Configuration Cloudinary...');
console.log(`  Cloud name: ${process.env.CLOUDINARY_CLOUD_NAME ? '✓' : '✗'}`);
console.log(`  API key: ${process.env.CLOUDINARY_API_KEY ? '✓' : '✗'}`);
console.log(`  API secret: ${process.env.CLOUDINARY_API_SECRET ? '✓' : '✗'}`);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuration Airtable
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID);
const realisationsTable = base('Realisations');

/**
 * Parse le nom de fichier pour extraire les métadonnées (copié de cloudinary-discovery.ts)
 */
function parseCreativeFilename(filename) {
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');
  const extension = filename.match(/\.(jpg|jpeg|png|webp|svg)$/i)?.[1]?.toLowerCase() || 'jpg';
  
  // Patterns de reconnaissance
  const patterns = [
    /^([a-zA-Z-]+)-(\d+)$/,  // banderole-001
    /^([a-zA-Z-]+)-([a-zA-Z0-9-]+)$/,  // banderole-rouge
    /^([a-zA-Z]+)(\d+)$/,    // banderole001
    /^([a-zA-Z-]+)$/         // banderole
  ];
  
  let type = null;
  let identifier = null;
  let keywords = [];
  
  // Test des patterns
  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      type = match[1].toLowerCase();
      identifier = match[2] || null;
      
      // Mots-clés depuis le type
      if (type.includes('-')) {
        keywords = type.split('-');
        type = keywords[0];
        keywords = keywords.slice(1);
      }
      break;
    }
  }
  
  // Fallback si aucun pattern
  if (!type) {
    type = nameWithoutExt.toLowerCase();
  }
  
  return {
    type,
    identifier,
    keywords,
    extension,
    originalFilename: filename
  };
}

/**
 * Récupère toutes les images du dossier creative Cloudinary
 */
async function getCloudinaryCreativeImages() {
  console.log('🔍 Scan du dossier Cloudinary ns2po/gallery/creative/...');
  
  try {
    const result = await cloudinary.search
      .expression('folder:ns2po/gallery/creative/*')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute();

    console.log(`📸 ${result.resources.length} images trouvées dans le dossier creative`);
    
    return result.resources.map(resource => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      created_at: resource.created_at,
      bytes: resource.bytes,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      filename: resource.public_id.split('/').pop()
    }));
    
  } catch (error) {
    console.error('❌ Erreur lors du scan Cloudinary:');
    console.error('  Message:', error.message || 'Erreur inconnue');
    console.error('  Code:', error.http_code || 'N/A');
    console.error('  Détails:', error.error || 'N/A');
    throw error;
  }
}

/**
 * Récupère toutes les réalisations existantes dans Airtable
 */
async function getExistingRealisations() {
  console.log('📋 Récupération des réalisations existantes dans Airtable...');
  
  try {
    const records = await realisationsTable.select({
      fields: ['Title', 'CloudinaryPublicIds']
    }).all();

    // Extraire tous les publicIds déjà référencés
    const existingPublicIds = new Set();
    
    records.forEach(record => {
      const publicIdsStr = record.fields.CloudinaryPublicIds || '';
      
      // C'est une string avec virgules selon la spec Airtable
      if (publicIdsStr && typeof publicIdsStr === 'string') {
        // Séparer par virgules et nettoyer les espaces
        const ids = publicIdsStr.split(',').map(id => id.trim()).filter(id => id);
        ids.forEach(id => existingPublicIds.add(id));
      }
    });

    console.log(`📊 ${records.length} réalisations trouvées avec ${existingPublicIds.size} images référencées`);
    
    return existingPublicIds;
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération Airtable:', error.message);
    throw error;
  }
}

/**
 * Génère les métadonnées d'une réalisation à partir d'une image
 */
function generateRealisationMetadata(image) {
  const parsed = parseCreativeFilename(image.filename);
  
  // Générer un titre basé sur le parsing
  let title = parsed.type || 'Création';
  if (parsed.identifier) {
    title += ` ${parsed.identifier}`;
  }
  
  // Générer une description simple
  const description = `Réalisation découverte automatiquement depuis Cloudinary. Type: ${parsed.type || 'non spécifié'}.`;
  
  // Générer des tags basés sur le type et les mots-clés (seulement ceux qui existent dans Airtable)
  const existingTags = ['Campagne', 'Politique', 'Corporate', 'Événement', 'Textile', 'Gadget', 'EPI', 'Moderne', 'Traditionnel', 'Jeunesse'];
  const tags = [];
  
  // Mapper le type vers des tags existants
  const typeToTag = {
    'banderole': 'Textile',
    'tshirt': 'Textile', 
    'polo': 'Textile',
    'casquette': 'Textile',
    'foulard': 'Textile',
    'visiere': 'EPI',
    'gilet': 'EPI',
    'casque': 'EPI',
    'affiche': 'Politique',
    'flyer': 'Politique', 
    'drapeau': 'Politique',
    'calendrier': 'Corporate',
    'pins': 'Gadget',
    'badge': 'Gadget',
    'stylo': 'Gadget',
    'mug': 'Gadget'
  };
  
  // Ajouter le tag correspondant au type
  if (parsed.type && typeToTag[parsed.type]) {
    tags.push(typeToTag[parsed.type]);
  }
  
  // Ajouter des tags génériques par défaut
  if (tags.length === 0) {
    tags.push('Gadget'); // Tag par défaut
  }
  
  // Mapper vers des catégories selon le type (avec vrais IDs Airtable)
  const categoryMapping = {
    'banderole': ['recUUjpO0vhR9CFXl'], // Textile
    'tshirt': ['recUUjpO0vhR9CFXl'],    // Textile
    'polo': ['recUUjpO0vhR9CFXl'],      // Textile
    'casquette': ['recUUjpO0vhR9CFXl'], // Textile
    'foulard': ['recUUjpO0vhR9CFXl'],   // Textile
    'badge': ['recHX23vE2caW4k2l'],     // Gadget
    'stylo': ['recHX23vE2caW4k2l'],     // Gadget
    'mug': ['recHX23vE2caW4k2l'],       // Gadget
    'clé': ['recHX23vE2caW4k2l'],       // Gadget
    'gilet': ['recI96GGyS1WYmdq0'],     // EPI
    'casque': ['recI96GGyS1WYmdq0'],    // EPI
    'visiere': ['recI96GGyS1WYmdq0']    // EPI
  };
  
  const categories = categoryMapping[parsed.type] || ['recHX23vE2caW4k2l']; // Par défaut Gadget
  
  return {
    Title: title,
    Description: description,
    CloudinaryPublicIds: image.public_id, // String simple, pas array
    Tags: tags,
    Categories: categories,
    IsActive: true,
    IsFeatured: false, // Les images auto-découvertes ne sont pas en vedette par défaut
    DisplayOrder: 1000 + Math.floor(Math.random() * 1000) // Ordre élevé pour les mettre à la fin
  };
}

/**
 * Ajoute une nouvelle réalisation dans Airtable
 */
async function addRealisationToAirtable(metadata) {
  try {
    const record = await realisationsTable.create({
      Title: metadata.Title,
      Description: metadata.Description,
      CloudinaryPublicIds: metadata.CloudinaryPublicIds,
      Tags: metadata.Tags,
      Categories: metadata.Categories,
      IsActive: metadata.IsActive,
      IsFeatured: metadata.IsFeatured,
      DisplayOrder: metadata.DisplayOrder
    });
    
    return record;
    
  } catch (error) {
    console.error(`❌ Erreur création réalisation "${metadata.Title}":`, error.message);
    throw error;
  }
}

/**
 * Script principal
 */
async function main() {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Synchronisation Cloudinary Creative → Airtable Realisations');
    console.log('━'.repeat(60));
    
    // 1. Récupérer les images Cloudinary
    const cloudinaryImages = await getCloudinaryCreativeImages();
    
    // 2. Récupérer les réalisations existantes
    const existingPublicIds = await getExistingRealisations();
    
    // 3. Identifier les images manquantes
    const missingImages = cloudinaryImages.filter(image => 
      !existingPublicIds.has(image.public_id)
    );
    
    console.log(`📈 ${missingImages.length} nouvelles images à ajouter`);
    
    if (missingImages.length === 0) {
      console.log('✅ Toutes les images sont déjà synchronisées !');
      return;
    }
    
    // 4. Ajouter les images manquantes
    console.log('📝 Ajout des nouvelles réalisations...');
    
    let added = 0;
    let errors = 0;
    
    for (const image of missingImages) {
      try {
        const metadata = generateRealisationMetadata(image);
        const record = await addRealisationToAirtable(metadata);
        
        console.log(`✅ Ajouté: "${metadata.Title}" (${image.public_id})`);
        added++;
        
        // Petite pause pour éviter les rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Échec: ${image.filename} - ${error.message}`);
        errors++;
      }
    }
    
    // 5. Résumé final
    const duration = Date.now() - startTime;
    
    console.log('━'.repeat(60));
    console.log('🎉 Synchronisation terminée !');
    console.log(`📊 Résultats:`);
    console.log(`   • ${added} nouvelles réalisations ajoutées`);
    console.log(`   • ${errors} erreurs rencontrées`);
    console.log(`   • Durée: ${(duration / 1000).toFixed(1)}s`);
    
    if (added > 0) {
      console.log('');
      console.log('💡 Prochaines étapes recommandées:');
      console.log('   • Vérifier les nouvelles réalisations dans Airtable');
      console.log('   • Ajuster les titres et descriptions si nécessaire');
      console.log('   • Marquer comme "featured" les meilleures réalisations');
      console.log('   • Tester l\'interface /realisations pour voir les nouvelles images');
    }
    
  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
    process.exit(1);
  }
}

// Validation des variables d'environnement
function validateEnvironment() {
  const required = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'AIRTABLE_API_KEY',
    'AIRTABLE_BASE_ID'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:');
    missing.forEach(env => console.error(`   - ${env}`));
    console.error('\n💡 Vérifiez votre fichier .env');
    process.exit(1);
  }
}

// Point d'entrée
if (import.meta.url === `file://${process.argv[1]}`) {
  validateEnvironment();
  main();
}