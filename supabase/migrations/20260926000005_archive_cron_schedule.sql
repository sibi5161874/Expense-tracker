-- Migration 5: Staggered nightly pg_cron schedules for data archival.
-- Runs at 3:00 AM IST (off-peak hours) with 15-minute intervals to avoid lock contention.

-- Remove existing schedules with these names if any, to ensure idempotency
do $do$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('archive-transactions-nightly') where exists (select 1 from cron.job where jobname = 'archive-transactions-nightly');
    perform cron.unschedule('archive-investment-log-nightly') where exists (select 1 from cron.job where jobname = 'archive-investment-log-nightly');
    perform cron.unschedule('archive-cashbook-nightly') where exists (select 1 from cron.job where jobname = 'archive-cashbook-nightly');
    perform cron.unschedule('archive-snapshots-nightly') where exists (select 1 from cron.job where jobname = 'archive-snapshots-nightly');

    -- Schedule the 4 nightly jobs
    perform cron.schedule(
      'archive-transactions-nightly',
      '0 3 * * *',
      $$ select public.archive_old_records('transactions'); $$
    );

    perform cron.schedule(
      'archive-investment-log-nightly',
      '15 3 * * *',
      $$ select public.archive_old_records('investment_log'); $$
    );

    perform cron.schedule(
      'archive-cashbook-nightly',
      '30 3 * * *',
      $$ select public.archive_old_records('cashbook'); $$
    );

    perform cron.schedule(
      'archive-snapshots-nightly',
      '45 3 * * *',
      $$ select public.archive_old_records('net_worth_snapshots'); $$
    );
  end if;
end $do$;
