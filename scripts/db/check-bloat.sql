-- ============================================================================
-- SCRIPT: check-bloat.sql
-- PURPOSE: Read-only query to diagnose dead tuples and table sizes.
-- LOCATION: Safe to run in Supabase SQL Editor at any time (zero lock impact).
-- ============================================================================

SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
