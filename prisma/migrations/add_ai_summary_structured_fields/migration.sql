-- =============================================================================
-- Migration 2: AI summary structured fields
-- Run order: SECOND (after Prisma init migration and pgvector)
-- Command: psql $DIRECT_DATABASE_URL -f prisma/migrations/add_ai_summary_structured_fields/migration.sql
-- =============================================================================

-- 1. AiRecommendation enum
DO $$ BEGIN
  CREATE TYPE "AiRecommendation" AS ENUM ('SHORTLIST', 'REVIEW', 'HOLD', 'REJECT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Structured machine-readable columns on ai_summaries
ALTER TABLE ai_summaries
  ADD COLUMN IF NOT EXISTS headline_summary       TEXT,
  ADD COLUMN IF NOT EXISTS years_of_experience    FLOAT,
  ADD COLUMN IF NOT EXISTS top_skills             TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industries             TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employers              TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS strengths_list         TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risks_list             TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location_summary       TEXT,
  ADD COLUMN IF NOT EXISTS recommendation_decision "AiRecommendation";

-- 3. Index on recommendation_decision for filtering the queue
CREATE INDEX IF NOT EXISTS ai_summaries_recommendation_idx
  ON ai_summaries (recommendation_decision)
  WHERE recommendation_decision IS NOT NULL;

-- 4. Index on fit_score for ORDER BY fit_score DESC queries
CREATE INDEX IF NOT EXISTS ai_summaries_fit_score_idx
  ON ai_summaries (fit_score DESC NULLS LAST)
  WHERE fit_score IS NOT NULL;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ai_summaries'
  AND column_name IN ('headline_summary','years_of_experience','top_skills',
                      'industries','employers','strengths_list','risks_list',
                      'location_summary','recommendation_decision')
ORDER BY column_name;
