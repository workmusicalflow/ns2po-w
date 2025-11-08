# 🚀 Guide Migration Production - Price Lock Feature

**Date**: 2025-11-08
**Feature**: Price Lock (sync auto vs prix fixe pour bundles)
**Status**: ✅ **PRÊT POUR DÉPLOIEMENT**

---

## 📋 Prérequis

- [x] PUT handler optimisé (imports dynamiques) - `server/api/campaign-bundles/[id].put.ts`
- [x] Migrations SQL testées en local (SQLite)
- [x] Validation manuelle curl réussie
- [x] Documentation complète (`PRICE_LOCK_VALIDATION_REPORT.md`)
- [ ] Turso CLI login
- [ ] Railway variables env configurées

---

## 🔧 Étape 1 : Login Turso CLI

```bash
turso auth login
```

**Vérification**:
```bash
turso db list | grep ns2po-election-mvp
# Devrait afficher: ns2po-election-mvp (workmusicalflow)
```

---

## 💾 Étape 2 : Appliquer Migrations SQL

### Migration 006 : Ajouter `price_locked` column

**Fichier**: `server/database/migrations/006_add_price_locked.sql`

**Action**:
```bash
turso db shell ns2po-election-mvp < server/database/migrations/006_add_price_locked.sql
```

**Ce que ça fait**:
- ✅ Ajoute colonne `price_locked BOOLEAN DEFAULT 1` à `bundle_products`
- ✅ Crée index `idx_bundle_products_price_locked`
- ✅ Affiche validation counts (locked vs synced)

**Backward compatibility**:
- DEFAULT 1 = Prix figé (comportement actuel préservé)
- Tous les bundles existants auront `price_locked = 1`
- ❌ Aucune régression

**Output attendu**:
```
total_rows | locked_count | synced_count | null_count
    42    |      42      |      0       |     0

message
Migration 006: price_locked ajoutée avec succès ✅
```

---

### Migration 007 : Fix DEFAULT (1 → 0) pour Pareto 80/20

**Fichier**: `server/database/migrations/007_fix_price_locked_default.sql`

**Action**:
```bash
turso db shell ns2po-election-mvp < server/database/migrations/007_fix_price_locked_default.sql
```

**Ce que ça fait**:
1. Crée `price_locked_new` avec DEFAULT 0
2. Copie données: `price_locked_new = COALESCE(price_locked, 1)`
3. Drop ancienne colonne `price_locked`
4. Rename `price_locked_new` → `price_locked`
5. Recrée index

**Pattern Pareto**:
- 80% cas : `price_locked = 0` (auto-sync, DEFAULT)
- 20% cas : `price_locked = 1` (prix figé, opt-in)

**Backward compatibility**:
- Données existantes préservées avec `COALESCE(price_locked, 1)`
- Bundles actuels restent en mode "prix figé"
- Nouveaux bundles : auto-sync par défaut

**Output attendu**:
```
total_rows | locked_count | synced_count | auto_sync_% | locked_%
    42    |      42      |      0       |     0.0     |  100.0

message
Migration 007: price_locked DEFAULT fixed (1→0) pour Pareto 80/20 ✅
```

---

## ✅ Étape 3 : Validation Post-Migration

### Vérifier schéma

```bash
turso db shell ns2po-election-mvp "PRAGMA table_info(bundle_products);"
```

**Chercher ligne**:
```
price_locked | BOOLEAN | 0 | 0 | ...
```
✅ DEFAULT should be 0

### Vérifier données existantes

```bash
turso db shell ns2po-election-mvp "SELECT COUNT(*), SUM(price_locked) FROM bundle_products;"
```

**Interprétation**:
- `COUNT(*)` = total bundles
- `SUM(price_locked)` = nombre de bundles avec prix figé
- Si `SUM = COUNT` → Tous les bundles existants ont prix figé ✅

---

## 🚢 Étape 4 : Déploiement Railway

### Build production local (pré-validation)

```bash
pnpm type-check && pnpm lint && pnpm build
```

**Tous les checks doivent passer** avant deploy Railway.

### Variables Railway (si pas déjà configurées)

```bash
railway variables --set "RAILWAY_BETA_ENABLE_BUILD_V2=1"
railway variables --set "TURSO_DATABASE_URL=libsql://ns2po-election-mvp-workmusicalflow.aws-eu-west-1.turso.io"
railway variables --set "TURSO_AUTH_TOKEN=<YOUR_TOKEN>"
```

### Deploy Railway

```bash
railway up --detach
```

**Monitoring**:
```bash
railway logs --follow
```

**Chercher dans logs**:
```
✅ Bundle mis à jour avec succès: <id>
📡 Émission SSE pour bundle mis à jour: <name>
```

---

## 🧪 Étape 5 : Test Production (curl)

### Obtenir URL Railway

```bash
railway status | grep "URL"
# Exemple: https://ns2po-election-mvp.up.railway.app
```

### Test 1 : Créer bundle avec auto-sync (price_locked: false)

```bash
curl -X POST https://ns2po-election-mvp.up.railway.app/api/campaign-bundles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Prod Auto-Sync",
    "description": "Test Price Lock production",
    "targetAudience": "local",
    "estimatedTotal": 10000,
    "originalTotal": 10000,
    "products": [{
      "id": "<PROD_ID_EXISTANT>",
      "quantity": 2,
      "basePrice": 5000,
      "subtotal": 10000,
      "priceLocked": false
    }],
    "tags": ["test-prod"]
  }' | jq
```

**Résultat attendu**: `200 OK`, `success: true`

### Test 2 : Mettre à jour avec prix figé (price_locked: true)

```bash
curl -X PUT https://ns2po-election-mvp.up.railway.app/api/campaign-bundles/<BUNDLE_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Prod Auto-Sync",
    "description": "Test Price Lock production",
    "targetAudience": "local",
    "estimatedTotal": 10000,
    "originalTotal": 10000,
    "products": [{
      "id": "<PROD_ID_EXISTANT>",
      "quantity": 2,
      "basePrice": 5000,
      "subtotal": 10000,
      "priceLocked": true
    }],
    "tags": ["test-prod"]
  }' | jq
```

**Résultat attendu**: `200 OK`, `success: true`

### Test 3 : Vérifier persistance

```bash
curl https://ns2po-election-mvp.up.railway.app/api/campaign-bundles/<BUNDLE_ID> | jq '.data.products[0].priceLocked'
```

**Résultat attendu**: `true`

---

## 📊 Monitoring Production

### Railway Analytics

```bash
railway open
# Dashboard → Metrics → Requests/sec, Latency
```

**Métriques critiques**:
- Requests/sec > 1.5 (vs 0.61 pre-fix)
- Latency < 3s (vs 8.2s pre-fix)

### Logs temps réel

```bash
railway logs --follow | grep -E "(PUT|Bundle|price_locked)"
```

**Chercher**:
```
📦 PUT /api/campaign-bundles/<id>
✅ Bundle mis à jour avec succès: <id>
```

---

## ⚠️ Rollback Plan (si nécessaire)

### Si erreurs après migration

**Option 1: Rollback migration 007 (restaurer DEFAULT 1)**

```sql
ALTER TABLE bundle_products ADD COLUMN price_locked_rollback BOOLEAN DEFAULT 1;
UPDATE bundle_products SET price_locked_rollback = price_locked;
ALTER TABLE bundle_products DROP COLUMN price_locked;
ALTER TABLE bundle_products RENAME COLUMN price_locked_rollback TO price_locked;
```

**Option 2: Rollback complet (supprimer colonne)**

```sql
ALTER TABLE bundle_products DROP COLUMN price_locked;
```

⚠️ **Perte de données** : Tous les états price_locked seront perdus

### Rollback Railway deploy

```bash
railway rollback
```

---

## 📋 Checklist Déploiement

### Avant migration

- [ ] Backup Turso database (Railway snapshot)
- [ ] Login Turso CLI validé
- [ ] Migrations SQL validées en local
- [ ] Code production build sans erreurs

### Pendant migration

- [ ] Migration 006 appliquée ✅
- [ ] Migration 007 appliquée ✅
- [ ] Validation SQL post-migration ✅
- [ ] Schéma vérifié (DEFAULT 0) ✅

### Après migration

- [ ] Railway deploy réussi ✅
- [ ] Logs Railway sans erreurs ✅
- [ ] Test curl POST bundle (auto-sync) ✅
- [ ] Test curl PUT bundle (prix figé) ✅
- [ ] Vérification persistance GET ✅
- [ ] Métriques Railway normales ✅

---

## 🎯 KPIs Succès

| Métrique | Avant | Cible | Status |
|----------|-------|-------|--------|
| **Handler PUT success** | ❌ 500 silencieux | ✅ 200 OK | ⏳ À valider prod |
| **Latency PUT** | 8.2s | < 3s | ⏳ À valider prod |
| **Requests/sec** | 0.61 | > 1.5 | ⏳ À valider prod |
| **Price Lock persistance** | N/A | ✅ DB + API | ⏳ À valider prod |

---

## 📚 Références

- **PUT-HANDLER-500-RESOLUTION.md** - Debugging complet (48h)
- **PRICE_LOCK_VALIDATION_REPORT.md** - Validation manuelle curl
- **Migrations SQL** - `server/database/migrations/006*.sql`, `007*.sql`
- **Perplexity Session** - Solutions communautaires imports dynamiques
- **Gemini + 26 sources** - Best practices testing & deployment

---

## 🎉 Prochaines Étapes Post-Déploiement

1. ✅ **Validation production** (curl tests)
2. ✅ **Monitoring 24h** (Railway Analytics)
3. ✅ **Communication stakeholders** (feature Price Lock live)
4. 🔄 **Iteration Post-MVP**:
   - Tests E2E mockés (Playwright)
   - Investigate toast succès UI
   - Test mobile-chrome fallback prices

---

**Durée estimée migration**: 30-45 minutes
**Downtime**: ❌ ZÉRO (migrations non-destructives)
**Risk level**: 🟢 LOW (backward compatible, rollback plan)
