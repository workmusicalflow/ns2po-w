-- Migration 004: Création de la table assets pour la gestion Cloudinary
-- Architecture complète pour découplage assets/produits avec métadonnées enrichies

-- Création de la table assets pour gérer tous les assets Cloudinary
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  secure_url TEXT NOT NULL,
  url TEXT,
  format TEXT,
  resource_type TEXT DEFAULT 'image',
  bytes INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  caption TEXT,
  tags TEXT, -- JSON stringifié pour compatibilité SQLite
  folder TEXT DEFAULT 'ns2po/products',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0 -- BOOLEAN en SQLite
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_assets_public_id ON assets(public_id);
CREATE INDEX IF NOT EXISTS idx_assets_folder ON assets(folder);
CREATE INDEX IF NOT EXISTS idx_assets_format ON assets(format);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_is_deleted ON assets(is_deleted);

-- Ajout des colonnes de référence vers les assets dans la table products
ALTER TABLE products ADD COLUMN main_image_asset_id TEXT REFERENCES assets(id);
ALTER TABLE products ADD COLUMN gallery_asset_ids TEXT; -- JSON stringifié des IDs

-- Index pour les références d'assets dans products
CREATE INDEX IF NOT EXISTS idx_products_main_image_asset ON products(main_image_asset_id);

-- Fonction pour générer un ID unique d'asset (préfixé par asset_)
-- Note: En SQLite, nous génerons l'ID côté application plutôt qu'avec une fonction DB