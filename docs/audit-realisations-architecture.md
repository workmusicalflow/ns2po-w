# Audit Architecture `/realisations` - NS2PO Election MVP

**Date** : 2025-11-14
**Scope** : Audit fullstack complet de la fonctionnalité Réalisations
**Méthodologie** : Serena (cartographie code) + Gemini Copilot (validation communauté)
**Objectif** : Identifier patterns, anti-patterns, recommandations MVP

---

## 📋 Table des Matières

1. [Vue d'Ensemble Architecture](#vue-densemble-architecture)
2. [Phase 1: Cartographie Complète](#phase-1-cartographie-complète)
3. [Phase 2: Analyse Patterns Frontend](#phase-2-analyse-patterns-frontend)
4. [Phase 3: Analyse Patterns Backend](#phase-3-analyse-patterns-backend)
5. [Phase 4: Validation Communauté](#phase-4-validation-communauté)
6. [Phase 5: Recommandations MVP](#phase-5-recommandations-mvp)

---

## 🎯 Vue d'Ensemble Architecture

### Fonctionnalité `/realisations`

**Description** : Galerie de réalisations NS2PO (projets clients, campagnes électorales passées)

**Routes accessibles** :
- `/realisations` - Liste des réalisations
- `/realisations/[id]` - Détail d'une réalisation

**Sources de données** :
1. **Turso DB** (source primaire) - Table `realisations`
2. **Cloudinary Auto-Discovery** (source secondaire) - Dossier `ns2po-elections-mvp/realisations`

### Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Nuxt 3, Vue 3 Composition API, TypeScript |
| **État** | `useState` (composable natif Nuxt) + `useLazyFetch` |
| **Backend** | Nuxt API Routes, Nitro |
| **Database** | Turso (libSQL/SQLite) |
| **Validation** | Zod |
| **Médias** | Cloudinary SDK |

---

## 📊 Phase 1: Cartographie Complète

### 🗂️ Structure Fichiers

#### Frontend

```
apps/election-mvp/
├── pages/
│   └── realisations/
│       ├── index.vue              # Liste réalisations
│       └── [id].vue               # Détail réalisation
│
├── components/
│   ├── RealisationCard.vue        # Card galerie
│   └── admin/
│       ├── RealisationForm.vue    # Formulaire CRUD
│       └── RealisationFormModal.vue # Modal formulaire
│
└── composables/
    └── useRealisations.ts         # État + logique métier
```

#### Backend

```
apps/election-mvp/server/
├── api/realisations/
│   ├── index.get.ts               # GET /api/realisations (liste)
│   ├── index.post.ts              # POST /api/realisations (création)
│   ├── [id].get.ts                # GET /api/realisations/[id]
│   ├── [id].put.ts                # PUT /api/realisations/[id]
│   └── [id].delete.ts             # DELETE /api/realisations/[id]
│
├── services/
│   └── assetService.ts            # RealisationService (deletion strategies)
│
└── utils/
    └── cloudinary-discovery.ts    # Auto-discovery Cloudinary
```

#### Schémas & Types

```
apps/election-mvp/
├── schemas/
│   └── realisation.ts             # Zod schemas (create, update, response)
│
└── types/
    └── api.ts                     # Types API TypeScript

packages/types/src/
└── product.ts                     # Interfaces (Realisation, HybridRealisation)
```

### 🔍 Flux de Données (Data Flow)

#### Lecture (GET)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User visite /realisations                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. pages/realisations/index.vue                             │
│    - onMounted() → fetchRealisations()                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. composables/useRealisations.ts                           │
│    - useLazyFetch('/api/realisations')                      │
│    - key: 'realisations' (cache Nuxt)                       │
│    - transform: populate state.value.realisations           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. server/api/realisations/index.get.ts                     │
│    - fetchTursoRealisations() → DB query                    │
│    - generateAutoDiscoveryRealisations() → Cloudinary API   │
│    - Merge + sort (featured first, then date)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Response: HybridRealisation[]                            │
│    - Source: 'turso' | 'cloudinary'                         │
│    - Affichage: components/RealisationCard.vue              │
└─────────────────────────────────────────────────────────────┘
```

#### Écriture (POST/PUT/DELETE)

```
Admin Panel → RealisationFormModal
              ↓
          POST /api/realisations (création)
          PUT  /api/realisations/[id] (update)
          DELETE /api/realisations/[id] (suppression)
              ↓
          Validation Zod (schemas/realisation.ts)
              ↓
          Turso DB (INSERT/UPDATE/DELETE)
              ↓
          Response success
              ↓
          Refresh frontend (invalidation cache?)
```

### 📦 Types & Interfaces Clés

#### `HybridRealisation` (packages/types/src/product.ts)

```typescript
export interface HybridRealisation extends Realisation {
  source: 'turso' | 'cloudinary'  // Source de données
  cloudinaryData?: {              // Métadonnées Cloudinary (si auto-discovery)
    publicId: string
    originalUrl: string
    width: number
    height: number
    format: string
  }
}
```

#### Schémas Zod (schemas/realisation.ts)

- `baseRealisationSchema` - Schéma de base partagé
- `createRealisationSchema` - POST (extends base)
- `updateRealisationSchema` - PUT (partial base)
- `realisationResponseSchema` - Response API
- `realisationWithRelationsSchema` - Avec relations (produits, catégories)

---

## 🔬 Phase 2: Analyse Patterns Frontend

### Patterns Identifiés ✅

#### ✅ Pattern 1: Composable State Management (Nuxt natif)

**Localisation** : `composables/useRealisations.ts`

**Description** : Utilisation de `useState` Nuxt pour état global partagé

```typescript
const state = useState<RealisationsState>("realisations", () => ({
  realisations: [],
  featured: [],
  loading: false,
  error: null,
}));
```

**Avantages** :
- ✅ Simplicité (pas de store Pinia requis pour ce cas)
- ✅ SSR-friendly (état partagé server/client)
- ✅ Auto-persistence entre navigations

**Inconvénients** :
- ⚠️ Pas de DevTools (contrairement à Pinia)
- ⚠️ Pas de time-travel debugging
- ⚠️ Difficile à tester unitairement (dépend du runtime Nuxt)

---

#### ✅ Pattern 2: Lazy Fetch avec Transform

**Localisation** : `composables/useRealisations.ts:29-43`

**Description** : `useLazyFetch` avec transformation response pour populate state

```typescript
const {
  pending: pendingLazy,
  error: errorLazy,
  refresh: refreshLazy,
} = useLazyFetch<HybridRealisation[]>("/api/realisations", {
  key: "realisations",
  server: true,
  transform: (data: HybridRealisation[]) => {
    // Populate state directement dans transform
    state.value.realisations = data;
    state.value.featured = data.filter((r: HybridRealisation) => r.isFeatured);
    return data;
  },
});
```

**Avantages** :
- ✅ Cache automatique Nuxt (key-based)
- ✅ SSR-friendly (server: true)
- ✅ Transformation centralisée

**Inconvénients** :
- ⚠️ Side-effect dans `transform` (mutation state) - **ANTI-PATTERN** potentiel
- ⚠️ Pas de gestion d'erreur dans transform
- ⚠️ Difficile à tester

---

#### ⚠️ ANTI-PATTERN 1: Mutation State dans Transform

**Problème** : `transform` devrait être pure function, mais ici elle mute `state.value`

```typescript
transform: (data: HybridRealisation[]) => {
  // ❌ SIDE-EFFECT: Mutation external state
  state.value.realisations = data;
  state.value.featured = data.filter((r: HybridRealisation) => r.isFeatured);
  return data;
},
```

**Impact** :
- Code difficile à raisonner (fonction impure)
- Tests complexes (mock useState)
- Risque race conditions si multiple fetch concurrents

**Recommandation** :
```typescript
// ✅ OPTION 1: Watcher sur data
watch(data, (newData) => {
  if (newData) {
    state.value.realisations = newData;
    state.value.featured = newData.filter(r => r.isFeatured);
  }
});

// ✅ OPTION 2: TanStack Query (meilleure option MVP)
const { data, isLoading } = useQuery({
  queryKey: ['realisations'],
  queryFn: () => $fetch('/api/realisations'),
});
```

---

#### ⚠️ ANTI-PATTERN 2: Duplication Logique Loading/Error

**Localisation** : `composables/useRealisations.ts:61-75`

**Problème** : `fetchRealisations()` réplique manuellement la logique de `useLazyFetch`

```typescript
const fetchRealisations = async (force = false): Promise<void> => {
  try {
    // ❌ Duplication: check cache manuel
    if (!force && state.value.realisations.length > 0) {
      return;
    }

    // ❌ Duplication: gestion loading manuel
    state.value.loading = true;
    state.value.error = null;

    await refreshLazy(); // ← Appelle useLazyFetch refresh

    // ❌ Duplication: propagation loading/error manuel
    state.value.loading = pendingLazy.value;
    state.value.error = errorLazy.value;
  } catch (error) {
    // ...
  }
};
```

**Impact** :
- Code verbeux et redondant
- Logique split (partie dans useLazyFetch, partie dans fetchRealisations)
- Risque désynchronisation state

**Recommandation** : Utiliser **TanStack Query** qui gère ça nativement

---

### Patterns Composants (À ANALYSER)

**TODO** : Analyser `RealisationCard.vue`, `pages/realisations/index.vue`, `pages/realisations/[id].vue`

---

## 🔬 Phase 3: Analyse Patterns Backend

### Patterns Identifiés ✅

#### ✅ Pattern 1: Hybrid Data Source (Turso + Cloudinary)

**Localisation** : `server/api/realisations/index.get.ts:16-158`

**Description** : Merge automatique données Turso + auto-discovery Cloudinary

```typescript
// 1. Fetch Turso (source primaire)
const tursoRealisations = await fetchTursoRealisations();

// 2. Auto-discovery Cloudinary (source secondaire)
const autoDiscoveryRealisations = await generateAutoDiscoveryRealisations(existingPublicIds);

// 3. Merge + sort
const allRealisations = [
  ...tursoRealisations,
  ...autoDiscoveryRealisations
];

// 4. Sort: featured first, then by date
const sortedRealisations = allRealisations.sort((a, b) => {
  if (a.isFeatured && !b.isFeatured) return -1;
  if (!a.isFeatured && b.isFeatured) return 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});
```

**Avantages** :
- ✅ Flexibilité: Admin peut gérer Turso, auto-sync Cloudinary en fallback
- ✅ Évite data loss si admin oublie de créer Turso entry
- ✅ Innovation architecture (non standard mais pragmatique pour PMI)

**Inconvénients** :
- ⚠️ Complexité accrue
- ⚠️ Performance: 2× API calls (Turso + Cloudinary) sur CHAQUE requête
- ⚠️ Risque conflits/duplicates si mal géré

---

#### ⚠️ ANTI-PATTERN 3: N+1 Problem Potential (Cloudinary Auto-Discovery)

**Localisation** : `server/api/realisations/index.get.ts:65-94`

**Problème** : Auto-discovery appelle Cloudinary API sur CHAQUE requête `/api/realisations`

```typescript
async function generateAutoDiscoveryRealisations(existingPublicIds: Set<string>): Promise<HybridRealisation[]> {
  try {
    // ❌ CLOUDINARY API CALL sur CHAQUE requête GET /api/realisations
    const cloudinaryImages = await searchCloudinaryRealisations()

    // Filter duplicates
    const autoDiscoveryImages = cloudinaryImages.filter(
      (image: any) => !existingPublicIds.has(image.public_id)
    )

    return autoDiscoveryImages.map((image: any) =>
      cloudinaryImageToHybridRealisation(image)
    )
  } catch (error) {
    console.error('❌ Auto-discovery Cloudinary error:', error)
    return []
  }
}
```

**Impact** :
- ⚠️ Performance: +200-500ms latence par requête (Cloudinary API externe)
- ⚠️ Coût: Cloudinary API quotas consommés
- ⚠️ Scaling: Impossible si trafic élevé

**Recommandation** : **Cache + Background Sync**

```typescript
// ✅ OPTION 1: Cache Nitro (storage)
const cachedRealisations = await useStorage('cache').getItem('cloudinary-realisations')
if (cachedRealisations && Date.now() - cachedRealisations.timestamp < 3600000) {
  return cachedRealisations.data
}

// ✅ OPTION 2: Cron job (background sync)
// - Cron toutes les 1h: sync Cloudinary → Turso DB
// - GET /api/realisations lit UNIQUEMENT Turso (rapide)
```

---

#### ✅ Pattern 2: Strategy Pattern (Deletion)

**Localisation** : `server/services/assetService.ts:1283-1345`

**Description** : Stratégies de suppression (soft delete vs hard delete)

```typescript
interface IRealisationDeletionStrategy {
  delete(realisationId: string): Promise<void>
}

class SoftDeleteRealisationStrategy implements IRealisationDeletionStrategy {
  async delete(realisationId: string): Promise<void> {
    // UPDATE realisations SET is_active = 0
  }
}

class HardDeleteRealisationStrategy implements IRealisationDeletionStrategy {
  async delete(realisationId: string): Promise<void> {
    // DELETE FROM realisations WHERE id = ?
  }
}

class RealisationDeletionStrategyFactory {
  getStrategy(source: string): IRealisationDeletionStrategy {
    return source === 'turso'
      ? new SoftDeleteRealisationStrategy(db)
      : new HardDeleteRealisationStrategy(db)
  }
}
```

**Avantages** :
- ✅ SOLID: Open/Closed Principle
- ✅ Extensible: Facile ajouter nouvelles stratégies
- ✅ Testable: Mock strategies facilement

**Inconvénients** :
- ⚠️ Over-engineering pour MVP? (2 stratégies seulement)
- ⚠️ Pas utilisé ailleurs (duplication si besoin pour products, bundles...)

---

#### ⚠️ ANTI-PATTERN 4: Validation Zod Dupliquée

**Localisation** :
- `server/api/realisations/index.post.ts:10-24` (createRealisationSchema)
- `server/api/realisations/[id].put.ts:10-29` (updateRealisationSchema)
- `schemas/realisation.ts:73-120` (schemas centralisés)

**Problème** : Schémas Zod définis dans API routes ET dans `schemas/`

```typescript
// ❌ server/api/realisations/index.post.ts
const createRealisationSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  // ... 15 lignes
})

// ❌ schemas/realisation.ts
export const createRealisationSchema = baseRealisationSchema.extend({
  title: z.string().min(3),
  description: z.string().optional(),
  // ... même définition!
})
```

**Impact** :
- ⚠️ DRY violation (Don't Repeat Yourself)
- ⚠️ Risque désynchronisation (update 1 endroit, oublier l'autre)
- ⚠️ Maintenance cauchemar

**Recommandation** : **Single Source of Truth**

```typescript
// ✅ server/api/realisations/index.post.ts
import { createRealisationSchema } from '~/schemas/realisation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = createRealisationSchema.parse(body) // ← Import centralisé
  // ...
})
```

---

### ✅ Pattern 3: Service Layer Architecture

**Localisation** : `server/services/assetService.ts:1332-1505`

**Description** : `RealisationService` orchestre suppression DB + Cloudinary avec Strategy Pattern

```typescript
class RealisationService {
  private deletionFactory: RealisationDeletionStrategyFactory
  private cloudinaryFactory: CloudinaryDeletionStrategyFactory

  async deleteRealisation(
    realisationId: string,
    source: string,
    options: { deleteFromCloudinary?: boolean, publicIds?: string[] }
  ): Promise<void> {
    // PHASE 1: Cloudinary deletion (if requested)
    if (options.deleteFromCloudinary && options.publicIds.length > 0) {
      const cloudinaryStrategy = this.cloudinaryFactory.getStrategy(true)
      await cloudinaryStrategy.delete(options.publicIds, { invalidate: true })
    }

    // PHASE 2: DB deletion (strategy-based)
    if (source === 'cloudinary-auto-discovery') {
      // Auto-discovery → Blacklist (not hard delete)
      await this.addToBlacklist(publicId, reason, 'admin')
    } else {
      // Turso → Soft/Hard delete via strategy
      const dbStrategy = this.deletionFactory.getStrategy(source)
      await dbStrategy.delete(realisationId)
    }
  }
}
```

**Avantages** :
- ✅ SOLID: Single Responsibility (orchestration vs execution)
- ✅ Error handling centralisé
- ✅ Blacklist mechanism (éviter re-discovery)
- ✅ Phased deletion (Cloudinary first, then DB)

**Inconvénients** :
- ⚠️ Complexité élevée pour MVP simple
- ⚠️ Manque tests unitaires (pas de mocks Strategy visibles)
- ⚠️ Service non réutilisé ailleurs (products, bundles font appel direct DB)

---

### ✅ Pattern 4: Factory Pattern (Double Factory)

**Localisation** :
- `RealisationDeletionStrategyFactory` (DB strategies)
- `CloudinaryDeletionStrategyFactory` (Cloudinary strategies)

**Description** : 2 factories pour sélectionner stratégies runtime

```typescript
// Factory 1: DB Deletion Strategies
class RealisationDeletionStrategyFactory {
  getStrategy(source: string): IRealisationDeletionStrategy {
    const strategy = this.strategies.find(s => s.canHandle(source))
    if (!strategy) throw new Error(`No strategy for source: ${source}`)
    return strategy
  }
}

// Factory 2: Cloudinary Deletion Strategies
class CloudinaryDeletionStrategyFactory {
  getStrategy(deleteFromCloudinary: boolean): ICloudinaryDeletionStrategy {
    return deleteFromCloudinary
      ? new CloudinaryRealDeletionStrategy()
      : new CloudinaryNoOpStrategy() // No-op if deleteFromCloudinary=false
  }
}
```

**Avantages** :
- ✅ Open/Closed Principle (extension sans modification)
- ✅ Polymorphism clean
- ✅ No-Op pattern pour Cloudinary (évite if/else dans service)

**Inconvénients** :
- ⚠️ Over-engineering probable pour MVP (2 strategies DB, 2 strategies Cloudinary = 4 classes)
- ⚠️ Pas de tests visibles pour strategies
- ⚠️ Complexité cognitive élevée pour feature simple

---

### ⚠️ ANTI-PATTERN 5: Error Handling Incohérent

**Localisation** : Routes API `/api/realisations/*`

**Problème** : Stratégies error handling différentes selon endpoints

```typescript
// ❌ index.get.ts - Fallback silencieux []
export default defineEventHandler(async (event): Promise<HybridRealisation[]> => {
  try {
    // ... fetch logic
  } catch (error: any) {
    console.error("❌ API Réalisations erreur:", error)
    // Retourne tableau vide au lieu de throw
    return []
  }
})

// ✅ index.post.ts - Throw error explicite
export default defineEventHandler(async (event) => {
  try {
    // ... create logic
  } catch (error) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erreur lors de la création',
      data: { error: error.message }
    })
  }
})
```

**Impact** :
- ⚠️ Incohérence UX (GET fail silencieux, POST fail bruyant)
- ⚠️ Debugging difficile (client voit `[]` sans savoir si erreur ou vide)
- ⚠️ Pas de retry logic côté client si GET fail

**Recommandation** :
```typescript
// ✅ Unified error handling
export default defineEventHandler(async (event) => {
  try {
    // ...
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur serveur',
      data: {
        timestamp: new Date().toISOString(),
        path: event.path,
        details: error.data
      }
    })
  }
})
```

---

### 📊 Cache Strategy Analysis

**Localisation** : `server/api/realisations/index.get.ts:158`

**Actuel** :
```typescript
setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=86400')
```

**Analyse** :
- ✅ Cache browser 60s (bon pour UX)
- ✅ Cache CDN 120s (Railway/Cloudflare)
- ✅ Stale-while-revalidate 24h (fallback si serveur down)

**Problème** :
- ⚠️ Cache headers MAIS auto-discovery appelle Cloudinary sur CHAQUE requête (cache bypass)
- ⚠️ Pas de cache Nitro storage (serveur refetch DB + Cloudinary toutes les 60s)

**Recommandation** : **Nitro Storage Cache**
```typescript
// ✅ Cache Nitro + TTL
const cachedData = await useStorage('cache').getItem('realisations:all')
if (cachedData && Date.now() - cachedData.timestamp < 300000) { // 5min TTL
  return cachedData.data
}

const freshData = await fetchTursoAndCloudinary()
await useStorage('cache').setItem('realisations:all', {
  data: freshData,
  timestamp: Date.now()
})
return freshData
```

---

## 🌐 Phase 4: Validation Communauté (Gemini + Google Search)

**STATUS** : ✅ COMPLÉTÉ (Gemini 2.5 Flash + Google Search Grounding)

**Méthodologie** : Recherche web temps réel avec citations sources, analyse best practices 2025

---

### Q1: useState vs Pinia - Nuxt 3 State Management ✅

**Validation Gemini** :
- ✅ **useState suffisant pour MVP CRUD simple** (recommandation communauté)
- ✅ Simplicité et rapidité développement (pas de dépendance supplémentaire)
- ✅ Intégration SSR native Nuxt

**Seuils migration Pinia** :
1. État partagé complexe avec modules distincts
2. Actions asynchrones sophistiquées avec logique métier
3. Besoin getters avancés (computed state)
4. DevTools et time-travel debugging requis
5. Croissance significative application prévue

**Recommandation MVP** : ✅ **Conserver useState pour notre scope actuel**

---

### Q2: useLazyFetch Transform Side-Effects ❌

**Validation Gemini** : **ANTI-PATTERN CONFIRMÉ**

**Raisons** :
- ❌ Violation principe pureté fonctions
- ❌ Dépendances cachées (state.value non explicite)
- ❌ Code difficile à tester et maintenir
- ❌ Risque race conditions si fetch concurrents

**Pattern recommandé communauté 2025** :
```typescript
// ✅ Utiliser watch(data) avec immediate: true
const { data, pending, error } = useLazyFetch('/api/realisations')

watch(data, (newData) => {
  if (newData) {
    state.value.realisations = newData
    state.value.featured = newData.filter(r => r.isFeatured)
  }
}, { immediate: true })
```

**Recommandation MVP** : 🔴 **REFACTOR CRITIQUE** - Remplacer transform side-effects par watch()

---

### Q3: Hybrid Data Source Pattern (DB + API Merge) ✅

**Validation Gemini** : **PATTERN VALIDE**

**Approches validées communauté** :
1. ✅ **Agrégation API-side** (notre approche actuelle) - Recommandé
   - Centralise logique fusion
   - API unifiée pour frontend
   - Gestion cache côté serveur possible

2. ❌ Agrégation client-side - Déconseillé pour 3G
   - Multiples requêtes réseau depuis client
   - Performance critique compromise

**Recommandations performance** :
- 🔴 **CRITIQUE**: Cache Cloudinary API côté serveur (voir Q6)
- ✅ Fusion et déduplication efficaces (Map pour unicité)
- ✅ Tri optimisé (côté DB si possible)

**Recommandation MVP** : ✅ **Pattern OK, mais cache Cloudinary obligatoire**

---

### Q4: TanStack Query vs useLazyFetch ❌

**Validation Gemini** : **OVER-ENGINEERING pour MVP confirmé**

**Seuils adoption TanStack Query** (communauté 2025):
1. Besoins cache complexes (stale-while-revalidate avancé)
2. Grand nombre requêtes asynchrones avec dépendances
3. Gestion auto états loading/error/success globale
4. Fonctionnalités: refetch on focus, retry auto, pagination infinie
5. Mutations optimistes avec update cache complexe

**Trade-offs** :
- ❌ Dépendance + courbe apprentissage
- ❌ Détourne ressources livraison MVP
- ✅ Duplication loading/error gérable avec composables simples

**Recommandation MVP** : ✅ **Rester avec useLazyFetch, réévaluer post-MVP si besoin**

---

### Q5: Strategy Pattern Over-Engineering ❌

**Validation Gemini** : **OVER-ENGINEERING confirmé pour 2 stratégies**

**Principe YAGNI (You Ain't Gonna Need It)** :
- ❌ Pattern Strategy ajoute complexité sans bénéfice immédiat
- ❌ 4 classes pour 2 cas d'usage = cognitive overhead élevé
- ✅ if/else ou switch suffisant pour MVP

**Pattern recommandé communauté** :
```typescript
// ✅ Logique conditionnelle simple
async function deleteRealisation(id: string, type: 'soft' | 'hard' | 'cloudinary') {
  if (type === 'soft') {
    // Logique soft delete
  } else if (type === 'hard') {
    // Logique hard delete
  } else if (type === 'cloudinary') {
    // Logique Cloudinary
  }
}
```

**Seuils adoption Strategy Pattern** :
1. 3-4+ stratégies ou plus
2. Logique sélection stratégie devient complexe
3. Ajout fréquent nouvelles stratégies prévu

**Recommandation MVP** : 🟠 **REFACTOR MOYEN** - Simplifier vers if/else, garder Strategy si temps permet

---

### Q6: Nitro Cache Best Practices - External API ✅

**Validation Gemini** : **useStorage('cache') avec TTL recommandé**

**Stratégies validées communauté 2025** :

#### ✅ Option 1: useStorage('cache') + TTL manuel (RECOMMANDÉ)
```typescript
// server/utils/cache.ts
const cloudinaryCache = useStorage('cache:cloudinary')

export async function getCachedCloudinaryRealisations() {
  return await cloudinaryCache.getItem('realisations')
}

export async function setCachedCloudinaryRealisations(data, ttlSeconds) {
  await cloudinaryCache.setItem('realisations', {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  })
}

// api/realisations.ts - Vérification expiration
let cachedData = await getCachedCloudinaryRealisations()
if (cachedData && cachedData.expiresAt > Date.now()) {
  cloudinaryRealisations = cachedData.data
} else {
  cloudinaryRealisations = await fetchCloudinaryAutoDiscovery()
  await setCachedCloudinaryRealisations(cloudinaryRealisations, 3600) // 1h TTL
}
```

**Avantages** :
- ✅ Contrôle fin TTL
- ✅ Namespace cache spécifique (cache:cloudinary)
- ✅ Persistance possible avec pilotes spécifiques (Redis, etc.)
- ✅ TTL: 1h recommandé pour données Cloudinary peu changeantes

#### ✅ Option 2: cachedEventHandler (pour réponses API complètes)
```typescript
export default cachedEventHandler(async (event) => {
  // Logique fusion Turso + Cloudinary
  return mergedRealisations
}, {
  maxAge: 3600, // 1h cache
  name: 'realisations-list',
  swr: true // Stale-While-Revalidate
})
```

**Avantages** :
- ✅ Cache réponse API complète
- ✅ SWR natif (stale-while-revalidate)
- ✅ Moins de code boilerplate

**Recommandation MVP** : 🔴 **CRITIQUE** - Implémenter Option 1 (useStorage cache) immédiatement

---

## 📝 Phase 5: Recommandations MVP

**STATUS** : ✅ COMPLÉTÉ

**Méthodologie** : Priorisation Pareto (Core 20% vs Enhancement 80%) basée sur:
- Validation communauté (Gemini + Google Search)
- Performance 3G critique (contexte PMI ivoirienne)
- Scope MVP strict (éviter over-engineering)

---

### 🔴 CRITIQUES (Core 20% - Blockers MVP Performance)

#### 🔴-1: Implémenter Cache Cloudinary API (N+1 Problem)

**Anti-pattern identifié** : ANTI-PATTERN 3 (Phase 3)

**Problème** :
- Auto-discovery appelle Cloudinary API sur CHAQUE requête GET `/api/realisations`
- +200-500ms latence par requête (inacceptable 3G)
- Quotas Cloudinary consommés inutilement

**Solution validée** : useStorage('cache') avec TTL 1h
```typescript
// server/utils/cloudinaryCache.ts
const cloudinaryCache = useStorage('cache:cloudinary')

export async function getCachedCloudinaryRealisations() {
  const cached = await cloudinaryCache.getItem('realisations')
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }
  return null
}

export async function setCachedCloudinaryRealisations(data, ttlSeconds = 3600) {
  await cloudinaryCache.setItem('realisations', {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  })
}
```

**Impact MVP** :
- ✅ Performance 3G: -200-500ms latence
- ✅ Scalabilité: supportera trafic élevé
- ✅ Coûts: réduit quotas Cloudinary

**Effort** : 🟢 2-3h (faible complexité)

**Priorité Pareto** : 🔴 **CORE 20% - À implémenter Sprint 0 ou 1**

---

#### 🔴-2: Refactor Transform Side-Effects → watch()

**Anti-pattern identifié** : ANTI-PATTERN 1 (Phase 2)
**Validation Gemini** : ANTI-PATTERN CONFIRMÉ (Q2)

**Problème** :
```typescript
// ❌ Actuel: side-effect dans transform
transform: (data) => {
  state.value.realisations = data // Mutation state externe
  state.value.featured = data.filter(r => r.isFeatured)
  return data
}
```

**Solution validée** :
```typescript
// ✅ Pattern communauté 2025
const { data, pending, error } = useLazyFetch('/api/realisations')

watch(data, (newData) => {
  if (newData) {
    state.value.realisations = newData
    state.value.featured = newData.filter(r => r.isFeatured)
  }
}, { immediate: true })
```

**Impact MVP** :
- ✅ Maintenabilité: code plus clair, testable
- ✅ Bugs: élimine race conditions potentielles
- ✅ Best practices: conforme standards Nuxt 3 2025

**Effort** : 🟢 1-2h (refactor simple)

**Priorité Pareto** : 🔴 **CORE 20% - À implémenter Sprint 0 ou 1**

---

#### 🔴-3: Unifier Error Handling API Routes

**Anti-pattern identifié** : ANTI-PATTERN 5 (Phase 3)

**Problème** :
- `index.get.ts` : Retourne `[]` silencieusement si erreur (UX confusant)
- `index.post.ts` : Throw error explicite avec createError()
- Incohérence debugging + expérience développeur

**Solution** : Unified error handling
```typescript
// ✅ Pattern unifié pour toutes les routes
export default defineEventHandler(async (event) => {
  try {
    // ... logique route
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Erreur serveur',
      data: {
        timestamp: new Date().toISOString(),
        path: event.path,
        details: error.data
      }
    })
  }
})
```

**Impact MVP** :
- ✅ UX: Frontend peut afficher erreurs claires
- ✅ Debugging: Logs structurés avec context
- ✅ Retry logic: Client peut détecter erreurs vs vide

**Effort** : 🟡 2-4h (5 routes API à uniformiser)

**Priorité Pareto** : 🔴 **CORE 20% - À implémenter Sprint 1**

---

### 🟠 IMPORTANTES (Impact Moyen - Post-MVP Sprint 2-3)

#### 🟠-1: Simplifier Strategy Pattern → if/else

**Anti-pattern identifié** : Over-engineering (validé Gemini Q5)

**Problème** :
- 4 classes Strategy pour 2 cas d'usage seulement
- Complexité cognitive élevée pour feature simple
- Principe YAGNI (You Ain't Gonna Need It)

**Solution** :
```typescript
// ✅ Simplifier vers logique conditionnelle
async function deleteRealisation(id: string, source: string, options) {
  // Phase 1: Cloudinary deletion
  if (options.deleteFromCloudinary && options.publicIds.length > 0) {
    await deleteCloudinaryAssets(options.publicIds, { invalidate: true })
  }

  // Phase 2: DB deletion
  if (source === 'cloudinary-auto-discovery') {
    await addToBlacklist(id, 'user_deleted_auto_discovery')
  } else if (source === 'turso') {
    await db.execute('UPDATE realisations SET is_active = 0 WHERE id = ?', [id])
  } else {
    await db.execute('DELETE FROM realisations WHERE id = ?', [id])
  }
}
```

**Impact MVP** :
- ✅ Maintenabilité: -150 lignes code, plus facile comprendre
- ✅ Onboarding: Nouveaux devs comprennent flux rapidement
- ⚠️ Extensibilité: OK pour 2-3 stratégies (suffisant MVP)

**Effort** : 🟡 3-5h (refactor service + tests)

**Priorité Pareto** : 🟠 **IMPORTANT - Sprint 2-3 si temps disponible**

---

#### 🟠-2: Éliminer Duplication Zod Schemas

**Anti-pattern identifié** : ANTI-PATTERN 4 (Phase 3)

**Problème** :
- Schémas Zod définis dans API routes ET `schemas/realisation.ts`
- DRY violation (Don't Repeat Yourself)
- Risque désynchronisation

**Solution** :
```typescript
// ✅ Single Source of Truth
// server/api/realisations/index.post.ts
import { createRealisationSchema } from '~/schemas/realisation'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = createRealisationSchema.parse(body) // ← Import centralisé
  // ...
})
```

**Impact MVP** :
- ✅ Maintenance: 1 seul endroit pour schemas
- ✅ Type-safety: Cohérence garantie
- ✅ DRY: -50 lignes duplication

**Effort** : 🟢 1-2h (import centralisé)

**Priorité Pareto** : 🟠 **IMPORTANT - Sprint 2**

---

### 🟡 NICE-TO-HAVE (Enhancement 80% - Post-MVP)

#### 🟡-1: Tests Unitaires Composables & Services

**Constat** : Pas de tests visibles pour:
- `useRealisations.ts` (287 lignes)
- `RealisationService` (174 lignes)
- Stratégies (SoftDelete, HardDelete, Cloudinary)

**Recommandation** : Tests Vitest + Test Utils Nuxt
```typescript
// tests/composables/useRealisations.test.ts
import { describe, it, expect } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

describe('useRealisations', () => {
  it('should fetch realisations and populate state', async () => {
    // Test avec mock useLazyFetch
  })

  it('should filter featured realisations correctly', async () => {
    // Test logique featured
  })
})
```

**Impact** : Maintenabilité long-terme, régression prevention

**Effort** : 🔴 8-12h (tests complets)

**Priorité Pareto** : 🟡 **ENHANCEMENT 80% - Sprint 4+ ou debt technique**

---

#### 🟡-2: Migration Pinia (si croissance app)

**Validation Gemini Q1** : useState suffisant MVP, Pinia si croissance

**Seuils déclencheurs** :
- État partagé > 5 modules distincts
- Actions asynchrones complexes multiples
- Besoin DevTools + time-travel debugging
- Équipe > 3 devs frontend

**Recommandation** : Réévaluer après Sprint 3-4

**Effort** : 🔴 12-16h (migration complète)

**Priorité Pareto** : 🟡 **ENHANCEMENT 80% - Réévaluer Q1 2026**

---

#### 🟡-3: Adoption TanStack Query (si besoins cache avancés)

**Validation Gemini Q4** : Over-engineering MVP, utile si complexité croît

**Seuils déclencheurs** :
- Cache invalidation complexe (> 10 query keys distincts)
- Mutations optimistes fréquentes
- Pagination infinie requise
- Refetch on focus/reconnect critique

**Recommandation** : Réévaluer après Sprint 5-6

**Effort** : 🔴 16-24h (migration + learning curve)

**Priorité Pareto** : 🟡 **ENHANCEMENT 80% - Roadmap Q2 2026**

---

### 📊 Récapitulatif Priorisation

| ID | Recommandation | Priorité | Effort | Impact Performance 3G | Sprint |
|----|---------------|----------|--------|----------------------|--------|
| 🔴-1 | Cache Cloudinary API | CRITIQUE | 2-3h | ⭐⭐⭐⭐⭐ | Sprint 0-1 |
| 🔴-2 | Refactor Transform Side-Effects | CRITIQUE | 1-2h | ⭐⭐⭐ | Sprint 0-1 |
| 🔴-3 | Unifier Error Handling | CRITIQUE | 2-4h | ⭐⭐ | Sprint 1 |
| 🟠-1 | Simplifier Strategy Pattern | IMPORTANT | 3-5h | ⭐ | Sprint 2-3 |
| 🟠-2 | Éliminer Duplication Zod | IMPORTANT | 1-2h | ⭐ | Sprint 2 |
| 🟡-1 | Tests Unitaires | NICE | 8-12h | - | Sprint 4+ |
| 🟡-2 | Migration Pinia | NICE | 12-16h | - | Q1 2026 |
| 🟡-3 | TanStack Query | NICE | 16-24h | - | Q2 2026 |

**Total effort Core 20% (Critiques)** : 5-9h ⚡ **PRIORITÉ ABSOLUE SPRINT 0-1**

**Total effort Important (Moyen)** : 4-7h 🟡 Sprint 2-3

**Total effort Enhancement 80%** : 36-52h 🔵 Roadmap long-terme

---

### 🎯 Plan d'Action Recommandé

#### Sprint 0 (Survie MVP) - 1 semaine
- [x] ✅ Audit architecture complet (ce document)
- [ ] 🔴-1 Cache Cloudinary API (2-3h) - **CRITIQUE PERFORMANCE**
- [ ] 🔴-2 Refactor Transform → watch() (1-2h) - **CRITIQUE MAINTENABILITÉ**

#### Sprint 1 (Stabilisation MVP) - 1-2 semaines
- [ ] 🔴-3 Unifier Error Handling (2-4h)
- [ ] 🟠-2 Éliminer Duplication Zod (1-2h)
- [ ] Tests manuels complets feature réalisations

#### Sprint 2-3 (Refactoring Qualité) - 2-3 semaines
- [ ] 🟠-1 Simplifier Strategy Pattern (3-5h) - Si temps disponible
- [ ] 🟡-1 Tests unitaires critiques (focus useRealisations, cache)

#### Q1 2026 (Roadmap)
- [ ] Réévaluer migration Pinia (si croissance équipe/app)
- [ ] Analyser métriques cache Cloudinary (hit rate, TTL optimal)

#### Q2 2026 (Innovation)
- [ ] Réévaluer TanStack Query (si besoins cache avancés)
- [ ] Audit performance global (Lighthouse, Railway Analytics)

---

**Dernière mise à jour** : 2025-11-15
**Auteur** : Claude Code (Anthropic) + Gemini 2.5 Flash (Google Search Grounding)
**Statut** : ✅ Audit complet terminé - Prêt pour implémentation Sprint 0-1
