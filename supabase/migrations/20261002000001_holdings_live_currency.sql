-- The price refresh (apps/web/src/app/api/prices/refresh/route.ts) can price a holding in any
-- currency — a US stock in USD, a Tokyo stock in JPY — but `holdings` only stored the number, so
-- the portfolio added foreign prices into INR totals with no way to tell them apart. This records
-- which currency each live_price is in, so the portfolio can flag non-INR rows. Nullable: rows
-- priced before this column existed, or entered by hand, simply have no recorded currency.
-- No valuation changes here; converting to INR is a separate piece of work.

alter table public.holdings
  add column live_currency text;
