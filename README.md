# SDD Dev Kit

**Protocol Kit** for Spec-Driven Development: portable core + **multi-host AI adapters** + **first-class stack adapters**.

**Supported AI hosts:** Cursor | Claude (VS Code / Claude Code) | GitHub Copilot (VS Code)

**Supported stacks:** TypeScript (Cucumber + Playwright) | Python (pytest) | React + Vite (Playwright) | Node GraphQL | Terraform

You write natural-language specs (`prosa` + `Dado`/`Quando`/`Então`). The agent normalizes, generates executable tests, plans, implements, and verifies until green.

## Distribution (Mac / PC / Cloud Agents)

Packages publish to **GitHub Packages** under [`rogeriobatista/sdd-dev-kit`](https://github.com/rogeriobatista/sdd-dev-kit) with scope `@sdd-dev-kit`.

| Package | Role |
|---------|------|
| `@sdd-dev-kit/cli` | Bin `sdd` — init / run / verify / demo / status / from-ticket |
| `@sdd-dev-kit/core` | Schema, stack detect, ticketing, demo, shell |
| `@sdd-dev-kit/adapter-*` | Host (cursor/claude/copilot) + stack (ts/python/…) packs |

### Install locally

```bash
# ~/.npmrc — see .npmrc.example (token via env, never commit)
@sdd-dev-kit:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}

npm i -g @sdd-dev-kit/cli
sdd init --host cursor --stack typescript

# or
npx @sdd-dev-kit/cli init --host all --stack python
```

### Cursor Cloud Agents

```bash
npm i -g @sdd-dev-kit/cli   # after registry auth
# or: npx @sdd-dev-kit/cli init --host cursor
```

Optional secrets for ticket bootstrap: `LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`. Full notes: [docs/cloud-agents.md](docs/cloud-agents.md).

CLI `sdd run` prints status + pipeline guidance; LLM phases stay host-driven (`/sdd run`). Use `sdd verify` / `sdd demo` for local evidence.

### Develop from this repo

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

Stack is identified from **specification docs** (not yaml alone). Order: `.sdd/premises.md` → `specs/**/*.md` (frontmatter / `@stack:<id>`) → optional `.sdd/stack.json` → `sdd.yaml` fallback (warn). Core API: `detectStack(projectRoot)`. If missing/ambiguous, declare stack under `## Stack` in premises — do not invent.

Set `adapter:` in `sdd.yaml` after detection (alias `ts` → `typescript`). Optional: `adapters: { stack: python, hosts: [cursor] }`.

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
| Demo (PO/BO/QA) | `/sdd demo` | `SDD: demo` | `SDD: demo` / `/sdd-demo` |
| Status | `/sdd status` | `SDD: status` | `SDD: status` / `/sdd-status` |

## Demo from test evidence (PO / BO / QA)

After verify (green or red), build a stakeholder pack from run evidence + business wording in specs:

```text
/sdd demo
/sdd demo <runId>
```

Or in code:

```js
import { buildDemo } from "@sdd-dev-kit/core";
const pack = buildDemo({ projectRoot: process.cwd() });
// → .sdd/demo/<runId>/{index.html, SUMMARY.md, manifest.json, evidence/}
```

| Output | Use |
|--------|-----|
| `.sdd/demo/<runId>/index.html` | Open in a browser (offline, relative assets) |
| `.sdd/demo/<runId>/SUMMARY.md` | Paste into Slack/email |
| `.sdd/demo/<runId>/manifest.json` | Machine-readable evidence list |

Portuguese copy by default; no secrets; no code dumps. See [demo design](docs/superpowers/specs/2026-11-24-sdd-demo-from-evidence-design.md).

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

Design: [multi-host adapters](docs/superpowers/specs/2026-11-24-sdd-multi-host-adapters-design.md) · [ticketing](docs/superpowers/specs/2026-11-24-sdd-ticketing-design.md) · [stack adapters](docs/superpowers/specs/2026-11-24-sdd-stack-adapters-design.md) · [stack from specs](docs/superpowers/specs/2026-11-24-sdd-stack-from-specs-design.md) · [demo from evidence](docs/superpowers/specs/2026-11-24-sdd-demo-from-evidence-design.md)

## Repository layout

```text
packages/cli/                  # @sdd-dev-kit/cli — bin `sdd`
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
docs/cloud-agents.md           # Cloud Agent install + secrets
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
| Demo pack | `demo` → `.sdd/demo/<runId>/` for PO/BO/QA from verify evidence |
| Trigger | Explicit run (`triggers.watch` default `false`) |
| Tags | `@api` → API track; `@ui`/`@e2e` → Playwright when supported |
| Loop cap | 3 diagnose→implement iterations |
| Spec language | Portuguese GWT |
| Stacks | First-class adapters; detected from premises/specs (`detectStack`) |

Design: [docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md](docs/superpowers/specs/2026-11-24-sdd-dev-kit-design.md)

## Publish

CI: `.github/workflows/ci.yml` (PR/push). Release: tag `v*` or **Publish packages** workflow (`.github/workflows/publish.yml`) with `NODE_AUTH_TOKEN` / `GITHUB_TOKEN` (`packages:write`). See `.npmrc.example`.

## Roadmap (out of MVP)

- File watch on `specs/**` (`triggers.watch: true`)
- Additional language adapters (e.g. Java) beyond the first-class set above
- Write-back of status to Linear/Jira
- Deeper Copilot MCP parity if/when the host exposes it

## License

MIT
