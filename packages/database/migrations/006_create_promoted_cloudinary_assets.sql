-- Migration 006: Création table promoted_cloudinary_assets
-- Date: 2025-12-02
-- Description: Table de traçabilité des images Cloudinary promues depuis auto-discovery
-- Objectif: Éviter la duplication des réalisations quand une image auto-discovery est promue
--           puis modifiée (changement d'image). L'image originale reste "consommée".

-- Table des assets Cloudinary promus (distinct de blacklist = suppression)
CREATE TABLE IF NOT EXISTS promoted_cloudinary_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,          -- Le public_id Cloudinary brut (ex: "ns2po/gallery/creative/banderole-001")
  promoted_to_realisation_id TEXT,          -- ID de la réalisation créée (ex: "real_xxx")
  original_title TEXT,                      -- Titre original de l'auto-discovery
  promoted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  promoted_by TEXT DEFAULT 'admin'
);

-- Index pour filtrage rapide dans auto-discovery
CREATE INDEX IF NOT EXISTS idx_promoted_assets_public_id
ON promoted_cloudinary_assets(public_id);

-- Index pour traçabilité vers réalisations
CREATE INDEX IF NOT EXISTS idx_promoted_assets_realisation
ON promoted_cloudinary_assets(promoted_to_realisation_id);

-- Commentaire de documentation
-- Usage:
--   1. Quand une réalisation auto-discovery est promue → INSERT dans cette table
--   2. Dans GET /api/realisations, filtrer auto-discovery en excluant ces public_ids
--   3. Si l'admin change l'image de la réalisation, l'original reste dans cette table
--   4. Pour "réactiver" une image: DELETE FROM promoted_cloudinary_assets WHERE public_id = ?
