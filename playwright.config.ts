import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests hit a real Supabase project (signup creates a real auth user, per
 * apps/web/src/contexts/AuthContext.tsx), so — same as RULES.md §10's verify-rls
 * script — this must point at a dedicated TEST Supabase project, never production.
 * apps/web must already be running against that project's env vars (`pnpm --filter
 * web dev`, or CI's own build+start step) with matching `NEXT_PUBLIC_SUPABASE_URL`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
