import { defineConfig, configDefaults } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // e2e/personas/*.spec.ts are Playwright tests (import test/expect from @playwright/test,
    // run via `playwright test`) — without this, Vitest's own *.spec.ts matching picks them up
    // too and fails them with its own incompatible test/expect globals.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
