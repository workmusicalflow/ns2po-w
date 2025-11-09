# 🔒 Guide Price Lock - Administrateur NS2PO

**Audience**: Administrateurs plateforme NS2PO Election MVP
**Fonctionnalité**: Verrouillage prix produits dans bundles
**Date**: 2025-11-08
**Statut**: ✅ Déployé en production

---

## 📋 Qu'est-ce que Price Lock ?

**Price Lock** (Verrouillage Prix) est une fonctionnalité qui vous permet de **contrôler comment les prix des produits dans un bundle évoluent** lorsque vous modifiez les prix du catalogue produits.

### 🔄 Deux modes disponibles :

| Mode | Icône | Comportement | Quand l'utiliser ? |
|------|-------|--------------|-------------------|
| **Auto-Sync** | 🔄 | Prix synchronisé automatiquement avec le catalogue | **80% des cas** - Bundles standards |
| **Prix Fixe** | 🔒 | Prix figé, ne change jamais | **20% des cas** - Promotions, tarifs négociés |

---

## 🎯 Pourquoi utiliser Price Lock ?

### ✅ Cas d'usage **Auto-Sync** (🔄 - Recommandé par défaut)

**Situation**: Vous créez un bundle standard pour une campagne électorale.

**Avantage**: Si vous mettez à jour le prix d'un produit dans le catalogue (ex: T-shirt passe de 1800 XAF → 2000 XAF), **tous les bundles utilisant ce produit en mode Auto-Sync seront automatiquement mis à jour**.

**Exemple concret**:
```
Bundle "Campagne Standard" :
- 100 T-shirts @ 1800 XAF (Auto-Sync 🔄)
- Total: 180 000 XAF

Vous augmentez le prix des T-shirts à 2000 XAF dans le catalogue.

➡️ Résultat automatique :
- 100 T-shirts @ 2000 XAF (toujours Auto-Sync 🔄)
- Nouveau total: 200 000 XAF ✅
```

---

### 🔒 Cas d'usage **Prix Fixe** (Verrouillage activé)

**Situation**: Vous créez un bundle avec tarif promotionnel ou négocié spécial.

**Avantage**: Le prix du bundle **reste figé** même si vous modifiez les prix du catalogue produits.

**Exemple concret**:
```
Bundle "Promotion Spéciale Partenaire XYZ" :
- 500 Casquettes @ 1200 XAF (Prix Fixe 🔒 - tarif négocié)
- Total figé: 600 000 XAF

Vous augmentez le prix des Casquettes à 1500 XAF dans le catalogue.

➡️ Résultat :
- 500 Casquettes @ 1200 XAF (toujours Prix Fixe 🔒)
- Total inchangé: 600 000 XAF ✅
(Le bundle garde son tarif promotionnel négocié)
```

**Autres exemples** :
- **Budget électoral strict** : Vous avez un devis validé à 5M XAF, vous verrouillez pour éviter toute variation
- **Offre temporaire** : Promotion "-20% sur ce bundle jusqu'au 31/12" avec prix fixe
- **Tarif VIP** : Client fidèle bénéficie d'un tarif spécial figé

---

## 🖱️ Comment utiliser Price Lock ?

### Étape 1 : Accéder à la page de modification d'un bundle

1. Connectez-vous à l'interface admin NS2PO
2. Allez dans **"Gestion des Bundles"**
3. Cliquez sur **"Modifier"** sur le bundle souhaité

### Étape 2 : Localiser la checkbox Price Lock

Pour **chaque produit** dans le bundle, vous verrez une **checkbox** avec une étiquette :

```
☑️  🔄 Auto-sync    ← Par défaut (recommandé)
ou
☑️  🔒 Prix fixe     ← Après activation
```

### Étape 3 : Activer/Désactiver le verrouillage

**Pour figer un prix** :
1. **Cochez la case** à côté du produit
2. L'étiquette passe de 🔄 à 🔒
3. Le prix de ce produit est maintenant **figé**

**Pour réactiver la synchronisation** :
1. **Décochez la case**
2. L'étiquette passe de 🔒 à 🔄
3. Le prix se **synchronise** à nouveau avec le catalogue

### Étape 4 : Survoler pour plus d'infos (Tooltip)

En **survolant la checkbox avec votre souris**, un tooltip apparaît avec des détails :

**Mode Auto-Sync (🔄)** :
```
• Prix synchronisé avec le produit catalogue
• Mise à jour automatique si prix modifié
• ✅ Recommandé (80% des cas)
```

**Mode Prix Fixe (🔒)** :
```
• Prix figé indépendamment du catalogue
• Idéal pour promotions/tarifs négociés
• ⚠️ Ne se met PAS à jour automatiquement
```

### Étape 5 : Sauvegarder

1. Cliquez sur **"Enregistrer le bundle"**
2. Le paramètre Price Lock est **immédiatement actif**

---

## ⚠️ Points d'attention

### 🔴 Attention : Prix Fixe = Responsabilité manuelle

Lorsque vous activez **Prix Fixe (🔒)** :
- Le prix **ne changera JAMAIS automatiquement**
- Si le prix du catalogue augmente, votre bundle restera à l'ancien prix
- Si le prix du catalogue baisse, votre bundle restera au prix élevé
- ⚠️ **Vous devez mettre à jour manuellement** si nécessaire

### ✅ Bonne pratique : Utiliser Auto-Sync par défaut

- **80% de vos bundles** devraient utiliser **Auto-Sync (🔄)**
- Ne verrouillez que les bundles avec **raison business spécifique** :
  - Promotion temporaire
  - Tarif négocié
  - Budget strict validé

### 📊 Principe Pareto 80/20

Cette fonctionnalité suit le **principe Pareto** :
- **80% des bundles** = Auto-Sync (🔄) - Cas général
- **20% des bundles** = Prix Fixe (🔒) - Cas spéciaux

---

## 🎓 Exemples Pratiques

### Exemple 1 : Bundle Campagne Standard

**Contexte** : Vous créez un bundle standard pour une campagne électorale municipale.

**Produits** :
- 200 T-shirts @ 1800 XAF → **Auto-Sync 🔄**
- 100 Casquettes @ 1200 XAF → **Auto-Sync 🔄**
- 500 Flyers @ 50 XAF → **Auto-Sync 🔄**

**Total** : 505 000 XAF

**Scénario** : Votre fournisseur augmente le prix des T-shirts à 2000 XAF.

**Résultat automatique** :
- 200 T-shirts @ 2000 XAF (prix mis à jour ✅)
- 100 Casquettes @ 1200 XAF (inchangé)
- 500 Flyers @ 50 XAF (inchangé)

**Nouveau total** : 545 000 XAF ✅ (automatique, aucune action requise)

---

### Exemple 2 : Bundle Promotion Spéciale

**Contexte** : Vous créez un bundle promotionnel "Offre Rentrée -15%" valable jusqu'au 30 septembre.

**Produits** :
- 300 Cahiers @ 400 XAF → **Prix Fixe 🔒** (tarif promo 340 XAF)
- 200 Stylos @ 100 XAF → **Prix Fixe 🔒** (tarif promo 85 XAF)

**Total figé** : 119 000 XAF

**Scénario** : Vous augmentez le prix des Cahiers à 450 XAF dans le catalogue.

**Résultat** :
- 300 Cahiers @ 340 XAF (prix promo **figé** 🔒)
- 200 Stylos @ 85 XAF (prix promo **figé** 🔒)

**Total inchangé** : 119 000 XAF ✅ (le tarif promotionnel reste valide)

---

### Exemple 3 : Bundle Mixte (Auto-Sync + Prix Fixe)

**Contexte** : Vous créez un bundle avec produits standards ET tarif négocié spécial.

**Produits** :
- 100 T-shirts @ 1800 XAF → **Auto-Sync 🔄** (prix standard)
- 500 Porte-clés @ 200 XAF → **Prix Fixe 🔒** (tarif négocié spécial 150 XAF)

**Total** : 255 000 XAF

**Scénario 1** : Vous augmentez le prix des T-shirts à 2000 XAF.

**Résultat** :
- 100 T-shirts @ 2000 XAF (mis à jour ✅)
- 500 Porte-clés @ 150 XAF (figé 🔒)

**Nouveau total** : 275 000 XAF

**Scénario 2** : Vous augmentez le prix des Porte-clés à 300 XAF dans le catalogue.

**Résultat** :
- 100 T-shirts @ 2000 XAF (Auto-Sync)
- 500 Porte-clés @ 150 XAF (toujours figé 🔒, tarif négocié préservé)

**Total inchangé** : 275 000 XAF

---

## 🔧 Technique : Ce qui se passe en coulisse

**Pour les curieux** (non indispensable à la compréhension) :

### Base de données
- Chaque produit dans un bundle possède un champ `price_locked` (booléen)
- `price_locked = false` (0) → Auto-Sync 🔄 (par défaut)
- `price_locked = true` (1) → Prix Fixe 🔒

### API
- Lors de la sauvegarde du bundle, l'API persiste le flag `priceLocked` pour chaque produit
- Lors de la récupération du bundle, le flag est restitué pour afficher la checkbox correctement

### Validation
- Le schéma Zod valide que `priceLocked` est un booléen
- Valeur par défaut : `false` (Auto-Sync recommandé)

---

## ❓ FAQ

### Q1 : Que se passe-t-il si j'oublie de verrouiller un bundle promotionnel ?

**R** : Si vous ne verrouillez pas (🔒) un bundle avec tarif spécial, les prix se synchroniseront automatiquement avec le catalogue. Si vous augmentez les prix catalogue, **votre tarif promotionnel disparaîtra**.

**Solution** : Toujours **activer Prix Fixe (🔒)** pour les promotions/tarifs négociés.

---

### Q2 : Puis-je mélanger Auto-Sync et Prix Fixe dans un même bundle ?

**R** : **Oui !** C'est même recommandé dans certains cas (voir Exemple 3 ci-dessus).

**Exemple** : Produits standards en Auto-Sync, produit avec tarif négocié en Prix Fixe.

---

### Q3 : Comment savoir quel mode est actif sur un produit ?

**R** : Regardez l'icône à côté de la checkbox :
- **🔄 Auto-sync** = Prix synchronisé avec le catalogue
- **🔒 Prix fixe** = Prix figé

Vous pouvez aussi **survoler la checkbox** pour voir le tooltip explicatif.

---

### Q4 : Que se passe-t-il si je change un produit de Prix Fixe vers Auto-Sync ?

**R** : Le prix du produit dans le bundle **se synchronisera immédiatement** avec le prix actuel du catalogue.

**Exemple** :
- Produit en Prix Fixe à 1200 XAF
- Prix catalogue actuel : 1500 XAF
- Vous décochez (🔒 → 🔄)
- ➡️ Prix passe instantanément à 1500 XAF ✅

---

### Q5 : Price Lock fonctionne-t-il pour les bundles existants ?

**R** : **Oui !** Tous les bundles existants avant le déploiement de cette feature ont été configurés en mode **Prix Fixe (🔒)** par défaut pour **préserver le comportement actuel** (aucune régression).

**Recommandation** : Pour vos nouveaux bundles, utilisez **Auto-Sync (🔄)** sauf si vous avez une raison spécifique de figer les prix.

---

### Q6 : Puis-je voir l'historique des changements de prix ?

**R** : Actuellement, l'historique des prix n'est pas tracé. Cette feature pourrait être ajoutée dans une future version.

**Astuce temporaire** : Notez les tarifs spéciaux dans le champ "Description" du bundle.

---

## 📚 Ressources Complémentaires

- **Guide Migration Production** : `GUIDE_MIGRATION_PRODUCTION.md` (technique)
- **Rapport Validation Tests** : `PRICE_LOCK_VALIDATION_REPORT.md` (technique)
- **Support technique** : Contacter l'équipe dev NS2PO

---

## 🎉 Résumé en 3 Points

1. **🔄 Auto-Sync (Défaut)** : Prix synchronisé automatiquement → Utilisez pour 80% de vos bundles
2. **🔒 Prix Fixe (Opt-in)** : Prix figé manuellement → Utilisez pour promotions/tarifs négociés (20% des cas)
3. **Checkbox simple** : Cochez pour figer (🔒), décochez pour synchroniser (🔄)

---

**Bonne gestion de vos bundles ! 🚀**

**NS2PO - Publicité par l'Objet depuis 2011**
