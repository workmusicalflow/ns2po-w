/**
 * Tests E2E pour les endpoints API avec schéma normalisé
 * POST-MIGRATION 002: Validation des endpoints utilisant les tables relationnelles
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('API Products - Schéma Normalisé', async () => {
  await setup({
    server: true,
    // Port par défaut pour éviter conflits
    port: 3001
  })

  describe('GET /api/products', () => {
    it('devrait retourner une liste de produits avec relations normalisées', async () => {
      const response = await $fetch('/api/products')

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('source') // 'turso-normalized' ou 'static'
      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)

      // Vérifier structure produit avec relations
      const firstProduct = response.data[0]
      expect(firstProduct).toHaveProperty('id')
      expect(firstProduct).toHaveProperty('name')
      expect(firstProduct).toHaveProperty('category')

      // Vérifier que materials/colors/sizes sont des arrays (pas des strings JSON)
      if (response.source === 'turso-normalized') {
        expect(Array.isArray(firstProduct.materials)).toBe(true)
        expect(Array.isArray(firstProduct.colors)).toBe(true)
        expect(Array.isArray(firstProduct.sizes)).toBe(true)
      }
    })

    it('devrait retourner des métriques de performance', async () => {
      const response = await $fetch('/api/products')

      expect(response).toHaveProperty('duration')
      expect(typeof response.duration).toBe('number')
      expect(response.duration).toBeGreaterThan(0)
      expect(response).toHaveProperty('count')
      expect(response.count).toBe(response.data.length)
    })
  })

  describe('GET /api/products/:id', () => {
    let productId: string

    beforeAll(async () => {
      // Récupérer un ID produit existant
      const listResponse = await $fetch('/api/products')
      productId = listResponse.data[0]?.id || 'textile-tshirt-001'
    })

    it('devrait retourner un produit avec relations complètes', async () => {
      const response = await $fetch(`/api/products/${productId}`)

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('source') // 'turso-normalized' ou 'static'
      expect(response).toHaveProperty('data')

      const product = response.data
      expect(product.id).toBe(productId)
      expect(product).toHaveProperty('name')
      expect(product).toHaveProperty('category')
      expect(product).toHaveProperty('basePrice')

      // Vérifier relations normalisées
      if (response.source === 'turso-normalized') {
        expect(Array.isArray(product.materials)).toBe(true)
        expect(Array.isArray(product.colors)).toBe(true)
        expect(Array.isArray(product.sizes)).toBe(true)
        expect(Array.isArray(product.gallery)).toBe(true)
        expect(Array.isArray(product.tags)).toBe(true)
      }
    })

    it('devrait retourner 404 pour un produit inexistant', async () => {
      await expect(
        $fetch('/api/products/inexistant-id-999')
      ).rejects.toThrow()
    })

    it('devrait retourner 400 pour un ID invalide', async () => {
      await expect(
        $fetch('/api/products/')
      ).rejects.toThrow()
    })
  })

  describe('GET /api/products/search', () => {
    it('devrait rechercher avec FTS5 et retourner des résultats', async () => {
      const response = await $fetch('/api/products/search?q=tshirt')

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('source')
      expect(response).toHaveProperty('data')
      expect(Array.isArray(response.data)).toBe(true)
      expect(response).toHaveProperty('query', 'tshirt')

      if (response.source === 'turso-normalized-fts5') {
        expect(response).toHaveProperty('searchMethod')
        expect(response.searchMethod).toContain('fts5')
      }
    })

    it('devrait filtrer par matériau', async () => {
      const response = await $fetch('/api/products/search?q=shirt&material=coton')

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('filters')
      expect(response.filters).toHaveProperty('material', 'coton')

      if (response.source === 'turso-normalized-fts5' && response.data.length > 0) {
        expect(response.searchMethod).toContain('material')
      }
    })

    it('devrait filtrer par couleur', async () => {
      const response = await $fetch('/api/products/search?q=polo&color=blanc')

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('filters')
      expect(response.filters).toHaveProperty('color', 'blanc')

      if (response.source === 'turso-normalized-fts5' && response.data.length > 0) {
        expect(response.searchMethod).toContain('color')
      }
    })

    it('devrait combiner multiple filtres', async () => {
      const response = await $fetch('/api/products/search?q=textile&material=coton&color=blanc')

      expect(response).toHaveProperty('success', true)
      expect(response.filters.material).toBe('coton')
      expect(response.filters.color).toBe('blanc')

      if (response.source === 'turso-normalized-fts5') {
        expect(response.searchMethod).toMatch(/fts5.*material.*color/)
      }
    })

    it('devrait retourner 400 pour terme de recherche trop court', async () => {
      await expect(
        $fetch('/api/products/search?q=a')
      ).rejects.toThrow()
    })

    it('devrait retourner 400 sans terme de recherche', async () => {
      await expect(
        $fetch('/api/products/search')
      ).rejects.toThrow()
    })
  })

  describe('PUT /api/admin/products/:id', () => {
    let productId: string

    beforeAll(async () => {
      const listResponse = await $fetch('/api/products')
      productId = listResponse.data[0]?.id || 'textile-tshirt-001'
    })

    it('devrait mettre à jour les champs principaux d\'un produit', async () => {
      const updateData = {
        name: 'T-Shirt Personnalisé UPDATED',
        description: 'Description mise à jour',
        basePrice: 6000
      }

      const response = await $fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        body: updateData
      })

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('source', 'turso-normalized')
      expect(response.data.name).toBe(updateData.name)
      expect(response.data.description).toBe(updateData.description)
      expect(response.data.basePrice).toBe(updateData.basePrice)
    })

    it('devrait mettre à jour les relations normalisées', async () => {
      const updateData = {
        materials: ['100% Coton Bio', 'Polyester Recyclé'],
        colors: [
          { name: 'Blanc Écru', hex: '#FAFAFA' },
          { name: 'Noir Profond', hex: '#000000' }
        ],
        sizes: [
          { name: 'XS', category: 'XS-XL' },
          { name: 'S', category: 'XS-XL' },
          { name: 'M', category: 'XS-XL' }
        ]
      }

      const response = await $fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        body: updateData
      })

      expect(response).toHaveProperty('success', true)
      expect(response.data.materials).toEqual(updateData.materials)
      expect(response.data.colors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Blanc Écru'),
          expect.stringContaining('Noir Profond')
        ])
      )
      expect(response.data.sizes.length).toBe(3)
    })

    it('devrait retourner 404 pour un produit inexistant', async () => {
      await expect(
        $fetch('/api/admin/products/inexistant-999', {
          method: 'PUT',
          body: { name: 'Test' }
        })
      ).rejects.toThrow()
    })

    it('devrait valider les données avec Zod', async () => {
      await expect(
        $fetch(`/api/admin/products/${productId}`, {
          method: 'PUT',
          body: {
            basePrice: -100, // Prix négatif invalide
            colors: [{ name: 'Rouge', hex: 'INVALID_HEX' }] // Hex invalide
          }
        })
      ).rejects.toThrow()
    })
  })

  describe('POST /api/admin/products', () => {
    it('devrait créer un nouveau produit avec relations', async () => {
      const newProduct = {
        name: 'Casquette Test E2E',
        category: 'Textile',
        subcategory: 'Accessoires',
        basePrice: 4500,
        minQuantity: 25,
        maxQuantity: 500,
        description: 'Casquette créée via test E2E',
        image: 'https://res.cloudinary.com/dsrvzogof/image/upload/v1/test-casquette',
        isActive: true,
        materials: ['Coton', 'Polyester'],
        colors: [
          { name: 'Rouge', hex: '#FF0000' },
          { name: 'Bleu', hex: '#0000FF' }
        ],
        sizes: [
          { name: 'Unique', category: 'custom' }
        ],
        tags: ['test', 'e2e', 'automated']
      }

      const response = await $fetch('/api/admin/products', {
        method: 'POST',
        body: newProduct
      })

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('source', 'turso-normalized')
      expect(response.data).toHaveProperty('id')
      expect(response.data.name).toBe(newProduct.name)
      expect(response.data.category).toBe(newProduct.category)
      expect(response.data.materials).toEqual(newProduct.materials)
      expect(response.data.colors.length).toBe(2)
      expect(response.data.sizes.length).toBe(1)
      expect(response.data.tags).toEqual(newProduct.tags)

      // Vérifier que le produit est bien créé en base
      const getResponse = await $fetch(`/api/products/${response.data.id}`)
      expect(getResponse.data.name).toBe(newProduct.name)
    })

    it('devrait valider les champs obligatoires', async () => {
      await expect(
        $fetch('/api/admin/products', {
          method: 'POST',
          body: {
            // Manque name, category, basePrice, minQuantity, materials, colors, sizes
            description: 'Description seule'
          }
        })
      ).rejects.toThrow()
    })

    it('devrait valider les formats (URLs, hex colors)', async () => {
      await expect(
        $fetch('/api/admin/products', {
          method: 'POST',
          body: {
            name: 'Produit Test',
            category: 'Textile',
            basePrice: 5000,
            minQuantity: 10,
            image: 'INVALID_URL',
            materials: ['Coton'],
            colors: [{ name: 'Rouge', hex: 'INVALID' }],
            sizes: [{ name: 'M' }]
          }
        })
      ).rejects.toThrow()
    })
  })
})
