import { defineConfig } from "@playwright/test";

/** Smoke without starting Vite — asserts fixture file exists / skips browser. */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "smoke.spec.ts",
  use: {
    baseURL: "http://127.0.0.1:5173",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
