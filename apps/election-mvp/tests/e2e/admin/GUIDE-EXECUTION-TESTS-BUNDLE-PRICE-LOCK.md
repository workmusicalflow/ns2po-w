# 🧪 Guide d'Exécution - Tests Bundle Price Lock

**Feature**: Bundle Price Lock (Pareto 80/20 - Auto-Sync vs Prix Fixe)
**Fichier**: `tests/e2e/admin/bundles-price-lock.spec.ts`
**Total**: 30 tests (10 scénarios × 3 browsers)
**Validation**: Gemini + Google Search Grounding (28 sources Playwright 2025)

---

## 📊 Problème Résolu

**Issue**: Sortie de 30 tests = centaines de lignes difficiles à analyser
**Solution**: Découpage modulaire via browsers, scénarios ou tests individuels

---

## 🚀 Méthode Automatisée (ULTRA-RECOMMANDÉ)

**Script avec capture automatique dans fichiers** - Zéro copier-coller !

### Utilisation

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp/tests/e2e/admin
./run-bundle-price-lock-tests.sh
```

**Menu interactif** :

```
Quelle stratégie d'exécution ?

  1) Chromium uniquement (10 tests, ~3min)
  2) Firefox uniquement (10 tests, ~3min)
  3) Mobile Chrome uniquement (10 tests, ~3min)
  4) Tous les browsers séquentiellement (30 tests, ~10min)
  5) Mode Debug (Chromium avec Playwright Inspector)
  6) Quitter

Votre choix [1-6]:
```

**Avantages** :
- ✅ **Sortie capturée automatiquement** dans `test-results-bundle-price-lock/`
- ✅ **Rapport synthétique** Markdown généré
- ✅ **Métadonnées** (timestamp, durée, status)
- ✅ **Format lisible** pour analyse Claude
- ✅ **Zéro copier-coller** nécessaire

### Fichiers Générés

Chaque exécution crée :

```
test-results-bundle-price-lock/
├── 20251105-143022-chromium.txt      # Sortie complète lisible
├── 20251105-143022-chromium.json     # Métadonnées parsables
└── 20251105-143022-RAPPORT.md        # Synthèse de la session
```

### Partage avec Claude

```bash
# Afficher le fichier (puis copier-coller dans chat)
cat test-results-bundle-price-lock/20251105-143022-chromium.txt
```

**Le fichier est pré-formaté** avec métadonnées, résumé et horodatage.

---

## ⭐ Stratégie 1 : Par Browser (Manuel)

**Avantages**:
- ✅ Sortie 10× plus petite (10 tests au lieu de 30)
- ✅ Aucune modification code nécessaire
- ✅ Détection bugs browser-specific rapide
- ✅ Parallélisable (3 terminaux simultanés)

**Durée par browser**: ~3-4 minutes
**Sortie attendue**: ~20-30 lignes

### Commandes

#### 1️⃣ Chromium (Desktop)

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --project=chromium \
  --reporter=line
```

#### 2️⃣ Firefox (Desktop)

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --project=firefox \
  --reporter=line
```

#### 3️⃣ Mobile Chrome (Responsive)

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --project="mobile-chrome" \
  --reporter=line
```

---

## 🎯 Stratégie 2 : Par Scénario (Granulaire)

**Avantages**:
- ✅ Focus sur une fonctionnalité précise
- ✅ Sortie groupée par comportement métier
- ✅ Idéal pour debugging feature-specific

**Durée par scénario**: ~2-3 minutes
**Sortie attendue**: 3-6 tests

### Commandes

#### Scénario 1 : Auto-Sync (Default - 80% Pareto)
**Comportement**: Prix bundle suit automatiquement le catalogue
**Tests**: 2 × 3 browsers = 6 tests

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --grep "Auto-Sync" \
  --reporter=line
```

#### Scénario 2 : Prix Fixe (Locked - 20% Pareto)
**Comportement**: Prix bundle figé malgré changement catalogue
**Tests**: 2 × 3 browsers = 6 tests

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --grep "Prix Fixe" \
  --reporter=line
```

#### Scénario 3 : Checkbox UI
**Comportement**: Toggle admin + persistance état
**Tests**: 2 × 3 browsers = 6 tests

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --grep "Checkbox" \
  --reporter=line
```

#### Scénario 4 : Warning Visuel
**Comportement**: Badge rouge si écart prix > 5%
**Tests**: 1 × 3 browsers = 3 tests

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --grep "Warning" \
  --reporter=line
```

#### Scénario 5 : Tooltip + Intégration
**Comportement**: Info contextuelle + workflow complet
**Tests**: ~9 tests

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --grep "Tooltip|Intégration" \
  --reporter=line
```

---

## 🔬 Stratégie 3 : Test Individuel (Ultra-Précis)

**Avantages**:
- ✅ Debugging ultra-ciblé
- ✅ Reproductibilité maximale
- ✅ Idéal pour fix de régression

**Durée**: ~30 secondes par test
**Sortie attendue**: 1-3 lignes

### Commandes Exemples

#### Test 1.1 - Chromium uniquement

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --grep "1.1 - Bundle reflète prix initial du catalogue" \
  --project=chromium \
  --reporter=line
```

#### Test 2.2 - Tous browsers

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --grep "2.2 - Modification catalogue → Bundle reste figé" \
  --reporter=line
```

---

## 🛠️ Commandes Avancées

### Mode Debug (Playwright Inspector)

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
PWDEBUG=1 pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --project=chromium
```

### Mode UI (Interface Graphique)

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --ui
```

### Relancer uniquement les tests échoués

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --last-failed \
  --reporter=line
```

### Test de flakiness (10 exécutions)

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --project=chromium \
  --repeat-each=10 \
  --reporter=line
```

### Rapport HTML complet

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp && \
pnpm exec playwright test tests/e2e/admin/bundles-price-lock.spec.ts \
  --reporter=html

# Ouvrir le rapport
pnpm exec playwright show-report
```

---

## 📋 Checklist Pre-Execution

Avant de lancer les tests, vérifier :

- [ ] Serveur dev actif (`pnpm dev` depuis root)
- [ ] Port 3003 accessible (`http://localhost:3003`)
- [ ] Base Turso connectée (vérifier logs serveur)
- [ ] Pas de tests en cours (éviter conflits de données)
- [ ] Browsers Playwright installés (`pnpm exec playwright install`)

---

## 📊 Résultats Attendus

### ✅ Succès Total

```
  ✓ 1.1 - Bundle reflète prix initial du catalogue (2.3s)
  ✓ 1.2 - Modification catalogue → Bundle auto-sync (3.1s)
  ✓ 2.1 - Bundle utilise prix custom (pas catalogue) (1.8s)
  ✓ 2.2 - Modification catalogue → Bundle reste figé (2.9s)
  ...

  10 passed (28.4s)
```

### ❌ Échec Exemple

```
  ✓ 1.1 - Bundle reflète prix initial du catalogue (2.3s)
  ✗ 1.2 - Modification catalogue → Bundle auto-sync (3.1s)

  Error: expect(received).toBe(expected)

  Expected: 6200
  Received: 5800

  at tests/e2e/admin/bundles-price-lock.spec.ts:204:42
```

---

## 🎯 Workflow Recommandé

1. **Première exécution** : Stratégie 1 (par browser) pour vue d'ensemble
2. **Si échecs** : Stratégie 2 (par scénario) pour isoler feature
3. **Debug précis** : Stratégie 3 (test individuel) + Mode UI
4. **Validation finale** : Tout relancer avec `--reporter=html` pour rapport complet

---

## 📚 Références

- **Architecture**: `/apps/election-mvp/tests/e2e/admin/README-BUNDLE-PRICE-LOCK-TESTS.md`
- **Docs Playwright**: https://playwright.dev/docs/test-cli
- **Validation Gemini**: Session `playwright-test-chunking-strategy` (28 sources 2025)
- **Pattern SQL**: `CASE WHEN price_locked = 1 THEN custom_price ELSE base_price END`

---

**Dernière mise à jour**: 2025-11-05
**Feature**: Bundle Price Lock (Sprint 0 - Survival Mode)
**Status**: Phase 4.1 complétée ✅
