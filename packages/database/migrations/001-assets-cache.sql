-- Migration 001: Tables pour Cache Assets Local (Turso)
-- Optimisées pour performance et synchronisation Airtable

-- Table principale des assets en cache
CREATE TABLE IF NOT EXISTS assets_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Identifiants et références
  airtable_id TEXT UNIQUE NOT NULL,
  cloudinary_public_id TEXT UNIQUE NOT NULL,
  cloudinary_url TEXT NOT NULL,
  
  -- Métadonnées de base  
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('products', 'logos', 'backgrounds', 'icons')),
  subcategory TEXT NOT NULL,
  
  -- Statut et workflow
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'draft', 'archived', 'processing')),
  
  -- Métadonnées business (JSON pour flexibilité)
  business_metadata JSON, -- prix, quantité min, etc.
  
  -- Transformations Cloudinary disponibles
  transformations JSON,
  
  -- Métadonnées techniques
  upload_source TEXT DEFAULT 'freepik' CHECK(upload_source IN ('freepik', 'custom', 'client')),
  uploaded_by TEXT,
  
  -- Timestamps avec timezone
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_cache_invalidation DATETIME,
  
  -- Performance et search
  search_vector TEXT, -- Pour recherche full-text
  
  CONSTRAINT unique_cloudinary_id UNIQUE(cloudinary_public_id),
  CONSTRAINT unique_airtable_id UNIQUE(airtable_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_assets_cache_category ON assets_cache(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_assets_cache_status ON assets_cache(status);
CREATE INDEX IF NOT EXISTS idx_assets_cache_updated_at ON assets_cache(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_cache_search ON assets_cache(name, category, subcategory);
CREATE INDEX IF NOT EXISTS idx_assets_cache_sync ON assets_cache(last_sync DESC);

-- Table de journalisation des synchronisations
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Référence asset
  asset_cache_id INTEGER,
  airtable_id TEXT,
  
  -- Détails de l'opération
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete', 'invalidate')),
  sync_direction TEXT NOT NULL CHECK(sync_direction IN ('airtable_to_turso', 'turso_to_airtable')),
  
  -- Statut et erreurs
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('success', 'error', 'pending', 'retry')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Métadonnées de sync
  sync_data JSON, -- Données synchronisées
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (asset_cache_id) REFERENCES assets_cache(id) ON DELETE CASCADE
);

-- Index pour le monitoring
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_log_asset ON sync_log(asset_cache_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_airtable ON sync_log(airtable_id);

-- Table pour les statistiques de performance
CREATE TABLE IF NOT EXISTS asset_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Référence asset
  asset_cache_id INTEGER NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  
  -- Métriques de performance
  load_time_ms INTEGER,
  cache_hit_ratio REAL,
  transformation_time_ms INTEGER,
  
  -- Utilisation
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  last_accessed DATETIME,
  
  -- Bande passante
  bandwidth_used_kb INTEGER DEFAULT 0,
  
  -- Période de mesure
  measurement_date DATE DEFAULT (date('now')),
  
  FOREIGN KEY (asset_cache_id) REFERENCES assets_cache(id) ON DELETE CASCADE,
  CONSTRAINT unique_asset_date UNIQUE(asset_cache_id, measurement_date)
);

-- Index pour analytics
CREATE INDEX IF NOT EXISTS idx_performance_date ON asset_performance(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_asset ON asset_performance(asset_cache_id);
CREATE INDEX IF NOT EXISTS idx_performance_usage ON asset_performance(view_count DESC, download_count DESC);

-- Trigger pour mise à jour automatique des timestamps
CREATE TRIGGER IF NOT EXISTS update_assets_cache_timestamp 
AFTER UPDATE ON assets_cache
BEGIN
  UPDATE assets_cache SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger pour créer entrée de log automatiquement
CREATE TRIGGER IF NOT EXISTS log_asset_changes
AFTER UPDATE ON assets_cache
BEGIN
  INSERT INTO sync_log (
    asset_cache_id,
    airtable_id, 
    operation,
    sync_direction,
    status,
    sync_data
  ) VALUES (
    NEW.id,
    NEW.airtable_id,
    'update',
    'turso_to_airtable',
    'pending',
    json_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'updated_fields', json_array('status')
    )
  );
END;

-- Vue pour statistiques rapides
CREATE VIEW IF NOT EXISTS assets_stats AS
SELECT 
  category,
  subcategory,
  status,
  COUNT(*) as count,
  MAX(updated_at) as last_update,
  AVG(
    CASE WHEN business_metadata IS NOT NULL 
    THEN json_extract(business_metadata, '$.price_base') 
    END
  ) as avg_price
FROM assets_cache 
GROUP BY category, subcategory, status;

-- Vue pour le monitoring de sync
CREATE VIEW IF NOT EXISTS sync_health AS
SELECT 
  DATE(created_at) as sync_date,
  status,
  operation,
  COUNT(*) as count,
  AVG(
    CASE WHEN completed_at IS NOT NULL 
    THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60 * 60 
    END
  ) as avg_duration_seconds
FROM sync_log 
WHERE created_at >= date('now', '-7 days')
GROUP BY DATE(created_at), status, operation
ORDER BY sync_date DESC;

-- Configuration pragma pour performance
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA foreign_keys = ON;