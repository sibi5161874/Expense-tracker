-- ============================================================================
-- SCRIPT: vacuum-full-all.sql
-- PURPOSE: Reclaim disk space from dead tuples after large bulk deletes or imports.
-- LOCATION: Run manually in the Supabase SQL Editor.
--
-- ⚠️ WARNING:
-- VACUUM FULL acquires an ACCESS EXCLUSIVE lock on each table, which blocks all
-- queries (SELECT, INSERT, UPDATE, DELETE) until it completes.
-- DO NOT run this blindly across all tables during peak application hours.
-- Only run on tables where dead tuple percentage exceeds 20%.
-- ============================================================================

-- Step 1: Diagnose bloat across all application tables
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
WHERE n_dead_tup > 50
ORDER BY dead_pct DESC;

-- Step 2: Conditionally run VACUUM FULL on tables with >20% dead tuples
-- Uncomment and run the relevant lines based on Step 1 diagnostic:

-- VACUUM FULL public.transactions;
-- VACUUM FULL public.investment_log;
-- VACUUM FULL public.cashbook;
-- VACUUM FULL public.net_worth_snapshots;
-- VACUUM FULL public.goals;
-- VACUUM FULL public.accounts;
-- VACUUM FULL public.categories;
