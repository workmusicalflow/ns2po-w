import { describe, it, expect, beforeEach } from 'vitest'
import { BundleFactory, ProductFactory, setTestSeed } from '../helpers'

describe('BundleFactory', () => {
  beforeEach(() => {
    // Seed pour reproductibilité
    setTestSeed(123456)
  })

  describe('create()', () => {
    it('should generate a valid bundle with all required fields', () => {
      const bundle = BundleFactory.create()
      
      expect(bundle).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        targetAudience: expect.stringMatching(/^(local|regional|national|universal)$/),
        budgetRange: expect.stringMatching(/^(starter|medium|premium|enterprise)$/),
        products: expect.any(Array),
        estimatedTotal: expect.any(Number),
        popularity: expect.any(Number),
        isActive: expect.any(Boolean),
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
      
      // Vérifications business rules
      expect(bundle.estimatedTotal).toBeGreaterThan(0)
      expect(bundle.popularity).toBeGreaterThanOrEqual(0)
      expect(bundle.popularity).toBeLessThanOrEqual(10)
      
      if (bundle.originalTotal && bundle.savings) {
        expect(bundle.originalTotal - bundle.estimatedTotal).toBeCloseTo(bundle.savings, 2)
      }
    })

    it('should allow overrides', () => {
      const customBundle = BundleFactory.create({
        name: 'Bundle Personnalisé',
        targetAudience: 'national',
        isActive: false
      })
      
      expect(customBundle.name).toBe('Bundle Personnalisé')
      expect(customBundle.targetAudience).toBe('national')
      expect(customBundle.isActive).toBe(false)
    })
  })

  describe('createMany()', () => {
    it('should generate multiple bundles', () => {
      const bundles = BundleFactory.createMany(5)
      
      expect(bundles).toHaveLength(5)
      expect(bundles.every(bundle => typeof bundle.id === 'string')).toBe(true)
      
      // Vérifier que les IDs sont uniques
      const ids = bundles.map(b => b.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
    })
  })

  describe('specialized factories', () => {
    it('createActive() should create only active bundles', () => {
      const bundles = Array.from({ length: 10 }, () => BundleFactory.createActive())
      expect(bundles.every(bundle => bundle.isActive === true)).toBe(true)
    })

    it('createFeatured() should create featured and active bundles', () => {
      const bundle = BundleFactory.createFeatured()
      expect(bundle.isFeatured).toBe(true)
      expect(bundle.isActive).toBe(true)
    })

    it('createByAudience() should create bundle with specific audience', () => {
      const bundle = BundleFactory.createByAudience('regional')
      expect(bundle.targetAudience).toBe('regional')
    })

    it('createByBudget() should create bundle with specific budget', () => {
      const bundle = BundleFactory.createByBudget('premium')
      expect(bundle.budgetRange).toBe('premium')
    })
  })

  describe('edge cases', () => {
    it('createEdgeCases() should generate bundles with edge scenarios', () => {
      const edgeCases = BundleFactory.createEdgeCases()
      
      expect(edgeCases.length).toBeGreaterThan(0)
      
      // Vérifier qu'on a des cas avec prix minimum/maximum
      const minPrice = Math.min(...edgeCases.map(b => b.estimatedTotal))
      const maxPrice = Math.max(...edgeCases.map(b => b.estimatedTotal))
      
      expect(minPrice).toBeLessThan(1)
      expect(maxPrice).toBeGreaterThan(1000)
    })
  })
})

describe('ProductFactory', () => {
  it('should generate valid products', () => {
    const product = ProductFactory.create()
    
    expect(product).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      price: expect.any(Number),
      category: expect.stringMatching(/^(textile|accessoire|papeterie|gadget)$/)
    })
    
    expect(product.price).toBeGreaterThan(0)
  })

  it('should generate multiple products', () => {
    const products = ProductFactory.createMany(3)
    
    expect(products).toHaveLength(3)
    expect(products.every(p => typeof p.id === 'string')).toBe(true)
  })
})
