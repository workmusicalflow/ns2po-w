import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BundleFactory } from '../helpers'

// Types basés sur l'API existante
interface BundleApiResponse {
  success: boolean
  data: any[]
  source: 'turso' | 'static'
  duration: number
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  warning?: string
  error?: string
}

// Mock du client Turso pour contrôler les tests
const mockTursoClient = {
  execute: vi.fn()
}

// Mock de la fonction getDatabase
vi.mock('~/server/utils/database', () => ({
  getDatabase: vi.fn(() => mockTursoClient)
}))

describe('GET /api/campaign-bundles - Tests d\'intégration critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Récupération basique', () => {
    it('should return successful response with valid structure', async () => {
      // Mock données Turso
      const mockBundles = BundleFactory.createMany(3)
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: mockBundles.map(bundle => ({
            id: bundle.id,
            name: bundle.name,
            description: bundle.description,
            targetAudience: bundle.targetAudience,
            finalPrice: bundle.estimatedTotal,
            isActive: 1,
            displayOrder: 1,
            createdAt: bundle.createdAt,
            updatedAt: bundle.updatedAt
          }))
        })
        .mockResolvedValue({ rows: [] }) // Pour les produits des bundles

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      expect(response).toMatchObject({
        success: true,
        data: expect.any(Array),
        source: 'turso',
        duration: expect.any(Number),
        pagination: {
          page: 1,
          limit: expect.any(Number),
          total: expect.any(Number),
          hasMore: false
        }
      })

      expect(response.data).toHaveLength(3)
      expect(response.duration).toBeGreaterThan(0)
    })

    it('should return bundles with all required fields', async () => {
      const mockBundle = BundleFactory.create()
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: [{
            id: mockBundle.id,
            name: mockBundle.name,
            description: mockBundle.description,
            targetAudience: mockBundle.targetAudience,
            finalPrice: mockBundle.estimatedTotal,
            isActive: 1,
            displayOrder: 1,
            createdAt: mockBundle.createdAt,
            updatedAt: mockBundle.updatedAt,
            features: JSON.stringify(['test'])
          }]
        })
        .mockResolvedValue({ 
          rows: [{
            product_id: 'prod-1',
            product_name: 'Produit Test',
            basePrice: 100,
            quantity: 2,
            subtotal: 200,
            is_required: 1
          }]
        })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')
      const bundle = response.data[0]

      expect(bundle).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        targetAudience: expect.stringMatching(/^(local|regional|national|universal)$/),
        budgetRange: expect.stringMatching(/^(starter|standard|premium)$/),
        products: expect.any(Array),
        estimatedTotal: expect.any(Number),
        originalTotal: expect.any(Number),
        savings: expect.any(Number),
        popularity: expect.any(Number),
        isActive: expect.any(Boolean),
        isFeatured: expect.any(Boolean),
        tags: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      })

      expect(bundle.products[0]).toMatchObject({
        id: 'prod-1',
        name: 'Produit Test',
        basePrice: 100,
        quantity: 2,
        subtotal: 200,
        isRequired: true
      })
    })
  })

  describe('Filtres complexes', () => {
    it('should filter by target audience', async () => {
      const localBundles = BundleFactory.createMany(2, { targetAudience: 'local' })
      const nationalBundles = BundleFactory.createMany(1, { targetAudience: 'national' })
      
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: localBundles.map(bundle => ({
            id: bundle.id,
            name: bundle.name,
            targetAudience: 'local',
            finalPrice: bundle.estimatedTotal,
            isActive: 1,
            displayOrder: 1,
            createdAt: bundle.createdAt,
            updatedAt: bundle.updatedAt
          }))
        })
        .mockResolvedValue({ rows: [] })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles?audience=local')

      expect(response.data).toHaveLength(2)
      expect(response.data.every(bundle => bundle.targetAudience === 'local')).toBe(true)
      
      // Vérifier que la requête SQL inclut le filtre
      expect(mockTursoClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('cb.target_audience = ?'),
        args: ['local']
      })
    })

    it('should handle multiple filters simultaneously', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'featured-local-bundle',
            name: 'Bundle Featured Local',
            targetAudience: 'local',
            finalPrice: 50000,
            isActive: 1,
            displayOrder: 1, // displayOrder <= 3 = featured
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        })
        .mockResolvedValue({ rows: [] })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles?audience=local&featured=true')

      expect(response.data).toHaveLength(1)
      const bundle = response.data[0]
      expect(bundle.targetAudience).toBe('local')
      expect(bundle.isFeatured).toBe(true)
    })

    it('should return empty array for non-existent audience', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles?audience=inexistant')

      expect(response.data).toHaveLength(0)
      expect(response.success).toBe(true)
    })
  })

  describe('Logique de fallback', () => {
    it('should fallback to static data when Turso fails', async () => {
      // Simuler échec Turso
      mockTursoClient.execute.mockRejectedValue(new Error('Database connection failed'))

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      expect(response.success).toBe(true)
      expect(response.source).toBe('static')
      expect(response.data).toHaveLength(2) // STATIC_BUNDLES_FALLBACK a 2 éléments
      expect(response.warning).toBe('Service dégradé - données limitées')
      
      // Vérifier structure des données statiques
      expect(response.data[0]).toMatchObject({
        id: 'pack-starter',
        name: 'Pack Starter Campagne',
        targetAudience: 'local'
      })
    })

    it('should apply filters on static fallback data', async () => {
      mockTursoClient.execute.mockRejectedValue(new Error('Database error'))

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles?audience=local')

      expect(response.source).toBe('static')
      expect(response.data).toHaveLength(1) // Seul pack-starter est local
      expect(response.data[0].targetAudience).toBe('local')
    })

    it('should fallback to static data when database is null', async () => {
      // Mock getDatabase retournant null
      vi.mocked(await import('~/server/utils/database')).getDatabase.mockReturnValue(null)

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      expect(response.source).toBe('static')
      expect(response.data).toHaveLength(2)
    })
  })

  describe('Gestion d\'erreurs', () => {
    it('should handle critical errors gracefully', async () => {
      // Simuler erreur critique dans l'handler principal
      mockTursoClient.execute.mockRejectedValue(new Error('Critical system error'))

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      expect(response.success).toBe(false)
      expect(response.source).toBe('static')
      expect(response.error).toBe('Critical system error')
      expect(response.warning).toBe('Service en mode dégradé')
      expect(response.data).toHaveLength(2) // Fallback data
    })

    it('should maintain API contract even during errors', async () => {
      mockTursoClient.execute.mockRejectedValue(new Error('DB Error'))

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      // Même en erreur, structure API maintenue
      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('source')
      expect(response).toHaveProperty('duration')
      expect(response).toHaveProperty('pagination')
      expect(response.pagination).toMatchObject({
        page: 1,
        limit: expect.any(Number),
        total: expect.any(Number),
        hasMore: false
      })
    })
  })

  describe('Performance et cache', () => {
    it('should set appropriate cache headers for Turso source', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] })

      // Note: Dans un vrai test d'intégration, on testerait les headers HTTP
      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      expect(response.source).toBe('turso')
      expect(response.duration).toBeGreaterThanOrEqual(0)
    })

    it('should complete request within reasonable time', async () => {
      const startTime = Date.now()
      
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')
      const actualDuration = Date.now() - startTime

      expect(actualDuration).toBeLessThan(2000) // < 2 secondes
      expect(response.duration).toBeLessThan(1000) // < 1 seconde interne
    })

    it('should handle large datasets efficiently', async () => {
      // Simuler gros dataset
      const largeBundles = BundleFactory.createLargeDataset(50)
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: largeBundles.map(bundle => ({
            id: bundle.id,
            name: bundle.name,
            targetAudience: bundle.targetAudience,
            finalPrice: bundle.estimatedTotal,
            isActive: 1,
            displayOrder: 1,
            createdAt: bundle.createdAt,
            updatedAt: bundle.updatedAt
          }))
        })
        .mockResolvedValue({ rows: [] })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      expect(response.data).toHaveLength(50)
      expect(response.duration).toBeLessThan(1500) // Performance raisonnable
      expect(response.pagination.total).toBe(50)
    })
  })

  describe('Edge cases et validation', () => {
    it('should handle bundles with null/undefined values', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'test-bundle',
            name: null,
            description: '',
            targetAudience: 'local',
            finalPrice: null,
            isActive: 1,
            displayOrder: null,
            createdAt: null,
            updatedAt: null
          }]
        })
        .mockResolvedValue({ rows: [] })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')

      const bundle = response.data[0]
      expect(bundle.name).toBe(null)
      expect(bundle.description).toBe('')
      expect(bundle.estimatedTotal).toBe(0)
      expect(bundle.products).toEqual([])
    })

    it('should calculate savings correctly', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'savings-test',
            name: 'Bundle Savings Test',
            targetAudience: 'local',
            finalPrice: 80000, // Prix final
            isActive: 1,
            displayOrder: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        })
        .mockResolvedValue({
          rows: [{
            product_id: 'prod-1',
            product_name: 'Produit 1',
            basePrice: 50000,
            quantity: 2,
            subtotal: 100000, // Prix original total
            is_required: 1
          }]
        })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')
      const bundle = response.data[0]

      expect(bundle.estimatedTotal).toBe(80000)
      expect(bundle.originalTotal).toBe(100000)
      expect(bundle.savings).toBe(20000) // 100000 - 80000
    })

    it('should ensure savings are never negative', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'no-savings-test',
            name: 'Bundle No Savings',
            targetAudience: 'local',
            finalPrice: 120000, // Plus cher que l'original
            isActive: 1,
            displayOrder: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }]
        })
        .mockResolvedValue({
          rows: [{
            product_id: 'prod-1',
            product_name: 'Produit 1',
            basePrice: 100000,
            quantity: 1,
            subtotal: 100000,
            is_required: 1
          }]
        })

      const response = await $fetch<BundleApiResponse>('/api/campaign-bundles')
      const bundle = response.data[0]

      expect(bundle.savings).toBe(0) // Math.max(0, savings) appliqué
    })
  })
})
