-- ============================================================================
-- SCRIPT: rewrite-to-lz4.sql
-- PURPOSE: Force existing rows to be rewritten & recompressed with LZ4.
-- LOCATION: Run manually in the Supabase SQL Editor.
--
-- ⚠️ SAFETY INSTRUCTIONS:
-- 1. Run during off-peak maintenance windows (e.g. 2-4 AM IST).
-- 2. VACUUM FULL acquires an EXCLUSIVE table lock (ACCESS EXCLUSIVE), blocking
--    both reads and writes for the duration of the command.
-- 3. Execute ONE table at a time and verify table functionality before proceeding.
-- ============================================================================

-- Table 1: transactions
-- Step 1: Check relation size before rewrite
SELECT 'transactions (before)' AS label, pg_size_pretty(pg_total_relation_size('public.transactions')) AS total_size;

-- Step 2: Rewrite table to apply LZ4 compression on existing toast data
VACUUM FULL public.transactions;

-- Step 3: Check relation size after rewrite
SELECT 'transactions (after)' AS label, pg_size_pretty(pg_total_relation_size('public.transactions')) AS total_size;


-- Table 2: investment_log
-- Step 1: Check relation size before rewrite
SELECT 'investment_log (before)' AS label, pg_size_pretty(pg_total_relation_size('public.investment_log')) AS total_size;

-- Step 2: Rewrite table
VACUUM FULL public.investment_log;

-- Step 3: Check relation size after rewrite
SELECT 'investment_log (after)' AS label, pg_size_pretty(pg_total_relation_size('public.investment_log')) AS total_size;


-- Table 3: cashbook
-- Step 1: Check relation size before rewrite
SELECT 'cashbook (before)' AS label, pg_size_pretty(pg_total_relation_size('public.cashbook')) AS total_size;

-- Step 2: Rewrite table
VACUUM FULL public.cashbook;

-- Step 3: Check relation size after rewrite
SELECT 'cashbook (after)' AS label, pg_size_pretty(pg_total_relation_size('public.cashbook')) AS total_size;


-- Table 4: goals
-- Step 1: Check relation size before rewrite
SELECT 'goals (before)' AS label, pg_size_pretty(pg_total_relation_size('public.goals')) AS total_size;

-- Step 2: Rewrite table
VACUUM FULL public.goals;

-- Step 3: Check relation size after rewrite
SELECT 'goals (after)' AS label, pg_size_pretty(pg_total_relation_size('public.goals')) AS total_size;
