// Concurrency check for reserve_payment_order (supabase/migrations/20260822000001_payment_order_reservation.sql):
// fires two overlapping reservation requests for the same (user, purpose) and asserts only
// one wins the slot — the whole point of the function is closing the race where two
// simultaneous /api/payments/create-order calls could otherwise both call Razorpay and mint
// two real paid orders.
//
// Runs the same way as verify-rls.mjs — needs a dedicated TEST Supabase project with the
// reservation migration applied, never point this at production:
//
//   cd apps/web
//   node --env-file=.env.local scripts/verify-payment-reservation.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and
// SUPABASE_SERVICE_ROLE_KEY in .env.local. Exits non-zero if any check fails.

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const stamp = Date.now();
const testUser = { email: `payment-reservation-test-${stamp}@example.com`, password: `Test-${stamp}-aA1!` };

let failures = 0;
function check(label, pass) {
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}`);
  if (!pass) failures++;
}

async function main() {
  console.log('Creating test user...');
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: testUser.email,
    password: testUser.password,
    email_confirm: true,
  });
  if (createErr) throw createErr;

  try {
    const client = createClient(URL, ANON_KEY);
    const { error: signInErr } = await client.auth.signInWithPassword(testUser);
    if (signInErr) throw new Error(`sign-in failed: ${signInErr.message}`);

    // Two concurrent reservation attempts for the same (user, purpose) — this is the exact
    // race the function exists to close: both requests start before either has committed.
    const [first, second] = await Promise.all([
      client.rpc('reserve_payment_order', {
        p_purpose: 'lifetime_purchase',
        p_amount_paise: 100000,
        p_placeholder_order_id: `pending:${randomUUID()}`,
      }).single(),
      client.rpc('reserve_payment_order', {
        p_purpose: 'lifetime_purchase',
        p_amount_paise: 100000,
        p_placeholder_order_id: `pending:${randomUUID()}`,
      }).single(),
    ]);

    check('First reservation call succeeded', !first.error && !!first.data);
    check('Second reservation call succeeded', !second.error && !!second.data);

    const reservedFlags = [first.data?.reserved_by_me, second.data?.reserved_by_me];
    check(
      'Exactly one of the two concurrent calls won the reservation',
      reservedFlags.filter((v) => v === true).length === 1
    );
    check(
      'Both calls agree on the same underlying row id (the loser sees the winner\'s row)',
      first.data?.id === second.data?.id
    );

    // A third call after the slot is held (not concurrent this time) must also lose, and must
    // see the placeholder order id, not a real one — the loser's UI-facing contract.
    const third = await client.rpc('reserve_payment_order', {
      p_purpose: 'lifetime_purchase',
      p_amount_paise: 100000,
      p_placeholder_order_id: `pending:${randomUUID()}`,
    }).single();
    check('A subsequent call also fails to reserve while the slot is held', third.data?.reserved_by_me === false);
    check(
      "The subsequent call's order id is still the placeholder (winner hasn't called Razorpay yet)",
      third.data?.razorpay_order_id?.startsWith('pending:') ?? false
    );
  } finally {
    console.log('\nCleaning up...');
    await admin.from('payment_events').delete().eq('user_id', created.user.id);
    await admin.auth.admin.deleteUser(created.user.id);
  }

  console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Script error:', err.message);
  process.exit(1);
});
