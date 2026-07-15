-- Monthly ₹ limit per expense category — drives dashboard over-budget warnings
-- (DATA_MODEL.md §7, §8).

create table public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category_id)
);

create trigger set_updated_at
  before update on public.budget_limits
  for each row execute function public.set_updated_at();

alter table public.budget_limits enable row level security;

create policy "budget_limits_select_own" on public.budget_limits
  for select using (auth.uid() = user_id);

create policy "budget_limits_insert_own" on public.budget_limits
  for insert with check (auth.uid() = user_id);

create policy "budget_limits_update_own" on public.budget_limits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budget_limits_delete_own" on public.budget_limits
  for delete using (auth.uid() = user_id);
