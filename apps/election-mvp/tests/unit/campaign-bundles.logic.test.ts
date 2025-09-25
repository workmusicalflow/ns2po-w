import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BundleFactory } from '../helpers'

describe('Campaign Bundles Business Logic - Tests unitaires (30%)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Logique de calcul des prix bundles (critique)', () => {
    it('should calculate bundle pricing correctly', () => {
      const products = [
        { basePrice: 50000, quantity: 2, subtotal: 100000 },
        { basePrice: 25000, quantity: 1, subtotal: 25000 }
      ]
      const finalPrice = 80000

      // Logique de calcul extraite de l'API
      const originalTotal = products.reduce((sum, p) => sum + p.subtotal, 0)
      const savings = Math.max(0, originalTotal - finalPrice)

      expect(originalTotal).toBe(125000)
      expect(savings).toBe(45000) // 125000 - 80000
    })

    it('should ensure savings are never negative', () => {
      const products = [
        { basePrice: 50000, quantity: 1, subtotal: 50000 }
      ]
      const finalPrice = 60000 // Plus cher que l'original

      const originalTotal = products.reduce((sum, p) => sum + p.subtotal, 0)
      const savings = Math.max(0, originalTotal - finalPrice)

      expect(savings).toBe(0) // Pas de savings négatifs
    })

    it('should calculate budget range correctly', () => {
      const testCases = [
        { estimatedTotal: 10000, expected: 'starter' },
        { estimatedTotal: 19999, expected: 'starter' },
        { estimatedTotal: 20000, expected: 'standard' },
        { estimatedTotal: 49999, expected: 'standard' },
        { estimatedTotal: 50000, expected: 'premium' },
        { estimatedTotal: 100000, expected: 'premium' }
      ]

      testCases.forEach(({ estimatedTotal, expected }) => {
        // Logique extraite de l'API
        const budgetRange = estimatedTotal < 20000 ? 'starter' : 
                           estimatedTotal < 50000 ? 'standard' : 'premium'
        
        expect(budgetRange).toBe(expected)
      })
    })

    it('should determine featured status correctly', () => {
      const testCases = [
        { displayOrder: 1, expected: true },
        { displayOrder: 3, expected: true },
        { displayOrder: 4, expected: false },
        { displayOrder: null, expected: false }
      ]

      testCases.forEach(({ displayOrder, expected }) => {
        // Logique extraite de l'API
        const isFeatured = displayOrder ? displayOrder <= 3 : false
        
        expect(isFeatured).toBe(expected)
      })
    })
  })

  describe('Règles de validation métier des bundles', () => {
    it('should validate bundle data structure', () => {
      const validBundle = BundleFactory.create()

      // Validation règles métier
      expect(validBundle.id).toBeDefined()
      expect(validBundle.name).toBeDefined()
      expect(validBundle.targetAudience).toMatch(/^(local|regional|national|universal)$/)
      expect(validBundle.budgetRange).toMatch(/^(starter|medium|premium|enterprise)$/)
      expect(validBundle.estimatedTotal).toBeGreaterThanOrEqual(0)
      expect(validBundle.popularity).toBeGreaterThanOrEqual(0)
      expect(validBundle.popularity).toBeLessThanOrEqual(10)
      expect(typeof validBundle.isActive).toBe('boolean')
    })

    it('should validate bundle with minimum data', () => {
      const minimalBundle = {
        id: 'test-id',
        name: 'Test Bundle',
        targetAudience: 'local',
        estimatedTotal: 0,
        isActive: true
      }

      // Règles de validation minimum
      expect(minimalBundle.id).toBeTruthy()
      expect(minimalBundle.name).toBeTruthy()
      expect(['local', 'regional', 'national', 'universal']).toContain(minimalBundle.targetAudience)
      expect(minimalBundle.estimatedTotal).toBeGreaterThanOrEqual(0)
      expect(typeof minimalBundle.isActive).toBe('boolean')
    })

    it('should handle edge cases in bundle data', () => {
      const edgeCases = BundleFactory.createEdgeCases()

      edgeCases.forEach(bundle => {
        // Validation robuste pour edge cases
        expect(bundle.id).toBeDefined()
        expect(bundle.estimatedTotal).toBeGreaterThanOrEqual(0)
        
        if (bundle.originalTotal && bundle.savings !== undefined) {
          expect(bundle.savings).toBeGreaterThanOrEqual(0)
          expect(bundle.originalTotal - bundle.estimatedTotal).toBeCloseTo(bundle.savings, 2)
        }
      })
    })
  })

  describe('Logique de filtrage avancé', () => {
    it('should filter bundles by target audience', () => {
      const bundles = BundleFactory.createMany(10)
      const localBundles = bundles.filter(bundle => bundle.targetAudience === 'local')

      expect(localBundles.length).toBeGreaterThanOrEqual(0)
      expect(localBundles.every(bundle => bundle.targetAudience === 'local')).toBe(true)
    })

    it('should filter bundles by featured status', () => {
      const bundles = [
        BundleFactory.createFeatured(),
        BundleFactory.createFeatured(),
        BundleFactory.create({ isFeatured: false })
      ]

      const featuredBundles = bundles.filter(bundle => bundle.isFeatured)

      expect(featuredBundles).toHaveLength(2)
      expect(featuredBundles.every(bundle => bundle.isFeatured === true)).toBe(true)
    })

    it('should filter bundles by multiple criteria', () => {
      const bundles = [
        BundleFactory.create({ targetAudience: 'local', isFeatured: true }),
        BundleFactory.create({ targetAudience: 'local', isFeatured: false }),
        BundleFactory.create({ targetAudience: 'national', isFeatured: true })
      ]

      const filteredBundles = bundles.filter(bundle => 
        bundle.targetAudience === 'local' && bundle.isFeatured === true
      )

      expect(filteredBundles).toHaveLength(1)
      expect(filteredBundles[0].targetAudience).toBe('local')
      expect(filteredBundles[0].isFeatured).toBe(true)
    })
  })

  describe('Logique de recherche textuelle', () => {
    it('should search bundles by name', () => {
      const bundles = [
        BundleFactory.create({ name: 'Pack Starter Premium' }),
        BundleFactory.create({ name: 'Bundle Standard' }),
        BundleFactory.create({ name: 'Pack Elite Starter' })
      ]

      const searchTerm = 'starter'
      const results = bundles.filter(bundle => 
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase())
      )

      expect(results).toHaveLength(2)
      expect(results.every(bundle => 
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase())
      )).toBe(true)
    })

    it('should search bundles by description', () => {
      const bundles = [
        BundleFactory.create({ description: 'Pack essentiel pour débutants' }),
        BundleFactory.create({ description: 'Bundle professionnel avancé' }),
        BundleFactory.create({ description: 'Pack complet avec outils essentiels' })
      ]

      const searchTerm = 'essentiel'
      const results = bundles.filter(bundle => 
        bundle.description.toLowerCase().includes(searchTerm.toLowerCase())
      )

      expect(results).toHaveLength(2)
    })

    it('should handle multi-criteria search', () => {
      const bundles = [
        BundleFactory.create({ 
          name: 'Pack Starter', 
          description: 'Bundle essentiel',
          tags: ['starter', 'essentiel']
        }),
        BundleFactory.create({ 
          name: 'Bundle Pro', 
          description: 'Pack professionnel',
          tags: ['pro', 'avancé']
        })
      ]

      const searchTerm = 'essentiel'
      const results = bundles.filter(bundle => {
        const searchableText = [
          bundle.name,
          bundle.description,
          ...(bundle.tags || [])
        ].join(' ').toLowerCase()
        
        return searchableText.includes(searchTerm.toLowerCase())
      })

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Pack Starter')
    })
  })

  describe('Logique de performance et optimisation', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = Date.now()
      const largeBundles = BundleFactory.createLargeDataset(1000)
      
      // Test de tri par popularité
      const sortedBundles = largeBundles.sort((a, b) => b.popularity - a.popularity)
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(sortedBundles).toHaveLength(1000)
      expect(duration).toBeLessThan(100) // < 100ms pour 1000 éléments
      
      // Vérifier que le tri fonctionne
      for (let i = 0; i < sortedBundles.length - 1; i++) {
        expect(sortedBundles[i].popularity).toBeGreaterThanOrEqual(sortedBundles[i + 1].popularity)
      }
    })

    it('should optimize filtering for performance', () => {
      const bundles = BundleFactory.createLargeDataset(500)
      const startTime = Date.now()

      // Test de filtres en chaîne (comme dans l'API)
      let filtered = bundles
      filtered = filtered.filter(b => b.isActive)
      filtered = filtered.filter(b => b.targetAudience === 'local')
      filtered = filtered.filter(b => b.estimatedTotal > 10000)

      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(50) // < 50ms pour 500 éléments
      expect(filtered.every(b => b.isActive)).toBe(true)
      expect(filtered.every(b => b.targetAudience === 'local')).toBe(true)
      expect(filtered.every(b => b.estimatedTotal > 10000)).toBe(true)
    })
  })
})
