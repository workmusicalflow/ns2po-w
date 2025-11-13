# 📊 Résultats Tests Bundle Price Lock

Ce répertoire contient les résultats d'exécution des tests E2E Bundle Price Lock.

---

## 🎯 Utilisation Rapide

### Méthode 1 : Script Automatisé (RECOMMANDÉ)

```bash
cd /Users/logansery/Documents/ns2po-w/apps/election-mvp/tests/e2e/admin
./run-bundle-price-lock-tests.sh
```

**Menu interactif** :
1. Chromium uniquement
2. Firefox uniquement
3. Mobile Chrome uniquement
4. Tous les browsers
5. Mode Debug
6. Quitter

**Avantages** :
- ✅ Sortie capturée automatiquement dans fichiers
- ✅ Rapport synthétique Markdown généré
- ✅ Métadonnées (timestamp, durée, status)
- ✅ Zéro copier-coller nécessaire

---

## 📂 Organisation des Fichiers

Chaque exécution génère :

```
test-results-bundle-price-lock/
├── 20251105-143022-chromium.txt      # Sortie complète Chromium
├── 20251105-143022-chromium.json     # Métadonnées parsables
├── 20251105-143022-firefox.txt       # Sortie complète Firefox
├── 20251105-143022-firefox.json      # Métadonnées parsables
├── 20251105-143022-mobile-chrome.txt # Sortie complète Mobile
├── 20251105-143022-mobile-chrome.json # Métadonnées parsables
└── 20251105-143022-RAPPORT.md        # Rapport synthétique
```

**Format timestamp** : `YYYYMMDD-HHMMSS` (ex: `20251105-143022`)

---

## 🔍 Analyser les Résultats

### Lire un fichier complet

```bash
cat test-results-bundle-price-lock/20251105-143022-chromium.txt
```

### Voir uniquement les échecs

```bash
grep -E "✗|Error|Expected" test-results-bundle-price-lock/20251105-143022-chromium.txt
```

### Voir le rapport synthétique

```bash
cat test-results-bundle-price-lock/20251105-143022-RAPPORT.md
```

### Lister toutes les sessions

```bash
ls -lh test-results-bundle-price-lock/*-RAPPORT.md
```

---

## 📊 Format du Fichier Résultat

```
════════════════════════════════════════════════════════════════════════
🧪 BUNDLE PRICE LOCK - Résultats Tests E2E
════════════════════════════════════════════════════════════════════════

Browser:    chromium
Timestamp:  2025-11-05 14:30:22
Test File:  bundles-price-lock.spec.ts
Strategy:   Découpage par Browser (10 tests)

════════════════════════════════════════════════════════════════════════

  ✓ 1.1 - Bundle reflète prix initial du catalogue (2.3s)
  ✓ 1.2 - Modification catalogue → Bundle auto-sync (3.1s)
  ✓ 2.1 - Bundle utilise prix custom (pas catalogue) (1.8s)
  ...

════════════════════════════════════════════════════════════════════════
✅ RÉSULTAT: SUCCÈS
════════════════════════════════════════════════════════════════════════

Durée:      28s
Browser:    chromium
Status:     PASSED
```

---

## 🧹 Nettoyage

Supprimer les anciens résultats (garder seulement les 3 derniers) :

```bash
cd test-results-bundle-price-lock
ls -t *-RAPPORT.md | tail -n +4 | xargs -I {} basename {} -RAPPORT.md | xargs -I {} rm {}-*
```

Supprimer tous les résultats :

```bash
rm -rf test-results-bundle-price-lock/*
```

---

## 📋 Partage avec Claude

Pour partager un résultat avec Claude :

```bash
# Copier dans le presse-papier (macOS)
cat test-results-bundle-price-lock/20251105-143022-chromium.txt | pbcopy

# Ou afficher pour copie manuelle
cat test-results-bundle-price-lock/20251105-143022-chromium.txt
```

**Le fichier est formaté pour être lisible** :
- ✅ Métadonnées en en-tête
- ✅ Résumé en pied de page
- ✅ Durée et status clairement indiqués
- ✅ Horodatage précis

---

## 🔧 Dépannage

### Script n'est pas exécutable

```bash
chmod +x ../run-bundle-price-lock-tests.sh
```

### Répertoire manquant

```bash
mkdir -p test-results-bundle-price-lock
```

### Tests ne se lancent pas

Vérifier que le serveur dev est actif :

```bash
# Depuis la racine du monorepo
pnpm dev
```

---

**Dernière mise à jour** : 2025-11-05
**Feature** : Bundle Price Lock (Sprint 0)
