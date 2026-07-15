-- Liability register (DATA_MODEL.md §6). No derived fields — values entered directly.

create table public.assets_loans_liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lender text not null,
  outstanding numeric(12,2) not null check (outstanding >= 0),
  emi numeric(12,2),
  interest_rate_pct numeric(5,2),
  months_left integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_loans_liabilities
  for each row execute function public.set_updated_at();

alter table public.assets_loans_liabilities enable row level security;

create policy "assets_loans_liabilities_select_own" on public.assets_loans_liabilities
  for select using (auth.uid() = user_id);

create policy "assets_loans_liabilities_insert_own" on public.assets_loans_liabilities
  for insert with check (auth.uid() = user_id);

create policy "assets_loans_liabilities_update_own" on public.assets_loans_liabilities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "assets_loans_liabilities_delete_own" on public.assets_loans_liabilities
  for delete using (auth.uid() = user_id);
