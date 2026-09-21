import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error || errorDescription) {
    const errorMsg = errorDescription ?? error ?? "auth_callback_failed";
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // Validate next parameter to prevent open redirect vulnerabilities
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
      if (forwardedHost && !isLocalhost) {
        return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
