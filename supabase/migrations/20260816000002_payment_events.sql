-- Audit trail for every Razorpay order this app creates, keyed by
-- razorpay_payment_id so a payment can only ever be credited once, even if
-- both the client-side verify call and the async webhook fire for the same
-- payment (both paths write through the same idempotent upsert — see
-- apps/web/src/app/api/payments/verify and .../webhook).
--
-- Inserted with the user's own session (RLS-scoped, same as everywhere else);
-- the webhook route has no user session at all, so it authenticates via
-- Razorpay's webhook signature instead and writes with the service_role key —
-- the one place in this app that pattern is actually necessary, same
-- reasoning as the account-deletion route.

create type public.payment_purpose as enum ('trial_verification', 'lifetime_purchase');
create type public.payment_status as enum ('created', 'captured', 'refunded', 'failed');

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose public.payment_purpose not null,
  amount_paise integer not null check (amount_paise > 0),
  razorpay_order_id text not null,
  razorpay_payment_id text unique,
  razorpay_refund_id text,
  status public.payment_status not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_events_user_id_idx on public.payment_events (user_id);
-- One order in flight per (user, purpose) at a time — a stray double-click on
-- "Start Trial" reuses the same pending order instead of creating a second one.
create unique index payment_events_pending_order_idx on public.payment_events (user_id, purpose)
  where status = 'created';

create trigger set_updated_at
  before update on public.payment_events
  for each row execute function public.set_updated_at();

alter table public.payment_events enable row level security;

-- Read-only for the owning user — every write goes through server routes
-- using either the user's own session (create-order/verify) or service_role
-- (webhook), never a client-side insert/update.
create policy "payment_events_select_own" on public.payment_events
  for select using (auth.uid() = user_id);
create policy "payment_events_insert_own" on public.payment_events
  for insert with check (auth.uid() = user_id);
create policy "payment_events_update_own" on public.payment_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
