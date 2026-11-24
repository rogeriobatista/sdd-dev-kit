# SDD Dev Kit

**Protocol Kit** for Spec-Driven Development: portable core + **multi-host AI adapters** + **first-class stack adapters**.

**Supported AI hosts:** Cursor | Claude (VS Code / Claude Code) | GitHub Copilot (VS Code)

**Supported stacks:** TypeScript (Cucumber + Playwright) | Python (pytest) | React + Vite (Playwright) | Node GraphQL | Terraform

You write natural-language specs (`prosa` + `Dado`/`Quando`/`Então`). The agent normalizes, generates executable tests, plans, implements, and verifies until green.

## Quickstart

### 1. Install

```bash
npm run setup
```

Playwright needs browser binaries for `@ui` / `@e2e`; `setup` installs deps + Chromium. Stack-only smokes (pytest / vitest / terraform) do not require browsers.

### 2. Enable a host adapter

Pick the harness you use. Instruction packs live under `packages/`; shared pipeline text is in `packages/adapter-shared` (do not fork three copies).

#### Cursor

1. Copy `packages/adapter-cursor/skills/sdd` → project `.cursor/skills/sdd/` (or user skills).
2. Copy `packages/adapter-cursor/rules/sdd-human-edits.mdc` → `.cursor/rules/`.
3. In the target app: **`/sdd init`** (choose stack when prompted)
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

### 3. Init by stack

Set `adapter:` in `sdd.yaml` (alias `ts` → `typescript`). Optional: `adapters: { stack: python, hosts: [cursor] }`.

| Stack | `adapter` | Package | Init tip | Verify |
|-------|-----------|---------|----------|--------|
| TypeScript | `typescript` / `ts` | `@sdd-dev-kit/adapter-ts` | Cucumber + Playwright scaffold | `npm run sdd:verify:all` |
| Python | `python` | `@sdd-dev-kit/adapter-python` | `pyproject.toml` + pytest | `pytest -q` |
| React + Vite | `react-vite` | `@sdd-dev-kit/adapter-react-vite` | Vite app + Playwright | `npm run sdd:verify:playwright` |
| Node GraphQL | `node-graphql` | `@sdd-dev-kit/adapter-node-graphql` | Yoga-style schema + Vitest/Cucumber | `npm run sdd:verify:all` |
| Terraform | `terraform` | `@sdd-dev-kit/adapter-terraform` | Module + `.tftest.hcl` | `terraform fmt/validate/test` (no apply) |

### 4. Try the examples

```bash
npm test                                          # core + adapter template section tests
npm run smoke -w coupon-checkout                  # cucumber + playwright smoke
npm run smoke -w python-pytest-hello              # pytest (after npm run setup -w …)
npm run smoke -w node-graphql-api                 # vitest GraphQL
npm run smoke -w terraform-module                 # needs Terraform CLI
npm run smoke -w react-vite-playwright            # Playwright + Vite (after setup)
```

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

Design: [multi-host adapters](docs/superpowers/specs/2026-11-24-sdd-multi-host-adapters-design.md) · [ticketing](docs/superpowers/specs/2026-11-24-sdd-ticketing-design.md) · [stack adapters](docs/superpowers/specs/2026-11-24-sdd-stack-adapters-design.md)

## Repository layout

```text
packages/core/                 # sdd.yaml schema, phases, ticketing, shared tags/shell
packages/adapter-shared/       # DRY pipeline markdown + scaffold templates + render
packages/adapter-ts/           # TypeScript — Cucumber + Playwright
packages/adapter-python/       # Python — pytest
packages/adapter-react-vite/   # React + Vite — Playwright
packages/adapter-node-graphql/ # Node TS GraphQL — Cucumber/Vitest
packages/adapter-terraform/    # Terraform — fmt/validate/test
packages/adapter-cursor/       # /sdd skill, rules, templates (Cursor)
packages/adapter-claude/       # CLAUDE.md + .claude/skills (Claude)
packages/adapter-vscode-copilot/ # .github/copilot-instructions + prompts (Copilot)
examples/coupon-checkout/      # TS reference app
examples/python-pytest-hello/  # Python + pytest
examples/react-vite-playwright/
examples/node-graphql-api/
examples/terraform-module/     # null provider, no cloud
docs/superpowers/              # design + implementation plan
```

After changing shared instructions:

```bash
npm run sync:adapters
```

## Contract highlights

| Item | Behavior |
|------|----------|
| Human edits | `specs/` (+ `.sdd/premises.md`) |
| Ticket bootstrap | `from-ticket` → draft specs (Linear **and** Jira) |
| Trigger | Explicit run (`triggers.watch` default `false`) |
| Tags | `@api` → API track; `@ui`/`@e2e` → Playwright when supported |
| Loop cap | 3 diagnose→implement iterations |
| Spec language | Portuguese GWT |
| Stacks | First-class adapters (not roadmap) |

Design: [docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md](docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md)

## Roadmap (out of MVP)

- Standalone CLI (`sdd init` / `sdd run` / `sdd from-ticket`) outside AI hosts
- File watch on `specs/**` (`triggers.watch: true`)
- Additional language adapters (e.g. Java) beyond the first-class set above
- Cloud / CI agent runner
- Write-back of status to Linear/Jira
- Deeper Copilot MCP parity if/when the host exposes it

## License

MIT
