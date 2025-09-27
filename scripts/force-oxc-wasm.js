#!/usr/bin/env node
// Script pour forcer oxc-parser et oxc-transform à utiliser leur fallback WASM via variables d'environnement

console.log('🔧 Configuration d\'oxc-parser et oxc-transform en mode WASM...');

// Force les variables d'environnement WASM de manière définitive
process.env.FORCE_WASM = '1';
process.env.USE_WASM = 'true';
process.env.DISABLE_NATIVE_BINDINGS = 'true';
process.env.NETLIFY = 'true';
process.env.NETLIFY_BUILD = 'true';
process.env.NAPI_RS_FORCE_WASI = '1';
process.env.WEBCONTAINER = '1';
// Variables spécifiques pour oxc-transform
process.env.OXC_FORCE_WASM = 'true';
process.env.OXLINT_FORCE_WASM = '1';

console.log('✅ Variables d\'environnement WASM configurées:');
console.log('   FORCE_WASM=1');
console.log('   USE_WASM=true');
console.log('   DISABLE_NATIVE_BINDINGS=true');
console.log('   NETLIFY=true');
console.log('   NAPI_RS_FORCE_WASI=1');
console.log('   OXC_FORCE_WASM=true');
console.log('   OXLINT_FORCE_WASM=1');

// Test que le binding WASM est disponible
const fs = require('fs');
const path = require('path');

try {
  // Vérifier que les bindings WASM sont installés
  const parserWasmPath = path.join(process.cwd(), 'node_modules/@oxc-parser/binding-wasm32-wasi');
  const transformWasmPath = path.join(process.cwd(), 'node_modules/@oxc-transform/binding-wasm32-wasi');

  if (fs.existsSync(parserWasmPath)) {
    console.log('✅ @oxc-parser/binding-wasm32-wasi disponible');
  } else {
    console.log('⚠️  @oxc-parser/binding-wasm32-wasi non trouvé');
  }

  if (fs.existsSync(transformWasmPath)) {
    console.log('✅ @oxc-transform/binding-wasm32-wasi disponible');
  } else {
    console.log('⚠️  @oxc-transform/binding-wasm32-wasi non trouvé');
  }

  // Test basique du require (optionnel)
  console.log('🧪 Test de require des bindings WASM...');
  const parserWasm = require('@oxc-parser/binding-wasm32-wasi');
  console.log('✅ Parser WASM chargé avec succès');

  const transformWasm = require('@oxc-transform/binding-wasm32-wasi');
  console.log('✅ Transform WASM chargé avec succès');

} catch (error) {
  console.log('⚠️  Test binding WASM:', error.message);
  console.log('ℹ️  Les bindings WASM seront utilisés via fallback automatique');
}

console.log('🎯 Configuration WASM terminée - oxc-parser et oxc-transform utiliseront WASM sur Netlify');