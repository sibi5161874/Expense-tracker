/**
 * ============================================================================
 *  DATABASE OPTIMIZATION & ARCHIVAL CONFIG
 * ============================================================================
 * Configuration constants for KashMap database optimization on free-tier
 * Supabase (500 MB capacity limit).
 * ============================================================================
 */

export const ARCHIVE_AFTER_YEARS = 2;

export const ARCHIVE_BATCH_SIZE = 5000;

export const LZ4_COLUMNS = {
  transactions: ['notes'],
  investment_log: ['notes'],
  cashbook: ['notes'],
  goals: ['goal_name'],
} as const;

export const DB_HEALTH_THRESHOLDS = {
  WARNING_PCT: 70,
  CRITICAL_PCT: 85,
  READ_ONLY_PCT: 95,
} as const;
