"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BillingTab } from "@/components/settings/BillingTab";

/** Read once at mount, not on every render — `window.location.hash` isn't React state, so
 * this is a one-time environment read (guarded for SSR), not something to memoize against
 * changing inputs. */
function readSessionTokens(): { access_token: string; refresh_token: string } | null {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const access_token = hash.get("access_token");
  const refresh_token = hash.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

/**
 * Bridge page opened inside the mobile app's WebView (see
 * apps/mobile/app/(app)/billing.tsx) — mobile has no Razorpay React Native SDK compatible
 * with Expo Go, so Pro checkout reuses this existing web flow instead of a separate
 * native implementation. Mobile passes its Supabase session tokens in the URL hash
 * (never the query string, which — unlike the hash — is sent to the server and would land
 * in request logs) after opening the WebView; this page establishes the same session
 * client-side via `setSession`, then renders the identical BillingTab web already uses.
 *
 * Added to PUBLIC_PATHS in middleware.ts — there's no cookie session on the very first
 * request (tokens only reach the client after this page's own JS runs), so the middleware
 * must not redirect to /login before that happens.
 */
export default function MobileCheckoutPage() {
  const tokens = useMemo(() => readSessionTokens(), []);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(tokens ? "loading" : "error");

  useEffect(() => {
    if (!tokens) return;
    const supabase = createClient();
    // setState here happens inside the setSession callback, not synchronously in the
    // effect body — this is the "subscribe to an external system's update" case the lint
    // rule's own docs carve out, not the cascading-render case it flags.
    supabase.auth.setSession(tokens).then(({ error }) => {
      setStatus(error ? "error" : "ready");
    });
  }, [tokens]);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <p className="text-destructive text-center text-sm">
          Couldn&apos;t start checkout — go back and try again from the app.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background p-4">
      <BillingTab />
    </div>
  );
}
