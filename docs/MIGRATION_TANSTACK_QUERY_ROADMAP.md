# 🚀 Roadmap Migration TanStack Query Pure - Validée par Experts

**Projet**: Migration TanStack Query Pure
**Date création**: 2025-11-02
**Validation**: Gemini Copilot (69s analyse approfondie)
**Status**: ✅ PLAN VALIDÉ - Prêt pour exécution

---

## 📊 RÉSUMÉ EXÉCUTIF

### Problème Actuel
- **Architecture Hybride Fragile**: Pinia + TanStack Query pour MÊME server state
- **Bug Production Critique**: `TypeError: v(...).updateProductInStore is not a function`
- **Duplication Cache**: ~1155 lignes code gestion état Pinia
- **Synchronisation Manuelle**: Invalidation Vue Query après mutations Pinia

### Solution Validée
**Migration complète vers TanStack Query pure** pour server state, Pinia/Composables uniquement pour UI state.

### Bénéfices Attendus
- ✅ **-955 lignes code** (~82% réduction gestion état server)
- ✅ **Zéro duplication cache**
- ✅ **Performance 3G** optimisée (optimistic updates natifs)
- ✅ **Architecture claire** (server state = TanStack, UI state = composables)
- ✅ **Maintenabilité** améliorée (patterns standard 2025)

---

## 🎯 VALIDATION GEMINI COPILOT

### ✅ Validations Architecturales
1. **Architecture TanStack Query pure**: "Excellente décision" ✅
2. **Query keys hiérarchiques**: "Pattern standard et optimal" ✅
3. **Optimistic updates**: "Significativement meilleurs pour 3G" ✅
4. **setQueryData + invalidateQueries**: "Non redondant, pattern recommandé" ✅
5. **useBundleUIState composable**: "Excellente approche" ✅

### 🚨 Risques Identifiés
**Sprint 1 - Risque ÉLEVÉ**:
- Dépendances cachées non détectées par grep
- Logique métier 566 lignes `useProductStore.ts` substantielle
- Zone à risque: `pages/admin/products/[id].vue` déjà patché

### 📋 Recommandations Critiques Intégrées
1. **Sprint 0 ajouté** - Préparation & Sécurisation AVANT Sprint 1
2. **Tests E2E renforcés massivement**
3. **Audit dépendances cachées** approfondi
4. **Rollback strategy** documentée
5. **Métriques performance** baseline obligatoire

---

## 🗓️ ROADMAP DÉTAILLÉE (10 jours)

### **Sprint 0 - Préparation & Sécurisation** [1 jour - 2025-11-02]
**Objectif**: Minimiser risque régression Sprint 1

**Tâches** (4):
1. ✅ **Renforcer massivement tests E2E CRUD products** [P5]
   - Couvrir TOUS scénarios: création, lecture, modification, suppression, recherche, pagination, filtres
   - Baseline pour détecter régressions Sprint 1
   - Fichier: `tests/e2e/admin-products-crud-complete.spec.ts`

2. ✅ **Audit dépendances cachées useProducts/stores Pinia** [P5]
   - Audit manuel: injections dépendances, appels indirects, dynamic imports
   - Documenter TOUTES dépendances: `MIGRATION_DEPENDENCIES_AUDIT.md`
   - Identifier risques avant suppression stores

3. ✅ **Préparer rollback strategy + branche Git dédiée** [P5]
   - Créer branche `feat/migration-tanstack-query-sprint-1`
   - Documenter procédure rollback: `ROLLBACK_STRATEGY.md`
   - Sauvegarder DB Turso avant migration
   - Environnement staging obligatoire

4. ✅ **Setup métriques performance baseline** [P4]
   - Lighthouse mobile 3G: pages admin products (index + [id])
   - Core Web Vitals baseline: LCP, FID/INP, CLS, TTFB, TBT
   - Bundle analyzer avant migration
   - Doc: `PERFORMANCE_BASELINE.md`

**Livrables**:
- Tests E2E complets products
- Audit dépendances documenté
- Rollback strategy prête
- Métriques baseline enregistrées

---

### **Sprint 1 - Products (Core 20%)** [3 jours - 2025-11-03→05]
**Objectif**: Zéro Pinia server state pour Products

**Tâches** (9):
1. ✅ **Migrer pages/admin/products/[id].vue → useProductQuery** [P5]
   - Remplacer $fetch direct par `useProductQuery` + `useUpdateProductMutation`
   - Retirer Event Bus
   - Tests: modification produit + validation cache sync

2. ✅ **Auditer tous usages useProducts() dans codebase** [P5]
   - Grep exhaustif: `grep -r "useProducts()" apps/election-mvp/`
   - Créer liste complète: `MIGRATION_AUDIT.md`

3. ✅ **Remplacer tous usages useProducts() → TanStack Query direct** [P5]
   - Imports directs: `useProductsQuery`, `useProductQuery`, `useUpdateProductMutation`
   - Retirer Event Bus
   - Tests unitaires après chaque migration

4. ✅ **Supprimer composables/useProducts.ts** [P5]
   - Vérifier aucun import restant: `grep -r "from.*useProducts"`
   - Update imports vers TanStack Query direct
   - -161 lignes

5. ✅ **Supprimer stores/products.ts** [P5]
   - Vérifier aucun import: `grep -r "useProductsStore"`
   - Logique cache → TanStack Query
   - -117 lignes

6. ✅ **Supprimer stores/useProductStore.ts** [P5]
   - searchCache, aggregateCache → TanStack Query staleTime/gcTime
   - Vérifier aucun import restant
   - -566 lignes

7. ✅ **Retirer synchronisation Pinia dans useProductMutations.ts** [P4]
   - Retirer appels `updateProductInStore`, `addProductInStore`, `removeProductInStore`
   - Retirer Event Bus `adminEventBus.emit`
   - Garder uniquement invalidation TanStack Query
   - ~-30 lignes

8. ✅ **Tests E2E admin products CRUD complet** [P5]
   - Scénarios: liste, création, modification, suppression + cache sync
   - Playwright
   - Fichier: `tests/e2e/admin-products-crud.spec.ts`

9. ✅ **Validation finale Sprint 1 + déploiement Railway** [P5]
   - Build + lint + type-check local
   - Tests E2E passent
   - Déploiement Railway staging puis production
   - Métriques: bundle size, Lighthouse performance

**Livrables**:
- Zéro Pinia server state products
- -844 lignes code supprimées
- Tests E2E passants
- Déploiement production validé

**Gain**: -844 lignes, architecture Products TanStack Query pure ✅

---

### **Sprint 2 - Bundles (Core 20%)** [3 jours - 2025-11-06→08]
**Objectif**: Séparer server state (TanStack) / UI state (composable)

**Tâches** (5):
1. ✅ **Créer composables/useBundleUIState.ts pour UI state pur** [P5]
   - Extraire `selectedBundle` + `selectedBundleProducts` de `useBundleStore`
   - Pattern: `const selectedBundle = ref()`, `selectBundle()`, `clearSelection()`
   - ~50 lignes
   - UI state pur (sélection utilisateur), pas server state

2. ✅ **Migrer pages/admin/bundles/[id].vue → useBundlesQuery** [P5]
   - Utiliser `useBundleQuery` + `useUpdateBundleMutation` + `useAddProductToBundleMutation` (déjà implémentés)
   - Utiliser `useBundleUIState` pour selectedBundle
   - Tests: modification bundle + sync cache

3. ✅ **Supprimer server state de stores/useBundleStore.ts** [P4]
   - Supprimer bundles list, searchCache, aggregateCache, calculationCache, fetchBundles
   - Garder SEULEMENT UI state si nécessaire (sinon supprimer entièrement, utiliser useBundleUIState)
   - ~-260 lignes

4. ✅ **Tests E2E admin bundles CRUD complet** [P5]
   - Scénarios: liste, création, modification, ajout/retrait produits, suppression
   - Vérifier cache sync TanStack Query
   - Fichier: `tests/e2e/admin-bundles-crud.spec.ts`

5. ✅ **Validation finale Sprint 2 + déploiement Railway** [P5]
   - Build + lint + type-check local
   - Tests E2E bundles passent
   - Déploiement Railway
   - Validation: CRUD bundles OK, UI state selectedBundle fonctionne

**Livrables**:
- Architecture server/UI state claire
- -260 lignes code supprimées
- Tests E2E bundles passants

**Gain**: -260 lignes, séparation server/UI state ✅

---

### **Sprint 3 - Complétion & Stabilisation** [3 jours - 2025-11-09→11]
**Objectif**: Compléter CRUD + Documentation + Audit final

**Note Gemini**: ❌ Renommer "Enhancement 80%" → ✅ **"Complétion & Stabilisation"**
`useCategoryMutations.ts` = tâche CRITIQUE (pas enhancement)

**Tâches** (5):
1. ✅ **Créer composables/useCategoryMutations.ts** [P3] **CRITIQUE**
   - CRUD categories: `useCreateCategoryMutation`, `useUpdateCategoryMutation`, `useDeleteCategoryMutation`
   - Pattern identique à `useProductMutations`
   - Optimistic updates
   - ~150 lignes

2. ✅ **Simplifier stores/useGlobalEventBus.ts** [P2] **Pareto 80%**
   - Retirer events products/bundles (`products:updated`, `products:created`, `products:deleted`, `bundles:*`)
   - TanStack Query gère invalidation automatiquement
   - Garder seulement events UI si nécessaires
   - ~-200 lignes
   - Potentiellement supprimer entièrement si inutile

3. ✅ **Audit final zéro Pinia server state dans codebase** [P3] **Pareto 80%**
   - Grep exhaustif: `grep -r "useProductsStore|useProductStore|useBundleStore"`
   - Vérifier imports Pinia uniquement pour UI state
   - Documenter: `MIGRATION_FINAL_AUDIT.md`

4. ✅ **Documentation architecture TanStack Query pure finale** [P2] **Pareto 80%**
   - Créer `docs/ARCHITECTURE_TANSTACK_QUERY.md`
   - Principes: server state = TanStack, UI state = composables
   - Patterns queries/mutations
   - Query keys hiérarchiques
   - Optimistic updates
   - Invalidation sélective
   - Migration guide futures features
   - ~200 lignes

5. ✅ **Validation finale Sprint 3 - Architecture TanStack Query pure** [P3] **Pareto 80%**
   - Tests E2E complets (products + bundles + categories)
   - Audit zéro Pinia server state validé
   - Métriques performance: bundle size réduit ~100KB, Lighthouse >90
   - Déploiement Railway production
   - Documentation complète

**Livrables**:
- CRUD categories complet
- Event Bus simplifié
- Audit Pinia zéro server state
- Documentation complète

**Gain**: -200 lignes Event Bus, documentation complète ✅

---

## 📊 MÉTRIQUES GLOBALES

### Code Supprimé
- **stores/products.ts**: -117 lignes
- **stores/useProductStore.ts**: -566 lignes
- **stores/useBundleStore.ts**: -311 lignes (partiel, server state)
- **composables/useProducts.ts**: -161 lignes
- **stores/useGlobalEventBus.ts**: ~-200 lignes (simplification)
- **TOTAL SUPPRIMÉ**: ~1355 lignes

### Code Ajouté
- **composables/useBundleUIState.ts**: +50 lignes
- **composables/useCategoryMutations.ts**: +150 lignes
- **Documentation**: +200 lignes
- **TOTAL AJOUTÉ**: +400 lignes

### Gain Net
**-955 lignes** (~71% réduction code gestion état server)

### Performance Attendue
- ✅ Bundle size réduit: ~100KB (tree-shaking Pinia code mort)
- ✅ Lighthouse mobile 3G: >90
- ✅ Core Web Vitals optimisés (optimistic updates natifs)
- ✅ API response time: <500ms (maintenu)

---

## 🎯 ARCHITECTURE CIBLE FINALE

```typescript
// ✅ SERVER STATE → TanStack Query UNIQUEMENT
const { data: products, isLoading } = useProductsQuery()
const { mutate: updateProduct } = useUpdateProductMutation()

// ✅ UI STATE → Composables réactifs
const { selectedBundle, selectBundle, clearSelection } = useBundleUIState()

// ❌ ZÉRO Pinia pour server state
// ❌ ZÉRO Event Bus pour synchronisation (TanStack Query gère)
// ❌ ZÉRO duplication cache
```

### Patterns TanStack Query Validés

**Query Keys Hiérarchiques** (Gemini: "Standard et optimal"):
```typescript
const productQueryKeys = {
  all: ['products'] as const,
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (filters?: object) => [...productQueryKeys.lists(), filters] as const,
  detail: (id: string) => [...productQueryKeys.all, 'detail', id] as const,
}
```

**Optimistic Updates** (Gemini: "Pattern recommandé"):
```typescript
export function useUpdateProductMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => $fetch(`/api/admin/products/${data.id}`, { method: 'PUT', body: data }),
    onMutate: async (newProduct) => {
      // 1. Cancel queries + snapshot
      await queryClient.cancelQueries({ queryKey: productQueryKeys.all })
      const previous = queryClient.getQueryData(productQueryKeys.lists())

      // 2. Optimistic update
      queryClient.setQueryData(productQueryKeys.lists(), (old) =>
        old?.map(p => p.id === newProduct.id ? newProduct : p)
      )
      return { previous }
    },
    onError: (err, newProduct, context) => {
      // 3. Rollback si erreur
      queryClient.setQueryData(productQueryKeys.lists(), context?.previous)
    },
    onSuccess: (data) => {
      // 4. Update detail + invalidate (garantir cohérence serveur)
      queryClient.setQueryData(productQueryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
    }
  })
}
```

**Invalidation Sélective** (Gemini: "Privilégier sélectif"):
```typescript
// ✅ Sélective (préféré - minimise re-fetches 3G)
queryClient.invalidateQueries({ queryKey: productQueryKeys.detail(id) })

// ⚠️ Globale (seulement si impact large imprévisible)
queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
```

---

## 🚨 RISQUES & MITIGATIONS

### Risque ÉLEVÉ: Sprint 1 Régression Admin CRUD
**Impact**: Blocage administration produits
**Probabilité**: Élevée (566 lignes logique métier)

**Mitigations**:
- ✅ Sprint 0 ajouté (tests E2E massifs + audit dépendances)
- ✅ Rollback strategy documentée
- ✅ Environnement staging obligatoire
- ✅ Feature flag optionnel (recommandation Gemini)
- ✅ Revue de code croisée

### Risque MOYEN: Dépendances Cachées
**Impact**: Erreurs runtime après suppression stores
**Probabilité**: Moyenne

**Mitigations**:
- ✅ Audit manuel approfondi (provide/inject, dynamic imports)
- ✅ Grep exhaustif + vérification manuelle
- ✅ ESLint rules temporaires interdisant imports anciens stores

### Risque MOYEN: Performance 3G Dégradée
**Impact**: Expérience utilisateur 3G Côte d'Ivoire
**Probabilité**: Faible (optimistic updates améliorent UX)

**Mitigations**:
- ✅ Métriques baseline avant migration
- ✅ Lighthouse mobile 3G à chaque sprint
- ✅ Real User Monitoring (RUM) production
- ✅ Core Web Vitals tracking

### Risque FAIBLE: Dette Technique Nouvelle
**Impact**: Maintenabilité future
**Probabilité**: Faible

**Mitigations**:
- ✅ Séparer `useBundleMutations.ts` immédiatement Sprint 2
- ✅ Tests unitaires mutations (vitest + msw)
- ✅ Documentation complète patterns

---

## 📋 CHECKLIST DÉMARRAGE SPRINT 0

Avant de commencer Sprint 0, vérifier:

- [ ] Projet Task Master créé et validé ✅
- [ ] Analyse Gemini Copilot complétée ✅
- [ ] Roadmap documentée (ce fichier) ✅
- [ ] Environnement local fonctionnel (pnpm dev)
- [ ] Accès Railway + Turso configurés
- [ ] Branche Git principale à jour
- [ ] Équipe briefée sur plan migration

---

## 📚 RESSOURCES

### Documentation Projet
- `/docs/MIGRATION_TANSTACK_QUERY_ROADMAP.md` (ce fichier)
- `/docs/ARCHITECTURE_TANSTACK_QUERY.md` (à créer Sprint 3)
- `/.claude-task-master/projects/proj-1762102136104-db0992a9/` (Task Master)

### Analyses Expertes
- **Gemini Copilot**: 69 secondes analyse, validation complète
- **Session ID**: `session_6fbcdb46-5ada-46c5-835f-bf7f031eda02`

### Documentation Externe
- TanStack Query v5: https://tanstack.com/query/latest/docs/vue/overview
- Nuxt 3: https://nuxt.com/docs
- Pinia: https://pinia.vuejs.org/ (uniquement UI state après migration)

---

## 🎯 CONCLUSION

Ce plan de migration a été **rigoureusement challengé et validé** par Gemini Copilot.

**Points Forts**:
- Architecture cible saine (TanStack Query pure)
- Approche incrémentale feature par feature
- Sprint 0 sécurisation ajouté
- Métriques performance intégrées
- Rollback strategy préparée

**Recommandation Gemini Finale**:
> "Votre plan est solide et bien pensé. En suivant ces recommandations, vous transformerez une architecture fragile en un système robuste, performant et maintenable, parfaitement adapté aux contraintes de votre PMI ivoirienne. La durée estimée de 9 jours (+1 jour Sprint 0 = 10 jours) est ambitieuse mais réalisable pour une équipe focalisée."

**Prochaine étape**: Démarrer Sprint 0 - Préparation & Sécurisation

---

**Dernière mise à jour**: 2025-11-02
**Auteur**: Claude Code + Gemini Copilot
**Statut**: ✅ VALIDÉ - PRÊT POUR EXÉCUTION
