-- Recurring bills/income (e.g. rent, salary, EMI) that auto-generate a real
-- `transactions` row each time they come due. Mirrors the `transactions`
-- table's shape so a generated row is a drop-in transaction, plus scheduling
-- fields (frequency, next_run_date, is_active).
--
-- Generation itself is lazy/client-driven (no pg_cron / Edge Function): the
-- app checks for rules where next_run_date <= today on load and creates the
-- due transactions, advancing next_run_date each time — see
-- packages/shared/src/logic/recurring.ts.

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('Income', 'Expense', 'Transfer')),
  category_id uuid references public.categories(id) on delete set null,
  sub_category text,
  amount numeric(12,2) not null check (amount > 0),
  from_account_id uuid not null references public.accounts(id) on delete restrict,
  to_account_id uuid references public.accounts(id) on delete restrict,
  notes text,
  frequency text not null check (frequency in ('Weekly', 'Monthly', 'Quarterly', 'Yearly')),
  next_run_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recurring_transactions_user_next_run_idx
  on public.recurring_transactions (user_id, next_run_date)
  where is_active;

create trigger set_updated_at
  before update on public.recurring_transactions
  for each row execute function public.set_updated_at();

alter table public.recurring_transactions enable row level security;

create policy "recurring_transactions_select_own" on public.recurring_transactions
  for select using (auth.uid() = user_id);

create policy "recurring_transactions_insert_own" on public.recurring_transactions
  for insert with check (auth.uid() = user_id);

create policy "recurring_transactions_update_own" on public.recurring_transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recurring_transactions_delete_own" on public.recurring_transactions
  for delete using (auth.uid() = user_id);
