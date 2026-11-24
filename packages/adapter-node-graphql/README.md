# @sdd-dev-kit/adapter-node-graphql

Stack adapter for **Node + TypeScript + GraphQL** (Yoga/Apollo-style minimal scaffold).

API scenarios map to **Cucumber** and/or **Vitest**. Playwright is optional and not required for GraphQL playground.

## Role

| Phase | Behavior |
|-------|----------|
| Init | GraphQL schema + server stub, Cucumber + Vitest configs, `adapter: node-graphql` |
| Executable | `@api` → features/steps + Vitest stubs; `@ui`/`@e2e` skipped unless premises enable Playwright |
| Verify | `cucumber` and/or `vitest` via `runners.all` |

## Verify

```yaml
adapter: node-graphql
runners:
  cucumber: npm run sdd:verify:cucumber
  vitest: npm run sdd:verify:vitest
  all: npm run sdd:verify:all
```

## Evidence for `/sdd demo`

| Artifact | Typical path |
|----------|----------------|
| Cucumber JSON | `reports/cucumber.json` (`format: ["progress", "json:reports/cucumber.json"]`) |
| Vitest JSON | `reports/vitest.json` (Vitest JSON reporter) |

Then: `/sdd demo` → `.sdd/demo/<runId>/`.
