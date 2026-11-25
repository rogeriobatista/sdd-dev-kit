---
name: sdd
description: >-
  Spec-Driven Development Protocol Kit. Use when the user invokes /sdd, asks to
  init SDD, run the SDD pipeline from natural-language specs, import a Linear or
  Jira ticket into specs, verify Cucumber/ Playwright, or check SDD status.
  Subcommands: init | from-ticket | run | verify | demo | status.
---

# /sdd — Spec-Driven Development

Protocol Kit orchestration for **Cursor**. The human edits **only** `specs/*.md` (prosa + Dado/Quando/Então) and optionally `.sdd/premises.md`. Everything else is generated or agent-owned.

Ticket import (`/sdd from-ticket`) is a **bootstrap**: it drafts `specs/` from Linear or Jira. After import, the human may still edit `specs/` (still the only human surface) before `/sdd run`.

## Cursor command map

| Intent | Invoke |
|--------|--------|
| Init | `/sdd init` |
| From ticket | `/sdd from-ticket <id>` (`linear:` / `jira:` prefix; optional `--run`) |
| Run pipeline | `/sdd run` |
| Verify only | `/sdd verify` |
| Demo (PO/BO/QA) | `/sdd demo` (optional run id) |
| Status | `/sdd status` |

When the user says these commands, follow the shared protocol below (same phases as Claude and Copilot adapters).

## Human vs agent ownership

### Human-owned (edit freely)

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them

### Agent-owned / regenerable (do not ask the human to edit)

- Generated tests for the active stack (`tests/features/**`, `tests/steps/**`, `tests/e2e/**`, `tests/test_*.py`, `tests/*.tftest.hcl`, `tests/unit/**`, …)
- `.sdd/canonical/**` — normalized scenarios
- `.sdd/plan/**` — SDD task plan
- `.sdd/runs/**` — run reports
- `.sdd/demo/**` — stakeholder demo packs from `/sdd demo` (HTML/MD/manifest + evidence)
- `.sdd/ticket.json` — provenance from from-ticket bootstrap
- `.sdd/stack.json` — stack detection provenance (agent-owned; human declares stack in premises/specs)
- Production code under the SDD implement phase (agent implements to make tests pass)

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Suggest that the human manually fix generated features/steps/e2e to green the suite
- Put ticketing secrets on argv or in the repo; use env vars only

## Stack detection (from specification docs)

The stack adapter is identified from **specification documents**, not by inventing from application source heuristics as the primary signal.

### Authoritative order

1. **`.sdd/premises.md`** — `## Stack` section (preferred). Keywords/synonyms map to canonical ids (`python`/`pytest` → `python`, `react`/`vite` → `react-vite`, `graphql` → `node-graphql`, `terraform` → `terraform`, `typescript`/`ts` → `typescript`).
2. **`specs/**/*.md`** — YAML frontmatter `stack: <id>`, `@stack:<id>` tags, or a `## Stack` section.
3. **`.sdd/stack.json`** — optional machine-readable override / prior provenance (`{ stack, source, detectedAt }`). Not the only way to set stack.
4. **`sdd.yaml`** `adapter` / `adapters.stack` — **fallback** when premises/specs omit stack (**warn** in status).
5. **Last resort (weak):** `package.json` / `pyproject.toml` / `*.tf` — low confidence; still ask the human to declare stack in premises.

Use `@rogeriobatista/core` `detectStack(projectRoot)` → `{ stack, source, confidence, candidates, warnings, needsClarification }`.

### On init / run / from-ticket

1. **Read** premises + specs and call `detectStack` (or equivalent) **before** materialize/verify.
2. If stack is **missing or ambiguous** (`needsClarification`): **STOP**. Ask the human to declare a single stack in `.sdd/premises.md` under `## Stack`. **Do not invent** a stack.
3. After a clear detection: write/update `.sdd/stack.json` provenance via `writeStackProvenance`, and align `sdd.yaml` `adapter` with `alignSddYamlAdapter` when safe.
4. Status must report the resolved `adapter`, detection `source`, and any fallback warnings.

## Init — scaffold the project for SDD

1. **Detect or confirm the stack** from specification docs (see **Stack detection**):
   - Read `.sdd/premises.md` + `specs/**/*.md` first (`detectStack`).
   - If missing/ambiguous: **STOP** and ask the human to declare stack in `.sdd/premises.md` (`## Stack`). Do not invent.
   - Canonical ids: `typescript` (alias `ts`), `python`, `react-vite`, `node-graphql`, `terraform`.
   - Write `adapter:` in `sdd.yaml` (or `adapters.stack:`) and `.sdd/stack.json` provenance after confirmation.
2. Ensure folders appropriate to the stack:
   - Shared: `specs/`, `.sdd/` (premises, canonical, plan, runs, demo, stack.json), `src/` (or module root for Terraform)
   - TS / node-graphql: `tests/features`, `tests/steps`, and e2e when UI applies
   - python: `tests/`
   - react-vite: `tests/e2e` (+ optional `tests/unit`)
   - terraform: `tests/` for `*.tftest.hcl`
3. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`). Set **stack-specific `runners`** (see adapter README). Optionally include a commented `ticketing:` section for Linear/Jira.
4. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing — **declare Stack explicitly** (adapter id + tech) so detection is demonstrable.
5. Scaffold via the matching package (`@rogeriobatista/adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, or `adapter-terraform`) or copy from `examples/`.
6. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
7. Do **not** overwrite existing human specs.

Report the tree, the chosen `adapter` (and detection `source`), and tell the user: edit `specs/`, or run from-ticket, then run the full pipeline.

## From-ticket — bootstrap NL specs from Linear or Jira

Bootstrap NL specs from a **Linear** or **Jira** ticket, then optionally continue with the full pipeline.

### Usage (host-agnostic intents)

- `from-ticket ENG-123` — auto-detect when possible; for ambiguous `KEY-123` use `sdd.yaml` `ticketing.defaultProvider` or a prefix
- `from-ticket linear:ENG-123` or `from-ticket jira:SHOP-7`
- `from-ticket ENG-123 --run` — after writing the draft, continue with the full pipeline run

### Steps

0. **Confirm stack** via stack detection (premises + specs) before or as part of continuing into `--run`. If stack is missing/ambiguous, STOP and ask the human to declare it in `.sdd/premises.md` before materialize/verify.
1. Read `sdd.yaml` `ticketing` (provider configs = **env var names only**, never secrets on argv).
2. Resolve provider:
   - UUID → Linear
   - `linear:` / `jira:` prefix → that provider
   - Ambiguous `KEY-123` → `ticketing.defaultProvider`, else ask the human
3. Fetch via `@rogeriobatista/core` (`fromTicket` / `LinearProvider` / `JiraProvider`):
   - Linear: `LINEAR_API_KEY` (GraphQL)
   - Jira: `JIRA_BASE_URL` + `JIRA_API_TOKEN` (+ `JIRA_EMAIL` for Cloud basic auth; Bearer if email unset)
4. Map title/description/acceptance criteria/labels → Portuguese NL draft (`## Intenção` + `## Cenários` with `Dado`/`Quando`/`Então`).
5. Write `specs/<id>-<slug>.md` and provenance `.sdd/ticket.json`.
6. **Default:** stop and ask the human to review/edit `specs/` (enrich weak AC). **With `--run`:** continue into the full pipeline.

### Hard rules for from-ticket

- Do **not** invent acceptance criteria or business rules that are not in the ticket.
- If the ticket lacks testable scenarios, ask the human to enrich `specs/` before run — do not fabricate GWT.
- Never print API tokens or put secrets on the command line; use environment variables only.
- Prefer the core helpers (`fromTicket`, providers) over ad-hoc HTTP when available in the workspace.

### Ticketing access by host

- **Cursor / Claude:** prefer MCP Linear/Jira tools when configured; otherwise use core REST/GraphQL providers with env vars.
- **GitHub Copilot (VS Code):** MCP may be unavailable or limited — use `@rogeriobatista/core` providers / REST with env vars (`LINEAR_API_KEY`, `JIRA_*`). Document env setup; never put secrets in chat or repo files.

## Pipeline phases (run)

Execute the full pipeline. Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3).

**Before normalize/executable:** run **stack detection** (`detectStack` on premises + specs). If missing/ambiguous, **STOP** and ask the human to declare stack in `.sdd/premises.md`. After a clear result, update `.sdd/stack.json` and align `sdd.yaml` `adapter` when safe. Prefer the detected stack over a stale hard-coded yaml-only choice; if falling back to `sdd.yaml`, warn in status.

### 1. normalize

- Read all `specs/*.md` (ignore `_example.md` unless it is the only content and user intends to use it).
- Read `.sdd/premises.md`.
- Produce `.sdd/canonical/*.json` with stable scenario ids, Portuguese steps (`Dado`/`Quando`/`Então`/`E`), and tags.
- **If ambiguous:** stop. Ask the human to clarify in `specs/`. Do **not** invent business rules.

### 2. executable

Materialize from canonical using the stack adapter (regenerate freely; never ask the human to edit these files):

| Adapter | Materialize target |
|---------|-------------------|
| `typescript` / `ts` | `@api` → Cucumber features/steps; `@ui`/`@e2e` → Playwright |
| `python` | pytest stubs under `tests/test_*.py` |
| `react-vite` | `@ui`/`@e2e` → Playwright; `@api` → optional Vitest unit stubs |
| `node-graphql` | `@api` → Cucumber + Vitest GraphQL stubs |
| `terraform` | `tests/*.tftest.hcl` with GWT comments / assert stubs |

### 3. plan

- Write `.sdd/plan/` with small, ordered, testable tasks under premises constraints.

### 4. implement

- Implement production code (and complete step stubs only when needed) so red tests can go green.
- Follow TDD: keep tests as the source of truth; do not weaken assertions to pass.

### 5. verify

- Run commands from `sdd.yaml` `runners` — **keys differ by adapter** (`cucumber`/`playwright`, `pytest`, `vitest`, `fmt`/`validate`/`terraform`, or `all`).
- Terraform verify must **not** require cloud credentials (fmt / validate / `terraform test` only — no apply).
- Persist structured results under `.sdd/runs/<id>/`.

### 6. diagnose (on failure)

- Fix implementation against failing tests only.
- If the **spec** is wrong, stop and ask the human to edit `specs/` — do not silently change specs.
- Loop back to implement until green or iteration cap.

### 7. report

- Summarize pass/fail, remaining failures, and paths to reports.
- Optionally remind the human they can run **demo** to build a stakeholder pack from this verify evidence.

## Verify (tests only)

Run `runners.all` (or the stack-specific runner the user names). Do not normalize or implement.

## Demo (after verify)

Build a PO/BO/QA demo pack from the latest (or named) run evidence via `@rogeriobatista/core` `buildDemo({ projectRoot, runId? })` → `.sdd/demo/<runId>/` (`index.html`, `SUMMARY.md`, `manifest.json`). Full procedure is in the **Demo** section. Not part of the automatic run loop; invoke explicitly (`demo` / `/sdd demo` / `SDD: demo`).

## Status

Read the latest `.sdd/runs/*` (and plan/canonical/ticket/demo presence). Report phase statuses, last exit codes, **adapter id + detection source** (premises / specs / stack.json / sdd.yaml fallback), any stack warnings, and whether `.sdd/ticket.json` / `.sdd/stack.json` / `.sdd/demo/` exist.

## Demo (stakeholder pack from test evidence)

After **verify** (green or red), build a presentable demo pack for **PO / BO / QA** from run evidence + business wording in specs/canonical.

### Usage (host-agnostic)

- `demo` — use the latest `.sdd/runs/<id>/`
- `demo <runId>` — use a specific run folder
- Cursor: `/sdd demo` · Claude / Copilot: `SDD: demo`

### Steps

1. Resolve the run id (latest under `.sdd/runs/`, or the id the human named).
2. Call `@rogeriobatista/core` `buildDemo({ projectRoot, runId? })` (preferred) — or equivalent: collect evidence, map scenarios, write the pack.
3. Report the output paths to the human (open `index.html` in a browser; paste `SUMMARY.md` into Slack/email).

### Output (agent-owned)

`.sdd/demo/<runId>/`:

| File | Role |
|------|------|
| `index.html` | Offline-friendly narrative page in **Portuguese** (intent, scenarios as business language, pass/fail, embeds/links to screenshots/videos) |
| `SUMMARY.md` | Same story in markdown for Slack/email |
| `manifest.json` | Machine-readable evidence list |
| `evidence/` | Copied reports/media so the pack is portable |

### Inputs (graceful if missing)

- `.sdd/runs/<id>/report.json` (or `run.json`)
- Stack evidence (see adapter READMEs): Playwright `playwright-report/` + `test-results/`, Cucumber `reports/cucumber.json`, pytest `reports/junit.xml`, Vitest JSON, Terraform test log
- `.sdd/canonical/**` and/or `specs/**/*.md` for intention + Dado/Quando/Então wording

Missing evidence is OK — still produce the narrative from the run report + specs. Never block demo on a red verify.

### Audience rules

- **PO / BO / QA** — business language from specs; **no code dumps**, no IDE required
- Portuguese stakeholder copy by default
- **No secrets** in demo output (scrub tokens/keys from stderr snippets)
- Keep the pack **offline-friendly** (relative paths)

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit generated tests, plan, canonical, or production code for the happy path.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags (default TS/UI stacks): `@api` → API/Cucumber/pytest track; `@ui`/`@e2e` → Playwright when the adapter supports UI.
- Stack adapters are first-class: `typescript` | `python` | `react-vite` | `node-graphql` | `terraform` (alias `ts` → `typescript`).
- **Stack comes from specification docs** (premises → specs → optional stack.json / sdd.yaml fallback). If missing/ambiguous: stop and ask the human — never invent a stack from app source as the primary signal.
- Terraform verify: no cloud apply / no secrets required for default runners.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status / demo) — not file watch.
- Demo packs (`.sdd/demo/`) are for PO/BO/QA: Portuguese business language from specs, no code dumps, no secrets, offline-relative paths.

## Template locations in this kit

- Shared source: `packages/adapter-shared/content/` (pipeline, from-ticket, human boundary, hard rules)
- Shared scaffold: `packages/adapter-shared/templates/` (`sdd.yaml`, `specs/_example.md`, `.sdd/premises.md`)
- Stack adapters: `adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, `adapter-terraform`
- Examples: `coupon-checkout/`, `python-pytest-hello/`, `react-vite-playwright/`, `node-graphql-api/`, `terraform-module/`
- Offline ticket fixture: `packages/core/src/ticketing/fixtures/`

