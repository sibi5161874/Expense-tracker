// Node's fetch (undici) can hang for a long time on some Windows networks by trying an
// IPv6 route to Supabase before falling back to IPv4 — this made every request that calls
// supabase.auth.getUser() (middleware, RootPage) hang indefinitely. Forcing ipv4first here
// makes the fix permanent instead of relying on a NODE_OPTIONS env var set by hand each run.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
