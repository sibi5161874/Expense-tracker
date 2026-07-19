-- Backfills DB-level CHECK constraints for numeric fields that the Zod schemas already
-- constrain client-side but the original migrations left unconstrained at the DB layer —
-- closes the client-only-validation gap for these 5 columns specifically (every other
-- table's numeric/enum fields were already backed by a matching CHECK or Postgres enum).

alter table public.assets_loans_liabilities
  add constraint assets_loans_liabilities_emi_check check (emi is null or emi >= 0),
  add constraint assets_loans_liabilities_months_left_check check (months_left is null or months_left >= 0);

alter table public.user_profiles
  add constraint user_profiles_monthly_income_check check (monthly_income is null or monthly_income >= 0),
  add constraint user_profiles_monthly_expense_check check (monthly_expense is null or monthly_expense >= 0);

alter table public.holdings
  add constraint holdings_live_price_check check (live_price >= 0);
