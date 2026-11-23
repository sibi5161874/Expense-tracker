import { createClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';

/**
 * Creates a Supabase client with the service_role key to bypass RLS.
 * STRICTLY for trusted server-side API routes and webhooks that enforce
 * authorization explicitly (e.g. verified webhook signatures, admin checks).
 * Never import or use in client components.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
