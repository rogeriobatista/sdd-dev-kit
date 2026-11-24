# Adapter TS scaffold

This project was scaffolded by `@sdd-dev-kit/adapter-ts`.

- Install: `npm run setup` (deps + Playwright Chromium for `@ui`/`@e2e`; `npm install` alone is enough for Cucumber/`@api` only)
- Edit only `specs/` (+ `.sdd/premises.md` when needed)
- Generated: `tests/features`, `tests/steps`, `tests/e2e`, `.sdd/canonical`, `.sdd/plan`
- Verify: `npm run sdd:verify:cucumber` | `sdd:verify:playwright` | `sdd:verify:all`
- Demo (PO/BO/QA): `/sdd demo` → `.sdd/demo/<runId>/` (needs reporters → `reports/`, `playwright-report/`)
