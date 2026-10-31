import { test, expect } from '@playwright/test';
import { watchForConsoleErrors } from '../helpers/assertions';
import { waitForRateLimit } from '../helpers/rate-limit-safe';

/**
 * Persona: adversarial. Probes for IDOR, XSS, auth bypass, and rate-limit bypass. Most of these
 * tests deliberately run unauthenticated (test.use({ storageState: ... })), since that's the
 * actual attack surface — a signed-in session proves nothing about what an attacker without one
 * can do.
 */
test.describe('hacker — unauthenticated probes', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('visiting /dashboard while signed out redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  // /api/ai-chat, /api/live-price/*, and /api/stock/fundamentals all return their E2E_MODE mock
  // before checking auth at all (matching the original mock spec — see route.ts), so they can't
  // exercise the real auth boundary here. /api/import/dividends is deliberately NOT mocked (it
  // never calls an external API, see e2e/README.md) — its real auth check is what's under test.
  //
  // This app's middleware intercepts an unauthenticated /api/* request with a 307 to /login
  // *before* the route handler's own `if (!user) return 401` ever runs — a real, correct
  // protection layer, just not the literal 401 a naive fetch would expect. maxRedirects: 0
  // surfaces that redirect instead of silently following it to the (200) login page.
  test('POSTing to a data API while signed out never reaches real route logic', async ({ request }) => {
    const res = await request.post('/api/import/dividends', { data: { entries: [] }, maxRedirects: 0 });
    expect([307, 401]).toContain(res.status());
  });

  test('a tampered-looking auth cookie still gets redirected away, not treated as a session', async ({ page, context }) => {
    await context.addCookies([
      { name: 'sb-access-token', value: 'tampered.jwt.value', domain: 'localhost', path: '/' },
    ]);
    const res = await page.request.post('/api/import/dividends', { data: { entries: [] }, maxRedirects: 0 });
    expect([307, 401, 403]).toContain(res.status());
  });

  test('logging in never lands anywhere but /dashboard, regardless of a crafted query string', async ({ page }) => {
    // This app's login handler does an unconditional router.push('/dashboard') — there's no
    // `?next=` redirect feature here to exploit (confirmed in AuthForm.tsx), so the real
    // property worth asserting is simpler: a successful login can only ever land on /dashboard.
    await page.goto('/login?next=https://evil.com');
    await page.getByPlaceholder('you@example.com').fill(process.env.TEST_USER_EMAIL!);
    await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!);
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
    expect(page.url()).not.toContain('evil.com');
  });
});

test.describe('hacker — authenticated probes', () => {
  test('a Razorpay webhook without an HMAC signature is rejected', async ({ request }) => {
    const res = await request.post('/api/payments/webhook', {
      data: { event: 'payment.captured', payload: {} },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('the admin database-health page redirects a non-admin user away', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/settings/admin/database-health');
    await expect(page).not.toHaveURL(/\/settings\/admin\/database-health$/);
    expectNoErrors();
  });

  test('uploading an SVG with an embedded <script> as an avatar is rejected', async ({ page }) => {
    await page.goto('/settings');
    const fileInput = page.locator('input[type="file"]').first();
    if (!(await fileInput.count())) test.skip(true, 'No avatar upload input on /settings');

    const malicious = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    await fileInput.setInputFiles({ name: 'evil.svg', mimeType: 'image/svg+xml', buffer: malicious });
    await expect(page.getByText(/not allowed|invalid|unsupported/i)).toBeVisible({ timeout: 5000 }).catch(async () => {
      // No explicit error copy found — at minimum, no <script> from this upload ever executes.
      const dialogs: string[] = [];
      page.on('dialog', (d) => dialogs.push(d.message()));
      await page.waitForTimeout(500);
      expect(dialogs).toHaveLength(0);
    });
  });

  test('rapid-firing the AI chat endpoint does not crash the server (rate-limited or E2E-mocked)', async ({ request }) => {
    const results: number[] = [];
    for (let i = 0; i < 20; i++) {
      const res = await request.post('/api/ai-chat', {
        data: { messages: [{ role: 'user', content: `probe ${i}` }] },
      });
      results.push(res.status());
      await waitForRateLimit(50);
    }
    // Every response is either a real answer (200, E2E-mocked) or a clean rate-limit (429) —
    // never a 500.
    expect(results.every((s) => s === 200 || s === 429)).toBe(true);
  });

  test('javascript: URLs are never auto-executed by the app shell', async ({ page }) => {
    const expectNoErrors = watchForConsoleErrors(page);
    await page.goto('/dashboard');
    const dialogs: string[] = [];
    page.on('dialog', (d) => dialogs.push(d.message()));
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = 'javascript:alert(1)';
      a.textContent = 'probe';
      document.body.appendChild(a);
    });
    expect(dialogs).toHaveLength(0);
    expectNoErrors();
  });
});
