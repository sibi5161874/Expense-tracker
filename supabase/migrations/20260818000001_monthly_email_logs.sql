-- Month-end email summary: idempotency log + the private Storage bucket the
-- generated PDFs are uploaded to.
--
-- monthly_email_logs is an append-only send record, not user-editable data —
-- no update/delete policies, same reasoning as payment_events (an audit
-- record shouldn't be alterable by the user it's about). The cron route
-- writes through service_role (there is no user session in a cron
-- invocation), so RLS here only ever gates a user looking at their own send
-- history, never the actual write path.

create table public.monthly_email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null, -- 'YYYY-MM'
  sent_at timestamptz not null default now(),
  unique (user_id, month)
);

create index monthly_email_logs_user_id_idx on public.monthly_email_logs (user_id);

alter table public.monthly_email_logs enable row level security;

create policy "monthly_email_logs_select_own" on public.monthly_email_logs
  for select using (auth.uid() = user_id);
create policy "monthly_email_logs_insert_own" on public.monthly_email_logs
  for insert with check (auth.uid() = user_id);

-- Private bucket for generated summary PDFs. No storage.objects policies are
-- added deliberately: with RLS enabled and no permissive policy, only
-- service_role can read/write objects directly — exactly right, since the
-- only writer is the cron route (service_role) and the only reader is a
-- time-limited signed URL it generates, never a direct bucket/object fetch.
insert into storage.buckets (id, name, public)
values ('monthly-summaries', 'monthly-summaries', false)
on conflict (id) do nothing;
