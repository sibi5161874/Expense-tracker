-- Issue #17: editing or deleting an investment_log/cashbook entry had no way to find the
-- transactions row that mirrors its cash side, since nothing linked the two rows. The
-- application matched them by nothing at all (it didn't try), so an edit left the mirrored
-- transaction stuck at its original amount. These nullable, ON DELETE CASCADE columns let
-- application code find the exact mirror row to update or delete in one query, and guarantee
-- that deleting the source row never leaves an orphaned mirror behind even if the app forgets
-- to clean one up by hand.
--
-- No RLS changes needed: both columns live on `transactions`, which already has its 4
-- policies (RULES.md §1) scoped to `user_id = auth.uid()` — these are just additional nullable
-- FK columns on rows a user can already only select/insert/update/delete as their own.

alter table public.transactions
  add column source_investment_log_id uuid references public.investment_log(id) on delete cascade,
  add column source_cashbook_id uuid references public.cashbook(id) on delete cascade;

-- Each source row mirrors into at most one transaction, so these are exact-match lookups —
-- index them the same way any other FK used in a WHERE clause would be.
create index transactions_source_investment_log_id_idx
  on public.transactions (source_investment_log_id)
  where source_investment_log_id is not null;

create index transactions_source_cashbook_id_idx
  on public.transactions (source_cashbook_id)
  where source_cashbook_id is not null;
