/**
 * Composable pour la gestion des produits
 * Utilise Turso (cache performant) + fallback Airtable
 * Structure Cloudinary: ns2po-w/products/
 */

import { ref, computed, readonly } from 'vue'
import type { Product, Category } from '@ns2po/types'

export const useProducts = () => {
  // État reactif
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Charge tous les produits depuis Turso (cache performant)
   */
  const loadProducts = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await $fetch<{ data: Product[] }>('/api/products/turso')
      products.value = data
    } catch (err) {
      error.value = 'Erreur lors du chargement des produits'
      console.error('Erreur loadProducts:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge les catégories depuis Airtable
   */
  const loadCategories = async () => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await $fetch<{ data: Category[] }>('/api/categories')
      categories.value = data
    } catch (err) {
      error.value = 'Erreur lors du chargement des catégories'
      console.error('Erreur loadCategories:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Recherche des produits par terme
   */
  const searchProducts = async (query: string): Promise<Product[]> => {
    if (!query.trim()) return []
    
    loading.value = true
    error.value = null
    
    try {
      const { data } = await $fetch<{ data: Product[] }>(`/api/products/search`, {
        query: { q: query }
      })
      return data
    } catch (err) {
      error.value = 'Erreur lors de la recherche'
      console.error('Erreur searchProducts:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère un produit par ID
   */
  const getProduct = async (id: string): Promise<Product | null> => {
    loading.value = true
    error.value = null
    
    try {
      const { data } = await $fetch<{ data: Product }>(`/api/products/${id}`)
      return data
    } catch (err) {
      error.value = 'Produit non trouvé'
      console.error('Erreur getProduct:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Filtre les produits par catégorie
   */
  const getProductsByCategory = computed(() => {
    return (categorySlug: string) => {
      return products.value.filter(product => 
        product.category === categorySlug && product.isActive
      )
    }
  })

  /**
   * Produits actifs uniquement
   */
  const activeProducts = computed(() => {
    return products.value.filter(product => product.isActive)
  })

  /**
   * Catégories actives uniquement
   */
  const activeCategories = computed(() => {
    return categories.value.filter(category => category.isActive)
  })

  return {
    // État
    products: readonly(products),
    categories: readonly(categories),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    activeProducts,
    activeCategories,
    getProductsByCategory,
    
    // Méthodes
    loadProducts,
    loadCategories,
    searchProducts,
    getProduct
  }
}