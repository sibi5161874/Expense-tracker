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
  // This is the very first page the whole run touches, against a `next dev` server that
  // hasn't compiled anything yet. The 'load' event (what goto waits for) can fire before React
  // finishes hydrating on a cold first compile, so a fill()+click() right after goto can land
  // on listeners that don't exist yet — the native input updates, but no React state does, and
  // the click is a no-op. Retrying the whole attempt is simpler and more robust than trying to
  // detect "hydrated" directly.
  let loggedIn = false;
  let lastUrl = '';
  let lastBodyText = '';
  for (let attempt = 1; attempt <= 3 && !loggedIn; attempt++) {
    await page.goto(`${baseURL}/login`, { timeout: 30_000 });
    await page.getByPlaceholder('you@example.com').waitFor({ state: 'visible' });
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();
    try {
      await page.waitForURL(`${baseURL}/dashboard`, { timeout: 15_000 });
      loggedIn = true;
    } catch {
      lastUrl = page.url();
      lastBodyText = (await page.locator('body').innerText()).slice(0, 500);
      // eslint-disable-next-line no-console -- diagnostic only, globalSetup has no test reporter
      console.error(`[globalSetup] Login attempt ${attempt}/3 did not reach /dashboard. URL: ${lastUrl}`);
    }
  }
  if (!loggedIn) {
    // eslint-disable-next-line no-console
    console.error('[globalSetup] Final page text:', lastBodyText);
    throw new Error(`[globalSetup] Login never reached /dashboard after 3 attempts. Last URL: ${lastUrl}`);
  }
  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();

  // Idempotent: a previous run that crashed or was killed mid-suite can leave its seeded rows
  // behind, which would otherwise collide with this run's insert (accounts has a unique
  // (user_id, name) constraint). Clearing first means running the suite twice in a row, or
  // recovering from an interrupted run, always starts from the same clean state.
  await cleanupTestData();
  await seedTestData();
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

  const { error: txError } = await admin.from('transactions').insert([
    { user_id: userId, date: '2026-01-05', type: 'Income', amount: 85_000, from_account_id: checking.id, notes: '[E2E] Salary' },
    { user_id: userId, date: '2026-01-07', type: 'Expense', amount: 1_250, from_account_id: checking.id, notes: '[E2E] Groceries' },
    { user_id: userId, date: '2026-01-10', type: 'Expense', amount: 450, from_account_id: checking.id, notes: '[E2E] Transport' },
    { user_id: userId, date: '2026-01-12', type: 'Expense', amount: 2_000, from_account_id: checking.id, notes: '[E2E] Rent share' },
    { user_id: userId, date: '2026-01-15', type: 'Income', amount: 3_000, from_account_id: checking.id, notes: '[E2E] Freelance' },
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
