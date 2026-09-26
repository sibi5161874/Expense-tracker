import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { resolveRequestUser } from '@/lib/supabase/bearer';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

/**
 * Admin API: Database storage health, bloat statistics, and archival run history.
 *
 * Guarded by user session and ADMIN_EMAIL environment variable.
 * Uses service_role client to execute the database statistics function.
 */
export async function GET(req: Request) {
  const { user } = await resolveRequestUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = (user.email ?? '').trim().toLowerCase();

  if (!adminEmail || userEmail !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const limited = await enforceRateLimit(`admin:db-stats:${user.id}`, 30, 60_000);
  if (limited) return limited;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Database health service is not configured on this server.' },
      { status: 500 }
    );
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.rpc('get_database_stats');

  if (error) {
    logError('admin.db-stats', error, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: 'Failed to retrieve database statistics' }, { status: 500 });
  }

  return NextResponse.json(data);
}
