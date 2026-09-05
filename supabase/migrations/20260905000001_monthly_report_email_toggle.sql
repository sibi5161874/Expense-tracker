-- Per-user opt-in for the monthly financial summary email (see
-- apps/web/src/app/api/cron/monthly-summary/route.ts). Defaults to false: the
-- cron used to email every Pro/trial user unconditionally, but a report
-- landing in someone's inbox every month should be something they asked for,
-- not something they have to notice and opt out of.

alter table public.user_profiles
  add column monthly_report_email_enabled boolean not null default false;
