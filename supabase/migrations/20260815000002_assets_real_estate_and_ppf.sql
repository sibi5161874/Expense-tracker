-- Two more Indian asset classes closing the biggest gaps vs. FinBoom's 20+ class
-- coverage: Real Estate and PPF (distinct from EPF — no employer). Same shape as
-- assets_fixed_deposits/assets_gold/assets_epf. Grants: relies on the
-- `alter default privileges` rule in 20260710210013_grants.sql.

create table public.assets_real_estate (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  property_type text not null check (property_type in ('Residential', 'Commercial', 'Land', 'Other')),
  location text,
  purchase_value numeric(12,2) not null check (purchase_value >= 0),
  current_value numeric(12,2) not null check (current_value >= 0),
  purchase_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_real_estate
  for each row execute function public.set_updated_at();

alter table public.assets_real_estate enable row level security;

create policy "assets_real_estate_select_own" on public.assets_real_estate
  for select using (auth.uid() = user_id);
create policy "assets_real_estate_insert_own" on public.assets_real_estate
  for insert with check (auth.uid() = user_id);
create policy "assets_real_estate_update_own" on public.assets_real_estate
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_real_estate_delete_own" on public.assets_real_estate
  for delete using (auth.uid() = user_id);

-- PPF

create table public.assets_ppf (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_number text not null,
  current_balance numeric(12,2) not null check (current_balance >= 0),
  annual_contribution numeric(12,2) not null check (annual_contribution >= 0),
  opening_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_ppf
  for each row execute function public.set_updated_at();

alter table public.assets_ppf enable row level security;

create policy "assets_ppf_select_own" on public.assets_ppf
  for select using (auth.uid() = user_id);
create policy "assets_ppf_insert_own" on public.assets_ppf
  for insert with check (auth.uid() = user_id);
create policy "assets_ppf_update_own" on public.assets_ppf
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_ppf_delete_own" on public.assets_ppf
  for delete using (auth.uid() = user_id);
