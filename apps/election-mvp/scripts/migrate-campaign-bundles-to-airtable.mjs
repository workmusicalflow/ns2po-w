#!/usr/bin/env node
/**
 * Script de migration des campaign bundles vers Airtable
 * Migre les données statiques TypeScript vers les nouvelles tables Airtable
 *
 * Usage: node scripts/migrate-campaign-bundles-to-airtable.mjs [--dry-run] [--clear-existing]
 */

import Airtable from 'airtable';

// Configuration Airtable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   AIRTABLE_API_KEY:', AIRTABLE_API_KEY ? '✅' : '❌');
  console.error('   AIRTABLE_BASE_ID:', AIRTABLE_BASE_ID ? '✅' : '❌');
  process.exit(1);
}

// Configuration Airtable
Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

// Arguments de ligne de commande
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const clearExisting = args.includes('--clear-existing');

console.log('🚀 Script de migration Campaign Bundles vers Airtable');
console.log('📊 Mode:', isDryRun ? 'DRY RUN (simulation)' : 'PRODUCTION');
console.log('🗑️ Nettoyage:', clearExisting ? 'OUI' : 'NON');
console.log('');

// =====================================
// DONNÉES STATIQUES À MIGRER
// =====================================

const campaignBundlesData = [
  // Pack Argent - 5K PERSONNES CIBLÉES
  {
    bundle_id: "pack-argent-001",
    name: "Pack Argent",
    description: "Idéal pour toucher 5 000 personnes. L'essentiel pour lancer votre campagne locale avec impact et visibilité de proximité garantie.",
    target_audience: "local",
    budget_range: "starter",
    estimated_total: 1140000,
    original_total: 1267500,
    savings: 127500,
    popularity: 95,
    is_active: true,
    is_featured: true,
    tags: ["5k-personnes", "campagne-locale", "budget-optimisé"],
    products: [
      { product_id: "casquette-argent", product_name: "Casquettes personnalisées", base_price: 2500, quantity: 150 },
      { product_id: "t-shirt-argent", product_name: "T-shirts de campagne", base_price: 3500, quantity: 100 },
      { product_id: "autocollant-argent", product_name: "Autocollants", base_price: 150, quantity: 1000 },
      { product_id: "flyers-argent", product_name: "Flyers A5", base_price: 200, quantity: 2000 },
      { product_id: "sac-argent", product_name: "Sacs cabas personnalisés", base_price: 1500, quantity: 200 }
    ]
  },

  // Pack Or - 10K-15K PERSONNES CIBLÉES
  {
    bundle_id: "pack-or-001",
    name: "Pack Or",
    description: "Parfait pour toucher 10 000 à 15 000 personnes. Équipement professionnel et supports premium pour une campagne d'envergure départementale.",
    target_audience: "regional",
    budget_range: "medium",
    estimated_total: 5700000,
    original_total: 6705000,
    savings: 1005000,
    popularity: 92,
    is_active: true,
    is_featured: true,
    tags: ["10k-15k-personnes", "départementale", "couverture-étendue"],
    products: [
      { product_id: "casquette-or", product_name: "Casquettes brodées premium", base_price: 3500, quantity: 800 },
      { product_id: "t-shirt-or", product_name: "T-shirts qualité export", base_price: 4500, quantity: 500 },
      { product_id: "polo-or", product_name: "Polos dirigeants", base_price: 7000, quantity: 300 },
      { product_id: "veste-or", product_name: "Vestes militants", base_price: 8500, quantity: 200 },
      { product_id: "parapluie-or", product_name: "Parapluies publicitaires", base_price: 4500, quantity: 400 },
      { product_id: "autocollant-or", product_name: "Autocollants véhicules", base_price: 200, quantity: 3000 },
      { product_id: "banderole-or", product_name: "Banderoles grand format", base_price: 25000, quantity: 30 },
      { product_id: "affiche-or", product_name: "Affiches A2", base_price: 500, quantity: 2000 },
      { product_id: "sac-or", product_name: "Sacs à dos personnalisés", base_price: 8000, quantity: 500 }
    ]
  },

  // Pack Platinium - 20K-30K PERSONNES CIBLÉES
  {
    bundle_id: "pack-platinium-001",
    name: "Pack Platinium",
    description: "L'arsenal complet pour toucher 20 000 à 30 000 personnes. Équipement de luxe et logistique complète pour une campagne nationale victorieuse.",
    target_audience: "national",
    budget_range: "premium",
    estimated_total: 18500000,
    original_total: 24666667,
    savings: 6166667,
    popularity: 85,
    is_active: true,
    is_featured: true,
    tags: ["20k-30k-personnes", "national", "prestige", "premium"],
    products: [
      { product_id: "casquette-platinium", product_name: "Casquettes premium édition limitée", base_price: 5000, quantity: 2000 },
      { product_id: "t-shirt-platinium", product_name: "T-shirts collector premium", base_price: 6000, quantity: 1500 },
      { product_id: "polo-platinium", product_name: "Polos dirigeants premium", base_price: 9000, quantity: 800 },
      { product_id: "veste-platinium", product_name: "Vestes de représentation", base_price: 15000, quantity: 500 },
      { product_id: "sac-platinium", product_name: "Attaché-cases executive", base_price: 25000, quantity: 300 },
      { product_id: "parapluie-platinium", product_name: "Parapluies premium", base_price: 6500, quantity: 1000 },
      { product_id: "banderole-platinium", product_name: "Banderoles nationales mesh", base_price: 45000, quantity: 80 },
      { product_id: "drapeau-platinium", product_name: "Drapeaux officiels", base_price: 3500, quantity: 500 },
      { product_id: "tente-platinium", product_name: "Tentes pliables événementielles", base_price: 45000, quantity: 40 },
      { product_id: "panneau-platinium", product_name: "Panneaux dibond grand format", base_price: 12000, quantity: 200 },
      { product_id: "vehicule-platinium", product_name: "Covering véhicules premium", base_price: 200000, quantity: 30 }
    ]
  }
];

// =====================================
// FONCTIONS UTILITAIRES
// =====================================

async function clearExistingData() {
  if (isDryRun) {
    console.log('🧹 [DRY RUN] Nettoyage des données existantes...');
    return;
  }

  console.log('🧹 Nettoyage des données existantes...');

  try {
    // Suppression des BundleProducts
    const bundleProducts = await base('BundleProducts').select().all();
    if (bundleProducts.length > 0) {
      const productIds = bundleProducts.map(record => record.id);
      console.log(`🗑️ Suppression de ${productIds.length} BundleProducts...`);

      // Airtable limite à 10 suppressions par batch
      for (let i = 0; i < productIds.length; i += 10) {
        const batch = productIds.slice(i, i + 10);
        await base('BundleProducts').destroy(batch);
      }
    }

    // Suppression des CampaignBundles
    const campaignBundles = await base('CampaignBundles').select().all();
    if (campaignBundles.length > 0) {
      const bundleIds = campaignBundles.map(record => record.id);
      console.log(`🗑️ Suppression de ${bundleIds.length} CampaignBundles...`);

      for (let i = 0; i < bundleIds.length; i += 10) {
        const batch = bundleIds.slice(i, i + 10);
        await base('CampaignBundles').destroy(batch);
      }
    }

    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

async function migrateBundles() {
  console.log(`📦 Migration de ${campaignBundlesData.length} campaign bundles...`);

  const results = {
    bundles: [],
    products: [],
    errors: []
  };

  for (const bundleData of campaignBundlesData) {
    try {
      console.log(`\n🎯 Migration du bundle: ${bundleData.name}`);

      // 1. Création du CampaignBundle
      const bundleRecord = {
        name: bundleData.name,
        bundle_id: bundleData.bundle_id,
        description: bundleData.description,
        target_audience: bundleData.target_audience,
        budget_range: bundleData.budget_range,
        estimated_total: bundleData.estimated_total,
        original_total: bundleData.original_total,
        savings: bundleData.savings,
        popularity: bundleData.popularity,
        is_active: bundleData.is_active,
        is_featured: bundleData.is_featured,
        tags: bundleData.tags,
        sync_status: 'synced'
      };

      let createdBundle;
      if (isDryRun) {
        console.log('📋 [DRY RUN] Bundle à créer:', bundleRecord);
        createdBundle = { id: `fake_${bundleData.bundle_id}` };
      } else {
        createdBundle = await base('CampaignBundles').create(bundleRecord);
        console.log(`✅ Bundle créé: ${createdBundle.id}`);
      }

      results.bundles.push(createdBundle.id);

      // 2. Création des BundleProducts
      console.log(`📦 Création de ${bundleData.products.length} produits...`);

      for (let i = 0; i < bundleData.products.length; i++) {
        const product = bundleData.products[i];

        const productRecord = {
          product_name: product.product_name,
          product_id: product.product_id,
          base_price: product.base_price,
          quantity: product.quantity,
          campaign_bundle: [createdBundle.id],
          display_order: i + 1
        };

        if (isDryRun) {
          console.log(`📋 [DRY RUN] Produit à créer:`, productRecord);
        } else {
          const createdProduct = await base('CampaignBundleProducts').create(productRecord);
          console.log(`  ✅ Produit créé: ${product.product_name} (${createdProduct.id})`);
          results.products.push(createdProduct.id);
        }
      }

      console.log(`✅ Bundle "${bundleData.name}" migré avec succès`);

    } catch (error) {
      console.error(`❌ Erreur migration bundle "${bundleData.name}":`, error);
      results.errors.push({
        bundle: bundleData.name,
        error: error.message
      });
    }
  }

  return results;
}

// =====================================
// EXECUTION PRINCIPALE
// =====================================

async function main() {
  try {
    const startTime = Date.now();

    // Vérification connexion Airtable
    console.log('🔍 Vérification connexion Airtable...');
    if (!isDryRun) {
      await base('CampaignBundles').select({ maxRecords: 1 }).firstPage();
      console.log('✅ Connexion Airtable OK');
    }

    // Nettoyage si demandé
    if (clearExisting) {
      await clearExistingData();
    }

    // Migration
    const results = await migrateBundles();

    // Rapport final
    const duration = (Date.now() - startTime) / 1000;
    console.log('\n🎉 Migration terminée !');
    console.log('📊 Résultats:');
    console.log(`   ✅ Bundles migrés: ${results.bundles.length}`);
    console.log(`   ✅ Produits migrés: ${results.products.length}`);
    console.log(`   ❌ Erreurs: ${results.errors.length}`);
    console.log(`   ⏱️ Durée: ${duration}s`);

    if (results.errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:');
      results.errors.forEach(error => {
        console.log(`   - ${error.bundle}: ${error.error}`);
      });
    }

    if (isDryRun) {
      console.log('\n💡 Ceci était une simulation. Relancez sans --dry-run pour effectuer la migration.');
    } else {
      console.log('\n🚀 Migration réelle terminée avec succès !');
      console.log('📝 Prochaines étapes:');
      console.log('   1. Vérifier les données dans Airtable');
      console.log('   2. Configurer les automations');
      console.log('   3. Tester l\'API /api/campaign-bundles');
    }

  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancement du script
main();