# Guide de Test - Phase 3 Reversal Final (refreshNuxtData)

**Date**: 2025-11-03
**Architecture**: `useAsyncData` + `refreshNuxtData()` (remplacement Event Bus)
**Objectif**: Valider synchronisation prix produit entre page détail et liste

---

## 🎯 Ce qui a changé depuis Event Bus

### ❌ ANCIEN (Event Bus - race condition)
```typescript
// [id].vue
$bus.emit('product-updated', productId)

// index.vue
onMounted(() => {
  $bus.on('product-updated', () => refresh())
})
```

**Problème**: Si `index.vue` n'est pas encore monté quand l'événement est émis → synchronisation échoue

### ✅ NOUVEAU (refreshNuxtData - timing-safe)
```typescript
// [id].vue
await refreshNuxtData('admin-products-list')

// index.vue - PAS de listeners nécessaires!
// useAsyncData détecte cache stale automatiquement
```

**Avantage**: Fonctionne même si `index.vue` se monte 3 secondes plus tard

---

## 📋 Prérequis

1. **Serveur dev actif** sur `http://localhost:3003`
   ```bash
   pnpm dev
   ```

2. **Browser console ouverte** (F12 ou Cmd+Option+I)

3. **Produit test existant** dans la base de données

---

## 🧪 Procédure de Test Manuel

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
   ```

3. **✅ VÉRIFICATION #1**: Liste des produits s'affiche correctement

### Étape 3: Sélectionner un Produit

1. Cliquer sur un produit dans la liste
2. Attendre chargement page détail (3+ secondes)
3. Vérifier que le formulaire d'édition est visible

### Étape 4: Modifier le Prix

1. **Noter le prix actuel** (exemple: 5000 FCFA)
2. Changer le prix (exemple: 5000 → 7500)
3. Cliquer sur **"Enregistrer"** ou **"Mettre à jour"**

### Étape 5: Observer Comportement (Nouveau Pattern)

**Logs Attendus dans Console**:
```
✅ Produit "Nom du produit" mis à jour
```

**PAS de logs Event Bus** (c'est normal, Event Bus supprimé !)

### Étape 6: Retour Liste et Vérification Synchronisation

1. Après le toast "Produit mis à jour", naviguer vers `/admin/products`
2. **OBSERVER LA CONSOLE** → Logs attendus:
   ```
   🔄 [useAsyncData] Fetching products list from API
   ⏱️ [useAsyncData] Délai artificiel: XXXms
   ✅ [useAsyncData] Produits chargés en XXXms
   ```

3. **✅ VÉRIFICATION #2**: Le prix modifié (7500 FCFA) est-il affiché dans la liste?

---

## 📊 Résultats Attendus

### ✅ SUCCÈS (refreshNuxtData fonctionne)

**Console lors de la modification**:
```
✅ Produit "Nom du produit" mis à jour
```

**Console lors du retour liste**:
```
🔄 [useAsyncData] Fetching products list from API
⏱️ [useAsyncData] Délai artificiel: XXXms
✅ [useAsyncData] Produits chargés en XXXms
```

**Interface**:
- ✅ Prix modifié visible dans la liste
- ✅ Synchronisation immédiate
- ✅ Zéro différence entre page détail et liste

---

### ❌ ÉCHEC (refreshNuxtData cassé)

**Symptôme #1**: Ancien prix toujours affiché dans liste après modification

**Symptôme #2**: Pas de logs `useAsyncData` lors du retour liste

**Diagnostic**:
1. Vérifier que `refreshNuxtData('admin-products-list')` est appelé dans `[id].vue`
2. Vérifier que cache key `'admin-products-list'` est identique dans `index.vue`
3. Vérifier console browser pour erreurs JavaScript

---

## 🔍 Différences Techniques vs Event Bus

| Aspect | Event Bus (Ancien) | refreshNuxtData (Nouveau) |
|--------|-------------------|---------------------------|
| **Timing** | ❌ Dépend du lifecycle composant | ✅ Indépendant du lifecycle |
| **Setup** | ❌ Listeners à créer | ✅ Zéro setup nécessaire |
| **Complexité** | ❌ 34 lignes de code | ✅ 1 ligne par mutation |
| **Race Conditions** | ❌ Possibles | ✅ Impossibles |
| **Nuxt Native** | ❌ Non (mitt externe) | ✅ Oui (API Nuxt 3) |

---

## 📸 Screenshots à Capturer

1. **Console lors du chargement liste** (logs useAsyncData)
2. **Liste produits AVANT modification** (prix initial)
3. **Formulaire édition avec prix modifié**
4. **Toast "Produit mis à jour"**
5. **Liste produits APRÈS retour** (prix synchronisé)

---

## 🚀 Actions selon Résultats

### Si Test Passe ✅
→ Phase 3 Reversal Final VALIDÉE
→ Prêt pour déploiement Railway
→ Supprimer logs DEBUG si présents

### Si Test Échoue ❌
→ Vérifier cache key identique (`'admin-products-list'`)
→ Vérifier appels `refreshNuxtData()` dans `[id].vue`
→ Capturer logs console + screenshots
→ Analyser erreurs JavaScript

---

## 🎓 Notes Techniques

### Comment refreshNuxtData() fonctionne

1. `[id].vue` appelle `await refreshNuxtData('admin-products-list')`
2. Nuxt marque le cache pour cette clé comme **stale** (périmé)
3. Navigation vers `/admin/products` (peut prendre 3+ secondes)
4. `index.vue` se monte et exécute `useAsyncData('admin-products-list', ...)`
5. `useAsyncData` détecte cache stale → **refetch automatique**
6. Nouvelles données affichées dans liste

**Clé du succès**: Cache globalement invalidé, indépendamment du timing de navigation

---

## 📁 Fichiers Modifiés (Phase 3 Reversal Final)

### `apps/election-mvp/pages/admin/products/[id].vue`

**Lignes 856-858** (CREATE):
```typescript
await refreshNuxtData('admin-products-list')
```

**Lignes 871-873** (UPDATE):
```typescript
await refreshNuxtData('admin-products-list')
```

**Lignes 918-920** (DELETE):
```typescript
await refreshNuxtData('admin-products-list')
```

### `apps/election-mvp/pages/admin/products/index.vue`

**Lignes 368-372** (Event Bus listeners SUPPRIMÉS):
```typescript
// ⭐ Synchronisation via refreshNuxtData() - Pas besoin d'Event Bus
// [id].vue appelle refreshNuxtData('admin-products-list') après chaque mutation
// → useAsyncData('admin-products-list') détecte cache stale et refetch automatiquement
```

---

**Créé par**: Claude (Phase 3 Reversal Final)
**Timestamp**: 2025-11-03T21:40:00Z
**Status**: ✅ TypeScript Clean • Prêt pour test manuel
