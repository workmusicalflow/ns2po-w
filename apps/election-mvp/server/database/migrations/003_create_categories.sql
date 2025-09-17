-- Migration: Création table categories pour API autonome Turso
-- Date: 2025-09-17
-- Description: Création table categories avec données cohérentes produits existants

-- Création table categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Contraintes
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Trigger pour updated_at
CREATE TRIGGER IF NOT EXISTS categories_updated_at
    AFTER UPDATE ON categories
    FOR EACH ROW
BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Données initiales basées sur produits existants
INSERT OR IGNORE INTO categories (id, name, slug, description, icon, color, sort_order) VALUES
('textile', 'TEXTILE', 'textile', 'Vêtements et textiles personnalisables', 'shirt', '#3B82F6', 1),
('accessoire', 'ACCESSOIRE', 'accessoire', 'Accessoires et objets promotionnels', 'cap', '#10B981', 2),
('bureau', 'BUREAU', 'bureau', 'Fournitures de bureau personnalisées', 'pen', '#F59E0B', 3);

-- Sous-catégories
INSERT OR IGNORE INTO categories (id, name, slug, description, parent_id, icon, color, sort_order) VALUES
('vetement', 'VETEMENT', 'vetement', 'Vêtements personnalisables', 'textile', 'tshirt', '#60A5FA', 1),
('couvre-chef', 'COUVRE_CHEF', 'couvre-chef', 'Casquettes et chapeaux', 'accessoire', 'cap', '#34D399', 1),
('publicitaire', 'PUBLICITAIRE', 'publicitaire', 'Objets publicitaires', 'bureau', 'pen', '#FBBF24', 1);

-- Vérification des données insérées
SELECT
  c.name as category,
  p.name as parent_category,
  c.description,
  c.sort_order,
  c.is_active
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
ORDER BY COALESCE(p.sort_order, c.sort_order), c.sort_order;

-- Message de confirmation
SELECT 'Table categories créée avec succès - ' || COUNT(*) || ' catégories configurées' as message
FROM categories;