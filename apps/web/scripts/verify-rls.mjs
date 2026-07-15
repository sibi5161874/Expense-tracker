// RLS isolation check per RULES.md §7: "Before marking any new table done: create a
// second test user and confirm they cannot see the first user's rows."
//
// Run this yourself (it creates and deletes two real accounts in your Supabase
// project, so it's your action to take, not something the assistant runs for you):
//
//   cd apps/web
//   node --env-file=.env.local scripts/verify-rls.mjs
//
// Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and
// SUPABASE_SERVICE_ROLE_KEY in .env.local. Exits non-zero if any check fails.

import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON_KEY || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const stamp = Date.now();
const userA = { email: `rls-test-a-${stamp}@example.com`, password: `Test-${stamp}-aA1!` };
const userB = { email: `rls-test-b-${stamp}@example.com`, password: `Test-${stamp}-bB1!` };

let failures = 0;
function check(label, pass) {
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}`);
  if (!pass) failures++;
}

async function signIn(creds) {
  const client = createClient(URL, ANON_KEY);
  const { error } = await client.auth.signInWithPassword(creds);
  if (error) throw new Error(`sign-in failed for ${creds.email}: ${error.message}`);
  return client;
}

async function main() {
  console.log('Creating two test users...');
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: userA.email,
    password: userA.password,
    email_confirm: true,
  });
  if (createErr) throw createErr;
  const { data: createdB, error: createErrB } = await admin.auth.admin.createUser({
    email: userB.email,
    password: userB.password,
    email_confirm: true,
  });
  if (createErrB) throw createErrB;

  try {
    const clientA = await signIn(userA);
    const clientB = await signIn(userB);

    const { data: inserted, error: insertErr } = await clientA
      .from('accounts')
      .insert({ name: 'RLS Test Account', type: 'Cash' })
      .select()
      .single();
    check('User A can insert their own account', !insertErr && !!inserted);

    const { data: bSeesA } = await clientB.from('accounts').select('id').eq('id', inserted.id);
    check("User B cannot SELECT user A's account", (bSeesA?.length ?? 0) === 0);

    const { error: bUpdateErr, data: bUpdateData } = await clientB
      .from('accounts')
      .update({ name: 'hijacked' })
      .eq('id', inserted.id)
      .select();
    check("User B cannot UPDATE user A's account", !!bUpdateErr || (bUpdateData?.length ?? 0) === 0);

    const { error: bDeleteErr, data: bDeleteData } = await clientB
      .from('accounts')
      .delete()
      .eq('id', inserted.id)
      .select();
    check("User B cannot DELETE user A's account", !!bDeleteErr || (bDeleteData?.length ?? 0) === 0);

    const { data: reassignData } = await clientA
      .from('accounts')
      .update({ user_id: createdB.user.id })
      .eq('id', inserted.id)
      .select();
    check(
      'User A cannot reassign their own row to another user_id (WITH CHECK)',
      (reassignData?.length ?? 0) === 0
    );

    const { data: aStillSeesIt } = await clientA.from('accounts').select('id').eq('id', inserted.id);
    check('User A still owns the row after the blocked reassignment attempt', (aStillSeesIt?.length ?? 0) === 1);
  } finally {
    console.log('\nCleaning up test users...');
    await admin.auth.admin.deleteUser(created.user.id);
    await admin.auth.admin.deleteUser(createdB.user.id);
  }

  console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Script error:', err.message);
  process.exit(1);
});
