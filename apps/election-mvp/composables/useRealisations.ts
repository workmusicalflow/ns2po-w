import type { Realisation, RealisationPreview } from '@ns2po/types'

interface EnrichedRealisation extends Realisation {
  readonly cloudinaryUrls?: readonly string[]
}

interface RealisationsState {
  realisations: EnrichedRealisation[]
  featured: EnrichedRealisation[]
  loading: boolean
  error: string | null
  lastFetch: number | null
}

const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

export const useRealisations = () => {
  const state = useState<RealisationsState>('realisations', () => ({
    realisations: [],
    featured: [],
    loading: false,
    error: null,
    lastFetch: null
  }))

  // Utiliser useLazyFetch pour un chargement SSR/client optimal
  const { data, pending, error: fetchError, refresh } = useLazyFetch<EnrichedRealisation[]>(
    '/api/realisations',
    {
      key: 'realisations',
      default: () => [],
      transform: (data: EnrichedRealisation[]) => {
        // Mettre à jour l'état global
        state.value.realisations = data
        state.value.featured = data.filter((r: EnrichedRealisation) => r.isFeatured)
        state.value.lastFetch = Date.now()
        state.value.loading = false
        if (fetchError.value) {
          state.value.error = 'Impossible de charger les réalisations'
        } else {
          state.value.error = null
        }
        return data
      }
    }
  )

  // Synchroniser l'état de chargement
  watch(pending, (newPending) => {
    state.value.loading = newPending
  }, { immediate: true })

  /**
   * Récupère toutes les réalisations depuis l'API (pour compatibilité)
   */
  const fetchRealisations = async (force = false): Promise<void> => {
    // Vérification du cache
    if (!force && state.value.lastFetch && state.value.realisations.length > 0) {
      const timeSinceLastFetch = Date.now() - state.value.lastFetch
      if (timeSinceLastFetch < CACHE_DURATION) {
        return
      }
    }

    await refresh()
  }

  /**
   * Récupère une réalisation par son ID
   */
  const getRealisationById = async (id: string): Promise<EnrichedRealisation | null> => {
    // D'abord essayer dans le cache
    const cached = state.value.realisations.find(r => r.id === id)
    if (cached) return cached

    // Sinon charger toutes les réalisations
    if (state.value.realisations.length === 0) {
      await fetchRealisations()
      return state.value.realisations.find(r => r.id === id) || null
    }

    return null
  }

  /**
   * Filtre les réalisations par catégories de produits
   */
  const getRealisationsByCategories = (categoryIds: string[]): EnrichedRealisation[] => {
    return state.value.realisations.filter(realisation =>
      realisation.categoryIds.some(catId => categoryIds.includes(catId))
    )
  }

  /**
   * Filtre les réalisations par produits
   */
  const getRealisationsByProducts = (productIds: string[]): EnrichedRealisation[] => {
    return state.value.realisations.filter(realisation =>
      realisation.productIds.some(prodId => productIds.includes(prodId))
    )
  }

  /**
   * Recherche de réalisations par tags ou titre
   */
  const searchRealisations = (query: string): EnrichedRealisation[] => {
    if (!query.trim()) return state.value.realisations

    const searchTerm = query.toLowerCase().trim()
    
    return state.value.realisations.filter(realisation =>
      realisation.title.toLowerCase().includes(searchTerm) ||
      realisation.description?.toLowerCase().includes(searchTerm) ||
      realisation.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  /**
   * Génère des réalisations similaires basées sur les tags et catégories
   */
  const getSimilarRealisations = (realisationId: string, limit = 4): EnrichedRealisation[] => {
    const currentRealisation = state.value.realisations.find(r => r.id === realisationId)
    if (!currentRealisation) return []

    // Score de similitude basé sur les tags et catégories communes
    const scoredRealisations = state.value.realisations
      .filter(r => r.id !== realisationId && r.isActive)
      .map(realisation => {
        let score = 0
        
        // Score basé sur les tags communs
        const commonTags = realisation.tags.filter(tag => 
          currentRealisation.tags.includes(tag)
        )
        score += commonTags.length * 3

        // Score basé sur les catégories communes
        const commonCategories = realisation.categoryIds.filter(catId => 
          currentRealisation.categoryIds.includes(catId)
        )
        score += commonCategories.length * 2

        // Score basé sur les produits communs
        const commonProducts = realisation.productIds.filter(prodId => 
          currentRealisation.productIds.includes(prodId)
        )
        score += commonProducts.length * 1

        return { realisation, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.realisation)

    return scoredRealisations
  }

  /**
   * Convertit une réalisation en preview (pour les listes)
   */
  const toRealisationPreview = (realisation: EnrichedRealisation): RealisationPreview => ({
    id: realisation.id,
    title: realisation.title,
    cloudinaryPublicId: realisation.cloudinaryPublicIds[0] || '',
    productIds: realisation.productIds,
    tags: realisation.tags,
    isFeatured: realisation.isFeatured
  })

  /**
   * Obtient une réalisation par son ID (alias pour getRealisationById)
   */
  const getRealisation = async (id: string): Promise<EnrichedRealisation | null> => {
    return await getRealisationById(id)
  }

  /**
   * Génère des suggestions d'inspiration basées sur un produit et contexte
   */
  const getInspirationSuggestions = (
    productId: string | null,
    categoryId: string,
    tags: string[],
    limit = 3
  ): EnrichedRealisation[] => {
    let suggestions = state.value.realisations
      .filter(r => r.isActive && r.id !== state.value.realisations[0]?.id) // Exclure la réalisation actuelle

    // Si on a un produit spécifique, prioriser les réalisations avec ce produit
    if (productId) {
      const withProduct = suggestions.filter(r => r.productIds.includes(productId))
      const withoutProduct = suggestions.filter(r => !r.productIds.includes(productId))
      suggestions = [...withProduct, ...withoutProduct]
    }

    // Score de pertinence basé sur catégorie et tags
    const scoredSuggestions = suggestions.map(realisation => {
      let score = 0
      
      // Score par catégorie commune
      if (realisation.categoryIds.includes(categoryId)) {
        score += 5
      }
      
      // Score par tags communs
      const commonTags = realisation.tags.filter(tag => tags.includes(tag))
      score += commonTags.length * 2
      
      // Bonus pour les réalisations en vedette
      if (realisation.isFeatured) {
        score += 1
      }
      
      return { realisation, score }
    })

    return scoredSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.realisation)
  }

  /**
   * Rafraîchit le cache des réalisations
   */
  const refreshRealisations = async (): Promise<void> => {
    await fetchRealisations(true)
  }

  // Computed properties
  const hasRealisations = computed(() => state.value.realisations.length > 0)
  const featuredCount = computed(() => state.value.featured.length)
  const totalCount = computed(() => state.value.realisations.length)


  return {
    // State
    realisations: computed(() => state.value.realisations),
    featured: computed(() => state.value.featured),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),

    // Computed
    hasRealisations,
    featuredCount,
    totalCount,

    // Methods
    fetchRealisations,
    refreshRealisations,
    getRealisationById,
    getRealisationsByCategories,
    getRealisationsByProducts,
    searchRealisations,
    getSimilarRealisations,
    toRealisationPreview
  }
}

/**
 * Version simplifiée pour les composants qui n'ont besoin que des données
 */
export const useRealisationsData = () => {
  const { realisations, featured, loading, error } = useRealisations()
  
  return {
    realisations,
    featured,
    loading,
    error
  }
}