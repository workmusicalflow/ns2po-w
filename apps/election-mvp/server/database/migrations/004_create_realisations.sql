-- Migration: Création table realisations pour API autonome Turso
-- Date: 2025-09-17
-- Description: Table realisations avec mappage exact interface TypeScript Realisation + HybridRealisation

-- Création table realisations
CREATE TABLE IF NOT EXISTS realisations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  cloudinary_public_ids TEXT DEFAULT '[]', -- JSON array de string
  product_ids TEXT DEFAULT '[]', -- JSON array de string (relations logiques vers products.id)
  category_ids TEXT DEFAULT '[]', -- JSON array de string (relations logiques vers categories.id)
  customization_option_ids TEXT DEFAULT '[]', -- JSON array de string
  tags TEXT DEFAULT '[]', -- JSON array de string
  is_featured BOOLEAN DEFAULT 0,
  order_position INTEGER DEFAULT 0, -- 'order' est réservé SQL
  is_active BOOLEAN DEFAULT 1,

  -- Champs HybridRealisation pour compatibilité API existante
  source TEXT CHECK(source IN ('airtable', 'cloudinary-auto-discovery', 'turso')) DEFAULT 'turso',
  cloudinary_urls TEXT, -- JSON array optionnel pour URLs générées
  cloudinary_metadata TEXT, -- JSON object optionnel avec metadata Cloudinary

  -- Audit trail
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Contraintes validation
  CONSTRAINT valid_json_arrays CHECK (
    json_valid(cloudinary_public_ids) AND
    json_valid(product_ids) AND
    json_valid(category_ids) AND
    json_valid(customization_option_ids) AND
    json_valid(tags)
  ),
  CONSTRAINT valid_cloudinary_metadata CHECK (
    cloudinary_metadata IS NULL OR json_valid(cloudinary_metadata)
  ),
  CONSTRAINT valid_cloudinary_urls CHECK (
    cloudinary_urls IS NULL OR json_valid(cloudinary_urls)
  )
);

-- Index pour performance (critiques pour API réalisations)
CREATE INDEX IF NOT EXISTS idx_realisations_active ON realisations(is_active);
CREATE INDEX IF NOT EXISTS idx_realisations_featured ON realisations(is_featured);
CREATE INDEX IF NOT EXISTS idx_realisations_order ON realisations(order_position);
CREATE INDEX IF NOT EXISTS idx_realisations_title ON realisations(title);
CREATE INDEX IF NOT EXISTS idx_realisations_source ON realisations(source);

-- Index composites pour queries courantes
CREATE INDEX IF NOT EXISTS idx_realisations_active_featured ON realisations(is_active, is_featured, order_position);
CREATE INDEX IF NOT EXISTS idx_realisations_active_order ON realisations(is_active, order_position);

-- Trigger pour updated_at automatique
CREATE TRIGGER IF NOT EXISTS realisations_updated_at
    AFTER UPDATE ON realisations
    FOR EACH ROW
BEGIN
    UPDATE realisations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Vue pour statistiques réalisations (utile pour admin)
CREATE VIEW IF NOT EXISTS realisation_statistics AS
SELECT
  COUNT(*) as total_realisations,
  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_realisations,
  COUNT(CASE WHEN is_featured = 1 AND is_active = 1 THEN 1 END) as featured_realisations,
  COUNT(CASE WHEN source = 'turso' THEN 1 END) as turso_realisations,
  COUNT(CASE WHEN source = 'airtable' THEN 1 END) as airtable_realisations,
  COUNT(CASE WHEN source = 'cloudinary-auto-discovery' THEN 1 END) as auto_discovery_realisations,
  AVG(json_array_length(cloudinary_public_ids)) as avg_images_per_realisation,
  AVG(json_array_length(product_ids)) as avg_products_per_realisation
FROM realisations;

-- Données d'exemple pour tests (basées sur architecture existante NS2PO)
INSERT OR IGNORE INTO realisations (
  id, title, description, cloudinary_public_ids, product_ids, category_ids,
  tags, is_featured, order_position, is_active, source
) VALUES
(
  'real-001',
  'Campagne Municipale Abidjan 2023',
  'Réalisation complète pour campagne municipale avec t-shirts, casquettes et flyers personnalisés',
  '["ns2po/campagne-abidjan-2023-tshirt", "ns2po/campagne-abidjan-2023-casquette", "ns2po/campagne-abidjan-2023-flyer"]',
  '["tshirt-basic", "casquette-classic"]',
  '["textile", "accessoire"]',
  '["campagne", "municipale", "abidjan", "politique"]',
  1, 1, 1, 'turso'
),
(
  'real-002',
  'Élection Présidentielle - Pack Supporter',
  'Pack complet supporter avec accessoires variés pour grande campagne nationale',
  '["ns2po/election-presidentielle-pack", "ns2po/election-presidentielle-gadgets"]',
  '["pack-premium-national"]',
  '["accessoire", "textile"]',
  '["présidentielle", "national", "supporter", "pack"]',
  1, 2, 1, 'turso'
),
(
  'real-003',
  'Campagne Régionale Bouaké',
  'Personnalisation textile pour campagne régionale avec logo et slogan spécifiques',
  '["ns2po/campagne-bouake-textile"]',
  '["tshirt-basic", "polo-campaign"]',
  '["textile"]',
  '["régionale", "bouaké", "textile", "personnalisation"]',
  0, 3, 1, 'turso'
);

-- Vérification données insérées
SELECT
  title,
  source,
  is_featured,
  is_active,
  json_array_length(cloudinary_public_ids) as nb_images,
  json_array_length(product_ids) as nb_products,
  json_array_length(category_ids) as nb_categories
FROM realisations
ORDER BY order_position;

-- Message de confirmation avec statistiques
SELECT
  'Table realisations créée avec succès - ' ||
  (SELECT COUNT(*) FROM realisations) || ' réalisations configurées' as message;

-- Validation schéma complet
SELECT
  'Validation: ' ||
  (SELECT COUNT(*) FROM realisation_statistics) || ' vue statistiques + ' ||
  (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name='realisations') || ' index créés'
  as validation;