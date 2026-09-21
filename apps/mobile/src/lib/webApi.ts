const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL;

/**
 * Calls one of apps/web's Next.js API routes with the mobile Supabase session's access
 * token as a Bearer header — the routes' own auth (resolveRequestUser in
 * apps/web/src/lib/supabase/bearer.ts) accepts this the same way it accepts a cookie
 * session, and RLS/tier gating inside the route behaves identically either way. Used for
 * every live-data feature ported from web (stock fundamentals, universal ticker lookup,
 * benchmark history) — these need no mobile-specific backend, just this one auth bridge.
 */
export async function fetchWebApi<T>(path: string, accessToken: string): Promise<T> {
  if (!WEB_APP_URL) {
    throw new Error("EXPO_PUBLIC_WEB_APP_URL is not configured.");
  }
  const res = await fetch(`${WEB_APP_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export async function postWebApi<T, B = unknown>(path: string, body: B, accessToken: string): Promise<T> {
  if (!WEB_APP_URL) {
    throw new Error("EXPO_PUBLIC_WEB_APP_URL is not configured.");
  }
  const res = await fetch(`${WEB_APP_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

