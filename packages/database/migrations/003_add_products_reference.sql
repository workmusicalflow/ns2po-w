-- Migration 003: Ajout de la colonne reference à la table products
-- Résolution de l'incohérence frontend/backend pour le champ référence produit

-- Ajouter la colonne reference à la table products
-- Cette colonne sera initialement nullable pour permettre la migration des produits existants
ALTER TABLE products ADD COLUMN reference TEXT;

-- Générer des références temporaires pour les produits existants
-- Format: AUTO-{timestamp}-{id_suffix} pour éviter les conflits
UPDATE products
SET reference = 'AUTO-' || strftime('%s', 'now') || '-' || SUBSTR(id, -6)
WHERE reference IS NULL;

-- Créer un index unique sur reference
-- Note: On ne peut pas ajouter UNIQUE constraint sur une colonne existante dans SQLite,
-- mais on peut créer un index unique qui aura le même effet
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_reference_unique ON products(reference);

-- Créer un index standard pour les performances de recherche
CREATE INDEX IF NOT EXISTS idx_products_reference ON products(reference);

-- Vérification que tous les produits ont maintenant une référence
-- Cette requête ne devrait retourner aucun résultat
-- SELECT COUNT(*) FROM products WHERE reference IS NULL;