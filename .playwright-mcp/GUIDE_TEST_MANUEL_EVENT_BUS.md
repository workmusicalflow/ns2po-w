# Guide de Test Manuel - Event Bus & Synchronisation Prix

**Date**: 2025-11-03
**Objectif**: Vérifier que l'Event Bus émet correctement les événements et déclenche le refresh de la liste après modification d'un produit

---

## 🎯 Ce que nous testons

**Problème Identifié**: Les logs serveur montrent que les produits sont mis à jour avec succès, MAIS l'Event Bus ne semble pas émettre d'événements → la liste ne se rafraîchit pas.

**Logs Diagnostic Ajoutés**:
- Dans `[id].vue` lignes 860-866 (CREATE), 874-881 (UPDATE), 933-939 (DELETE)
- Logs qui traceront si `$bus.emit()` est appelé et si `$bus` est défini

---

## 📋 Prérequis

1. **Serveur dev actif** sur `http://localhost:3003`
   ```bash
   # Depuis racine projet
   pnpm dev
   ```

2. **Browser console ouverte** (F12 ou Cmd+Option+I sur Mac)

3. **Produit test existant** dans la base de données

---

## 🧪 Procédure de Test

### Étape 1: Ouvrir Console Browser

1. Ouvrir Chrome/Firefox
2. Appuyer sur **F12** (ou **Cmd+Option+I** sur Mac)
3. Aller dans l'onglet **Console**
4. Vider la console (icône 🚫 ou Ctrl+L)

### Étape 2: Naviguer vers Liste Produits

1. Aller sur `http://localhost:3003/admin/products`
2. **OBSERVER LA CONSOLE** → Vous devriez voir:
   ```
   🔄 [useAsyncData] Fetching products list from API
   ⏱️ [useAsyncData] Délai artificiel: XXXms pour atteindre 3s minimum
   ✅ [useAsyncData] Produits chargés en XXXms
   🔄 [Event Bus] Listeners activés pour synchronisation cache
   ```

3. **✅ VÉRIFICATION #1**: Si vous voyez ces logs → Event Bus listeners sont actifs

### Étape 3: Sélectionner un Produit

1. Cliquer sur un produit dans la liste
2. Attendre chargement page détail
3. Vérifier que le formulaire d'édition est visible

### Étape 4: Modifier le Prix

1. **Noter le prix actuel** (exemple: 5000 FCFA)
2. Changer le prix (exemple: 5000 → 7500)
3. **NE PAS ENCORE ENREGISTRER**

### Étape 5: Enregistrer et Observer Logs Diagnostic

1. Cliquer sur **"Enregistrer"** ou **"Mettre à jour"**
2. **OBSERVER ATTENTIVEMENT LA CONSOLE**

**Logs Attendus** (si Event Bus fonctionne):
```
🔍 [DEBUG handleSubmit] Entrée condition success, response.data = {...}
🔍 [DEBUG handleSubmit] $bus défini? object $bus = {...}
🔍 [DEBUG handleSubmit] Product ID = prod_xxx
🚀 [DEBUG handleSubmit] AVANT $bus.emit("product-updated", ...)
📡 [Event Bus] product-updated: prod_xxx
✅ [DEBUG handleSubmit] APRÈS $bus.emit - Émission terminée
```

**Logs si Event Bus CASSÉ** (problème actuel):
```
🔍 [DEBUG handleSubmit] Entrée condition success, response.data = {...}
🔍 [DEBUG handleSubmit] $bus défini? undefined $bus = undefined
❌ ERROR: Cannot read property 'emit' of undefined
```

### Étape 6: Retour Liste et Vérification Refresh

1. Après le toast "Produit mis à jour", cliquer sur **"Retour"** ou naviguer vers `/admin/products`
2. **OBSERVER LA CONSOLE** → Logs attendus:
   ```
   📡 [Event Bus] product-updated reçu → refresh()
   🔄 [useAsyncData] Fetching products list from API
   ⏱️ [useAsyncData] Délai artificiel: XXXms
   ✅ [useAsyncData] Produits chargés en XXXms
   ```

3. **✅ VÉRIFICATION #2**: Le prix modifié (7500 FCFA) est-il affiché dans la liste?

---

## 📊 Résultats Attendus

### ✅ SUCCÈS (Event Bus fonctionne)

**Console lors de la modification:**
```
🔍 [DEBUG handleSubmit] Entrée condition success
🔍 [DEBUG handleSubmit] $bus défini? object
🚀 [DEBUG handleSubmit] AVANT $bus.emit
📡 [Event Bus] product-updated: prod_xxx
✅ [DEBUG handleSubmit] APRÈS $bus.emit
```

**Console lors du retour liste:**
```
📡 [Event Bus] product-updated reçu → refresh()
🔄 [useAsyncData] Fetching products list from API
✅ [useAsyncData] Produits chargés
```

**Interface:**
- ✅ Prix modifié visible dans la liste
- ✅ Pas de différence entre page détail et liste

---

### ❌ ÉCHEC (Event Bus cassé - problème actuel)

**Console lors de la modification:**
```
🔍 [DEBUG handleSubmit] Entrée condition success
🔍 [DEBUG handleSubmit] $bus défini? undefined
❌ ERROR: Cannot read property 'emit' of undefined
```

OU

```
🔍 [DEBUG handleSubmit] Entrée condition success
🔍 [DEBUG handleSubmit] $bus défini? object
🚀 [DEBUG handleSubmit] AVANT $bus.emit
[AUCUN LOG "📡 [Event Bus]"]
✅ [DEBUG handleSubmit] APRÈS $bus.emit
```

**Console lors du retour liste:**
```
[AUCUN LOG Event Bus]
[AUCUN LOG useAsyncData refresh]
```

**Interface:**
- ❌ Ancien prix toujours affiché dans la liste
- ❌ Différence entre page détail (prix mis à jour) et liste (ancien prix)

---

## 🔍 Diagnostic selon les Logs

### Cas 1: `$bus = undefined`
**Cause**: Le plugin Event Bus n'est pas chargé ou `useNuxtApp()` ne retourne pas `$bus`

**Solution**: Vérifier que `/plugins/event-bus.ts` est bien chargé

### Cas 2: `$bus` défini MAIS aucun log `📡 [Event Bus]`
**Cause**: Le wildcard listener `emitter.on('*', ...)` dans le plugin n'est pas actif

**Solution**: Vérifier que `process.dev` est `true` dans le plugin

### Cas 3: Émission OK MAIS pas de réception dans `index.vue`
**Cause**: Les listeners dans `index.vue` ne sont pas enregistrés ou sont mal configurés

**Solution**: Vérifier logs `🔄 [Event Bus] Listeners activés` au chargement de la liste

---

## 📸 Screenshots à Capturer

1. **Console lors du chargement liste** (logs useAsyncData + Event Bus listeners)
2. **Console lors de la sauvegarde** (logs DEBUG handleSubmit + émission Event Bus)
3. **Console lors du retour liste** (logs réception Event Bus + refresh useAsyncData)
4. **Liste produits AVANT modification** (prix initial)
5. **Liste produits APRÈS modification** (prix mis à jour ou pas)

---

## 🚀 Actions selon Résultats

### Si Event Bus fonctionne ✅
→ Phase 3 Reversal COMPLÈTE et VALIDÉE
→ Supprimer logs DEBUG
→ Déploiement Railway

### Si Event Bus cassé ❌
→ Analyser les logs capturés
→ Identifier la cause exacte (voir "Diagnostic selon les Logs")
→ Appliquer le fix approprié
→ Re-tester

---

**Créé par**: Claude (Diagnostic Autonome)
**Timestamp**: 2025-11-03T19:15:00Z
**Fichier modifié**: `apps/election-mvp/pages/admin/products/[id].vue` (lignes 860-866, 874-881, 933-939)
