import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";
import type { Database } from "@repo/shared/types";

/**
 * Resolves the caller for a route that must work from both web (cookie session, via
 * @/lib/supabase/server) and the mobile app (no cookies — a bearer token instead, the same
 * way any REST API authenticates a non-browser client). Checked first since it's cheap and
 * unambiguous; cookie auth is the fallback for ordinary browser requests.
 *
 * The returned client carries the token on every subsequent request via the `Authorization`
 * header, so `.from(table).select()` calls run RLS exactly as that user — same security
 * model as the cookie-authenticated client, just a different way of proving who's asking.
 */
export async function resolveRequestUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;

  if (bearerToken) {
    const supabase = createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${bearerToken}` } } }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(bearerToken);
    return { supabase, user };
  }

  const supabase = await createCookieClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
