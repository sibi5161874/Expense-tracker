-- Per-symbol manual live price override (DATA_MODEL.md §3: "live_price = manual
-- field, user-editable — no reliable free live-price API for most Indian mutual
-- funds/bonds/gold"). This is plain user input, NOT the derived portfolio view —
-- the portfolio view (units_held, avg_buy_price, P&L, allocation %) is built in
-- Phase 3 on top of investment_log + this table.

create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  display_name text,
  live_price numeric(12,4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create trigger set_updated_at
  before update on public.holdings
  for each row execute function public.set_updated_at();

alter table public.holdings enable row level security;

create policy "holdings_select_own" on public.holdings
  for select using (auth.uid() = user_id);

create policy "holdings_insert_own" on public.holdings
  for insert with check (auth.uid() = user_id);

create policy "holdings_update_own" on public.holdings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "holdings_delete_own" on public.holdings
  for delete using (auth.uid() = user_id);
