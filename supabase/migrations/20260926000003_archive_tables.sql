-- Migration 3: Cold storage archive tables for transactions, investment_log, cashbook, and snapshots.
-- Created using LIKE ... INCLUDING ALL with identical RLS 4-policy isolation (RULES.md §1).

-- 1. transactions_archive
create table public.transactions_archive (like public.transactions including all);
alter table public.transactions_archive enable row level security;

create policy "Users can view own archived transactions"
  on public.transactions_archive for select using (auth.uid() = user_id);
create policy "Users can insert own archived transactions"
  on public.transactions_archive for insert with check (auth.uid() = user_id);
create policy "Users can update own archived transactions"
  on public.transactions_archive for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own archived transactions"
  on public.transactions_archive for delete using (auth.uid() = user_id);

create index if not exists idx_transactions_archive_user_date on public.transactions_archive (user_id, date desc);
comment on table public.transactions_archive is 'Cold storage for records older than ARCHIVE_AFTER_YEARS (2 years). RLS mirrors the active table.';

-- 2. investment_log_archive
create table public.investment_log_archive (like public.investment_log including all);
alter table public.investment_log_archive enable row level security;

create policy "Users can view own archived investment_log"
  on public.investment_log_archive for select using (auth.uid() = user_id);
create policy "Users can insert own archived investment_log"
  on public.investment_log_archive for insert with check (auth.uid() = user_id);
create policy "Users can update own archived investment_log"
  on public.investment_log_archive for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own archived investment_log"
  on public.investment_log_archive for delete using (auth.uid() = user_id);

create index if not exists idx_investment_log_archive_user_date on public.investment_log_archive (user_id, date desc);
comment on table public.investment_log_archive is 'Cold storage for records older than ARCHIVE_AFTER_YEARS (2 years). RLS mirrors the active table.';

-- 3. cashbook_archive
create table public.cashbook_archive (like public.cashbook including all);
alter table public.cashbook_archive enable row level security;

create policy "Users can view own archived cashbook"
  on public.cashbook_archive for select using (auth.uid() = user_id);
create policy "Users can insert own archived cashbook"
  on public.cashbook_archive for insert with check (auth.uid() = user_id);
create policy "Users can update own archived cashbook"
  on public.cashbook_archive for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own archived cashbook"
  on public.cashbook_archive for delete using (auth.uid() = user_id);

create index if not exists idx_cashbook_archive_user_date on public.cashbook_archive (user_id, date desc);
comment on table public.cashbook_archive is 'Cold storage for records older than ARCHIVE_AFTER_YEARS (2 years). RLS mirrors the active table.';

-- 4. net_worth_snapshots_archive
create table public.net_worth_snapshots_archive (like public.net_worth_snapshots including all);
alter table public.net_worth_snapshots_archive enable row level security;

create policy "Users can view own archived net_worth_snapshots"
  on public.net_worth_snapshots_archive for select using (auth.uid() = user_id);
create policy "Users can insert own archived net_worth_snapshots"
  on public.net_worth_snapshots_archive for insert with check (auth.uid() = user_id);
create policy "Users can update own archived net_worth_snapshots"
  on public.net_worth_snapshots_archive for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own archived net_worth_snapshots"
  on public.net_worth_snapshots_archive for delete using (auth.uid() = user_id);

create index if not exists idx_net_worth_snapshots_archive_user_date on public.net_worth_snapshots_archive (user_id, snapshot_date desc);
comment on table public.net_worth_snapshots_archive is 'Cold storage for records older than ARCHIVE_AFTER_YEARS (2 years). RLS mirrors the active table.';
