/**
 * Configuration et setup global pour les tests d'asset management
 * Initialise l'environnement de test avec les mocks et configurations nécessaires
 */

import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Configuration globale des timeouts pour les tests d'assets
global.TEST_TIMEOUT_DEFAULT = 10000;
global.TEST_TIMEOUT_LONG = 30000;

// Chemins de test standardisés
global.TEST_PATHS = {
  tempAssets: path.join(process.cwd(), 'tests/temp-assets'),
  fixtures: path.join(process.cwd(), 'tests/fixtures'),
  scripts: path.join(process.cwd(), 'scripts')
};

// Variables d'environnement de test
process.env.NODE_ENV = 'test';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.AIRTABLE_API_KEY = 'test-airtable-key';
process.env.AIRTABLE_BASE_ID = 'test-base-id';
process.env.TURSO_DATABASE_URL = 'file:test.db';
process.env.TURSO_AUTH_TOKEN = 'test-turso-token';

// Mock Cloudinary API
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn().mockResolvedValue({
        public_id: 'test-public-id',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test-public-id.jpg',
        bytes: 128000,
        format: 'jpg',
        created_at: new Date().toISOString()
      }),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
      explicit: vi.fn().mockResolvedValue({ public_id: 'test-public-id' })
    },
    api: {
      delete_resources: vi.fn().mockResolvedValue({ deleted: ['test-public-id'] }),
      resources: vi.fn().mockResolvedValue({
        resources: [
          {
            public_id: 'test-public-id',
            format: 'jpg',
            bytes: 128000,
            created_at: '2025-08-22T10:00:00Z'
          }
        ]
      })
    }
  }
}));

// Mock Airtable API
vi.mock('airtable', () => {
  const mockRecord = {
    id: 'recTestId123',
    fields: {
      name: 'Test Asset',
      category: 'products',
      cloudinary_id: 'test-public-id',
      file_url: 'https://res.cloudinary.com/test/image/upload/test-public-id.jpg',
      status: 'active',
      created_at: new Date().toISOString()
    },
    get: vi.fn(field => mockRecord.fields[field])
  };

  return {
    default: vi.fn(() => ({
      base: vi.fn(() => ({
        table: vi.fn(() => ({
          select: vi.fn(() => ({
            all: vi.fn().mockResolvedValue([mockRecord])
          })),
          create: vi.fn().mockResolvedValue([mockRecord]),
          update: vi.fn().mockResolvedValue([mockRecord]),
          destroy: vi.fn().mockResolvedValue([{ id: 'recTestId123', deleted: true }]),
          find: vi.fn().mockResolvedValue(mockRecord)
        }))
      }))
    }))
  };
});

// Mock Turso/LibSQL
vi.mock('@libsql/client', () => ({
  createClient: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({
      rows: [
        {
          id: 1,
          cloudinary_id: 'test-public-id',
          airtable_id: 'recTestId123',
          category: 'products',
          metadata: '{"format":"jpg","bytes":128000}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      meta: { changes: 1 }
    }),
    batch: vi.fn().mockResolvedValue([
      { meta: { changes: 1 } }
    ]),
    close: vi.fn().mockResolvedValue()
  }))
}));

// Mock filesystem operations pour les tests
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    default: {
      ...actual.default,
      existsSync: vi.fn(() => true),
      readFileSync: vi.fn(() => 'mock file content'),
      writeFileSync: vi.fn(),
      unlinkSync: vi.fn(),
      mkdirSync: vi.fn(),
      createReadStream: vi.fn(() => ({
        pipe: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'end') callback();
          return this;
        })
      }))
    }
  };
});

// Mock fetch pour les requêtes HTTP
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      success: true,
      message: 'Mock API response'
    })
  })
);

// Utilitaires de test globaux
global.createMockAsset = (filename, options = {}) => ({
  filename,
  path: path.join(global.TEST_PATHS.tempAssets, filename),
  size: options.size || 128000,
  mimetype: options.mimetype || 'image/jpeg',
  buffer: Buffer.from('mock image data'),
  ...options
});

global.createMockCloudinaryResponse = (publicId, options = {}) => ({
  public_id: publicId,
  secure_url: `https://res.cloudinary.com/test/image/upload/${publicId}.jpg`,
  bytes: options.bytes || 128000,
  format: options.format || 'jpg',
  created_at: options.created_at || new Date().toISOString(),
  ...options
});

global.createMockAirtableRecord = (fields = {}) => ({
  id: 'recMockId123',
  fields: {
    name: 'Mock Asset',
    category: 'products',
    cloudinary_id: 'mock-public-id',
    status: 'active',
    created_at: new Date().toISOString(),
    ...fields
  },
  get: function(field) { return this.fields[field]; }
});

// Nettoyage avant et après les tests
beforeEach(() => {
  // Reset tous les mocks
  vi.clearAllMocks();
  
  // Créer les dossiers temporaires si nécessaire
  if (!fs.existsSync(global.TEST_PATHS.tempAssets)) {
    try {
      fs.mkdirSync(global.TEST_PATHS.tempAssets, { recursive: true });
    } catch (_error) {
      // Ignore si le dossier existe déjà
    }
  }
});

afterEach(() => {
  // Nettoyage spécifique aux tests d'assets
  vi.resetAllMocks();
});

// Nettoyage global après tous les tests
afterAll(() => {
  // Nettoyer les ressources si nécessaire
  try {
    if (fs.existsSync(global.TEST_PATHS.tempAssets)) {
      fs.rmSync(global.TEST_PATHS.tempAssets, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
});

// Helpers pour les assertions de performance
global.expectPerformance = (actualTime, expectedMaxTime, operation = 'operation') => {
  if (actualTime > expectedMaxTime) {
    throw new Error(
      `Performance test failed: ${operation} took ${actualTime}ms, expected < ${expectedMaxTime}ms`
    );
  }
};

// Helper pour créer des assets de test temporaires
global.createTempAsset = async (filename, content = 'mock image data') => {
  const fullPath = path.join(global.TEST_PATHS.tempAssets, filename);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content);
  return fullPath;
};

console.log('✅ Asset management test environment initialized');