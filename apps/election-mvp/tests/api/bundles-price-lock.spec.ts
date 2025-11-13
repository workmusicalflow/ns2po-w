/**
 * Tests unitaires API pour la fonctionnalité Price Lock
 *
 * Solution pragmatique post-48h debugging E2E:
 * - Validation API isolée (Gemini + 26 sources communautaires)
 * - Environnement @nuxt/test-utils (évite complexité Playwright)
 * - Focus sur logique métier Price Lock
 *
 * Référence: PUT-HANDLER-500-RESOLUTION.md
 */

import { describe, it, expect, afterEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('API Bundles - Price Lock Feature', async () => {
  await setup({
    server: true,
    port: 3002 // Port différent pour éviter conflits avec tests produits
  })

  let createdProductId: string | null = null
  let createdBundleId: string | null = null

  afterEach(async () => {
    // Cleanup: Supprimer bundle et produit créés pendant le test
    if (createdBundleId) {
      try {
        await $fetch(`/api/campaign-bundles/${createdBundleId}`, {
          method: 'DELETE'
        })
        console.log(`✅ Bundle ${createdBundleId} nettoyé`)
      } catch (error) {
        console.warn(`⚠️ Échec nettoyage bundle ${createdBundleId}:`, error)
      }
      createdBundleId = null
    }

    if (createdProductId) {
      try {
        await $fetch(`/api/admin/products/${createdProductId}`, {
          method: 'DELETE'
        })
        console.log(`✅ Produit ${createdProductId} nettoyé`)
      } catch (error) {
        console.warn(`⚠️ Échec nettoyage produit ${createdProductId}:`, error)
      }
      createdProductId = null
    }
  })

  describe('PUT /api/campaign-bundles/[id] - Price Lock Persistence', () => {
    it('devrait persister priceLocked: true lors d\'une mise à jour de bundle', async () => {
      const timestamp = Date.now()

      // 1. Créer un produit test
      console.log('🔧 Création produit test...')
      const productResponse = await $fetch('/api/admin/products', {
        method: 'POST',
        body: {
          name: `Unit Test Product ${timestamp}`,
          description: 'Test product for Price Lock unit testing',
          category: 'Affiches et panneaux',
          basePrice: 5800,
          stockQuantity: 1000,
          minQuantity: 1,
          isActive: true,
          materials: [{ name: 'PVC' }],
          colors: [{ name: 'Rouge', hexCode: '#FF0000' }],
          sizes: [{ name: 'A4', dimensions: '21x29.7cm' }]
        }
      })

      expect(productResponse).toHaveProperty('success', true)
      expect(productResponse).toHaveProperty('data')
      expect(productResponse.data).toHaveProperty('id')

      createdProductId = productResponse.data.id
      console.log(`✅ Produit créé: ${createdProductId}`)

      // 2. Créer un bundle test avec le produit
      console.log('🔧 Création bundle test...')
      const bundleResponse = await $fetch('/api/campaign-bundles', {
        method: 'POST',
        body: {
          name: `Unit Test Bundle ${timestamp}`,
          description: 'Test bundle for Price Lock feature',
          targetAudience: 'local',
          estimatedTotal: 29000,
          originalTotal: 29000,
          popularity: 90,
          isActive: true,
          isFeatured: false,
          products: [{
            id: createdProductId,
            quantity: 5,
            basePrice: 5800,
            subtotal: 29000,
            priceLocked: false // Initialement non verrouillé
          }],
          tags: ['test', 'unit-testing']
        }
      })

      expect(bundleResponse).toHaveProperty('success', true)
      expect(bundleResponse).toHaveProperty('data')
      expect(bundleResponse.data).toHaveProperty('id')

      createdBundleId = String(bundleResponse.data.id)
      console.log(`✅ Bundle créé: ${createdBundleId}`)

      // 3. Mettre à jour le bundle avec priceLocked: true
      console.log('🔄 Mise à jour bundle avec priceLocked: true...')
      const updateResponse = await $fetch(`/api/campaign-bundles/${createdBundleId}`, {
        method: 'PUT',
        body: {
          name: `Unit Test Bundle ${timestamp}`,
          description: 'Test bundle for Price Lock feature',
          targetAudience: 'local',
          estimatedTotal: 29000,
          originalTotal: 29000,
          popularity: 90,
          isActive: true,
          isFeatured: false,
          products: [{
            id: createdProductId,
            quantity: 5,
            basePrice: 5800,
            subtotal: 29000,
            priceLocked: true // ✅ VERROUILLÉ
          }],
          tags: ['test', 'unit-testing']
        }
      })

      // 4. Vérifications de la réponse
      expect(updateResponse).toHaveProperty('success', true)
      expect(updateResponse).toHaveProperty('data')
      expect(updateResponse.data).toHaveProperty('id', createdBundleId)
      expect(updateResponse.data).toHaveProperty('products')
      expect(Array.isArray(updateResponse.data.products)).toBe(true)
      expect(updateResponse.data.products.length).toBe(1)

      console.log('✅ Réponse PUT reçue avec succès')

      // 5. Récupérer le bundle via GET pour vérifier persistance
      console.log('🔍 Vérification persistance via GET...')
      const getResponse = await $fetch(`/api/campaign-bundles/${createdBundleId}`)

      expect(getResponse).toHaveProperty('success', true)
      expect(getResponse).toHaveProperty('data')
      expect(getResponse.data).toHaveProperty('id', createdBundleId)
      expect(getResponse.data).toHaveProperty('products')
      expect(getResponse.data.products.length).toBe(1)

      const bundleProduct = getResponse.data.products[0]
      expect(bundleProduct).toHaveProperty('id', createdProductId)
      expect(bundleProduct).toHaveProperty('priceLocked', true)

      console.log('✅ Price Lock persisté correctement en base de données')
    })

    it('devrait gérer priceLocked: false (déverrouillage)', async () => {
      const timestamp = Date.now()

      // 1. Créer produit
      const productResponse = await $fetch('/api/admin/products', {
        method: 'POST',
        body: {
          name: `Unit Test Product Unlock ${timestamp}`,
          description: 'Test product for unlock',
          category: 'Affiches et panneaux',
          basePrice: 3000,
          stockQuantity: 500,
          minQuantity: 1,
          isActive: true,
          materials: [{ name: 'Papier' }],
          colors: [{ name: 'Bleu', hexCode: '#0000FF' }],
          sizes: [{ name: 'A3', dimensions: '29.7x42cm' }]
        }
      })

      createdProductId = productResponse.data.id

      // 2. Créer bundle avec priceLocked: true
      const bundleResponse = await $fetch('/api/campaign-bundles', {
        method: 'POST',
        body: {
          name: `Unit Test Bundle Unlock ${timestamp}`,
          description: 'Test unlock',
          targetAudience: 'national',
          estimatedTotal: 15000,
          originalTotal: 15000,
          popularity: 85,
          isActive: true,
          isFeatured: false,
          products: [{
            id: createdProductId,
            quantity: 5,
            basePrice: 3000,
            subtotal: 15000,
            priceLocked: true // Initialement verrouillé
          }],
          tags: []
        }
      })

      createdBundleId = String(bundleResponse.data.id)

      // 3. Déverrouiller via PUT
      const updateResponse = await $fetch(`/api/campaign-bundles/${createdBundleId}`, {
        method: 'PUT',
        body: {
          name: `Unit Test Bundle Unlock ${timestamp}`,
          description: 'Test unlock',
          targetAudience: 'national',
          estimatedTotal: 15000,
          originalTotal: 15000,
          products: [{
            id: createdProductId,
            quantity: 5,
            basePrice: 3000,
            subtotal: 15000,
            priceLocked: false // ✅ DÉVERROUILLÉ
          }],
          tags: []
        }
      })

      expect(updateResponse).toHaveProperty('success', true)

      // 4. Vérifier déverrouillage persisté
      const getResponse = await $fetch(`/api/campaign-bundles/${createdBundleId}`)
      const bundleProduct = getResponse.data.products[0]

      expect(bundleProduct).toHaveProperty('priceLocked', false)
      console.log('✅ Price Lock déverrouillé correctement')
    })

    it('devrait retourner une erreur 400 si le produit n\'existe pas', async () => {
      const timestamp = Date.now()

      // Créer bundle puis essayer de le mettre à jour avec un produit inexistant
      const productResponse = await $fetch('/api/admin/products', {
        method: 'POST',
        body: {
          name: `Temp Product ${timestamp}`,
          description: 'Temp',
          category: 'Affiches et panneaux',
          basePrice: 1000,
          stockQuantity: 100,
          minQuantity: 1,
          isActive: true,
          materials: [{ name: 'Test' }],
          colors: [{ name: 'Test', hexCode: '#000000' }],
          sizes: [{ name: 'Test', dimensions: '10x10cm' }]
        }
      })

      createdProductId = productResponse.data.id

      const bundleResponse = await $fetch('/api/campaign-bundles', {
        method: 'POST',
        body: {
          name: `Bundle Invalid Product ${timestamp}`,
          description: 'Test',
          targetAudience: 'local',
          estimatedTotal: 5000,
          originalTotal: 5000,
          products: [{
            id: createdProductId,
            quantity: 5,
            basePrice: 1000,
            subtotal: 5000,
            priceLocked: false
          }],
          tags: []
        }
      })

      createdBundleId = String(bundleResponse.data.id)

      // Tenter de mettre à jour avec un produit inexistant
      try {
        await $fetch(`/api/campaign-bundles/${createdBundleId}`, {
          method: 'PUT',
          body: {
            name: `Bundle Invalid Product ${timestamp}`,
            description: 'Test',
            targetAudience: 'local',
            estimatedTotal: 5000,
            originalTotal: 5000,
            products: [{
              id: 'prod_INEXISTANT_123456', // ❌ Produit qui n'existe pas
              quantity: 5,
              basePrice: 1000,
              subtotal: 5000,
              priceLocked: true
            }],
            tags: []
          }
        })

        // Si on arrive ici, le test échoue (devrait avoir throw)
        expect.fail('La requête aurait dû échouer avec un produit inexistant')

      } catch (error: any) {
        // Vérifier que c'est bien une erreur 400
        expect(error).toBeDefined()
        expect(error.response).toBeDefined()
        expect(error.response.status).toBe(400)
        expect(error.response._data).toHaveProperty('statusMessage')
        expect(error.response._data.statusMessage).toContain('introuvables')

        console.log('✅ Erreur 400 retournée correctement pour produit inexistant')
      }
    })
  })
})
