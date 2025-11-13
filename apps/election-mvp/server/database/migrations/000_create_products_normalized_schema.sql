-- Migration 000: Create normalized products schema for E2E tests
-- Structure complète pour tests E2E avec schéma normalisé (post-migration 002)
-- Tables: products + relations (materials, colors, sizes, gallery, tags, FTS)

-- ========================================
-- 1. TABLE products (principale)
-- ========================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  base_price INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,
  unit TEXT DEFAULT 'pièce',
  production_time_days INTEGER DEFAULT 7,
  customizable INTEGER DEFAULT 0,
  image_url TEXT,
  specifications TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

-- ========================================
-- 2. TABLE product_materials (relation N-N normalisée)
-- ========================================
CREATE TABLE IF NOT EXISTS product_materials (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_materials_product ON product_materials(product_id);

-- ========================================
-- 3. TABLE product_colors (relation N-N normalisée)
-- ========================================
CREATE TABLE IF NOT EXISTS product_colors (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT,
  is_available INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_colors_product ON product_colors(product_id);

-- ========================================
-- 4. TABLE product_sizes (relation N-N normalisée)
-- ========================================
CREATE TABLE IF NOT EXISTS product_sizes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  size_name TEXT NOT NULL,
  size_category TEXT,
  is_available INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_sizes_product ON product_sizes(product_id);

-- ========================================
-- 5. TABLE product_gallery (images secondaires)
-- ========================================
CREATE TABLE IF NOT EXISTS product_gallery (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'variant',
  is_active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_gallery_product ON product_gallery(product_id);

-- ========================================
-- 6. TABLE product_tags (tags pour recherche)
-- ========================================
CREATE TABLE IF NOT EXISTS product_tags (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  tag_type TEXT DEFAULT 'category',
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);

-- ========================================
-- 7. TABLE products_search_fts (Full-Text Search FTS5 standalone)
-- ========================================
-- Note: Standalone FTS (pas de content externe) pour simplicité tests E2E
-- Sera alimentée manuellement via updateProductFTS()
CREATE VIRTUAL TABLE IF NOT EXISTS products_search_fts USING fts5(
  product_id UNINDEXED,
  name,
  description,
  category,
  subcategory
);

-- Message confirmation
SELECT 'Schéma produits normalisé créé pour tests E2E (7 tables)' as message;
