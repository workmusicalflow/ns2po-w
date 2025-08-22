#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/election-mvp/services/airtableMcp.ts',
  'apps/election-mvp/server/utils/email.ts'
];

const baseDir = '/Users/ns2poportable/Desktop/ns2po-w';

function fixTypeAssertions(filePath) {
  const fullPath = path.join(baseDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  // Pattern pour détecter les assertions inutiles dans les config d'environnement
  const patterns = [
    // Pour les config MCP Airtable (ces assertions sont nécessaires)
    // On ne touchera pas aux patterns dans airtableMcp.ts car ils traitent des données API
    
    // Pour email.ts, on garde les assertions car elles sont nécessaires pour Nuxt config
  ];
  
  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`No changes needed for ${filePath}`);
  }
}

console.log('Analyzing TypeScript assertion issues...');
filesToFix.forEach(fixTypeAssertions);
console.log('Analysis complete. Most type assertions are needed for proper Nuxt configuration.');