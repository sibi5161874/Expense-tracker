-- "Freeze your financial state at any moment" (FinBoom parity). Mirrors
-- NetWorthBreakdown (packages/shared/src/logic/netWorth.ts) column-for-column
-- rather than a jsonb blob, matching this codebase's fully-typed-columns
-- convention — every other table does the same, never jsonb.
--
-- One snapshot per calendar day per user: "Take Snapshot" overwrites today's
-- entry if called twice, "Add Past Entry" backdates snapshot_date instead of
-- creating a same-day duplicate.

create table public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  cash_and_bank_total numeric(14,2) not null default 0,
  fixed_deposits_total numeric(14,2) not null default 0,
  gold_total numeric(14,2) not null default 0,
  epf_total numeric(14,2) not null default 0,
  nps_total numeric(14,2) not null default 0,
  ssy_total numeric(14,2) not null default 0,
  sgb_total numeric(14,2) not null default 0,
  ulip_total numeric(14,2) not null default 0,
  real_estate_total numeric(14,2) not null default 0,
  ppf_total numeric(14,2) not null default 0,
  recurring_deposits_total numeric(14,2) not null default 0,
  nsc_total numeric(14,2) not null default 0,
  vehicles_total numeric(14,2) not null default 0,
  portfolio_value numeric(14,2) not null default 0,
  liabilities_total numeric(14,2) not null default 0,
  net_worth numeric(14,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index net_worth_snapshots_user_date_idx on public.net_worth_snapshots (user_id, snapshot_date desc);

create trigger set_updated_at
  before update on public.net_worth_snapshots
  for each row execute function public.set_updated_at();

alter table public.net_worth_snapshots enable row level security;

create policy "net_worth_snapshots_select_own" on public.net_worth_snapshots
  for select using (auth.uid() = user_id);
create policy "net_worth_snapshots_insert_own" on public.net_worth_snapshots
  for insert with check (auth.uid() = user_id);
create policy "net_worth_snapshots_update_own" on public.net_worth_snapshots
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "net_worth_snapshots_delete_own" on public.net_worth_snapshots
  for delete using (auth.uid() = user_id);
