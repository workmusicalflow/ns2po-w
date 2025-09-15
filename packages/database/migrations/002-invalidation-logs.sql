-- Migration 002: Tables pour Cache Invalidation et Monitoring Performance
-- Extension du système de cache avec logging d'invalidation

-- Table pour logger les opérations d'invalidation de cache
CREATE TABLE IF NOT EXISTS invalidation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Référence asset
  public_id TEXT NOT NULL,
  asset_cache_id INTEGER,
  
  -- Détails de l'invalidation
  strategy TEXT NOT NULL CHECK(strategy IN ('immediate', 'delayed', 'batch', 'careful', 'aggressive')),
  status TEXT NOT NULL CHECK(status IN ('start', 'success', 'error', 'timeout')),
  
  -- Performance
  duration_ms INTEGER DEFAULT 0,
  batch_size INTEGER DEFAULT 1,
  
  -- Erreurs et retry
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Métadonnées d'invalidation
  transformations_affected JSON, -- Liste des transformations invalidées
  cache_regions JSON, -- Régions CDN affectées
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (asset_cache_id) REFERENCES assets_cache(id) ON DELETE CASCADE
);

-- Index pour les performances de logging d'invalidation
CREATE INDEX IF NOT EXISTS idx_invalidation_logs_public_id ON invalidation_logs(public_id);
CREATE INDEX IF NOT EXISTS idx_invalidation_logs_created_at ON invalidation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invalidation_logs_status ON invalidation_logs(status);
CREATE INDEX IF NOT EXISTS idx_invalidation_logs_strategy ON invalidation_logs(strategy);

-- Table pour tracker les statuts de synchronisation système
CREATE TABLE IF NOT EXISTS sync_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Type de synchronisation
  sync_type TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('airtable-to-turso', 'turso-to-airtable', 'full')),
  
  -- Résultats de la synchronisation
  last_sync DATETIME NOT NULL,
  records_synced INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  
  -- Métadonnées de santé
  health_score INTEGER DEFAULT 100, -- Score sur 100
  issues_detected JSON, -- Problèmes détectés
  
  -- Configuration utilisée
  config_used JSON, -- batchSize, filters, etc.
  
  UNIQUE(sync_type, direction) ON CONFLICT REPLACE
);

-- Ajouter les colonnes manquantes à assets_cache pour le tracking avancé
-- Note: SQLite ne supporte pas ALTER COLUMN, donc on utilise des ALTER TABLE
ALTER TABLE assets_cache ADD COLUMN last_invalidation DATETIME;
ALTER TABLE assets_cache ADD COLUMN last_cleanup DATETIME;
ALTER TABLE assets_cache ADD COLUMN usage_count INTEGER DEFAULT 0;
ALTER TABLE assets_cache ADD COLUMN last_usage DATETIME;
ALTER TABLE assets_cache ADD COLUMN deleted_at DATETIME;
ALTER TABLE assets_cache ADD COLUMN is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1));
ALTER TABLE assets_cache ADD COLUMN filename TEXT;
ALTER TABLE assets_cache ADD COLUMN file_size INTEGER DEFAULT 0;
ALTER TABLE assets_cache ADD COLUMN cloudinary_metadata JSON;
ALTER TABLE assets_cache ADD COLUMN tags TEXT; -- CSV des tags

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_assets_cache_last_sync ON assets_cache(last_sync DESC);
CREATE INDEX IF NOT EXISTS idx_assets_cache_category_active ON assets_cache(category, is_active);
CREATE INDEX IF NOT EXISTS idx_assets_cache_last_invalidation ON assets_cache(last_invalidation DESC);
CREATE INDEX IF NOT EXISTS idx_assets_cache_usage ON assets_cache(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_assets_cache_tags ON assets_cache(tags);

-- Table pour les métriques de performance en temps réel
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Référence asset
  asset_cache_id INTEGER,
  public_id TEXT NOT NULL,
  
  -- Métriques Cloudinary
  bandwidth_used_mb REAL DEFAULT 0,
  transformations_count INTEGER DEFAULT 0,
  cache_hit_ratio REAL DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  
  -- Métriques d'invalidation
  invalidations_count INTEGER DEFAULT 0,
  avg_invalidation_time_ms INTEGER DEFAULT 0,
  failed_invalidations INTEGER DEFAULT 0,
  
  -- Période de mesure
  measurement_period TEXT NOT NULL, -- daily, weekly, monthly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_cache_id) REFERENCES assets_cache(id) ON DELETE CASCADE,
  CONSTRAINT unique_asset_period UNIQUE(asset_cache_id, measurement_period, period_start)
);

-- Index pour analytics de performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(measurement_period, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_asset ON performance_metrics(asset_cache_id);

-- Vue pour les statistiques d'invalidation
CREATE VIEW IF NOT EXISTS invalidation_stats AS
SELECT 
  strategy,
  status,
  COUNT(*) as operation_count,
  AVG(duration_ms) as avg_duration_ms,
  MIN(duration_ms) as min_duration_ms,
  MAX(duration_ms) as max_duration_ms,
  DATE(created_at) as operation_date,
  
  -- Calculs de performance
  ROUND(AVG(duration_ms), 2) as avg_duration,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as error_count,
  ROUND(
    (COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*)), 2
  ) as success_rate_pct
  
FROM invalidation_logs
WHERE created_at >= date('now', '-30 days') -- Limiter aux 30 derniers jours
GROUP BY strategy, status, DATE(created_at)
ORDER BY operation_date DESC, strategy;

-- Vue pour le monitoring de santé global
CREATE VIEW IF NOT EXISTS system_health AS
SELECT 
  'assets_cache' as component,
  COUNT(*) as total_items,
  COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_items,
  MAX(last_sync) as last_sync,
  AVG(usage_count) as avg_usage,
  
  -- Score de santé calculé
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN MAX(last_sync) < datetime('now', '-7 days') THEN 30
    WHEN COUNT(CASE WHEN is_active = 1 THEN 1 END) / COUNT(*) < 0.8 THEN 60
    ELSE 95
  END as health_score
FROM assets_cache

UNION ALL

SELECT 
  'invalidation_system' as component,
  COUNT(*) as total_items,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as active_items,
  MAX(created_at) as last_sync,
  AVG(duration_ms) as avg_usage,
  
  -- Score basé sur le taux de succès récent
  CASE 
    WHEN COUNT(*) = 0 THEN 0
    WHEN MAX(created_at) < datetime('now', '-1 day') THEN 40
    ELSE ROUND(COUNT(CASE WHEN status = 'success' THEN 1 END) * 100.0 / COUNT(*))
  END as health_score
FROM invalidation_logs 
WHERE created_at >= datetime('now', '-7 days')

UNION ALL

SELECT 
  'sync_system' as component,
  COUNT(*) as total_items,
  AVG(records_synced) as active_items,
  MAX(last_sync) as last_sync,
  AVG(duration_ms) as avg_usage,
  AVG(health_score) as health_score
FROM sync_status;

-- Vue pour les assets actifs avec métriques enrichies
CREATE VIEW IF NOT EXISTS active_assets_summary AS
SELECT 
  category,
  subcategory,
  COUNT(*) as total_count,
  AVG(file_size) as avg_size_bytes,
  ROUND(AVG(file_size) / 1024.0, 2) as avg_size_kb,
  MAX(last_sync) as last_sync,
  COUNT(CASE WHEN last_invalidation IS NOT NULL THEN 1 END) as invalidated_count,
  AVG(usage_count) as avg_usage,
  
  -- Dernière activité
  MAX(last_usage) as last_usage,
  
  -- Tags les plus utilisés (simple agrégation)
  GROUP_CONCAT(DISTINCT SUBSTR(tags, 1, 50)) as common_tags
  
FROM assets_cache 
WHERE is_active = 1 AND deleted_at IS NULL
GROUP BY category, subcategory
ORDER BY total_count DESC;

-- Trigger pour mise à jour automatique des métriques
CREATE TRIGGER IF NOT EXISTS update_usage_on_access
AFTER UPDATE OF last_usage ON assets_cache
BEGIN
  UPDATE assets_cache 
  SET usage_count = usage_count + 1 
  WHERE id = NEW.id;
END;

-- Trigger pour logger automatiquement les invalidations
CREATE TRIGGER IF NOT EXISTS log_invalidation_update
AFTER UPDATE OF last_invalidation ON assets_cache
WHEN NEW.last_invalidation IS NOT NULL AND OLD.last_invalidation IS NULL
BEGIN
  INSERT INTO invalidation_logs (
    public_id,
    asset_cache_id,
    strategy,
    status,
    created_at
  ) VALUES (
    NEW.cloudinary_public_id,
    NEW.id,
    'automatic',
    'success',
    NEW.last_invalidation
  );
END;