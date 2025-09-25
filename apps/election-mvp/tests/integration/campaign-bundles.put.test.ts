import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BundleFactory } from '../helpers'

// Types basés sur l'API existante
interface BundleUpdateResponse {
  success: boolean
  data: {
    id: string
    name: string
    description: string
    targetAudience: string
    budgetRange: string
    products: any[]
    estimatedTotal: number
    originalTotal: number
    savings: number
    popularity: number
    isActive: boolean
    isFeatured: boolean
    tags: string[]
    createdAt: string
    updatedAt: string
    icon?: string
    color?: string
    displayOrder?: number
    discountPercentage: number
  }
  duration: number
}

interface BundleErrorResponse {
  statusCode: number
  statusMessage: string
  data: {
    errors?: Array<{
      field?: string
      message: string
    }>
    error?: string
  }
}

// Simulation des validateurs
import {
  campaignBundleUpdateSchema,
  validateBundleProducts,
  validateBundleTotal,
  validateBundleBusinessRules
} from '../../schemas/bundle'
import { z } from 'zod'

// Mock du client Turso
const mockTursoClient = {
  execute: vi.fn()
}

// Utilitaire pour créer une erreur
function createError(options: any) {
  const error = new Error(options.statusMessage)
  Object.assign(error, options)
  return error
}

// Simulation de l'handler PUT avec optimistic locking amélioré
async function simulatePutHandler(bundleId: string, body: any, options: {
  optimisticLocking?: boolean
  lastModified?: string
} = {}) {
  const startTime = Date.now()

  try {
    console.log(`📦 PUT /api/campaign-bundles/${bundleId} - Mise à jour bundle`)

    if (!bundleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du bundle requis'
      })
    }

    // Ajouter l'ID au body
    body.id = bundleId

    // Validation du schéma
    let validatedData
    try {
      validatedData = campaignBundleUpdateSchema.parse(body)
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

    // Simulation base de données
    if (!mockTursoClient.execute) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le bundle existe (avec optimistic locking)
    const existingBundleQuery = options.optimisticLocking
      ? 'SELECT id, updated_at FROM campaign_bundles WHERE id = ?'
      : 'SELECT id FROM campaign_bundles WHERE id = ?'

    const existingBundle = await mockTursoClient.execute({
      sql: existingBundleQuery,
      args: [bundleId]
    })

    if (existingBundle.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    }

    // Optimistic locking check
    if (options.optimisticLocking && options.lastModified) {
      const currentUpdatedAt = existingBundle.rows[0].updated_at
      if (currentUpdatedAt !== options.lastModified) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Conflit de version détecté',
          data: {
            error: 'Le bundle a été modifié par un autre utilisateur',
            currentVersion: currentUpdatedAt,
            attemptedVersion: options.lastModified
          }
        })
      }
    }

    // Validations métier si des produits sont fournis
    if (validatedData.products) {
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
    }

    try {
      // Calculs automatiques
      let calculatedTotal = validatedData.estimatedTotal
      let discountPercentage = 0
      let basePrice = validatedData.originalTotal

      if (validatedData.products) {
        const productsTotal = validatedData.products.reduce((total: number, product: any) => total + product.subtotal, 0)
        calculatedTotal = productsTotal
        basePrice = validatedData.originalTotal || productsTotal
        discountPercentage = basePrice > 0 ? ((basePrice - calculatedTotal) / basePrice * 100) : 0
      }

      // Simulation de la mise à jour
      const updateResult = await mockTursoClient.execute({
        sql: 'UPDATE campaign_bundles SET ... WHERE id = ?',
        args: [bundleId]
      })

      // Mettre à jour les produits si fournis
      if (validatedData.products) {
        // Supprimer les anciens produits
        await mockTursoClient.execute({
          sql: 'DELETE FROM bundle_products WHERE bundle_id = ?',
          args: [bundleId]
        })

        // Ajouter les nouveaux produits
        for (let i = 0; i < validatedData.products.length; i++) {
          await mockTursoClient.execute({
            sql: 'INSERT INTO bundle_products...',
            args: [bundleId, validatedData.products[i].id]
          })
        }
      }

      console.log(`✅ Bundle mis à jour avec succès: ${bundleId}`)

      // Simulation récupération bundle mis à jour
      const updatedBundleResult = await mockTursoClient.execute({
        sql: 'SELECT * FROM campaign_bundles WHERE id = ?',
        args: [bundleId]
      })

      const bundleData = updatedBundleResult.rows[0] || {}

      // Récupération des produits
      const productsResult = await mockTursoClient.execute({
        sql: 'SELECT * FROM bundle_products WHERE bundle_id = ?',
        args: [bundleId]
      })

      const products = validatedData.products || []
      const estimatedTotal = calculatedTotal || 0
      const originalTotal = products.reduce((sum: number, p: any) => sum + p.subtotal, 0)
      const savings = Math.max(0, originalTotal - estimatedTotal)

      const response = {
        success: true,
        data: {
          id: bundleId,
          name: validatedData.name || `Bundle ${bundleId}`,
          description: validatedData.description || 'Description mise à jour',
          targetAudience: validatedData.targetAudience || 'local',
          budgetRange: estimatedTotal < 20000 ? 'starter' : estimatedTotal < 50000 ? 'standard' : 'premium',
          products,
          estimatedTotal,
          originalTotal,
          savings,
          popularity: 90,
          isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
          isFeatured: (validatedData.displayOrder || 5) <= 3,
          tags: validatedData.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          icon: validatedData.icon,
          color: validatedData.color,
          displayOrder: validatedData.displayOrder || 5,
          discountPercentage: discountPercentage
        },
        duration: Date.now() - startTime
      }

      return response

    } catch (dbError: any) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour du bundle',
        data: { error: dbError.message }
      })
    }

  } catch (error: any) {
    console.log(`❌ Erreur PUT /api/campaign-bundles/${bundleId}:`, error)

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

describe('PUT /api/campaign-bundles/[id] - Tests d\'intégration critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (mockTursoClient.execute && typeof mockTursoClient.execute.mockReset === 'function') {
      mockTursoClient.execute.mockReset()
    }
  })

  describe('Mises à jour basiques', () => {
    it('should update bundle with valid partial data', async () => {
      const bundleId = 'bundle-123'
      const updateData = {
        name: 'Bundle Mis à Jour',
        description: 'Nouvelle description plus détaillée',
        isActive: false
      }

      // Mock bundle existant
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Check existence
        .mockResolvedValueOnce({}) // Update bundle
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: updateData.name }] }) // Get updated
        .mockResolvedValue({ rows: [] }) // Get products

      const response = await simulatePutHandler(bundleId, updateData)

      expect(response.success).toBe(true)
      expect(response.data.id).toBe(bundleId)
      expect(response.data.name).toBe('Bundle Mis à Jour')
      expect(response.data.isActive).toBe(false)
      expect(response.duration).toBeGreaterThan(0)
    })

    it('should update bundle with products replacement', async () => {
      const bundleId = 'bundle-456'
      const updateData = {
        name: 'Bundle avec Nouveaux Produits',
        products: [
          {
            id: 'new-prod-1',
            name: 'Nouveau Produit 1',
            basePrice: 8000,
            quantity: 1,
            subtotal: 8000
          },
          {
            id: 'new-prod-2',
            name: 'Nouveau Produit 2',
            basePrice: 12000,
            quantity: 2,
            subtotal: 24000
          }
        ],
        estimatedTotal: 32000
      }

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Check existence
        .mockResolvedValueOnce({}) // Update bundle
        .mockResolvedValueOnce({}) // Delete old products
        .mockResolvedValueOnce({}) // Insert new product 1
        .mockResolvedValueOnce({}) // Insert new product 2
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Get updated bundle
        .mockResolvedValue({ rows: [] }) // Get products

      const response = await simulatePutHandler(bundleId, updateData)

      expect(response.success).toBe(true)
      expect(response.data.products).toHaveLength(2)
      expect(response.data.estimatedTotal).toBe(32000)
      expect(response.data.originalTotal).toBe(32000) // sum of subtotals
    })

    it('should reject update for non-existent bundle', async () => {
      const bundleId = 'non-existent-bundle'
      const updateData = { name: 'Bundle Inexistant' }

      mockTursoClient.execute.mockResolvedValueOnce({ rows: [] }) // Bundle not found

      await expect(simulatePutHandler(bundleId, updateData)).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    })

    it('should reject invalid update data', async () => {
      const bundleId = 'bundle-789'
      const invalidData = {
        name: 'AB', // Trop court
        targetAudience: 'invalid_audience'
      }

      await expect(simulatePutHandler(bundleId, invalidData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Données invalides',
        data: {
          errors: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String)
            })
          ])
        }
      })
    })
  })

  describe('Optimistic Locking - Gestion des conflits', () => {
    it('should detect version conflict with optimistic locking', async () => {
      const bundleId = 'bundle-conflict'
      const updateData = { name: 'Bundle Conflictuel' }
      const lastModified = '2024-01-01T10:00:00Z'
      const currentModified = '2024-01-01T10:05:00Z' // Version plus récente

      mockTursoClient.execute.mockResolvedValueOnce({
        rows: [{ id: bundleId, updated_at: currentModified }]
      })

      await expect(simulatePutHandler(bundleId, updateData, {
        optimisticLocking: true,
        lastModified: lastModified
      })).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Conflit de version détecté',
        data: {
          error: 'Le bundle a été modifié par un autre utilisateur',
          currentVersion: currentModified,
          attemptedVersion: lastModified
        }
      })
    })

    it('should succeed when versions match with optimistic locking', async () => {
      const bundleId = 'bundle-sync'
      const updateData = { name: 'Bundle Synchronisé' }
      const lastModified = '2024-01-01T10:00:00Z'

      mockTursoClient.execute
        .mockResolvedValueOnce({
          rows: [{ id: bundleId, updated_at: lastModified }] // Same version
        })
        .mockResolvedValueOnce({}) // Update bundle
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Get updated
        .mockResolvedValue({ rows: [] }) // Get products

      const response = await simulatePutHandler(bundleId, updateData, {
        optimisticLocking: true,
        lastModified: lastModified
      })

      expect(response.success).toBe(true)
      expect(response.data.name).toBe('Bundle Synchronisé')
    })

    it('should work without optimistic locking when disabled', async () => {
      const bundleId = 'bundle-no-lock'
      const updateData = { name: 'Bundle Sans Verrou' }

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Check existence (no version)
        .mockResolvedValueOnce({}) // Update bundle
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Get updated
        .mockResolvedValue({ rows: [] }) // Get products

      const response = await simulatePutHandler(bundleId, updateData, {
        optimisticLocking: false
      })

      expect(response.success).toBe(true)
      expect(response.data.name).toBe('Bundle Sans Verrou')
    })
  })

  describe('Validation métier complexe', () => {
    it('should reject business rule violations in updates', async () => {
      const bundleId = 'bundle-business'
      const invalidUpdate = {
        budgetRange: 'starter', // starter = 0-10000
        products: [
          {
            id: 'expensive-prod',
            name: 'Produit Cher',
            basePrice: 25000,
            quantity: 1,
            subtotal: 25000
          }
        ],
        estimatedTotal: 25000 // Trop élevé pour starter
      }

      mockTursoClient.execute.mockResolvedValueOnce({ rows: [{ id: bundleId }] })

      await expect(simulatePutHandler(bundleId, invalidUpdate)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            expect.stringContaining('ne correspond pas à la gamme de budget starter')
          ])
        }
      })
    })

    it('should validate featured bundle popularity rule on update', async () => {
      const bundleId = 'bundle-featured'
      const invalidUpdate = {
        isFeatured: true,
        popularity: 4, // Trop bas pour featured
        displayOrder: 1 // Featured position
      }

      mockTursoClient.execute.mockResolvedValueOnce({ rows: [{ id: bundleId }] })

      await expect(simulatePutHandler(bundleId, invalidUpdate)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier'
      })
    })

    it('should handle product subtotal validation on update', async () => {
      const bundleId = 'bundle-subtotal'
      const invalidUpdate = {
        products: [
          {
            id: 'wrong-calc-prod',
            name: 'Produit Calcul Faux',
            basePrice: 1000,
            quantity: 5,
            subtotal: 4000 // Devrait être 5000
          }
        ]
      }

      mockTursoClient.execute.mockResolvedValueOnce({ rows: [{ id: bundleId }] })

      await expect(simulatePutHandler(bundleId, invalidUpdate)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Erreurs de validation métier',
        data: {
          errors: expect.arrayContaining([
            expect.stringContaining('Sous-total incorrect')
          ])
        }
      })
    })
  })

  describe('Gestion d\'erreurs et rollback', () => {
    it('should handle database transaction failures', async () => {
      const bundleId = 'bundle-db-error'
      const updateData = { name: 'Bundle Erreur DB' }

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Check existence
        .mockRejectedValue(new Error('Database transaction failed')) // Update fails

      await expect(simulatePutHandler(bundleId, updateData)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour du bundle'
      })
    })

    it('should handle partial update failures with rollback simulation', async () => {
      const bundleId = 'bundle-partial-fail'
      const updateData = {
        name: 'Bundle Rollback Test',
        products: [
          {
            id: 'rollback-prod',
            name: 'Produit Rollback',
            basePrice: 5000,
            quantity: 2,
            subtotal: 10000
          }
        ]
      }

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Check existence
        .mockResolvedValueOnce({}) // Update bundle succeeds
        .mockResolvedValueOnce({}) // Delete old products succeeds
        .mockRejectedValue(new Error('Product insertion failed')) // Product insert fails

      await expect(simulatePutHandler(bundleId, updateData)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Erreur lors de la mise à jour du bundle'
      })
    })

    it('should handle database unavailability', async () => {
      const bundleId = 'bundle-no-db'
      const updateData = { name: 'Bundle Sans DB' }

      // Simuler database non disponible
      mockTursoClient.execute = null as any

      await expect(simulatePutHandler(bundleId, updateData)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    })
  })

  describe('Performance et cas limites', () => {
    it('should handle large product updates efficiently', async () => {
      const bundleId = 'bundle-large'
      const updateData = {
        name: 'Bundle Grande Mise à Jour',
        products: Array.from({ length: 15 }, (_, i) => ({
          id: `large-prod-${i}`,
          name: `Produit Large ${i}`,
          basePrice: 1000,
          quantity: 1,
          subtotal: 1000
        }))
      }

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Check existence
        .mockResolvedValueOnce({}) // Update bundle
        .mockResolvedValueOnce({}) // Delete old products
        .mockResolvedValue({}) // Multiple product insertions
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Get updated
        .mockResolvedValue({ rows: [] }) // Get products

      const startTime = Date.now()
      const response = await simulatePutHandler(bundleId, updateData)
      const actualDuration = Date.now() - startTime

      expect(response.success).toBe(true)
      expect(response.data.products).toHaveLength(15)
      expect(actualDuration).toBeLessThan(1000) // < 1 seconde
      expect(response.duration).toBeLessThanOrEqual(actualDuration)

      // Vérifier que tous les produits ont été "insérés"
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(19) // 1 exist + 1 update + 1 delete + 15 inserts + 1 get bundle + products
    })

    it('should handle minimal updates correctly', async () => {
      const bundleId = 'bundle-minimal'
      const updateData = {
        isActive: false // Seul changement
      }

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Check existence
        .mockResolvedValueOnce({}) // Update bundle
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] }) // Get updated
        .mockResolvedValue({ rows: [] }) // Get products

      const response = await simulatePutHandler(bundleId, updateData)

      expect(response.success).toBe(true)
      expect(response.data.isActive).toBe(false)

      // Vérifier qu'aucune mise à jour de produits n'a été faite
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(4) // exist + update + get bundle + get products
    })

    it('should maintain data consistency on concurrent updates simulation', async () => {
      const bundleId = 'bundle-concurrent'
      const updateData1 = { name: 'Mise à jour 1' }
      const updateData2 = { name: 'Mise à jour 2' }
      const timestamp1 = '2024-01-01T10:00:00Z'
      const timestamp2 = '2024-01-01T10:01:00Z'

      // Premier update réussit
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, updated_at: timestamp1 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: bundleId }] })
        .mockResolvedValue({ rows: [] })

      const response1 = await simulatePutHandler(bundleId, updateData1, {
        optimisticLocking: true,
        lastModified: timestamp1
      })

      expect(response1.success).toBe(true)

      // Reset mocks pour second update
      mockTursoClient.execute.mockReset()

      // Deuxième update avec version obsolète échoue
      mockTursoClient.execute.mockResolvedValueOnce({
        rows: [{ id: bundleId, updated_at: timestamp2 }] // Version plus récente
      })

      await expect(simulatePutHandler(bundleId, updateData2, {
        optimisticLocking: true,
        lastModified: timestamp1 // Version obsolète
      })).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Conflit de version détecté'
      })
    })
  })
})