-- Seeds sensible default categories and one Cash account for every new user,
-- matching DATA_MODEL.md §7: "seeded with defaults, editable per-user". Without
-- this, a brand-new signup has an empty From Account/Category dropdown on every
-- form and can't log a single transaction until they first visit Settings.
--
-- security definer is required because this runs from a trigger on auth.users,
-- outside any authenticated request context — there is no auth.uid() session to
-- satisfy the categories/accounts RLS policies, so the function must run with
-- the privileges of its owner (postgres) instead of the invoking role.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type) values
    (new.id, 'Salary', 'Income'),
    (new.id, 'Investment Returns', 'Income'),
    (new.id, 'Dividend', 'Income'),
    (new.id, 'Other Income', 'Income'),
    (new.id, 'Food & Dining', 'Expense'),
    (new.id, 'Rent', 'Expense'),
    (new.id, 'Utilities', 'Expense'),
    (new.id, 'Transport', 'Expense'),
    (new.id, 'Shopping', 'Expense'),
    (new.id, 'Healthcare', 'Expense'),
    (new.id, 'Entertainment', 'Expense'),
    (new.id, 'Other Expense', 'Expense'),
    (new.id, 'Self Transfer', 'Transfer');

  insert into public.accounts (user_id, name, type, opening_balance, currency, is_active) values
    (new.id, 'Cash', 'Cash', 0, 'INR', true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
