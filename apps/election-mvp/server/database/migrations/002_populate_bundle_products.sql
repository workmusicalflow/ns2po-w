-- Migration: Populate bundle_products with logical associations
-- Date: 2025-09-17
-- Description: Associer les produits existants aux bundles de campagne de façon cohérente

-- Bundle 1: Pack Starter Local (pour campagnes locales)
-- Produits essentiels à petite quantité et prix abordable
INSERT INTO bundle_products (bundle_id, product_id, quantity, custom_price, is_required, display_order) VALUES
(1, 'textile-tshirt-001', 100, 4500, 1, 1),      -- 100 T-shirts à prix réduit
(1, 'textile-casquette-001', 50, 2800, 1, 2);    -- 50 casquettes à prix réduit

-- Bundle 2: Pack Pro Régional (pour campagnes régionales)
-- Mix équilibré avec quantités moyennes
INSERT INTO bundle_products (bundle_id, product_id, quantity, custom_price, is_required, display_order) VALUES
(2, 'textile-tshirt-001', 250, 4800, 1, 1),      -- 250 T-shirts
(2, 'textile-polo-001', 100, 7500, 1, 2),        -- 100 polos (plus premium)
(2, 'textile-casquette-001', 150, 2900, 1, 3);   -- 150 casquettes

-- Bundle 3: Pack Premium National (pour campagnes nationales)
-- Grandes quantités, tous les produits, tarifs dégressifs
INSERT INTO bundle_products (bundle_id, product_id, quantity, custom_price, is_required, display_order) VALUES
(3, 'textile-tshirt-001', 500, 4200, 1, 1),      -- 500 T-shirts à prix dégressif
(3, 'textile-polo-001', 300, 7000, 1, 2),        -- 300 polos à prix dégressif
(3, 'textile-casquette-001', 400, 2600, 1, 3);   -- 400 casquettes à prix dégressif

-- Vérification des associations créées
SELECT
  cb.name as bundle_name,
  p.name as product_name,
  bp.quantity,
  bp.custom_price,
  (bp.quantity * bp.custom_price) as subtotal
FROM bundle_products bp
JOIN campaign_bundles cb ON bp.bundle_id = cb.id
JOIN products p ON bp.product_id = p.id
ORDER BY cb.id, bp.display_order;

-- Message de confirmation
SELECT 'Relations bundle-produits créées avec succès' as message;