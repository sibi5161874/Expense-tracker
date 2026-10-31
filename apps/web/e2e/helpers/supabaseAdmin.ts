import { createClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';

/**
 * service_role client for test setup/cleanup only — bypasses RLS entirely, same as
 * src/app/api/account/delete/route.ts's admin client. Never used by app code; only by these
 * e2e helpers, against the dedicated test Supabase project named in .env.test.local.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — is .env.test.local loaded?');
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Resolves the test user's id from TEST_USER_EMAIL via the admin API (no profiles-table dependency). */
export async function getTestUserId(): Promise<string> {
  const email = process.env.TEST_USER_EMAIL;
  if (!email) throw new Error('TEST_USER_EMAIL missing — is .env.test.local loaded?');

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;

  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`Test user ${email} not found — create it in the test project's Auth > Users first.`);
  return user.id;
}
