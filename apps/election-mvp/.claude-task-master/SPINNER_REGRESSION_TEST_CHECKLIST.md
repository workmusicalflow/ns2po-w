# ✅ Checklist Régression - Loading Spinner Email Quote

**Date création**: 2025-11-13
**Feature**: Email delivery avec PDF generation
**Criticité**: HIGH (UX feedback utilisateur)

---

## 🎯 Test Manuel Rapide (< 2 minutes)

### Pré-requis
- [ ] Production: https://nuxt-app-production-8b86.up.railway.app/devis-new
- [ ] DevTools Console ouvert (pour observer logs)
- [ ] Vue DevTools extension installée (optionnel mais recommandé)

### Étapes de Test

#### 1. Navigation & Sélection
- [ ] Accéder à `/devis-new`
- [ ] Sélectionner mode "Sur Mesure"
- [ ] Ajouter 1 produit (ex: T-shirt Classique, qté 50)
- [ ] Cliquer "Suivant" 2x pour aller à étape 3/3 (Validation)

#### 2. Formulaire
- [ ] Remplir **Nom**: "Test Spinner Visibility"
- [ ] Remplir **Téléphone**: "0712345678"
- [ ] Remplir **Email**: "test@ns2po.ci"
- [ ] Sélectionner canal **Email** (bouton bleu)

#### 3. **CRITIQUE: Observation Spinner**
- [ ] **AVANT CLICK**: Vérifier que spinner est invisible
- [ ] **AVANT CLICK**: Texte bouton = "Envoyer le devis"
- [ ] **AVANT CLICK**: Bouton est activé (pas grisé)

#### 4. Click Submit
- [ ] Cliquer bouton "Envoyer le devis"

#### 5. **✅ VALIDATION SPINNER (temps réel)**
- [ ] **0-100ms après click**: Spinner SVG **visible** et animé (rotation)
- [ ] **0-100ms après click**: Texte bouton change → "Envoi en cours..."
- [ ] **0-100ms après click**: Bouton devient **disabled** (grisé)
- [ ] **Pendant API call**: Spinner **reste visible** (animation continue)

#### 6. Fin de Soumission
- [ ] Après 2-5 secondes: Modal s'affiche (confirmation ou erreur)
- [ ] Spinner **disparaît** dès affichage modal
- [ ] Texte bouton revient à "Envoyer le devis" (si on ferme modal)

---

## 🔍 Logs Console Attendus

```javascript
// Phase 1: Avant submit
📧 Traitement soumission Email

// Phase 2: Pendant submit (composable)
[useEmailQuote] 🚀 START - isSubmitting: false
[useEmailQuote] ✅ isSubmitting set to TRUE
📧 Démarrage soumission email quote: {name, email, phone...}
📧 Données transformées pour email: {clientName, reference, items...}

// Phase 3: Appel API
[POST] /api/quotes/send (en cours...)

// Phase 4: Fin
✅ Réponse API /api/quotes/send: {success: true, reference: "DEV-2025-XXX"}
[useEmailQuote] ❌ isSubmitting set to FALSE
✅ Email envoyé avec succès: {emailId, pdfSize...}
```

---

## ❌ Red Flags (Indicateurs Régression)

Si l'un de ces symptômes apparaît, **RÉGRESSION CONFIRMÉE** :

| Symptôme | Cause Probable | Action Immédiate |
|----------|----------------|------------------|
| Spinner jamais visible | Props `isSubmitting` non passée | Vérifier `<StepValidation :is-submitting="isEmailSubmitting">` |
| Spinner visible mais texte ne change pas | Binding `v-if` cassé | Vérifier template `StepValidation.vue` lignes 163-188 |
| Bouton pas disabled | Binding `:disabled` cassé | Vérifier ligne 159 `StepValidation.vue` |
| Spinner reste bloqué | `isSubmitting` pas reset en `finally` | Vérifier `useEmailQuote.ts` ligne 192 |
| Modal s'affiche instantanément | API call non `await`ée | Vérifier `handleEmailSubmission()` ligne 410 |

---

## 🧪 Tests Automatisés (À Implémenter)

### Test Playwright E2E
**Fichier**: `tests/e2e/devis/spinner-visibility.spec.ts`

**Assertions critiques** :
```typescript
// Spinner invisible avant click
await expect(page.locator('svg.animate-spin')).toBeHidden()

// Spinner visible dans les 100ms après click
await page.click('button:has-text("Envoyer le devis")')
await expect(page.locator('svg.animate-spin')).toBeVisible({ timeout: 100 })

// Texte change
await expect(page.locator('span:has-text("Envoi en cours")')).toBeVisible()

// Bouton disabled
await expect(page.locator('button >> text=Envoi en cours')).toBeDisabled()
```

**Commande** :
```bash
pnpm exec playwright test spinner-visibility.spec.ts --headed
```

---

## 📱 Test Mobile (iOS Safari / Android Chrome)

**Raisons** : Comportement touch events différent desktop

### Checklist Spécifique Mobile
- [ ] Spinner visible sur mobile 3G (latence réseau)
- [ ] Pas de double-submit (bouton disabled fonctionne)
- [ ] Animation spinner fluide (pas de freeze UI)

**Test Manuel** :
1. Ouvrir Chrome DevTools → Device Toolbar (Cmd+Shift+M)
2. Sélectionner "iPhone 12 Pro"
3. Throttling: "Fast 3G"
4. Répéter test complet ci-dessus

---

## 🚀 CI/CD Integration (Prévention Régression Automatique)

### GitHub Actions Workflow (À Ajouter)

```yaml
# .github/workflows/spinner-regression-test.yml
name: Spinner Visibility Regression Test

on:
  pull_request:
    paths:
      - 'apps/election-mvp/pages/devis-new.vue'
      - 'apps/election-mvp/components/devis/StepValidation.vue'
      - 'apps/election-mvp/composables/useEmailQuote.ts'

jobs:
  test-spinner:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm exec playwright install chromium
      - run: pnpm exec playwright test spinner-visibility.spec.ts
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 Métriques de Succès

| Métrique | Target | Mesure |
|----------|--------|--------|
| **Spinner apparition** | < 100ms après click | `performance.now()` |
| **Feedback utilisateur** | 100% visible | Test manuel + Playwright |
| **Pas de double-submit** | 0 occurrences | Logs Railway (pas de doublons `[Quote Email API] Request received`) |
| **Régression détectée** | < 24h (via CI) | GitHub Actions |

---

## 🔄 Maintenance

**Fréquence review**: Avant chaque sprint
**Responsable**: Lead Dev + QA
**Trigger updates**:
- Modification composants devis (`/components/devis/`)
- Modification composables email (`/composables/useEmailQuote.ts`)
- Upgrade Nuxt/Vue (breaking changes)

---

**Dernière validation**: 2025-11-13 (Commit ab9249f)
**Prochaine review**: Sprint 1 - Phase PDF Email Delivery

🤖 Generated with [Claude Code](https://claude.com/claude-code)
