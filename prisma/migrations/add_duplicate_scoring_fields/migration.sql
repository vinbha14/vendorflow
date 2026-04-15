-- =============================================================================
-- Migration 3: Duplicate alert hybrid scoring fields
-- Run order: THIRD (after AI summary migration)
-- Command: psql $DIRECT_DATABASE_URL -f prisma/migrations/add_duplicate_scoring_fields/migration.sql
-- =============================================================================

-- 1. New columns on duplicate_alerts
ALTER TABLE duplicate_alerts
  ADD COLUMN IF NOT EXISTS raw_signals        JSONB,
  ADD COLUMN IF NOT EXISTS recommendation     TEXT,
  ADD COLUMN IF NOT EXISTS risk_level         VARCHAR(10) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS merge_target_profile_id UUID;

-- 2. GIN index on raw_signals for querying which signals fired
CREATE INDEX IF NOT EXISTS duplicate_alerts_raw_signals_gin
  ON duplicate_alerts
  USING GIN (raw_signals);

-- 3. Composite index: company + status + risk_level for the review queue
CREATE INDEX IF NOT EXISTS duplicate_alerts_review_queue_idx
  ON duplicate_alerts (company_id, status, risk_level)
  WHERE status = 'OPEN';

-- 4. Index on confidence_score for ordering the queue
CREATE INDEX IF NOT EXISTS duplicate_alerts_confidence_idx
  ON duplicate_alerts (company_id, confidence_score DESC)
  WHERE status = 'OPEN';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'duplicate_alerts'
  AND column_name IN ('raw_signals','recommendation','risk_level','merge_target_profile_id')
ORDER BY column_name;
