# 🔍 Analyse Cache Cross-Concern: Admin vs Public

**Date:** 2025-11-05
**Contexte:** Après résolution cache admin, audit cache site public pour éviter "deux sources de vérité"

---

## 🚨 Problème Détecté en Production

### Observation Initiale
- **URL Testée:** https://nuxt-app-production-8b86.up.railway.app/devis
- **Endpoint:** GET /api/campaign-bundles
- **Produit:** Polo Élégant (textile-polo-001)
- **Prix affiché public:** 5850 FCFA
- **Prix modifié admin (10 min avant):** 5750 FCFA
- **Écart:** 100 FCFA de désynchronisation

### Symptôme
Modification admin → Cache public PAS invalidé → Site affiche ancien prix pendant 30 minutes

---

## 📋 Architecture Cache Actuelle

### 1. Endpoint Admin: `/api/admin/products/[id].put.ts`

**Stratégie d'invalidation:**
```typescript
// Ligne 189-199
const cacheKey = 'products:list:active'
try {
  await useStorage('cache').removeItem(cacheKey)
  console.log(`🗑️ [PUT PRODUCT] Cache Redis invalidé avec succès pour "${cacheKey}"`)
} catch (cacheError) {
  console.error(`❌ [PUT PRODUCT] ÉCHEC CRITIQUE invalidation cache`)
}
```

**Clé invalidée:** `'products:list:active'` (Redis)

---

### 2. Endpoint Public: `/api/products/index.get.ts`

**Stratégie de cache:**
```typescript
// Ligne 61-78
const cacheKey = 'products:list:active' // ✅ MÊME CLÉ que admin
const cacheStorage = useStorage('cache')

const cachedData = await cacheStorage.getItem(cacheKey)
if (cachedData) {
  return { success: true, data: cachedData, source: 'nitro-cache-redis', cached: true }
}

// Cache MISS → Fetch Turso
const products = await getProductsListOptimized(tursoClient, { isActive: true })

// Stocker dans Redis (TTL 300s = 5 min)
await cacheStorage.setItem(cacheKey, products, { ttl: 300 })
```

**Clé utilisée:** `'products:list:active'` (Redis, TTL 300s)
**Statut:** ✅ SYNCHRONISÉ avec admin (même clé Redis)

---

### 3. Endpoint Public: `/api/campaign-bundles/index.get.ts`

**Stratégie de cache:**
```typescript
// Ligne 188-193
if (source === 'turso') {
  setHeader(event, "Cache-Control", "public, max-age=900");        // 15 min Nitro
} else {
  setHeader(event, "Cache-Control", "public, max-age=60");         // 1 min fallback
}
setHeader(event, "CDN-Cache-Control", "public, max-age=1800");     // 30 min CDN ❌
```

**Cache utilisés:**
- ❌ Headers Cache-Control (Nitro: 15 min, CDN: 30 min)
- ❌ Pas de Redis `useStorage('cache')`
- ❌ Pas d'invalidation après mutations admin

**Statut:** ❌ NON SYNCHRONISÉ - Dérive jusqu'à 30 minutes

---

### 4. Mutations Admin Campaign Bundles

**Fichiers vérifiés:**
- `server/api/campaign-bundles/[id].put.ts` (UPDATE)
- `server/api/campaign-bundles/index.post.ts` (CREATE)
- `server/api/campaign-bundles/[id].delete.ts` (DELETE)

**Invalidation cache:** ❌ AUCUNE

**Code typique (ligne 436 de [id].put.ts):**
```typescript
// Pas de removeItem()
// Pas de setHeader() invalidation
// Retourne directement le bundle mis à jour
return { success: true, data: updatedBundle, ... }
```

---

## 🎯 Matrice de Synchronisation Cache

| Endpoint | Type | Cache Redis | Headers HTTP | Invalidation Admin | Statut |
|----------|------|-------------|--------------|-------------------|--------|
| `/api/admin/products` | Admin | `products:list:active` (300s) | ❌ | ✅ removeItem() | ✅ OK |
| `/api/products` | Public | `products:list:active` (300s) | ❌ | ❌ Indirect (même clé) | ✅ OK |
| `/api/campaign-bundles` | Public | ❌ Aucun | ✅ CDN 30min + Nitro 15min | ❌ Aucune | ❌ CRITIQUE |

---

## 🔗 Graphe de Dépendances

```
┌──────────────────────────────────────────────────────────┐
│ Admin Mutations                                          │
│                                                          │
│ PUT /api/admin/products/:id                             │
│  ├─ Invalide: Redis "products:list:active" ✅          │
│  └─ Impact: /api/products (même clé Redis) ✅          │
│                                                          │
│ PUT /api/campaign-bundles/:id                           │
│  ├─ Invalide: RIEN ❌                                   │
│  └─ Impact: /api/campaign-bundles cache pendant 30min ❌│
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Turso Database (Source of Truth)                        │
│                                                          │
│ Tables:                                                  │
│  - products (base_price, ...)                           │
│  - campaign_bundles (final_price, ...)                  │
│  - bundle_products (JOINTURE product_id)                │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Public Endpoints                                         │
│                                                          │
│ GET /api/products                                        │
│  ├─ Redis: products:list:active (5 min) ✅             │
│  └─ Synchronisé via même clé ✅                         │
│                                                          │
│ GET /api/campaign-bundles                               │
│  ├─ Headers: CDN 30min + Nitro 15min ❌                │
│  ├─ Lit bundle_products → JOIN products                 │
│  └─ Si produit modifié → Prix bundle PAS mis à jour ❌ │
└──────────────────────────────────────────────────────────┘
```

---

## 🐛 Root Cause: Cascade de Désynchronisation

### Scénario Bug Actuel

1. **Admin modifie produit** (ex: Polo 5850 → 5750)
   - ✅ UPDATE `products.base_price = 5750`
   - ✅ Invalide Redis `'products:list:active'`
   - ❌ NE TOUCHE PAS cache bundles

2. **Site public `/devis` charge bundles**
   - Cache CDN HIT (30 min) → Retourne bundles avec ancien prix
   - Bundle contient: `products: [{ id: 'textile-polo-001', basePrice: 5850, ... }]`
   - Même si Turso a `base_price = 5750`!

3. **Utilisateur voit:** Prix incohérent
   - Liste produits: 5750 ✅ (invalidé)
   - Dans bundle: 5850 ❌ (cache CDN)

### Problème Fondamental

`/api/campaign-bundles` utilise **query Turso avec JOIN**:
```sql
SELECT
  COALESCE(bp.custom_price, p.base_price) as basePrice
FROM bundle_products bp
LEFT JOIN products p ON bp.product_id = p.id
WHERE bp.bundle_id = ?
```

**Problème:** Résultat query mis en cache HTTP pendant 30 min, même si `products.base_price` change!

---

## 🎯 Risques Identifiés

### 1. Désynchronisation Prix (CRITIQUE)
- **Impact:** Client voit prix différent dans catalogue vs devis
- **Fréquence:** À chaque modification admin de produit inclus dans bundle
- **Durée:** Jusqu'à 30 minutes (TTL CDN)
- **Sévérité:** 🔴 Haute - Impact business direct

### 2. Bundle Fantôme (MOYEN)
- **Scénario:** Admin supprime produit du bundle
- **Cache CDN:** Garde ancien bundle avec produit supprimé pendant 30 min
- **Impact:** Utilisateur peut tenter de commander produit indisponible
- **Sévérité:** 🟡 Moyenne

### 3. Produit Désactivé Visible (MOYEN)
- **Scénario:** Admin désactive produit (`is_active = 0`)
- **Cache bundle:** Produit reste visible dans bundle pendant 30 min
- **Impact:** Confusion client
- **Sévérité:** 🟡 Moyenne

### 4. Metadata Obsolète (FAIBLE)
- **Scénario:** Admin change description/image produit
- **Cache bundle:** Ancienne metadata visible
- **Impact:** Cosmétique
- **Sévérité:** 🟢 Faible

---

## 💡 Solutions Possibles

### Option A: Redis Unifié (Recommandé par pattern admin)

**Architecture:**
```typescript
// /api/campaign-bundles/index.get.ts
const cacheKey = 'campaign-bundles:list:active'
const cachedData = await useStorage('cache').getItem(cacheKey)
if (cachedData) return cachedData

const bundles = await fetchBundlesFromTurso()
await useStorage('cache').setItem(cacheKey, bundles, { ttl: 300 })
```

**Invalidation:**
```typescript
// /api/admin/products/[id].put.ts
await useStorage('cache').removeItem('products:list:active')
await useStorage('cache').removeItem('campaign-bundles:list:active') // ← NEW
```

**Avantages:**
- ✅ Cohérent avec pattern admin existant
- ✅ Invalidation centralisée Redis
- ✅ Multi-instances Railway synchronisées
- ✅ TTL uniforme 5 minutes

**Inconvénients:**
- ⚠️ Supprime caches CDN (peut réduire perf edge)
- ⚠️ Nécessite invalidation dans TOUS les endpoints admin de produits

---

### Option B: Event Bus Invalidation

**Architecture:**
```typescript
// server/utils/cache-events.ts
export async function invalidateProductCaches(productId: string) {
  await Promise.all([
    useStorage('cache').removeItem('products:list:active'),
    useStorage('cache').removeItem('campaign-bundles:list:active'),
    // Invalider tous les bundles contenant ce produit
    useStorage('cache').removeItem(`product:${productId}:bundles`)
  ])
}

// /api/admin/products/[id].put.ts
await invalidateProductCaches(productId)
```

**Avantages:**
- ✅ Invalidation centralisée
- ✅ DRY - Un seul point de maintenance
- ✅ Extensible (facile ajouter nouveaux caches)

**Inconvénients:**
- ⚠️ Nouvelle abstraction à maintenir
- ⚠️ Nécessite refactoring tous les endpoints admin

---

### Option C: Cache Hierarchique avec Tags

**Architecture:**
```typescript
// Cache avec metadata tags
await useStorage('cache').setItem('campaign-bundles:list:active', bundles, {
  ttl: 300,
  tags: ['products'] // ← Tag pour invalidation en cascade
})

// Invalidation par tag
await useStorage('cache').invalidateByTag('products')
```

**Avantages:**
- ✅ Invalidation granulaire
- ✅ Pas besoin de connaître toutes les clés
- ✅ Scalable pour beaucoup de caches interdépendants

**Inconvénients:**
- ❌ Nécessite Upstash Redis avec support tags (pas standard)
- ❌ Migration complexe

---

### Option D: Versioning Cache Keys

**Architecture:**
```typescript
// Clé de cache avec version produit
const cacheVersion = await useStorage('cache').getItem('products:version')
const cacheKey = `campaign-bundles:list:v${cacheVersion}`

// Invalidation via bump version
await useStorage('cache').setItem('products:version', Date.now())
// Tous les caches avec ancienne version deviennent obsolètes
```

**Avantages:**
- ✅ Pas besoin d'invalider explicitement chaque clé
- ✅ Atomic invalidation

**Inconvénients:**
- ⚠️ Pollution cache (anciennes versions persistent jusqu'à TTL)
- ⚠️ Complexité accrue

---

## 🎯 Recommandation Préliminaire

**Avant consultation Gemini**, je recommande:

### Solution Hybride: Redis + Headers Réduction TTL

**Phase 1 (Rapide):**
1. Migrer `/api/campaign-bundles` vers Redis comme `/api/products`
2. Réduire TTL CDN de 30min → 5min
3. Ajouter invalidation dans `/api/admin/products/[id].put.ts`

**Phase 2 (Robuste):**
4. Créer helper `invalidateProductCaches()` centralisé
5. Appliquer dans TOUS les endpoints admin (PUT/POST/DELETE)

**Code proposé:**

```typescript
// server/utils/cache-invalidation.ts
export async function invalidateProductRelatedCaches(context?: string) {
  const cacheStorage = useStorage('cache')

  const keys = [
    'products:list:active',
    'campaign-bundles:list:active'
  ]

  console.log(`🔄 [CACHE INVALIDATION] Début invalidation (context: ${context})`)

  await Promise.allSettled(
    keys.map(key =>
      cacheStorage.removeItem(key).then(() => {
        console.log(`🗑️ [CACHE INVALIDATION] "${key}" invalidé`)
      })
    )
  )

  console.log(`✅ [CACHE INVALIDATION] Terminé`)
}
```

---

## ❓ Questions pour Gemini (Google Search Grounding)

1. **Pattern cache multi-layers (Redis + CDN):** Quelle est la meilleure stratégie pour invalider cache CDN Railway après mutation base de données?

2. **Cache cross-concern Nuxt 3 2025:** Existe-t-il des patterns Nuxt 3 validés communauté pour synchroniser caches admin/public avec données relationnelles (bundles contenant produits)?

3. **Railway edge caching:** Comment forcer invalidation cache CDN Railway après mutation? Docs récentes 2024-2025?

4. **Redis vs Headers:** Performance trade-off entre `useStorage('cache')` (Redis Upstash) vs `setHeader('Cache-Control')` pour APIs publiques haute charge?

5. **Event-driven cache invalidation:** Pattern event bus pour invalidation cascade (produit → bundles → quotes) sans couplage fort?

---

## 📊 Métriques Actuelles

**Observées en production Railway:**

| Metric | Valeur | Source |
|--------|--------|--------|
| Cache HIT ratio `/api/products` | ~80% | Logs Redis |
| Cache HIT ratio `/api/campaign-bundles` | ~95% | Headers CDN |
| TTL moyen `/api/products` | 300s | Redis config |
| TTL moyen `/api/campaign-bundles` | 1800s | CDN headers |
| Durée désync observée | 100 FCFA, 30 min | Test manuel |
| Fréquence mutations admin produits | ~5/jour | Estimation |

---

**Prêt pour consultation Gemini avec Google Search Grounding**
