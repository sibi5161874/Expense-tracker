-- Issue #24: Investment BUY/SELL are capital transfers between bank accounts and portfolio
-- holdings, correctly mirrored to 'Investments' and 'Investment Returns' and excluded from operational
-- spending and income aggregates. However, DIVIDEND represents genuine passive income/yield.
-- This migration ensures a default 'Dividend' Income category exists for users and updates any existing
-- transactions mirrored from an investment_log row with action = 'DIVIDEND' to use the 'Dividend' category.

do $$
declare
  u record;
  cat_id uuid;
begin
  -- Ensure every user with transactions has a 'Dividend' Income category
  for u in select distinct user_id from public.transactions loop
    select id into cat_id from public.categories where user_id = u.user_id and name = 'Dividend' and type = 'Income' limit 1;
    if cat_id is null then
      insert into public.categories (user_id, name, type, icon)
      values (u.user_id, 'Dividend', 'Income', 'Coins')
      returning id into cat_id;
    end if;

    -- Update transactions mirrored from investment_log where action is DIVIDEND
    update public.transactions t
    set category_id = cat_id
    from public.investment_log il
    where t.source_investment_log_id = il.id
      and il.action = 'DIVIDEND'
      and t.user_id = u.user_id;
  end loop;
end $$;
