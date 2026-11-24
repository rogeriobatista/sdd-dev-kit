import { defineConfig } from "@playwright/test";

/** Smoke config: no webServer — serves a data-URL style check via route, or uses static fixture. */
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "smoke.spec.ts",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
});
