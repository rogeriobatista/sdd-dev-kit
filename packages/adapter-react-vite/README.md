# @sdd-dev-kit/adapter-react-vite

Stack adapter for **React + Vite + Playwright**.

Reuses Playwright tag routing and materialize patterns from `@sdd-dev-kit/adapter-ts`.

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
