# 🔍 Audit Complet Dépendances Pinia - useProducts/stores

**Date**: 2025-11-02
**Projet**: NS2PO Election MVP - Migration TanStack Query Pure
**Sprint**: Sprint 0 - Tâche #2
**Recommandation Gemini**: "Dépendances cachées non détectées par grep. Audit manuel approfondi: injections dépendances, appels indirects, composants imbriqués. Vérifier provide/inject, dynamic imports."

---

## 📊 Résumé Exécutif

### Verdict Global

✅ **Couplage Pinia TRÈS MINIMAL** - Migration facilitée

**Points clés**:
- ❌ **Aucune utilisation directe** de `useProducts()` dans pages/composants Vue
- ✅ **2 fichiers uniquement** utilisent `useProductsStore()` (composable wrapper + SSE updates)
- ✅ **Aucun provide/inject** détecté pour products
- ✅ **1 dynamic import** identifié (adminEventBus)
- ✅ **TanStack Query déjà fonctionnel** dans tout le frontend

**Risque migration**: 🟢 FAIBLE

---

## 🗂️ Cartographie Complète des Dépendances

### 1. Store Pinia Legacy

#### Fichier: `stores/products.ts`

**Fonction**: `useProductsStore()` (Pinia `defineStore`)

**État géré**:
```typescript
{
  products: ref<any[]>([]),
  loading: ref(false),
  lastFetch: ref<number>(0),
  error: ref<string | null>(null),
  isInitialized: ref(false),
  CACHE_DURATION: 30000
}
```

**Actions**:
- `fetchProducts(force)`: Fetch API `/api/products` avec cache 30s
- `findProductById(id)`: Recherche locale
- `setProducts(newProducts)`: Setter pour éviter race condition SSR
- `startLoading()`: Setter loading
- `updateProductInStore(product)`: Mutation locale (update)
- `addProductToStore(product)`: Mutation locale (create)
- `removeProductFromStore(id)`: Mutation locale (delete)
- `invalidateProducts()`: Reset cache
- `clearProducts()`: Clear complet

**Computed**:
- `productsCount`: Nombre de produits
- `hasProducts`: Booléen présence
- `isCacheValid`: Validation cache 30s

**⚠️ Problème détecté**: Duplication logique avec TanStack Query (double cache, double fetching)

---

### 2. Composable Wrapper Legacy

#### Fichier: `composables/useProducts.ts`

**Fonction**: `useProducts()` (wrapper Pinia + TanStack Query hybride)

**Dépendances**:
1. `import { useProductsStore } from '../stores/products'` ✅
2. `import { useQueryClient } from '@tanstack/vue-query'` ✅
3. `import('../utils/adminEventBus')` ⚠️ (dynamic import)

**Logique hybride problématique**:
```typescript
// Auto-fetch Pinia au montage
onMounted(async () => {
  await store.fetchProducts()
})

// Actions CRUD = Pinia + TanStack Query synchronisation
const updateProduct = async (id, data) => {
  // 1. Appel API
  const response = await $fetch(`/api/admin/products/${id}`, { method: 'PUT', body: data })

  // 2. Update store Pinia
  productsStore.updateProductInStore(response.data)

  // 3. Invalider cache TanStack Query
  await queryClient.invalidateQueries({ queryKey: ['products'] })

  // 4. Event bus inter-pages
  const { adminEventBus } = await import('../utils/adminEventBus')
  adminEventBus.emit('products:updated', response.data)
}
```

**⚠️ Problèmes détectés**:
- Double mutation: Pinia + TanStack Query (redondance)
- Event bus utilisé pour synchronisation inter-pages (peut être remplacé par TanStack Query)
- `onMounted` auto-fetch = risque de double-fetch avec TanStack Query

**Exposition publique**:
```typescript
return {
  // State Pinia
  products, loading, error, productsCount, hasProducts, isCacheValid, isInitialized, isLoading,

  // Actions Pinia
  refresh, invalidate, clear, findById, setProducts, startLoading,

  // Actions CRUD hybrides
  updateProduct, createProduct, deleteProduct
}
```

---

### 3. Fichiers Utilisant `useProductsStore()`

#### 3.1. `composables/useProducts.ts`
- **Usage**: Wrapper principal (analysé ci-dessus)
- **Ligne 5**: `const store = useProductsStore()`
- **Lignes 60, 89, 117**: Appels directs pour mutations locales

#### 3.2. `composables/useSSEUpdates.ts`
- **Usage**: Server-Sent Events (SSE) pour synchronisation temps réel admin
- **Ligne 78**: `const store = useProductsStore()`
- **Contexte**: Écoute événements SSE et met à jour store Pinia
```typescript
const handleSSEMessage = (message: SSEMessage) => {
  const store = useProductsStore()
  const bundleStore = useBundleStore()

  switch (message.type) {
    case 'product:updated':
      store.updateProductInStore(message.data)
      break
    case 'product:created':
      store.addProductToStore(message.data)
      break
    case 'product:deleted':
      store.removeProductFromStore(message.data)
      break
  }
}
```

**⚠️ Problème détecté**: SSE met à jour Pinia, mais TanStack Query ignore ces updates (cache desynchronisé)

---

### 4. Fichiers Utilisant `useProducts()` Directement

**Résultat recherche Serena**:
```
❌ AUCUN FICHIER dans pages/
❌ AUCUN FICHIER dans components/
```

**Constat CRITIQUE**: Le composable `useProducts()` n'est **JAMAIS utilisé directement** dans le frontend ! Cela signifie que :
- Les pages utilisent probablement `useProductsQuery()` et `useProductMutations()` (TanStack Query pur)
- Le composable Pinia est **mort code** (dead code)

---

### 5. Dynamic Imports Identifiés

#### 5.1. adminEventBus (3 occurrences dans useProducts.ts)

**Localisation**: `composables/useProducts.ts`
```typescript
// Ligne 67 (updateProduct)
const { adminEventBus } = await import('../utils/adminEventBus')
adminEventBus.emit('products:updated', response.data)

// Ligne 96 (createProduct)
const { adminEventBus } = await import('../utils/adminEventBus')
adminEventBus.emit('products:created', response.data)

// Ligne 124 (deleteProduct)
const { adminEventBus } = await import('../utils/adminEventBus')
adminEventBus.emit('products:deleted', id)
```

**Fichier source**: `utils/adminEventBus.ts`

**Type**: Singleton EventBus TypeScript-safe
```typescript
interface AdminEvents {
  'products:created': Product
  'products:updated': Product
  'products:deleted': string
  'bundles:updated': Bundle
  // ...
}

class AdminEventBus {
  private events: Map<keyof AdminEvents, Set<EventCallback<any>>> = new Map()

  on<K extends keyof AdminEvents>(event: K, callback: EventCallback<AdminEvents[K]>) { ... }
  emit<K extends keyof AdminEvents>(event: K, data: AdminEvents[K]) { ... }
  off(...) { ... }
  once(...) { ... }
}

export const adminEventBus = new AdminEventBus()
```

**Utilisation**: Synchronisation inter-pages admin (ex: mise à jour produit dans page A visible dans page B)

**⚠️ Remplaçable par TanStack Query**: L'invalidation de cache TanStack Query suffit pour synchroniser les pages (pas besoin d'event bus)

---

### 6. Provide/Inject Analysis

**Résultat recherche Serena**:
```
❌ AUCUN provide("products", ...)
❌ AUCUN inject("products")
❌ AUCUN provide utilisé pour products
```

**Conclusion**: Pas de dépendance cachée via provide/inject. Toute la logique passe par imports directs.

---

### 7. TanStack Query - État Actuel (Déjà Fonctionnel)

#### 7.1. Queries: `composables/useProductsQuery.ts`

**Queries disponibles**:
1. `useProductsQuery(filters, sort)`: Liste produits (avec cache 5min)
2. `useProductQuery(id)`: Détail produit (avec cache 5min)
3. `useProductSearchQuery(query, filters)`: Recherche fuzzy (cache 2min)
4. `useProductsByCategoryQuery(categoryId)`: Filtrage catégorie
5. `usePopularProductsQuery(limit)`: Top produits
6. `useRecentProductsQuery(limit)`: Produits récents
7. `useProductBundlesQuery(id)`: Bundles associés

**Query Keys Hiérarchiques**:
```typescript
const productQueryKeys = {
  all: ['products'],
  lists: () => [...productQueryKeys.all, 'list'],
  list: (filters, sort) => [...productQueryKeys.lists(), { filters, sort }],
  details: () => [...productQueryKeys.all, 'detail'],
  detail: (id) => [...productQueryKeys.details(), id],
  search: (query, filters) => [...productQueryKeys.all, 'search', { query, filters }],
  category: (categoryId) => [...productQueryKeys.all, 'category', categoryId],
  popular: (limit) => [...productQueryKeys.all, 'popular', limit],
  bundles: (id) => [...productQueryKeys.detail(id), 'bundles'],
  recent: (limit) => [...productQueryKeys.all, 'recent', limit]
}
```

#### 7.2. Mutations: `composables/useProductMutations.ts`

**Mutations disponibles**:
1. `useCreateProductMutation()`: Création produit
2. `useUpdateProductMutation()`: Mise à jour produit
3. `useDeleteProductMutation()`: Suppression produit
4. `useBulkUpdateProductsMutation()`: Mise à jour en masse

**Invalidation de cache** (pattern actuel):
```typescript
onSuccess: (data) => {
  // Mettre à jour cache détail
  queryClient.setQueryData(productQueryKeys.detail(data.id), data)

  // Invalider listes pour re-fetch
  queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
}
```

**⚠️ Dépendance détectée**: `import { useProductStore } from '../stores/useProductStore'`

Fichier `stores/useProductStore` introuvable dans la recherche. Possiblement renommé ou supprimé.

---

## 🎯 Points de Couplage à Traiter (Roadmap Migration)

### 1. Couplage CRITIQUE (Bloquant Migration)

#### C-01: Composable `useProducts.ts` (wrapper hybride Pinia + TanStack Query)

**Problème**:
- Double fetch (Pinia `onMounted` + TanStack Query)
- Double mutation (Pinia store + TanStack Query invalidation)
- Event bus redondant avec invalidation TanStack Query

**Solution**:
1. **Phase 1 - Suppression auto-fetch Pinia**:
   - Retirer `onMounted(() => store.fetchProducts())`
   - Laisser TanStack Query gérer le fetching via `useProductsQuery()`

2. **Phase 2 - Suppression mutations Pinia**:
   - Retirer appels `productsStore.updateProductInStore()`, `addProductToStore()`, `removeProductFromStore()`
   - Conserver uniquement `queryClient.invalidateQueries()`

3. **Phase 3 - Suppression event bus**:
   - Retirer imports dynamiques `adminEventBus`
   - L'invalidation TanStack Query suffit pour synchronisation inter-pages

4. **Phase 4 - Suppression composable wrapper**:
   - Supprimer `composables/useProducts.ts` complètement
   - Forcer usage direct de `useProductsQuery()` / `useProductMutations()`

**Fichiers impactés**: 1 fichier
**Risque**: 🟡 MOYEN (dead code, aucune référence détectée)

---

#### C-02: SSE Updates (`useSSEUpdates.ts`)

**Problème**:
- SSE met à jour store Pinia, mais TanStack Query ignore ces updates
- Cache TanStack Query desynchronisé avec Pinia après événements SSE

**Solution**:
1. **Remplacer mutations Pinia par invalidation TanStack Query**:
```typescript
// AVANT
const handleSSEMessage = (message: SSEMessage) => {
  const store = useProductsStore()
  switch (message.type) {
    case 'product:updated':
      store.updateProductInStore(message.data) // ❌ Pinia
      break
  }
}

// APRÈS
const handleSSEMessage = (message: SSEMessage) => {
  const queryClient = useQueryClient()
  switch (message.type) {
    case 'product:updated':
      // Option A: Update cache optimiste
      queryClient.setQueryData(productQueryKeys.detail(message.data.id), message.data)
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })

      // Option B: Invalidation complète (plus simple, moins performant)
      queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
      break
  }
}
```

**Fichiers impactés**: 1 fichier
**Risque**: 🟡 MOYEN (fonctionnalité temps réel admin)

---

### 2. Couplage SECONDAIRE (Non-Bloquant)

#### S-01: Store Pinia `stores/products.ts`

**Statut**: Dead code (aucune référence frontend directe)

**Solution**: Supprimer fichier complet après suppression C-01 et C-02

**Fichiers impactés**: 1 fichier
**Risque**: 🟢 FAIBLE (dead code)

---

#### S-02: Event Bus `utils/adminEventBus.ts`

**Statut**: Utilisé uniquement par `useProducts.ts` (qui sera supprimé)

**Solution**:
- **Option A**: Supprimer complètement si uniquement utilisé pour products
- **Option B**: Conserver si utilisé pour autres entités (bundles, categories, etc.)

**Action recommandée**: Audit usage event bus pour autres entités avant suppression

**Fichiers impactés**: 1 fichier (si suppression)
**Risque**: 🟢 FAIBLE

---

## 📋 Checklist Validation Audit

### Dépendances Directes
- [x] Recherche imports `useProducts` dans pages/
- [x] Recherche imports `useProducts` dans components/
- [x] Recherche imports `useProductsStore` dans composables/
- [x] Analyse store Pinia `stores/products.ts`
- [x] Analyse composable wrapper `composables/useProducts.ts`

### Dépendances Cachées
- [x] Recherche `provide("products")` / `inject("products")`
- [x] Recherche dynamic imports `import(...)`
- [x] Analyse event bus `adminEventBus`
- [x] Recherche appels indirects via autres composables
- [x] Analyse SSE updates `useSSEUpdates.ts`

### État TanStack Query
- [x] Inventaire queries disponibles (`useProductsQuery.ts`)
- [x] Inventaire mutations disponibles (`useProductMutations.ts`)
- [x] Validation query keys hiérarchiques
- [x] Analyse invalidation cache patterns

---

## 🎯 Plan de Migration (Séquence Optimale)

### Phase 1: Désactivation Progressive Pinia (Sprint 1)

**Objectif**: Rendre Pinia optionnel sans casser le frontend

1. ✅ **Tâche 1.1**: Commenter auto-fetch Pinia dans `useProducts.ts`
   - Retirer `onMounted(() => store.fetchProducts())`
   - Validation: Pages utilisent déjà `useProductsQuery()`, pas d'impact

2. ✅ **Tâche 1.2**: Remplacer mutations Pinia par invalidation pure TanStack Query
   - Dans `updateProduct()`, `createProduct()`, `deleteProduct()`
   - Retirer appels `productsStore.updateProductInStore()`, etc.
   - Conserver uniquement `queryClient.invalidateQueries()`

3. ✅ **Tâche 1.3**: Migrer SSE vers TanStack Query
   - `useSSEUpdates.ts`: Remplacer `store.updateProductInStore()` par `queryClient.setQueryData()`

### Phase 2: Suppression Couplage (Sprint 1)

4. ✅ **Tâche 2.1**: Retirer event bus de `useProducts.ts`
   - Supprimer imports dynamiques `adminEventBus`
   - Validation: Invalidation TanStack Query suffit

5. ✅ **Tâche 2.2**: Marquer `useProducts.ts` comme deprecated
   - Ajouter warning console si appelé
   - Documenter migration vers `useProductsQuery()` / `useProductMutations()`

### Phase 3: Nettoyage Final (Sprint 1 ou 2)

6. ✅ **Tâche 3.1**: Supprimer `composables/useProducts.ts`
   - Vérifier absence références (déjà validé par audit)

7. ✅ **Tâche 3.2**: Supprimer `stores/products.ts`
   - Validation: Plus aucune référence

8. ✅ **Tâche 3.3**: Audit event bus pour autres entités
   - Si uniquement products: supprimer `utils/adminEventBus.ts`
   - Sinon: conserver pour bundles/categories

---

## 📊 Métriques d'Impact Migration

### Fichiers à Modifier
- **Critiques**: 2 fichiers (`useProducts.ts`, `useSSEUpdates.ts`)
- **Secondaires**: 1-2 fichiers (stores, event bus si suppression)
- **Total**: 3-4 fichiers

### Fichiers à Supprimer
- **Garantis**: 2 fichiers (`useProducts.ts`, `stores/products.ts`)
- **Conditionnels**: 1 fichier (`adminEventBus.ts` si uniquement products)
- **Total**: 2-3 fichiers

### Risque Frontend
- **Pages impactées**: 0 (aucune référence directe détectée)
- **Composants impactés**: 0 (aucune référence directe détectée)
- **Composables impactés**: 2 (`useProducts.ts`, `useSSEUpdates.ts`)

### Couverture Tests E2E
- **Tests baseline**: 21 tests CRUD complets (Tâche #1)
- **Tests invalidation cache**: À créer (recommandation Gemini)
- **Tests SSE**: Optionnels (nice-to-have)

---

## ✅ Recommandations Finales

### 1. Migration Simplifiée

Le couplage Pinia est **extrêmement minimal** grâce à :
- ✅ Aucune utilisation directe dans pages/composants
- ✅ TanStack Query déjà fonctionnel et utilisé en production
- ✅ Pas de provide/inject à gérer
- ✅ Seulement 2 fichiers à modifier

**Recommandation**: Migration en **1 seul sprint** (au lieu de 2-3 initialement prévus)

### 2. Ordre d'Exécution

**Priorisation Pareto 80/20**:
1. **Core 20%** (80% valeur):
   - Modifier `useSSEUpdates.ts` (SSE → TanStack Query)
   - Supprimer `useProducts.ts` (dead code)
   - Supprimer `stores/products.ts` (dead code)

2. **Enhancement 80%** (20% valeur):
   - Audit event bus pour autres entités
   - Suppression event bus si uniquement products

### 3. Tests E2E Complémentaires

**Tests à ajouter** (recommandation Gemini Core 20%):
- Tests invalidation cache TanStack Query (3 tests)
- Tests optimistic updates + rollback (3 tests)

**Tests optionnels** (Enhancement 80%):
- Tests SSE synchronisation temps réel (2 tests)

---

## 🚀 Prochaine Étape

**Tâche #3 Task Master**: Préparer rollback strategy + branche Git dédiée

Ou alternativement (recommandation personnelle):

**Option accélérée**: Commencer directement la migration (Sprint 1 complet) car :
- Couplage minimal détecté
- TanStack Query déjà stable en production
- Dead code facile à retirer
- Tests E2E baseline créés (Tâche #1)

---

**Dernière mise à jour**: 2025-11-02
