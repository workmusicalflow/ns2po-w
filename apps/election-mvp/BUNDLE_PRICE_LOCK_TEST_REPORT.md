# 📊 Bundle Price Lock - Rapport Tests E2E

**Date**: 2025-01-06 08:43 AM
**Suite**: `tests/e2e/admin/bundles-price-lock.spec.ts`
**Browser**: Chromium
**Résultat**: **2/10 PASSÉS** (20%)

---

## ✅ Tests PASSÉS (2/10)

### Scénario 2: Prix Fixe (`price_locked = 1`)

| Test | Statut | Durée | Description |
|------|--------|-------|-------------|
| **2.1** | ✅ PASS | 10.6s | Bundle utilise prix custom (pas catalogue) |
| **2.2** | ✅ PASS | 12.4s | Modification catalogue → Bundle reste figé |

**Validation**:
- ✅ POST insère correctement `custom_price` + `price_locked = 1`
- ✅ GET retourne `custom_price` via CASE WHEN
- ✅ Prix bundle **figé à 5500 FCFA** malgré catalogue à 5800 FCFA
- ✅ Prix bundle **maintenu à 5500 FCFA** après update catalogue → 6200 FCFA
- ✅ Cleanup `?force=true` fonctionne (plus de timeout)

---

## ❌ Tests ÉCHOUÉS (8/10)

### 🔴 Bug 1: CASE WHEN Auto-Sync (2 échecs)

**Tests impactés**: 1.1, 1.2

#### Test 1.1 - Bundle reflète prix initial du catalogue
```
Expected: 5800 (INITIAL_PRODUCT_PRICE)
Received: 5000 (ancien bundle_products.custom_price ?)
```

**Logs debug**:
```json
{
  "product_id": "prod_1762419907227_ups2jka",
  "custom_price": 5800,
  "price_locked": 0  // ← Auto-sync activé
}
```

**Problème**: Le CASE WHEN retourne `custom_price` même quand `price_locked = 0`.

#### Test 1.2 - Modification catalogue → Bundle auto-sync
```
Expected: 6200 (UPDATED_CATALOG_PRICE)
Received: 5800 (prix catalogue avant modification)
```

**Problème**: Le GET ne lit pas `products.base_price` du catalogue actuel.

---

### 🔴 Bug 2: Page UI `/admin/bundles/[id]` Manquante (6 échecs)

**Tests impactés**: 3.1, 3.2, 4.1, 5.1, 5.2, 6.1

Tous les tests UI échouent avec timeout 60s sur:
```typescript
await page.goto(`${TEST_BASE_URL}/admin/bundles/${bundleId}`)
await page.waitForLoadState('networkidle') // ❌ TIMEOUT
```

**Screenshots disponibles**:
- `test-results/admin-bundles-price-lock-�-2ba43-eckbox-visible-et-cliquable-chromium/test-failed-1.png`
- `test-results/admin-bundles-price-lock-⚠-52892-g-badge-visible-si-écart-5--chromium/test-failed-1.png`
- etc.

**Erreurs spécifiques**:
- **Test 3.1**: Checkbox `isChecked = true` au lieu de `false`
- **Test 3.2**: Label "🔒 Prix fixe" invisible après toggle
- **Test 4.1, 5.1, 5.2, 6.1**: Timeouts sur `waitForLoadState` ou `waitForSelector`

**Cause racine**: Page `/admin/bundles/[id].vue` n'existe pas ou ne charge pas correctement.

---

## 🎯 Plan de Résolution

### Phase 4.1.8: Fix Bug CASE WHEN Auto-Sync

**Fichier**: `apps/election-mvp/server/api/campaign-bundles/[id].get.ts`

**Solution**: Corriger SQL CASE WHEN (ligne ~80):
```sql
-- ❌ ACTUEL (incorrect)
CASE
  WHEN bp.price_locked = 1 AND bp.custom_price IS NOT NULL THEN bp.custom_price
  ELSE p.base_price
END as base_price

-- ✅ CORRECT
CASE
  WHEN bp.price_locked = 1 THEN bp.custom_price
  ELSE p.base_price  -- ← Toujours lire catalogue si price_locked = 0
END as base_price
```

**Impact**: Tests 1.1 et 1.2 passeront après ce fix.

---

### Phase 4.1.9: Créer Page UI Bundle Details

**Fichier**: `apps/election-mvp/pages/admin/bundles/[id].vue` (à créer)

**Fonctionnalités requises**:
1. ✅ Affichage détails bundle
2. ✅ Liste produits avec checkboxes price lock
3. ✅ Toggle checkbox → Sauvegarde state
4. ✅ Badge warning si écart prix > 5%
5. ✅ Tooltips informatifs (auto-sync vs prix fixe)

**Impact**: Tests 3.1, 3.2, 4.1, 5.1, 5.2, 6.1 passeront après développement.

---

## 📈 Progression Phase 4.1

| Phase | Statut | Résultat |
|-------|--------|----------|
| 4.1.1 | ✅ | Debug logs POST ajoutés |
| 4.1.2 | ✅ | Debug logs GET ajoutés |
| 4.1.3 | ✅ | Tests chromium exécutés |
| 4.1.4 | ✅ | Bug cleanup timeout identifié |
| 4.1.5 | ✅ | Cleanup fix (`?force=true`) |
| 4.1.6 | ✅ | Tests 2.1 et 2.2 validés |
| 4.1.7 | ✅ | Suite complète (2/10 passés) |
| **4.1.8** | ⏳ | **Fix CASE WHEN auto-sync** |
| **4.1.9** | ⏳ | **Créer page UI bundle details** |

---

## 🔍 Insights Techniques

### CASE WHEN Logic (SQL)

**Pareto 80/20 Application**:
- 80% bundles → Auto-sync (`price_locked = 0`) → Lire `products.base_price`
- 20% bundles → Prix figé (`price_locked = 1`) → Lire `bundle_products.custom_price`

**Problème actuel**: La condition `bp.custom_price IS NOT NULL` empêche auto-sync car custom_price est **toujours** défini lors de la création.

**Fix**: Retirer condition `IS NOT NULL`, se fier uniquement à `price_locked`.

### SQLite ID Reuse

**Problème résolu**: Les tests utilisaient des IDs réutilisés (167, 168...) d'anciens bundles non supprimés.

**Solution**: Cleanup `?force=true` bypass contraintes référentielles → Vraie suppression DB.

---

## 📝 Next Steps

1. **Immédiat**: Fixer CASE WHEN auto-sync (30 min)
2. **Court terme**: Créer page UI `/admin/bundles/[id].vue` (2-3h)
3. **Validation**: Re-run suite complète → Target 10/10 PASS

**Bloquants Phase 4.2**: Aucun — Migration Turso peut démarrer après 4.1.8.
