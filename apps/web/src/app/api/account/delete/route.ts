import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { resolveRequestUser } from '@/lib/supabase/bearer';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { accountDeletionSchema } from '@repo/shared/schemas';

/**
 * Permanent account deletion. Deleting the `auth.users` row cascades to every
 * data table (all of them declare `user_id ... references auth.users(id) on
 * delete cascade`), so one admin delete removes the account and all its data.
 *
 * This needs the service_role key, which is why it's a server route: the key is
 * read from server-only env and never reaches the client bundle (RULES.md §2).
 * The caller's own session is verified first, so a request can only ever delete
 * the account it is authenticated as — the service_role key is not usable to
 * target another user through this endpoint.
 */
export async function POST(req: Request) {
  const { user } = await resolveRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = await enforceRateLimit(`account:delete:${user.id}`, 3, 60 * 60_000);
  if (limited) return limited;

  // Require the user to retype their email — deletion is irreversible, so a
  // stray POST (or a mis-click through to the confirm button) shouldn't be enough.
  const parsed = accountDeletionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing confirmation' }, { status: 400 });
  }
  const body = parsed.data;
  if (body.confirm_email.trim().toLowerCase() !== (user.email ?? '').toLowerCase()) {
    return NextResponse.json({ error: "The email you typed doesn't match this account." }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: 'Account deletion is not configured on this server. Contact support.' },
      { status: 500 }
    );
  }

  const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    logError('account.delete', error, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: "Couldn't delete the account, try again." }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
