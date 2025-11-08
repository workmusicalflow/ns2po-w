-- Migration: Fix price_locked DEFAULT to match Pareto 80/20 pattern
-- Date: 2025-01-05
-- Description: Align database DEFAULT with Zod schema (false = 0 = auto-sync)
-- Issue: Mismatch between DB DEFAULT 1 and schema default false
-- Root cause: Tests failing because DEFAULT conflicts with Pareto expectations
--
-- Pareto 80/20 Pattern:
-- - 80% cas: price_locked = 0 (auto-sync) ← SHOULD BE DEFAULT
-- - 20% cas: price_locked = 1 (prix figé) ← opt-in

-- ⚠️ Note: SQLite doesn't support ALTER COLUMN DEFAULT directly
-- Solution: Create new column, migrate data, drop old, rename new

-- 1. Create new column with correct DEFAULT
ALTER TABLE bundle_products ADD COLUMN price_locked_new BOOLEAN DEFAULT 0;

-- 2. Copy existing data (preserve current values)
UPDATE bundle_products SET price_locked_new = COALESCE(price_locked, 1);
-- Note: COALESCE with 1 preserves backward compatibility for existing bundles

-- 3. Drop old column
ALTER TABLE bundle_products DROP COLUMN price_locked;

-- 4. Rename new column to original name
ALTER TABLE bundle_products RENAME COLUMN price_locked_new TO price_locked;

-- 5. Recreate index with correct name
DROP INDEX IF EXISTS idx_bundle_products_price_locked;
CREATE INDEX IF NOT EXISTS idx_bundle_products_price_locked
  ON bundle_products(price_locked);

-- 6. Validation: Verify DEFAULT is now 0
-- Test: INSERT without specifying price_locked should result in 0
-- (Manual verification needed after migration)

-- 📊 Post-migration validation
SELECT
  COUNT(*) as total_rows,
  COUNT(CASE WHEN price_locked = 1 THEN 1 END) as locked_count,
  COUNT(CASE WHEN price_locked = 0 THEN 1 END) as synced_count,
  COUNT(CASE WHEN price_locked IS NULL THEN 1 END) as null_count,
  ROUND(100.0 * COUNT(CASE WHEN price_locked = 0 THEN 1 END) / COUNT(*), 1) as auto_sync_percentage,
  ROUND(100.0 * COUNT(CASE WHEN price_locked = 1 THEN 1 END) / COUNT(*), 1) as locked_percentage
FROM bundle_products;

SELECT 'Migration 007: price_locked DEFAULT fixed (1→0) pour Pareto 80/20 ✅' as message;
