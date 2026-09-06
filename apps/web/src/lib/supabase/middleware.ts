import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@repo/shared/types";
import { REQUEST_ID_HEADER } from "@/lib/requestId";

// Prefix-matched against the pathname (see isPublicPath below) — "/" is handled
// separately as an exact match so it doesn't accidentally prefix-match every route.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  // Public marketing pages, reachable from the landing page's navbar/footer by anyone,
  // signed in or not.
  "/features",
  "/pricing",
  "/reports-overview",
  "/donate",
  // No cookie session exists yet when this loads directly from an unauthenticated browser
  // — but by the time a real recovery link lands here, /auth/callback has already exchanged
  // the code for a real session, so this only needs to be public for the direct-visit case.
  "/reset-password",
  "/auth/callback",
  "/privacy",
  "/terms",
  // Razorpay's server calls this directly and never has a session cookie —
  // it authenticates itself via HMAC signature, not the auth middleware.
  "/api/payments/webhook",
  // Vercel Cron calls this directly and never has a session cookie either —
  // it authenticates itself via the CRON_SECRET bearer token, checked inside
  // the route. Same bug class as the payment webhook above: without this,
  // every cron invocation would 307 to /login before ever reaching the route.
  "/api/cron/monthly-summary",
  // Opened inside the mobile app's WebView with no cookie session yet — it establishes
  // one client-side from tokens in the URL hash (see the page's own header comment) after
  // this first request lands, so it can't be gated behind a cookie session that doesn't
  // exist until after the redirect would already have fired.
  "/mobile-checkout",
  // Called directly by the mobile app via plain fetch with an Authorization: Bearer
  // header, never a cookie — resolveRequestUser (apps/web/src/lib/supabase/bearer.ts)
  // authenticates the request itself from that header. Same bug class as the entries
  // above: without this, the middleware would 307 every mobile call to /login before
  // the route ever saw the bearer token.
  "/api/account/export",
  "/api/account/delete",
  "/api/live-price/universal",
  "/api/live-price/history",
  "/api/stock/fundamentals",
];

export async function updateSession(request: NextRequest) {
  // Generated once per request, before anything else — a route that errors before its own
  // body runs (a bad Zod parse, an auth failure) still needs a traceable ID, and the same
  // value has to reach both the response header (for a user/support-ticket reference) and
  // whatever the route logs via logError's meta (see requestId.ts's getRequestId), so it's
  // set on the *request* here, not generated separately in each place that wants it.
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);
  const requestWithId = { headers: requestHeaders };

  let supabaseResponse = NextResponse.next({ request: requestWithId });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request: requestWithId });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath =
    request.nextUrl.pathname === "/" ||
    PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const response = NextResponse.redirect(loginUrl);
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    const response = NextResponse.redirect(dashboardUrl);
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  supabaseResponse.headers.set(REQUEST_ID_HEADER, requestId);
  return supabaseResponse;
}
