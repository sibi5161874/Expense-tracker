import path from 'node:path';
import type { FullConfig } from '@playwright/test';
import { chromium } from '@playwright/test';
import { supabaseAdmin, getTestUserId } from './supabaseAdmin';
import { cleanupTestData } from './cleanup';

export const AUTH_STATE_PATH = path.join(__dirname, '..', '.auth', 'user.json');

/**
 * Playwright globalSetup: logs in through the real UI once (this app's auth is cookie-based,
 * via @supabase/ssr's createBrowserClient — there's no simple localStorage session to inject),
 * then saves the authenticated storage state so every test project starts already signed in.
 * Also seeds a small, disposable dataset every persona test can rely on existing.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL ?? process.env.E2E_BASE_URL ?? 'http://localhost:4000';
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL / TEST_USER_PASSWORD missing — is .env.test.local loaded?');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', (msg) => {
    // eslint-disable-next-line no-console
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => {
    // eslint-disable-next-line no-console
    console.error(`[Browser PageError]`, err);
  });

  let loggedIn = false;
  let lastUrl = '';
  let lastBodyText = '';
  for (let attempt = 1; attempt <= 3 && !loggedIn; attempt++) {
    await page.goto(`${baseURL}/login`, { timeout: 60_000 });
    // Small delay to allow React 19 hydration to complete on cold compile
    await page.waitForTimeout(2000);
    await page.getByPlaceholder('you@example.com').waitFor({ state: 'visible', timeout: 60_000 });
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    try {
      await page.waitForURL(`${baseURL}/dashboard`, { timeout: 30_000 });
      loggedIn = true;
    } catch {
      lastUrl = page.url();
      lastBodyText = (await page.locator('body').innerText()).slice(0, 500);
      // eslint-disable-next-line no-console -- diagnostic only, globalSetup has no test reporter
      console.error(`[globalSetup] Login attempt ${attempt}/3 did not reach /dashboard. URL: ${lastUrl}\nBody text:\n${lastBodyText}`);
    }
  }
  if (!loggedIn) {
    // eslint-disable-next-line no-console
    console.error('[globalSetup] Final page text:', lastBodyText);
    throw new Error(`[globalSetup] Login never reached /dashboard after 3 attempts. Last URL: ${lastUrl}`);
  }
  await page.context().storageState({ path: AUTH_STATE_PATH });

  // Idempotent: a previous run that crashed or was killed mid-suite can leave its seeded rows
  // behind, which would otherwise collide with this run's insert (accounts has a unique
  // (user_id, name) constraint). Clearing first means running the suite twice in a row, or
  // recovering from an interrupted run, always starts from the same clean state.
  for (let i = 0; i < 3; i++) {
    try {
      await cleanupTestData();
      await seedTestData();
      // eslint-disable-next-line no-console
      console.log('[globalSetup] Seeding completed successfully');
      break;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[globalSetup] seed attempt ${i + 1}/3 failed:`, err);
      if (i === 2) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Pre-warm the main app routes so Next.js dev server compiles them during globalSetup
  // rather than timing out individual 60s test budgets on cold on-demand compilation.
  const warmRoutes = ['/dashboard', '/transactions', '/investments', '/portfolio', '/goals', '/cashbook', '/reports', '/settings'];
  for (const route of warmRoutes) {
    try {
      await page.goto(`${baseURL}${route}`, { timeout: 10_000, waitUntil: 'domcontentloaded' });
    } catch {
      // Warm-up is best-effort
    }
  }

  await browser.close();
}

/**
 * Minimal, disposable dataset for the test user: 2 accounts, 5 transactions, 1 goal — every
 * text field carries an `[E2E]` prefix so cleanup.ts (and anyone eyeballing the test project)
 * can tell it apart from anything else in the 500 MB free-tier project.
 */
export async function seedTestData() {
  const admin = supabaseAdmin();
  const userId = await getTestUserId();

  const { data: accounts, error: accountsError } = await admin
    .from('accounts')
    .insert([
      { user_id: userId, name: '[E2E] Checking', type: 'Bank', opening_balance: 100_000 },
      { user_id: userId, name: '[E2E] Cash', type: 'Cash', opening_balance: 5_000 },
    ])
    .select('id, name');
  if (accountsError) throw accountsError;

  const checking = accounts.find((a) => a.name === '[E2E] Checking')!;
  const today = new Date().toISOString().split('T')[0];

  const { error: txError } = await admin.from('transactions').insert([
    { user_id: userId, date: today, type: 'Income', amount: 85_000, from_account_id: checking.id, notes: '[E2E] Salary' },
    { user_id: userId, date: today, type: 'Expense', amount: 1_250, from_account_id: checking.id, notes: '[E2E] Groceries' },
    { user_id: userId, date: today, type: 'Expense', amount: 450, from_account_id: checking.id, notes: '[E2E] Transport' },
    { user_id: userId, date: today, type: 'Expense', amount: 2_000, from_account_id: checking.id, notes: '[E2E] Rent share' },
    { user_id: userId, date: today, type: 'Income', amount: 3_000, from_account_id: checking.id, notes: '[E2E] Freelance' },
  ]);
  if (txError) throw txError;

  const { error: goalError } = await admin.from('goals').insert({
    user_id: userId,
    goal_name: '[E2E] Buy laptop',
    category: 'Other',
    target_amount: 100_000,
    saved_amount: 10_000,
    target_date: '2026-12-31',
    priority: 'Medium',
  });
  if (goalError) throw goalError;
}
