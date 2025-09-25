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

// Mock des helpers Nuxt
const mockEvent = {
  node: {
    req: {},
    res: {
      setHeader: vi.fn()
    }
  }
}

const mockGetQuery = vi.fn()
const mockSetHeader = vi.fn()

vi.mock('h3', () => ({
  defineEventHandler: (handler: any) => handler,
  getQuery: () => mockGetQuery(),
  setHeader: mockSetHeader
}))

describe('Campaign Bundles API Handler - Tests d\'intégration critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({})
  })

  describe('Récupération basique', () => {
    it('should return successful response with valid structure from Turso', async () => {
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

      // Importer et exécuter le handler directement
      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

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

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse
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
      mockGetQuery.mockReturnValue({ audience: 'local' })
      
      const localBundles = BundleFactory.createMany(2, { targetAudience: 'local' })
      
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

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

      expect(response.data).toHaveLength(2)
      expect(response.data.every(bundle => bundle.targetAudience === 'local')).toBe(true)
      
      // Vérifier que la requête SQL inclut le filtre
      expect(mockTursoClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('cb.target_audience = ?'),
        args: ['local']
      })
    })

    it('should return empty array for non-existent audience', async () => {
      mockGetQuery.mockReturnValue({ audience: 'inexistant' })
      
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] })

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

      expect(response.data).toHaveLength(0)
      expect(response.success).toBe(true)
    })
  })

  describe('Logique de fallback critique', () => {
    it('should fallback to static data when Turso fails', async () => {
      // Simuler échec Turso
      mockTursoClient.execute.mockRejectedValue(new Error('Database connection failed'))

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

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
      mockGetQuery.mockReturnValue({ audience: 'local' })
      mockTursoClient.execute.mockRejectedValue(new Error('Database error'))

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

      expect(response.source).toBe('static')
      expect(response.data).toHaveLength(1) // Seul pack-starter est local
      expect(response.data[0].targetAudience).toBe('local')
    })

    it('should fallback gracefully when database is null', async () => {
      // Mock getDatabase retournant null
      const getDbMock = await import('~/server/utils/database')
      vi.mocked(getDbMock.getDatabase).mockReturnValue(null)

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

      expect(response.source).toBe('static')
      expect(response.data).toHaveLength(2)
    })
  })

  describe('Gestion d\'erreurs robuste', () => {
    it('should handle critical errors gracefully', async () => {
      // Simuler erreur critique dans l'handler principal
      mockTursoClient.execute.mockRejectedValue(new Error('Critical system error'))

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

      expect(response.success).toBe(false)
      expect(response.source).toBe('static')
      expect(response.error).toBe('Critical system error')
      expect(response.warning).toBe('Service en mode dégradé')
      expect(response.data).toHaveLength(2) // Fallback data
    })

    it('should maintain API contract even during errors', async () => {
      mockTursoClient.execute.mockRejectedValue(new Error('DB Error'))

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

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

  describe('Performance et optimisations', () => {
    it('should set appropriate cache headers for Turso source', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] })

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

      expect(response.source).toBe('turso')
      expect(mockSetHeader).toHaveBeenCalledWith(mockEvent, "Cache-Control", "public, max-age=900")
      expect(mockSetHeader).toHaveBeenCalledWith(mockEvent, "CDN-Cache-Control", "public, max-age=1800")
    })

    it('should complete request within reasonable time', async () => {
      const startTime = Date.now()
      
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValue({ rows: [] })

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse
      const actualDuration = Date.now() - startTime

      expect(actualDuration).toBeLessThan(1000) // < 1 seconde
      expect(response.duration).toBeLessThanOrEqual(actualDuration)
    })
  })

  describe('Edge cases et validation métier', () => {
    it('should handle bundles with null/undefined values gracefully', async () => {
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

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse

      const bundle = response.data[0]
      expect(bundle.name).toBe(null)
      expect(bundle.description).toBe('')
      expect(bundle.estimatedTotal).toBe(0) // finalPrice null → 0
      expect(bundle.products).toEqual([])
    })

    it('should calculate savings correctly with business logic', async () => {
      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'savings-test',
            name: 'Bundle Savings Test',
            targetAudience: 'local',
            finalPrice: 80000, // Prix final avec remise
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

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse
      const bundle = response.data[0]

      expect(bundle.estimatedTotal).toBe(80000)
      expect(bundle.originalTotal).toBe(100000)
      expect(bundle.savings).toBe(20000) // 100000 - 80000
    })

    it('should ensure savings are never negative (business rule)', async () => {
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

      const handler = await import('../../server/api/campaign-bundles/index.get')
      const response = await handler.default(mockEvent) as BundleApiResponse
      const bundle = response.data[0]

      expect(bundle.savings).toBe(0) // Math.max(0, savings) appliqué
    })
  })
})
