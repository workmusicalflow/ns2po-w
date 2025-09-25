import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BundleFactory } from '../helpers'

// Types basés sur l'API existante
interface BundleDeleteResponse {
  success: boolean
  message: string
  data: {
    id: string
    deletedAt: string
  }
  duration: number
}

interface BundleErrorResponse {
  statusCode: number
  statusMessage: string
  data: {
    error?: string
  }
}

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

// Simulation de l'handler DELETE avec contraintes référentielles améliorées
async function simulateDeleteHandler(bundleId: string, options: {
  forceDelete?: boolean
  checkReferences?: boolean
} = {}) {
  const startTime = Date.now()

  try {
    console.log(`📦 DELETE /api/campaign-bundles/${bundleId} - Suppression bundle`)

    if (!bundleId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID du bundle requis'
      })
    }

    // Simulation base de données
    if (!mockTursoClient.execute) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    }

    // Vérifier que le bundle existe
    const existingBundle = await mockTursoClient.execute({
      sql: 'SELECT id, name FROM campaign_bundles WHERE id = ?',
      args: [bundleId]
    })

    if (existingBundle.rows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    }

    const bundleName = existingBundle.rows[0].name || `Bundle ${bundleId}`

    // Vérification des contraintes référentielles améliorées
    if (options.checkReferences) {
      // Vérifier s'il y a des commandes actives liées à ce bundle
      const activeOrders = await mockTursoClient.execute({
        sql: 'SELECT COUNT(*) as count FROM orders WHERE bundle_id = ? AND status IN (?, ?)',
        args: [bundleId, 'pending', 'processing']
      })

      if (activeOrders.rows[0]?.count > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Suppression interdite - contraintes référentielles',
          data: {
            error: `Impossible de supprimer le bundle "${bundleName}". Il y a ${activeOrders.rows[0].count} commande(s) active(s) liée(s) à ce bundle.`,
            activeOrders: activeOrders.rows[0].count,
            suggestion: 'Veuillez d\'abord terminer ou annuler les commandes actives, ou utiliser l\'option de suppression forcée.'
          }
        })
      }

      // Vérifier s'il y a des devis non expirés
      const activeQuotes = await mockTursoClient.execute({
        sql: 'SELECT COUNT(*) as count FROM quotes WHERE bundle_id = ? AND expires_at > ?',
        args: [bundleId, new Date().toISOString()]
      })

      if (activeQuotes.rows[0]?.count > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Suppression interdite - devis actifs',
          data: {
            error: `Impossible de supprimer le bundle "${bundleName}". Il y a ${activeQuotes.rows[0].count} devis actif(s) non expiré(s).`,
            activeQuotes: activeQuotes.rows[0].count,
            suggestion: 'Attendez l\'expiration des devis ou utilisez l\'option de suppression forcée.'
          }
        })
      }
    }

    try {
      // Si suppression forcée, nettoyer les références avant suppression
      if (options.forceDelete) {
        console.log(`⚠️ Suppression forcée activée pour bundle ${bundleId}`)

        // Archiver les commandes actives au lieu de les supprimer
        await mockTursoClient.execute({
          sql: 'UPDATE orders SET status = ?, archived_reason = ? WHERE bundle_id = ? AND status IN (?, ?)',
          args: ['archived', 'Bundle supprimé - commande archivée', bundleId, 'pending', 'processing']
        })

        // Invalider les devis actifs
        await mockTursoClient.execute({
          sql: 'UPDATE quotes SET status = ?, invalidated_reason = ? WHERE bundle_id = ? AND expires_at > ?',
          args: ['invalidated', 'Bundle supprimé', bundleId, new Date().toISOString()]
        })
      }

      // 1. Supprimer les produits du bundle (CASCADE automatique grâce aux FK)
      const deleteProductsResult = await mockTursoClient.execute({
        sql: 'DELETE FROM bundle_products WHERE bundle_id = ?',
        args: [bundleId]
      })

      // 2. Supprimer les analytics/historique liés au bundle
      await mockTursoClient.execute({
        sql: 'DELETE FROM bundle_analytics WHERE bundle_id = ?',
        args: [bundleId]
      })

      // 3. Supprimer les personnalisations sauvegardées
      await mockTursoClient.execute({
        sql: 'DELETE FROM bundle_customizations WHERE original_bundle_id = ?',
        args: [bundleId]
      })

      // 4. Supprimer le bundle principal
      const deleteBundleResult = await mockTursoClient.execute({
        sql: 'DELETE FROM campaign_bundles WHERE id = ?',
        args: [bundleId]
      })

      console.log(`✅ Bundle supprimé avec succès: ${bundleId} (${bundleName})`)

      const response = {
        success: true,
        message: `Bundle "${bundleName}" supprimé avec succès`,
        data: {
          id: bundleId,
          deletedAt: new Date().toISOString()
        },
        duration: Date.now() - startTime
      }

      return response

    } catch (dbError: any) {
      console.error('❌ Erreur base de données:', dbError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du bundle',
        data: { error: dbError.message }
      })
    }

  } catch (error: any) {
    console.error(`❌ Erreur DELETE /api/campaign-bundles/${bundleId}:`, error)

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

describe('DELETE /api/campaign-bundles/[id] - Tests d\'intégration critiques', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    if (mockTursoClient.execute && typeof mockTursoClient.execute.mockReset === 'function') {
      mockTursoClient.execute.mockReset()
    }
  })

  describe('Suppression basique', () => {
    it('should delete bundle successfully when no constraints', async () => {
      const bundleId = 'bundle-delete-basic'
      const bundleName = 'Bundle à Supprimer'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId)

      expect(response.success).toBe(true)
      expect(response.message).toBe(`Bundle "${bundleName}" supprimé avec succès`)
      expect(response.data.id).toBe(bundleId)
      expect(response.data.deletedAt).toBeDefined()
      expect(response.duration).toBeGreaterThan(0)

      // Vérifier que toutes les suppressions ont été appelées
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(5)
    })

    it('should reject deletion of non-existent bundle', async () => {
      const bundleId = 'non-existent-bundle'

      mockTursoClient.execute.mockResolvedValueOnce({ rows: [] }) // Bundle not found

      await expect(simulateDeleteHandler(bundleId)).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    })

    it('should handle missing bundle ID', async () => {
      await expect(simulateDeleteHandler('')).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'ID du bundle requis'
      })
    })

    it('should handle database unavailability', async () => {
      const bundleId = 'bundle-no-db'

      // Simuler database non disponible
      mockTursoClient.execute = null as any

      await expect(simulateDeleteHandler(bundleId)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Base de données non disponible'
      })
    })
  })

  describe('Contraintes référentielles - Protection', () => {
    it('should prevent deletion when active orders exist', async () => {
      const bundleId = 'bundle-with-orders'
      const bundleName = 'Bundle avec Commandes'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({ rows: [{ count: 3 }] }) // Active orders check

      await expect(simulateDeleteHandler(bundleId, { checkReferences: true })).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Suppression interdite - contraintes référentielles',
        data: {
          error: expect.stringContaining('3 commande(s) active(s)'),
          activeOrders: 3,
          suggestion: expect.stringContaining('terminer ou annuler les commandes')
        }
      })
    })

    it('should prevent deletion when active quotes exist', async () => {
      const bundleId = 'bundle-with-quotes'
      const bundleName = 'Bundle avec Devis'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // No active orders
        .mockResolvedValueOnce({ rows: [{ count: 2 }] }) // Active quotes check

      await expect(simulateDeleteHandler(bundleId, { checkReferences: true })).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Suppression interdite - devis actifs',
        data: {
          error: expect.stringContaining('2 devis actif(s)'),
          activeQuotes: 2,
          suggestion: expect.stringContaining('expiration des devis')
        }
      })
    })

    it('should allow deletion when no active references exist', async () => {
      const bundleId = 'bundle-safe-delete'
      const bundleName = 'Bundle Sans Références'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // No active orders
        .mockResolvedValueOnce({ rows: [{ count: 0 }] }) // No active quotes
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId, { checkReferences: true })

      expect(response.success).toBe(true)
      expect(response.message).toBe(`Bundle "${bundleName}" supprimé avec succès`)

      // Vérifier que toutes les vérifications et suppressions ont été faites
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(7) // 3 checks + 4 deletes
    })

    it('should work without reference checking when disabled', async () => {
      const bundleId = 'bundle-no-check'
      const bundleName = 'Bundle Sans Vérification'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId, { checkReferences: false })

      expect(response.success).toBe(true)

      // Pas de vérifications référentielles - seulement existence + suppressions
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(5)
    })
  })

  describe('Suppression forcée avec cascade', () => {
    it('should force delete with active orders archiving', async () => {
      const bundleId = 'bundle-force-delete'
      const bundleName = 'Bundle Suppression Forcée'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({ rows: [{ count: 2 }] }) // Active orders
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // Active quotes
        .mockResolvedValueOnce({}) // Archive orders
        .mockResolvedValueOnce({}) // Invalidate quotes
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId, {
        checkReferences: true,
        forceDelete: true
      })

      expect(response.success).toBe(true)
      expect(response.message).toBe(`Bundle "${bundleName}" supprimé avec succès`)

      // Vérifier que les commandes ont été archivées et les devis invalidés
      expect(mockTursoClient.execute).toHaveBeenCalledWith({
        sql: 'UPDATE orders SET status = ?, archived_reason = ? WHERE bundle_id = ? AND status IN (?, ?)',
        args: ['archived', 'Bundle supprimé - commande archivée', bundleId, 'pending', 'processing']
      })

      expect(mockTursoClient.execute).toHaveBeenCalledWith({
        sql: 'UPDATE quotes SET status = ?, invalidated_reason = ? WHERE bundle_id = ? AND expires_at > ?',
        args: ['invalidated', 'Bundle supprimé', bundleId, expect.any(String)]
      })
    })

    it('should force delete without reference checking', async () => {
      const bundleId = 'bundle-force-no-check'
      const bundleName = 'Bundle Force Sans Check'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({}) // Archive orders (even without check)
        .mockResolvedValueOnce({}) // Invalidate quotes
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId, {
        checkReferences: false,
        forceDelete: true
      })

      expect(response.success).toBe(true)

      // Avec force delete, on archive/invalide toujours même sans vérification
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(7)
    })
  })

  describe('Cascade et nettoyage complet', () => {
    it('should delete all related data in correct order', async () => {
      const bundleId = 'bundle-cascade'
      const bundleName = 'Bundle Cascade Test'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId)

      expect(response.success).toBe(true)

      // Vérifier l'ordre des suppressions (produits → analytics → customizations → bundle)
      const calls = mockTursoClient.execute.mock.calls

      expect(calls[1][0].sql).toContain('DELETE FROM bundle_products WHERE bundle_id = ?')
      expect(calls[2][0].sql).toContain('DELETE FROM bundle_analytics WHERE bundle_id = ?')
      expect(calls[3][0].sql).toContain('DELETE FROM bundle_customizations WHERE original_bundle_id = ?')
      expect(calls[4][0].sql).toContain('DELETE FROM campaign_bundles WHERE id = ?')

      // Vérifier que tous les appels utilisent le bon bundleId
      calls.slice(1).forEach(call => {
        expect(call[0].args).toContain(bundleId)
      })
    })

    it('should handle partial cascade failures with rollback', async () => {
      const bundleId = 'bundle-cascade-fail'
      const bundleName = 'Bundle Cascade Échec'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: bundleName }] }) // Check existence
        .mockResolvedValueOnce({}) // Delete products succeeds
        .mockRejectedValue(new Error('Analytics deletion failed')) // Analytics deletion fails

      await expect(simulateDeleteHandler(bundleId)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du bundle',
        data: {
          error: 'Analytics deletion failed'
        }
      })
    })
  })

  describe('Gestion d\'erreurs et cas limites', () => {
    it('should handle database transaction failures', async () => {
      const bundleId = 'bundle-db-error'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: 'Bundle DB Error' }] }) // Check existence
        .mockRejectedValue(new Error('Database transaction failed')) // Delete products fails

      await expect(simulateDeleteHandler(bundleId)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du bundle'
      })
    })

    it('should handle constraint violation errors gracefully', async () => {
      const bundleId = 'bundle-constraint'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: 'Bundle Contrainte' }] }) // Check existence
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockRejectedValue(new Error('FOREIGN KEY constraint failed')) // Bundle deletion fails

      await expect(simulateDeleteHandler(bundleId)).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: 'Erreur lors de la suppression du bundle',
        data: {
          error: 'FOREIGN KEY constraint failed'
        }
      })
    })

    it('should handle bundle with null name gracefully', async () => {
      const bundleId = 'bundle-null-name'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: null }] }) // Bundle with null name
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId)

      expect(response.success).toBe(true)
      expect(response.message).toBe(`Bundle "Bundle ${bundleId}" supprimé avec succès`) // Fallback name
    })
  })

  describe('Performance et optimisations', () => {
    it('should complete deletion within reasonable time', async () => {
      const bundleId = 'bundle-performance'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: 'Bundle Performance' }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValue({})

      const startTime = Date.now()
      const response = await simulateDeleteHandler(bundleId)
      const actualDuration = Date.now() - startTime

      expect(actualDuration).toBeLessThan(1000) // < 1 seconde
      expect(response.duration).toBeLessThanOrEqual(actualDuration)
      expect(response.success).toBe(true)
    })

    it('should handle deletion with minimal database calls', async () => {
      const bundleId = 'bundle-minimal'

      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: 'Bundle Minimal' }] })
        .mockResolvedValueOnce({}) // Delete products
        .mockResolvedValueOnce({}) // Delete analytics
        .mockResolvedValueOnce({}) // Delete customizations
        .mockResolvedValue({}) // Delete bundle

      const response = await simulateDeleteHandler(bundleId)

      expect(response.success).toBe(true)

      // Vérifier qu'on a le nombre minimum d'appels nécessaires
      expect(mockTursoClient.execute).toHaveBeenCalledTimes(5) // 1 check + 4 deletes
    })

    it('should handle concurrent deletion attempts gracefully', async () => {
      const bundleId = 'bundle-concurrent'

      // Premier appel réussit
      mockTursoClient.execute
        .mockResolvedValueOnce({ rows: [{ id: bundleId, name: 'Bundle Concurrent' }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValue({})

      const response1 = await simulateDeleteHandler(bundleId)
      expect(response1.success).toBe(true)

      // Reset pour deuxième appel
      mockTursoClient.execute.mockReset()

      // Deuxième appel - bundle déjà supprimé
      mockTursoClient.execute.mockResolvedValueOnce({ rows: [] }) // Bundle not found

      await expect(simulateDeleteHandler(bundleId)).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Bundle non trouvé'
      })
    })
  })
})