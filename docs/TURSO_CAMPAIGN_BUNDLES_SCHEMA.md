# 📦 Documentation Schema Campaign Bundles - Turso Database

## 📋 Vue d'ensemble

La fonctionnalité Campaign Bundles permet de créer des packs de produits pré-configurés pour les campagnes électorales. Cette documentation détaille la structure de base de données nécessaire dans Turso.

## 🗄️ Structure des Tables

### 1. Table `campaign_bundles`

Table principale pour stocker les informations des bundles de campagne.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identifiant unique du bundle |
| `name` | TEXT | NOT NULL | Nom du bundle (ex: "Pack Starter Local") |
| `description` | TEXT | | Description détaillée du bundle |
| `target_audience` | TEXT | NOT NULL, CHECK IN ('local', 'regional', 'national', 'universal') | Audience cible |
| `base_price` | REAL | NOT NULL, DEFAULT 0 | Prix de base avant réduction |
| `discount_percentage` | REAL | DEFAULT 0, CHECK 0-100 | Pourcentage de réduction |
| `final_price` | REAL | GENERATED (base_price * (1 - discount_percentage/100)) | Prix final calculé |
| `is_active` | BOOLEAN | DEFAULT 1 | Bundle actif/inactif |
| `display_order` | INTEGER | DEFAULT 0 | Ordre d'affichage |
| `icon` | TEXT | | Icône du bundle (ex: "heroicons:flag") |
| `color` | TEXT | | Couleur thème du bundle (hex) |
| `features` | TEXT | | JSON array des fonctionnalités |
| `metadata` | TEXT | | JSON object pour données additionnelles |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date de modification |

### 2. Table `bundle_products`

Table de liaison many-to-many entre bundles et produits.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identifiant unique |
| `bundle_id` | INTEGER | NOT NULL, FK → campaign_bundles(id) | Référence au bundle |
| `product_id` | INTEGER | NOT NULL, FK → products(id) | Référence au produit |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1, CHECK > 0 | Quantité du produit |
| `custom_price` | REAL | | Prix personnalisé (optionnel) |
| `is_required` | BOOLEAN | DEFAULT 1 | Produit obligatoire dans le bundle |
| `display_order` | INTEGER | DEFAULT 0 | Ordre d'affichage |
| `metadata` | TEXT | | Configuration additionnelle (JSON) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date d'ajout |

**Contrainte unique**: `(bundle_id, product_id)`

### 3. Table `bundle_pricing_tiers`

Gestion de la tarification par volume pour les bundles.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Identifiant unique |
| `bundle_id` | INTEGER | NOT NULL, FK → campaign_bundles(id) | Référence au bundle |
| `min_quantity` | INTEGER | NOT NULL, CHECK > 0 | Quantité minimale |
| `max_quantity` | INTEGER | | Quantité maximale (NULL = illimité) |
| `discount_percentage` | REAL | NOT NULL, CHECK 0-100 | Réduction en pourcentage |
| `fixed_discount` | REAL | | Réduction fixe alternative |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Date de création |

**Contrainte unique**: `(bundle_id, min_quantity)`

## 🔍 Index de Performance

- `idx_campaign_bundles_active` sur `campaign_bundles(is_active)`
- `idx_campaign_bundles_audience` sur `campaign_bundles(target_audience)`
- `idx_bundle_products_bundle` sur `bundle_products(bundle_id)`
- `idx_bundle_products_product` sur `bundle_products(product_id)`
- `idx_bundle_pricing_bundle` sur `bundle_pricing_tiers(bundle_id)`

## 📊 Vue `bundle_statistics`

Vue calculée pour obtenir les statistiques des bundles :

```sql
SELECT
  - id, name, target_audience, final_price
  - product_count: Nombre de produits distincts
  - total_items: Quantité totale d'articles
  - total_products_value: Valeur totale des produits
  - savings: Économies réalisées
```

## 🔄 Triggers

- `update_campaign_bundles_timestamp`: Met à jour automatiquement `updated_at` lors des modifications

## 🚀 Migration

### Exécution de la migration

```bash
# Connexion à la base Turso
turso db shell ns2po-election-mvp

# Exécution du script SQL
.read apps/election-mvp/server/database/migrations/001_create_campaign_bundles.sql

# Vérification
.tables
.schema campaign_bundles
```

### Rollback si nécessaire

```sql
DROP VIEW IF EXISTS bundle_statistics;
DROP TABLE IF EXISTS bundle_pricing_tiers;
DROP TABLE IF EXISTS bundle_products;
DROP TABLE IF EXISTS campaign_bundles;
```

## 🎯 Cas d'usage

### 1. Création d'un bundle

```sql
INSERT INTO campaign_bundles (name, description, target_audience, base_price, discount_percentage)
VALUES ('Pack Starter', 'Bundle pour petites campagnes', 'local', 15000, 10);
```

### 2. Association de produits

```sql
INSERT INTO bundle_products (bundle_id, product_id, quantity, is_required)
VALUES
  (1, 1, 500, 1),  -- 500 flyers obligatoires
  (1, 2, 100, 1),  -- 100 affiches obligatoires
  (1, 3, 50, 0);   -- 50 t-shirts optionnels
```

### 3. Tarification par volume

```sql
INSERT INTO bundle_pricing_tiers (bundle_id, min_quantity, max_quantity, discount_percentage)
VALUES
  (1, 1, 10, 0),      -- 1-10: pas de réduction
  (1, 11, 50, 5),     -- 11-50: 5% de réduction
  (1, 51, NULL, 10);  -- 51+: 10% de réduction
```

## 📝 Notes importantes

1. **Foreign Keys**: Les suppressions en cascade sont configurées pour maintenir l'intégrité
2. **JSON Fields**: `features` et `metadata` stockent des données JSON comme TEXT
3. **Generated Columns**: `final_price` est calculé automatiquement
4. **Validation**: Les CHECK constraints garantissent la cohérence des données

## 🔗 Intégration avec l'application

### API Endpoints existants à adapter

- `POST /api/campaign-bundles` - Création
- `GET /api/campaign-bundles` - Listing
- `PUT /api/campaign-bundles/[id]` - Modification
- `DELETE /api/campaign-bundles/[id]` - Suppression

### Composables Vue.js

- `useCampaignBundles()` - Gestion des bundles côté client
- Interface admin dans `/admin/bundles/`

## 🏁 Prochaines étapes

1. ✅ Script SQL créé : `001_create_campaign_bundles.sql`
2. ⏳ Exécuter la migration dans Turso
3. ⏳ Adapter les API endpoints pour utiliser Turso au lieu d'Airtable
4. ⏳ Tester l'interface admin avec les nouvelles tables
5. ⏳ Migrer les données existantes d'Airtable vers Turso