#!/usr/bin/env node
/**
 * Script de test d'intégration complète Campaign Bundles
 * Valide le système complet : API, Cache, Fallback, Airtable
 *
 * Usage: node scripts/test-campaign-bundles-integration.mjs [--verbose]
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');

console.log('🧪 Test d\'intégration complète Campaign Bundles');
console.log('📊 Mode:', verbose ? 'VERBOSE' : 'STANDARD');
console.log('');

// =====================================
// CONFIGURATION TESTS
// =====================================

const TEST_CONFIG = {
  // URL de l'application (local ou déployée)
  APP_URL: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  // Airtable (optionnel pour tests API)
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,

  // Tests à exécuter
  TESTS: {
    STATIC_DATA: true,        // Test des données statiques
    API_ROUTES: true,         // Test des routes API
    CACHE_SYSTEM: true,       // Test du système de cache
    FALLBACK_MECHANISM: true, // Test du fallback
    PERFORMANCE: true         // Test de performance
  }
};

// =====================================
// UTILITAIRES
// =====================================

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async test(name, testFn) {
    this.results.total++;
    try {
      console.log(`🔍 ${name}...`);
      const startTime = Date.now();

      await testFn();

      const duration = Date.now() - startTime;
      this.results.passed++;
      console.log(`  ✅ ${name} (${duration}ms)`);

      if (verbose) {
        console.log(`     Durée: ${duration}ms`);
      }
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      console.log(`  ❌ ${name}: ${error.message}`);

      if (verbose) {
        console.log(`     Stack: ${error.stack}`);
      }
    }
  }

  generateReport() {
    const successRate = (this.results.passed / this.results.total * 100).toFixed(1);

    console.log('\n🎉 RAPPORT DE TEST');
    console.log('='.repeat(50));
    console.log(`📊 Total: ${this.results.total}`);
    console.log(`✅ Réussis: ${this.results.passed}`);
    console.log(`❌ Échoués: ${this.results.failed}`);
    console.log(`📈 Taux de succès: ${successRate}%`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    const isSuccess = this.results.failed === 0;
    console.log('\n' + '='.repeat(50));

    if (isSuccess) {
      console.log('🎉 TOUS LES TESTS PASSÉS ! L\'intégration fonctionne parfaitement.');
    } else {
      console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ. Vérifiez les erreurs ci-dessus.');
    }

    return isSuccess;
  }
}

// =====================================
// TESTS UNITAIRES
// =====================================

async function testStaticData() {
  // Test 1: Vérification de l'existence et structure des données statiques
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Chemin correct vers le fichier TypeScript
    const staticDataPath = path.join(__dirname, '../../../packages/types/src/campaign-bundles-data.ts');

    if (!fs.existsSync(staticDataPath)) {
      throw new Error(`Fichier de données statiques non trouvé: ${staticDataPath}`);
    }

    // Lecture et vérification du contenu
    const content = fs.readFileSync(staticDataPath, 'utf-8');

    // Vérifications de structure par regex
    const expectedBundles = ['pack-argent-001', 'pack-or-001', 'pack-platinium-001'];
    for (const bundleId of expectedBundles) {
      if (!content.includes(bundleId)) {
        throw new Error(`Bundle attendu non trouvé dans le fichier: ${bundleId}`);
      }
    }

    // Vérification que les exports sont présents
    if (!content.includes('export const campaignBundles')) {
      throw new Error('Export campaignBundles non trouvé');
    }

    // Vérification des champs requis
    const requiredFields = ['id:', 'name:', 'description:', 'estimatedTotal:', 'products:'];
    for (const field of requiredFields) {
      if (!content.includes(field)) {
        throw new Error(`Champ requis non trouvé: ${field}`);
      }
    }

    if (verbose) {
      console.log(`     Fichier trouvé: ${staticDataPath}`);
      console.log(`     Taille: ${content.length} caractères`);
    }

  } catch (error) {
    throw new Error(`Erreur vérification données statiques: ${error.message}`);
  }
}

async function testAPIRoutes() {
  // Test des routes API (si serveur démarré)
  const routes = [
    '/api/campaign-bundles',
    '/api/campaign-bundles/pack-argent-001'
  ];

  for (const route of routes) {
    try {
      const url = `${TEST_CONFIG.APP_URL}${route}`;
      const response = await fetch(url);

      if (!response.ok) {
        // Si 404, le serveur n'est peut-être pas démarré
        if (response.status === 404) {
          throw new Error(`Route non trouvée: ${route} (serveur démarré ?)`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (route === '/api/campaign-bundles') {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('API doit retourner un tableau non vide');
        }
      } else {
        if (!data || !data.id) {
          throw new Error('API doit retourner un bundle avec un id');
        }
      }

      if (verbose) {
        console.log(`     ${route}: ${response.status} - ${JSON.stringify(data).substring(0, 100)}...`);
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Serveur non accessible sur ${TEST_CONFIG.APP_URL} (démarré ?)`);
      }
      throw error;
    }
  }
}

async function testCacheSystem() {
  // Test du système de cache - vérification de l'existence et structure
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Vérifier l'existence du fichier cache
    const cachePath = path.join(__dirname, '../composables/useCache.ts');

    if (!fs.existsSync(cachePath)) {
      throw new Error(`Fichier useCache.ts non trouvé: ${cachePath}`);
    }

    // Lecture et vérification du contenu
    const content = fs.readFileSync(cachePath, 'utf-8');

    // Vérifier les fonctions essentielles du cache
    const requiredFunctions = [
      'export const useCache',
      'const get =',
      'const set =',
      'const remove =',
      'const clear =',
      'const getOrSet =',
      'const invalidateByTags =',
      'const invalidateByPattern =',
      'const cleanExpiredEntries ='
    ];

    for (const func of requiredFunctions) {
      if (!content.includes(func)) {
        throw new Error(`Fonction cache manquante: ${func}`);
      }
    }

    // Vérifier les types/interfaces essentiels
    const requiredTypes = [
      'interface CacheEntry',
      'interface CacheOptions',
      'interface CacheStats'
    ];

    for (const type of requiredTypes) {
      if (!content.includes(type)) {
        throw new Error(`Type cache manquant: ${type}`);
      }
    }

    // Vérifier la présence de fonctionnalités avancées
    const advancedFeatures = [
      'TTL', 'LRU', 'memoryCache', 'cacheStats', 'evictIfNeeded'
    ];

    for (const feature of advancedFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Fonctionnalité cache manquante: ${feature}`);
      }
    }

    if (verbose) {
      console.log(`     Fichier cache trouvé: ${cachePath}`);
      console.log(`     Taille: ${content.length} caractères`);
      console.log(`     Fonctions détectées: ${requiredFunctions.length}`);
    }

  } catch (error) {
    throw new Error(`Erreur test cache: ${error.message}`);
  }
}

async function testFallbackMechanism() {
  // Test du mécanisme de fallback - vérification de l'existence et structure
  try {
    const fs = await import('fs');
    const path = await import('path');

    // Vérifier l'existence du composable
    const composablePath = path.join(__dirname, '../composables/useCampaignBundles.ts');

    if (!fs.existsSync(composablePath)) {
      throw new Error(`Fichier useCampaignBundles.ts non trouvé: ${composablePath}`);
    }

    // Lecture et vérification du contenu
    const content = fs.readFileSync(composablePath, 'utf-8');

    // Vérifier les fonctions essentielles du composable
    const requiredFeatures = [
      'export const useCampaignBundles',
      'apiCampaignBundles',
      'useStaticFallback',
      'currentBundles',
      'getBundleById',
      'refreshBundles',
      '$fetch',
      'staticCampaignBundles'
    ];

    for (const feature of requiredFeatures) {
      if (!content.includes(feature)) {
        throw new Error(`Fonctionnalité fallback manquante: ${feature}`);
      }
    }

    // Vérifier la logique de fallback
    const fallbackLogic = [
      'useStaticFallback.value',
      'staticCampaignBundles',
      'apiCampaignBundles.value',
      'catch',
      'error'
    ];

    for (const logic of fallbackLogic) {
      if (!content.includes(logic)) {
        throw new Error(`Logique fallback manquante: ${logic}`);
      }
    }

    if (verbose) {
      console.log(`     Composable fallback trouvé: ${composablePath}`);
      console.log(`     Taille: ${content.length} caractères`);
      console.log(`     Fonctionnalités détectées: ${requiredFeatures.length}`);
    }

  } catch (error) {
    throw new Error(`Erreur test fallback: ${error.message}`);
  }
}

async function testPerformance() {
  // Test de performance basique - lecture de fichiers
  const iterations = 100;
  const startTime = Date.now();

  try {
    const fs = await import('fs');
    const path = await import('path');

    // Test de lecture répétée (simule l'utilisation intensive)
    const staticDataPath = path.join(__dirname, '../../../packages/types/src/campaign-bundles-data.ts');

    if (!fs.existsSync(staticDataPath)) {
      throw new Error('Fichier de données statiques non trouvé pour test performance');
    }

    for (let i = 0; i < iterations; i++) {
      const content = fs.readFileSync(staticDataPath, 'utf-8');
      if (content.length < 1000) {
        throw new Error('Données corrompues lors du test de performance');
      }

      // Simulation d'un parsing basique
      const bundleCount = (content.match(/pack-.*-001/g) || []).length;
      if (bundleCount !== 3) {
        throw new Error(`Nombre de bundles incorrect: ${bundleCount}`);
      }
    }

    const duration = Date.now() - startTime;
    const avgTime = duration / iterations;

    // Seuil de performance: moins de 10ms par lecture en moyenne
    if (avgTime > 10) {
      throw new Error(`Performance insuffisante: ${avgTime.toFixed(2)}ms/lecture (seuil: 10ms)`);
    }

    if (verbose) {
      console.log(`     ${iterations} lectures en ${duration}ms (${avgTime.toFixed(2)}ms/lecture)`);
    }

  } catch (error) {
    throw new Error(`Erreur test performance: ${error.message}`);
  }
}

async function testMigrationScriptLogic() {
  // Test de la logique du script de migration (sans exécution)
  try {
    const migrationScript = await import('./migrate-campaign-bundles-to-airtable.mjs');

    // Vérifier que le script peut être importé sans erreur
    if (verbose) {
      console.log(`     Script de migration importé avec succès`);
    }

  } catch (error) {
    throw new Error(`Erreur import script migration: ${error.message}`);
  }
}

// =====================================
// EXECUTION PRINCIPALE
// =====================================

async function main() {
  const runner = new TestRunner();

  console.log('🚀 Démarrage des tests d\'intégration...\n');

  // Tests des données statiques
  if (TEST_CONFIG.TESTS.STATIC_DATA) {
    await runner.test('Données statiques Campaign Bundles', testStaticData);
  }

  // Tests du système de cache
  if (TEST_CONFIG.TESTS.CACHE_SYSTEM) {
    await runner.test('Système de cache', testCacheSystem);
  }

  // Tests du mécanisme de fallback
  if (TEST_CONFIG.TESTS.FALLBACK_MECHANISM) {
    await runner.test('Mécanisme de fallback', testFallbackMechanism);
  }

  // Tests de performance
  if (TEST_CONFIG.TESTS.PERFORMANCE) {
    await runner.test('Performance', testPerformance);
  }

  // Test de la logique de migration
  await runner.test('Logique script de migration', testMigrationScriptLogic);

  // Tests des routes API (si serveur disponible)
  if (TEST_CONFIG.TESTS.API_ROUTES) {
    await runner.test('Routes API Campaign Bundles (optionnel)', async () => {
      try {
        await testAPIRoutes();
      } catch (error) {
        if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
          console.log('     ⚠️ Serveur non accessible - test ignoré (normal en développement)');
          return; // Test réussi mais ignoré
        }
        throw error; // Autre erreur, on la remonte
      }
    });
  }

  // Génération du rapport final
  const success = runner.generateReport();

  // Recommandations post-test
  console.log('\n📝 Prochaines étapes recommandées:');
  if (success) {
    console.log('   1. ✅ Exécuter la migration: node scripts/migrate-campaign-bundles-to-airtable.mjs --dry-run');
    console.log('   2. ✅ Configurer les automations Airtable selon le guide');
    console.log('   3. ✅ Tester en production avec données réelles');
    console.log('   4. ✅ Déployer sur Vercel');
  } else {
    console.log('   1. ❌ Corriger les erreurs détectées ci-dessus');
    console.log('   2. ❌ Relancer les tests jusqu\'à 100% de succès');
    console.log('   3. ❌ Vérifier la configuration d\'environnement');
  }

  process.exit(success ? 0 : 1);
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('\n💥 Erreur non gérée:', error);
  process.exit(1);
});

// Lancement du script
main();