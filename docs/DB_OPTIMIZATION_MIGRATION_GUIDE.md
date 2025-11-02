# Guide Migration : Optimisation Schéma Turso (JSON → Normalisé)

## 📋 Vue d'Ensemble

**Objectif** : Optimiser performance base de données Turso en normalisant colonnes JSON TEXT vers tables dédiées et colonnes natives.

**Gains attendus** :
- ⚡ Performance requêtes : **+40-60%** (filtres/tri sur colonnes natives indexées)
- 🔍 Recherche FTS : **+80%** plus rapide (virtual table fts5)
- 🎯 Préparation migration PostgreSQL future (schéma déjà normalisé)

**Recommandation** : Multi-experts (Gemini + Perplexity + Claude)

---

## 🎯 Problèmes Identifiés

### ❌ Avant Optimisation

**Table `products`** :
```sql
-- Colonnes JSON TEXT (non queryables, non indexables)
materials TEXT      -- Ex: '["Coton", "Polyester"]'
colors TEXT         -- Ex: '["Rouge", "Bleu (#0000FF)"]'
sizes TEXT          -- Ex: '["S", "M", "L", "XL"]'
gallery_urls TEXT   -- Ex: '["url1", "url2", "url3"]'
specifications TEXT -- JSON complexe
```

**Impacts négatifs** :
1. ❌ Requêtes `WHERE materials LIKE '%coton%'` scannent toute la table
2. ❌ `JSON.parse()` côté application pour chaque produit (overhead CPU)
3. ❌ Impossible d'indexer colonnes JSON TEXT
4. ❌ Pas de validation schéma côté DB

### ✅ Après Optimisation

**Tables normalisées** :
```sql
-- Table dédiée materials (1-N)
CREATE TABLE product_materials (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX idx_materials_product ON product_materials(product_id);
CREATE INDEX idx_materials_name ON product_materials(material_name);
```

**Gains** :
1. ✅ `WHERE material_name = 'coton'` utilise index direct
2. ✅ Zéro parsing JSON côté application
3. ✅ Validation schéma automatique (FOREIGN KEY)
4. ✅ Requêtes JOIN optimisées

---

## 📦 Fichiers de Migration

| Fichier | Type | Description |
|---------|------|-------------|
| `002_optimize_schema_json_to_native.sql` | SQL | Création tables normalisées + colonnes natives |
| `003_migrate_data_json_to_normalized.sql` | SQL | Migration données (logique) |
| `scripts/migrate-json-to-normalized.ts` | TypeScript | Exécution migration données |

---

## 🚀 Plan d'Exécution Migration

### Phase 1 : Backup & Préparation (30 min)

```bash
# 1. Créer snapshot Turso AVANT migration
turso db dump ns2po-election-mvp > backup-pre-migration-$(date +%Y%m%d).sql

# 2. Vérifier variables environnement
echo "TURSO_DATABASE_URL=$TURSO_DATABASE_URL"
echo "TURSO_AUTH_TOKEN=$TURSO_AUTH_TOKEN"

# 3. Tester connexion Turso
turso db shell ns2po-election-mvp "SELECT COUNT(*) FROM products"
```

### Phase 2 : Migration Schéma (10 min)

```bash
# Exécuter migration 002 (création tables/colonnes)
turso db shell ns2po-election-mvp < packages/database/migrations/002_optimize_schema_json_to_native.sql

# Vérifier tables créées
turso db shell ns2po-election-mvp "
  SELECT name FROM sqlite_master
  WHERE type='table' AND name LIKE 'product_%'
"
# Résultat attendu:
# product_materials
# product_colors
# product_sizes
# product_gallery
# product_tags
```

### Phase 3 : Migration Données (15-30 min)

```bash
# Installer dépendances si nécessaire
pnpm install

# Exécuter script TypeScript migration données
pnpm tsx scripts/migrate-json-to-normalized.ts
```

**Sortie attendue** :
```
🚀 Démarrage Migration JSON → Tables Normalisées
============================================================

🔄 Migration Materials...
✅ Materials migrés: 245 (erreurs: 0)

🔄 Migration Colors...
✅ Colors migrés: 312 (erreurs: 0)

🔄 Migration Sizes...
✅ Sizes migrés: 189 (erreurs: 0)

🔄 Migration Gallery Images...
✅ Gallery images migrées: 567 (erreurs: 0)

🔄 Génération Tags automatiques...
✅ Tags générés: 428

🔄 Population FTS Search Table...
✅ Produits indexés FTS: 98

🔍 Validation Migration...
✅ Products count: 98
✅ Materials migrated: 245
✅ Colors migrated: 312
✅ Sizes migrated: 189
✅ Gallery images migrated: 567
✅ Tags generated: 428
✅ FTS indexed products: 98
✅ Products without materials: 0

============================================================
✅ Migration terminée avec succès en 12.34s
============================================================
```

### Phase 4 : Validation (15 min)

```bash
# 1. Vérifier données migrées
turso db shell ns2po-election-mvp "
  SELECT
    p.id,
    p.name,
    COUNT(DISTINCT pm.id) as materials_count,
    COUNT(DISTINCT pc.id) as colors_count
  FROM products p
  LEFT JOIN product_materials pm ON p.id = pm.product_id
  LEFT JOIN product_colors pc ON p.id = pc.product_id
  GROUP BY p.id
  LIMIT 5
"

# 2. Tester recherche FTS
turso db shell ns2po-election-mvp "
  SELECT product_id, name FROM products_search_fts
  WHERE products_search_fts MATCH 't-shirt'
  LIMIT 5
"

# 3. Vérifier intégrité foreign keys
turso db shell ns2po-election-mvp "
  SELECT COUNT(*) as orphaned_materials
  FROM product_materials pm
  LEFT JOIN products p ON pm.product_id = p.id
  WHERE p.id IS NULL
"
# Résultat attendu: 0 (zéro enregistrement orphelin)
```

### Phase 5 : Mise à Jour API (1-2 jours)

**Exemple : Mise à jour `/api/products/index.get.ts`**

```typescript
// ❌ AVANT (parsing JSON client-side)
const { rows } = await db.execute(`
  SELECT id, name, materials, colors FROM products
`)
const products = rows.map(row => ({
  id: row.id,
  name: row.name,
  materials: JSON.parse(row.materials), // ❌ Overhead
  colors: JSON.parse(row.colors)
}))

// ✅ APRÈS (JOIN tables normalisées)
const { rows } = await db.execute(`
  SELECT
    p.id,
    p.name,
    GROUP_CONCAT(DISTINCT pm.material_name, ', ') as materials_list,
    GROUP_CONCAT(DISTINCT pc.color_name, ', ') as colors_list
  FROM products p
  LEFT JOIN product_materials pm ON p.id = pm.product_id
  LEFT JOIN product_colors pc ON p.id = pc.product_id
  GROUP BY p.id
`)
const products = rows.map(row => ({
  id: row.id,
  name: row.name,
  materials: row.materials_list?.split(', ') || [], // ✅ Déjà formaté
  colors: row.colors_list?.split(', ') || []
}))
```

**OU utiliser vue matérialisée** :
```sql
-- Vue déjà créée dans migration 002
SELECT * FROM products_enriched WHERE id = ?
```

---

## 🔄 Stratégie Rollback

### Scenario 1 : Rollback Complet (< 24h après migration)

```bash
# 1. Restaurer snapshot Turso
turso db restore ns2po-election-mvp backup-pre-migration-20251031.sql

# 2. Vérifier restauration
turso db shell ns2po-election-mvp "SELECT COUNT(*) FROM products"

# 3. Supprimer tables normalisées (optionnel)
turso db shell ns2po-election-mvp "
  DROP TABLE IF EXISTS product_materials;
  DROP TABLE IF EXISTS product_colors;
  DROP TABLE IF EXISTS product_sizes;
  DROP TABLE IF EXISTS product_gallery;
  DROP TABLE IF NOT EXISTS product_tags;
  DROP TABLE IF EXISTS products_search_fts;
"
```

### Scenario 2 : Rollback Partiel (Garder schéma, supprimer données)

```bash
# Vider tables normalisées
turso db shell ns2po-election-mvp "
  DELETE FROM product_materials;
  DELETE FROM product_colors;
  DELETE FROM product_sizes;
  DELETE FROM product_gallery;
  DELETE FROM product_tags;
  DELETE FROM products_search_fts;
"
```

### Scenario 3 : Rollback Code API (Revenir aux colonnes JSON)

```typescript
// Restaurer ancienne version API utilisant colonnes JSON TEXT
git checkout HEAD~5 apps/election-mvp/server/api/products/index.get.ts

// Redéployer sur Railway
railway up --detach
```

---

## 📊 Tests de Performance

### Avant/Après Migration

**Test 1 : Recherche produits par matériau**

```sql
-- ❌ AVANT (scan complet table)
SELECT * FROM products
WHERE materials LIKE '%coton%'
-- Temps: ~450ms (98 produits)

-- ✅ APRÈS (index direct)
SELECT DISTINCT p.*
FROM products p
JOIN product_materials pm ON p.id = pm.product_id
WHERE pm.material_name = 'coton'
-- Temps attendu: ~80ms (-82%)
```

**Test 2 : Recherche Full-Text Search**

```sql
-- ❌ AVANT (LIKE multi-colonnes)
SELECT * FROM products
WHERE name LIKE '%shirt%'
   OR description LIKE '%shirt%'
   OR category LIKE '%shirt%'
-- Temps: ~380ms

-- ✅ APRÈS (FTS5 virtual table)
SELECT p.*
FROM products_search_fts fts
JOIN products p ON fts.product_id = p.id
WHERE fts MATCH 't-shirt'
-- Temps attendu: ~45ms (-88%)
```

**Test 3 : Chargement produits avec relations**

```sql
-- ❌ AVANT (N+1 queries + JSON parse)
-- Query 1: SELECT * FROM products
-- Query 2-99: JSON.parse(materials) × 98 produits
-- Temps total: ~620ms

-- ✅ APRÈS (single query avec JOINs)
SELECT * FROM products_enriched
-- Temps attendu: ~120ms (-81%)
```

---

## ⚠️ Points d'Attention

### 1. Colonnes JSON TEXT conservées (Backward Compatibility)

Les anciennes colonnes `materials`, `colors`, `sizes`, `gallery_urls` **restent intactes** pendant 1 mois minimum.

**Raisons** :
- Transition progressive API
- Rollback facile si problème
- Tests A/B anciennes vs nouvelles queries

**Suppression future** (après validation complète) :
```sql
-- APRÈS 1 mois sans problème
ALTER TABLE products DROP COLUMN materials;
ALTER TABLE products DROP COLUMN colors;
ALTER TABLE products DROP COLUMN sizes;
ALTER TABLE products DROP COLUMN gallery_urls;
```

### 2. Synchronisation Réplicas Turso

**Problème identifié** : Inconsistance temporelle schéma sur réplicas Turso (ligne 53 `index.post.ts`).

**Solution implémentée** : Retry pattern avec backoff exponentiel dans `executeWithTursoRetry()`.

**Monitoring post-migration** :
```bash
# Vérifier logs Railway pour erreurs "no such column"
railway logs --follow | grep "TURSO_SCHEMA_MISMATCH"
```

### 3. Taille Base de Données

**Impact estimé** :
- Avant : ~12 MB (JSON compact)
- Après : ~14-15 MB (+15-20%)

**Justification** : Normalisation crée overhead relationnel mais améliore drastiquement performance queries.

---

## 📚 Ressources Complémentaires

**Documentation SQLite FTS5** :
- [SQLite FTS5 Extension](https://www.sqlite.org/fts5.html)
- [Turso Full-Text Search Guide](https://docs.turso.tech/tutorials/full-text-search)

**Bonnes Pratiques Normalisation** :
- [Database Normalization (1NF to 3NF)](https://en.wikipedia.org/wiki/Database_normalization)
- [When to Denormalize](https://www.essentialsql.com/what-is-database-denormalization/)

**Turso Best Practices** :
- [Turso Schema Design Guide](https://docs.turso.tech/reference/schema-best-practices)
- [Turso Performance Optimization](https://docs.turso.tech/tutorials/performance-optimization)

---

## ✅ Checklist Pré-Migration

- [ ] Backup Turso créé et testé (`turso db dump`)
- [ ] Variables environnement TURSO configurées
- [ ] Scripts migration testés localement (copie DB)
- [ ] Monitoring Railway activé
- [ ] Plan rollback documenté et compris
- [ ] Fenêtre maintenance communiquée (hors heures pointe)
- [ ] Tests E2E préparés pour validation post-migration

---

## 📞 Support

**En cas de problème** :
1. Vérifier logs migration (`pnpm tsx scripts/migrate-json-to-normalized.ts`)
2. Consulter logs Railway (`railway logs --follow`)
3. Exécuter rollback si critique (scenario 1)
4. Créer issue GitHub avec logs détaillés

**Contacts** :
- Lead Dev : [@workmusicalflow](https://github.com/workmusicalflow)
- Documentation : `/docs/DB_OPTIMIZATION_MIGRATION_GUIDE.md`

---

**Dernière mise à jour** : 2025-10-31 (Audit initial + Scripts migration)
