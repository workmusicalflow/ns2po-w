-- Migration 005: Création table quote_items pour abandon complet Airtable
-- Remplace definitivement les QuoteItems d'Airtable par Turso
-- Date: 2025-09-17
-- Objectif: Support des articles de devis utilisés dans /devis et /devis-simple

CREATE TABLE IF NOT EXISTS quote_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  base_price INTEGER NOT NULL DEFAULT 0, -- Prix en centimes XOF
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER NOT NULL DEFAULT 1000,
  unit TEXT NOT NULL DEFAULT 'pièce',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Draft')),
  tags TEXT DEFAULT '[]', -- JSON array
  image_url TEXT,
  gallery_urls TEXT DEFAULT '[]', -- JSON array
  specifications TEXT, -- JSON object
  production_time_days INTEGER DEFAULT 7,
  customizable BOOLEAN DEFAULT 1,
  materials TEXT,
  colors TEXT DEFAULT '[]', -- JSON array
  sizes TEXT DEFAULT '[]', -- JSON array
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'turso',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_quote_items_active ON quote_items(is_active, status);
CREATE INDEX IF NOT EXISTS idx_quote_items_category ON quote_items(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_quote_items_featured ON quote_items(is_featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_quote_items_search ON quote_items(name, category);

-- Trigger pour updated_at automatique
CREATE TRIGGER IF NOT EXISTS quote_items_updated_at
  AFTER UPDATE ON quote_items
  FOR EACH ROW
  BEGIN
    UPDATE quote_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

-- Vue statistiques pour monitoring
CREATE VIEW IF NOT EXISTS quote_items_statistics AS
SELECT
  COUNT(*) as total_items,
  COUNT(CASE WHEN is_active = 1 AND status = 'Active' THEN 1 END) as active_items,
  COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_items,
  COUNT(DISTINCT category) as total_categories,
  AVG(base_price) as avg_price,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price,
  'turso' as source
FROM quote_items;

-- Données de fallback essentielles (compatibles avec le système de devis)
INSERT OR REPLACE INTO quote_items (
  id, name, description, category, subcategory, base_price, min_quantity, max_quantity,
  unit, status, tags, image_url, production_time_days, customizable, materials,
  colors, sizes, sort_order, is_featured, source
) VALUES
-- Textile essentials pour campagnes électorales
('textile-tshirt-1', 'T-Shirt Personnalisé Premium', 'T-shirt 100% coton peigné, idéal campagne électorale avec impression logo/slogan', 'Textile', 'Vêtement', 4500, 50, 2000, 'pièce', 'Active',
 '["textile","personnalisable","campagne","election"]',
 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/tshirt-campagne',
 5, 1, 'Coton 100% peigné, 160g/m²',
 '["Blanc","Rouge","Bleu","Jaune","Vert","Orange"]',
 '["XS","S","M","L","XL","XXL"]', 1, 1, 'turso'),

('textile-casquette-1', 'Casquette Brodée Campagne', 'Casquette ajustable avec broderie personnalisée pour visibilité politique', 'Textile', 'Couvre-Chef', 3200, 25, 1000, 'pièce', 'Active',
 '["textile","broderie","casquette","campagne","election"]',
 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/casquette-campagne',
 7, 1, 'Polyester/Coton, visière rigide',
 '["Rouge","Bleu","Blanc","Jaune","Vert"]',
 '["Unique ajustable"]', 2, 1, 'turso'),

-- Accessoires promotionnels
('accessoire-stylo-1', 'Stylo Publicitaire Premium', 'Stylo à bille avec gravure laser du nom/logo candidat', 'Accessoire', 'Bureau', 350, 100, 10000, 'pièce', 'Active',
 '["accessoire","stylo","gravure","promotion","bureau"]',
 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/stylo-grave',
 3, 1, 'Plastique ABS, encre bleue',
 '["Blanc","Bleu","Rouge","Noir"]',
 '["Standard"]', 3, 0, 'turso'),

('accessoire-porte-cles-1', 'Porte-clés Métal Personnalisé', 'Porte-clés métal avec logo en relief, idéal goodies campagne', 'Accessoire', 'Goodies', 1200, 50, 5000, 'pièce', 'Active',
 '["accessoire","porte-cles","metal","goodies","campagne"]',
 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/porte-cles-metal',
 10, 1, 'Alliage zinc, finition nickel',
 '["Argent","Or","Bronze"]',
 '["5cm x 3cm"]', 4, 0, 'turso'),

-- Support visuel
('visuel-affiche-1', 'Affiche Campagne A3', 'Affiche publicitaire format A3, papier couché brillant 350g', 'Visuel', 'Affichage', 800, 100, 10000, 'pièce', 'Active',
 '["visuel","affiche","campagne","impression","A3"]',
 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/affiche-a3',
 2, 1, 'Papier couché brillant 350g/m²',
 '["Standard CMJN"]',
 '["A3 (29.7 x 42 cm)"]', 5, 1, 'turso'),

('visuel-banderole-1', 'Banderole PVC Campagne', 'Banderole PVC résistante intérieur/extérieur avec œillets', 'Visuel', 'Signalétique', 4500, 5, 100, 'pièce', 'Active',
 '["visuel","banderole","pvc","exterieur","signaletique"]',
 'https://res.cloudinary.com/dsrvzogof/image/upload/w_800,h_600,c_fit,f_auto,q_auto/ns2po-assets/banderole-pvc',
 5, 1, 'PVC 440g/m², œillets métalliques',
 '["Impression couleur"]',
 '["2m x 0.8m","3m x 1m","4m x 1.2m"]', 6, 1, 'turso');

-- Vérification
SELECT 'Migration 005 terminée - ' || COUNT(*) || ' quote_items créés' as status FROM quote_items;