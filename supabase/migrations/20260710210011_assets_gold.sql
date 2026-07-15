-- Gold holdings (DATA_MODEL.md §6). current_value/pnl are derived, computed in
-- packages/shared/logic.

create table public.assets_gold (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  grams numeric(10,3) not null check (grams > 0),
  rate_per_gram numeric(12,2) not null check (rate_per_gram > 0),
  purchase_value numeric(12,2) not null check (purchase_value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.assets_gold
  for each row execute function public.set_updated_at();

alter table public.assets_gold enable row level security;

create policy "assets_gold_select_own" on public.assets_gold
  for select using (auth.uid() = user_id);

create policy "assets_gold_insert_own" on public.assets_gold
  for insert with check (auth.uid() = user_id);

create policy "assets_gold_update_own" on public.assets_gold
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "assets_gold_delete_own" on public.assets_gold
  for delete using (auth.uid() = user_id);
