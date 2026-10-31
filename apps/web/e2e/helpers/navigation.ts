import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const APP_DIR = path.join(__dirname, '..', '..', 'src', 'app', '(app)');

/**
 * Every static (app) route with a page.tsx — dynamic segments ([symbol], [date], …) are
 * skipped since they need a real id, not something a blanket "every page" sweep can supply.
 */
export function listAppRoutes(): string[] {
  const routes: string[] = [];
  function walk(dir: string, urlPath: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name === 'page.tsx') {
        routes.push(urlPath || '/');
      } else if (entry.isDirectory() && !entry.name.startsWith('[') && !entry.name.startsWith('_')) {
        walk(path.join(dir, entry.name), `${urlPath}/${entry.name}`);
      }
    }
  }
  walk(APP_DIR, '');
  return routes;
}

/** Visits every static (app) route and asserts it actually rendered (no 404/500 page, no redirect back to /login). */
export async function visitEveryPage(page: Page) {
  for (const route of listAppRoutes()) {
    const res = await page.goto(route);
    expect(res?.status(), `${route} returned ${res?.status()}`).toBeLessThan(400);
    await expect(page, `${route} redirected to /login — session not authenticated`).not.toHaveURL(/\/login/);
  }
}
