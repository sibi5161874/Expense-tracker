-- Fixed deposits (DATA_MODEL.md §6). days_left/status are derived per-row,
-- computed in packages/shared/logic.

create table public.assets_fixed_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank text not null,
  principal numeric(12,2) not null check (principal > 0),
  maturity_value numeric(12,2) not null check (maturity_value > 0),
  maturity_date date not null,
  rate_pct numeric(5,2) not null,
  withdrawn boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_fixed_deposits
  for each row execute function public.set_updated_at();

alter table public.assets_fixed_deposits enable row level security;

create policy "assets_fixed_deposits_select_own" on public.assets_fixed_deposits
  for select using (auth.uid() = user_id);

create policy "assets_fixed_deposits_insert_own" on public.assets_fixed_deposits
  for insert with check (auth.uid() = user_id);

create policy "assets_fixed_deposits_update_own" on public.assets_fixed_deposits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "assets_fixed_deposits_delete_own" on public.assets_fixed_deposits
  for delete using (auth.uid() = user_id);
