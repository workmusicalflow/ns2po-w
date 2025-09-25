export const useProductsStore = defineStore('products', () => {
  const products = ref<any[]>([])
  const loading = ref(false)
  const lastFetch = ref<number>(0)
  const error = ref<string | null>(null)
  const isInitialized = ref(false) // État d'initialisation pour éviter FOEC

  // Cache de 30 secondes comme recommandé par Perplexity
  const CACHE_DURATION = 30000

  const fetchProducts = async (force = false) => {
    const now = Date.now()

    // Cache valide et données existantes, pas besoin de refetch
    if (!force && now - lastFetch.value < CACHE_DURATION && products.value.length > 0) {
      return products.value
    }

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<any>('/api/products')

      if (response.success && response.data) {
        products.value = response.data
        lastFetch.value = now
        return response.data
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des produits')
      }
    } catch (err: any) {
      error.value = err.message || 'Erreur réseau'
      console.error('Store products fetchProducts error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const findProductById = (id: string): any | undefined => {
    return products.value.find((product: any) => product.id === id)
  }

  // Action pour initialiser les produits (évite race condition SSR + FOEC)
  const setProducts = (newProducts: any[]) => {
    products.value = newProducts
    lastFetch.value = Date.now()
    isInitialized.value = true // Marquer comme initialisé
    loading.value = false
  }

  const startLoading = () => {
    loading.value = true
  }

  const updateProductInStore = (updatedProduct: any) => {
    const index = products.value.findIndex((p: any) => p.id === updatedProduct.id)
    if (index !== -1) {
      products.value[index] = updatedProduct
    }
  }

  const addProductToStore = (newProduct: any) => {
    products.value.unshift(newProduct)
  }

  const removeProductFromStore = (productId: string) => {
    const index = products.value.findIndex((p: any) => p.id === productId)
    if (index !== -1) {
      products.value.splice(index, 1)
    }
  }

  const invalidateProducts = () => {
    lastFetch.value = 0
    error.value = null
  }

  const clearProducts = () => {
    products.value = []
    lastFetch.value = 0
    error.value = null
  }

  // Computed getters
  const productsCount = computed(() => products.value.length)
  const hasProducts = computed(() => products.value.length > 0)
  const isCacheValid = computed(() => {
    return Date.now() - lastFetch.value < CACHE_DURATION
  })

  return {
    // State (éviter mutations directes par convention)
    products,
    loading,
    error,
    lastFetch,
    isInitialized, // Nouvel état pour UX

    // Computed
    productsCount,
    hasProducts,
    isCacheValid,

    // Actions
    fetchProducts,
    findProductById,
    setProducts, // Nouvelle action pour éviter race condition
    startLoading, // Action pour démarrer loading
    updateProductInStore,
    addProductToStore,
    removeProductFromStore,
    invalidateProducts,
    clearProducts
  }
})