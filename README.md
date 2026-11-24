# SDD Dev Kit

**Protocol Kit** for Spec-Driven Development: portable core + **multi-host AI adapters** + TypeScript adapter with **Cucumber** and **Playwright** already plugged.

**Supported AI hosts:** Cursor | Claude (VS Code / Claude Code) | GitHub Copilot (VS Code)

You write natural-language specs (`prosa` + `Dado`/`Quando`/`Então`). The agent normalizes, generates executable tests, plans, implements, and verifies until green.

## Quickstart

### 1. Install

```bash
npm install
npx playwright install chromium
```

### 2. Enable a host adapter

Pick the harness you use. Instruction packs live under `packages/`; shared pipeline text is in `packages/adapter-shared` (do not fork three copies).

#### Cursor

1. Copy `packages/adapter-cursor/skills/sdd` → project `.cursor/skills/sdd/` (or user skills).
2. Copy `packages/adapter-cursor/rules/sdd-human-edits.mdc` → `.cursor/rules/`.
3. In the target app: **`/sdd init`**
4. Edit only `specs/*.md` — or **`/sdd from-ticket <id>`** — then **`/sdd run`**

#### Claude (VS Code / Claude Code)

1. Copy `packages/adapter-claude/project/CLAUDE.md` → repo root `CLAUDE.md`.
2. Copy `packages/adapter-claude/project/.claude/skills/sdd/` → `.claude/skills/sdd/`.
3. In chat: **`SDD: init`**, then edit `specs/` or **`SDD: from-ticket <id>`**, then **`SDD: run`**

#### GitHub Copilot (VS Code)

1. Copy `packages/adapter-vscode-copilot/project/.github/copilot-instructions.md` → `.github/copilot-instructions.md`.
2. Copy `packages/adapter-vscode-copilot/project/.github/prompts/` → `.github/prompts/`.
3. In Copilot Chat: **`SDD: init`** (or `/sdd-init`), then **`SDD: run`** / `/sdd-run`, etc.

> **Copilot ticketing gap:** Cursor/Claude can use Linear/Jira **MCP** when configured. Copilot often cannot — use `@sdd-dev-kit/core` REST/GraphQL providers with env vars (`LINEAR_API_KEY`, `JIRA_*`). Never paste secrets into chat.

### 3. Try the example

```bash
npm test                                          # core + adapter template section tests
npm run smoke -w coupon-checkout                  # cucumber + playwright smoke
npm run sdd:verify:all -w coupon-checkout         # full example suite (starts UI for Playwright)
```

Human flow for `examples/coupon-checkout`:

1. Edit `examples/coupon-checkout/specs/checkout-cupom.md` (or seed from a ticket — see below)
2. `/sdd run` (Cursor) or `SDD: run` (Claude / Copilot)
3. Inspect green Cucumber + Playwright — without touching generated features/steps by hand

## Command map (all hosts)

| Intent | Cursor | Claude | Copilot |
|--------|--------|--------|---------|
| Init | `/sdd init` | `SDD: init` | `SDD: init` / `/sdd-init` |
| From ticket | `/sdd from-ticket <id>` | `SDD: from-ticket <id>` | `SDD: from-ticket <id>` / `/sdd-from-ticket` |
| Run | `/sdd run` | `SDD: run` | `SDD: run` / `/sdd-run` |
| Verify | `/sdd verify` | `SDD: verify` | `SDD: verify` / `/sdd-verify` |
| Status | `/sdd status` | `SDD: status` | `SDD: status` / `/sdd-status` |

## Ticketing (Linear + Jira)

`from-ticket` pulls title, description, acceptance criteria, and labels into a draft `specs/*.md` plus `.sdd/ticket.json` provenance, then stops for human review (or continues with `--run`).

### Environment variables (never commit secrets)

| Provider | Env vars |
|----------|----------|
| Linear | `LINEAR_API_KEY` |
| Jira | `JIRA_BASE_URL` (e.g. `https://your-domain.atlassian.net`), `JIRA_API_TOKEN`, `JIRA_EMAIL` (Cloud basic auth; omit email to send the token as Bearer) |

Configure **names** (not values) under optional `ticketing:` in `sdd.yaml` — see `packages/adapter-shared/templates/sdd.yaml`.

### Example commands

```text
/sdd from-ticket ENG-42
SDD: from-ticket linear:ENG-42
SDD: from-ticket jira:SHOP-7 --run
```

Ambiguous ids like `ENG-42` need `ticketing.defaultProvider: linear|jira` or a `linear:` / `jira:` prefix.

Offline fixtures (no live API): `packages/core/src/ticketing/fixtures/` — fictional coupon-checkout ticket used by unit tests.

Design: [multi-host adapters](docs/superpowers/specs/2026-11-24-sdd-multi-host-adapters-design.md) · [ticketing](docs/superpowers/specs/2026-11-24-sdd-ticketing-design.md)

## Repository layout

```text
packages/core/                 # sdd.yaml schema, phases, ticketing providers, paths
packages/adapter-shared/       # DRY pipeline markdown + scaffold templates + render
packages/adapter-ts/           # Cucumber + Playwright scaffold / materialize / runners
packages/adapter-cursor/       # /sdd skill, rules, templates (Cursor)
packages/adapter-claude/       # CLAUDE.md + .claude/skills (Claude)
packages/adapter-vscode-copilot/ # .github/copilot-instructions + prompts (Copilot)
examples/coupon-checkout/      # end-to-end reference app
docs/superpowers/              # design + implementation plan
```

After changing shared instructions:

```bash
npm run sync:adapters
```

## Contract highlights

| Item | MVP behavior |
|------|----------------|
| Human edits | `specs/` (+ `.sdd/premises.md`) |
| Ticket bootstrap | `from-ticket` → draft specs (Linear **and** Jira) |
| Trigger | Explicit run (`triggers.watch` default `false`) |
| Tags | `@api` → Cucumber; `@ui`/`@e2e` → Playwright |
| Loop cap | 3 diagnose→implement iterations |
| Spec language | Portuguese GWT |

Design: [docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md](docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md)

## Roadmap (out of MVP)

- Standalone CLI (`sdd init` / `sdd run` / `sdd from-ticket`) outside AI hosts
- File watch on `specs/**` (`triggers.watch: true`)
- Adapters for Python / Java
- Vitest track for unit tests derived from the same canonical scenarios
- Cloud / CI agent runner
- Write-back of status to Linear/Jira
- Deeper Copilot MCP parity if/when the host exposes it

## License

MIT
