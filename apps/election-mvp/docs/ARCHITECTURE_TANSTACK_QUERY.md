# Architecture TanStack Query - NS2PO Election MVP

**Version**: 1.0.0
**Date**: 2025-11-02
**Stack**: Nuxt 3 + Vue 3 Composition API + TanStack Query v5

---

## 📋 Table des Matières

1. [Principes Architecturaux](#principes-architecturaux)
2. [Séparation Server State vs UI State](#séparation-server-state-vs-ui-state)
3. [Query Keys Hiérarchiques](#query-keys-hiérarchiques)
4. [Patterns Queries](#patterns-queries)
5. [Patterns Mutations](#patterns-mutations)
6. [Optimistic Updates](#optimistic-updates)
7. [Invalidation Sélective](#invalidation-sélective)
8. [Migration Guide](#migration-guide)
9. [Best Practices](#best-practices)

---

## 🎯 Principes Architecturaux

### Single Source of Truth

**TanStack Query = Cache Serveur Unique**

```typescript
// ✅ CORRECT - TanStack Query gère server state
const { data: products } = useProductsQuery()

// ❌ INCORRECT - Pinia pour server state (DEPRECATED)
const productStore = useProductStore()
const products = productStore.products
```

### Séparation des Responsabilités

| State Type      | Technologie       | Exemple                                    |
| --------------- | ----------------- | ------------------------------------------ |
| **Server State** | TanStack Query   | Products, Bundles, Categories (API data)  |
| **UI State**     | Vue Composables   | selectedBundle, isModalOpen, currentTab    |
| **Global State** | Pinia (minimal)   | user session, theme, i18n (NON server data)|

---

## 🔀 Séparation Server State vs UI State

### Server State (TanStack Query)

**Caractéristiques**:
- Provient d'une API/Backend
- Peut devenir obsolète (stale)
- Nécessite synchronisation avec serveur
- Partagé entre utilisateurs

**Exemples**:
```typescript
// composables/useProductsQuery.ts
export function useProductsQuery() {
  return useQuery({
    queryKey: productQueryKeys.list(),
    queryFn: () => $fetch('/api/products'),
    staleTime: 5 * 60 * 1000 // 5min
  })
}
```

### UI State (Vue Composables)

**Caractéristiques**:
- Local à l'application client
- Ne nécessite PAS synchronisation serveur
- Spécifique à un utilisateur/session
- Volatile (reset au refresh)

**Exemples**:
```typescript
// composables/useBundleUIState.ts
const selectedBundle = ref<Bundle | null>(null) // Singleton

export function useBundleUIState() {
  const selectBundle = (bundle: Bundle | null) => {
    selectedBundle.value = bundle
  }

  return { selectedBundle, selectBundle }
}
```

**❌ NE PAS UTILISER Pinia pour UI State** - Composables suffisent et sont plus simples

---

## 🔑 Query Keys Hiérarchiques

### Principes

**Query Keys = Identifiants Cache Uniques**

- **Hiérarchiques**: Structure en arbre
- **Déterministes**: Mêmes params → même key
- **Typés**: TypeScript strict

### Structure Recommandée

```typescript
// composables/useProductsQuery.ts
export const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...productQueryKeys.lists(), filters] as const,
  details: () => [...productQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...productQueryKeys.details(), id] as const,
  bundles: (id: string) => [...productQueryKeys.detail(id), 'bundles'] as const,
  search: (query: string) => [...productQueryKeys.all, 'search', query] as const
}
```

**Exemples de Query Keys générées**:
```typescript
['products']                           // All products queries
['products', 'list']                   // Products list (no filters)
['products', 'list', { category: 5 }]  // Products list (with filters)
['products', 'detail', '123']          // Product detail #123
['products', 'detail', '123', 'bundles'] // Bundles for product #123
['products', 'search', 'tshirt']       // Search results for "tshirt"
```

### Avantages

1. **Invalidation ciblée**: Invalider seulement les queries concernées
2. **Pré-population**: Peupler le cache detail depuis list
3. **Debugging**: Console logs lisibles
4. **Type safety**: Autocomplete TypeScript

---

## 📥 Patterns Queries

### Query Simple

```typescript
export function useProductsQuery(
  options?: UseQueryOptions<Product[], Error>
) {
  return useQuery({
    queryKey: productQueryKeys.list(),
    queryFn: async (): Promise<Product[]> => {
      const response = await $fetch<{ success: boolean; data: Product[] }>('/api/products')
      if (!response.success) throw new Error('Failed to fetch products')
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes (anciennement cacheTime)
    ...options
  })
}
```

### Query avec Paramètres Dynamiques

```typescript
export function useProductQuery(
  id: Ref<string> | string,
  options?: UseQueryOptions<Product | null, Error>
) {
  const idRef = isRef(id) ? id : ref(id)

  return useQuery({
    queryKey: computed(() => productQueryKeys.detail(idRef.value)),
    queryFn: async (): Promise<Product | null> => {
      if (!idRef.value) return null
      const response = await $fetch<{ success: boolean; data: Product }>(`/api/products/${idRef.value}`)
      return response.data
    },
    enabled: computed(() => !!idRef.value), // Ne lance pas si ID vide
    staleTime: 10 * 60 * 1000,
    ...options
  })
}
```

### Query avec Filtres

```typescript
export function useProductsQuery(
  filters: Ref<ProductFilters>,
  options?: UseQueryOptions<Product[], Error>
) {
  return useQuery({
    queryKey: computed(() => productQueryKeys.list(filters.value)),
    queryFn: async () => {
      const response = await $fetch('/api/products', {
        params: filters.value
      })
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2min (changent fréquemment)
    ...options
  })
}
```

---

## ✍️ Patterns Mutations

### Create Mutation (avec Optimistic Update)

```typescript
export function useCreateProductMutation(
  options?: UseMutationOptions<Product, Error, Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData): Promise<Product> => {
      const response = await $fetch('/api/products', {
        method: 'POST',
        body: productData
      })
      return response.data
    },

    onMutate: async (variables) => {
      // 1. Cancel outgoing queries (éviter race conditions)
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() })

      // 2. Snapshot previous state (pour rollback)
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // 3. Optimistic update (UI instantanée)
      const optimisticProduct: Product = {
        id: `temp-${Date.now()}`, // ID temporaire
        ...variables,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) => [
        optimisticProduct,
        ...old
      ])

      return { previousProducts, optimisticProduct }
    },

    onError: (error, variables, context) => {
      // Rollback optimistic update si erreur
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },

    onSuccess: (data, variables, context) => {
      // 1. Invalidation ciblée (re-fetch listes)
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.lists(),
        exact: false // Invalide toutes variantes (avec/sans filtres)
      })

      // 2. Pre-populate detail cache (accès instantané)
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)

      // 3. Replace optimistic update avec real data
      if (context?.optimisticProduct) {
        queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
          old.map(product =>
            product.id === context.optimisticProduct.id ? data : product
          )
        )
      }

      // 4. Navigation automatique (optionnel)
      navigateTo(`/admin/products/${data.id}`)
    },

    ...options
  })
}
```

### Update Mutation

```typescript
export function useUpdateProductMutation(
  options?: UseMutationOptions<Product, Error, { id: string; updates: Partial<Product> }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const response = await $fetch(`/api/products/${id}`, {
        method: 'PUT',
        body: updates
      })
      return response.data
    },

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: productQueryKeys.detail(id) })
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() })

      const previousProduct = queryClient.getQueryData(productQueryKeys.detail(id))
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // Optimistic update detail
      queryClient.setQueryData(productQueryKeys.detail(id), (old: Product | undefined) =>
        old ? { ...old, ...updates, updatedAt: new Date().toISOString() } : undefined
      )

      // Optimistic update list
      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
        old.map(product =>
          product.id === id ? { ...product, ...updates, updatedAt: new Date().toISOString() } : product
        )
      )

      return { previousProduct, previousProducts, id, updates }
    },

    onError: (error, variables, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(productQueryKeys.detail(context.id), context.previousProduct)
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },

    onSuccess: (data) => {
      // Update direct (pas invalidation pour éviter re-fetch inutile)
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)

      // Invalidation listes seulement (en cas de changements affichage)
      queryClient.invalidateQueries({
        queryKey: productQueryKeys.lists(),
        exact: false
      })
    },

    ...options
  })
}
```

### Delete Mutation

```typescript
export function useDeleteProductMutation(
  options?: UseMutationOptions<boolean, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await $fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })
      return response.success
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: productQueryKeys.all })

      const previousProduct = queryClient.getQueryData(productQueryKeys.detail(id))
      const previousProducts = queryClient.getQueryData(productQueryKeys.list())

      // Optimistic removal
      queryClient.setQueryData(productQueryKeys.list(), (old: Product[] = []) =>
        old.filter(product => product.id !== id)
      )

      return { previousProduct, previousProducts, id }
    },

    onError: (error, id, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
      }
    },

    onSuccess: (success, id) => {
      if (success) {
        // Remove detail cache (exact match)
        queryClient.removeQueries({ queryKey: productQueryKeys.detail(id), exact: true })

        // Invalidation listes
        queryClient.invalidateQueries({
          queryKey: productQueryKeys.lists(),
          exact: false
        })
      }
    },

    ...options
  })
}
```

---

## ⚡ Optimistic Updates

### Principe

**Mise à jour UI instantanée AVANT réponse serveur**

1. **Snapshot** état actuel (rollback si erreur)
2. **Update** cache optimistiquement (UI réactive)
3. **Await** réponse serveur
4. **Replace** optimistic avec real data OU **Rollback** si erreur

### Cas d'Usage

**✅ TOUJOURS pour**:
- Create (ajout produit → apparaît instantanément)
- Update (modification prix → changement visible immédiat)
- Delete (suppression → disparaît instantanément)

**❌ JAMAIS pour**:
- Bulk operations complexes (risque rollback massif)
- Operations avec side-effects critiques (paiement, email)

### Pattern Type-Safe

```typescript
interface CreateMutationContext {
  previousProducts: Product[] | undefined
  optimisticProduct: Product
}

useMutation<Product, Error, CreateData, CreateMutationContext>({
  onMutate: async (variables): Promise<CreateMutationContext> => {
    // Return typed context
    return {
      previousProducts: queryClient.getQueryData(productQueryKeys.list()),
      optimisticProduct: { id: `temp-${Date.now()}`, ...variables }
    }
  },
  onError: (error, variables, context) => {
    // context is typed!
    if (context?.previousProducts) {
      queryClient.setQueryData(productQueryKeys.list(), context.previousProducts)
    }
  }
})
```

---

## 🎯 Invalidation Sélective

### Principes

**Invalider seulement les queries concernées** (éviter sur-invalidation)

### Patterns

#### 1. Invalidation Exacte

```typescript
// Invalide UNIQUEMENT ['products', 'detail', '123']
queryClient.invalidateQueries({
  queryKey: productQueryKeys.detail('123'),
  exact: true
})
```

#### 2. Invalidation Prefix (Partial Matching)

```typescript
// Invalide TOUTES les queries qui commencent par ['products', 'list']
// Ex: ['products', 'list'], ['products', 'list', { category: 5 }], etc.
queryClient.invalidateQueries({
  queryKey: productQueryKeys.lists(),
  exact: false // Default
})
```

#### 3. Invalidation Prédicate

```typescript
// Invalide queries selon condition custom
queryClient.invalidateQueries({
  queryKey: productQueryKeys.all,
  predicate: (query) =>
    query.queryKey.includes('search') ||
    query.queryKey.includes('category') ||
    query.queryKey.includes('popular')
})
```

### Matrix Invalidation

| Mutation      | Invalider                                  | Pourquoi                                     |
| ------------- | ------------------------------------------ | -------------------------------------------- |
| **Create**    | `lists()` (toutes variantes)               | Nouvelle entrée affecte toutes listes        |
| **Update**    | `lists()` + detail spécifique              | Modification peut affecter ordre/filtres     |
| **Delete**    | `lists()` + remove detail                  | Suppression affecte listes                   |
| **Bulk**      | `lists()` + details individuels            | Multiples entrées modifiées                  |

---

## 📚 Migration Guide

### Étape 1: Créer Query Keys

```typescript
// composables/useNewFeatureQuery.ts
export const newFeatureQueryKeys = {
  all: ['new-feature'] as const,
  lists: () => [...newFeatureQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...newFeatureQueryKeys.all, 'detail', id] as const
}
```

### Étape 2: Créer Queries

```typescript
export function useNewFeaturesQuery() {
  return useQuery({
    queryKey: newFeatureQueryKeys.lists(),
    queryFn: async () => {
      const response = await $fetch('/api/new-features')
      return response.data
    },
    staleTime: 5 * 60 * 1000
  })
}
```

### Étape 3: Créer Mutations

```typescript
// composables/useNewFeatureMutations.ts
export function useCreateNewFeatureMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const response = await $fetch('/api/new-features', {
        method: 'POST',
        body: data
      })
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: newFeatureQueryKeys.lists() })
      queryClient.setQueryData(newFeatureQueryKeys.detail(data.id), data)
    }
  })
}
```

### Étape 4: Utiliser dans Pages/Components

```vue
<script setup lang="ts">
// pages/admin/new-features/index.vue
const { data: features, isLoading } = useNewFeaturesQuery()
const createMutation = useCreateNewFeatureMutation()

const handleCreate = async (formData) => {
  await createMutation.mutateAsync(formData)
  // UI updated automatically!
}
</script>
```

### Étape 5: UI State (si nécessaire)

```typescript
// composables/useNewFeatureUIState.ts
const selectedFeature = ref<Feature | null>(null)

export function useNewFeatureUIState() {
  const selectFeature = (feature: Feature | null) => {
    selectedFeature.value = feature
  }

  return { selectedFeature, selectFeature }
}
```

---

## ✅ Best Practices

### 1. Nommage Cohérent

```typescript
// ✅ CORRECT
useProductsQuery()       // Liste
useProductQuery(id)      // Détail
useCreateProductMutation()
useUpdateProductMutation()
useDeleteProductMutation()

// ❌ INCORRECT
getProducts()            // Pas de "get"
fetchProduct()           // Pas de "fetch"
createProduct()          // Pas de "Mutation" → confusion avec API call
```

### 2. Stale Time Adapté

```typescript
// Fast-changing data (search, filters)
staleTime: 30 * 1000 // 30 seconds

// Normal data (products, categories)
staleTime: 5 * 60 * 1000 // 5 minutes

// Slow-changing data (settings, config)
staleTime: 30 * 60 * 1000 // 30 minutes
```

### 3. Invalidation > Refetch Manual

```typescript
// ✅ CORRECT - Invalidation automatique
queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })

// ❌ INCORRECT - Refetch manuel
queryClient.refetchQueries({ queryKey: productQueryKeys.list() })
```

### 4. Pre-Population Cache

```typescript
// Après create/update, populate detail cache
onSuccess: (data) => {
  queryClient.setQueryData(productQueryKeys.detail(data.id), data)
  // Accès instantané au detail sans re-fetch!
}
```

### 5. Error Handling

```typescript
const { data, error, isLoading, isError } = useProductsQuery()

// Dans template
if (isError) {
  // Afficher message erreur
  console.error('Failed to load products:', error)
}
```

### 6. Loading States

```typescript
const { data, isLoading, isFetching } = useProductsQuery()

// isLoading: First load (no cached data)
// isFetching: Background refetch (cached data displayed)
```

---

## 🔗 Ressources

**Documentation Officielle**: [tanstack.com/query/latest/docs/vue](https://tanstack.com/query/latest/docs/vue)

**Exemples Projet**:
- `composables/useProductsQuery.ts` - Queries + mutations complètes
- `composables/useBundlesQuery.ts` - Patterns avancés (optimistic updates)
- `composables/useCategoriesQuery.ts` - Pattern simple

**Migration Audit**: `MIGRATION_FINAL_AUDIT.md`

---

**Dernière mise à jour**: 2025-11-02
**Auteur**: NS2PO-Architect (Claude Sonnet 4.5)
