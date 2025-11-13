# Résolution Finale: Cache Redis + Invalidation (Sprint 0)

**Date**: 2025-11-05
**Commit Final**: `b04b5e0` - Suppression cache Nitro automatique
**Statut**: ✅ RÉSOLU - Production validée

---

## 🎯 Problème Initial

**Symptôme rapporté**: Après implémentation du cache Redis manuel, les mises à jour de produits n'étaient visibles qu'après **exactement 5 minutes** (le TTL du cache), malgré les tentatives d'invalidation.

**Impact business**: Impossibilité de voir les modifications en temps réel dans l'interface admin, dégradant l'UX et créant confusion.

---

## 🔍 Cause Racine (Root Cause Analysis)

### Conflit de Systèmes de Cache

Le problème venait d'une **collision entre DEUX systèmes de cache**:

#### 1. Cache Nitro Automatique (Le Coupable)
```typescript
// nuxt.config.ts (AVANT - PROBLÉMATIQUE)
"/api/products/**": {
  cors: true,
  swr: 86400,  // ❌ Cache automatique 24h NON-INVALIDABLE
  headers: {
    "Cache-Control": "public, max-age=300...",
  },
}
```

- Créait automatiquement une clé: `nitro:routes:_:apiproducts.NjcJSqV4oa.json`
- Interceptait **TOUTES** les requêtes `/api/products/**` AVANT le handler
- **Non-invalidable** par `removeItem()` (clé générée différente)
- Cache de 24h qui empêchait le cache manuel de fonctionner

#### 2. Cache Manuel Redis (Notre Implémentation)
```typescript
// server/api/products/index.get.ts
const cacheKey = 'products:list:active'
await cacheStorage.setItem(cacheKey, products, { ttl: 300 })
// ...
await cacheStorage.removeItem(cacheKey) // ✅ Fonctionne, mais jamais atteint!
```

- Créait une clé: `products:list:active`
- Invalidable via `removeItem()`
- **Mais jamais atteint** car Nitro interceptait avant!

### Diagnostic avec Endpoints Debug

**Création de `/api/debug/redis-keys`** a révélé:
```json
{
  "storage": {
    "keys": [
      "nitro:routes:_:apiproducts.NjcJSqV4oa.json",  // ← Cache auto Nitro
      "products:list:active"                         // ← Cache manuel
    ]
  }
}
```

**Preuve du conflit**: Deux clés = deux systèmes qui s'ignorent mutuellement.

---

## ✅ Solution Implémentée

### Suppression du Cache Nitro Automatique

```typescript
// nuxt.config.ts (APRÈS - RÉSOLU)
"/api/products/**": {
  cors: true,
  // swr: 86400, // ❌ SUPPRIMÉ
  headers: {
    "Cache-Control": "no-store", // Pas de cache HTTP, seulement Redis manuel
    Vary: "Accept-Encoding",
  },
},
```

**Principe**: Un seul système de cache = Cache manuel Redis contrôlable.

### Architecture Finale

```
┌──────────────────────────────────────────────────────────┐
│ Client Request → /api/products                            │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Handler: index.get.ts       │
        │   (Pas d'interception Nitro)  │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │ useStorage('cache').getItem() │
        │   Key: "products:list:active" │
        └───────────────┬───────────────┘
                        │
           ┌────────────┴────────────┐
           │                         │
           ▼ HIT                     ▼ MISS
    ┌──────────────┐         ┌─────────────────┐
    │ Return Redis │         │ Fetch Turso DB  │
    │ (142ms)      │         │ (700-1400ms)    │
    └──────────────┘         └────────┬────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │ setItem(cache)  │
                             │ TTL: 300s       │
                             └─────────────────┘

UPDATE/DELETE mutations:
    ┌──────────────────────────────────┐
    │ PUT/POST/DELETE /api/admin/*     │
    └────────────┬─────────────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ removeItem('products:list:active')│
    │ → Invalidation Redis              │
    └───────────────────────────────────┘
```

---

## 🧪 Tests de Validation (Production Railway)

### Test 1: Cache HIT après MISS
```bash
# Premier appel (MISS)
curl "https://nuxt-app-production-8b86.up.railway.app/api/products"
# → {"source": "turso-normalized", "cached": false, "duration": 1342}

# Deuxième appel (HIT)
curl "https://nuxt-app-production-8b86.up.railway.app/api/products"
# → {"source": "nitro-cache-redis", "cached": true, "duration": 142}
```

✅ **Performance**: 1342ms → 142ms = **9.4x plus rapide**

### Test 2: Invalidation sur UPDATE
```bash
# 1. Créer cache
curl "/api/products"
# → Cache créé: "products:list:active"

# 2. Modifier produit
curl -X PUT "/api/admin/products/prod_xxx" -d '{"name":"Test"}'
# → Logs: "🗑️ Cache Redis invalidé avec succès"

# 3. Vérifier invalidation
curl "/api/debug/redis-keys"
# → {"keys": []} // ✅ Cache supprimé

# 4. Refetch données fraîches
curl "/api/products"
# → {"cached": false, "data": [{"name": "Test", ...}]}
```

✅ **Invalidation**: Cache supprimé, données fraîches fetchées

### Test 3: Logs Railway MCP

```log
ℹ️ [GET PRODUCTS] Cache MISS pour "products:list:active" - Fetch depuis Turso
🔍 [GET PRODUCTS] Tentative setItem - Products: 6, Taille: 5135 bytes
💾 [GET PRODUCTS] ✅ Cache Redis créé avec succès
⚡ [GET PRODUCTS] Cache HIT pour "products:list:active" - 6 produits en 142ms

[UPDATE produit...]

➡️ [PUT PRODUCT] Tentative d'invalidation cache Redis...
🗑️ [PUT PRODUCT] Cache Redis invalidé avec succès

ℹ️ [GET PRODUCTS] Cache MISS pour "products:list:active"
```

✅ **Cycle complet**: MISS → HIT → UPDATE → INVALIDATION → MISS

---

## 📊 Métriques de Performance

| Métrique | Avant (Bug) | Après (Fix) | Amélioration |
|----------|-------------|-------------|--------------|
| **Premier appel** | ~1342ms | ~1342ms | = (fetch DB) |
| **Appels suivants** | ~1342ms | **142ms** | **9.4x** |
| **Invalidation** | 5min (TTL) | Instantanée | **∞** |
| **Clés Redis** | 2 (conflit) | 1 (propre) | -50% |

---

## 🔧 Fichiers Modifiés

### Core Fix
- `apps/election-mvp/nuxt.config.ts` (lines 111-121)
  - Suppression `swr: 86400`
  - Ajout `Cache-Control: "no-store"`

### Diagnostic Endpoints (Conservés pour monitoring)
- `server/api/debug/redis-keys.get.ts` (NEW)
- `server/api/debug/redis-direct.get.ts` (NEW)

### Logging Amélioré
- `server/api/products/index.get.ts` (lines 96-112)
  - Try/catch autour de setItem avec logs détaillés
- `server/api/admin/products/[id].put.ts` (lines 159-168)
- `server/api/admin/products/index.post.ts`
- `server/api/admin/products/[id].delete.ts`

---

## 🎓 Leçons Apprises

### 1. Cache Layering Dangers
**Problem**: Multiples couches de cache peuvent créer des conflits subtils.
**Solution**: Un seul système contrôlable > Plusieurs systèmes automatiques.

### 2. Diagnostic Systématique
**Tools utilisés**:
- Endpoints debug custom (`/api/debug/redis-keys`)
- Railway MCP logs avec filtres
- Tests curl avec timestamps

**Pattern**: Toujours lister les clés Redis pour identifier conflits.

### 3. Nitro Route Rules
**Règle d'or**: Ne jamais combiner `swr` (cache auto) avec cache manuel dans le handler.

**Quand utiliser `swr`**:
- Routes 100% statiques (génération SSG)
- APIs sans mutations (read-only)
- Pas besoin d'invalidation dynamique

**Quand éviter `swr`**:
- APIs avec mutations (CRUD)
- Besoin d'invalidation sur événements
- Cache multi-instances (Redis, Upstash)

### 4. Railway Multi-Instance
Le cache Redis partagé garantit cohérence entre instances Railway, à condition qu'il soit le SEUL système de cache.

---

## 🚀 État Final du Système

### Configuration Production
```typescript
// Runtime
Redis: redis://redis.railway.internal:6379
Driver: ioredis (v5.8.2) via unstorage
Mode: Strict (pas de fallback memory)

// Cache Strategy
System: Manuel Redis uniquement
TTL: 300s (5min)
Invalidation: Événementielle (PUT/POST/DELETE)
Key: "products:list:active"
```

### Flux Complet Validé
1. ✅ **GET /api/products** → Cache MISS → Fetch Turso → setItem (5135 bytes)
2. ✅ **GET /api/products** → Cache HIT → Return Redis (142ms)
3. ✅ **PUT /api/admin/products/[id]** → Update DB → removeItem
4. ✅ **GET /api/products** → Cache MISS → Fetch Turso (données fraîches)

### UX Finale
- Admin modifie produit → Invalidation instantanée
- Liste produits rafraîchie automatiquement (via `refreshNuxtData()`)
- Pas de F5 requis
- Performance optimale (142ms cache hits)

---

## 📝 Commits Clés

1. **b217e8e** - Création endpoints diagnostic
2. **11ec70d** - Ajout try/catch logging setItem
3. **b04b5e0** - 🎯 **FIX FINAL**: Suppression cache Nitro auto

---

## ✅ Validation Finale

**Sprint 0 - Cache Redis**: COMPLET
**Performance**: ✅ < 500ms API (142ms HIT)
**Invalidation**: ✅ Instantanée
**Stabilité**: ✅ Production validée
**Documentation**: ✅ Complète

**Prêt pour Sprint 1 🚀**
