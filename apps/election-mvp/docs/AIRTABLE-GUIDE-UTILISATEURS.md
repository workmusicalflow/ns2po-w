# 📋 Guide d'Utilisation - Gestion Assets NS2PO via Airtable

*Guide destiné aux équipes non-techniques pour gérer efficacement les assets visuels*

## 🎯 Vue d'ensemble

Le système de gestion des assets NS2PO utilise Airtable comme interface principale pour organiser, rechercher et gérer tous les éléments visuels (logos, produits, backgrounds).

### 🔗 Accès Direct
- **Base Airtable**: [NS2PO Assets Management](https://airtable.com/apprQLdnVwlbfnioT)
- **Table principale**: Assets (tbla8baaBOSTBRtEM)

---

## 👥 Vues par Rôle Utilisateur

### 📊 **Asset Manager** - Dashboard Complet
> *Vue principale pour gérer tous les assets*

**Utilisation**:
- Voir tous les assets actifs et en traitement
- Vérifier les statuts et métadonnées
- Accéder directement aux URLs Cloudinary
- Modifier les notes et catégories

**Navigation**:
1. Ouvrir la vue "📊 Dashboard Asset Manager"
2. Trier par date de mise à jour (plus récent en haut)
3. Utiliser les filtres de statut : ✅ Active ou 🔄 Processing

**Actions courantes**:
- ✅ **Valider un asset** : Changer Status de "🔄 Processing" à "✅ Active"
- 📝 **Ajouter des notes** : Cliquer sur le champ Notes, expliquer l'usage
- 🏷️ **Catégoriser** : Sélectionner la bonne Category dans la liste

---

### 🎨 **Designer Graphique** - Galerie Visuelle  
> *Aperçu créatif de tous les éléments visuels*

**Utilisation**:
- Vue galerie pour inspiration visuelle
- Focus sur logos et backgrounds
- Accès rapide aux dimensions et formats

**Navigation**:
1. Ouvrir la vue "🎨 Galerie Designer"
2. Parcourir visuellement les assets
3. Cliquer sur un asset pour voir les détails

**Actions courantes**:
- 🔍 **Recherche par tags** : Utiliser les filtres de tags créatifs
- 📐 **Vérifier dimensions** : Consulter le champ Dimensions
- 🎯 **Copier URL** : Clic droit sur CloudinaryURL → Copier

---

### 🔄 **Content Creator** - Workflow Status
> *Suivi en colonnes de l'avancement des projets*

**Utilisation**:
- Vue Kanban avec colonnes par statut
- Glisser-déposer pour changer les statuts
- Vision claire de l'avancement

**Navigation**:
1. Ouvrir la vue "🔄 Workflow Status"
2. Voir les colonnes : 📄 Draft → 🔄 Processing → ✅ Active → 🗄 Archived
3. Glisser les cartes entre colonnes pour mettre à jour

**Actions courantes**:
- ➡️ **Faire avancer** : Glisser de Draft vers Processing
- ✅ **Finaliser** : Glisser vers Active quand terminé  
- 🗄️ **Archiver** : Glisser vers Archived si obsolète

---

### 💼 **Équipe Commerciale** - Catalogue Produits
> *Focus sur les assets utilisables en vente*

**Utilisation**:
- Uniquement les assets produits actifs
- Informations essentielles pour devis
- Accès direct aux URLs pour présentations

**Navigation**:
1. Ouvrir la vue "💼 Produits Commercial"
2. Assets filtrés automatiquement (produits + catalogue)
3. Informations visibles : nom, catégorie, dimensions, URL

**Actions courantes**:
- 💰 **Intégrer devis** : Copier CloudinaryURL pour insertion
- 📏 **Vérifier specs** : Consulter Dimensions et FileSize
- 🎯 **Usage client** : Consulter le champ Usage

---

### 📅 **Directeur Marketing** - Planning Stratégique
> *Vision temporelle pour planification campaigns*

**Utilisation**:
- Vue calendrier de création d'assets
- Planification des campagnes par période
- Suivi productivité équipe créative

**Navigation**:
1. Ouvrir la vue "📅 Planning Assets"
2. Voir la timeline de création/mise à jour
3. Filtrer par période (mois, trimestre)

**Actions courantes**:
- 📈 **Analyser tendances** : Observer pics de création
- 🎯 **Planifier campagnes** : Identifier périodes disponibles
- 👥 **Évaluer équipe** : Suivre productivité créative

---

## 🛠️ Actions Communes

### ➕ Ajouter un Nouvel Asset
1. Cliquer sur **+ Nouvel enregistrement**
2. Remplir les champs obligatoires :
   - **AssetName** : Nom descriptif sans extension
   - **Category** : Choisir dans la liste (Produits, Logos, etc.)
   - **Status** : Généralement "🔄 Processing" au début
3. Sauvegarder

### ✏️ Modifier un Asset Existant
1. Cliquer sur l'enregistrement à modifier
2. Modifier les champs nécessaires
3. **UpdatedAt** se met à jour automatiquement
4. Sauvegarder

### 🔍 Rechercher un Asset
1. Utiliser la barre de recherche en haut
2. Ou utiliser les filtres de chaque vue
3. Rechercher par : nom, catégorie, tags, statut

### 🏷️ Système de Tags
- **👔 Textile** : Produits textiles
- **🎁 Gadget** : Objets publicitaires
- **🗳️ Politique** : Éléments spécifiques élections
- **🖼️ Background** : Arrière-plans et designs
- **🎨 Design** : Éléments créatifs
- **🎯 Campagne** : Assets campagne électorale

---

## 📋 Statuts des Assets

| Statut | Icône | Signification | Action |
|--------|-------|---------------|--------|
| Draft | 📄 | En cours de création | Content Creator travaille dessus |
| Processing | 🔄 | En cours de traitement | Upload/optimisation en cours |
| Active | ✅ | Prêt à l'utilisation | Utilisable dans projets |
| Archived | 🗄 | Archivé/obsolète | Ne plus utiliser |

---

## 🚀 Bonnes Pratiques

### ✅ À Faire
- **Toujours remplir le champ Notes** avec contexte d'usage
- **Utiliser les tags appropriés** pour faciliter la recherche  
- **Mettre à jour Status** dès qu'un asset change d'état
- **Vérifier dimensions** avant utilisation en production
- **Archiver les assets obsolètes** au lieu de les supprimer

### ❌ À Éviter
- Ne pas supprimer d'assets (archiver à la place)
- Ne pas modifier CloudinaryPublicID (géré automatiquement)  
- Ne pas laisser des assets en "Processing" trop longtemps
- Ne pas dupliquer les noms d'assets

---

## 🆘 Support & Questions

### 🔧 Problèmes Techniques
- **Asset non visible** → Vérifier le filtre IsActive = true
- **URL ne fonctionne pas** → Contacter l'équipe technique
- **Upload échoué** → Vérifier format de fichier supporté

### 💬 Questions Fonctionnelles
- **Quelle catégorie choisir ?** → Voir guide des catégories ci-dessous
- **Comment optimiser tags ?** → Utiliser 2-3 tags maximum, pertinents
- **Asset dupliqué ?** → Archiver l'ancien, garder le plus récent

---

## 📚 Annexes

### 🗂️ Guide des Catégories

| Catégorie | Utilisation | Exemples |
|-----------|-------------|----------|
| **Produits - Textiles** | T-shirts, polos, casquettes | textile-polo-blanc |
| **Produits - Gadgets** | Clés USB, stylos, mugs | gadget-usb-logo |
| **Produits - EPI** | Gilets, casques sécurité | epi-gilet-jaune |
| **Logos - Clients** | Logos partis politiques | logo-pdci-officiel |
| **Logos - Marque NS2PO** | Identité visuelle NS2PO | logo-ns2po-couleur |
| **Backgrounds - Élections** | Arrière-plans campagnes | bg-election-orange |
| **Hero - Banners** | Images principales site | hero-campagne-2024 |

### 🎨 Formats Supportés
- **Images** : PNG, JPG, WEBP, SVG
- **Taille max** : 10 MB par fichier
- **Résolutions** : Minimum 300 DPI pour impression

---

*Guide mis à jour le 22 août 2025 - Version 1.0*
*Pour suggestions d'amélioration : équipe technique NS2PO*