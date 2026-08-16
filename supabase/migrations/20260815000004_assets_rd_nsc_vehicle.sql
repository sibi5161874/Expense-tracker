-- Final three asset classes closing the gap to FinBoom's 20+ coverage:
-- Recurring Deposit, NSC (National Savings Certificate), and Vehicles.
-- Same shape as assets_fixed_deposits/assets_real_estate/assets_ppf. Grants rely
-- on the `alter default privileges` rule in 20260710210013_grants.sql.

create table public.assets_recurring_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  monthly_installment numeric(12,2) not null check (monthly_installment > 0),
  rate_pct numeric(5,2) not null check (rate_pct >= 0),
  start_date date not null,
  maturity_date date not null,
  maturity_value numeric(12,2) not null check (maturity_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_recurring_deposits
  for each row execute function public.set_updated_at();

alter table public.assets_recurring_deposits enable row level security;

create policy "assets_recurring_deposits_select_own" on public.assets_recurring_deposits
  for select using (auth.uid() = user_id);
create policy "assets_recurring_deposits_insert_own" on public.assets_recurring_deposits
  for insert with check (auth.uid() = user_id);
create policy "assets_recurring_deposits_update_own" on public.assets_recurring_deposits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_recurring_deposits_delete_own" on public.assets_recurring_deposits
  for delete using (auth.uid() = user_id);

-- NSC (National Savings Certificate)

create table public.assets_nsc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  certificate_number text not null,
  purchase_value numeric(12,2) not null check (purchase_value >= 0),
  maturity_value numeric(12,2) not null check (maturity_value >= 0),
  rate_pct numeric(5,2) not null check (rate_pct >= 0),
  purchase_date date not null,
  maturity_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_nsc
  for each row execute function public.set_updated_at();

alter table public.assets_nsc enable row level security;

create policy "assets_nsc_select_own" on public.assets_nsc
  for select using (auth.uid() = user_id);
create policy "assets_nsc_insert_own" on public.assets_nsc
  for insert with check (auth.uid() = user_id);
create policy "assets_nsc_update_own" on public.assets_nsc
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_nsc_delete_own" on public.assets_nsc
  for delete using (auth.uid() = user_id);

-- Vehicles (depreciating physical assets — current_value is user-maintained)

create table public.assets_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  vehicle_type text not null check (vehicle_type in ('Car', 'Two Wheeler', 'Commercial', 'Other')),
  registration_number text,
  purchase_value numeric(12,2) not null check (purchase_value >= 0),
  current_value numeric(12,2) not null check (current_value >= 0),
  purchase_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_vehicles
  for each row execute function public.set_updated_at();

alter table public.assets_vehicles enable row level security;

create policy "assets_vehicles_select_own" on public.assets_vehicles
  for select using (auth.uid() = user_id);
create policy "assets_vehicles_insert_own" on public.assets_vehicles
  for insert with check (auth.uid() = user_id);
create policy "assets_vehicles_update_own" on public.assets_vehicles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_vehicles_delete_own" on public.assets_vehicles
  for delete using (auth.uid() = user_id);
