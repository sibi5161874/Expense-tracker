import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Attach once per test, before any navigation, to collect console errors and uncaught page
 * errors as they happen (listening only at the end would miss everything that already fired).
 * Call the returned function at the end of the test to assert none occurred.
 */
export function watchForConsoleErrors(page: Page): () => void {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  return function expectNoConsoleErrors() {
    expect(errors, `Console/page errors during test:\n${errors.join('\n')}`).toHaveLength(0);
  };
}
