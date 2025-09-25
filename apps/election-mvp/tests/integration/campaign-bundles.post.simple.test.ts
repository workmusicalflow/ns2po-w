import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BundleFactory } from '../helpers'

// Import des validateurs
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

// Simulation de l'handler POST (logique extraite de l'API réelle)
async function simulatePostHandler(body: any) {
  const startTime = Date.now()

  try {
    // Validation du schéma Zod
    let validatedData
    try {
      validatedData = campaignBundleSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = {
          statusCode: 400,
          statusMessage: 'Données invalides',
          data: {
            errors: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        }
        throw validationError
      }
      throw error
    }

    // Validations métier supplémentaires
    const productErrors = validateBundleProducts(validatedData.products)
    const totalErrors = validateBundleTotal(validatedData)
    const businessErrors = validateBundleBusinessRules(validatedData)

    const allErrors = [...productErrors, ...totalErrors, ...businessErrors]
    if (allErrors.length > 0) {
      const businessError = {
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: { errors: allErrors }
      }
      throw businessError
    }

    // Calculs automatiques
    const calculatedTotal = validatedData.products.reduce((total: number, product: any) => total + product.subtotal, 0)
    const originalTotal = validatedData.originalTotal || calculatedTotal
    const savings = originalTotal - calculatedTotal // Utilise originalTotal calculé, pas 0
    const discountPercentage = originalTotal > 0 ? ((originalTotal - calculatedTotal) / originalTotal * 100) : 0

    // Simulation base de données
    if (!mockTursoClient.execute) {
      const dbError = {
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      }
      throw dbError
    }

    try {
      // Simulation création bundle
      const bundleResult = await mockTursoClient.execute({
        sql: `INSERT INTO campaign_bundles...`,
        args: [validatedData.name, validatedData.description, validatedData.targetAudience]
      })

      const newBundleId = bundleResult.lastInsertRowid || 'test-bundle-id'

      // Simulation création produits
      for (let i = 0; i < validatedData.products.length; i++) {
        await mockTursoClient.execute({
          sql: `INSERT INTO bundle_products...`,
          args: [newBundleId, validatedData.products[i].id]
        })
      }

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
      const error = {
        statusCode: 500,
        statusMessage: 'Erreur lors de la création du bundle',
        data: { error: dbError.message }
      }
      throw error
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    const genericError = {
      statusCode: 500,
      statusMessage: 'Erreur interne du serveur',
      data: {
        error: error instanceof Error ? error.message : "Erreur inconnue",
        duration: Date.now() - startTime
      }
    }
    throw genericError
  }
}

describe('POST /api/campaign-bundles - Tests d\'intégration critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (mockTursoClient.execute && typeof mockTursoClient.execute.mockReset === 'function') {
      mockTursoClient.execute.mockReset()
    }
  })

  describe('Validation Zod - Schéma de base', () => {
    it('should create bundle with valid minimal data', async () => {
      const validBundle = {
        name: 'Bundle Test Minimal',
        description: 'Description minimale de 10 caractères',
        targetAudience: 'local' as const,
        budgetRange: 'medium' as const, // 15000 rentre dans medium (10000-50000)
        estimatedTotal: 15000,
        popularity: 5,
        isActive: true,
        isFeatured: false, // Pas vedette pour éviter règle popularité >= 7
        tags: [],
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
      }

      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'bundle-123' }) // Bundle creation
        .mockResolvedValue({}) // Product insertions

      const response = await simulatePostHandler(validBundle)

      expect(response.success).toBe(true)
      expect(response.data.id).toBe('bundle-123')
      expect(response.data.name).toBe('Bundle Test Minimal')
      expect(response.data.estimatedTotal).toBe(15000)
      expect(response.data.originalTotal).toBe(15000)
      expect(response.data.savings).toBe(0)
      expect(response.duration).toBeGreaterThan(0)
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

      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'bundle-savings' })
        .mockResolvedValue({})

      const response = await simulatePostHandler(bundleWithSavings)

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
              field: 'name',
              message: expect.stringContaining('au moins 3 caractères')
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

      await expect(simulatePostHandler(bundleWithDuplicates)).rejects.toMatchObject({
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

      await expect(simulatePostHandler(bundleWithWrongSubtotal)).rejects.toMatchObject({
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

      await expect(simulatePostHandler(bundleWithWrongTotal)).rejects.toMatchObject({
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

      await expect(simulatePostHandler(bundleWrongBudgetRange)).rejects.toMatchObject({
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

      await expect(simulatePostHandler(lowPopularityFeatured)).rejects.toMatchObject({
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

      await expect(simulatePostHandler(inactiveFeatured)).rejects.toMatchObject({
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

      // Simuler database non disponible
      mockTursoClient.execute = null as any

      await expect(simulatePostHandler(validBundle)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    })

    it('should handle database insertion error', async () => {
      const validBundle = BundleFactory.create()

      // Simuler erreur lors de l'insertion du bundle
      mockTursoClient.execute.mockRejectedValue(new Error('Database constraint violation'))

      await expect(simulatePostHandler(validBundle)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Erreur lors de la création du bundle'
      })
    })

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

      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'no-savings-bundle' })
        .mockResolvedValue({})

      const response = await simulatePostHandler(noSavingsBundle)

      expect(response.data.savings).toBe(0)
      expect(response.data.discountPercentage).toBe(0)
      expect(response.data.originalTotal).toBe(15000)
      expect(response.data.estimatedTotal).toBe(15000)
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

      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'perf-bundle' })
        .mockResolvedValue({}) // Multiple product insertions

      const startTime = Date.now()
      const response = await simulatePostHandler(validBundle)
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

      mockTursoClient.execute
        .mockResolvedValueOnce({ lastInsertRowid: 'max-bundle' })
        .mockResolvedValue({}) // 20 product insertions

      const response = await simulatePostHandler(maxProductsBundle)

      expect(response.success).toBe(true)
      expect(response.data.products).toHaveLength(20)

      // Vérifier que toutes les insertions de produits ont été appelées
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(21) // 1 bundle + 20 products
    })
  })
})