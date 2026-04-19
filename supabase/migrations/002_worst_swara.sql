-- Migration 002: Add worst_swara to sessions table
--
-- Supports the "Return Note" warmup feature (Cluster D):
-- On daily riyaz open, the app prepends a 60s warmup phase on yesterday's
-- worst-performing swara. The worst_swara column makes this O(1) to read
-- rather than requiring an aggregate query across exercise_attempts.
--
-- worst_swara: the swara symbol with the highest average abs(cents_dev)
-- across all exercise_attempts in this session where swara_target IS NOT NULL.
-- Populated at session end by the client.

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS worst_swara text DEFAULT NULL;

-- Index for fast lookup of yesterday's worst swara
CREATE INDEX IF NOT EXISTS sessions_worst_swara_user_date
  ON sessions (user_id, started_at DESC)
  WHERE worst_swara IS NOT NULL;

COMMENT ON COLUMN sessions.worst_swara IS
  'Swara symbol with the highest average |cents_dev| in this session. '
  'Populated at session end. Used by Return Note warmup feature.';
