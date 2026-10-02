import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getAmfiSchemes } from '@/lib/amfiCache';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { searchAmfiSchemes } from '@repo/shared/logic';

/**
 * Backs the Add Investment form's mutual fund picker: type part of a fund's name, pick the exact
 * scheme, and the form stores its AMFI scheme code as the symbol — so the price refresh later
 * matches by code instead of by whatever name someone typed. Searches the cached AMFI list
 * (amfiCache.ts), so a keystroke never triggers a download.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Generous on purpose: the picker debounces, but a fast typist still sends several a second.
  const limited = await enforceRateLimit(`mf:search:${user.id}`, 60, 60_000);
  if (limited) return limited;

  const q = new URL(req.url).searchParams.get('q') ?? '';
  if (q.trim().length > 100) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  try {
    const results = searchAmfiSchemes(await getAmfiSchemes(), q);
    return NextResponse.json({ results });
  } catch (e) {
    logError('mf.search', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: "Couldn't load the fund list right now, try again shortly." }, { status: 502 });
  }
}
