import { cleanupTestData } from './cleanup';

/** Playwright globalTeardown: leaves the test project clean after the suite finishes, win or lose. */
export default async function globalTeardown() {
  await cleanupTestData();
}
