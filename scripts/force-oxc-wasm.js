#!/usr/bin/env node
// Script pour forcer oxc-parser à utiliser son fallback WASM via variables d'environnement

console.log('🔧 Configuration d\'oxc-parser en mode WASM...');

// Force les variables d'environnement WASM de manière définitive
process.env.FORCE_WASM = '1';
process.env.USE_WASM = 'true';
process.env.DISABLE_NATIVE_BINDINGS = 'true';
process.env.NETLIFY = 'true';
process.env.NETLIFY_BUILD = 'true';
process.env.NAPI_RS_FORCE_WASI = '1';
process.env.WEBCONTAINER = '1';

console.log('✅ Variables d\'environnement WASM configurées:');
console.log('   FORCE_WASM=1');
console.log('   USE_WASM=true');
console.log('   DISABLE_NATIVE_BINDINGS=true');
console.log('   NETLIFY=true');
console.log('   NAPI_RS_FORCE_WASI=1');

// Test que le binding WASM est disponible
const fs = require('fs');
const path = require('path');

try {
  // Vérifier que le binding WASM est installé
  const wasmBindingPath = path.join(process.cwd(), 'node_modules/@oxc-parser/binding-wasm32-wasi');
  if (fs.existsSync(wasmBindingPath)) {
    console.log('✅ @oxc-parser/binding-wasm32-wasi disponible');
  } else {
    console.log('⚠️  @oxc-parser/binding-wasm32-wasi non trouvé');
  }

  // Test basique du require (optionnel)
  console.log('🧪 Test de require du binding WASM...');
  const wasmBinding = require('@oxc-parser/binding-wasm32-wasi');
  console.log('✅ Binding WASM chargé avec succès');

} catch (error) {
  console.log('⚠️  Test binding WASM:', error.message);
  console.log('ℹ️  Le binding WASM sera utilisé via fallback automatique');
}

console.log('🎯 Configuration WASM terminée - oxc-parser utilisera WASM sur Netlify');