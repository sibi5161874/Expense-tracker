-- RULES.md §14 follow-up: useMonthlyOverview/useMonthlyTrend previously fetched every
-- transaction in a month (or N months) client-side and reduced it in JS. These three
-- functions do the same SUM/GROUP BY in Postgres instead, so only the aggregate numbers
-- cross the wire — the row-level data never leaves the database for a page that never
-- displays individual rows.
--
-- `security invoker` (the default, stated explicitly) means these run as the calling role,
-- so RLS on `transactions`/`categories` still applies — p_user_id is an explicit filter for
-- an efficient index scan, not a substitute for RLS; a caller passing someone else's user_id
-- still can't see their rows, the same as any other query in this app.

create or replace function public.get_monthly_transaction_summary(p_user_id uuid, p_month text)
returns table (income numeric, expense numeric)
language sql
stable
security invoker
as $$
  select
    coalesce(sum(amount) filter (where type = 'Income'), 0) as income,
    coalesce(sum(amount) filter (where type = 'Expense'), 0) as expense
  from public.transactions
  where user_id = p_user_id
    and date >= (p_month || '-01')::date
    and date < ((p_month || '-01')::date + interval '1 month')
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
  group by coalesce(c.name, 'Uncategorized')
  order by amount desc
$$;

-- generate_series over months, left-joined to each month's totals — a month with zero
-- transactions still gets a (month, 0, 0) row rather than being silently absent, matching
-- the client-side version's behavior of always returning exactly p_months_back rows.
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
  group by months.month
  order by months.month
$$;

grant execute on function public.get_monthly_transaction_summary(uuid, text) to authenticated;
grant execute on function public.get_monthly_category_breakdown(uuid, text) to authenticated;
grant execute on function public.get_monthly_trend(uuid, int) to authenticated;
