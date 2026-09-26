-- Migration 2: Set LZ4 compression on text columns that regularly store large strings.
-- Note: This applies to future inserts and updates. Existing rows keep their current
-- compression format until rewritten (e.g. via scripts/db/rewrite-to-lz4.sql).

-- transactions.notes: Contains raw bank statement descriptions, invoice details, and user notes.
alter table public.transactions alter column notes set compression lz4;

-- investment_log.notes: Stores trade context, scheme commentary, folio numbers, and broker remarks.
alter table public.investment_log alter column notes set compression lz4;

-- cashbook.notes: Stores peer-to-peer loan context, repayment terms, and settlement remarks.
alter table public.cashbook alter column notes set compression lz4;

-- goals.goal_name: Stores long custom financial milestone descriptions and target plans.
alter table public.goals alter column goal_name set compression lz4;
