// One-off backfill: creates the missing cash-side `transactions` row for every existing
// investment_log/cashbook entry that already has a linked account but predates the mirroring
// fix in createInvestmentLog.ts/createCashbook.ts (that fix only runs for *new* rows going
// forward — these are the already-existing ones that were never mirrored).
//
// Idempotent — before inserting, checks for a transaction that already matches the exact
// date/type/amount/from_account_id/notes it would create, and skips if one exists. Safe to
// run more than once, and defaults to a dry run so you can see the count before writing.
//
// Run from apps/web:
//   node --env-file=.env.local scripts/backfill-investment-cashbook-transactions.mjs           # dry run
//   node --env-file=.env.local scripts/backfill-investment-cashbook-transactions.mjs --apply   # writes
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY — service_role bypasses RLS
// since this has to see every user's rows, not just one session's. Never point this at a
// project without first taking a backup; it writes real `transactions` rows for real users.

import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');
const BATCH_SIZE = 200;

if (!URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// Mirrors packages/shared/src/logic/investmentMirroring.ts — duplicated rather than imported
// since this script runs via plain `node`, not through a bundler that resolves the workspace's
// TS source. Keep the two in sync if the mirroring rule ever changes.
function buildInvestmentMirror(row) {
  if (!row.linked_account_id) return null;
  const gross = row.quantity * row.price;

  if (row.action === 'BUY' || row.action === 'SIP') {
    const amount = gross + row.fees;
    if (!(amount > 0)) return null;
    return {
      type: 'Expense',
      amount,
      notes: `Bought ${row.quantity} ${row.symbol} @ ₹${row.price} via Investment Log`,
      categoryName: 'Investments',
      categoryType: 'Expense',
    };
  }
  if (row.action === 'SELL' || row.action === 'DIVIDEND') {
    const amount = gross - row.fees;
    if (!(amount > 0)) return null;
    return {
      type: 'Income',
      amount,
      notes: `${row.action === 'SELL' ? 'Sold' : 'Received dividend on'} ${row.quantity} ${row.symbol} @ ₹${row.price} via Investment Log`,
      categoryName: 'Investment Returns',
      categoryType: 'Income',
    };
  }
  return null; // BONUS / SPLIT — no cash changes hands
}

// Mirrors packages/shared/src/logic/cashbookMirroring.ts — same duplication reasoning as above.
function buildCashbookMirror(row) {
  if (!row.account_used_id) return null;
  if (!(row.amount > 0)) return null;
  return {
    type: row.flow === 'Gave' ? 'Expense' : 'Income',
    amount: row.amount,
    notes:
      row.flow === 'Gave' ? `Lent to ${row.counterparty} via Cashbook` : `Borrowed from ${row.counterparty} via Cashbook`,
  };
}

const categoryIdCache = new Map(); // `${userId}:${name}:${type}` -> id

async function findOrCreateCategory(userId, name, type) {
  const key = `${userId}:${name}:${type}`;
  if (categoryIdCache.has(key)) return categoryIdCache.get(key);

  const { data: existing, error: findError } = await admin
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .eq('type', type)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) {
    categoryIdCache.set(key, existing.id);
    return existing.id;
  }

  if (!APPLY) return null; // dry run never creates categories either

  const { data: created, error: createError } = await admin
    .from('categories')
    .insert({ user_id: userId, name, type })
    .select('id')
    .single();
  if (createError) throw createError;
  categoryIdCache.set(key, created.id);
  return created.id;
}

async function alreadyMirrored(userId, { date, type, amount, from_account_id, notes }) {
  const { data, error } = await admin
    .from('transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .eq('type', type)
    .eq('amount', amount)
    .eq('from_account_id', from_account_id)
    .eq('notes', notes)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function backfillInvestmentLog() {
  console.log('\n--- investment_log ---');
  let from = 0;
  let created = 0;
  let skipped = 0;
  for (;;) {
    const { data: rows, error } = await admin
      .from('investment_log')
      .select('id, user_id, date, symbol, action, quantity, price, fees, linked_account_id')
      .not('linked_account_id', 'is', null)
      .in('action', ['BUY', 'SELL', 'SIP', 'DIVIDEND'])
      .range(from, from + BATCH_SIZE - 1);
    if (error) throw error;
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const mirror = buildInvestmentMirror(row);
      if (!mirror) continue;

      const txShape = {
        date: row.date,
        type: mirror.type,
        amount: mirror.amount,
        from_account_id: row.linked_account_id,
        notes: mirror.notes,
      };
      if (await alreadyMirrored(row.user_id, txShape)) {
        skipped++;
        continue;
      }

      console.log(`${APPLY ? 'CREATE' : 'DRY RUN'} investment_log ${row.id} -> ${mirror.type} ${mirror.amount} (${mirror.notes})`);
      if (APPLY) {
        const categoryId = await findOrCreateCategory(row.user_id, mirror.categoryName, mirror.categoryType);
        const { error: insertError } = await admin
          .from('transactions')
          .insert({ user_id: row.user_id, category_id: categoryId, ...txShape });
        if (insertError) throw insertError;
      }
      created++;
    }

    from += BATCH_SIZE;
  }
  console.log(`investment_log: ${created} ${APPLY ? 'created' : 'would create'}, ${skipped} already mirrored`);
}

async function backfillCashbook() {
  console.log('\n--- cashbook ---');
  let from = 0;
  let created = 0;
  let skipped = 0;
  for (;;) {
    const { data: rows, error } = await admin
      .from('cashbook')
      .select('id, user_id, date, counterparty, flow, amount, account_used_id')
      .not('account_used_id', 'is', null)
      .range(from, from + BATCH_SIZE - 1);
    if (error) throw error;
    if (!rows || rows.length === 0) break;

    for (const row of rows) {
      const mirror = buildCashbookMirror(row);
      if (!mirror) continue;

      const txShape = {
        date: row.date,
        type: mirror.type,
        amount: mirror.amount,
        from_account_id: row.account_used_id,
        notes: mirror.notes,
      };
      if (await alreadyMirrored(row.user_id, txShape)) {
        skipped++;
        continue;
      }

      console.log(`${APPLY ? 'CREATE' : 'DRY RUN'} cashbook ${row.id} -> ${mirror.type} ${mirror.amount} (${mirror.notes})`);
      if (APPLY) {
        const { error: insertError } = await admin.from('transactions').insert({ user_id: row.user_id, ...txShape });
        if (insertError) throw insertError;
      }
      created++;
    }

    from += BATCH_SIZE;
  }
  console.log(`cashbook: ${created} ${APPLY ? 'created' : 'would create'}, ${skipped} already mirrored`);
}

async function main() {
  console.log(APPLY ? 'Running in APPLY mode — this will write transactions.' : 'Running in DRY RUN mode — pass --apply to write.');
  await backfillInvestmentLog();
  await backfillCashbook();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
