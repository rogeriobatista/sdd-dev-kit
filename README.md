# SDD Dev Kit

**Protocol Kit** for Spec-Driven Development: portable core + **multi-host AI adapters** + **first-class stack adapters**.

**Supported AI hosts:** Cursor | Claude (VS Code / Claude Code) | GitHub Copilot (VS Code)

**Supported stacks:** TypeScript (Cucumber + Playwright) | Python (pytest) | React + Vite (Playwright) | Node GraphQL | Terraform

You iterate on natural-language specs (`prosa` + `Dado`/`Quando`/`Então`) — **step 1, the only human gate**. After specs are accepted, `/sdd run` automates **steps 2–10** (Spec Tests → Dev Spec → Implementation Plan → Design & Approach → unit → integration → e2e → implement/verify loop → evidence) until all test levels pass. **Step 11** is continuous market best practices (not a separate stop).

## Comece aqui

Guia técnico em português (passo a passo, exemplos de specs e outputs): **[docs/guia-de-uso.md](docs/guia-de-uso.md)**

Fixtures de exemplo: [`docs/exemplos/`](docs/exemplos/) · app de referência: [`examples/coupon-checkout`](examples/coupon-checkout/)

## Distribution (Mac / PC / Cloud Agents)

Packages publish to **GitHub Packages** under [`rogeriobatista/sdd-dev-kit`](https://github.com/rogeriobatista/sdd-dev-kit) with scope `@rogeriobatista`.

| Package | Role |
|---------|------|
| `@rogeriobatista/cli` | Bin `sdd` — init / run / verify / demo / docs / status / from-ticket / bug-report / reproduce / debug / qa / fix |
| `@rogeriobatista/core` | Schema, stack detect, ticketing, demo, docs, shell |
| `@rogeriobatista/adapter-*` | Host (cursor/claude/copilot) + stack (ts/python/…) packs |

### Install locally (GitHub Packages)

To **download** any `@rogeriobatista/*` package you **must** configure both lines below (user `~/.npmrc` or project `.npmrc` — see `.npmrc.example`). Never commit a real token.

```ini
@rogeriobatista:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

| Line | Why it is required |
|------|--------------------|
| `@rogeriobatista:registry=…` | Tells npm to resolve the `@rogeriobatista` scope on GitHub Packages (not registry.npmjs.org) |
| `//npm.pkg.github.com/:_authToken=…` | Auth for **private** packages — PAT / `GITHUB_TOKEN` with at least `read:packages` |

Without this, `npm i` / `npx` fails with **404** (wrong registry / scope not found) or **401** (missing/invalid token). Export `GITHUB_TOKEN` (or `NODE_AUTH_TOKEN`) in the environment; do not paste the value into the file.

```bash
npm i -g @rogeriobatista/cli
sdd init --host cursor --stack typescript

# or
npx @rogeriobatista/cli init --host all --stack python
```

**Alternative (no Packages):** clone this repo and use the local workspace — `npm run setup`, then `npx sdd …` after building the CLI (see Quickstart). No GitHub Packages auth needed.

### Cursor Cloud Agents

```bash
# after the .npmrc registry + token lines above
npm i -g @rogeriobatista/cli
# or: npx @rogeriobatista/cli init --host cursor
```

Optional secrets for ticket bootstrap: `LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_API_TOKEN`, `JIRA_EMAIL`. Full notes: [docs/cloud-agents.md](docs/cloud-agents.md).

CLI `sdd run` prints status + canonical steps 1–10 guidance (human gate = `specs/`); LLM phases stay host-driven (`/sdd run`). Use `sdd verify` / `sdd demo` for local evidence.

## Quickstart

### 1. Install (from this clone — no Packages)

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
4. Iterate on `specs/*.md` (or **`/sdd from-ticket <id>`** then review) — then **`/sdd run`** for steps 2–10

#### Claude (VS Code / Claude Code)

1. Copy `packages/adapter-claude/project/CLAUDE.md` → repo root `CLAUDE.md`.
2. Copy `packages/adapter-claude/project/.claude/skills/sdd/` → `.claude/skills/sdd/`.
3. In chat: **`SDD: init`**, then edit `specs/` or **`SDD: from-ticket <id>`**, then **`SDD: run`**

#### GitHub Copilot (VS Code)

1. Copy `packages/adapter-vscode-copilot/project/.github/copilot-instructions.md` → `.github/copilot-instructions.md`.
2. Copy `packages/adapter-vscode-copilot/project/.github/prompts/` → `.github/prompts/`.
3. In Copilot Chat: **`SDD: init`** (or `/sdd-init`), then **`SDD: run`** / `/sdd-run`, etc.

> **Copilot ticketing gap:** Cursor/Claude can use Linear/Jira **MCP** when configured. Copilot often cannot — use `@rogeriobatista/core` REST/GraphQL providers with env vars (`LINEAR_API_KEY`, `JIRA_*`). Never paste secrets into chat.

### 3. Init by stack

Stack is identified from **specification docs** (not yaml alone). Order: `.sdd/premises.md` → `specs/**/*.md` (frontmatter / `@stack:<id>`) → optional `.sdd/stack.json` → `sdd.yaml` fallback (warn). Core API: `detectStack(projectRoot)`. If missing/ambiguous, declare stack under `## Stack` in premises — do not invent.

Set `adapter:` in `sdd.yaml` after detection (alias `ts` → `typescript`). Optional: `adapters: { stack: python, hosts: [cursor] }`.

| Stack | `adapter` | Package | Init tip | Verify |
|-------|-----------|---------|----------|--------|
| TypeScript | `typescript` / `ts` | `@rogeriobatista/adapter-ts` | Cucumber + Playwright scaffold | `npm run sdd:verify:all` |
| Python | `python` | `@rogeriobatista/adapter-python` | `pyproject.toml` + pytest | `pytest -q` |
| React + Vite | `react-vite` | `@rogeriobatista/adapter-react-vite` | Vite app + Playwright | `npm run sdd:verify:playwright` |
| Node GraphQL | `node-graphql` | `@rogeriobatista/adapter-node-graphql` | Yoga-style schema + Vitest/Cucumber | `npm run sdd:verify:all` |
| Terraform | `terraform` | `@rogeriobatista/adapter-terraform` | Module + `.tftest.hcl` | `terraform fmt/validate/test` (no apply) |

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
| Research | `/sdd research` | `SDD: research` | `SDD: research` / `/sdd-research` |
| Verify | `/sdd verify` | `SDD: verify` | `SDD: verify` / `/sdd-verify` |
| Demo (PO/BO/QA) | `/sdd demo` | `SDD: demo` | `SDD: demo` / `/sdd-demo` |
| Docs | `/sdd docs` | `SDD: docs` | `SDD: docs` / `/sdd-docs` |
| Status | `/sdd status` | `SDD: status` | `SDD: status` / `/sdd-status` |
| Bug report | `/sdd bug report` | `SDD: bug report` | `SDD: bug report` / `/sdd-bug-report` |
| Reproduce | `/sdd reproduce` | `SDD: reproduce` | `SDD: reproduce` / `/sdd-reproduce` |
| Debug | `/sdd debug` | `SDD: debug` | `SDD: debug` / `/sdd-debug` |
| QA | `/sdd qa` | `SDD: qa` | `SDD: qa` / `/sdd-qa` |
| Fix | `/sdd fix` | `SDD: fix` | `SDD: fix` / `/sdd-fix` |

## Canonical 11-step flow

| Step | Actor | Action | Artifact |
|------|-------|--------|----------|
| 1 | Human | NL + BDD | `specs/` |
| 2 | Kit | Executable Spec Tests | `tests/spec/` or `tests/features/` |
| 3 | Kit | Dev Spec | `.sdd/dev-spec.md` |
| 4 | Kit | Dev Implementation Plan | `.sdd/implementation-plan.md` |
| 5 | Kit | Design & Approach | `.sdd/design-approach.md` |
| 6 | Kit | Unit tests | `tests/unit/` |
| 7 | Kit | Integration tests | `tests/integration/` |
| 8 | Kit | E2E tests | `tests/e2e/` |
| 9 | Kit | Implement until all levels green | `src/` + `.sdd/runs/` |
| 10 | Kit | Evidence | `.sdd/evidence/<key>/latest/` |
| 11 | Kit | Continuous best practices | `.sdd/research/<key>/` |

Step 1 only is human-iterative; steps 2–10 run in `/sdd run`; step 11 applies during 2–10. Design: [canonical 11-step flow](docs/superpowers/specs/2026-11-25-sdd-canonical-11-step-flow-design.md).

## Debug, QA e bugfix

Ferramentas para erros reportados pelo cliente (fluxo paralelo ao pipeline 1–11):

```text
bug report → reproduce (teste vermelho) → debug → fix → qa (+ evidence latest)
```

| Artefato | Papel |
|----------|-------|
| `.sdd/bugs/<id>/REPORT.md` | Relatório PT (humano refina como specs) |
| `.sdd/bugs/<id>/DEBUG.md` | Diagnóstico guiado |
| `.sdd/bugs/<id>/QA.md` | Checklist / sign-off QA |
| `.sdd/bugs/<id>/meta.json` | `bugId`, `evidenceKey`, `regressionTest`, status |

**Bug id:** preferir `linear:ENG-42` / `jira:SHOP-7` (alinha evidence); senão `bug_<uuid>`.

**Hard rule:** nunca `fix` sem regressão falhando de `reproduce` (TDD para bugs). Após o fix, atualizar `.sdd/evidence/<key>/latest/demo/`.

CLI: `sdd bug-report [id]`, `sdd reproduce <id>`, `sdd debug <id>`, `sdd qa <id>`, `sdd fix <id>`.

Design: [debug / QA / bugfix](docs/superpowers/specs/2026-11-25-sdd-debug-qa-bugfix-design.md).

## Best-practices research (step 11 — continuous)

During steps 2–10 (especially Dev Spec / Implementation Plan / Design Approach / implement), the agent consults a curated catalog of official / standards references (frontend, backend, infra, security) and writes an agent-owned pack:

```text
.sdd/research/<encodedEvidenceKey>/BEST_PRACTICES.md
.sdd/research/<encodedEvidenceKey>/sources.json
```

| Piece | Location |
|-------|----------|
| Catalog | `packages/adapter-shared/content/best-practices-catalog.md` (+ `.json`, `catalogVersion`) |
| Policy | Continuous during `/sdd run` (not a separate stop) |
| Standalone | `/sdd research` · `SDD: research` · Cursor skill `sdd-research` |

Rules: cite sources in Dev Spec / Implementation Plan / Design Approach; premises win on conflict (note it); links + short guidance only — no scraping full copyrighted docs; security always included. Design: [best-practices research](docs/superpowers/specs/2026-11-25-sdd-best-practices-research-design.md).

## Documentation pack (professional)

Optional after evidence (or anytime via explicit command). Generates a Portuguese-friendly pack from specs + Dev Spec + design + research + evidence — **without inventing features** absent from `specs/`.

```text
sdd docs
sdd docs changelog
sdd docs api
sdd docs handoff
/sdd docs
```

```text
docs/sdd/
  README.md  PRODUCT.md  TECHNICAL.md  CHANGELOG.md  HANDOFF.md  ADR/  API.md
```

Links to `.sdd/evidence/<key>/latest/demo/`. Design: [documentation tooling](docs/superpowers/specs/2026-11-25-sdd-documentation-tooling-design.md).

## Demo from test evidence (PO / BO / QA)

After verify (green or red), build a stakeholder pack from run evidence + business wording in specs:

```text
/sdd demo
/sdd demo <runId>
```

Or in code:

```js
import { buildDemo } from "@rogeriobatista/core";
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

`from-ticket` pulls title, description, acceptance criteria, and labels into a draft `specs/*.md` plus `.sdd/ticket.json` provenance, then **pauses for human spec iteration** (the only human gate). With `--run`, enter the auto-loop only if specs are already complete/testable.

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

Design: [multi-host adapters](docs/superpowers/specs/2026-11-24-sdd-multi-host-adapters-design.md) · [ticketing](docs/superpowers/specs/2026-11-24-sdd-ticketing-design.md) · [stack adapters](docs/superpowers/specs/2026-11-24-sdd-stack-adapters-design.md) · [stack from specs](docs/superpowers/specs/2026-11-24-sdd-stack-from-specs-design.md) · [demo from evidence](docs/superpowers/specs/2026-11-24-sdd-demo-from-evidence-design.md) · [best-practices research](docs/superpowers/specs/2026-11-25-sdd-best-practices-research-design.md) · [spec iteration + auto-loop](docs/superpowers/specs/2026-11-25-sdd-spec-iteration-auto-loop-design.md) · [canonical 11-step flow](docs/superpowers/specs/2026-11-25-sdd-canonical-11-step-flow-design.md) · [documentation tooling](docs/superpowers/specs/2026-11-25-sdd-documentation-tooling-design.md) · [debug / QA / bugfix](docs/superpowers/specs/2026-11-25-sdd-debug-qa-bugfix-design.md)

## Repository layout

```text
packages/cli/                  # @rogeriobatista/cli — bin `sdd`
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
docs/guia-de-uso.md            # Guia técnico PT (comece aqui)
docs/exemplos/                 # Fixtures referenciadas pelo guia
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
| Human iteration | **Only** step 1 `specs/` (+ `.sdd/premises.md`); clarify acceptance here |
| Ticket bootstrap | `from-ticket` → draft specs → **pause for human** (unless `--run` + complete) |
| Auto-loop (`run`) | Steps 2–10: spec-tests → dev-spec → implementation-plan → design-approach → unit → integration → e2e → implement/verify/diagnose* → evidence |
| Research | Step 11 continuous → `.sdd/research/<key>/` from curated best-practices catalog |
| Demo pack | Step 10 → `.sdd/evidence/<key>/latest/demo/` for PO/BO/QA |
| Trigger | Explicit run (`triggers.watch` default `false`) |
| Tags | `@api` → Spec/API track; `@ui`/`@e2e` → Playwright when supported |
| Loop cap | 3 diagnose→implement iterations; on cap → report; point to specs if requirement gaps |
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
