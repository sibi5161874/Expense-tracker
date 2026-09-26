# Database Optimization Operations Runbook

This document outlines the database storage optimization, compression, automated cold storage archival, and bloat reduction strategies for KashMap on Supabase Free Tier (500 MB hard limit).

---

## 1. Architecture & Capacity Overview

On the Supabase Free Tier, exceeding 500 MB puts the database into **read-only mode**. Unoptimized, high-frequency transactions and financial logs restrict capacity to ~350-400 users.

With these optimizations, active capacity is extended to **~1,500 - 2,000 active users**:

| Strategy | Mechanism | Impact |
| :--- | :--- | :--- |
| **LZ4 Compression** | Fast TOAST compression on text columns | 40–60% reduction on notes / descriptions |
| **Automated Archival** | Nightly `pg_cron` jobs moving records >2 years old | Moves cold records out of primary indexes & hot tables |
| **VACUUM FULL Tooling** | Manual scripts for bloat reclaiming | Reclaims dead-tuple space from deleted rows |
| **Health Monitoring** | Real-time `/settings/admin/database-health` | Proactive warnings at 70% (amber) and 85% (red) |

---

## 2. Archival Engine (`pg_cron`)

Records older than `ARCHIVE_AFTER_YEARS` (default: 2 years) are automatically moved by Postgres functions scheduled via `pg_cron`:

- **Execution Time**: Daily between 3:00 AM – 3:45 AM IST (staggered 15-minute intervals).
- **Target Tables**:
  - `transactions` -> `transactions_archive`
  - `investment_log` -> `investment_log_archive`
  - `cashbook` -> `cashbook_archive`
  - `net_worth_snapshots` -> `net_worth_snapshots_archive`
- **Security & RLS**:
  - Archive tables feature identical 4-policy RLS (`auth.uid() = user_id`) matching active tables.
  - The archival function `archive_old_records()` runs as `SECURITY DEFINER` with strict table allowlisting.
  - Every run is logged to the `archive_runs` audit table.

### Triggering Manual Archival (SQL Editor)
```sql
-- Move transactions older than 2 years:
SELECT public.archive_old_records('transactions');

-- Move transactions with custom cutoff date:
SELECT public.archive_old_records('transactions', '2023-01-01'::date);
```

---

## 3. LZ4 Compression

New rows written to `transactions.notes`, `investment_log.notes`, `cashbook.notes`, and `goals.goal_name` are compressed with LZ4.

### One-Time Recompression of Existing Rows
Because `ALTER COLUMN ... SET COMPRESSION` only applies to future rows, existing rows require a rewrite.

Run [`scripts/db/rewrite-to-lz4.sql`](../scripts/db/rewrite-to-lz4.sql) in the Supabase SQL Editor:
```sql
-- Execute one table at a time during maintenance windows
VACUUM FULL public.transactions;
VACUUM FULL public.investment_log;
VACUUM FULL public.cashbook;
VACUUM FULL public.goals;
```

> **Warning**: `VACUUM FULL` requires an `ACCESS EXCLUSIVE` lock. Run one table at a time during low-traffic windows (2-4 AM IST).

---

## 4. Bloat Monitoring & VACUUM FULL

Deleted or updated rows create dead tuples. Postgres autovacuum marks this space for reuse, but does **not** return physical disk space to the OS.

### Diagnosing Bloat
Run [`scripts/db/check-bloat.sql`](../scripts/db/check-bloat.sql):
```sql
SELECT
  relname AS table_name,
  n_live_tup AS live_tuples,
  n_dead_tup AS dead_tuples,
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
```

### Reclaiming Space
Run [`scripts/db/vacuum-full-all.sql`](../scripts/db/vacuum-full-all.sql) only on tables where `dead_pct` exceeds 20%.

---

## 5. Rollback Procedures

If you ever need to revert any part of the database optimization:

### 1. Disable Scheduled Archival
```sql
SELECT cron.unschedule('archive-transactions-nightly');
SELECT cron.unschedule('archive-investment-log-nightly');
SELECT cron.unschedule('archive-cashbook-nightly');
SELECT cron.unschedule('archive-snapshots-nightly');
```

### 2. Restore Archived Data to Hot Tables
```sql
-- Restore transactions
INSERT INTO public.transactions SELECT * FROM public.transactions_archive;
DELETE FROM public.transactions_archive;

-- Restore investment log
INSERT INTO public.investment_log SELECT * FROM public.investment_log_archive;
DELETE FROM public.investment_log_archive;

-- Restore cashbook
INSERT INTO public.cashbook SELECT * FROM public.cashbook_archive;
DELETE FROM public.cashbook_archive;

-- Restore snapshots
INSERT INTO public.net_worth_snapshots SELECT * FROM public.net_worth_snapshots_archive;
DELETE FROM public.net_worth_snapshots_archive;
```

### 3. Revert Compression to pglz
```sql
ALTER TABLE public.transactions ALTER COLUMN notes SET COMPRESSION pglz;
ALTER TABLE public.investment_log ALTER COLUMN notes SET COMPRESSION pglz;
ALTER TABLE public.cashbook ALTER COLUMN notes SET COMPRESSION pglz;
ALTER TABLE public.goals ALTER COLUMN goal_name SET COMPRESSION pglz;
```
