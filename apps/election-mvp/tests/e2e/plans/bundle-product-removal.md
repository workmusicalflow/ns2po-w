# 🧪 Plan de Test E2E : Suppression de Produit dans un Bundle

## 🎯 Objectif
Valider le fonctionnement de bout en bout de la fonctionnalité de suppression de produits dans un bundle existant via l'interface d'administration `/admin/bundles/[id]`.

## 📋 Analyse Fonctionnelle

### 🔍 **Architecture Identifiée**
- **Page** : `/admin/bundles/[id].vue`
- **Action** : Bouton "trash" sur chaque produit du bundle
- **Fonction** : `removeProduct(index: number)`
- **Logique** : `bundleCalculations.removeProduct(product.id)`
- **Notification** : `crudSuccess?.deleted(productName, 'produit retiré du bundle')`

### 🧩 **Flux Technique**
1. **Clic sur l'icône trash** du produit à supprimer
2. **Suppression immédiate** du produit du tableau `selectedProducts`
3. **Recalcul automatique** du total du bundle via le composable `useBundleCalculations`
4. **Notification de succès** avec le nom du produit supprimé
5. **Mise à jour UI** réactive de la liste et du total

## 📋 Scénarios de Test

### ✅ Scénario 1 : Suppression Nominale d'un Produit

**Description :** Un administrateur supprime avec succès un produit d'un bundle existant contenant plusieurs produits.

**Prérequis :**
- Bundle existant avec au moins 2 produits

**Étapes :**
1. 🌐 **Naviguer** vers `/admin/bundles`
2. 🖱️ **Cliquer** sur "Modifier" pour un bundle contenant 2+ produits
3. ⏳ **Attendre** que la page de modification se charge complètement
4. 📊 **Noter** le nombre initial de produits et le total affiché
5. 🖱️ **Cliquer** sur l'icône trash du premier produit de la liste
6. ⏳ **Attendre** 500ms pour la notification et recalcul
7. ✅ **Vérifier** que le produit n'apparaît plus dans la liste
8. ✅ **Vérifier** que le nombre de produits a diminué de 1
9. ✅ **Vérifier** que le total du bundle a été recalculé correctement
10. ✅ **Vérifier** qu'une notification verte "produit retiré du bundle" s'affiche
11. 🔄 **Actualiser** la page pour confirmer la persistance

**Résultat attendu :**
- Produit supprimé de la liste
- Total recalculé
- Notification de succès affichée

---

### ✅ Scénario 2 : Suppression du Dernier Produit

**Description :** Un administrateur supprime le dernier produit restant d'un bundle.

**Prérequis :**
- Bundle existant avec exactement 1 produit

**Étapes :**
1. 🌐 **Naviguer** vers un bundle contenant 1 seul produit
2. 📊 **Vérifier** que le total correspond au prix du produit unique
3. 🖱️ **Cliquer** sur l'icône trash du produit
4. ✅ **Vérifier** que la liste affiche "Aucun produit sélectionné"
5. ✅ **Vérifier** que le total du bundle est à 0 F CFA
6. ✅ **Vérifier** que l'icône cube et le message d'état vide s'affichent
7. ✅ **Vérifier** que le bouton "Ajouter un produit" reste fonctionnel

**Résultat attendu :**
- Liste vide avec message approprié
- Total à zéro
- Interface cohérente pour un bundle vide

---

### ✅ Scénario 3 : Suppression Multiple Successive

**Description :** Un administrateur supprime plusieurs produits consécutivement du même bundle.

**Prérequis :**
- Bundle avec au moins 3 produits de prix différents

**Étapes :**
1. 🌐 **Naviguer** vers un bundle avec 4+ produits
2. 📊 **Noter** le total initial et la liste des produits
3. 🖱️ **Cliquer** sur l'icône trash du 1er produit
4. ⏳ **Attendre** la notification de succès
5. 🖱️ **Cliquer** sur l'icône trash du 2ème produit (nouveau 1er)
6. ⏳ **Attendre** la notification de succès
7. 🖱️ **Cliquer** sur l'icône trash du 3ème produit
8. ✅ **Vérifier** qu'il ne reste qu'1 produit dans la liste
9. ✅ **Vérifier** que le total correspond au produit restant
10. ✅ **Vérifier** que 3 notifications successives ont été affichées

**Résultat attendu :**
- Chaque suppression s'exécute indépendamment
- Recalculs corrects à chaque étape
- Notifications multiples gérées proprement

---

### ⚠️ Scénario 4 : Suppression avec Rechargement Rapide

**Description :** Tester la robustesse lors d'actions rapides de suppression/rechargement.

**Prérequis :**
- Bundle avec 3+ produits
- Connexion réseau stable

**Étapes :**
1. 🌐 **Naviguer** vers un bundle avec 3+ produits
2. 🖱️ **Cliquer** rapidement sur l'icône trash d'un produit
3. 🔄 **Actualiser** immédiatement la page (F5)
4. ⏳ **Attendre** le rechargement complet
5. ✅ **Vérifier** que l'état final est cohérent
6. ✅ **Vérifier** qu'aucune erreur JavaScript n'est apparue

**Résultat attendu :**
- Pas d'état intermédiaire corrompu
- Données cohérentes après rechargement
- Aucune erreur console

---

### 🖱️ Scénario 5 : Interactions UI Avancées

**Description :** Valider l'expérience utilisateur lors de la suppression.

**Prérequis :**
- Bundle avec 2+ produits
- Différents types de produits (textiles, accessoires)

**Étapes :**
1. 🌐 **Naviguer** vers un bundle avec produits variés
2. 🖱️ **Survoler** l'icône trash d'un produit
3. ✅ **Vérifier** que l'icône change de couleur (hover effect)
4. 🖱️ **Cliquer** sur l'icône trash
5. 👁️ **Observer** l'animation de suppression (si présente)
6. ✅ **Vérifier** que la notification apparaît au bon endroit
7. ⏳ **Attendre** que la notification disparaisse automatiquement
8. ✅ **Vérifier** que l'interface reste utilisable

**Résultat attendu :**
- Interactions visuelles fluides
- Feedback utilisateur clair
- Aucun élément UI cassé

## 🔧 Considérations Techniques

### 📊 **Données de Test**
- **Bundle Type 1** : Bundle avec 1 produit (Test suppression totale)
- **Bundle Type 2** : Bundle avec 3-4 produits de prix différents (Tests nominaux)
- **Bundle Type 3** : Bundle avec 5+ produits (Tests de performance)

### 🗃️ **État Initial Requis**
- Base de données avec bundles pré-configurés
- Produits avec prix variés (textile: 1700-5850 XOF, accessoires: 2500+ XOF)
- Session admin active avec token valide

### 🧹 **Actions de Nettoyage**
- Restaurer les bundles de test à leur état initial
- Vider les notifications persistantes
- Nettoyer le localStorage/sessionStorage

### ⚡ **Critères de Performance**
- Suppression : < 200ms temps de réponse
- Recalcul : instantané (< 50ms)
- Animation UI : 60fps minimum

## 📊 Critères de Succès

- [ ] Tous les scénarios passent sans erreur
- [ ] Aucune erreur JavaScript dans la console
- [ ] Temps de suppression < 200ms
- [ ] Interface responsive sur mobile/desktop
- [ ] Calculs mathématiques corrects (total bundle)
- [ ] Notifications apparaissent et disparaissent correctement
- [ ] État persistant après rechargement de page
- [ ] Gestion des cas d'erreur réseau
- [ ] Expérience utilisateur fluide et intuitive

## 🎯 Automation Notes

### 🤖 **Sélecteurs Playwright Recommandés**
```typescript
// Bouton de suppression d'un produit
`[data-testid="remove-product-${productId}"]` // Recommandé
`button:has(svg[name="heroicons:trash"])` // Alternative

// Notification de succès
`[data-testid="success-notification"]`
`.notification.success` // Alternative

// Liste des produits
`[data-testid="bundle-products-list"]`

// Total du bundle
`[data-testid="bundle-total"]`
```

### 📝 **Assertions Clés**
- Vérifier la **disparition** de l'élément produit du DOM
- Valider le **recalcul** mathématique du total
- Confirmer l'**apparition** puis **disparition** de la notification
- Contrôler la **cohérence** des données après rechargement

### 🔄 **Patterns de Retry**
- Attendre les animations avant assertions
- Prévoir des retry pour les vérifications de total (calculs async)
