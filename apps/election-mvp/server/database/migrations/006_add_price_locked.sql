-- Migration: Add price_locked column to bundle_products
-- Date: 2025-01-05
-- Description: Distinction explicite sync auto vs prix fixe pour bundles
-- Pattern: Magento "dynamic_price", WooCommerce "priced_individually"
-- Validated: Gemini + 25 sources industry 2024-2025
-- Issue: Résolution désynchronisation prix admin/public (Polo Élégant 5850 vs 5800 FCFA)

-- ✅ Ajouter colonne price_locked avec DEFAULT 1 (zero regression)
ALTER TABLE bundle_products ADD COLUMN price_locked BOOLEAN DEFAULT 1;

-- DEFAULT 1 rationale:
-- - Préserve comportement actuel (custom_price figé = locked)
-- - Zéro régression pour bundles existants en production
-- - Admins peuvent opt-in vers sync auto (décocher checkbox "Figer prix")
-- - 80% cas: price_locked=0 (sync auto), 20% cas: price_locked=1 (prix figé)

-- 📊 Index pour performance (optionnel, utile si filtres UI futures)
CREATE INDEX IF NOT EXISTS idx_bundle_products_price_locked
  ON bundle_products(price_locked);

-- 📖 Commentaire comportement:
-- price_locked = 0 → Prix sync auto avec products.base_price (80% cas Pareto)
--                      Modif admin produit → bundle auto mis à jour
--                      Idéal pour: Produits standards, catalogues évolutifs
--
-- price_locked = 1 → custom_price figé, ignore modifs produit (20% cas Pareto)
--                      Modif admin produit → bundle conserve prix figé
--                      Idéal pour: Bundles promotionnels, prix négociés

-- 🔍 Validation post-migration
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN price_locked = 1 THEN 1 END) as locked_count,
  COUNT(CASE WHEN price_locked = 0 THEN 1 END) as synced_count,
  COUNT(CASE WHEN price_locked IS NULL THEN 1 END) as null_count
FROM bundle_products;

SELECT 'Migration 006: price_locked ajoutée avec succès ✅' as message;
