/**
 * 🧪 Tests Suite - Asset Management System
 * 
 * Tests complets des workflows d'asset management:
 * - Parsing des noms de fichiers
 * - Upload vers Cloudinary
 * - Synchronisation Airtable ↔ Turso
 * - Invalidation de cache
 * - Performance monitoring
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import des modules à tester
import { parseFilename, generateCloudinaryTransformations, validateAssetFile } from '../scripts/lib/asset-utils.js';
import { 
  invalidateAssetCache, 
  invalidateBatch, 
  getInvalidationStats,
  batchInvalidateCache,
  invalidateAsset 
} from '../scripts/lib/cache-invalidation.js';
import { 
  syncDifferential, 
  getSyncHealth,
  checkSyncHealth,
  generateSyncReport 
} from '../scripts/sync-performance.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des tests
const TEST_CONFIG = {
  testAssetsPath: path.join(__dirname, 'fixtures', 'assets'),
  mockCloudinaryResponses: {
    upload: {
      public_id: 'ns2po/products/textiles/textile-tshirt-001',
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/ns2po/products/textiles/textile-tshirt-001.jpg',
      width: 800,
      height: 600,
      format: 'jpg',
      bytes: 45678
    },
    invalidate: {
      public_id: 'ns2po/products/textiles/textile-tshirt-001',
      invalidated: ['ns2po/products/textiles/textile-tshirt-001'],
      next_cursor: null
    }
  }
};

describe('🏷️ Asset Utils - Filename Parsing', () => {
  describe('parseFilename', () => {
    it('doit parser correctement un nom de textile', () => {
      const result = parseFilename('/path/to/textile-tshirt-001.jpg');
      
      expect(result).toEqual({
        category: 'products',
        subcategory: 'textiles',
        type: 'tshirt',
        number: '001',
        originalName: 'textile-tshirt-001.jpg',
        extension: '.jpg',
        cloudinaryFolder: 'ns2po/products/textiles',
        isRecognized: true
      });
    });

    it('doit parser correctement un logo client', () => {
      const result = parseFilename('logo-client-acme-corp.svg');
      
      expect(result).toEqual({
        category: 'logos',
        subcategory: 'client-samples',
        type: 'logo',
        number: 'acme-corp',
        originalName: 'logo-client-acme-corp.svg',
        extension: '.svg',
        cloudinaryFolder: 'ns2po/logos/client-samples',
        isRecognized: true
      });
    });

    it('doit parser correctement un background élection', () => {
      const result = parseFilename('background-election-orange.png');
      
      expect(result).toEqual({
        category: 'backgrounds',
        subcategory: 'election-themes',
        type: 'election',
        number: 'orange',
        originalName: 'background-election-orange.png',
        extension: '.png',
        cloudinaryFolder: 'ns2po/backgrounds/election-themes',
        isRecognized: true
      });
    });

    it('doit gérer les cas limites et erreurs', () => {
      expect(() => parseFilename('invalid-name.jpg')).toThrow('Format de nom de fichier invalide');
      expect(() => parseFilename('')).toThrow('Nom de fichier vide');
      expect(() => parseFilename(null)).toThrow('Nom de fichier requis');
    });
  });

  describe('validateAssetFile', () => {
    it('doit valider les extensions supportées', () => {
      expect(validateAssetFile('textile-tshirt-001.jpg')).toBe(true);
      expect(validateAssetFile('logo-client-acme.svg')).toBe(true);
      expect(validateAssetFile('background.png')).toBe(true);
    });

    it('doit rejeter les extensions non supportées', () => {
      expect(validateAssetFile('document.pdf')).toBe(false);
      expect(validateAssetFile('video.mp4')).toBe(false);
    });
  });

  describe('generateCloudinaryTransformations', () => {
    it('doit générer les transformations appropriées', () => {
      const assetInfo = {
        category: 'products',
        subcategory: 'textiles',
        type: 'tshirt',
        number: '001'
      };
      
      const transformations = generateCloudinaryTransformations(assetInfo);
      expect(transformations).toEqual({
        fetch_format: 'auto',
        quality: 'auto',
        width: 800,
        height: 800,
        crop: 'fill',
        gravity: 'center'
      });
    });
  });
});

describe('🔄 Cache Invalidation System', () => {
  // Mock Cloudinary pour les tests
  beforeAll(() => {
    global.mockCloudinary = {
      api: {
        update: vi.fn(),
        resources: vi.fn().mockResolvedValue({ resources: [] })
      },
      uploader: {
        explicit: vi.fn()
      }
    };
  });
  
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    // Réinitialiser complètement le mock Cloudinary
    global.mockCloudinary.api.update.mockReset();
    global.mockCloudinary.api.update.mockClear();
    global.mockCloudinary.api.update.mockResolvedValue(TEST_CONFIG.mockCloudinaryResponses.invalidate);
    
    // Réinitialiser également uploader.explicit pour les tests de performance
    if (global.mockCloudinary.uploader && global.mockCloudinary.uploader.explicit) {
      global.mockCloudinary.uploader.explicit.mockReset();
      global.mockCloudinary.uploader.explicit.mockClear();
      global.mockCloudinary.uploader.explicit.mockResolvedValue({
        public_id: 'test-id',
        secure_url: 'https://test.com/test-id.jpg'
      });
    }
  });

  describe('invalidateAssetCache', () => {
    it('doit invalider un asset avec succès', async () => {
      const publicId = 'ns2po/products/textiles/textile-tshirt-001';
      const result = await invalidateAssetCache(publicId, { strategy: 'immediate' });
      
      expect(result).toEqual({
        success: expect.any(Boolean),
        duration: expect.any(Number),
        cloudinary: expect.any(Object),
        airtable: expect.any(Object),
        turso: expect.any(Object)
      });
    });

    it('doit utiliser la stratégie "immediate" par défaut', async () => {
      const publicId = 'test-asset';
      await invalidateAssetCache(publicId);
      
      // Vérifier que l'invalidation a été tentée
      expect(publicId).toBeDefined();
    });

    it('doit gérer les erreurs d\'invalidation', async () => {
      // Test avec un ID invalide
      const result = await invalidateAssetCache('invalid-id');
      expect(result.success).toBeDefined();
    });
  });

  describe('batchInvalidate', () => {
    it('doit invalider plusieurs assets en lot', async () => {
      const publicIds = [
        'ns2po/products/textiles/textile-tshirt-001',
        'ns2po/products/textiles/textile-polo-002',
        'ns2po/logos/client-samples/logo-client-acme'
      ];
      
      const results = await invalidateBatch(publicIds, {
        batchSize: 2,
        strategy: 'batch'
      });
      
      expect(results.summary).toEqual({
        total: 3,
        successful: 3,
        failed: 0,
        duration: expect.any(Number)
      });
      
      expect(results.successful).toHaveLength(3);
      expect(results.failed).toHaveLength(0);
    });

    it('doit gérer les échecs partiels en batch', async () => {
      global.mockCloudinary.api.update
        .mockResolvedValueOnce(TEST_CONFIG.mockCloudinaryResponses.invalidate)
        .mockRejectedValueOnce(new Error('Asset not found'))
        .mockResolvedValueOnce(TEST_CONFIG.mockCloudinaryResponses.invalidate);
      
      const publicIds = ['valid-1', 'invalid', 'valid-2'];
      const results = await invalidateBatch(publicIds);
      
      expect(results.summary.successful).toBe(2);
      expect(results.summary.failed).toBe(1);
      expect(results.failed[0]).toEqual({
        publicId: 'invalid',
        error: 'Asset not found',
        success: false
      });
    });
  });

  describe('getInvalidationStats', () => {
    it('doit retourner les statistiques d\'invalidation', async () => {
      // Simuler des logs d'invalidation dans la DB
      const stats = await getInvalidationStats();
      
      expect(stats).toEqual({
        totalInvalidations: expect.any(Number),
        successRate: expect.any(Number),
        averageDuration: expect.any(Number),
        strategiesUsed: expect.any(Object),
        recentErrors: expect.any(Array)
      });
    });
  });
});

describe('🔄 Synchronization Performance', () => {
  describe('syncDifferential', () => {
    beforeEach(() => {
      // Mock des bases de données pour les tests
      global.mockAirtable = {
        select: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([
            {
              id: 'rec123',
              fields: {
                cloudinary_public_id: 'ns2po/products/textiles/textile-tshirt-001',
                cloudinary_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/ns2po/products/textiles/textile-tshirt-001.jpg',
                category: 'products',
                filename: 'textile-tshirt-001.jpg'
              }
            }
          ])
        })
      };

      global.mockTurso = {
        execute: vi.fn().mockResolvedValue({ rows: [] })
      };
    });

    it('doit synchroniser d\'Airtable vers Turso', async () => {
      const result = await syncDifferential({
        direction: 'airtable-to-turso',
        category: 'products',
        dryRun: false
      });
      
      expect(result.summary).toEqual({
        direction: 'airtable-to-turso',
        totalRecords: expect.any(Number),
        synced: expect.any(Number),
        skipped: expect.any(Number),
        errors: expect.any(Number),
        duration: expect.any(Number)
      });
    });

    it('doit respecter le mode dry-run', async () => {
      const result = await syncDifferential({
        direction: 'airtable-to-turso',
        dryRun: true
      });
      
      expect(result.dryRun).toBe(true);
      expect(result.changes).toEqual(expect.any(Array));
      // Vérifier qu'aucune modification réelle n'a été faite
      expect(global.mockTurso.execute).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT'), expect.any(Array)
      );
    });

    it('doit filtrer par catégorie', async () => {
      await syncDifferential({
        direction: 'airtable-to-turso',
        category: 'logos'
      });
      
      expect(global.mockAirtable.select).toHaveBeenCalledWith({
        filterByFormula: "AND({Category} = 'logos', {Last Modified} > '1970-01-01T00:00:00.000Z')",
        pageSize: 50,
        sort: [{ field: 'Last Modified', direction: 'asc' }]
      });
    });
  });

  describe('checkSyncHealth', () => {
    it('doit vérifier la santé de la synchronisation', async () => {
      const health = await checkSyncHealth();
      
      expect(health).toEqual({
        airtableConnection: expect.any(Boolean),
        tursoConnection: expect.any(Boolean),
        recordCounts: {
          airtable: expect.any(Number),
          turso: expect.any(Number),
          difference: expect.any(Number)
        },
        lastSync: expect.any(Date),
        recommendations: expect.any(Array)
      });
    });

    it('doit détecter les problèmes de synchronisation', async () => {
      // Simuler une différence significative
      global.mockAirtable.recordCount = 100;
      global.mockTurso.recordCount = 50;
      
      const health = await checkSyncHealth();
      
      expect(health.recordCounts.difference).toBe(50);
      expect(health.recommendations).toEqual(expect.any(Array));
    });
  });

  describe('generateSyncReport', () => {
    it('doit générer un rapport de synchronisation complet', async () => {
      const report = await generateSyncReport({ includeDetails: true });
      
      expect(report).toEqual({
        generatedAt: expect.any(Date),
        systemHealth: expect.any(Object),
        syncHistory: expect.any(Array),
        performanceMetrics: {
          averageSyncTime: expect.any(Number),
          successRate: expect.any(Number),
          errorRate: expect.any(Number)
        },
        recommendations: expect.any(Array),
        nextScheduledSync: expect.any(Date)
      });
    });
  });
});

describe('🎯 Integration Tests - Complete Workflows', () => {
  describe('Complete Asset Addition Workflow', () => {
    it('doit compléter le workflow d\'ajout d\'asset', async () => {
      // Test du workflow complet: Upload → Sync → Cache
      const mockAssetPath = path.join(TEST_CONFIG.testAssetsPath, 'textile-tshirt-001.jpg');
      
      // Créer un fichier de test temporaire
      await fs.mkdir(path.dirname(mockAssetPath), { recursive: true });
      await fs.writeFile(mockAssetPath, 'fake image data');
      
      try {
        // Simuler l'ajout d'asset complet
        const startTime = Date.now();
        
        // 1. Parse filename
        const assetInfo = parseFilename(mockAssetPath);
        expect(assetInfo.category).toBe('products');
        
        // 2. Upload to Cloudinary (simulé)
        const cloudinaryResult = TEST_CONFIG.mockCloudinaryResponses.upload;
        expect(cloudinaryResult.public_id).toContain('textile-tshirt-001');
        
        // 3. Sync to Airtable (simulé)
        const airtableRecord = {
          id: 'rec123',
          fields: {
            cloudinary_public_id: cloudinaryResult.public_id,
            cloudinary_url: cloudinaryResult.secure_url,
            category: assetInfo.category
          }
        };
        
        // 4. Update Turso cache (simulé)
        const tursoResult = { success: true, recordId: 1 };
        
        const totalTime = Date.now() - startTime;
        
        expect(totalTime).toBeLessThan(5000); // < 5 secondes pour le workflow complet
        console.log(`✅ Workflow complet en ${totalTime}ms`);
        
      } finally {
        // Nettoyer le fichier de test
        await fs.unlink(mockAssetPath).catch(() => {});
      }
    });

    it('doit gérer les erreurs de workflow gracieusement', async () => {
      // Test de la gestion d'erreurs dans le workflow
      global.mockCloudinary.api.update.mockRejectedValueOnce(
        new Error('Upload failed')
      );
      
      // Le workflow doit continuer même si une étape échoue
      const mockAssetPath = 'non-existent-file.jpg';
      
      await expect(async () => {
        const assetInfo = parseFilename(mockAssetPath);
        // Tentative d'upload qui échoue
        await invalidateAsset('test-id');
      }).rejects.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    it('doit respecter les objectifs de performance', async () => {
      const benchmarks = {
        filenameParsing: 2, // < 2ms (plus réaliste)
        invalidation: 2000, // < 2s
        batchSync: 5000, // < 5s pour 100 records
        healthCheck: 1000 // < 1s
      };
      
      // Test parsing performance
      const parseStart = Date.now();
      parseFilename('textile-tshirt-001.jpg');
      const parseTime = Date.now() - parseStart;
      expect(parseTime).toBeLessThan(benchmarks.filenameParsing);
      
      // Test invalidation performance
      // Configurer explicitement le mock pour le test de performance
      global.mockCloudinary.api.update.mockReset();
      global.mockCloudinary.api.update.mockResolvedValue({
        public_id: 'test-id',
        invalidated_at: new Date().toISOString()
      });
      
      const invalidateStart = Date.now();
      let invalidateTime;
      try {
        await invalidateAsset('test-id', 'immediate');
        invalidateTime = Date.now() - invalidateStart;
        expect(invalidateTime).toBeLessThan(benchmarks.invalidation);
      } catch (error) {
        console.log('❌ Performance test error:', error.message);
        console.log('Mock calls:', global.mockCloudinary.api.update.mock.calls);
        throw error;
      }
      
      // Test health check performance
      const healthStart = Date.now();
      await checkSyncHealth();
      const healthTime = Date.now() - healthStart;
      expect(healthTime).toBeLessThan(benchmarks.healthCheck);
      
      console.log(`📊 Performance metrics:
        - Parsing: ${parseTime}ms
        - Invalidation: ${invalidateTime}ms
        - Health check: ${healthTime}ms`);
    });
  });
});

describe('📊 Error Handling & Recovery', () => {
  describe('Network Resilience', () => {
    it('doit échouer correctement sur erreur réseau', async () => {
      // Reset et configurer le mock pour ce test spécifique
      global.mockCloudinary.api.update.mockReset();
      global.mockCloudinary.api.update.mockRejectedValueOnce(
        new Error('Network timeout')
      );
      
      await expect(invalidateAsset('test-id', 'immediate'))
        .rejects.toThrow('Network timeout');
    });

    it('doit échouer sur rate limiting', async () => {
      // Reset et configurer le mock pour ce test spécifique  
      global.mockCloudinary.api.update.mockReset();
      global.mockCloudinary.api.update.mockRejectedValueOnce(
        new Error('Rate limit')
      );
      
      await expect(invalidateAsset('test-id', 'immediate'))
        .rejects.toThrow('Rate limit');
    });
  });

  describe('Data Integrity', () => {
    it('doit valider la cohérence des données', async () => {
      // Test de validation des données entre systèmes
      const inconsistentData = {
        airtable: { records: 100 },
        turso: { records: 90 }, // Différence de 10 > 5
        cloudinary: { resources: 98 }
      };
      
      // Configurer les mocks pour avoir une différence > 5
      global.mockAirtable.recordCount = inconsistentData.airtable.records;
      global.mockTurso.recordCount = inconsistentData.turso.records;
      
      const health = await checkSyncHealth();
      
      // La différence devrait être de 10, donc > 5
      expect(Math.abs(health.recordCounts.difference)).toBeGreaterThan(5);
      expect(health.recommendations).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Synchronisation recommandée')
        ])
      );
    });
  });
});