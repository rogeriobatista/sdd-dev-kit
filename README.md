# SDD Dev Kit

**Protocol Kit** for Spec-Driven Development: portable core + Cursor adapter (MVP) + TypeScript adapter with **Cucumber** and **Playwright** already plugged.

You write natural-language specs (`prosa` + `Dado`/`Quando`/`Então`). The agent normalizes, generates executable tests, plans, implements, and verifies until green.

## Quickstart

### 1. Install

```bash
npm install
npx playwright install chromium
```

### 2. Use in Cursor

1. Install the skill/rules from `packages/adapter-cursor` (copy `skills/sdd` and `rules/sdd-human-edits.mdc` into your Cursor project/user config).
2. In a target app: **`/sdd init`**
3. Edit only `specs/*.md` — or bootstrap from a ticket with **`/sdd from-ticket <id>`**
4. Run **`/sdd run`**

### 3. Try the example

```bash
npm test                                          # core unit tests (includes ticketing fixtures)
npm run smoke -w coupon-checkout                  # cucumber + playwright smoke
npm run sdd:verify:all -w coupon-checkout         # full example suite (starts UI for Playwright)
```

Human flow for `examples/coupon-checkout`:

1. Edit `examples/coupon-checkout/specs/checkout-cupom.md` (or seed from a ticket — see below)
2. `/sdd run`
3. Inspect green Cucumber + Playwright — without touching generated features/steps by hand

## Ticketing (Linear + Jira)

`/sdd from-ticket <id>` pulls title, description, acceptance criteria, and labels into a draft `specs/*.md` plus `.sdd/ticket.json` provenance, then stops for human review (or continues with `--run`).

### Environment variables (never commit secrets)

| Provider | Env vars |
|----------|----------|
| Linear | `LINEAR_API_KEY` |
| Jira | `JIRA_BASE_URL` (e.g. `https://your-domain.atlassian.net`), `JIRA_API_TOKEN`, `JIRA_EMAIL` (Cloud basic auth; omit email to send the token as Bearer) |

Configure **names** (not values) under optional `ticketing:` in `sdd.yaml` — see `packages/adapter-cursor/templates/sdd.yaml`.

### Example commands

```text
/sdd from-ticket ENG-42
/sdd from-ticket linear:ENG-42
/sdd from-ticket jira:SHOP-7
/sdd from-ticket SHOP-7 --run
```

Ambiguous ids like `ENG-42` need `ticketing.defaultProvider: linear|jira` or a `linear:` / `jira:` prefix.

Offline fixtures (no live API): `packages/core/src/ticketing/fixtures/` — fictional coupon-checkout ticket used by unit tests.

Design addendum: [docs/superpowers/specs/2026-11-24-sdd-ticketing-design.md](docs/superpowers/specs/2026-11-24-sdd-ticketing-design.md)

## Repository layout

```text
packages/core/            # sdd.yaml schema, phases, ticketing providers, paths
packages/adapter-ts/      # Cucumber + Playwright scaffold / materialize / runners
packages/adapter-cursor/  # /sdd skill, rules, templates
examples/coupon-checkout/ # end-to-end reference app
docs/superpowers/         # design + implementation plan
```

## Contract highlights

| Item | MVP behavior |
|------|----------------|
| Human edits | `specs/` (+ `.sdd/premises.md`) |
| Ticket bootstrap | `/sdd from-ticket` → draft specs (Linear **and** Jira) |
| Trigger | Explicit `/sdd run` (`triggers.watch` default `false`) |
| Tags | `@api` → Cucumber; `@ui`/`@e2e` → Playwright |
| Loop cap | 3 diagnose→implement iterations |
| Spec language | Portuguese GWT |

Design: [docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md](docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md)

## Roadmap (out of MVP)

- Standalone CLI (`sdd init` / `sdd run` / `sdd from-ticket`) outside Cursor
- File watch on `specs/**` (`triggers.watch: true`)
- Adapters for Python / Java
- Vitest track for unit tests derived from the same canonical scenarios
- Cloud / CI agent runner
- Write-back of status to Linear/Jira

## License

MIT
