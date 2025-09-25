-- Migration 005: Création de la table de blacklist pour auto-discovery
-- Permet de mémoriser les réalisations auto-discovery supprimées par l'utilisateur
-- et d'éviter leur re-découverte automatique depuis Cloudinary

-- Table de blacklist des réalisations auto-discovery
CREATE TABLE IF NOT EXISTS realisation_blacklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  original_title TEXT,
  reason TEXT DEFAULT 'user_deleted',
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blacklisted_by TEXT DEFAULT 'admin'
);

-- Index pour optimiser les requêtes de filtrage auto-discovery
CREATE INDEX IF NOT EXISTS idx_realisation_blacklist_public_id
ON realisation_blacklist(public_id);

-- Index pour les requêtes par date
CREATE INDEX IF NOT EXISTS idx_realisation_blacklist_date
ON realisation_blacklist(blacklisted_at DESC);

-- Insertion de données exemple pour test (optionnel)
-- Ces entrées peuvent être supprimées après validation
INSERT OR IGNORE INTO realisation_blacklist (public_id, original_title, reason) VALUES
('ns2po/gallery/creative/test_deleted', 'Test Supprimé', 'test_data');