import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import { AUTH_STATE_PATH } from './e2e/helpers/setup';

// Loads .env.test.local into process.env for this config file and globalSetup — `next dev`
// gets its own copy via the --env-file flag on the webServer command below. Node >=20.6 has
// this built in (no dotenv dependency needed); see package.json's engines field.
try {
  process.loadEnvFile(path.join(__dirname, '.env.test.local'));
} catch {
  // Missing is fine when just importing this file for its exported constants (e.g. a persona
  // spec importing AUTH_STATE_PATH indirectly) — running the suite for real will fail loudly
  // later, in setup.ts, with a clear message instead.
}

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:4000';

export default defineConfig({
  testDir: './e2e/personas',
  globalSetup: './e2e/helpers/setup.ts',
  globalTeardown: './e2e/helpers/teardown.ts',
  fullyParallel: true,
  retries: 0, // failures should be loud, not hidden by a retry that happens to pass
  // `next dev` compiles each route on first visit (several seconds for a heavier page); a
  // single test that navigates multiple distinct routes can accumulate multiple first-compiles
  // within one 30s budget, especially against a real cloud test project's network latency
  // instead of a local one. 60s observed to clear that comfortably without masking genuine
  // hangs (a real crash/hang still times out well before that).
  timeout: 60_000,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL,
    storageState: AUTH_STATE_PATH,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Env vars passed via `env` below (not `--env-file` on the command line) — this machine's
    // own path contains a space ("...\Sibi Office\..."), which broke shell argument parsing
    // for an unquoted --env-file=<path>. process.loadEnvFile already populated process.env
    // above, so spreading it here hands next the exact same values with no quoting involved.
    command: 'next dev -p 4000',
    url: baseURL,
    // Always false, even locally: a dev server is very often already running on :4000 against
    // production's .env.local (see this repo's own history of exactly that). Reusing it would
    // silently run the whole suite against production instead of the test project — fail fast
    // with "port in use" instead, and free the port first.
    reuseExistingServer: false,
    timeout: 60_000,
    env: (() => {
      // NODE_ENV=test (set by .env.test.local, loaded above) must NOT reach `next dev` itself —
      // confirmed by hand: with it set, Turbopack serves a 404 for /login specifically (other
      // routes were fine), even though the Supabase project selection was already correct via
      // the explicit vars below. `next dev` always wants to run as development regardless of
      // which env file supplied the Supabase/test-project values.
      const { NODE_ENV: _unused, ...rest } = process.env;
      return Object.fromEntries(
        Object.entries({ ...rest, E2E_MODE: 'true' }).filter((entry): entry is [string, string] => entry[1] !== undefined)
      );
    })(),
  },
});
