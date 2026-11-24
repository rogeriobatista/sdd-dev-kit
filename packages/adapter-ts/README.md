# @sdd-dev-kit/adapter-ts

Stack adapter for **TypeScript** — Cucumber (`@api`) + Playwright (`@ui` / `@e2e`).

## Role

| Phase | Behavior |
|-------|----------|
| Init / scaffold | Folders, Cucumber + Playwright configs, `sdd.yaml` with `adapter: typescript` |
| Executable | Canonical NL → features/steps and e2e specs by tag |
| Verify | `runners.cucumber` / `runners.playwright` / `runners.all` |

## Evidence for `/sdd demo`

| Artifact | Typical path |
|----------|----------------|
| Cucumber JSON | `reports/cucumber.json` |
| Playwright HTML | `playwright-report/index.html` |
| Playwright JSON | `reports/playwright.json` |
| Screenshots / videos / traces | `test-results/**` |

Cucumber:

```js
format: ["progress", "json:reports/cucumber.json"]
```

Playwright:

```ts
reporter: [
  ["list"],
  ["html", { open: "never", outputFolder: "playwright-report" }],
  ["json", { outputFile: "reports/playwright.json" }],
],
use: {
  screenshot: "only-on-failure",
  video: "retain-on-failure",
  trace: "on-first-retry",
},
```

See `examples/coupon-checkout` for a working setup. After verify: `/sdd demo` → `.sdd/demo/<runId>/`.
