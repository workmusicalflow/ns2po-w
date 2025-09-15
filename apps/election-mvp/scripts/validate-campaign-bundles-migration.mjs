#!/usr/bin/env node
/**
 * Script de validation de la migration des campaign bundles
 * Vérifie que les données ont été correctement migrées vers Airtable
 *
 * Usage: node scripts/validate-campaign-bundles-migration.mjs
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

console.log('🔍 Validation de la migration Campaign Bundles');
console.log('');

// Données attendues pour validation
const expectedBundles = [
  { bundle_id: "pack-argent-001", name: "Pack Argent", productCount: 5 },
  { bundle_id: "pack-or-001", name: "Pack Or", productCount: 9 },
  { bundle_id: "pack-platinium-001", name: "Pack Platinium", productCount: 11 }
];

async function validateCampaignBundles() {
  console.log('📦 Validation des CampaignBundles...');

  try {
    const records = await base('CampaignBundles').select().all();
    console.log(`✅ ${records.length} bundles trouvés dans Airtable`);

    const validation = {
      total: records.length,
      expected: expectedBundles.length,
      valid: 0,
      errors: []
    };

    for (const expected of expectedBundles) {
      const found = records.find(record =>
        record.fields.bundle_id === expected.bundle_id
      );

      if (!found) {
        validation.errors.push(`❌ Bundle manquant: ${expected.bundle_id}`);
        continue;
      }

      console.log(`  ✅ ${expected.name} (${found.fields.bundle_id})`);
      console.log(`     - Prix: ${found.fields.estimated_total?.toLocaleString()} FCFA`);
      console.log(`     - Audience: ${found.fields.target_audience}`);
      console.log(`     - Actif: ${found.fields.is_active ? '✅' : '❌'}`);
      console.log(`     - Featured: ${found.fields.is_featured ? '⭐' : '⚪'}`);

      validation.valid++;
    }

    return validation;
  } catch (error) {
    console.error('❌ Erreur validation CampaignBundles:', error);
    throw error;
  }
}

async function validateBundleProducts() {
  console.log('\n📦 Validation des BundleProducts...');

  try {
    const records = await base('BundleProducts').select().all();
    console.log(`✅ ${records.length} produits trouvés dans Airtable`);

    const productsByBundle = {};
    let totalExpectedProducts = 0;

    // Groupement par bundle
    for (const record of records) {
      const bundleIds = record.fields.campaign_bundle || [];
      for (const bundleId of bundleIds) {
        if (!productsByBundle[bundleId]) {
          productsByBundle[bundleId] = [];
        }
        productsByBundle[bundleId].push(record);
      }
    }

    // Validation par bundle attendu
    for (const expected of expectedBundles) {
      totalExpectedProducts += expected.productCount;

      // Récupération du bundle pour avoir l'ID Airtable
      const bundleRecords = await base('CampaignBundles')
        .select({ filterByFormula: `{bundle_id} = "${expected.bundle_id}"` })
        .all();

      if (bundleRecords.length === 0) {
        console.log(`  ❌ Bundle non trouvé: ${expected.bundle_id}`);
        continue;
      }

      const bundleRecordId = bundleRecords[0].id;
      const products = productsByBundle[bundleRecordId] || [];

      console.log(`  📋 ${expected.name}:`);
      console.log(`     - Attendu: ${expected.productCount} produits`);
      console.log(`     - Trouvé: ${products.length} produits`);

      if (products.length === expected.productCount) {
        console.log(`     ✅ Nombre correct`);
      } else {
        console.log(`     ❌ Nombre incorrect`);
      }

      // Affichage des produits
      products.forEach(product => {
        const subtotal = (product.fields.base_price || 0) * (product.fields.quantity || 0);
        console.log(`       - ${product.fields.product_name}`);
        console.log(`         ${product.fields.quantity}x ${product.fields.base_price} = ${subtotal.toLocaleString()} FCFA`);
      });
    }

    return {
      total: records.length,
      expected: totalExpectedProducts,
      bundleBreakdown: productsByBundle
    };
  } catch (error) {
    console.error('❌ Erreur validation BundleProducts:', error);
    throw error;
  }
}

async function validateAPICompatibility() {
  console.log('\n🔌 Test de compatibilité API...');

  try {
    // Test de la structure des données
    const bundles = await base('CampaignBundles').select({ maxRecords: 1 }).all();

    if (bundles.length === 0) {
      console.log('❌ Aucun bundle trouvé pour le test API');
      return false;
    }

    const bundle = bundles[0];
    const requiredFields = [
      'name', 'bundle_id', 'description', 'target_audience',
      'budget_range', 'estimated_total', 'is_active'
    ];

    console.log('  🔍 Vérification des champs requis...');
    const missingFields = [];

    for (const field of requiredFields) {
      if (bundle.fields[field] === undefined) {
        missingFields.push(field);
      }
    }

    if (missingFields.length === 0) {
      console.log('  ✅ Tous les champs requis sont présents');
    } else {
      console.log(`  ❌ Champs manquants: ${missingFields.join(', ')}`);
    }

    // Test de récupération des produits
    const products = await base('BundleProducts')
      .select({
        filterByFormula: `FIND("${bundle.id}", ARRAYJOIN({campaign_bundle}, ","))`,
        maxRecords: 5
      })
      .all();

    console.log(`  📦 ${products.length} produits liés trouvés`);

    return missingFields.length === 0;
  } catch (error) {
    console.error('❌ Erreur test API:', error);
    return false;
  }
}

async function generateMigrationReport() {
  console.log('\n📊 Génération du rapport de migration...');

  try {
    const bundleValidation = await validateCampaignBundles();
    const productValidation = await validateBundleProducts();
    const apiCompatible = await validateAPICompatibility();

    console.log('\n🎉 RAPPORT DE MIGRATION');
    console.log('='.repeat(50));
    console.log(`📦 CampaignBundles: ${bundleValidation.valid}/${bundleValidation.expected} ✅`);
    console.log(`📦 BundleProducts: ${productValidation.total} total (attendu: ${productValidation.expected})`);
    console.log(`🔌 Compatibilité API: ${apiCompatible ? '✅' : '❌'}`);

    if (bundleValidation.errors.length > 0) {
      console.log('\n❌ Erreurs détectées:');
      bundleValidation.errors.forEach(error => console.log(`   ${error}`));
    }

    const isFullyValid =
      bundleValidation.valid === bundleValidation.expected &&
      productValidation.total === productValidation.expected &&
      apiCompatible &&
      bundleValidation.errors.length === 0;

    console.log('\n' + '='.repeat(50));
    if (isFullyValid) {
      console.log('🎉 MIGRATION RÉUSSIE ! Toutes les validations sont OK.');
      console.log('\n📝 Prochaines étapes recommandées:');
      console.log('   1. Tester l\'API: GET /api/campaign-bundles');
      console.log('   2. Mettre à jour le composable useCampaignBundles');
      console.log('   3. Configurer les automations Airtable');
    } else {
      console.log('⚠️  MIGRATION INCOMPLÈTE. Vérifiez les erreurs ci-dessus.');
    }

    return isFullyValid;
  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
    return false;
  }
}

// Exécution principale
async function main() {
  try {
    console.log('🔍 Début de la validation...\n');

    const isValid = await generateMigrationReport();

    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  }
}

main();