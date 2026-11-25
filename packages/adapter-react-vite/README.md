# @rogeriobatista/adapter-react-vite

Stack adapter for **React + Vite + Playwright**.

Reuses Playwright tag routing and materialize patterns from `@rogeriobatista/adapter-ts`.

## Role

| Phase | Behavior |
|-------|----------|
| Init / scaffold | Vite React app hooks, Playwright config, `sdd.yaml` with `adapter: react-vite` |
| Executable | `@ui`/`@e2e` → `tests/e2e/*.spec.ts`; `@api` → optional Vitest unit stubs under `tests/unit` |
| Verify | `playwright test` (+ optional `vitest`) via `runners.all` |

## Verify

```yaml
adapter: react-vite
runners:
  playwright: npm run sdd:verify:playwright
  all: npm run sdd:verify:all
```

```bash
npm run setup
npm run sdd:verify:all
```

## Evidence for `/sdd demo`

Configure Playwright so verify leaves artifacts the demo builder can collect:

| Artifact | Typical path |
|----------|----------------|
| HTML report | `playwright-report/index.html` |
| JSON results | `reports/playwright.json` |
| Screenshots / videos / traces | `test-results/**` |

Example `playwright.config.ts` reporters:

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

Then: `/sdd demo` → `.sdd/demo/<runId>/`.
