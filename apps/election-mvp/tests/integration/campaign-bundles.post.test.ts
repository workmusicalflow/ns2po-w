import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BundleFactory, validBundle, invalidBundle, mockEvent } from '../helpers'

// Types basés sur l'API existante
interface BundleCreateResponse {
  success: boolean
  data: {
    id: string | number
    name: string
    description: string
    targetAudience: string
    budgetRange: string
    products: any[]
    estimatedTotal: number
    originalTotal: number
    savings: number
    discountPercentage: number
    popularity: number
    isActive: boolean
    isFeatured: boolean
    tags: string[]
    createdAt: string
    updatedAt: string
  }
  duration: number
}

interface BundleErrorResponse {
  statusCode: number
  statusMessage: string
  data: {
    errors: Array<{
      field?: string
      message: string
    }>
  }
}

// Simulation des validateurs
import {
  campaignBundleSchema,
  validateBundleProducts,
  validateBundleTotal,
  validateBundleBusinessRules
} from '../../schemas/bundle'
import { z } from 'zod'

// Mock du client Turso
const mockTursoClient = {
  execute: vi.fn()
}

// Mock des fonctions Nuxt/H3
const mockReadBody = vi.fn()
const mockSetResponseStatus = vi.fn()
const mockCreateError = vi.fn()

// Utilitaire pour créer une erreur
function createError(options: any) {
  const error = new Error(options.statusMessage)
  Object.assign(error, options)
  return error
}

// Simulation de l'handler POST
async function simulatePostHandler(body: any) {
  const startTime = Date.now()

  try {
    console.log("📦 POST /api/campaign-bundles - Création d'un nouveau bundle")

    // Validation du schéma
    let validatedData
    try {
      validatedData = campaignBundleSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Données invalides',
          data: {
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        })
      }
      throw error
    }

    // Validations métier supplémentaires
    const productErrors = validateBundleProducts(validatedData.products)
    const totalErrors = validateBundleTotal(validatedData)
    const businessErrors = validateBundleBusinessRules(validatedData)

    const allErrors = [...productErrors, ...totalErrors, ...businessErrors]
    if (allErrors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: { errors: allErrors }
      })
    }

    // Calculs automatiques
    const calculatedTotal = validatedData.products.reduce((total: number, product: any) => total + product.subtotal, 0)
    const savings = (validatedData.originalTotal || 0) - calculatedTotal

    // Simulation base de données
    if (!mockTursoClient.execute) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    try {
      // Calcul du prix de base et remise
      const originalTotal = validatedData.originalTotal || calculatedTotal
      const discountPercentage = originalTotal > 0 ? ((originalTotal - calculatedTotal) / originalTotal * 100) : 0

      // 1. Créer le bundle principal
      const bundleResult = await mockTursoClient.execute({
        sql: `INSERT INTO campaign_bundles (
          name, description, target_audience, base_price, discount_percentage,
          is_active, display_order, icon, color, features
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          validatedData.name,
          validatedData.description,
          validatedData.targetAudience,
          originalTotal,
          discountPercentage,
          validatedData.isActive ? 1 : 0,
          validatedData.displayOrder || 0,
          validatedData.icon || null,
          validatedData.color || null,
          JSON.stringify(validatedData.tags || [])
        ]
      })

      const newBundleId = bundleResult.lastInsertRowid

      // 2. Créer les produits du bundle
      for (let i = 0; i < validatedData.products.length; i++) {
        const product = validatedData.products[i]
        await mockTursoClient.execute({
          sql: `INSERT INTO bundle_products (
            bundle_id, product_id, quantity, custom_price, is_required, display_order
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            newBundleId,
            product.id,
            product.quantity,
            product.basePrice,
            product.isRequired !== false ? 1 : 0,
            i + 1
          ]
        })
      }

      console.log(`✅ Bundle créé avec succès: ${newBundleId}`)

      // Retourner le bundle créé
      const response = {
        success: true,
        data: {
          id: newBundleId,
          ...validatedData,
          estimatedTotal: calculatedTotal,
          originalTotal: originalTotal,
          savings: savings,
          discountPercentage: discountPercentage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        duration: Date.now() - startTime
      }

      return response

    } catch (dbError: any) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la création du bundle',
        data: { error: dbError.message }
      })
    }

  } catch (error: any) {
    console.error("❌ Erreur POST /api/campaign-bundles:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    })
  }
}

describe('POST /api/campaign-bundles - Tests d\'intégration critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTursoClient.execute.mockReset()
    mockCreateError.mockImplementation((error) => {
      const err = new Error(error.statusMessage)
      Object.assign(err, error)
      return err
    })
  })

  describe('Validation Zod - Schéma de base', () => {
    it('should create bundle with valid minimal data', async () => {
      const validBundle = BundleFactory.create({
        name: 'Bundle Test Minimal',
        description: 'Description minimale de 10 caractères',
        targetAudience: 'local',
        budgetRange: 'starter',
        estimatedTotal: 15000,
        products: [
          {
            id: 'prod-1',
            name: 'Produit Test',
            basePrice: 5000,
            quantity: 2,
            subtotal: 10000
          },
          {
            id: 'prod-2',
            name: 'Produit Test 2',
            basePrice: 2500,
            quantity: 2,
            subtotal: 5000
          }
        ]
      })

      mockReadBody.mockResolvedValue(validBundle)
      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'bundle-123' }) // Bundle creation
        .mockResolvedValue({}) // Product insertions

      const response = await simulatePostHandler(validBundle) as BundleCreateResponse

      expect(response.success).toBe(true)
      expect(response.data.id).toBe('bundle-123')
      expect(response.data.name).toBe('Bundle Test Minimal')
      expect(response.data.estimatedTotal).toBe(15000)
      expect(response.data.originalTotal).toBe(15000)
      expect(response.data.savings).toBe(0)
      expect(response.duration).toBeGreaterThan(0)
      expect(mockSetResponseStatus).toHaveBeenCalledWith(mockEvent, 201)
    })

    it('should calculate savings correctly when originalTotal provided', async () => {
      const bundleWithSavings = BundleFactory.create({
        name: 'Bundle avec économies',
        description: 'Bundle avec prix original plus élevé',
        targetAudience: 'regional',
        budgetRange: 'medium',
        estimatedTotal: 25000,
        originalTotal: 30000, // Prix original plus élevé
        products: [
          {
            id: 'prod-1',
            name: 'Produit Premium',
            basePrice: 12500,
            quantity: 2,
            subtotal: 25000
          }
        ]
      })

      mockReadBody.mockResolvedValue(bundleWithSavings)
      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'bundle-savings' })
        .mockResolvedValue({})

      const response = await simulatePostHandler(validBundle) as BundleCreateResponse

      expect(response.data.originalTotal).toBe(30000)
      expect(response.data.estimatedTotal).toBe(25000)
      expect(response.data.savings).toBe(5000) // 30000 - 25000
      expect(response.data.discountPercentage).toBeCloseTo(16.67, 1) // (5000/30000)*100
    })

    it('should reject invalid name (too short)', async () => {
      const invalidBundle = BundleFactory.create({
        name: 'AB', // Trop court (< 3 caractères)
        description: 'Description valide de plus de 10 caractères'
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String)
            })
          ])
        }
      })
    })

    it('should reject invalid target audience', async () => {
      const invalidBundle = BundleFactory.create({
        targetAudience: 'invalid_audience' as any
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String)
            })
          ])
        }
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'targetAudience',
              message: 'Audience cible invalide'
            })
          ])
        }
      })
    })

    it('should reject empty products array', async () => {
      const invalidBundle = BundleFactory.create({
        products: [] // Aucun produit
      })

      mockReadBody.mockResolvedValue(invalidBundle)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Données invalides'
      })
    })

    it('should reject too many products (>20)', async () => {
      const invalidBundle = BundleFactory.create({
        products: Array.from({ length: 21 }, (_, i) => ({
          id: `prod-${i}`,
          name: `Produit ${i}`,
          basePrice: 1000,
          quantity: 1,
          subtotal: 1000
        }))
      })

      mockReadBody.mockResolvedValue(invalidBundle)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Données invalides'
      })
    })
  })

  describe('Validation métier avancée', () => {
    it('should reject duplicate products in bundle', async () => {
      const bundleWithDuplicates = BundleFactory.create({
        products: [
          {
            id: 'prod-1',
            name: 'Produit Dupliqué',
            basePrice: 5000,
            quantity: 1,
            subtotal: 5000
          },
          {
            id: 'prod-1', // ID dupliqué
            name: 'Produit Dupliqué Bis',
            basePrice: 3000,
            quantity: 1,
            subtotal: 3000
          }
        ]
      })

      mockReadBody.mockResolvedValue(bundleWithDuplicates)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            'Les produits dupliqués ne sont pas autorisés'
          ])
        }
      })
    })

    it('should reject incorrect subtotal calculation', async () => {
      const bundleWithWrongSubtotal = BundleFactory.create({
        products: [
          {
            id: 'prod-1',
            name: 'Produit Test',
            basePrice: 1000,
            quantity: 3,
            subtotal: 2500 // Devrait être 3000 (1000 * 3)
          }
        ],
        estimatedTotal: 2500
      })

      mockReadBody.mockResolvedValue(bundleWithWrongSubtotal)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            expect.stringContaining('Sous-total incorrect')
          ])
        }
      })
    })

    it('should reject bundle total not matching products sum', async () => {
      const bundleWithWrongTotal = BundleFactory.create({
        products: [
          {
            id: 'prod-1',
            name: 'Produit 1',
            basePrice: 5000,
            quantity: 2,
            subtotal: 10000
          },
          {
            id: 'prod-2',
            name: 'Produit 2',
            basePrice: 3000,
            quantity: 1,
            subtotal: 3000
          }
        ],
        estimatedTotal: 15000 // Devrait être 13000 (10000 + 3000)
      })

      mockReadBody.mockResolvedValue(bundleWithWrongTotal)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            'Le prix total ne correspond pas à la somme des produits'
          ])
        }
      })
    })

    it('should validate budget range consistency', async () => {
      const bundleWrongBudgetRange = BundleFactory.create({
        budgetRange: 'starter', // starter = 0-10000
        estimatedTotal: 25000, // Trop élevé pour starter
        products: [
          {
            id: 'prod-1',
            name: 'Produit Cher',
            basePrice: 25000,
            quantity: 1,
            subtotal: 25000
          }
        ]
      })

      mockReadBody.mockResolvedValue(bundleWrongBudgetRange)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            expect.stringContaining('ne correspond pas à la gamme de budget starter')
          ])
        }
      })
    })

    it('should enforce featured bundle popularity rule', async () => {
      const lowPopularityFeatured = BundleFactory.create({
        isFeatured: true,
        popularity: 5 // Trop bas pour un bundle vedette (doit être >= 7)
      })

      mockReadBody.mockResolvedValue(lowPopularityFeatured)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            'Les bundles vedettes doivent avoir une popularité d\'au moins 7'
          ])
        }
      })
    })

    it('should reject inactive featured bundle', async () => {
      const inactiveFeatured = BundleFactory.create({
        isActive: false,
        isFeatured: true
      })

      mockReadBody.mockResolvedValue(inactiveFeatured)
      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier'
      })

      expect(mockCreateError).toHaveBeenCalledWith({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            'Un bundle inactif ne peut pas être en vedette'
          ])
        }
      })
    })
  })

  describe('Gestion d\'erreurs et cas limites', () => {
    it('should handle database unavailable', async () => {
      const validBundle = BundleFactory.create()
      mockReadBody.mockResolvedValue(validBundle)

      // Mock getDatabase returning null
      const getDbMock = await import('~/server/utils/database')
      vi.mocked(getDbMock.getDatabase).mockReturnValue(null)

      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    })

    it('should handle database insertion error', async () => {
      const validBundle = BundleFactory.create()
      mockReadBody.mockResolvedValue(validBundle)

      // Simuler erreur lors de l'insertion du bundle
      mockTursoClient.execute.mockRejectedValue(new Error('Database constraint violation'))

      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Erreur lors de la création du bundle'
      })
    })

    it('should handle malformed request body', async () => {
      // Body non-JSON
      mockReadBody.mockResolvedValue(null)

      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Données invalides'
      })
    })

    it('should handle unexpected server error gracefully', async () => {
      const validBundle = BundleFactory.create()
      mockReadBody.mockResolvedValue(validBundle)

      // Simuler erreur inattendue
      mockTursoClient.execute.mockImplementation(() => {
        throw new Error('Unexpected system error')
      })

      mockCreateError.mockImplementation((error) => {
        throw error
      })

      await expect(simulatePostHandler(invalidBundle)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: expect.stringMatching(/Erreur|interne/)
      })
    })
  })

  describe('Performance et optimisations', () => {
    it('should complete bundle creation within reasonable time', async () => {
      const validBundle = BundleFactory.create({
        products: Array.from({ length: 5 }, (_, i) => ({
          id: `perf-prod-${i}`,
          name: `Produit Performance ${i}`,
          basePrice: 1000,
          quantity: 1,
          subtotal: 1000
        }))
      })

      mockReadBody.mockResolvedValue(validBundle)
      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'perf-bundle' })
        .mockResolvedValue({}) // Multiple product insertions

      const startTime = Date.now()
      const response = await simulatePostHandler(validBundle) as BundleCreateResponse
      const actualDuration = Date.now() - startTime

      expect(actualDuration).toBeLessThan(1000) // < 1 seconde
      expect(response.duration).toBeLessThanOrEqual(actualDuration)
      expect(response.success).toBe(true)
    })

    it('should handle bundle with maximum allowed products (20)', async () => {
      const maxProductsBundle = BundleFactory.create({
        products: Array.from({ length: 20 }, (_, i) => ({
          id: `max-prod-${i}`,
          name: `Produit Max ${i}`,
          basePrice: 500,
          quantity: 1,
          subtotal: 500
        })),
        estimatedTotal: 10000
      })

      mockReadBody.mockResolvedValue(maxProductsBundle)
      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'max-bundle' })
        .mockResolvedValue({}) // 20 product insertions

      const response = await simulatePostHandler(validBundle) as BundleCreateResponse

      expect(response.success).toBe(true)
      expect(response.data.products).toHaveLength(20)

      // Vérifier que toutes les insertions de produits ont été appelées
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(21) // 1 bundle + 20 products
    })
  })

  describe('Edge cases métier complexes', () => {
    it('should handle bundle with zero savings correctly', async () => {
      const noSavingsBundle = BundleFactory.create({
        originalTotal: 15000,
        estimatedTotal: 15000, // Même prix = pas d'économies
        products: [
          {
            id: 'no-savings-prod',
            name: 'Produit Sans Remise',
            basePrice: 15000,
            quantity: 1,
            subtotal: 15000
          }
        ]
      })

      mockReadBody.mockResolvedValue(noSavingsBundle)
      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'no-savings-bundle' })
        .mockResolvedValue({})

      const response = await simulatePostHandler(validBundle) as BundleCreateResponse

      expect(response.data.savings).toBe(0)
      expect(response.data.discountPercentage).toBe(0)
      expect(response.data.originalTotal).toBe(15000)
      expect(response.data.estimatedTotal).toBe(15000)
    })

    it('should handle bundle with fractional prices correctly', async () => {
      const fractionalBundle = BundleFactory.create({
        products: [
          {
            id: 'fractional-prod',
            name: 'Produit Prix Fractionnaire',
            basePrice: 1333.33,
            quantity: 3,
            subtotal: 3999.99
          }
        ],
        estimatedTotal: 3999.99
      })

      mockReadBody.mockResolvedValue(fractionalBundle)
      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'fractional-bundle' })
        .mockResolvedValue({})

      const response = await simulatePostHandler(validBundle) as BundleCreateResponse

      expect(response.success).toBe(true)
      expect(response.data.estimatedTotal).toBeCloseTo(3999.99, 2)
    })

    it('should validate all budget ranges correctly', async () => {
      const budgetRangeTests = [
        { range: 'starter', total: 5000, shouldPass: true },
        { range: 'starter', total: 15000, shouldPass: false },
        { range: 'medium', total: 25000, shouldPass: true },
        { range: 'medium', total: 60000, shouldPass: false },
        { range: 'premium', total: 100000, shouldPass: true },
        { range: 'premium', total: 250000, shouldPass: false },
        { range: 'enterprise', total: 500000, shouldPass: true }
      ]

      for (const test of budgetRangeTests) {
        const testBundle = BundleFactory.create({
          name: `Bundle ${test.range} ${test.total}`,
          budgetRange: test.range as any,
          estimatedTotal: test.total,
          products: [
            {
              id: `${test.range}-prod`,
              name: `Produit ${test.range}`,
              basePrice: test.total,
              quantity: 1,
              subtotal: test.total
            }
          ]
        })

        mockReadBody.mockResolvedValue(testBundle)

        if (test.shouldPass) {
          mockTursoClient.execute
            .mockResolvedValueOnce({ lastInsertRowid: `${test.range}-bundle` })
            .mockResolvedValue({})
        } else {
          mockCreateError.mockImplementation((error) => {
            throw error
          })
        }

        const handler = await import('../../server/api/campaign-bundles/index.post')

        if (test.shouldPass) {
          const response = await handler.default(mockEvent) as BundleCreateResponse
          expect(response.success).toBe(true)
        } else {
          await expect(handler.default(mockEvent)).rejects.toMatchObject({
            statusCode: 400,
            statusMessage: 'Erreurs de validation métier'
          })
        }

        vi.clearAllMocks()
        mockTursoClient.execute.mockReset()
      }
    })
  })
})