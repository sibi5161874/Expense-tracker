import { PRODUCTION_SITE_URL } from "@repo/shared/config";

/**
 * Auth redirect targets (signup confirmation, Google OAuth, password reset) need one exact,
 * predictable origin that matches Supabase's Redirect URLs allow-list. window.location.origin
 * would work locally but pins the redirect to whatever domain/alias happened to serve the
 * request — fragile the moment there's more than one Vercel alias or a custom domain. Local
 * dev still gets the real localhost origin so redirect testing against a local Supabase
 * project setup works unchanged.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  return PRODUCTION_SITE_URL;
}
