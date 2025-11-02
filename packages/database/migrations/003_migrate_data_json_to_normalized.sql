-- Migration 003: Migration Données JSON → Tables Normalisées
-- Date: 2025-10-31
-- Dépend de: 002_optimize_schema_json_to_native.sql
-- Type: DATA MIGRATION (peut être exécuté progressivement)

-- ========================================
-- SCRIPT 1: Migration Materials (products.materials TEXT → product_materials)
-- ========================================

-- Ce script doit être exécuté via code TypeScript/JavaScript car nécessite parsing JSON
-- Exemple de logique à implémenter:
--
-- 1. SELECT id, materials FROM products WHERE materials IS NOT NULL AND materials != ''
-- 2. Pour chaque produit:
--    - JSON.parse(materials) → array de strings
--    - Pour chaque material:
--      INSERT INTO product_materials (
--        id, product_id, material_name, is_primary, display_order
--      ) VALUES (
--        'mat_' + timestamp + '_' + random,
--        product_id,
--        material_name,
--        index === 0, -- Premier = primary
--        index
--      )
--
-- Voir script: scripts/migrate-materials-to-normalized.ts

-- ========================================
-- SCRIPT 2: Migration Colors (products.colors TEXT → product_colors)
-- ========================================

-- Logique similaire pour colors:
-- 1. SELECT id, colors FROM products WHERE colors IS NOT NULL
-- 2. JSON.parse(colors) → array
-- 3. INSERT INTO product_colors pour chaque couleur
--
-- Voir script: scripts/migrate-colors-to-normalized.ts

-- ========================================
-- SCRIPT 3: Migration Sizes (products.sizes TEXT → product_sizes)
-- ========================================

-- Logique similaire pour sizes:
-- Voir script: scripts/migrate-sizes-to-normalized.ts

-- ========================================
-- SCRIPT 4: Migration Gallery (products.gallery_urls TEXT → product_gallery)
-- ========================================

-- Logique:
-- 1. SELECT id, gallery_urls, image_url FROM products
-- 2. JSON.parse(gallery_urls) → array d'URLs
-- 3. INSERT INTO product_gallery
--    - image_url (colonne principale) → image_type = 'primary'
--    - gallery_urls[0..n] → image_type = 'variant'
--
-- Voir script: scripts/migrate-gallery-to-normalized.ts

-- ========================================
-- SCRIPT 5: Migration Tags (génération à partir category, subcategory, materials)
-- ========================================

-- Générer tags intelligents depuis données existantes:
-- INSERT INTO product_tags (id, product_id, tag_name, tag_type)
-- SELECT
--   'tag_cat_' || p.id || '_' || LOWER(p.category),
--   p.id,
--   LOWER(p.category),
--   'category'
-- FROM products p
-- WHERE p.category IS NOT NULL
-- UNION ALL
-- SELECT
--   'tag_subcat_' || p.id || '_' || LOWER(p.subcategory),
--   p.id,
--   LOWER(p.subcategory),
--   'category'
-- FROM products p
-- WHERE p.subcategory IS NOT NULL;

-- Tags additionnels basés sur customizable, is_featured, etc.:
INSERT INTO product_tags (id, product_id, tag_name, tag_type)
SELECT
  'tag_feat_' || id,
  id,
  'personnalisable',
  'feature'
FROM products
WHERE customizable = TRUE;

INSERT INTO product_tags (id, product_id, tag_name, tag_type)
SELECT
  'tag_new_' || id,
  id,
  'nouveau',
  'feature'
FROM products
WHERE is_new = TRUE;

-- ========================================
-- SCRIPT 6: Populate FTS Search Table
-- ========================================

-- Peupler la table FTS virtuelle avec données existantes
INSERT INTO products_search_fts(product_id, name, description, category, subcategory)
SELECT
  id,
  name,
  COALESCE(description, ''),
  COALESCE(category, ''),
  COALESCE(subcategory, '')
FROM products
WHERE is_active = TRUE;

-- ========================================
-- SCRIPT 7: Migration Order Items (orders.items TEXT → order_items)
-- ========================================

-- Ce script nécessite parsing JSON complexe côté application
-- Logique:
-- 1. SELECT id, items FROM orders
-- 2. JSON.parse(items) → array d'objets {productId, quantity, price, customization}
-- 3. Pour chaque item:
--    INSERT INTO order_items (
--      id, order_id, product_id, quantity, unit_price, subtotal,
--      product_snapshot, customization_data
--    ) VALUES (...)
--
-- Voir script: scripts/migrate-order-items-to-normalized.ts

-- ========================================
-- SCRIPT 8: Enrichissement Customers Stats
-- ========================================

-- Calculer statistiques customers depuis orders existants
UPDATE customers
SET
  total_orders_count = (
    SELECT COUNT(*) FROM orders WHERE customer_id = customers.id
  ),
  total_spent_amount = (
    SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE customer_id = customers.id
  ),
  last_order_date = (
    SELECT MAX(created_at) FROM orders WHERE customer_id = customers.id
  );

-- Segmenter customers par valeur
UPDATE customers
SET customer_segment = CASE
  WHEN total_spent_amount > 500000 THEN 'vip'
  WHEN total_orders_count >= 3 THEN 'regular'
  WHEN total_orders_count > 0 THEN 'active'
  ELSE 'new'
END;

-- ========================================
-- SCRIPT 9: Enrichissement Products Stats
-- ========================================

-- Calculer view_count et order_count depuis historique
-- (Nécessite logs analytics ou tracking existant)
-- Pour MVP, initialiser à 0 puis tracker en temps réel

UPDATE products
SET
  popularity_score = (
    -- Score basé sur commandes + vues (formule simple)
    COALESCE(order_count, 0) * 10 + COALESCE(view_count, 0)
  );

-- Marquer produits populaires
UPDATE products
SET is_featured = TRUE
WHERE popularity_score > (
  SELECT AVG(popularity_score) * 1.5 FROM products
)
LIMIT 10;

-- ========================================
-- NOTES IMPORTANTES
-- ========================================

-- ⚠️ ORDRE D'EXÉCUTION :
-- 1. Migration 002 (schema) - SQL pur
-- 2. Migration 003 (data) - Nécessite scripts TypeScript pour parsing JSON
-- 3. Validation données migrées
-- 4. Mise à jour API pour utiliser nouvelles tables
-- 5. Tests E2E complets
-- 6. Déploiement progressif (feature flags)
--
-- ⚠️ STRATÉGIE ROLLBACK :
-- - Garder colonnes JSON TEXT intactes pendant 1 mois
-- - Si problème, revenir aux anciennes colonnes
-- - Supprimer données normalisées si nécessaire
--
-- ⚠️ PERFORMANCE :
-- - Migration peut prendre 5-30min selon volume données
-- - Exécuter hors heures de pointe
-- - Monitorer charge CPU/Mémoire Railway
--
-- ⚠️ VALIDATION POST-MIGRATION :
-- SELECT COUNT(*) FROM products; -- Doit être identique
-- SELECT COUNT(*) FROM product_materials; -- Doit avoir N materials
-- SELECT COUNT(*) FROM product_colors; -- Doit avoir N colors
-- SELECT p.id, COUNT(pm.id) FROM products p
--   LEFT JOIN product_materials pm ON p.id = pm.product_id
--   GROUP BY p.id HAVING COUNT(pm.id) = 0; -- Doit être vide si tous produits ont materials
