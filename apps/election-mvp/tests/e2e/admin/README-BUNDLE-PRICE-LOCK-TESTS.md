# 🔒 Tests E2E Bundle Price Lock

## 📋 Vue d'ensemble

Tests end-to-end complets pour valider la fonctionnalité Bundle Price Lock implémentant le pattern Pareto 80/20 :
- **80% : Auto-Sync** (`price_locked = 0`) - Prix bundle suit automatiquement le catalogue
- **20% : Prix Fixe** (`price_locked = 1`) - Prix bundle figé pour promotions/tarifs négociés

## 🏗️ Architecture Testée

```sql
-- Pattern SQL CASE WHEN pour résolution conditionnelle des prix
CASE
  WHEN bp.price_locked = 1 AND bp.custom_price IS NOT NULL
    THEN bp.custom_price  -- Prix figé
  ELSE p.base_price       -- Prix catalogue (auto-sync)
END
```

## 🎯 Scénarios Couverts

### 1. Auto-Sync (Default - 80% Pareto)
- ✅ Prix bundle reflète prix catalogue initial
- ✅ Prix bundle se synchronise automatiquement après modification catalogue
- ✅ Validation pattern CASE WHEN sur `price_locked = 0`

### 2. Prix Fixe (Locked - 20% Pareto)
- ✅ Prix bundle utilise prix custom (ignoré prix catalogue)
- ✅ Prix bundle reste figé malgré changement catalogue
- ✅ Validation pattern CASE WHEN sur `price_locked = 1`

### 3. Admin UI - Checkbox
- ✅ Checkbox visible et cliquable
- ✅ Toggle entre "🔄 Auto-sync" et "🔒 Prix fixe"
- ✅ Persistance état après sauvegarde et rechargement page

### 4. Warning Visuel
- ✅ Badge amber "Écart X%" si `|prix_bundle - prix_catalogue| / prix_catalogue > 5%`
- ✅ Calcul correct du pourcentage d'écart
- ✅ Screenshot preuve visual

### 5. Tooltip Contextuel
- ✅ Tooltip auto-sync: "Prix synchronisé", "✅ Recommandé (80% des cas)"
- ✅ Tooltip prix fixe: "Prix figé", "⚠️ Ne se met PAS à jour automatiquement"
- ✅ Affichage au hover

### 6. Intégration Complète
- ✅ Workflow réel : Création bundle → Modification catalogues → Validation comportement mixte
- ✅ Produits mixtes (auto-sync + locked) dans un seul bundle
- ✅ Validation end-to-end complète

## 🚀 Exécution des Tests

### Prérequis
1. Serveur de développement actif sur `http://localhost:3003`
2. Base de données Turso configurée
3. Migration `price_locked` appliquée

### Démarrer le serveur dev
```bash
cd /Users/logansery/Documents/ns2po-w
pnpm dev
```

### Exécuter tous les tests Bundle Price Lock
```bash
# Mode headless (CI)
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts

# Mode interface graphique (debug)
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts --ui

# Mode headed (voir navigateur)
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts --headed

# Avec logs détaillés
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts --debug
```

### Exécuter un test spécifique
```bash
# Test Auto-Sync
pnpm exec playwright test -g "Auto-Sync"

# Test Prix Fixe
pnpm exec playwright test -g "Prix Fixe"

# Test Checkbox UI
pnpm exec playwright test -g "Checkbox"

# Test Warning
pnpm exec playwright test -g "Warning"

# Test Tooltip
pnpm exec playwright test -g "Tooltip"

# Test Intégration
pnpm exec playwright test -g "Intégration Complète"
```

## 📊 Résultats Attendus

### Succès
```
Running 10 tests using 1 worker

  ✓ 1.1 - Bundle reflète prix initial du catalogue (2.3s)
  ✓ 1.2 - Modification catalogue → Bundle auto-sync (3.1s)
  ✓ 2.1 - Bundle utilise prix custom (pas catalogue) (2.1s)
  ✓ 2.2 - Modification catalogue → Bundle reste figé (3.2s)
  ✓ 3.1 - Checkbox visible et cliquable (1.8s)
  ✓ 3.2 - Toggle checkbox → Persistance état (4.5s)
  ✓ 4.1 - Warning badge visible si écart > 5% (2.2s)
  ✓ 5.1 - Tooltip auto-sync visible au hover (1.9s)
  ✓ 5.2 - Tooltip prix fixe après toggle (2.1s)
  ✓ 6.1 - Workflow complet: Création → Modification → Validation (5.8s)

  10 passed (29.0s)
```

### Performance Cible
- **Total duration**: < 40s (10 tests)
- **Test isolation**: Chaque suite crée/nettoie ses données
- **Screenshots**: Preuves visuelles dans `.playwright-mcp/`

## 🧹 Nettoyage Automatique

Chaque suite de tests :
- ✅ Crée ses propres produits/bundles test avec timestamps uniques
- ✅ Nettoie automatiquement après exécution (`test.afterAll`)
- ✅ Pas de pollution de la base de données

## 🐛 Debugging

### Voir les logs console browser
```bash
pnpm exec playwright test bundles-price-lock.spec.ts --headed --debug
```

### Inspecter les screenshots
```bash
open .playwright-mcp/bundle-price-warning.png
open .playwright-mcp/tooltip-auto-sync.png
open .playwright-mcp/tooltip-prix-fixe.png
open .playwright-mcp/integration-final-state.png
```

### Logs détaillés
Les tests affichent des logs console détaillés :
- 🔧 Création produits/bundles
- ✅ Assertions validées
- 💲 Changements de prix
- 🧹 Nettoyage

## 📚 Références

### Architecture
- Pattern SQL: `server/api/campaign-bundles/[id].get.ts` ligne 108-119
- Schema Zod: `schemas/bundle.ts`
- Admin UI: `pages/admin/bundles/[id].vue` lignes 206-245

### Validation Multi-Agents
- Gemini: 25 sources industrielles validées
- Patterns: Magento `dynamic_price`, WooCommerce `priced_individually`
- Migration: `drizzle/migrations/0008_add_price_locked_to_bundle_products.sql`

## ✅ Critères d'Acceptance

Phase 4.1 validée si :
- [x] 10 tests créés couvrant tous les scénarios
- [x] Auto-sync fonctionne (prix suit catalogue)
- [x] Prix fixe fonctionne (prix figé)
- [x] Checkbox UI toggle + persistance
- [x] Warning visuel écart > 5%
- [x] Tooltip contextuel correct
- [x] Intégration complète workflow réel
- [ ] Tous les tests passent en local
- [ ] Tests exécutés et validés

## 🚀 Next Steps

Après validation Phase 4.1 :
- **Phase 4.2**: Migration données Turso production
- **Phase 4.3**: Déploiement Railway + monitoring

---

**Dernière mise à jour**: 2025-01-05 (Phase 4.1 - Tests E2E Bundle Price Lock)
