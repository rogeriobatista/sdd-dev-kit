---
name: sdd
description: >-
  Spec-Driven Development Protocol Kit. Use when the user asks for SDD init,
  from-ticket, run, research, verify, demo, or status — including natural-language
  intents like "SDD: run" or "import ticket ENG-42 into specs".
---

# SDD — Spec-Driven Development (Claude)

Protocol Kit orchestration for **Claude Code / Claude in VS Code**. Same contract as Cursor and Copilot: human iterates only on `specs/` (step 1); after specs are accepted, `SDD: run` automates steps 2–10 until all test levels pass (no mid-loop human code fixes). Step 11 = continuous best practices.

## Claude command map (natural-language intents)

| Intent | Say / invoke |
|--------|----------------|
| Init | `SDD: init` or "scaffold this project for SDD" |
| From ticket | `SDD: from-ticket ENG-42` / `linear:ENG-42` / `jira:SHOP-7` (optional `--run`) |
| Run pipeline | `SDD: run` |
| Research (best practices) | `SDD: research` (step 11 continuous; also standalone) |
| Verify only | `SDD: verify` |
| Demo (PO/BO/QA) | `SDD: demo` (optional run id) |
| Status | `SDD: status` |

You may also treat `/sdd <subcommand>` the same way when the user types it.
On `run` / docs / `implement` / `research`: open the best-practices catalog for the detected stack **plus security**; cite sources in Dev Spec / Implementation Plan / Design Approach.

## Human vs agent ownership

### Human-owned (edit freely) — **only human iteration surface**

- `specs/**/*.md` — natural-language scenarios (prosa + Dado/Quando/Então/E); create/adjust acceptance here (canonical **step 1**)
- `.sdd/premises.md` — project rules (stack, tags, style) when the human chooses to change them
- Optional: review that generated Spec Tests match intent — if not, fix `specs/` and re-run materialize; do **not** hand-edit generated tests to green

### Agent-owned / regenerable (do not ask the human to edit)

- Executable Spec Tests (`tests/features/**`, `tests/spec/**`, `tests/steps/**`, `tests/test_*.py`, `tests/*.tftest.hcl`, …) — **step 2**
- `.sdd/dev-spec.md` — Dev Spec — **step 3**
- `.sdd/implementation-plan.md` — Dev Implementation Plan — **step 4** (legacy `.sdd/plan/**` optional)
- `.sdd/design-approach.md` — Design & Approach — **step 5**
- `tests/unit/**` — unit tests — **step 6**
- `tests/integration/**` — integration tests — **step 7**
- `tests/e2e/**` — e2e tests — **step 8**
- `.sdd/canonical/**` — normalized scenarios (supports step 2)
- `.sdd/research/**` — best-practices research packs (`BEST_PRACTICES.md`, `sources.json`) — **step 11 support**
- `.sdd/runs/**` — run reports (internal; linked from evidence meta)
- `.sdd/evidence/**` — stakeholder evidence packs keyed by ticket / stable id (`latest/demo/` is the PO/BO/QA path) — **step 10**
- `.sdd/evidence-id.json` — stable local evidence id when no ticket
- `.sdd/demo/**` — legacy per-run demo copies (prefer `.sdd/evidence/<key>/latest/demo/`)
- `.sdd/ticket.json` — provenance from from-ticket bootstrap (includes `evidenceKey` / `evidencePath`)
- `.sdd/stack.json` — stack detection provenance (agent-owned; human declares stack in premises/specs)
- Production code under the SDD implement loop (**step 9**)

### Agent must not

- Edit `specs/` without an explicit human request — **except** writing a draft via from-ticket bootstrap
- Invent business rules or acceptance criteria missing from the ticket/specs — stop and ask for a specs change
- Suggest that the human manually fix generated Spec/unit/integration/e2e tests or production code to green the suite
- Stop the `/sdd run` auto-loop mid-way to ask the human to fix implementation — keep diagnose→implement→verify until all test levels pass or cap; only exit early for **spec** gaps
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
2. Ensure folders appropriate to the stack (canonical 11-step layout):
   - Shared: `specs/`, `.sdd/` (premises, canonical, research, runs, evidence, demo, stack.json, empty `dev-spec.md` / `implementation-plan.md` / `design-approach.md`), `src/` (or module root for Terraform)
   - Test layers: `tests/unit/`, `tests/integration/`, `tests/e2e/` (create even if a stack fills them later)
   - Spec Tests: TS / node-graphql → `tests/features` + `tests/steps` (or `tests/spec` when configured); python → `tests/`; react-vite → e2e (+ unit); terraform → `tests/` for `*.tftest.hcl`
3. Write `sdd.yaml` from kit defaults if missing (`triggers.watch: false`, `loop.maxDiagnoseIterations: 3`). Set **stack-specific `runners`** including layer keys when available (`spec`/`cucumber`, `unit`, `integration`, `e2e`/`playwright`, or `all`). Optionally include a commented `ticketing:` section for Linear/Jira.
4. Write `.sdd/premises.md` and `specs/_example.md` from shared templates if missing — **declare Stack explicitly** (adapter id + tech) so detection is demonstrable. Mention the three test layers (unit / integration / e2e) plus Spec Tests.
5. Scaffold via the matching package (`@rogeriobatista/adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, or `adapter-terraform`) or copy from `examples/`.
6. Install the **host adapter** instruction files for this project (Cursor skill/rules, Claude `CLAUDE.md` + `.claude/skills`, or Copilot `.github/copilot-instructions.md` + prompts) — do not overwrite existing human specs.
7. Do **not** overwrite existing human specs.

Report the tree, the chosen `adapter` (and detection `source`), and tell the user: edit `specs/` (the **only human iteration surface** / step 1), or run from-ticket and pause for spec review, then `/sdd run` / `SDD: run` for the **automated steps 2–10** (spec-tests → … → evidence; step 11 = continuous best practices) until all test levels pass.

## From-ticket — bootstrap NL specs from Linear or Jira

Bootstrap NL specs from a **Linear** or **Jira** ticket, then **pause for human spec iteration** (the only human gate) before the automated `/sdd run` loop — unless `--run` and the draft specs are already complete enough to enter the auto-loop.

### Usage (host-agnostic intents)

- `from-ticket ENG-123` — auto-detect when possible; for ambiguous `KEY-123` use `sdd.yaml` `ticketing.defaultProvider` or a prefix
- `from-ticket linear:ENG-123` or `from-ticket jira:SHOP-7`
- `from-ticket ENG-123 --run` — after writing the draft, continue into the full auto-loop **only if** specs are complete/testable; otherwise still pause for human enrichment

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
6. **Default:** stop and ask the human to review/edit `specs/` (enrich weak AC) — this is the **human iteration surface**. **With `--run`:** if specs are already complete/testable, enter the automated run loop; if not, still pause for human enrichment first.

### Hard rules for from-ticket

- Do **not** invent acceptance criteria or business rules that are not in the ticket.
- If the ticket lacks testable scenarios, ask the human to enrich `specs/` before run — do not fabricate GWT.
- Never print API tokens or put secrets on the command line; use environment variables only.
- Prefer the core helpers (`fromTicket`, providers) over ad-hoc HTTP when available in the workspace.

### Ticketing access by host

- **Cursor / Claude:** prefer MCP Linear/Jira tools when configured; otherwise use core REST/GraphQL providers with env vars.
- **GitHub Copilot (VS Code):** MCP may be unavailable or limited — use `@rogeriobatista/core` providers / REST with env vars (`LINEAR_API_KEY`, `JIRA_*`). Document env setup; never put secrets in chat or repo files.

## Pipeline phases (run) — canonical 11-step flow

**Lock this order.** Step 1 is the only human iteration gate. Steps 2–10 run automatically in `/sdd run` / `SDD: run` after specs are accepted. Step 11 is continuous policy (not a separate stop).

| Step | Actor | Action | Artifact |
|------|-------|--------|----------|
| 1 | **Human** | Natural language mixed with BDD (Cucumber-style) | `specs/` |
| 2 | Kit | Create **executable Spec Tests** validating the described rules | `tests/spec/` or `tests/features/` (per stack / `sdd.yaml`) |
| 3 | Kit | Create **Dev Spec** document for the implementation | `.sdd/dev-spec.md` |
| 4 | Kit | Create **Dev Implementation Plan** document | `.sdd/implementation-plan.md` |
| 5 | Kit | Create **Design & Approach** definitions | `.sdd/design-approach.md` |
| 6 | Kit | Create **unit tests** | `tests/unit/` |
| 7 | Kit | Create **integration tests** | `tests/integration/` |
| 8 | Kit | Create **e2e tests** | `tests/e2e/` |
| 9 | Kit | Develop in a loop until **all test levels** pass (spec + unit + integration + e2e) | `src/` + `.sdd/runs/` |
| 10 | Kit | Create **evidence** proving the ask was met | `.sdd/evidence/<key>/latest/` |
| 11 | Kit | **During all steps:** any doubt → market best practices | `.sdd/research/<key>/` |

**Human iteration surface (ONLY):** creating/adjusting NL specs in `specs/` (and clarifying acceptance). Optional review that generated Spec Tests match intent — if they do not, fix `specs/` and re-materialize; **never** hand-patch generated tests or production code to green the suite.

**Automated loop (no human mid-loop):** after specs are accepted/written, `/sdd run` / `SDD: run` runs steps 2→10:

```text
detect stack → spec-tests → dev-spec → implementation-plan → design-approach
  → unit-tests → integration-tests → e2e-tests
  → implement → verify (all layers) ⇄ diagnose*
  → evidence
```

Cap diagnose→implement at `loop.maxDiagnoseIterations` (default 3). Do **not** stop mid-loop to ask the human to fix code. If failures look like **wrong/ambiguous specs**, exit the loop and ask the human to iterate on `specs/` (the only human gate).

**Before step 2:** run **stack detection** (`detectStack` on premises + specs). If missing/ambiguous, **STOP** and ask the human to declare stack in `.sdd/premises.md`. After a clear result, update `.sdd/stack.json` and align `sdd.yaml` `adapter` when safe. Prefer the detected stack over a stale hard-coded yaml-only choice; if falling back to `sdd.yaml`, warn in status.

**Step 11 (continuous):** open the best-practices catalog + write/update `.sdd/research/<key>/` whenever there is doubt during steps 2–10. Premises win on conflict. Full procedure: **Research (best practices)**. Optional standalone: `research` / `/sdd research` / `SDD: research`.

### 2. spec-tests

Normalize `specs/` into `.sdd/canonical/*.json` (stable ids, Portuguese `Dado`/`Quando`/`Então`/`E`, tags), then materialize **executable Spec Tests** with the stack adapter (regenerate freely; never ask the human to edit these files to green the suite):

| Adapter | Spec Tests target |
|---------|-------------------|
| `typescript` / `ts` | `@api` → Cucumber under `tests/features` (or `tests/spec` if configured); `@ui`/`@e2e` also inform step 8 |
| `python` | pytest stubs under `tests/` / Spec layer as configured |
| `react-vite` | Spec/API stubs as tagged; UI primarily step 8 Playwright |
| `node-graphql` | `@api` → Cucumber + Vitest GraphQL stubs |
| `terraform` | `tests/*.tftest.hcl` with GWT comments / assert stubs |

**If ambiguous:** stop the auto-loop. Ask the human to clarify in `specs/`. Do **not** invent business rules.

### 3. dev-spec

Write `.sdd/dev-spec.md` — technical Dev Spec derived from accepted `specs/` + premises (scope, interfaces, constraints). Agent-owned; regenerate freely. Cite research sources when applying market practices.

### 4. implementation-plan

Write `.sdd/implementation-plan.md` — ordered, testable implementation tasks under premises constraints. Each task that applies a market practice **must cite** a research/`sources.json` id or URL (or an explicit premises override). Legacy `.sdd/plan/` may mirror tasks; the stable artifact name is `implementation-plan.md`.

### 5. design-approach

Write `.sdd/design-approach.md` — Design & Approach definitions (architecture choices, patterns, trade-offs) for the implementation. Premises win on conflict with catalog practices.

### 6. unit-tests

Create/update **unit tests** under `tests/unit/` (or the path in `sdd.yaml` `paths.unit`). Do not ask the human to edit these to green the suite.

### 7. integration-tests

Create/update **integration tests** under `tests/integration/` (or `paths.integration`).

### 8. e2e-tests

Create/update **e2e tests** under `tests/e2e/` (Playwright etc. when the adapter supports UI). Terraform / headless stacks may use stack-appropriate e2e equivalents or skip when not applicable — note it in the run report.

### 9. implement → verify → diagnose (loop)

- **implement:** production code (and complete step stubs only when needed) so red tests can go green. Follow TDD; do not weaken assertions. Follow research + premises.
- **verify:** run commands from `sdd.yaml` `runners` covering **all test levels** when present: `spec` (or `cucumber`), `unit`, `integration`, `e2e` (or `playwright`), or `runners.all`. Keys differ by adapter (`pytest`, `vitest`, `fmt`/`validate`/`terraform`, …). Terraform verify must **not** require cloud credentials (fmt / validate / `terraform test` only — no apply). Persist structured results under `.sdd/runs/<id>/`.
- **diagnose (on failure):** fix **implementation** against failing tests only; loop back to implement → verify. **Do not** ask the human to fix code mid-loop. If the **spec** is wrong/ambiguous, **exit the loop** and ask the human to edit `specs/`. Continue until green or `loop.maxDiagnoseIterations` (default 3).

### 10. evidence

- Summarize pass/fail, remaining failures, and paths to reports under `.sdd/runs/`.
- Update the stakeholder evidence pack via `updateEvidencePack` / `buildDemo` → `.sdd/evidence/<key>/latest/` (demo under `latest/demo/`).
- **Cap exceeded:** write the run report. If failures look like requirement gaps, point the human back to `specs/`. Otherwise report remaining test failures for the next auto-loop after any needed spec fix.

## Verify (tests only)

Run `runners.all` (or named layer keys: `spec`, `unit`, `integration`, `e2e`, or stack-specific names). Do not rewrite specs or implement.

## Demo (after evidence)

Build a PO/BO/QA demo pack from the latest (or named) run evidence via `@rogeriobatista/core` `buildDemo({ projectRoot, runId?, evidenceKey? })` → `.sdd/evidence/<key>/latest/demo/` (`index.html`, `SUMMARY.md`, `manifest.json`). Key comes from ticket / `evidence.key` / stable local id. Full procedure is in the **Demo** section. Runs as part of / after step 10 — not mid-loop for steps 2–8; invoke explicitly (`demo` / `/sdd demo` / `SDD: demo`) when refreshing the pack. After verify, prefer calling `updateEvidencePack` so `latest/raw` stays current even before demo.

## Status

Read the latest `.sdd/runs/*` and presence of `dev-spec.md` / `implementation-plan.md` / `design-approach.md` / canonical / ticket / evidence / research / test layers. Report phase statuses (steps 1–11), last exit codes, **adapter id + detection source**, any stack warnings, resolved `evidenceKey`, and research catalog citations when present.

## Research (best practices)

Consult **market / standards best practices** for the detected stack whenever there is doubt during the pipeline (**canonical step 11 — continuous policy**, not a separate stop). Do **not** invent “best practice” claims without a catalog/source citation or an explicit `.sdd/premises.md` override.

### When to run

| Trigger | Behavior |
|---------|----------|
| `/sdd run` / `SDD: run` | **Continuous** during steps 2–10 (especially before/while writing Dev Spec, Implementation Plan, Design Approach, tests, and implement). Refresh the research pack when sources change or doubt arises |
| `/sdd research` / `SDD: research` | **Optional standalone** — refresh research pack without running the full pipeline |
| `dev-spec` / `implementation-plan` / `design-approach` / `implement` | Must open research output (or run research first if missing) |

### Steps

1. **Confirm stack** via stack detection (premises → specs → stack.json / sdd.yaml). If missing/ambiguous, STOP — do not research against an invented stack.
2. **Resolve evidence key** with `@rogeriobatista/core` `resolveEvidenceKey(projectRoot)` (ticket / `evidence.key` / stable local id). Encode path segments the same way as evidence packs (`:` → `_`).
3. **Open the catalog** for this kit:
   - `packages/adapter-shared/content/best-practices-catalog.md` (and/or `.json`)
   - In an installed project, prefer the copy shipped with the host adapter / skill path, or the workspace kit path when developing the kit itself.
4. **Select domains:** stack-mapped section(s) **plus Security (always)**.
5. **Consult sources:** Prefer MCP **WebSearch** / fetch of the official catalog URLs when available. Otherwise use the curated catalog URLs and short guidance as-is. Do **not** scrape paywalled or copyrighted full documents into the repo.
6. **Write agent-owned outputs** under `.sdd/research/<encodedEvidenceKey>/`:
   - `BEST_PRACTICES.md` — stakeholder-friendly summary (Portuguese OK) of practices **applied** to this work, conflicts with premises, and source citations
   - `sources.json` — machine list of `{ id, url, title, domain, applied: true|false, note? }` plus `catalogVersion`, `stack`, `evidenceKey`, `researchedAt`
7. **Cite in docs/tasks:** every Dev Spec / Implementation Plan / Design Approach item that relies on a practice must reference a source `id` or URL from `sources.json` / the catalog. Premises overrides must be noted as such.
8. **Conflicts:** if a catalog practice conflicts with `.sdd/premises.md`, **premises win**. Record the conflict in `BEST_PRACTICES.md` (do not silently ignore premises).

### Output layout

```
.sdd/research/<encodedEvidenceKey>/
  BEST_PRACTICES.md
  sources.json
```

Example key `linear:ENG-42` → `.sdd/research/linear_ENG-42/`.

### `sources.json` shape (minimum)

```json
{
  "catalogVersion": 1,
  "stack": "react-vite",
  "evidenceKey": "linear:ENG-42",
  "researchedAt": "2026-11-25T22:00:00.000Z",
  "sources": [
    {
      "id": "fe-playwright",
      "url": "https://playwright.dev/docs/best-practices",
      "title": "Playwright best practices",
      "domain": "frontend",
      "applied": true,
      "note": "Role/label locators for checkout CTA"
    }
  ],
  "premisesConflicts": []
}
```

### Hard rules for research

- Links + short applied guidance only — **no** pasting substantial copyrighted doc text into the repo.
- No secrets in research output.
- Quality over quantity: stick to the curated catalog; add an extra official URL only when the catalog lacks a needed topic, and still record it in `sources.json`.
- Inventing uncited practices is forbidden.

## Demo (stakeholder pack from test evidence)

After **verify** (green or red), build a presentable demo pack for **PO / BO / QA** from run evidence + business wording in specs/canonical.

Evidence is keyed by the **Jira/Linear task id** (or a stable local id when there is no ticket) so the **same pack is updated in place** as development progresses.

### Usage (host-agnostic)

- `demo` — use the latest `.sdd/runs/<id>/` and update the evidence pack for the resolved key
- `demo <runId>` — use a specific run folder
- `demo --id <key>` — override the evidence key (also: `sdd.yaml` `evidence.key`)
- Cursor: `/sdd demo` · Claude / Copilot: `SDD: demo`

### Evidence key (`evidenceKey`)

| Source (priority) | Example key | On-disk folder |
|-------------------|-------------|----------------|
| CLI `--id` / `buildDemo({ evidenceKey })` | `linear:ENG-42` | `.sdd/evidence/linear_ENG-42/` |
| `sdd.yaml` `evidence.key` | `jira:SHOP-7` | `.sdd/evidence/jira_SHOP-7/` |
| `.sdd/ticket.json` (from-ticket) | `linear:ENG-42` | `.sdd/evidence/linear_ENG-42/` |
| Auto `.sdd/evidence-id.json` (once) | `local:<uuid>` | `.sdd/evidence/local_<uuid>/` |

Colon in the logical key is encoded as `_` in path segments (Windows-safe).

### Steps

1. Resolve the run id (latest under `.sdd/runs/`, or the id the human named).
2. Resolve `evidenceKey` via `@rogeriobatista/core` `resolveEvidenceKey(projectRoot)` (or pass `--id`).
3. Call `buildDemo({ projectRoot, runId?, evidenceKey? })` — writes/updates the pack and calls `updateEvidencePack`.
4. Report the **stable stakeholder path** (same path updates over time).

### Output (agent-owned) — open this

**PO / BO / QA always open:**

`.sdd/evidence/<encodedKey>/latest/demo/index.html`

Layout (updated in place):

```
.sdd/evidence/<encodedKey>/
  meta.json          # ticket url/title, updatedAt, lastRunId, status, runPath
  latest/
    run-report.json
    demo/            # index.html, SUMMARY.md, manifest.json, evidence/
    raw/             # copied cucumber/playwright/pytest artifacts from last verify
  history/           # optional last N run snapshots by runId
```

Internal runs stay under `.sdd/runs/<runId>/` and are linked from `meta.json`. A legacy copy may also exist under `.sdd/demo/<runId>/` — prefer the evidence path above.

### Core API

- `resolveEvidenceKey(projectRoot)` → `{ evidenceKey, source, evidencePath, … }`
- `updateEvidencePack({ projectRoot, runId, evidenceKey? })` — called from `buildDemo` and verify post-hooks
- `buildDemo({ projectRoot, runId?, evidenceKey? })`

### Inputs (graceful if missing)

- `.sdd/runs/<id>/report.json` (or `run.json`)
- Stack evidence (see adapter READMEs): Playwright `playwright-report/` + `test-results/`, Cucumber `reports/cucumber.json`, pytest `reports/junit.xml`, Vitest JSON, Terraform test log
- `.sdd/canonical/**` and/or `specs/**/*.md` for intention + Dado/Quando/Então wording

Missing evidence is OK — still produce the narrative from the run report + specs. Never block demo on a red verify.

### Audience rules

- **PO / BO / QA** — business language from specs; **no code dumps**, no IDE required
- Portuguese stakeholder copy by default
- **No secrets** in demo/evidence output (scrub tokens/keys from stderr snippets)
- Keep the pack **offline-friendly** (relative paths)

## Hard rules

- **Never** edit `specs/` unless the human explicitly asks — **exception:** from-ticket may write a **draft** spec from the ticket (bootstrap only).
- **Never** ask the human to edit generated tests, Dev Spec, implementation plan, design approach, canonical, or production code for the happy path.
- **Human iteration surface (ONLY):** `specs/` (+ clarifying acceptance; optional review that Spec Tests match intent). Steps 2–10 of `/sdd run` are an **automated loop** until all test levels pass or the diagnose cap — do **not** stop mid-loop to ask the human to fix code.
- If failures look like **wrong/ambiguous specs**, exit the auto-loop and ask the human to iterate on `specs/` — the only human gate.
- Specs language: Portuguese keywords `Dado`, `Quando`, `Então`, `E`.
- Tags (default TS/UI stacks): `@api` → API/Cucumber/pytest Spec track; `@ui`/`@e2e` → Playwright when the adapter supports UI.
- Stack adapters are first-class: `typescript` | `python` | `react-vite` | `node-graphql` | `terraform` (alias `ts` → `typescript`).
- **Stack comes from specification docs** (premises → specs → optional stack.json / sdd.yaml fallback). If missing/ambiguous: stop and ask the human — never invent a stack from app source as the primary signal.
- Terraform verify: no cloud apply / no secrets required for default runners.
- Watch is **out of MVP**; ignore enabling watch unless the human explicitly requests post-MVP work.
- Ticketing secrets: env vars only (`LINEAR_API_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`).
- Pipeline trigger is explicit (init / from-ticket / run / verify / status / demo) — not file watch.
- Canonical artifacts: Spec Tests under `tests/features` or `tests/spec`; Dev Spec / Implementation Plan / Design Approach under `.sdd/dev-spec.md`, `.sdd/implementation-plan.md`, `.sdd/design-approach.md`; test layers `tests/unit/`, `tests/integration/`, `tests/e2e/`; evidence under `.sdd/evidence/<key>/latest/`.
- Evidence packs (`.sdd/evidence/<key>/latest/demo/`) are for PO/BO/QA: Portuguese business language from specs, no code dumps, no secrets, offline-relative paths. Same key updates in place as development progresses. Evidence/demo update is step 10 (after green or after the auto-loop ends with a report).
- **Research / best practices (step 11 — continuous):** during steps 2–10, open the curated catalog (`best-practices-catalog`) for the detected stack **plus security** whenever there is doubt. Cite sources in Dev Spec / Implementation Plan / Design Approach; do not invent uncited practices. Premises override catalog on conflict (note it). Links + short guidance only — no scraping copyrighted full docs into the repo.

## Template locations in this kit

- Shared source: `packages/adapter-shared/content/` (pipeline, research, from-ticket, human boundary, hard rules, best-practices catalog)
- Best-practices catalog: `packages/adapter-shared/content/best-practices-catalog.md` (+ `.json`)
- Shared scaffold: `packages/adapter-shared/templates/` (`sdd.yaml`, `specs/_example.md`, `.sdd/premises.md`, `.sdd/dev-spec.md`, `.sdd/implementation-plan.md`, `.sdd/design-approach.md`)
- Stack adapters: `adapter-ts`, `adapter-python`, `adapter-react-vite`, `adapter-node-graphql`, `adapter-terraform`
- Examples: `coupon-checkout/`, `python-pytest-hello/`, `react-vite-playwright/`, `node-graphql-api/`, `terraform-module/`
- Offline ticket fixture: `packages/core/src/ticketing/fixtures/`

