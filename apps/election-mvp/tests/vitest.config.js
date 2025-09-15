/**
 * Configuration Vitest pour les tests d'asset management
 */

import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    // Configuration globale des tests
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.js'],
    
    // Timeouts pour les tests d'intégration
    testTimeout: 30000,
    hookTimeout: 10000,
    
    // Configuration des mocks
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    
    // Couverture de code
    coverage: {
      provider: 'v8',
      include: [
        'scripts/**/*.js',
        'scripts/**/*.mjs'
      ],
      exclude: [
        'tests/**',
        'node_modules/**',
        '**/*.config.js',
        '**/*.config.mjs'
      ],
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    },
    
    // Configuration du reporter
    reporter: [
      'verbose',
      'json',
      ['html', { outputFile: './test-results.html' }]
    ],
    
    // Variables d'environnement pour les tests
    env: {
      NODE_ENV: 'test',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-key',
      CLOUDINARY_API_SECRET: 'test-secret',
      AIRTABLE_API_KEY: 'test-airtable-key',
      AIRTABLE_BASE_ID: 'test-base-id',
      TURSO_DATABASE_URL: 'file:test.db',
      TURSO_AUTH_TOKEN: 'test-token'
    },
    
    // Alias pour les imports
    alias: {
      '@': path.resolve(__dirname, '../'),
      '@scripts': path.resolve(__dirname, '../scripts'),
      '@lib': path.resolve(__dirname, '../scripts/lib'),
      '@fixtures': path.resolve(__dirname, './fixtures')
    }
  }
});