-- Peer lending/borrowing ledger (DATA_MODEL.md §5). match_key, per-entry status,
-- and the Net Due Summary aggregation are derived — computed in packages/shared/logic
-- and a Phase 3 view respectively, not stored here.

create table public.cashbook (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  counterparty text not null,
  flow text not null check (flow in ('Gave', 'Received')),
  amount numeric(12,2) not null check (amount > 0),
  due_date date,
  account_used_id uuid references public.accounts(id) on delete set null,
  loan_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cashbook_user_counterparty_idx on public.cashbook (user_id, counterparty);
create index cashbook_user_loan_id_idx on public.cashbook (user_id, loan_id) where loan_id is not null;

create trigger set_updated_at
  before update on public.cashbook
  for each row execute function public.set_updated_at();

alter table public.cashbook enable row level security;

create policy "cashbook_select_own" on public.cashbook
  for select using (auth.uid() = user_id);

create policy "cashbook_insert_own" on public.cashbook
  for insert with check (auth.uid() = user_id);

create policy "cashbook_update_own" on public.cashbook
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cashbook_delete_own" on public.cashbook
  for delete using (auth.uid() = user_id);
