import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Attach once per test, before any navigation, to collect console errors and uncaught page
 * errors as they happen (listening only at the end would miss everything that already fired).
 * Call the returned function at the end of the test to assert none occurred.
 */
const DEFAULT_IGNORED_CONSOLE_ERRORS: RegExp[] = [
  /adsbygoogle/i,
  /Content Security Policy/i,
  /Failed to load resource/i,
];

export function watchForConsoleErrors(page: Page, options?: { ignore?: RegExp[] }): () => void {
  const errors: string[] = [];
  const ignoredPatterns = [...DEFAULT_IGNORED_CONSOLE_ERRORS, ...(options?.ignore ?? [])];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (ignoredPatterns.some((re) => re.test(text))) return;
      errors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    if (ignoredPatterns.some((re) => re.test(err.message))) return;
    errors.push(err.message);
  });

  return function expectNoConsoleErrors() {
    expect(errors, `Console/page errors during test:\n${errors.join('\n')}`).toHaveLength(0);
  };
}
