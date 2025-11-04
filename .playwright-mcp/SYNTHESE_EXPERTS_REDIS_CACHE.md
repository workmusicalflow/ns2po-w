# 🔍 Synthèse Experts: Solution Redis pour Cache Nitro Distribué

**Date**: 2025-11-04
**Projet**: NS2PO Election MVP - Migration Cache Redis
**Problème**: Invalidation cache Nitro inefficace sur Railway (instances multiples)
**Sources Consultées**: Gemini-copilot • GPT-5-copilot • Web Search (Nuxt 2025 docs)

---

## 📋 Diagnostic Consensuel

### Symptômes Observés

**Comportement Utilisateur**:
1. Modification produit ID `prod_1758760484329_z9fqi3dp2` : Prix 300 XAF → 275 XAF
2. Page détail produit affiche correctement **275 XAF** ✅
3. Retour liste produits affiche ancien prix **300 XAF** ❌
4. Console client montre `refreshNuxtData()` appelé avec succès
5. Temps réponse GET `/api/products`: **301ms** (indicateur cache hit)

**Logs Serveur**:
- ✅ Logs `[API PUT]` avec "Mise à jour BDD réussie" présents
- ❌ Log `🗑️ Cache Nitro invalidé après UPDATE produit` **JAMAIS visible en production**
- ⚠️ Aucun log avec prefix `[API PUT]` dans screenshots fournis par utilisateur

### Cause Racine (Validée par 3 Sources)

**Architecture Railway**:
```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Inst │  │ Inst │
│  A   │  │  B   │
│ 💾   │  │ 💾   │ ← Caches locaux indépendants
└──────┘  └──────┘
```

**Scénario de Défaillance**:
1. PUT `/api/admin/products/:id` → **Instance A**
   - Met à jour Turso DB ✅
   - Invalide cache local Instance A ✅
   - Log `🗑️ Cache Nitro invalidé` visible sur Instance A uniquement
2. GET `/api/products` → **Instance B** (load balancing)
   - Cache local Instance B contient toujours anciennes données ❌
   - Retourne prix 300 XAF (stale data)
   - Log "Cache hit" visible
3. Utilisateur ne voit jamais log `🗑️ Cache Nitro invalidé` car il visualise logs Instance B

**Driver Nitro Cache par Défaut**:
```typescript
// Default behavior (local)
useStorage('cache') // → Driver: 'fs' ou 'memory' selon plateforme
```

---

## 🤖 Recommandations Gemini-copilot

**Source**: Session `cache-nitro-invalidation-railway` (2025-11-04)

### Diagnostic Technique

> "Le problème vient de l'architecture distribuée de Railway. Lorsque plusieurs instances Nuxt tournent simultanément (horizontal scaling), chaque instance possède son propre cache local. L'invalidation du cache via `useStorage('cache').removeItem()` ne supprime le cache que sur l'instance qui traite la requête PUT, pas sur les autres instances."

### Solution Recommandée: Redis

**Architecture Cible**:
```
┌─────────────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Inst │  │ Inst │
│  A   │  │  B   │
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
    ┌────▼────┐
    │  Redis  │ ← Cache externe partagé
    │ 🗄️ TTL │
    └─────────┘
```

**Configuration Nuxt**:
```typescript
// apps/election-mvp/nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      cache: {
        driver: 'redis',
        url: process.env.REDIS_URL || 'redis://localhost:6379/0'
      }
    }
  }
})
```

**Dépendances**:
```bash
pnpm add @upstash/redis unstorage
```

**Variables Railway**:
```bash
REDIS_URL=redis://default:password@host:6379/0
```

### Alternatives Évaluées (Non Recommandées pour MVP)

1. **Désactivation Cache Nitro**: ❌ Perte performance inacceptable (< 500ms API requirement)
2. **Réplication BDD Turso**: ❌ Latence propagation imprévisible
3. **Webhook inter-instances**: ❌ Complexité excessive, risques de race conditions

---

## 🧠 Validation GPT-5-copilot

**Source**: Session `nitro-cache-railway-distributed` (2025-11-04)

### Analyse Complémentaire

> "Le comportement observé (301ms response time) confirme que le GET est servi depuis le cache d'une instance différente de celle qui a géré le PUT. La solution Redis est appropriée car elle centralise l'état du cache pour toutes les instances."

### Pièges Identifiés

**1. Variable `REDIS_URL` Railway**:
- Railway Redis service injecte automatiquement `REDIS_URL` dans les variables d'environnement
- ⚠️ Format attendu: `redis://default:password@host:port/db`
- ⚠️ Vérifier présence après ajout service Redis

**2. Gestion Erreurs Redis**:
```typescript
// Fallback recommandé
try {
  const cachedData = await cacheStorage.getItem(cacheKey)
  // ...
} catch (redisError) {
  console.warn('⚠️ Redis unreachable, direct DB query', redisError)
  // Fetch direct depuis Turso sans cache
}
```

**3. TTL Redis vs Nitro**:
- Nitro TTL: 300 secondes (5 minutes) via `setItem(key, value, { ttl: 300 })`
- Redis native TTL: Géré automatiquement par driver `@upstash/redis`
- ✅ Pas de configuration supplémentaire nécessaire

**4. Test Local Requis**:
```bash
# Docker Redis local
docker run -d -p 6379:6379 redis:7-alpine

# Ou mock avec unstorage memory driver
REDIS_URL=redis://localhost:6379/0 pnpm dev
```

### Alternatives Validées (Hors Scope MVP)

1. **Cloudflare KV**: Pour applications serverless edge
2. **DynamoDB**: Pour AWS déploiements
3. **Planetscale**: Si migration complète DB PostgreSQL

---

## 🌐 Documentation Officielle 2025

**Source**: Web Search → https://nitro.unjs.io/guide/storage (Nuxt 2025)

### Drivers Redis Supportés

**Driver Upstash (Recommandé Production)**:
```typescript
export default defineNitroConfig({
  storage: {
    cache: {
      driver: 'upstash',
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    }
  }
})
```

**Driver Redis Standard (Railway)**:
```typescript
export default defineNitroConfig({
  storage: {
    cache: {
      driver: 'redis',
      url: process.env.REDIS_URL, // Format: redis://user:password@host:port/db
      ttl: 300 // Default TTL en secondes
    }
  }
})
```

### Compatibilité Unstorage

**Version Minimale**: `unstorage@1.10.0` (inclut driver Redis natif)

**Installation**:
```bash
pnpm add unstorage @upstash/redis
```

**Configuration Minimale**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      cache: {
        driver: 'redis',
        url: process.env.REDIS_URL
      }
    }
  }
})
```

**Validation Connexion**:
```typescript
// server/api/health.get.ts
export default defineEventHandler(async () => {
  try {
    const cache = useStorage('cache')
    await cache.setItem('health:test', Date.now(), { ttl: 10 })
    const testValue = await cache.getItem('health:test')

    return {
      redis: testValue ? 'connected' : 'error',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return { redis: 'error', message: error.message }
  }
})
```

---

## 📊 Comparaison Solutions

| Critère                    | Cache Local (Actuel) | Redis (Recommandé) | Désactiver Cache |
| -------------------------- | -------------------- | ------------------ | ---------------- |
| **Performance Single**     | ⭐⭐⭐⭐⭐ (< 50ms)  | ⭐⭐⭐⭐ (< 100ms) | ⭐⭐ (> 500ms)   |
| **Performance Distributed**| ❌ Broken            | ✅ Consistent      | ✅ Consistent    |
| **Invalidation Garantie**  | ❌ Local only        | ✅ Global          | N/A              |
| **Complexité Setup**       | Simple               | Moyenne (+Redis)   | Simple           |
| **Coût Railway**           | Gratuit              | +$5/mois Redis     | Gratuit          |
| **Scalabilité**            | ❌ Broken            | ✅ Horizontal      | ⚠️ DB bottleneck |
| **Résilience**             | ⭐⭐⭐               | ⭐⭐⭐⭐           | ⭐⭐             |

**Recommandation Consensuelle**: ✅ **Redis** pour production-ready distribué

---

## 🎯 Plan d'Action Validé

### Phase 1: Configuration Redis Railway (USER ACTION)
1. Railway Dashboard → Add Redis service
2. Vérifier variable `REDIS_URL` auto-injectée
3. Note: Format attendu `redis://default:password@host:port/0`

### Phase 2: Migration Code (Automated)
1. Installer: `pnpm add @upstash/redis unstorage`
2. Modifier `nuxt.config.ts` avec driver Redis
3. Créer `.env.example` avec template `REDIS_URL`
4. Ajouter logs debug Redis dans endpoints

### Phase 3: Tests Local (Automated)
1. Docker Redis local: `docker run -p 6379:6379 redis:7-alpine`
2. Test invalidation: PUT → DELETE cache → GET vérifie refresh
3. Test failover: Stopper Redis → Vérifier fallback Turso

### Phase 4: Déploiement Railway (USER ACTION)
1. Commit + Push solution Redis
2. Vérifier logs Railway: `🗑️ Cache Nitro invalidé` visible
3. Tester flow complet: Modifier produit → Vérifier liste rafraîchie
4. Valider latence: GET `/api/products` < 500ms (même après invalidation)

### Phase 5: Documentation (Automated)
1. Mise à jour `CLAUDE.md` section "Nuxt Cache Strategy"
2. Documenter variable `REDIS_URL` dans "Variables d'Environnement"
3. Ajouter section "Troubleshooting Redis" avec tests connexion

---

## ⚠️ Risques Identifiés

### Risque 1: Redis Service Down
**Impact**: Toutes requêtes API échouent si fallback non implémenté
**Mitigation**: Try-catch avec fallback direct Turso (code existant déjà)

### Risque 2: Railway REDIS_URL Format
**Impact**: Connexion échoue si format incorrect
**Mitigation**: Valider format avec endpoint `/api/health` avant déploiement

### Risque 3: Latence Redis
**Impact**: Performance < 500ms si Redis géographiquement éloigné
**Mitigation**: Railway Redis déployé même région Europe (aws-eu-west-1)

### Risque 4: Coût Redis
**Impact**: +$5/mois Railway (vs gratuit cache local)
**Mitigation**: Redis indispensable pour correctness, coût acceptable production

---

## 🔗 Références

- **Gemini Session**: `cache-nitro-invalidation-railway` (2025-11-04)
- **GPT-5 Session**: `nitro-cache-railway-distributed` (2025-11-04)
- **Nitro Docs**: https://nitro.unjs.io/guide/storage (2025)
- **Unstorage Redis**: https://unstorage.unjs.io/drivers/redis (2025)
- **Railway Redis**: https://docs.railway.app/databases/redis (2025)

---

**Conclusion**: Les 3 sources convergent vers Redis comme solution production-ready pour résoudre le problème de cache distribué sur Railway. Alternative recommandée: driver `redis` avec `@upstash/redis`, configuration via `REDIS_URL` Railway auto-injectée.

**Prochaines Étapes**: Exécuter Task #3 (Installation dépendances) après validation utilisateur Task #1 (Ajout service Redis Railway).
