# Example: coupon-checkout

Minimal TypeScript app that validates the SDD Protocol Kit loop.

## What you edit

**Only** `specs/checkout-cupom.md` (and `.sdd/premises.md` if you change project rules).

Do not hand-edit `tests/features`, `tests/steps`, `tests/e2e`, or `.sdd/canonical` / `.sdd/plan` — those are regenerable.

## How to run (Cursor)

1. Open this folder (or the monorepo) in Cursor with the `/sdd` skill installed from `packages/adapter-cursor`.
2. Adjust scenarios in `specs/` — or bootstrap from a ticket (see below).
3. Run **`/sdd run`**.
4. The agent normalizes → generates Cucumber/Playwright → plans → implements → verifies.

For a fresh project elsewhere: **`/sdd init`**, then write specs, then **`/sdd run`**.

## Seeding from a ticket (optional)

In a greenfield app you can draft `specs/` from Linear/Jira:

```text
/sdd from-ticket linear:ENG-42
# review specs/, then:
/sdd run
```

This example already has hand-written `specs/checkout-cupom.md`. Offline fixtures that mirror the same “Checkout — aplicar cupom” story live at:

- `packages/core/src/ticketing/fixtures/linear-issue.json`
- `packages/core/src/ticketing/fixtures/jira-issue.json`

Use those for provider unit tests without live APIs. Set `LINEAR_API_KEY` or `JIRA_*` env vars only when calling a real `/sdd from-ticket`.

## Manual verify (without the agent)

```bash
# from repo root
npm run setup
npm run sdd:verify:cucumber -w coupon-checkout
npm run sdd:verify:playwright -w coupon-checkout
```

Playwright needs browser binaries for `@ui` / `@e2e`; `setup` installs deps + Chromium. If you only run Cucumber / `@api`, `npm install` is enough.

Smoke (Cucumber + Playwright smoke fixture, no long-lived UI server for smoke):

```bash
npm run smoke -w coupon-checkout
```

## Specs language

Portuguese GWT: `Dado` / `Quando` / `Então` / `E`. Tags: `@api` → Cucumber, `@ui` → Playwright.
