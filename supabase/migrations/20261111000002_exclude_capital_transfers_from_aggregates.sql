-- Issue #18: investment-log/cashbook cash mirrors are real `Income`/`Expense` rows (so account
-- balances stay correct — RULES.md §13), but these three aggregate functions (added in
-- 20260820000001_monthly_transaction_aggregates.sql, RULES.md §14) summed every row of that
-- type regardless of category, so a BUY inflated "monthly expenses" by its full amount and
-- crashed net savings. Excluding the 4 mirror-only category names (packages/shared/src/logic/
-- operationalTransactions.ts's CAPITAL_TRANSFER_CATEGORY_NAMES — keep the two lists in sync)
-- fixes the dashboard, trend chart, and category breakdown without touching how balances or
-- net worth are computed at all.

create or replace function public.get_monthly_transaction_summary(p_user_id uuid, p_month text)
returns table (income numeric, expense numeric)
language sql
stable
security invoker
as $$
  select
    coalesce(sum(t.amount) filter (where t.type = 'Income'), 0) as income,
    coalesce(sum(t.amount) filter (where t.type = 'Expense'), 0) as expense
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = p_user_id
    and t.date >= (p_month || '-01')::date
    and t.date < ((p_month || '-01')::date + interval '1 month')
    and coalesce(c.name, '') not in ('Investments', 'Investment Returns', 'Cashbook Given', 'Cashbook Received')
$$;

create or replace function public.get_monthly_category_breakdown(p_user_id uuid, p_month text)
returns table (category_name text, amount numeric)
language sql
stable
security invoker
as $$
  select
    coalesce(c.name, 'Uncategorized') as category_name,
    sum(t.amount) as amount
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  where t.user_id = p_user_id
    and t.type = 'Expense'
    and t.date >= (p_month || '-01')::date
    and t.date < ((p_month || '-01')::date + interval '1 month')
    and coalesce(c.name, '') not in ('Investments', 'Investment Returns', 'Cashbook Given', 'Cashbook Received')
  group by coalesce(c.name, 'Uncategorized')
  order by amount desc
$$;

create or replace function public.get_monthly_trend(p_user_id uuid, p_months_back int)
returns table (month text, income numeric, expense numeric)
language sql
stable
security invoker
as $$
  with months as (
    select to_char(date_trunc('month', current_date) - (n || ' months')::interval, 'YYYY-MM') as month
    from generate_series(p_months_back - 1, 0, -1) as n
  )
  select
    months.month,
    coalesce(sum(t.amount) filter (where t.type = 'Income'), 0) as income,
    coalesce(sum(t.amount) filter (where t.type = 'Expense'), 0) as expense
  from months
  left join public.transactions t
    on t.user_id = p_user_id
    and t.date >= (months.month || '-01')::date
    and t.date < ((months.month || '-01')::date + interval '1 month')
  left join public.categories c on c.id = t.category_id
  where coalesce(c.name, '') not in ('Investments', 'Investment Returns', 'Cashbook Given', 'Cashbook Received')
     or t.id is null
  group by months.month
  order by months.month
$$;
