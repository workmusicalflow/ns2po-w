# 🧪 Plan de Test E2E : Persistance de Suppression de Produit Bundle

## 🎯 Objectif
Valider que la suppression d'un produit dans un bundle est correctement persistée lors de la sauvegarde et que les données restent cohérentes après rechargement de la page.

## 📋 Analyse Fonctionnelle

### 🔍 **Problème Identifié**
- **Issue** : La suppression d'un produit dans un bundle n'est pas persistée
- **Symptôme** : Après suppression → notification de succès → sauvegarde → rechargement → le produit réapparaît
- **Impact** : Perte de confiance utilisateur et incohérence des données

### 🧩 **Flux Technique Attendu**
1. **Suppression produit** → Mise à jour état local
2. **Notification succès** → Confirmation utilisateur
3. **Sauvegarde** → Persistance en base de données
4. **Rechargement** → État cohérent maintenu

## 📋 Scénarios de Test

### ✅ Scénario 1 : Sauvegarde et Persistance Nominale

**Description :** Un administrateur supprime un produit d'un bundle, sauvegarde, et vérifie que la suppression est maintenue après rechargement.

**Prérequis :**
- Utilisateur connecté avec droits administrateur
- Bundle existant avec au moins 3 produits
- Aucune autre session d'édition active

**Étapes :**
1. 🌐 **Naviguer** vers `/admin/bundles`
2. 🖱️ **Cliquer** sur "Modifier" pour un bundle avec 3+ produits
3. ⏳ **Attendre** que la page de modification se charge complètement
4. 📊 **Noter** le nombre initial de produits et la liste des noms
5. 🖱️ **Cliquer** sur l'icône trash du premier produit de la liste
6. ⏳ **Attendre** 500ms pour la notification de succès
7. ✅ **Vérifier** que le produit n'apparaît plus dans la liste
8. ✅ **Vérifier** qu'une notification "Suppression réussie" s'affiche
9. 🖱️ **Cliquer** sur le bouton "Sauvegarder"
10. ⏳ **Attendre** la confirmation de sauvegarde (notification ou changement d'état)
11. 🔄 **Actualiser** la page (F5 ou rechargement navigateur)
12. ⏳ **Attendre** le rechargement complet de la page
13. ✅ **Vérifier** que le produit supprimé ne réapparaît PAS dans la liste
14. ✅ **Vérifier** que le nombre de produits est toujours réduit de 1
15. ✅ **Vérifier** que le total du bundle reflète la suppression

**Résultat attendu :**
- Produit définitivement supprimé du bundle
- Sauvegarde effective en base de données
- État cohérent maintenu après rechargement
- Aucune réapparition du produit supprimé

---

### ❌ Scénario 2 : Échec de Sauvegarde avec Rollback

**Description :** Tester le comportement quand la sauvegarde échoue après suppression d'un produit.

**Prérequis :**
- Bundle avec 2+ produits
- Capacité à simuler un échec réseau ou serveur

**Étapes :**
1. 🌐 **Naviguer** vers un bundle avec 2+ produits
2. 📊 **Noter** l'état initial (nombre et noms des produits)
3. 🖱️ **Cliquer** sur l'icône trash d'un produit
4. ✅ **Vérifier** que la notification de suppression apparaît
5. 🔧 **Simuler** une panne réseau (DevTools → Network → Offline)
6. 🖱️ **Cliquer** sur "Sauvegarder"
7. ⏳ **Attendre** 5 secondes
8. ✅ **Vérifier** qu'un message d'erreur de sauvegarde s'affiche
9. 🔧 **Réactiver** la connexion réseau
10. 🔄 **Actualiser** la page
11. ✅ **Vérifier** que le produit réapparaît (rollback attendu)

**Résultat attendu :**
- Message d'erreur clair lors de l'échec de sauvegarde
- Rollback automatique vers l'état précédent
- Cohérence des données préservée

---

### ⚠️ Scénario 3 : Sauvegarde Sans Suppression Préalable

**Description :** Vérifier que la sauvegarde fonctionne normalement sans suppression de produit.

**Prérequis :**
- Bundle existant avec produits
- Modifications mineures possibles (nom, description)

**Étapes :**
1. 🌐 **Naviguer** vers un bundle existant
2. ✏️ **Modifier** légèrement le nom du bundle (ajouter " - Test")
3. 🖱️ **Cliquer** sur "Sauvegarder"
4. ⏳ **Attendre** la confirmation de sauvegarde
5. 🔄 **Actualiser** la page
6. ✅ **Vérifier** que la modification est conservée
7. ✅ **Vérifier** que tous les produits sont toujours présents

**Résultat attendu :**
- Sauvegarde normale fonctionne correctement
- Isolation du problème à la suppression de produits

---

### 🔄 Scénario 4 : Suppressions Multiples et Sauvegarde

**Description :** Supprimer plusieurs produits, sauvegarder, et vérifier la persistance de toutes les suppressions.

**Prérequis :**
- Bundle avec au moins 5 produits

**Étapes :**
1. 🌐 **Naviguer** vers un bundle avec 5+ produits
2. 📊 **Noter** la liste complète des produits initiaux
3. 🖱️ **Supprimer** le 1er produit → Attendre notification
4. 🖱️ **Supprimer** le 3ème produit → Attendre notification
5. 🖱️ **Supprimer** le 5ème produit → Attendre notification
6. ✅ **Vérifier** que 3 produits ont été supprimés localement
7. 🖱️ **Cliquer** sur "Sauvegarder"
8. ⏳ **Attendre** la confirmation de sauvegarde
9. 🔄 **Actualiser** la page
10. ✅ **Vérifier** que les 3 produits supprimés ne réapparaissent pas
11. ✅ **Vérifier** que seuls les 2 produits non supprimés sont présents

**Résultat attendu :**
- Toutes les suppressions multiples sont persistées
- État final cohérent avec les actions effectuées

---

### 🚀 Scénario 5 : Performance et Optimisation

**Description :** Valider les performances de sauvegarde après suppression de produits.

**Étapes :**
1. 🌐 **Naviguer** vers un bundle avec plusieurs produits
2. ⏱️ **Démarrer** la mesure de temps
3. 🖱️ **Supprimer** un produit
4. 🖱️ **Cliquer** sur "Sauvegarder"
5. ⏱️ **Mesurer** le temps de réponse de sauvegarde
6. ✅ **Vérifier** que la sauvegarde prend < 3 secondes
7. 🔄 **Actualiser** et vérifier la persistance

**Résultat attendu :**
- Temps de sauvegarde < 3 secondes
- Pas de dégradation de performance

---

### 🔧 Scénario 6 : Validation API Backend

**Description :** Vérifier directement les appels API lors de la sauvegarde après suppression.

**Étapes :**
1. 🔧 **Ouvrir** les DevTools → Onglet Network
2. 🌐 **Naviguer** vers un bundle
3. 🖱️ **Supprimer** un produit
4. 🖱️ **Cliquer** sur "Sauvegarder"
5. 🔍 **Analyser** les requêtes HTTP dans Network
6. ✅ **Vérifier** qu'un appel PUT/PATCH vers `/api/campaign-bundles/[id]` est effectué
7. ✅ **Vérifier** que la réponse est 200 OK
8. 🔍 **Examiner** le payload de la requête
9. ✅ **Vérifier** que les produits supprimés n'apparaissent pas dans le payload

**Résultat attendu :**
- Appel API correct vers l'endpoint de mise à jour
- Payload cohérent avec l'état local après suppression
- Réponse serveur positive

## 🔧 Considérations Techniques

### 📊 **Données de Test**
- **Bundle Type A** : Bundle avec 3 produits de prix différents
- **Bundle Type B** : Bundle avec 5+ produits pour tests multiples
- **Produits Test** : Produits avec noms distincts et facilement identifiables

### 🗃️ **État Initial Requis**
- Base de données Turso avec bundles pré-configurés
- Session admin active et valide
- Cache navigateur vide pour tests propres

### 🧹 **Actions de Nettoyage**
- Restaurer les bundles de test à leur état initial
- Vider le cache navigateur entre les tests
- Nettoyer les notifications persistantes

### ⚡ **Critères de Performance**
- Suppression produit : < 200ms
- Sauvegarde bundle : < 3 secondes
- Rechargement page : < 2 secondes

### 🛠️ **API Endpoints à Vérifier**
- `PUT /api/campaign-bundles/[id]` : Mise à jour bundle
- `GET /api/campaign-bundles/[id]` : Récupération bundle après rechargement

## 📊 Critères de Succès

- [ ] **Persistance** : Suppressions de produits conservées après sauvegarde et rechargement
- [ ] **API** : Appels backend corrects avec payload cohérent
- [ ] **Performance** : Sauvegarde < 3 secondes
- [ ] **UX** : Notifications appropriées et état UI cohérent
- [ ] **Rollback** : Gestion correcte des échecs de sauvegarde
- [ ] **Multiples** : Suppressions multiples correctement persistées
- [ ] **Console** : Aucune erreur JavaScript
- [ ] **Réseau** : Requêtes HTTP valides et réponses appropriées

## 🎯 Focus Debugging

### 🔍 **Points d'Investigation Prioritaires**
1. **Mapping État Local ↔ API** : Vérifier que l'état local après suppression est correctement envoyé à l'API
2. **Synchronisation Vue ↔ Backend** : S'assurer que le composable `useBundleCalculations` reflète les suppressions dans la payload
3. **Validation Côté Serveur** : Confirmer que l'API accepte et persiste les suppressions de produits
4. **Rechargement de Données** : Vérifier que le bundle rechargé provient bien de la base et non du cache

---

## 🎯 Automation Notes

### 🤖 **Sélecteurs Playwright Recommandés**
```typescript
// Bouton de suppression produit
`[data-testid="remove-product-${productId}"]`
`button:has(svg[name="heroicons:trash"])`

// Bouton de sauvegarde
`[data-testid="save-bundle"]`
`button:has-text("Sauvegarder")`

// Notifications
`[data-testid="success-notification"]`
`[data-testid="error-notification"]`

// Liste des produits
`[data-testid="bundle-products-list"]`
```

### 📝 **Assertions Clés**
- Vérifier la **disparition** persistante du produit après rechargement
- Valider les **appels API** et leur payload
- Confirmer les **notifications** de sauvegarde
- Contrôler la **cohérence** état local ↔ état serveur

---

> ✅ **Plan de test créé avec succès !**
>
> 📁 Fichier : `tests/e2e/plans/bundle-product-removal-persistence.md`
>
> 🚀 **Prochaines étapes :**
> - Exécuter les scénarios de test avec Playwright
> - Identifier la cause racine du problème de persistance
> - Corriger le bug de sauvegarde des suppressions de produits