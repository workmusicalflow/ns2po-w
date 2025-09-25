import { useProductsStore } from '../stores/products'

export const useProducts = () => {
  const store = useProductsStore()

  // Utilisation de storeToRefs pour la réactivité correcte
  const { products, loading, error, productsCount, hasProducts, isCacheValid, isInitialized } = storeToRefs(store)

  // État de loading unifié pour éviter FOEC
  const isLoading = computed(() => {
    // Pendant l'hydratation initiale
    if (!isInitialized.value) return true
    // Pendant les requêtes ultérieures
    return loading.value
  })

  // Auto-fetch au montage du composant
  onMounted(async () => {
    try {
      await store.fetchProducts()
    } catch (error) {
      console.error('useProducts onMounted fetch error:', error)
    }
  })

  // Méthodes d'interaction avec le store
  const refresh = async (force = true) => {
    try {
      return await store.fetchProducts(force)
    } catch (error) {
      console.error('useProducts refresh error:', error)
      throw error
    }
  }

  const invalidate = () => {
    store.invalidateProducts()
  }

  const clear = () => {
    store.clearProducts()
  }

  const findById = (id: string): any | undefined => {
    return store.findProductById(id)
  }

  // Actions CRUD avec synchronisation automatique
  const updateProduct = async (id: string, data: any) => {
    try {
      const response = await $fetch<{ success: boolean; data: any }>(`/api/products/${id}`, {
        method: 'PUT',
        body: data
      })

      if (response.success && response.data) {
        // Mettre à jour le store local
        store.updateProductInStore(response.data)

        // Émettre l'événement pour synchronisation inter-pages
        const { adminEventBus } = await import('../utils/adminEventBus')
        adminEventBus.emit('products:updated', response.data)

        return response.data
      } else {
        throw new Error('Erreur lors de la mise à jour du produit')
      }
    } catch (error) {
      console.error('useProducts updateProduct error:', error)
      throw error
    }
  }

  const createProduct = async (data: any) => {
    try {
      const response = await $fetch<{ success: boolean; data: any }>('/api/products', {
        method: 'POST',
        body: data
      })

      if (response.success && response.data) {
        // Ajouter au store local
        store.addProductToStore(response.data)

        // Émettre l'événement
        const { adminEventBus } = await import('../utils/adminEventBus')
        adminEventBus.emit('products:created', response.data)

        return response.data
      } else {
        throw new Error('Erreur lors de la création du produit')
      }
    } catch (error) {
      console.error('useProducts createProduct error:', error)
      throw error
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const response = await $fetch<{ success: boolean }>(`/api/products/${id}`, {
        method: 'DELETE'
      })

      if (response.success) {
        // Supprimer du store local
        store.removeProductFromStore(id)

        // Émettre l'événement
        const { adminEventBus } = await import('../utils/adminEventBus')
        adminEventBus.emit('products:deleted', id)

        return true
      } else {
        throw new Error('Erreur lors de la suppression du produit')
      }
    } catch (error) {
      console.error('useProducts deleteProduct error:', error)
      throw error
    }
  }

  return {
    // State réactif via storeToRefs (évite race conditions)
    products,
    loading,
    error,
    productsCount,
    hasProducts,
    isCacheValid,
    isInitialized,
    isLoading, // État de loading unifié pour UX

    // Actions
    refresh,
    invalidate,
    clear,
    findById,
    setProducts: store.setProducts, // Nouvelle action sécurisée
    startLoading: store.startLoading, // Action pour démarrer loading

    // CRUD avec synchronisation
    updateProduct,
    createProduct,
    deleteProduct
  }
}