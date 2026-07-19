-- Extended Indian asset classes (DATA_MODEL.md §6b): EPF, NPS, SSY, SGB, ULIP.
-- Same shape as assets_fixed_deposits/assets_gold/assets_loans_liabilities.
-- Grants: relies on the `alter default privileges` rule already set in
-- 20260710210013_grants.sql, which applies to tables created after it by the
-- same role — no separate grant statements needed here.

create table public.assets_epf (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employer_name text not null,
  current_balance numeric(12,2) not null check (current_balance >= 0),
  monthly_contribution numeric(12,2) not null check (monthly_contribution >= 0),
  uan_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_epf
  for each row execute function public.set_updated_at();

alter table public.assets_epf enable row level security;

create policy "assets_epf_select_own" on public.assets_epf
  for select using (auth.uid() = user_id);
create policy "assets_epf_insert_own" on public.assets_epf
  for insert with check (auth.uid() = user_id);
create policy "assets_epf_update_own" on public.assets_epf
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_epf_delete_own" on public.assets_epf
  for delete using (auth.uid() = user_id);

-- NPS

create type public.nps_tier as enum ('Tier I', 'Tier II');

create table public.assets_nps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pran_number text not null,
  current_value numeric(12,2) not null check (current_value >= 0),
  tier public.nps_tier not null default 'Tier I',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_nps
  for each row execute function public.set_updated_at();

alter table public.assets_nps enable row level security;

create policy "assets_nps_select_own" on public.assets_nps
  for select using (auth.uid() = user_id);
create policy "assets_nps_insert_own" on public.assets_nps
  for insert with check (auth.uid() = user_id);
create policy "assets_nps_update_own" on public.assets_nps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_nps_delete_own" on public.assets_nps
  for delete using (auth.uid() = user_id);

-- SSY (Sukanya Samriddhi Yojana). maturity_date/status derived in packages/shared/logic
-- from opening_date (+21 years), same pattern as FD's maturity_date/status.

create table public.assets_ssy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_holder_name text not null,
  account_number text not null,
  current_balance numeric(12,2) not null check (current_balance >= 0),
  opening_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_ssy
  for each row execute function public.set_updated_at();

alter table public.assets_ssy enable row level security;

create policy "assets_ssy_select_own" on public.assets_ssy
  for select using (auth.uid() = user_id);
create policy "assets_ssy_insert_own" on public.assets_ssy
  for insert with check (auth.uid() = user_id);
create policy "assets_ssy_update_own" on public.assets_ssy
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_ssy_delete_own" on public.assets_ssy
  for delete using (auth.uid() = user_id);

-- SGB (Sovereign Gold Bonds). 1 unit = 1 gram. current_value/pnl derived the same
-- way as assets_gold; maturity_date derived from issue_date (+8 years, SGB tenor).

create table public.assets_sgb (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  units_held numeric(10,3) not null check (units_held > 0),
  issue_price numeric(12,4) not null check (issue_price > 0),
  issue_date date not null,
  rate_per_gram numeric(12,4) not null check (rate_per_gram > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_sgb
  for each row execute function public.set_updated_at();

alter table public.assets_sgb enable row level security;

create policy "assets_sgb_select_own" on public.assets_sgb
  for select using (auth.uid() = user_id);
create policy "assets_sgb_insert_own" on public.assets_sgb
  for insert with check (auth.uid() = user_id);
create policy "assets_sgb_update_own" on public.assets_sgb
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_sgb_delete_own" on public.assets_sgb
  for delete using (auth.uid() = user_id);

-- ULIP. sum_assured is the insurance component (not counted toward net worth);
-- current_fund_value is the investment component that is.

create type public.ulip_premium_frequency as enum ('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly');

create table public.assets_ulip (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insurer text not null,
  policy_number text not null,
  sum_assured numeric(12,2) not null check (sum_assured >= 0),
  current_fund_value numeric(12,2) not null check (current_fund_value >= 0),
  premium_amount numeric(12,2) not null check (premium_amount >= 0),
  premium_frequency public.ulip_premium_frequency not null default 'Yearly',
  maturity_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_ulip
  for each row execute function public.set_updated_at();

alter table public.assets_ulip enable row level security;

create policy "assets_ulip_select_own" on public.assets_ulip
  for select using (auth.uid() = user_id);
create policy "assets_ulip_insert_own" on public.assets_ulip
  for insert with check (auth.uid() = user_id);
create policy "assets_ulip_update_own" on public.assets_ulip
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "assets_ulip_delete_own" on public.assets_ulip
  for delete using (auth.uid() = user_id);
