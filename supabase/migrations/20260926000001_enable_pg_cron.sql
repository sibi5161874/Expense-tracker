-- Migration 1: Enable pg_cron extension for automated database maintenance & archival.
-- Supabase enables pg_cron by default in newer projects; IF NOT EXISTS is defensive.

create extension if not exists pg_cron;

comment on extension pg_cron is 'Scheduled jobs for archival + maintenance. Used by KashMap free-tier optimization strategy.';
