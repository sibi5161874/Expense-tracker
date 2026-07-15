-- Accounts register (config/reference data, editable per-user).
-- DATA_MODEL.md §7: account name, type (Cash/Savings/Trading/PF/etc), opening
-- balance, currency, active flag.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  opening_balance numeric(12,2) not null default 0,
  currency text not null default 'INR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create trigger set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);

create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = user_id);

create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = user_id);
