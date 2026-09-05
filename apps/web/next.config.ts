import type { NextConfig } from "next";

// Next.js still needs 'unsafe-inline'/'unsafe-eval' for its own hydration bootstrap and
// Fast Refresh — a nonce-based CSP would remove those but requires wiring a nonce through
// every request via middleware, which is a bigger change than this pass. This is a real
// improvement over no CSP (blocks arbitrary third-party script/frame/object injection,
// clickjacking, MIME sniffing) but isn't the strictest possible policy.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-src 'self' https://accounts.google.com",
  "form-action 'self' https://*.supabase.co https://accounts.google.com",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: CSP },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // max-age=2 years + preload, the standard HSTS-preload-list submission bar — tells browsers
  // to never downgrade this origin to plain HTTP, even on the very first visit.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

// No Access-Control-* headers below: every legitimate caller of /api/* is either this same
// origin (the web app's own client code) or the mobile app's server-side fetch (Bearer token,
// not a browser — CORS is a browser-enforced policy and doesn't apply to it). There is no
// legitimate cross-origin *browser* caller these routes need to allow, so adding CORS headers
// here would only be widening access with nothing that needs it.

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
