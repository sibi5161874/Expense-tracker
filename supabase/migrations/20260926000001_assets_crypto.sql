-- Dedicated Asset Class: Crypto Holdings
-- Same shape as assets_fixed_deposits / assets_gold / assets_vehicles.
-- RLS policies scoped to auth.uid() = user_id.

create table public.assets_crypto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  name text,
  quantity numeric(18,8) not null check (quantity > 0),
  buy_price numeric(14,2) not null check (buy_price >= 0),
  current_price numeric(14,2) not null check (current_price >= 0),
  wallet_or_exchange text,
  purchase_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_crypto
  for each row execute function public.set_updated_at();

alter table public.assets_crypto enable row level security;

create policy "assets_crypto_select_own" on public.assets_crypto
  for select using (auth.uid() = user_id);
create policy "assets_crypto_insert_own" on public.assets_crypto
  for insert with check (auth.uid() = user_id);
create policy "assets_crypto_update_own" on public.assets_crypto
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_crypto_delete_own" on public.assets_crypto
  for delete using (auth.uid() = user_id);
