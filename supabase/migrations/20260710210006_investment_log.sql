-- Every buy/sell/SIP/dividend/bonus/split event (DATA_MODEL.md §2).
--
-- total_cashflow is a per-row GENERATED column, not a cross-row aggregate —
-- this encodes the business rule once at the DB level instead of duplicating
-- it in every dependent query, matching the exact rule in DATA_MODEL.md §2:
--   BONUS/SPLIT  -> 0
--   SELL         -> quantity * price - fees
--   DIVIDEND     -> price (price field holds dividend amount received)
--   BUY/SIP      -> -(quantity * price + fees)

create table public.investment_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  symbol text not null,
  exchange text not null,
  action text not null check (action in ('BUY', 'SELL', 'SIP', 'DIVIDEND', 'BONUS', 'SPLIT')),
  quantity numeric not null check (quantity >= 0),
  price numeric(12,4) not null check (price >= 0),
  fees numeric(12,2) not null default 0 check (fees >= 0),
  bonus_split_extra_units numeric,
  linked_account_id uuid not null references public.accounts(id) on delete restrict,
  asset_type text not null check (asset_type in ('Stock', 'ETF', 'Mutual Fund', 'Crypto', 'Bond', 'Other')),
  notes text,
  total_cashflow numeric(14,2) generated always as (
    case
      when action in ('BONUS', 'SPLIT') then 0
      when action = 'SELL' then quantity * price - fees
      when action = 'DIVIDEND' then price
      else -(quantity * price + fees)
    end
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index investment_log_user_symbol_idx on public.investment_log (user_id, symbol);
create index investment_log_user_date_idx on public.investment_log (user_id, date desc);

create trigger set_updated_at
  before update on public.investment_log
  for each row execute function public.set_updated_at();

alter table public.investment_log enable row level security;

create policy "investment_log_select_own" on public.investment_log
  for select using (auth.uid() = user_id);

create policy "investment_log_insert_own" on public.investment_log
  for insert with check (auth.uid() = user_id);

create policy "investment_log_update_own" on public.investment_log
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "investment_log_delete_own" on public.investment_log
  for delete using (auth.uid() = user_id);
