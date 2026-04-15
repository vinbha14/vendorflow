-- =============================================================================
-- Migration 1: pgvector + base extensions
-- Run order: FIRST (before all other migrations)
-- Command: psql $DIRECT_DATABASE_URL -f prisma/migrations/add_pgvector/migration.sql
-- Or paste into Supabase SQL Editor and click Run.
-- =============================================================================

-- 1. Vector similarity extension (required for duplicate detection embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. Trigram fuzzy text search (used for name/company similarity indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. Add the embedding column to candidate_profiles
--    text-embedding-3-small produces 1536-dimensional vectors
ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS resume_embedding vector(1536);

-- 5. IVFFlat index for fast approximate nearest-neighbour search
--    (Much faster than exact search at scale. Requires ~1000+ rows to be effective.)
CREATE INDEX IF NOT EXISTS candidate_profiles_embedding_idx
  ON candidate_profiles
  USING ivfflat (resume_embedding vector_cosine_ops)
  WITH (lists = 100);

-- 6. Trigram index on full_name for fast fuzzy name search
CREATE INDEX IF NOT EXISTS candidate_profiles_name_trgm_idx
  ON candidate_profiles
  USING gin (full_name gin_trgm_ops);

-- 7. SQL helper: find semantically similar profiles within a company workspace
--    Called by the duplicate detection scoring engine.
CREATE OR REPLACE FUNCTION find_similar_profiles(
  query_embedding  vector(1536),
  company_id_param uuid,
  exclude_profile_id uuid,
  similarity_threshold float DEFAULT 0.82,
  max_results        int   DEFAULT 20
)
RETURNS TABLE (
  profile_id  uuid,
  similarity  float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id AS profile_id,
    1 - (cp.resume_embedding <=> query_embedding) AS similarity
  FROM candidate_profiles cp
  INNER JOIN candidate_submissions cs ON cs.profile_id = cp.id
  WHERE
    cs.company_id  = company_id_param
    AND cp.id     != exclude_profile_id
    AND cp.resume_embedding IS NOT NULL
    AND 1 - (cp.resume_embedding <=> query_embedding) >= similarity_threshold
    AND cs.status != 'WITHDRAWN'
  ORDER BY cp.resume_embedding <=> query_embedding
  LIMIT max_results;
END;
$$;

-- 8. Grant permissions (adjust role name if different in your Supabase project)
GRANT EXECUTE ON FUNCTION find_similar_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_profiles TO anon;

-- Verify
SELECT extname FROM pg_extension WHERE extname IN ('vector','uuid-ossp','pg_trgm');
