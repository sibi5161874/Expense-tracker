-- computeUserNetWorth (apps/web/src/lib/computeUserNetWorth.ts) previously fired 13 separate
-- round trips (accounts, transactions, investment_log, holdings, and 10 individual asset
-- tables) via Promise.all — every one of them a trivial `select * where user_id = $1`. This
-- bundles all 13 into one jsonb response so only one round trip happens; every downstream
-- calculation (calculateAccountBalances, calculateNetWorth, groupInvestmentsBySymbol, etc. in
-- packages/shared/src/logic) is untouched — only where the raw rows come from changes, not how
-- they're summed. Same `security invoker` convention as get_monthly_trend and friends
-- (supabase/migrations/20260820000001_monthly_transaction_aggregates.sql, RULES.md §14):
-- this runs as the calling role, so RLS on every table below still applies — p_user_id is an
-- efficient filter, not a substitute for RLS.
--
-- Transactions here are the minimal columns calculateAccountBalances actually reads (type,
-- amount, from_account_id, to_account_id) — unlike getAllTransactionsForReports' joined shape
-- (category/account names), which net worth has never needed.

create or replace function public.get_net_worth_raw_data(p_user_id uuid)
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'accounts', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.accounts t where t.user_id = p_user_id),
    'transactions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'type', t.type,
        'amount', t.amount,
        'from_account_id', t.from_account_id,
        'to_account_id', t.to_account_id
      )), '[]'::jsonb)
      from public.transactions t
      where t.user_id = p_user_id
    ),
    'investments', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.investment_log t where t.user_id = p_user_id),
    'holdings', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.holdings t where t.user_id = p_user_id),
    'fixed_deposits', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_fixed_deposits t where t.user_id = p_user_id),
    'gold', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_gold t where t.user_id = p_user_id),
    'liabilities', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_loans_liabilities t where t.user_id = p_user_id),
    'epf', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_epf t where t.user_id = p_user_id),
    'nps', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_nps t where t.user_id = p_user_id),
    'ssy', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_ssy t where t.user_id = p_user_id),
    'sgb', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_sgb t where t.user_id = p_user_id),
    'ulip', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_ulip t where t.user_id = p_user_id),
    'real_estate', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_real_estate t where t.user_id = p_user_id),
    'ppf', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_ppf t where t.user_id = p_user_id),
    'recurring_deposits', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_recurring_deposits t where t.user_id = p_user_id),
    'nsc', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_nsc t where t.user_id = p_user_id),
    'vehicles', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.assets_vehicles t where t.user_id = p_user_id)
  )
$$;

grant execute on function public.get_net_worth_raw_data(uuid) to authenticated;
