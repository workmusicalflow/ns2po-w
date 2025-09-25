-- Migration: Create campaign_bundles tables
-- Date: 2025-09-17
-- Description: Tables pour gérer les bundles de campagne avec leurs produits associés

-- Table principale des bundles de campagne
CREATE TABLE IF NOT EXISTS campaign_bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT CHECK(target_audience IN ('local', 'regional', 'national', 'universal')) NOT NULL,
  base_price REAL NOT NULL DEFAULT 0,
  discount_percentage REAL DEFAULT 0 CHECK(discount_percentage >= 0 AND discount_percentage <= 100),
  final_price REAL GENERATED ALWAYS AS (base_price * (1 - discount_percentage / 100)) STORED,
  is_active BOOLEAN DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  features TEXT, -- JSON array of features
  metadata TEXT, -- JSON object for additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison entre bundles et produits
CREATE TABLE IF NOT EXISTS bundle_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
  custom_price REAL, -- Prix personnalisé pour ce produit dans ce bundle (optionnel)
  is_required BOOLEAN DEFAULT 1, -- Si le produit est obligatoire dans le bundle
  display_order INTEGER DEFAULT 0,
  metadata TEXT, -- JSON object for additional product config
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bundle_id) REFERENCES campaign_bundles(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(bundle_id, product_id)
);

-- Table des règles de tarification par volume pour les bundles
CREATE TABLE IF NOT EXISTS bundle_pricing_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER NOT NULL,
  min_quantity INTEGER NOT NULL CHECK(min_quantity > 0),
  max_quantity INTEGER, -- NULL pour illimité
  discount_percentage REAL NOT NULL CHECK(discount_percentage >= 0 AND discount_percentage <= 100),
  fixed_discount REAL, -- Alternative au pourcentage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bundle_id) REFERENCES campaign_bundles(id) ON DELETE CASCADE,
  UNIQUE(bundle_id, min_quantity)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_campaign_bundles_active ON campaign_bundles(is_active);
CREATE INDEX IF NOT EXISTS idx_campaign_bundles_audience ON campaign_bundles(target_audience);
CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle ON bundle_products(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_products_product ON bundle_products(product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_pricing_bundle ON bundle_pricing_tiers(bundle_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER IF NOT EXISTS update_campaign_bundles_timestamp
AFTER UPDATE ON campaign_bundles
BEGIN
  UPDATE campaign_bundles
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- Vue pour récupérer les bundles avec leurs statistiques
CREATE VIEW IF NOT EXISTS bundle_statistics AS
SELECT
  cb.id,
  cb.name,
  cb.target_audience,
  cb.final_price,
  COUNT(DISTINCT bp.product_id) as product_count,
  SUM(bp.quantity) as total_items,
  SUM(
    CASE
      WHEN bp.custom_price IS NOT NULL THEN bp.custom_price * bp.quantity
      ELSE p.base_price * bp.quantity
    END
  ) as total_products_value,
  cb.final_price - SUM(
    CASE
      WHEN bp.custom_price IS NOT NULL THEN bp.custom_price * bp.quantity
      ELSE p.base_price * bp.quantity
    END
  ) as savings
FROM campaign_bundles cb
LEFT JOIN bundle_products bp ON cb.id = bp.bundle_id
LEFT JOIN products p ON bp.product_id = p.id
WHERE cb.is_active = 1
GROUP BY cb.id;

-- Insertion de données d'exemple basées sur les bundles existants
INSERT INTO campaign_bundles (name, description, target_audience, base_price, discount_percentage, is_active, display_order, icon, color, features) VALUES
('Pack Starter Local', 'Pack essentiel pour les campagnes locales avec les produits de base', 'local', 15000, 10, 1, 1, 'heroicons:flag', '#C99A3B', '["Idéal pour les campagnes municipales", "Produits essentiels inclus", "Personnalisation simple"]'),
('Pack Pro Régional', 'Pack complet pour rayonner sur votre région avec variété de supports', 'regional', 35000, 15, 1, 2, 'heroicons:globe-alt', '#6A2B3A', '["Couverture régionale optimale", "Large gamme de produits", "Impact maximal"]'),
('Pack Premium National', 'Solution complète pour les campagnes d''envergure nationale', 'national', 75000, 20, 1, 3, 'heroicons:star', '#D4AF37', '["Visibilité nationale", "Tous les supports premium", "Service prioritaire"]');

-- Message de confirmation
SELECT 'Tables campaign_bundles créées avec succès' as message;